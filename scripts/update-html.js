const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace all .jpg references in assets/images/ with .webp
html = html.replace(/assets\/images\/([a-zA-Z0-9_-]+)\.jpg/g, 'assets/images/$1.webp');

// Update head with rich SEO, open graph, twitter, favicons, JSON-LD
const newHead = `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>Rakhi Makeovers | Best Luxury Bridal Makeup Artist in Bhubaneswar</title>
  <meta name="title" content="Rakhi Makeovers | Best Luxury Bridal Makeup Artist in Bhubaneswar">
  <meta name="description" content="Rakhi Makeovers is a premier luxury bridal and wedding makeup studio in Bhubaneswar, specializing in bespoke HD &amp; Airbrush bridal artistry, destination weddings, and royal bridal couture.">
  <meta name="keywords" content="bridal makeup artist Bhubaneswar, wedding makeup studio, airbrush bridal makeup, luxury bridal makeup, HD makeup artist Odisha, destination wedding makeup, Odia bride makeup, Rakhi Makeovers">
  <meta name="author" content="Rakhi Makeovers">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="https://rakhimakeovers.pages.dev/">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://rakhimakeovers.pages.dev/">
  <meta property="og:title" content="Rakhi Makeovers | Luxury Bridal &amp; Wedding Makeup Studio">
  <meta property="og:description" content="Unveil your timeless bridal radiance with bespoke HD &amp; Airbrush artistry, luxury international vanity, and royal styling in Bhubaneswar &amp; pan-India.">
  <meta property="og:image" content="https://rakhimakeovers.pages.dev/assets/images/og-cover.jpg">
  <meta property="og:image:secure_url" content="https://rakhimakeovers.pages.dev/assets/images/og-cover.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Rakhi Makeovers Luxury Bridal Studio Lookbook">
  <meta property="og:site_name" content="Rakhi Makeovers">
  <meta property="og:locale" content="en_IN">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://rakhimakeovers.pages.dev/">
  <meta name="twitter:title" content="Rakhi Makeovers | Luxury Bridal &amp; Wedding Makeup Studio">
  <meta name="twitter:description" content="Unveil your timeless bridal radiance with bespoke HD &amp; Airbrush artistry, luxury international vanity, and royal styling.">
  <meta name="twitter:image" content="https://rakhimakeovers.pages.dev/assets/images/og-cover.jpg">
  <meta name="twitter:image:alt" content="Rakhi Makeovers Bridal Artistry">

  <!-- Mobile & PWA Theme -->
  <meta name="theme-color" content="#0B0B0E">
  <meta name="msapplication-TileColor" content="#0B0B0E">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Rakhi Makeovers">
  <link rel="manifest" href="site.webmanifest">

  <!-- Favicons & App Icons -->
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/images/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">

  <!-- Performance & Preloads for Core Web Vitals -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preload" as="image" href="assets/images/hero_bridal.webp" type="image/webp" fetchpriority="high">

  <!-- Font Awesome 6 Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <!-- Main Luxury Stylesheet -->
  <link rel="stylesheet" href="assets/css/style.css">

  <!-- Structured Data / JSON-LD for Google Chrome Rich Results -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["BeautySalon", "HairAndBeautySalon", "LocalBusiness"],
        "@id": "https://rakhimakeovers.pages.dev/#studio",
        "name": "Rakhi Makeovers",
        "alternateName": "Rakhi Bridal Artistry Studio",
        "url": "https://rakhimakeovers.pages.dev/",
        "logo": "https://rakhimakeovers.pages.dev/assets/images/icons/android-chrome-512x512.png",
        "image": "https://rakhimakeovers.pages.dev/assets/images/og-cover.jpg",
        "description": "Premier luxury bridal and wedding makeup artist studio specializing in bespoke HD & Airbrush bridal artistry, destination weddings, and royal bridal couture.",
        "telephone": "+919876543210",
        "priceRange": "₹₹₹",
        "currenciesAccepted": "INR",
        "paymentAccepted": "Cash, UPI, Credit Card, Bank Transfer",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Flagship Bridal Studio, Patia",
          "addressLocality": "Bhubaneswar",
          "addressRegion": "Odisha",
          "postalCode": "751024",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 20.3540,
          "longitude": 85.8190
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "09:00",
            "closes": "21:00"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "650",
          "bestRating": "5",
          "worstRating": "1"
        },
        "sameAs": [
          "https://instagram.com/rakhimakeovers_official",
          "https://facebook.com/rakhimakeovers",
          "https://pinterest.com/rakhimakeovers",
          "https://youtube.com/@rakhimakeovers"
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Bridal Makeover Packages",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Royal Traditional HD Bridal Makeover",
                "description": "Rich opulent bridal styling with micro-fine HD pigments, waterproof base, and traditional royal eye contouring.",
                "offers": {
                  "@type": "Offer",
                  "price": "28000",
                  "priceCurrency": "INR"
                }
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Pastel Glass-Skin HD Bridal",
                "description": "Airy, dewy modern bridal elegance tailored for day weddings, botanical florals, and pastel blush ensembles.",
                "offers": {
                  "@type": "Offer",
                  "price": "32000",
                  "priceCurrency": "INR"
                }
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Cocktail & Reception Glam",
                "description": "High-fashion evening makeover featuring soft smokey eyes, illuminated cheekbones, and Hollywood waves.",
                "offers": {
                  "@type": "Offer",
                  "price": "22000",
                  "priceCurrency": "INR"
                }
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Full Destination Wedding Suite",
                "description": "Comprehensive 3 to 4 event luxury package covering Mehendi, Sangeet, Wedding, and Reception with artist on-site standby.",
                "offers": {
                  "@type": "Offer",
                  "price": "75000",
                  "priceCurrency": "INR"
                }
              }
            }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How far in advance should I book my bridal date?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We recommend booking 3 to 8 months in advance, especially for peak auspicious wedding dates (October to March). We only take a strictly limited number of brides per day to ensure undivided, unhurried attention."
            }
          },
          {
            "@type": "Question",
            "name": "Do you offer bridal makeup trials?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Paid bridal trials can be scheduled at our flagship studio in Bhubaneswar. We test foundation undertones, lash lengths, eye gradients, and hairstyle options to finalize your exact moodboard."
            }
          },
          {
            "@type": "Question",
            "name": "Do you travel to venues for destination weddings?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Rakhi and her team travel pan-India and globally for destination weddings. Travel tickets, airport transit, and hotel accommodation are provided by the client as per standard industry terms."
            }
          },
          {
            "@type": "Question",
            "name": "What is the difference between HD and Airbrush makeup?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "HD Makeup uses micro-fine pigment foundations applied with specialized brushes and beauty sponges, giving a rich, dewy natural finish. Airbrush uses a pneumatic micro-mist gun that sprays ultra-fine silicone pigments, offering maximum sweatproof longevity for humid climates and oily skin types."
            }
          },
          {
            "@type": "Question",
            "name": "What is included in the bridal makeover package?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Every bridal package includes comprehensive pre-makeup skin prep, full HD/Airbrush makeup, 3D luxury lashes, bridal hair styling, fresh flower/accessory placement, lehenga/saree draping, jewellery pinning, and a complimentary touch-up kit."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://rakhimakeovers.pages.dev/#hero"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "The Studio",
            "item": "https://rakhimakeovers.pages.dev/#about"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Bridal Packages",
            "item": "https://rakhimakeovers.pages.dev/#services"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "Lookbook Gallery",
            "item": "https://rakhimakeovers.pages.dev/#gallery"
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": "Price Estimator",
            "item": "https://rakhimakeovers.pages.dev/#estimator"
          },
          {
            "@type": "ListItem",
            "position": 6,
            "name": "Book Consultation",
            "item": "https://rakhimakeovers.pages.dev/#booking"
          }
        ]
      }
    ]
  }
  </script>`;

