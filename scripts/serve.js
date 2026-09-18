const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5173;
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'images', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// In-Memory Rate Limiting for local preview server
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

function checkRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMins = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, message: `Too many failed attempts. Locked for ${remainingMins} minute(s).` };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + (15 * 60 * 1000); // 15 mins lock
    record.count = 0;
  }
  loginAttempts.set(ip, record);
}

function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// Magic byte validation helper
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return { valid: false, format: null, mime: null };

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A &&
    buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { valid: true, format: '.png', mime: 'image/png' };
  }

  // JPEG / JPG: FF D8 FF
  if (
    buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  ) {
    return { valid: true, format: '.jpg', mime: 'image/jpeg' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 &&
    buffer[2] === 0x46 && buffer[3] === 0x47 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 &&
    buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, format: '.webp', mime: 'image/webp' };
  }

  return { valid: false, format: null, mime: null };
}

// Helper: Hash password (matches Web Crypto / Cloudflare SubtleCrypto PBKDF2)
function hashPassword(password, salt) {
  const saltBuf = (typeof salt === 'string' && /^[0-9a-fA-F]{32,}$/.test(salt)) ? Buffer.from(salt, 'hex') : Buffer.from(String(salt));
  return crypto.pbkdf2Sync(password, saltBuf, 100000, 64, 'sha512').toString('hex');
}

// Helper: Read JSON Data File
function readData(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

// Helper: Write JSON Data File
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: Verify Auth Token
function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  const adminData = readData('admin.json', { sessions: [] });
  const session = (adminData.sessions || []).find(s => s.token === token);
  if (!session) return false;

  // Check expiry (7 days validity)
  if (Date.now() > session.expiresAt) {
    adminData.sessions = adminData.sessions.filter(s => s.token !== token);
    writeData('admin.json', adminData);
    return false;
  }

  return true;
}

// Helper: Send JSON Response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  res.end(JSON.stringify(data));
}

