// Cloudflare Pages Function: /api/gallery and /api/gallery/:id
const DEFAULT_GALLERY = [
  {
    id: "gallery-1",
    title: "Royal Crimson Heritage",
    category: "traditional",
    categoryName: "Traditional Red",
    image: "assets/images/bridal_traditional.webp",
    description: "Intricate zari red lehenga with royal kohl smokey eyes, warm gold pigment, matha patti, and classic matte vermillion lips.",
    altText: "Royal Crimson Heritage Bride",
    order: 1
  },
  {
    id: "gallery-2",
    title: "Blush Romance Glass-Skin",
    category: "pastel",
    categoryName: "Pastel & Modern",
    image: "assets/images/bridal_pastel.webp",
    description: "Pastel pink & peach lehenga with translucent glow foundation, rose shimmer lid foils, and soft textured floral bun.",
    altText: "Blush Romance Glass-Skin Bride",
    order: 2
  },
  {
    id: "gallery-3",
    title: "Couture Hollywood Waves",
    category: "reception",
    categoryName: "Reception & Glam",
    image: "assets/images/bridal_reception.webp",
    description: "Strobe-illuminated cheekbones, velvet chocolate smokey eyes, gloss nude lip, and timeless Hollywood glam cascade curls.",
    altText: "Couture Reception Hollywood Waves Look",
    order: 3
  },
  {
    id: "gallery-4",
    title: "South Indian Kanjeevaram",
    category: "temple",
    categoryName: "Temple & Heritage",
    image: "assets/images/gallery_south_indian.webp",
    description: "Pure gold Kanjeevaram silk saree paired with long floral jada braid, temple jewellery setting, and bronze luminous skin.",
    altText: "South Indian Temple Kanjeevaram Bride",
    order: 4
  },
  {
    id: "gallery-5",
    title: "Royal Nikah Elegance",
    category: "temple",
    categoryName: "Temple & Nikah",
    image: "assets/images/gallery_nikah.webp",
    description: "Intricate emerald green & ivory outfit with sculpted winged kohl, luminous airbrush finish, and ornate Passa/Jhummar framing.",
    altText: "Royal Nikah Elegance Look",
    order: 5
  },
  {
    id: "gallery-6",
    title: "Sangeet Night Celebration",
    category: "reception",
    categoryName: "Reception & Sangeet",
    image: "assets/images/gallery_sangeet.webp",
    description: "High-energy dance proof glam with shimmer gold pigment, peach coral glow, and voluminous half-up bohemian curls.",
    altText: "Sangeet Night Celebration Look",
    order: 6
  }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

async function getGallery(env) {
  if (env && env.RAKHI_KV) {
    const data = await env.RAKHI_KV.get('gallery_data', { type: 'json' });
    if (data && Array.isArray(data)) return data;
  }
  return DEFAULT_GALLERY;
}

async function saveGallery(env, list) {
  if (env && env.RAKHI_KV) {
    await env.RAKHI_KV.put('gallery_data', JSON.stringify(list));
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const galleryId = pathParts[2] || null;

  if (method === 'GET') {
    const gallery = await getGallery(env);
    return new Response(JSON.stringify(gallery), { headers: corsHeaders, status: 200 });
  }

  // Auth check for mutations
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.replace(/^Bearer\s+/i, '').trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: corsHeaders,
      status: 401
    });
  }

  let gallery = await getGallery(env);

  if (method === 'POST') {
    try {
      const newItem = await request.json();
      newItem.id = newItem.id || 'gallery-' + Date.now();
      newItem.order = gallery.length + 1;
      gallery.push(newItem);
      await saveGallery(env, gallery);
      return new Response(JSON.stringify({ success: true, item: newItem }), {
        headers: corsHeaders,
        status: 201
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), {
        headers: corsHeaders,
        status: 400
      });
    }
  }

  if (method === 'PUT' && galleryId) {
    try {
      const updateData = await request.json();
      const index = gallery.findIndex(g => g.id === galleryId);
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, message: 'Item not found' }), {
          headers: corsHeaders,
          status: 404
        });
      }
      gallery[index] = { ...gallery[index], ...updateData, id: galleryId };
      await saveGallery(env, gallery);
      return new Response(JSON.stringify({ success: true, item: gallery[index] }), {
        headers: corsHeaders,
        status: 200
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), {
        headers: corsHeaders,
        status: 400
      });
    }
  }

  if (method === 'DELETE' && galleryId) {
    gallery = gallery.filter(g => g.id !== galleryId);
    await saveGallery(env, gallery);
    return new Response(JSON.stringify({ success: true, message: 'Item deleted' }), {
      headers: corsHeaders,
      status: 200
    });
  }

  return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
    headers: corsHeaders,
    status: 405
  });
}
