// Cloudflare Pages Function: /api/gallery and /api/gallery/:id
const DEFAULT_GALLERY = [
  {
    id: "gallery-1",
    title: "Signature Bridal Look",
    category: "bridal",
    categoryName: "Bridal Royalty",
    image: "assets/images/uploads/upload_1789550811538_b7448357.jpg",
    description: "Our iconic royal couture bridal masterpiece—featuring 16-hour sweat-proof HD artistry, regal smoked kohl eyes, sculpted bone structure, and grand lehenga draping.",
    altText: "Signature Bridal Look by Rakhi Makeovers",
    order: 1
  },
  {
    id: "gallery-2",
    title: "Soft Bridal Elegance",
    category: "bridal",
    categoryName: "Soft Bridal",
    image: "assets/images/uploads/upload_1789550797403_11028f77.jpg",
    description: "An ethereal, modern bridal look featuring soft pastel hues, dewy porcelain skin, delicate shimmer lids, and effortless floral-adorned bridal styling.",
    altText: "Soft Bridal Elegance Makeover",
    order: 2
  },
  {
    id: "gallery-3",
    title: "Classic Saree Glam",
    category: "glam",
    categoryName: "Glam & Saree",
    image: "assets/images/uploads/upload_1789550720421_4de6f166.jpg",
    description: "Graceful heritage aesthetics crafted for silk sarees and traditional ceremonies, featuring luminous skin, traditional defined kohl eyes, and meticulous saree pleating.",
    altText: "Classic Saree Glam Look",
    order: 3
  },
  {
    id: "gallery-4",
    title: "Engagement Glow",
    category: "glam",
    categoryName: "Engagement Glow",
    image: "assets/images/uploads/upload_1789550752235_fb6ff277.jpg",
    description: "Luminous, lit-from-within radiance designed for ring ceremonies and cocktail evenings, with dewy glass skin, soft shimmer eye artistry, and romantic bouncy blowout waves.",
    altText: "Engagement Glow Makeover",
    order: 4
  },
  {
    id: "gallery-5",
    title: "Classic Timeless Glam",
    category: "glam",
    categoryName: "Timeless Glam",
    image: "assets/images/uploads/upload_1789550776500_b3c6ffd4.jpg",
    description: "Sophisticated, red-carpet-inspired glamour tailored to elevate evening receptions, featuring sultry soft smokey eyes, sculpted cheekbones, and Hollywood waves.",
    altText: "Classic Timeless Glam Look",
    order: 5
  },
  {
    id: "gallery-6",
    title: "Classic Beauty",
    category: "beauty",
    categoryName: "Classic Beauty",
    image: "assets/images/uploads/upload_1789550866594_c6144368.jpg",
    description: "Understated vintage elegance emphasizing refined natural features, featuring silky satin-finish skin, crisp winged liner, sculpted brows, and a statement lip.",
    altText: "Classic Beauty Makeover",
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
