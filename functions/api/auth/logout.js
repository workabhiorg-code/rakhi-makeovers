// Cloudflare Pages Function: POST /api/auth/logout
import { SECURE_CORS_HEADERS, extractToken, revokeSession } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = extractToken(request);

  if (token) {
    await revokeSession(token, env);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out and session revoked successfully'
  }), {
    headers: SECURE_CORS_HEADERS,
    status: 200
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
