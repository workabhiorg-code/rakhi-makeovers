// Cloudflare Pages Function: POST /api/upload
import { SECURE_CORS_HEADERS, verifyAuth, validateImageMagicBytes } from './_auth.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Enforce active session verification
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
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unsupported upload format. Send base64 JSON payload.'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 400
      });
    }

    const payload = await request.json();
    const base64Data = payload.data;

    if (!base64Data || typeof base64Data !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        message: 'No image data provided'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 400
      });
    }

    // Extract raw base64 string
    let cleanBase64 = base64Data;
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      cleanBase64 = match[2];
    }

    // Decode base64 to binary
    const binaryString = atob(cleanBase64);
    const byteLength = binaryString.length;

    if (byteLength > MAX_UPLOAD_BYTES) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Image size exceeds maximum limit of 5 MB'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 413
      });
    }

    const binary = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      binary[i] = binaryString.charCodeAt(i);
    }

    // 2. Validate Magic Bytes (WebP, JPG, PNG only; SVG disallowed to prevent Stored XSS)
    const magic = validateImageMagicBytes(binary);
    if (!magic.valid) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid file type. Only WebP, JPEG, and PNG images are allowed.'
      }), {
        headers: SECURE_CORS_HEADERS,
        status: 400
      });
    }

    const safeExt = magic.format;
    const filename = `uploads/img_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${safeExt}`;

    // If R2 Bucket is bound on Cloudflare Pages
    if (env && env.RAKHI_BUCKET) {
      await env.RAKHI_BUCKET.put(filename, binary, {
        httpMetadata: { contentType: magic.mime }
      });

      const publicUrl = env.R2_PUBLIC_DOMAIN ? `${env.R2_PUBLIC_DOMAIN}/${filename}` : `/${filename}`;
      return new Response(JSON.stringify({ success: true, url: publicUrl }), {
        headers: SECURE_CORS_HEADERS,
        status: 200
      });
    }

    // Return sanitized data URI or path
    return new Response(JSON.stringify({
      success: true,
      url: `data:${magic.mime};base64,${cleanBase64}`
    }), {
      headers: SECURE_CORS_HEADERS,
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Upload processing error'
    }), {
      headers: SECURE_CORS_HEADERS,
      status: 500
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: SECURE_CORS_HEADERS });
}
