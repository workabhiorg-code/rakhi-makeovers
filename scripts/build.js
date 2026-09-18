const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('✨ RAKHI MAKEOVERS - SECURE CLOUDFLARE BUILD PIPELINE');
console.log('======================================================\n');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Recreate dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Files and directories explicitly excluded from production distribution
const EXCLUDED_PATHS = [
  'admin.json',
  '.DS_Store',
  'Thumbs.db'
];

// Generate embedded fallback assets for standalone Cloudflare Worker deployments
const srcDir = path.join(rootDir, 'src');
const adminHtmlContent = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
const indexHtmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const notFoundHtmlContent = fs.readFileSync(path.join(rootDir, '404.html'), 'utf8');
const adminCssContent = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'admin.css'), 'utf8');
const adminJsContent = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'admin.js'), 'utf8');

const embeddedAssetsJs = `// Auto-generated embedded assets for Cloudflare Worker fallback
export const ADMIN_HTML = ${JSON.stringify(adminHtmlContent)};
export const INDEX_HTML = ${JSON.stringify(indexHtmlContent)};
export const NOT_FOUND_HTML = ${JSON.stringify(notFoundHtmlContent)};
export const ADMIN_CSS = ${JSON.stringify(adminCssContent)};
export const ADMIN_JS = ${JSON.stringify(adminJsContent)};
`;

fs.writeFileSync(path.join(srcDir, 'embeddedAssets.js'), embeddedAssetsJs, 'utf8');
console.log(' ✓ Generated src/embeddedAssets.js (Cloudflare Worker resilient fallback)');

// Copy all production website files into dist/
const itemsToCopy = [
  'index.html',
  'admin.html',
  '404.html',
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  '_headers',
  '_redirects',
  'assets',
  'data',
  'functions',
  'src'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  const baseName = path.basename(src);

  if (EXCLUDED_PATHS.includes(baseName)) {
    console.log(` 🛡️  Excluded sensitive file from build: ${baseName}`);
    return;
  }

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (EXCLUDED_PATHS.includes(file)) {
        console.log(` 🛡️  Excluded sensitive file from build: ${file}`);
        continue;
      }
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const item of itemsToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(distDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(` ✓ Packaged ${item} -> dist/${item}`);
  }
}

// Security Assertion: Ensure admin.json is never present in dist
const leakedAdminJson = path.join(distDir, 'data', 'admin.json');
if (fs.existsSync(leakedAdminJson)) {
  console.error('\n❌ CRITICAL SECURITY ERROR: admin.json leaked into dist/! Aborting build.');
  fs.rmSync(leakedAdminJson, { force: true });
  process.exit(1);
}

console.log('\n🎉 Build successful! dist/ is clean, hardened, and ready for Cloudflare deployment!\n');
