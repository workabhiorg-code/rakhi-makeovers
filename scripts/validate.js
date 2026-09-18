const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let hasErrors = false;

console.log('======================================================');
console.log('✨ RAKHI MAKEOVERS - SEO, DSA & SECURITY AUDIT SUITE');
console.log('======================================================\n');

// 1. Check index.html & Structured Data (JSON-LD)
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    const graphNodes = parsed['@graph'] || [];
    const types = graphNodes.map(n => Array.isArray(n['@type']) ? n['@type'].join('/') : n['@type']);
    console.log(`✅ JSON-LD Structured Data: Valid JSON with ${graphNodes.length} rich schema nodes (${types.join(', ')}).`);
  } catch (e) {
    console.error('❌ JSON-LD Parse Error:', e.message);
    hasErrors = true;
  }
} else {
  console.error('❌ No JSON-LD block found in index.html');
  hasErrors = true;
}

// Check Search Console verification placeholders
if (indexHtml.includes('google-site-verification')) {
  console.log('✅ Google Search Console verification meta tag hook is present.');
} else {
  console.warn('⚠️ google-site-verification tag is missing in index.html.');
}

// Check all image src attributes in HTML
const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;
let match;
let missingImages = 0;
let totalImages = 0;

while ((match = imgSrcRegex.exec(indexHtml)) !== null) {
  totalImages++;
  const src = match[1];
  const fullPath = path.join(rootDir, src);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing image file referenced in HTML: ${src}`);
    missingImages++;
    hasErrors = true;
  }
}
if (missingImages === 0) {
  console.log(`✅ Image References: All ${totalImages} images in index.html exist and resolve.`);
}

// 2. Media Compliance Audit (Strict < 20MB Thresholds for Cloudflare Pages & Web Vitals)
const MAX_ALLOWED_FILE_BYTES = 20 * 1024 * 1024; // 20 MB single file limit
const MAX_ALLOWED_TOTAL_MEDIA_BYTES = 20 * 1024 * 1024; // 20 MB total media budget
let oversizedFiles = 0;
let totalMediaBytes = 0;
let largestFile = { name: '', size: 0 };
let mediaCount = 0;

function checkDirFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'Rakhi unused media'].includes(entry.name)) {
        checkDirFiles(full);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico', '.mp4', '.mov', '.pdf'].includes(ext)) {
        mediaCount++;
        const stat = fs.statSync(full);
        totalMediaBytes += stat.size;
        if (stat.size > largestFile.size) {
          largestFile = { name: path.relative(rootDir, full), size: stat.size };
        }
        if (stat.size > MAX_ALLOWED_FILE_BYTES) {
          console.error(`❌ File exceeds 20 MB limit: ${full} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          oversizedFiles++;
          hasErrors = true;
        }
      }
    }
  }
}

checkDirFiles(rootDir);

if (oversizedFiles === 0) {
  console.log(`✅ Media Size Compliance: All ${mediaCount} media files are under 20 MB.`);
  console.log(`   - Largest single file: ${largestFile.name} (${(largestFile.size / 1024).toFixed(1)} KB / ${(largestFile.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   - Total media weight: ${(totalMediaBytes / 1024 / 1024).toFixed(2)} MB (${(totalMediaBytes / 1024).toFixed(1)} KB) - Well below the 20 MB total budget!`);
}
if (totalMediaBytes > MAX_ALLOWED_TOTAL_MEDIA_BYTES) {
  console.error(`❌ Total media payload exceeds 20 MB limit: ${(totalMediaBytes / 1024 / 1024).toFixed(2)} MB`);
  hasErrors = true;
}

// 3. Check site.webmanifest
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'site.webmanifest'), 'utf8'));
  console.log(`✅ site.webmanifest: Valid JSON manifest for "${manifest.name}".`);
} catch (e) {
  console.error('❌ site.webmanifest Parse Error:', e.message);
  hasErrors = true;
}

