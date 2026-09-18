/**
 * Cloudflare Worker Entry Point for Rakhi Makeovers
 * Serves Static Assets from dist/ and routes /api/* to Serverless Handlers
 */

import { onRequestPost as loginPost } from '../functions/api/auth/login.js';
import { onRequestPost as logoutPost } from '../functions/api/auth/logout.js';
import { onRequestGet as meGet } from '../functions/api/auth/me.js';
import { onRequestPost as changePwPost } from '../functions/api/auth/change-password.js';
import { onRequest as servicesHandler } from '../functions/api/services/[[catchall]].js';
import { onRequest as galleryHandler } from '../functions/api/gallery/[[catchall]].js';
import { onRequest as reviewsHandler } from '../functions/api/reviews/[[catchall]].js';
import { onRequestPost as uploadPost } from '../functions/api/upload.js';
import { SECURE_CORS_HEADERS } from '../functions/api/_auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS preflight for all /api routes
    if (method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new Response(null, { headers: SECURE_CORS_HEADERS });
    }

    const context = { request, env, params: {}, waitUntil: (p) => ctx.waitUntil(p) };

    // 1. API Route Dispatching
    if (pathname === '/api/auth/login' && method === 'POST') {
      return loginPost(context);
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      return logoutPost(context);
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      return meGet(context);
    }

    if (pathname === '/api/auth/change-password' && method === 'POST') {
      return changePwPost(context);
    }

    if (pathname.startsWith('/api/services')) {
      return servicesHandler(context);
    }

    if (pathname.startsWith('/api/gallery')) {
      return galleryHandler(context);
    }

    if (pathname.startsWith('/api/reviews')) {
      return reviewsHandler(context);
    }

    if (pathname === '/api/upload' && method === 'POST') {
      return uploadPost(context);
    }

    // 2. Custom Obfuscated Admin Dashboard Route (/login/Rakhi)
    const normalizedPath = pathname.replace(/\/+$/, '');
    if (normalizedPath.toLowerCase() === '/login/rakhi') {
      if (env.ASSETS) {
        const adminUrl = new URL('/login/Rakhi/index.html', request.url);
        return env.ASSETS.fetch(new Request(adminUrl, request));
      }
    }

    // 3. Legacy Admin Redirect to Custom /login/Rakhi
    if (normalizedPath.toLowerCase() === '/admin') {
      const redirectUrl = new URL('/login/Rakhi', request.url);
      return Response.redirect(redirectUrl.toString(), 301);
    }

    // 4. Static Assets Dispatching (for Cloudflare Workers with Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
