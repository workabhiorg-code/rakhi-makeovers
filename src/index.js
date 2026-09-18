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
import { ADMIN_HTML, INDEX_HTML, NOT_FOUND_HTML, ADMIN_CSS, ADMIN_JS } from './embeddedAssets.js';

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

    // 2. Custom Admin Dashboard Routes (/admin, /login/Rakhi, /login)
    const normalizedPath = pathname.replace(/\/+$/, '').toLowerCase();
    if (
      normalizedPath === '/admin' ||
      normalizedPath === '/admin.html' ||
      normalizedPath === '/login' ||
      normalizedPath === '/login.html' ||
      normalizedPath === '/login/rakhi'
    ) {
      return new Response(ADMIN_HTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      });
    }

    // 3. Static Assets Dispatching (for Cloudflare Workers with Assets)
    if (env && env.ASSETS) {
      try {
        const res = await env.ASSETS.fetch(request);
        if (res.status < 400) return res;
      } catch (e) {}
    }

    // 4. Fallback Static Assets for Standalone Worker Deployments
    if (pathname === '/assets/css/admin.css') {
      return new Response(ADMIN_CSS, {
        headers: { 'Content-Type': 'text/css; charset=UTF-8', 'Cache-Control': 'public, max-age=604800' }
      });
    }

    if (pathname === '/assets/js/admin.js') {
      return new Response(ADMIN_JS, {
        headers: { 'Content-Type': 'application/javascript; charset=UTF-8', 'Cache-Control': 'public, max-age=604800' }
      });
    }

    if (pathname === '/' || pathname === '/index.html' || pathname === '') {
      return new Response(INDEX_HTML, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=0, must-revalidate' }
      });
    }

    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }
};
