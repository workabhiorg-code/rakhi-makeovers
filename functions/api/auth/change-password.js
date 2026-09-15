// Cloudflare Pages Function: POST /api/auth/change-password
export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: corsHeaders,
      status: 401
    });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ success: false, message: 'New password must be at least 6 characters' }), {
        headers: corsHeaders,
        status: 400
      });
    }

    let adminConfig = {
      username: 'admin',
      passwordHash: '413d666ed8cbf6c869e1d5c53024f9eb0bc6e11e1a234bd62a728fb4027fec275964400b4b53fad802f63e08c633fd87f2718fe7f629b0243d062439d463e778',
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
      return new Response(JSON.stringify({ success: false, message: 'Current password is incorrect' }), {
        headers: corsHeaders,
        status: 400
      });
    }

    // Generate new salt and hash
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

    return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), {
      headers: corsHeaders,
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Failed to update password: ' + err.message }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}
