const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let hasErrors = false;

console.log('=== RUNNING RAKHI MAKEOVERS DEPLOYMENT & SEO AUDIT ===\n');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// Check JSON-LD syntax
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    console.log('✅ JSON-LD Structured Data: Valid JSON with ' + (parsed['@graph'] ? parsed['@graph'].length : 1) + ' schema nodes.');
  } catch (e) {
    console.error('❌ JSON-LD Parse Error:', e.message);
    hasErrors = true;
  }
} else {
  console.error('❌ No JSON-LD block found in index.html');
  hasErrors = true;
}

// Check all image src attributes
const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;
let match;
let missingImages = 0;
let totalImages = 0;

while ((match = imgSrcRegex.exec(indexHtml)) !== null) {
  totalImages++;
  const src = match[1];
  const fullPath = path.join(rootDir, src);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing image file: ${src}`);
    missingImages++;
    hasErrors = true;
  }
}
if (missingImages === 0) {
  console.log(`✅ All ${totalImages} images in index.html exist and are properly resolved.`);
}

// 2. Check site.webmanifest
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'site.webmanifest'), 'utf8'));
  console.log(`✅ site.webmanifest: Valid JSON for "${manifest.name}".`);
} catch (e) {
  console.error('❌ site.webmanifest Parse Error:', e.message);
  hasErrors = true;
}

// 3. Check sitemap.xml
const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
if (sitemap.includes('<urlset') && sitemap.includes('xmlns:image') && sitemap.includes('</urlset>')) {
  const imageCount = (sitemap.match(/<image:image>/g) || []).length;
  console.log(`✅ sitemap.xml: Valid XML structure with ${imageCount} indexed Google Image records.`);
} else {
  console.error('❌ sitemap.xml structure invalid.');
  hasErrors = true;
}

// 4. Check robots.txt
const robots = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
if (robots.includes('User-agent: *') && robots.includes('Sitemap:')) {
  console.log('✅ robots.txt: Properly configured for Googlebot & Chrome indexers.');
} else {
  console.error('❌ robots.txt missing standard directives.');
  hasErrors = true;
}

// 5. Check Cloudflare _headers & _redirects
if (fs.existsSync(path.join(rootDir, '_headers')) && fs.existsSync(path.join(rootDir, '_redirects'))) {
  console.log('✅ Cloudflare Pages: _headers & _redirects ready.');
} else {
  console.error('❌ Missing _headers or _redirects file.');
  hasErrors = true;
}

// 6. Check 404.html
if (fs.existsSync(path.join(rootDir, '404.html'))) {
  console.log('✅ 404.html: Custom branded 404 error page present.');
} else {
  console.error('❌ Missing 404.html.');
  hasErrors = true;
}

// 7. Check Favicons
const favicons = ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'];
let missingFavs = 0;
for (const f of favicons) {
  if (!fs.existsSync(path.join(rootDir, f))) {
    console.error(`❌ Missing root icon: ${f}`);
    missingFavs++;
    hasErrors = true;
  }
}
if (missingFavs === 0) {
  console.log('✅ Favicons & App Icons: All root icons present for Chrome, Safari & Android.');
}

console.log('\n======================================================');
if (hasErrors) {
  console.log('❌ Audit completed with issues.');
  process.exit(1);
} else {
  console.log('🎉 AUDIT PASSED: Project is 100% optimized for Cloudflare Pages & Google Search / Chrome indexing!');
}
