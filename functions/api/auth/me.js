// Cloudflare Pages Function: GET /api/auth/me
import { SECURE_CORS_HEADERS, verifyAuth } from '../_auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

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

  // Get admin username if stored in KV
  let username = 'admin';
  if (env && env.RAKHI_KV) {
    const adminConfig = await env.RAKHI_KV.get('admin_config', { type: 'json' });
    if (adminConfig && adminConfig.username) {
      username = adminConfig.username;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    user: { username }
  }), {
    headers: SECURE_CORS_HEADERS,
    status: 200
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