// Helper: Parse Body Buffer
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // =========================================================================
  // API ROUTING
  // =========================================================================
  if (pathname.startsWith('/api/')) {

    // 1. Auth API: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const rateLimit = checkRateLimit(clientIp);
      if (!rateLimit.allowed) {
        sendJSON(res, 429, { success: false, message: rateLimit.message });
        return;
      }

      try {
        const bodyBuf = await parseBody(req);
        const { username, password } = JSON.parse(bodyBuf.toString() || '{}');

        const adminData = readData('admin.json', {
          username: 'admin',
          salt: '8f92a3c7b4e1d6502938475610293847',
          passwordHash: 'e438ebcbf5e87d0579ebed59bc5c6347745d7405409a9eb9dc1ad4b39d2edf6c08664d37fb19afb5f31047641f562bc5f3cab160a67f9ba2ecfb47f8f85054b3',
          sessions: []
        });

        const computedHash = hashPassword((password || '').trim(), adminData.salt);
        const usernameMatch = (username || '').trim().toLowerCase() === adminData.username.toLowerCase();
        if (usernameMatch && computedHash === adminData.passwordHash) {
          resetLoginAttempts(clientIp);

          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

          if (!adminData.sessions) adminData.sessions = [];
          adminData.sessions = adminData.sessions.filter(s => s.expiresAt > Date.now());
          adminData.sessions.push({ token, createdAt: Date.now(), expiresAt });
          if (adminData.sessions.length > 20) adminData.sessions = adminData.sessions.slice(-20);
          writeData('admin.json', adminData);

          sendJSON(res, 200, {
            success: true,
            token,
            user: { username: adminData.username }
          });
        } else {
          recordFailedLogin(clientIp);
          sendJSON(res, 401, { success: false, message: 'Invalid username or password' });
        }
      } catch (err) {
        sendJSON(res, 400, { success: false, message: 'Invalid request body' });
      }
      return;
    }

    // 1. Auth API: Logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const adminData = readData('admin.json', { sessions: [] });
        adminData.sessions = (adminData.sessions || []).filter(s => s.token !== token);
        writeData('admin.json', adminData);
      }
      sendJSON(res, 200, { success: true, message: 'Logged out successfully' });
      return;
    }

    // 1. Auth API: Me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }
      const adminData = readData('admin.json', { username: 'admin' });
      sendJSON(res, 200, { success: true, user: { username: adminData.username } });
      return;
    }

    // 1. Auth API: Change Password
    if (pathname === '/api/auth/change-password' && req.method === 'POST') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }
      try {
        const bodyBuf = await parseBody(req);
        const { currentPassword, newPassword } = JSON.parse(bodyBuf.toString() || '{}');

        if (!newPassword || newPassword.length < 8) {
          sendJSON(res, 400, { success: false, message: 'New password must be at least 8 characters' });
          return;
        }

        const adminData = readData('admin.json');
        const currentHash = hashPassword(currentPassword || '', adminData.salt);
        if (currentHash !== adminData.passwordHash) {
          sendJSON(res, 400, { success: false, message: 'Current password is incorrect' });
          return;
        }

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = hashPassword(newPassword, newSalt);
        adminData.salt = newSalt;
        adminData.passwordHash = newHash;
        writeData('admin.json', adminData);

        sendJSON(res, 200, { success: true, message: 'Password updated successfully' });
      } catch (err) {
        sendJSON(res, 500, { success: false, message: 'Failed to update password' });
      }
      return;
    }

    // 2. Services CRUD API
    if (pathname === '/api/services' || pathname.startsWith('/api/services/')) {
      const idMatch = pathname.match(/^\/api\/services\/([a-zA-Z0-9_-]+)$/);
      const serviceId = idMatch ? idMatch[1] : null;

      if (req.method === 'GET') {
        const services = readData('services.json', []);
        sendJSON(res, 200, services);
        return;
      }

      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }

      const services = readData('services.json', []);

      if (req.method === 'POST') {
        try {
          const bodyBuf = await parseBody(req);
          const newService = JSON.parse(bodyBuf.toString() || '{}');
          if (!newService.title) {
            sendJSON(res, 400, { success: false, message: 'Service title is required' });
            return;
          }
          newService.id = newService.id || 'service-' + Date.now();
          newService.order = services.length + 1;
          services.push(newService);
          writeData('services.json', services);
          sendJSON(res, 201, { success: true, service: newService });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid service data' });
        }
        return;
      }

      if (req.method === 'PUT' && serviceId) {
        try {
          const bodyBuf = await parseBody(req);
          const updateData = JSON.parse(bodyBuf.toString() || '{}');
          const index = services.findIndex(s => s.id === serviceId);
          if (index === -1) {
            sendJSON(res, 404, { success: false, message: 'Service not found' });
            return;
          }
          services[index] = { ...services[index], ...updateData, id: serviceId };
          writeData('services.json', services);
          sendJSON(res, 200, { success: true, service: services[index] });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid update payload' });
        }
        return;
      }

      if (req.method === 'DELETE' && serviceId) {
        const filtered = services.filter(s => s.id !== serviceId);
        writeData('services.json', filtered);
        sendJSON(res, 200, { success: true, message: 'Service deleted successfully' });
        return;
      }
    }

    // 3. Gallery / Lookbook CRUD API
    if (pathname === '/api/gallery' || pathname.startsWith('/api/gallery/')) {
      const idMatch = pathname.match(/^\/api\/gallery\/([a-zA-Z0-9_-]+)$/);
      const galleryId = idMatch ? idMatch[1] : null;

      if (req.method === 'GET') {
        const gallery = readData('gallery.json', []);
        sendJSON(res, 200, gallery);
        return;
      }

      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }

      const gallery = readData('gallery.json', []);

      if (req.method === 'POST') {
        try {
          const bodyBuf = await parseBody(req);
          const newItem = JSON.parse(bodyBuf.toString() || '{}');
          if (!newItem.title || !newItem.image) {
            sendJSON(res, 400, { success: false, message: 'Title and image are required' });
            return;
          }
          newItem.id = newItem.id || 'gallery-' + Date.now();
          newItem.order = gallery.length + 1;
          gallery.push(newItem);
          writeData('gallery.json', gallery);
          sendJSON(res, 201, { success: true, item: newItem });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid gallery item data' });
        }
        return;
      }

      if (req.method === 'PUT' && galleryId) {
        try {
          const bodyBuf = await parseBody(req);
          const updateData = JSON.parse(bodyBuf.toString() || '{}');
          const index = gallery.findIndex(g => g.id === galleryId);
          if (index === -1) {
            sendJSON(res, 404, { success: false, message: 'Gallery item not found' });
            return;
          }
          gallery[index] = { ...gallery[index], ...updateData, id: galleryId };
          writeData('gallery.json', gallery);
          sendJSON(res, 200, { success: true, item: gallery[index] });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid update payload' });
        }
        return;
      }

      if (req.method === 'DELETE' && galleryId) {
        const filtered = gallery.filter(g => g.id !== galleryId);
        writeData('gallery.json', filtered);
        sendJSON(res, 200, { success: true, message: 'Gallery item deleted successfully' });
        return;
      }
    }

    // 4. Reviews CRUD API
    if (pathname === '/api/reviews' || pathname.startsWith('/api/reviews/')) {
      const idMatch = pathname.match(/^\/api\/reviews\/([a-zA-Z0-9_-]+)$/);
      const reviewId = idMatch ? idMatch[1] : null;

      if (req.method === 'GET') {
        const reviews = readData('reviews.json', []);
        sendJSON(res, 200, reviews);
        return;
      }

      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }

      const reviews = readData('reviews.json', []);

      if (req.method === 'POST') {
        try {
          const bodyBuf = await parseBody(req);
          const newReview = JSON.parse(bodyBuf.toString() || '{}');
          if (!newReview.authorName || !newReview.reviewText) {
            sendJSON(res, 400, { success: false, message: 'Author name and review text required' });
            return;
          }
          newReview.id = newReview.id || 'review-' + Date.now();
          newReview.order = reviews.length + 1;
          reviews.push(newReview);
          writeData('reviews.json', reviews);
          sendJSON(res, 201, { success: true, review: newReview });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid review data' });
        }
        return;
      }

      if (req.method === 'PUT' && reviewId) {
        try {
          const bodyBuf = await parseBody(req);
          const updateData = JSON.parse(bodyBuf.toString() || '{}');
          const index = reviews.findIndex(r => r.id === reviewId);
          if (index === -1) {
            sendJSON(res, 404, { success: false, message: 'Review not found' });
            return;
          }
          reviews[index] = { ...reviews[index], ...updateData, id: reviewId };
          writeData('reviews.json', reviews);
          sendJSON(res, 200, { success: true, review: reviews[index] });
        } catch (err) {
          sendJSON(res, 400, { success: false, message: 'Invalid update payload' });
        }
        return;
      }

      if (req.method === 'DELETE' && reviewId) {
        const filtered = reviews.filter(r => r.id !== reviewId);
        writeData('reviews.json', filtered);
        sendJSON(res, 200, { success: true, message: 'Review deleted successfully' });
        return;
      }
    }

    // 5. Image Upload API (with Magic Byte verification and size caps)
    if (pathname === '/api/upload' && req.method === 'POST') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }

      try {
        const contentType = req.headers['content-type'] || '';
        const bodyBuf = await parseBody(req);

        let fileBuffer;

        if (contentType.includes('application/json')) {
          const payload = JSON.parse(bodyBuf.toString() || '{}');
          if (!payload.data) {
            sendJSON(res, 400, { success: false, message: 'Missing base64 data' });
            return;
          }
          const match = payload.data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          fileBuffer = Buffer.from(match ? match[2] : payload.data, 'base64');
        } else if (contentType.includes('multipart/form-data')) {
          const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
          if (!boundary) {
            sendJSON(res, 400, { success: false, message: 'Invalid boundary' });
            return;
          }

          const rawStr = bodyBuf.toString('binary');
          const parts = rawStr.split('--' + boundary);
          for (const part of parts) {
            if (part.includes('filename="')) {
              const headerEnd = part.indexOf('\r\n\r\n');
              if (headerEnd !== -1) {
                const fileBinary = part.substring(headerEnd + 4, part.lastIndexOf('\r\n'));
                fileBuffer = Buffer.from(fileBinary, 'binary');
                break;
              }
            }
          }
        } else {
          fileBuffer = bodyBuf;
        }

        if (!fileBuffer || fileBuffer.length === 0) {
          sendJSON(res, 400, { success: false, message: 'No file received' });
          return;
        }

        if (fileBuffer.length > 5 * 1024 * 1024) {
          sendJSON(res, 413, { success: false, message: 'File size exceeds maximum 5 MB limit' });
          return;
        }

        // Validate image magic bytes
        const magic = validateImageMagicBytes(fileBuffer);
        if (!magic.valid) {
          sendJSON(res, 400, { success: false, message: 'Invalid file content. Only WebP, JPEG, and PNG are allowed.' });
          return;
        }

        const safeFilename = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${magic.format}`;
        const savePath = path.join(UPLOADS_DIR, safeFilename);
        fs.writeFileSync(savePath, fileBuffer);

        const publicUrl = `assets/images/uploads/${safeFilename}`;
        sendJSON(res, 200, { success: true, url: publicUrl });
      } catch (err) {
        console.error('Upload error:', err);
        sendJSON(res, 500, { success: false, message: 'Upload failed: ' + err.message });
      }
      return;
    }

    sendJSON(res, 404, { success: false, message: 'API Route Not Found' });
    return;
  }

  // =========================================================================
  // STATIC FILE SERVING & SENSITIVE FILE PROTECTION
  // =========================================================================
  let reqPath = decodeURI(pathname);

  // 🛡️ SECURITY SHIELD: Explicitly block access to admin.json or internal config
  if (reqPath.toLowerCase().includes('admin.json') || reqPath.toLowerCase().startsWith('/data/admin.json')) {
    res.writeHead(403, {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify({ error: '403 Forbidden: Direct access to admin configuration is disallowed' }));
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin') reqPath = '/admin.html';

  let filePath = path.join(ROOT, reqPath);

  // Security: prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      const notFoundPage = path.join(ROOT, '404.html');
      fs.readFile(notFoundPage, (nfErr, nfData) => {
        if (!nfErr) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(nfData);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      });
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Rakhi Makeovers Preview Server running at http://localhost:${PORT}/`);
  console.log(`🔐 Admin Panel available at http://localhost:${PORT}/admin.html`);
});
