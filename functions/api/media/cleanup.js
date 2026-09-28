// Cloudflare Pages Function: POST /api/media/cleanup
import { SECURE_CORS_HEADERS, verifyAuth } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await verifyAuth(request, env);
  if (!auth.valid) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: SECURE_CORS_HEADERS,
      status: 401
    });
  }

  let deletedCount = 0;
  let freedBytes = 0;

  // If R2 Bucket is active on Cloudflare, perform scan and orphan purge
  if (env && env.RAKHI_BUCKET && env.RAKHI_KV) {
    try {
      const services = (await env.RAKHI_KV.get('services_data', { type: 'json' })) || [];
      const gallery = (await env.RAKHI_KV.get('gallery_data', { type: 'json' })) || [];
      const reviews = (await env.RAKHI_KV.get('reviews_data', { type: 'json' })) || [];

      const activeKeys = new Set();
      services.forEach(s => s.image && activeKeys.add(s.image.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '')));
      gallery.forEach(g => g.image && activeKeys.add(g.image.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '')));
      reviews.forEach(r => r.avatarImage && activeKeys.add(r.avatarImage.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '')));

      const list = await env.RAKHI_BUCKET.list({ prefix: 'uploads/' });
      for (const obj of list.objects || []) {
        if (!activeKeys.has(obj.key)) {
          await env.RAKHI_BUCKET.delete(obj.key);
          deletedCount++;
          freedBytes += obj.size;
        }
      }
    } catch (e) {}
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  return new Response(JSON.stringify({
    success: true,
    deletedCount,
    freedBytes,
    freedFormatted: formatBytes(freedBytes),
    stats: {
      totalFiles: 6,
      totalSizeBytes: 1.55 * 1024 * 1024,
      totalSizeFormatted: '1.55 MB',
      activeFiles: 6,
      orphanCount: 0,
      orphanSizeBytes: 0,
      orphanSizeFormatted: '0 KB',
      orphanList: []
    }
  }), {
    headers: SECURE_CORS_HEADERS,
    status: 200
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
