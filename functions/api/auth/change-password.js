// Cloudflare Pages Function: POST /api/auth/change-password
import { SECURE_CORS_HEADERS, verifyAuth } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Verify Active Session
  const auth = await verifyAuth(request, env);
  if (!auth.valid) {
    return new Response(JSON.stringify({
      success: false,
      message: auth.message || 'Unauthorized'
    }), {
      headers: SECURE_CORS_HEADERS,
      status: 401
    });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({
        success: false,
        message: 'New password must be at least 8 characters long'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 400
      });
    }

    // Default admin credentials fallback
    let adminConfig = {
      username: 'admin',
      passwordHash: 'e438ebcbf5e87d0579ebed59bc5c6347745d7405409a9eb9dc1ad4b39d2edf6c08664d37fb19afb5f31047641f562bc5f3cab160a67f9ba2ecfb47f8f85054b3',
      salt: '8f92a3c7b4e1d6502938475610293847'
    };

    if (env && env.RAKHI_KV) {
      const stored = await env.RAKHI_KV.get('admin_config', { type: 'json' });
      if (stored) adminConfig = stored;
    }

    // Verify current password
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(currentPassword || ''),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const saltBytes = new Uint8Array(adminConfig.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-512' },
      keyMaterial,
      512
    );

    const currentDerivedHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (currentDerivedHex !== adminConfig.passwordHash) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Current password is incorrect'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 400
      });
    }

    // Generate new cryptographic salt (16 bytes = 32 hex chars) and hash
    const newSaltBytes = crypto.getRandomValues(new Uint8Array(16));
    const newSaltHex = Array.from(newSaltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const newKeyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(newPassword),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const newDerivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: newSaltBytes, iterations: 100000, hash: 'SHA-512' },
      newKeyMaterial,
      512
    );

    const newDerivedHex = Array.from(new Uint8Array(newDerivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    adminConfig.salt = newSaltHex;
    adminConfig.passwordHash = newDerivedHex;

    if (env && env.RAKHI_KV) {
      await env.RAKHI_KV.put('admin_config', JSON.stringify(adminConfig));
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password updated successfully'
    }), {
      headers: SECURE_CORS_HEADERS,
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to update password: ' + err.message
    }), {
      headers: SECURE_CORS_HEADERS,
      status: 500
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
