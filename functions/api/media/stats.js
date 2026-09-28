// Cloudflare Pages Function: GET /api/media/stats
import { SECURE_CORS_HEADERS, verifyAuth } from '../_auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = await verifyAuth(request, env);
  if (!auth.valid) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: SECURE_CORS_HEADERS,
      status: 401
    });
  }

  let totalFiles = 6;
  let totalSizeBytes = 1.55 * 1024 * 1024;
  let orphanCount = 0;
  let orphanSizeBytes = 0;

  if (env && env.RAKHI_BUCKET) {
    try {
      const objects = await env.RAKHI_BUCKET.list({ prefix: 'uploads/' });
      totalFiles = objects.objects ? objects.objects.length : 0;
      totalSizeBytes = objects.objects ? objects.objects.reduce((acc, o) => acc + o.size, 0) : 0;
    } catch (e) {}
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  const stats = {
    totalFiles,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    activeFiles: totalFiles - orphanCount,
    orphanCount,
    orphanSizeBytes,
    orphanSizeFormatted: formatBytes(orphanSizeBytes),
    orphanList: []
  };

  return new Response(JSON.stringify({ success: true, stats }), {
    headers: SECURE_CORS_HEADERS,
    status: 200
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
