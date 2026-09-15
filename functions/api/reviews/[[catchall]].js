// Cloudflare Pages Function: /api/reviews and /api/reviews/:id
const DEFAULT_REVIEWS = [
  {
    id: "review-1",
    authorName: "Karishma Tripathy",
    authorProfileUrl: "https://www.google.com/maps/contrib/100546926295073282345/reviews?hl=en-IN",
    source: "Google Verified Review",
    timeAgo: "2 months ago",
    rating: 5,
    reviewText: "Thank you so much mam for making me look so beautiful and pretty. Makeup was very long lasting and was intact from morning till late night. You and other staff made me very comfortable at your studio. Overall it was a wonderful experience. Looking forward for my upcoming function to get dolled up by you. 🥰",
    avatarImage: "assets/images/bridal_pastel.webp",
    order: 1
  },
  {
    id: "review-2",
    authorName: "Ankita Priyadarshini",
    authorProfileUrl: "https://www.google.com/maps/contrib/112988947970305516876/reviews?hl=en-IN",
    source: "Google Verified Review",
    timeAgo: "2 months ago",
    rating: 5,
    reviewText: "Thank you so much for the wonderful makeup! Everyone absolutely loved my look, and many people have been asking where I got my makeup done. I have happily recommended your name... A big thank you to you and your entire team! You all were so talented, cooperative, and professional. Truly a wonderful experience.",
    avatarImage: "assets/images/bridal_traditional.webp",
    order: 2
  },
  {
    id: "review-3",
    authorName: "Mausumi Rath",
    authorProfileUrl: "https://www.google.com/maps/contrib/109568117812754674342/reviews?hl=en-IN",
    source: "Google Verified Review",
    timeAgo: "2 months ago",
    rating: 5,
    reviewText: "Absolutely loved her work! She created the perfect look exactly the way I wanted—flawless, elegant, and beautifully subtle. Her attention to detail and talent are truly amazing, and the final result was beyond my expectations. Warm nature, positive attitude, and highly recommended!",
    avatarImage: "assets/images/bridal_reception.webp",
    order: 3
  },
  {
    id: "review-4",
    authorName: "Barsa Priyadarshini",
    authorProfileUrl: "https://www.google.com/maps/contrib/106696147975127481052/reviews?hl=en-IN",
    source: "Google Verified Review",
    timeAgo: "2 months ago",
    rating: 5,
    reviewText: "I had a wonderful experience with your makeup service. You were friendly, professional, attentive to my preferences and created a look that perfectly suited the wedding reception. The makeup was flawless, longlasting and made me feel confident throughout the night. Thank you for your dedication!",
    avatarImage: "assets/images/gallery_south_indian.webp",
    order: 4
  },
  {
    id: "review-5",
    authorName: "Saisweta Panda",
    authorProfileUrl: "https://www.google.com/maps/contrib/112577652657011957738/reviews?hl=en-IN",
    source: "Google Verified Review",
    timeAgo: "2 months ago",
    rating: 5,
    reviewText: "A truly amazing MUA! My sister's bridal makeup was flawless, long-lasting, and beautifully enhanced her features without looking overdone. The artist was talented, professional, and understood exactly what my sister wanted. She felt confident, radiant, and received countless compliments throughout the day!",
    avatarImage: "assets/images/gallery_nikah.webp",
    order: 5
  },
  {
    id: "review-6",
    authorName: "Bijaylaxmi Barik",
    authorProfileUrl: "https://www.google.com/maps/contrib/111897479940843445229/reviews?hl=en-IN",
    source: "Local Guide • 21 Reviews",
    timeAgo: "9 months ago",
    rating: 5,
    reviewText: "You are extremely talented. I can’t express my gratitude for the look you gave me on my reception — everyone complimented me. I felt so confident and beautiful because of your work. Your behaviour was just as wonderful as your skills — so calm, polite, and patient throughout. I’m truly grateful for you!",
    avatarImage: "assets/images/gallery_sangeet.webp",
    order: 6
  },
  {
    id: "review-7",
    authorName: "Smruti Ankita Patnaik",
    authorProfileUrl: "https://www.google.com/maps/contrib/102195769067690793407/reviews?hl=en-IN",
    source: "Local Guide • 24 Reviews",
    timeAgo: "6 months ago",
    rating: 5,
    reviewText: "Thank You so much for giving such beautiful looks for both marriage and reception. I am really happy that I got to experience your splendid artistry. It feels so homely at your studio. Both the looks were superb, long lasting and were proper till I removed them. Thank You again for being so cooperative!",
    avatarImage: "assets/images/gallery_christian.webp",
    order: 7
  }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

async function getReviews(env) {
  if (env && env.RAKHI_KV) {
    const data = await env.RAKHI_KV.get('reviews_data', { type: 'json' });
    if (data && Array.isArray(data)) return data;
  }
  return DEFAULT_REVIEWS;
}

async function saveReviews(env, list) {
  if (env && env.RAKHI_KV) {
    await env.RAKHI_KV.put('reviews_data', JSON.stringify(list));
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
  const reviewId = pathParts[2] || null;

  if (method === 'GET') {
    const reviews = await getReviews(env);
    return new Response(JSON.stringify(reviews), { headers: corsHeaders, status: 200 });
  }

  // Auth check for mutations
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.replace(/^Bearer\s+/i, '').trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      headers: corsHeaders,
      status: 401
    });
  }

  let reviews = await getReviews(env);

  if (method === 'POST') {
    try {
      const newReview = await request.json();
      newReview.id = newReview.id || 'review-' + Date.now();
      newReview.order = reviews.length + 1;
      reviews.push(newReview);
      await saveReviews(env, reviews);
      return new Response(JSON.stringify({ success: true, review: newReview }), {
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

  if (method === 'PUT' && reviewId) {
    try {
      const updateData = await request.json();
      const index = reviews.findIndex(r => r.id === reviewId);
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, message: 'Review not found' }), {
          headers: corsHeaders,
          status: 404
        });
      }
      reviews[index] = { ...reviews[index], ...updateData, id: reviewId };
      await saveReviews(env, reviews);
      return new Response(JSON.stringify({ success: true, review: reviews[index] }), {
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

  if (method === 'DELETE' && reviewId) {
    reviews = reviews.filter(r => r.id !== reviewId);
    await saveReviews(env, reviews);
    return new Response(JSON.stringify({ success: true, message: 'Review deleted' }), {
      headers: corsHeaders,
      status: 200
    });
  }

  return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
    headers: corsHeaders,
    status: 405
  });
}
