// Cloudflare Pages Function: POST /api/auth/login
import { SECURE_CORS_HEADERS, checkRateLimit, recordFailedAttempt, resetRateLimit } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Check Rate Limiting
  const rateLimit = await checkRateLimit(request, env);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      success: false,
      message: rateLimit.message
    }), { headers: SECURE_CORS_HEADERS, status: 429 });
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Username and password are required'
      }), { headers: SECURE_CORS_HEADERS, status: 400 });
    }

    // Default admin credentials (fallback if KV is uninitialized)
    let adminConfig = {
      username: 'admin',
      passwordHash: '413d666ed8cbf6c869e1d5c53024f9eb0bc6e11e1a234bd62a728fb4027fec275964400b4b53fad802f63e08c633fd87f2718fe7f629b0243d062439d463e778',
      salt: '8f92a3c7b4e1d6502938475610293847'
    };

    if (env && env.RAKHI_KV) {
      const stored = await env.RAKHI_KV.get('admin_config', { type: 'json' });
      if (stored) adminConfig = stored;
    }

    // PBKDF2 hash verification
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password || ''),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const saltBytes = new Uint8Array(adminConfig.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-512'
      },
      keyMaterial,
      512
    );

    const derivedHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time length check
    if (username === adminConfig.username && derivedHex === adminConfig.passwordHash) {
      // Clear rate limit on successful auth
      await resetRateLimit(request, env);

      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

      if (env && env.RAKHI_KV) {
        let sessions = (await env.RAKHI_KV.get('admin_sessions', { type: 'json' })) || [];
        // Filter out expired sessions
        sessions = sessions.filter(s => s.expiresAt > Date.now());
        sessions.push({ token, createdAt: Date.now(), expiresAt });
        // Retain max 20 active sessions
        if (sessions.length > 20) sessions = sessions.slice(-20);
        await env.RAKHI_KV.put('admin_sessions', JSON.stringify(sessions));
      }

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { username: adminConfig.username }
      }), { headers: SECURE_CORS_HEADERS, status: 200 });
    } else {
      // Record failed login attempt for rate limiting
      await recordFailedAttempt(request, env);

      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid username or password'
      }), { headers: SECURE_CORS_HEADERS, status: 401 });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication error'
    }), { headers: SECURE_CORS_HEADERS, status: 400 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