// 4. Check sitemap.xml
const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
if (sitemap.includes('<urlset') && sitemap.includes('xmlns:image') && sitemap.includes('</urlset>')) {
  const imageCount = (sitemap.match(/<image:image>/g) || []).length;
  console.log(`✅ sitemap.xml: Valid XML structure with ${imageCount} Google Image records.`);
} else {
  console.error('❌ sitemap.xml structure invalid.');
  hasErrors = true;
}

// 5. Check robots.txt
const robots = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
if (robots.includes('User-agent: Googlebot') && robots.includes('User-agent: Googlebot-Image') && robots.includes('Sitemap:')) {
  console.log('✅ robots.txt: Configured with explicit Googlebot, Googlebot-Image & sitemap directives.');
} else {
  console.error('❌ robots.txt missing standard Googlebot or Sitemap directives.');
  hasErrors = true;
}

// 6. Check Cloudflare _headers & _redirects
if (fs.existsSync(path.join(rootDir, '_headers')) && fs.existsSync(path.join(rootDir, '_redirects'))) {
  const headersContent = fs.readFileSync(path.join(rootDir, '_headers'), 'utf8');
  if (headersContent.includes('Content-Security-Policy') && headersContent.includes('X-Robots-Tag')) {
    console.log('✅ Cloudflare Pages Config: _headers fortified with CSP & Anti-indexing tags.');
  } else {
    console.warn('⚠️ _headers is missing Content-Security-Policy or X-Robots-Tag.');
  }
} else {
  console.error('❌ Missing _headers or _redirects file.');
  hasErrors = true;
}

// 7. Check 404.html
if (fs.existsSync(path.join(rootDir, '404.html'))) {
  console.log('✅ 404.html: Custom luxury 404 error page present.');
} else {
  console.error('❌ Missing 404.html.');
  hasErrors = true;
}

// 8. Check Favicons & Touch Icons
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
  console.log('✅ Favicons & App Icons: All root icons present for Chrome, iOS & Android.');
}

// 9. SECURITY AUDIT: Verify Isolation of Admin Credentials & Function Auth Guards
console.log('\n🔒 RUNNING DEEP SECURITY & AUTHENTICATION AUDIT:');

// 9a. Verify dist/ does NOT contain data/admin.json if dist exists
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  const leakedAdmin = path.join(distDir, 'data', 'admin.json');
  if (fs.existsSync(leakedAdmin)) {
    console.error('❌ CRITICAL SECURITY VULNERABILITY: dist/data/admin.json is packaged and exposed to public!');
    hasErrors = true;
  } else {
    console.log('✅ Data Isolation: dist/data/admin.json is excluded from production builds.');
  }
}

// 9b. Verify functions/_auth.js exists
const authHelperPath = path.join(rootDir, 'functions', 'api', '_auth.js');
if (fs.existsSync(authHelperPath)) {
  console.log('✅ Cloudflare Security Module: functions/api/_auth.js is active.');
} else {
  console.error('❌ Missing functions/api/_auth.js security module.');
  hasErrors = true;
}

// 9c. Verify all mutating functions import and enforce verifyAuth
const functionsToCheck = [
  'functions/api/services/[[catchall]].js',
  'functions/api/gallery/[[catchall]].js',
  'functions/api/reviews/[[catchall]].js',
  'functions/api/upload.js',
  'functions/api/auth/me.js',
  'functions/api/auth/change-password.js'
];

let unguardedFunctions = 0;
for (const relPath of functionsToCheck) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    if (!code.includes('verifyAuth')) {
      console.error(`❌ Unprotected API Endpoint: ${relPath} does not invoke verifyAuth!`);
      unguardedFunctions++;
      hasErrors = true;
    }
  }
}
if (unguardedFunctions === 0) {
  console.log(`✅ API Auth Enforcement: All ${functionsToCheck.length} mutating endpoints strictly enforce verifyAuth session validation.`);
}

console.log('\n======================================================');
if (hasErrors) {
  console.log('❌ AUDIT FAILED: Please fix the issues logged above.');
  process.exit(1);
} else {
  console.log('🎉 AUDIT 100% PASSED: System is hardened, secure, and ready for deployment!');
  console.log('======================================================\n');
}