// Replace head block
html = html.replace(/<head>[\s\S]*?<\/head>/i, '<head>\n' + newHead + '\n</head>');

// Ensure hero image has fetchpriority and decoding
html = html.replace(
  /<img src="assets\/images\/hero_bridal\.webp"[^>]*>/,
  '<img src="assets/images/hero_bridal.webp" alt="Luxury Indian Bride by Rakhi Makeovers" class="hero-main-img" width="440" height="540" fetchpriority="high" decoding="async">'
);

// Ensure about image has lazy loading and decoding
html = html.replace(
  /<img src="assets\/images\/about_artist\.webp"[^>]*>/,
  '<img src="assets/images/about_artist.webp" alt="Rakhi - Master Bridal Artist at Work" class="about-img-main" width="600" height="520" loading="lazy" decoding="async">'
);

// Ensure comparison images have dimensions
html = html.replace(
  /<img src="assets\/images\/before_look\.webp"[^>]*>/,
  '<img src="assets/images/before_look.webp" alt="Natural bare face before makeup" class="comparison-image before-img" width="600" height="700" loading="lazy" decoding="async">'
);
html = html.replace(
  /<img src="assets\/images\/after_look\.webp"[^>]*>/,
  '<img src="assets/images/after_look.webp" alt="Bridal glam glow after makeup" class="comparison-image after-img" width="600" height="700" loading="lazy" decoding="async">'
);

// Ensure gallery items have width, height, decoding
html = html.replace(
  /<img src="assets\/images\/([^"]+)\.webp" alt="([^"]+)" class="gallery-item-img" loading="lazy">/g,
  '<img src="assets/images/$1.webp" alt="$2" class="gallery-item-img" width="500" height="650" loading="lazy" decoding="async">'
);

// Ensure service images have decoding
html = html.replace(
  /<img src="assets\/images\/([^"]+)\.webp" alt="([^"]+)" class="service-card-img" width="400" height="260">/g,
  '<img src="assets/images/$1.webp" alt="$2" class="service-card-img" width="400" height="260" loading="lazy" decoding="async">'
);

// Ensure luxury kit image has loading lazy decoding
html = html.replace(
  /<img src="assets\/images\/luxury_products\.webp"[^>]*>/,
  '<img src="assets/images/luxury_products.webp" alt="Luxury Cosmetics Kit - Dior, Charlotte Tilbury, MAC" width="600" height="350" loading="lazy" decoding="async">'
);

// Ensure lightbox preview image has decoding
html = html.replace(
  /<img src="assets\/images\/bridal_traditional\.webp" alt="Expanded Lookbook Preview">/,
  '<img src="assets/images/bridal_traditional.webp" alt="Expanded Lookbook Preview" width="600" height="750" decoding="async">'
);

// Ensure author avatars have loading lazy decoding
html = html.replace(
  /<img src="assets\/images\/([^"]+)\.webp" alt="([^"]+)" class="author-avatar" width="50" height="50">/g,
  '<img src="assets/images/$1.webp" alt="$2" class="author-avatar" width="50" height="50" loading="lazy" decoding="async">'
);

// Ensure instagram reel images have decoding
html = html.replace(
  /<img src="assets\/images\/([^"]+)\.webp" alt="Bridal Reel ([0-9]+)" width="300" height="300" loading="lazy">/g,
  '<img src="assets/images/$1.webp" alt="Bridal Reel $2" width="300" height="300" loading="lazy" decoding="async">'
);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html successfully updated with rich SEO, JSON-LD schema, WebP assets, and Core Web Vitals optimizations!');
