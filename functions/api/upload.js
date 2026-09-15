// Cloudflare Pages Function: POST /api/upload
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.replace(/^Bearer\s+/i, '').trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: corsHeaders,
      status: 401
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = await request.json();
      const base64Data = payload.data;

      if (!base64Data) {
        return new Response(JSON.stringify({ success: false, message: 'No image data provided' }), {
          headers: corsHeaders,
          status: 400
        });
      }

      // If R2 is bound on Cloudflare Pages
      if (env && env.RAKHI_BUCKET) {
        let cleanBase64 = base64Data;
        let ext = 'webp';
        const match = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          cleanBase64 = match[2];
        }

        const binary = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        const filename = `uploads/img_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

        await env.RAKHI_BUCKET.put(filename, binary, {
          httpMetadata: { contentType: `image/${ext}` }
        });

        const publicUrl = env.R2_PUBLIC_DOMAIN ? `${env.R2_PUBLIC_DOMAIN}/${filename}` : `/${filename}`;
        return new Response(JSON.stringify({ success: true, url: publicUrl }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // If no R2 configured, return the data URI directly or fallback
      return new Response(JSON.stringify({
        success: true,
        url: base64Data
      }), {
        headers: corsHeaders,
        status: 200
      });
    }

    return new Response(JSON.stringify({ success: false, message: 'Unsupported upload format. Send base64 JSON payload.' }), {
      headers: corsHeaders,
      status: 400
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Upload error: ' + err.message }), {
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
