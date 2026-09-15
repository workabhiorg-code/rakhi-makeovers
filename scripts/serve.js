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

// Helper: Hash password
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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

    // 1. Auth API
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const bodyBuf = await parseBody(req);
        const { username, password } = JSON.parse(bodyBuf.toString() || '{}');

        const adminData = readData('admin.json', {
          username: 'admin',
          salt: '8f92a3c7b4e1d6502938475610293847',
          passwordHash: '413d666ed8cbf6c869e1d5c53024f9eb0bc6e11e1a234bd62a728fb4027fec275964400b4b53fad802f63e08c633fd87f2718fe7f629b0243d062439d463e778',
          sessions: []
        });

        const computedHash = hashPassword(password || '', adminData.salt);
        if (username === adminData.username && computedHash === adminData.passwordHash) {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

          if (!adminData.sessions) adminData.sessions = [];
          adminData.sessions.push({ token, createdAt: Date.now(), expiresAt });
          // Keep max 20 active sessions
          if (adminData.sessions.length > 20) adminData.sessions = adminData.sessions.slice(-20);
          writeData('admin.json', adminData);

          sendJSON(res, 200, {
            success: true,
            token,
            user: { username: adminData.username }
          });
        } else {
          sendJSON(res, 401, { success: false, message: 'Invalid username or password' });
        }
      } catch (err) {
        sendJSON(res, 400, { success: false, message: 'Invalid request body' });
      }
      return;
    }

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

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }
      const adminData = readData('admin.json', { username: 'admin' });
      sendJSON(res, 200, { success: true, user: { username: adminData.username } });
      return;
    }

    if (pathname === '/api/auth/change-password' && req.method === 'POST') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }
      try {
        const bodyBuf = await parseBody(req);
        const { currentPassword, newPassword } = JSON.parse(bodyBuf.toString() || '{}');

        if (!newPassword || newPassword.length < 6) {
          sendJSON(res, 400, { success: false, message: 'New password must be at least 6 characters' });
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

    // 5. Image Upload API (Supports Base64 JSON and Multipart Raw Stream)
    if (pathname === '/api/upload' && req.method === 'POST') {
      if (!verifyAuth(req)) {
        sendJSON(res, 401, { success: false, message: 'Unauthorized' });
        return;
      }

      try {
        const contentType = req.headers['content-type'] || '';
        const bodyBuf = await parseBody(req);

        let fileBuffer, ext = '.webp';

        if (contentType.includes('application/json')) {
          const payload = JSON.parse(bodyBuf.toString() || '{}');
          if (!payload.data) {
            sendJSON(res, 400, { success: false, message: 'Missing base64 data' });
            return;
          }
          // e.g. data:image/png;base64,....
          const match = payload.data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            ext = '.' + (match[1] === 'jpeg' ? 'jpg' : match[1]);
            fileBuffer = Buffer.from(match[2], 'base64');
          } else {
            fileBuffer = Buffer.from(payload.data, 'base64');
          }
        } else if (contentType.includes('multipart/form-data')) {
          // Parse boundary
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
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                ext = path.extname(filenameMatch[1]).toLowerCase() || '.webp';
              }
              const headerEnd = part.indexOf('\r\n\r\n');
              if (headerEnd !== -1) {
                const fileBinary = part.substring(headerEnd + 4, part.lastIndexOf('\r\n'));
                fileBuffer = Buffer.from(fileBinary, 'binary');
                break;
              }
            }
          }
        } else {
          // Direct binary upload
          fileBuffer = bodyBuf;
        }

        if (!fileBuffer || fileBuffer.length === 0) {
          sendJSON(res, 400, { success: false, message: 'No file received' });
          return;
        }

        const safeFilename = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
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
  // STATIC FILE SERVING
  // =========================================================================
  let reqPath = decodeURI(pathname);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin') reqPath = '/admin.html';

  let filePath = path.join(ROOT, reqPath);

  // Security: prevent traversal outside ROOT
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
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Rakhi Makeovers Preview Server running at http://localhost:${PORT}/`);
  console.log(`🔐 Admin Panel available at http://localhost:${PORT}/admin.html`);
});
