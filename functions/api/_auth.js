// Shared Cloudflare Functions Security & Authentication Module

export const SECURE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json; charset=UTF-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

/**
 * Extract and sanitize Bearer token from request Authorization header
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+([a-zA-Z0-9_-]+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verify session token validity against Cloudflare KV or fallback
 */
export async function verifyAuth(request, env) {
  const token = extractToken(request);
  if (!token) {
    return { valid: false, message: 'Missing or malformed Authorization token' };
  }

  // If Cloudflare KV is configured
  if (env && env.RAKHI_KV) {
    try {
      let sessions = (await env.RAKHI_KV.get('admin_sessions', { type: 'json' })) || [];
      const now = Date.now();

      // Find active valid session
      const activeSession = sessions.find(s => s.token === token && s.expiresAt > now);

      if (!activeSession) {
        return { valid: false, message: 'Invalid or expired session token' };
      }

      // Cleanup expired sessions in background if any
      const validSessions = sessions.filter(s => s.expiresAt > now);
      if (validSessions.length !== sessions.length) {
        await env.RAKHI_KV.put('admin_sessions', JSON.stringify(validSessions));
      }

      return { valid: true, token, session: activeSession };
    } catch (err) {
      return { valid: false, message: 'Session verification failed' };
    }
  }

  // If running in minimal/fallback environment without KV, require valid token format length
  if (token.length >= 32) {
    return { valid: true, token, session: { token, createdAt: Date.now() } };
  }

  return { valid: false, message: 'Unauthorized session' };
}

/**
 * Revoke/Invalidate a session token from KV
 */
export async function revokeSession(token, env) {
  if (!token || !env || !env.RAKHI_KV) return true;
  try {
    let sessions = (await env.RAKHI_KV.get('admin_sessions', { type: 'json' })) || [];
    sessions = sessions.filter(s => s.token !== token);
    await env.RAKHI_KV.put('admin_sessions', JSON.stringify(sessions));
    return true;
  } catch (err) {
    console.error('Failed to revoke session:', err);
    return false;
  }
}

/**
 * Rate Limiting Helper for Login attempts per IP
 * Limit: max 5 failed attempts in 15 minutes
 */
export async function checkRateLimit(request, env, keyPrefix = 'rl_login_') {
  if (!env || !env.RAKHI_KV) return { allowed: true };

  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown-ip';
  const key = `${keyPrefix}${clientIp}`;

  try {
    const record = (await env.RAKHI_KV.get(key, { type: 'json' })) || { count: 0, lockedUntil: 0 };
    const now = Date.now();

    if (record.lockedUntil && record.lockedUntil > now) {
      const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return {
        allowed: false,
        message: `Too many failed login attempts. Please try again in ${waitMinutes} minute(s).`
      };
    }

    return { allowed: true, key, record };
  } catch (err) {
    return { allowed: true };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(request, env, keyPrefix = 'rl_login_') {
  if (!env || !env.RAKHI_KV) return;
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown-ip';
  const key = `${keyPrefix}${clientIp}`;
  const now = Date.now();

  try {
    const record = (await env.RAKHI_KV.get(key, { type: 'json' })) || { count: 0, lockedUntil: 0 };
    record.count = (record.count || 0) + 1;

    // Lock for 15 minutes if 5 failed attempts reached
    if (record.count >= 5) {
      record.lockedUntil = now + (15 * 60 * 1000);
      record.count = 0; // reset counter after locking
    }

    // TTL 15 minutes (900 seconds)
    await env.RAKHI_KV.put(key, JSON.stringify(record), { expirationTtl: 900 });
  } catch (err) {
    console.error('Failed to record rate limit:', err);
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetRateLimit(request, env, keyPrefix = 'rl_login_') {
  if (!env || !env.RAKHI_KV) return;
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown-ip';
  const key = `${keyPrefix}${clientIp}`;
  try {
    await env.RAKHI_KV.delete(key);
  } catch (err) {}
}

/**
 * Validate image buffer magic bytes (WebP, JPEG, PNG)
 */
export function validateImageMagicBytes(uint8Array) {
  if (!uint8Array || uint8Array.length < 12) return { valid: false, format: null };

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    uint8Array[0] === 0x89 && uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4E && uint8Array[3] === 0x47 &&
    uint8Array[4] === 0x0D && uint8Array[5] === 0x0A &&
    uint8Array[6] === 0x1A && uint8Array[7] === 0x0A
  ) {
    return { valid: true, format: 'png', mime: 'image/png' };
  }

  // JPEG / JPG: FF D8 FF
  if (
    uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF
  ) {
    return { valid: true, format: 'jpg', mime: 'image/jpeg' };
  }

  // WebP: RIFF .... WEBP
  // RIFF = 52 49 46 46, WEBP = 57 45 42 50 at offset 8
  if (
    uint8Array[0] === 0x52 && uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 && uint8Array[3] === 0x47 &&
    uint8Array[8] === 0x57 && uint8Array[9] === 0x45 &&
    uint8Array[10] === 0x42 && uint8Array[11] === 0x50
  ) {
    return { valid: true, format: 'webp', mime: 'image/webp' };
  }

  return { valid: false, format: null };
}
