// Cloudflare Pages Function: /api/services and /api/services/:id
const DEFAULT_SERVICES = [
  {
    id: "service-1",
    title: "Classic Saree Glam",
    category: "glam",
    image: "assets/images/uploads/upload_1789550720421_4de6f166.jpg",
    description: "Graceful heritage aesthetics crafted for silk sarees and traditional ceremonies, featuring luminous skin, traditional defined kohl eyes, and meticulous saree pleating.",
    inclusions: [
      "Sweat-Resistant Radiant Base & Strobe Highlight",
      "Classic Defined Winged Kohl & Lash Architecture",
      "Royal Silk Saree Pleating, Gajra Placement & Draping"
    ],
    duration: "2.5 Hours",
    order: 1
  },
  {
    id: "service-2",
    title: "Engagement Glow",
    category: "glam",
    image: "assets/images/uploads/upload_1789550752235_fb6ff277.jpg",
    description: "Luminous, lit-from-within radiance designed for ring ceremonies and cocktail evenings, with dewy glass skin, soft shimmer eye artistry, and romantic bouncy blowout waves.",
    inclusions: [
      "Dewy Glass-Skin Prep & Multi-Dimensional Highlighting",
      "Soft Champagne Shimmer Eye Art & Lash Framing",
      "Romantic Bouncy Curls or Modern Textured Half-Updo"
    ],
    duration: "2.0 Hours",
    order: 2
  },
  {
    id: "service-3",
    title: "Classic Timeless Glam",
    category: "glam",
    image: "assets/images/uploads/upload_1789550776500_b3c6ffd4.jpg",
    description: "Sophisticated, red-carpet-inspired glamour tailored to elevate evening receptions, featuring sultry soft smokey eyes, sculpted cheekbones, and Hollywood waves.",
    inclusions: [
      "4K HD Camera-Ready Base with Velvet Contour",
      "Dramatic Velvet Smokey Eyes & Precision Wing",
      "Signature Hollywood Waves or Sleek Sculpted Bun"
    ],
    duration: "2.5 Hours",
    order: 3
  },
  {
    id: "service-4",
    title: "Classic Beauty",
    category: "beauty",
    image: "assets/images/uploads/upload_1789550866594_c6144368.jpg",
    description: "Understated vintage elegance emphasizing refined natural features, featuring silky satin-finish skin, crisp winged liner, sculpted brows, and a statement lip.",
    inclusions: [
      "Velvety Satin Skin Finish & Soft-Focus Airbrush",
      "Crisp Retro Winged Eyeliner & Tailored Brow Arch",
      "Statement Crimson / Rose Petal Lip Art & Vintage Setting"
    ],
    duration: "2.0 Hours",
    order: 4
  },
  {
    id: "service-5",
    title: "Soft Bridal Elegance",
    category: "bridal",
    image: "assets/images/uploads/upload_1789550797403_11028f77.jpg",
    description: "An ethereal, modern bridal look featuring soft pastel hues, dewy porcelain skin, delicate shimmer lids, and effortless floral-adorned bridal styling.",
    inclusions: [
      "Weightless Breathable All-Day Long-Wear HD Base",
      "Soft Rose-Gold Shimmer Lids & Fluffy Wispy Lashes",
      "Romantic Textured Floral Braid or Soft Bridal Chignon"
    ],
    duration: "3.0 Hours",
    order: 5
  },
  {
    id: "service-6",
    title: "Signature Bridal Look",
    category: "bridal",
    image: "assets/images/uploads/upload_1789550811538_b7448357.jpg",
    description: "Our iconic royal couture bridal masterpiece—featuring 16-hour sweat-proof HD artistry, regal smoked kohl eyes, sculpted bone structure, and grand lehenga draping.",
    inclusions: [
      "16-Hour Mandap & Tear-Proof Ultra-HD Bridal Base",
      "Signature Royal Kohl Eyes & 3D Mink Lashes",
      "Royal Coiffure, Fresh Exotic Florals & Lehenga Setting"
    ],
    duration: "3.5 Hours",
    order: 6
  }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

async function getServices(env) {
  if (env && env.RAKHI_KV) {
    const data = await env.RAKHI_KV.get('services_data', { type: 'json' });
    if (data && Array.isArray(data)) return data;
  }
  return DEFAULT_SERVICES;
}

async function saveServices(env, list) {
  if (env && env.RAKHI_KV) {
    await env.RAKHI_KV.put('services_data', JSON.stringify(list));
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // e.g. ['api', 'services', 'service-1']
  const serviceId = pathParts[2] || null;

  if (method === 'GET') {
    const services = await getServices(env);
    return new Response(JSON.stringify(services), { headers: corsHeaders, status: 200 });
  }

  // Auth check for mutations
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.replace(/^Bearer\s+/i, '').trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: corsHeaders,
      status: 401
    });
  }

  let services = await getServices(env);

  if (method === 'POST') {
    try {
      const newService = await request.json();
      newService.id = newService.id || 'service-' + Date.now();
      newService.order = services.length + 1;
      services.push(newService);
      await saveServices(env, services);
      return new Response(JSON.stringify({ success: true, service: newService }), {
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

  if (method === 'PUT' && serviceId) {
    try {
      const updateData = await request.json();
      const index = services.findIndex(s => s.id === serviceId);
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, message: 'Service not found' }), {
          headers: corsHeaders,
          status: 404
        });
      }
      services[index] = { ...services[index], ...updateData, id: serviceId };
      await saveServices(env, services);
      return new Response(JSON.stringify({ success: true, service: services[index] }), {
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

  if (method === 'DELETE' && serviceId) {
    services = services.filter(s => s.id !== serviceId);
    await saveServices(env, services);
    return new Response(JSON.stringify({ success: true, message: 'Service deleted' }), {
      headers: corsHeaders,
      status: 200
    });
  }

  return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
    headers: corsHeaders,
    status: 405
  });
}
