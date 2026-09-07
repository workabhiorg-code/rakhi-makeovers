const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'assets', 'images');
const iconsDir = path.join(imagesDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function optimizeImages() {
  console.log('--- Starting Image Optimization with Sharp ---');
  const files = fs.readdirSync(imagesDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('og-'));

  let totalOriginalBytes = 0;
  let totalWebpBytes = 0;

  for (const file of imageFiles) {
    const filePath = path.join(imagesDir, file);
    const parsed = path.parse(file);
    const originalStat = fs.statSync(filePath);
    totalOriginalBytes += originalStat.size;

    const webpPath = path.join(imagesDir, `${parsed.name}.webp`);
    
    // Convert to WebP with optimal settings (quality 82, near lossless color/sharpness, effort 6)
    await sharp(filePath)
      .webp({ quality: 82, effort: 6 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    totalWebpBytes += webpStat.size;

    const savedPercent = (((originalStat.size - webpStat.size) / originalStat.size) * 100).toFixed(1);
    console.log(`✓ ${file} (${(originalStat.size / 1024).toFixed(0)} KB) -> ${parsed.name}.webp (${(webpStat.size / 1024).toFixed(0)} KB) [Saved ${savedPercent}%]`);
  }

  console.log(`\n🎉 Total Original Size: ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🎉 Total WebP Size: ${(totalWebpBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🎉 Overall Size Reduction: ${(((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100).toFixed(1)}% savings!`);

  // Create Open Graph (OG) 1200x630 Social Banner
  console.log('\n--- Generating Open Graph Social Share Image (1200x630) ---');
  const heroImgPath = path.join(imagesDir, 'hero_bridal.jpg');
  const ogJpgPath = path.join(imagesDir, 'og-cover.jpg');
  const ogWebpPath = path.join(imagesDir, 'og-cover.webp');

  if (fs.existsSync(heroImgPath)) {
    // Composite luxury dark gradient overlay + title banner
    const ogSvgOverlay = Buffer.from(`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B0B0E" stop-opacity="0.95"/>
            <stop offset="50%" stop-color="#14141A" stop-opacity="0.80"/>
            <stop offset="100%" stop-color="#0B0B0E" stop-opacity="0.90"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#D4AF37"/>
            <stop offset="50%" stop-color="#F3E5AB"/>
            <stop offset="100%" stop-color="#D4AF37"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)" />
        <rect x="30" y="30" width="1140" height="570" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-opacity="0.4" rx="16"/>
        
        <!-- Badge -->
        <rect x="70" y="70" width="340" height="38" rx="19" fill="#D4AF37" fill-opacity="0.15" stroke="#D4AF37" stroke-width="1"/>
        <text x="240" y="94" font-family="'Cinzel', 'Playfair Display', serif, sans-serif" font-size="14" fill="#F3E5AB" font-weight="600" text-anchor="middle" letter-spacing="2">LUXURY BRIDAL ARTISTRY</text>
        
        <!-- Brand Title -->
        <text x="70" y="210" font-family="'Cinzel', 'Playfair Display', serif, sans-serif" font-size="64" fill="#FFFFFF" font-weight="700" letter-spacing="1">RAKHI <tspan fill="url(#gold)">MAKEOVERS</tspan></text>
        <text x="70" y="270" font-family="'Plus Jakarta Sans', sans-serif" font-size="26" fill="#D4AF37" font-weight="500" letter-spacing="3">BESPOKE HD &amp; AIRBRUSH BRIDAL STUDIO</text>
        
        <!-- Subtitle -->
        <text x="70" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" fill="#E2E2E8" font-weight="300">Couture Bridal Transformations • Destination Weddings • Royal Red &amp; Pastel Glass-Skin</text>
        <text x="70" y="380" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" fill="#B0B0C0" font-weight="300">Flagship Studio: Bhubaneswar, Odisha | Available Pan-India &amp; Globally</text>
        
        <!-- Features pill row -->
        <rect x="70" y="440" width="220" height="50" rx="8" fill="#1C1C24" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.3"/>
        <text x="180" y="471" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#FFFFFF" font-weight="600" text-anchor="middle">★ 5.0 Star Rated (650+)</text>

        <rect x="310" y="440" width="220" height="50" rx="8" fill="#1C1C24" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.3"/>
        <text x="420" y="471" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#FFFFFF" font-weight="600" text-anchor="middle">1,200+ Brides Styled</text>

        <rect x="550" y="440" width="220" height="50" rx="8" fill="#1C1C24" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.3"/>
        <text x="660" y="471" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#FFFFFF" font-weight="600" text-anchor="middle">Dior &amp; Tilbury Vanity</text>
      </svg>
    `);

    // Create 1200x630 background image cropped nicely
    const baseHero = await sharp(heroImgPath)
      .resize(1200, 630, { fit: 'cover', position: 'right top' })
      .toBuffer();

    await sharp(baseHero)
      .composite([{ input: ogSvgOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 88 })
      .toFile(ogJpgPath);

    await sharp(ogJpgPath)
      .webp({ quality: 85 })
      .toFile(ogWebpPath);

    console.log(`✓ Generated ${ogJpgPath}`);
    console.log(`✓ Generated ${ogWebpPath}`);
  }

  // Generate Branded Favicons & App Icons
  console.log('\n--- Generating Favicons & Web Manifest Icons ---');
  const faviconSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B0B0E"/>
          <stop offset="100%" stop-color="#1A1822"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F5E6BE"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#AA7C11"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="url(#bg)"/>
      <circle cx="256" cy="256" r="220" fill="none" stroke="url(#gold)" stroke-width="8" stroke-opacity="0.6"/>
      <circle cx="256" cy="256" r="200" fill="none" stroke="url(#gold)" stroke-width="2" stroke-dasharray="10,10" stroke-opacity="0.4"/>
      
      <!-- Crown / Sparkle Accent -->
      <path d="M256 120 L268 155 L305 160 L275 185 L285 220 L256 195 L227 220 L237 185 L207 160 L244 155 Z" fill="url(#gold)"/>
      
      <!-- Monogram 'R' -->
      <text x="256" y="375" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="240" font-weight="700" fill="url(#gold)" text-anchor="middle">R</text>
    </svg>
  `;

  fs.writeFileSync(path.join(__dirname, '..', 'favicon.svg'), faviconSvg.trim());
  fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg.trim());

  // Convert SVG to PNG icons
  const svgBuffer = Buffer.from(faviconSvg);

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(iconsDir, 'android-chrome-512x512.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(iconsDir, 'android-chrome-192x192.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(iconsDir, 'favicon-32x32.png'));
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(iconsDir, 'favicon-16x16.png'));
  
  // Also copy to root for maximum browser/PWA compatibility
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(__dirname, '..', 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(__dirname, '..', 'favicon.ico'));

  console.log('✓ Created all favicon SVGs and PNG icon assets.');
  console.log('\n=== Image & Asset Optimization Complete! ===\n');
}

optimizeImages().catch(err => {
  console.error('Optimization error:', err);
  process.exit(1);
});
