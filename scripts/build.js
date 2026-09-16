const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('✨ RAKHI MAKEOVERS - CLOUDFLARE BUILD PIPELINE');
console.log('======================================================\n');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Recreate dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all production website files into dist/
const itemsToCopy = [
  'index.html',
  'admin.html',
  'admin',
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
  'data'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
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

console.log('\n🎉 Build successful! dist/ is clean (no node_modules) and ready for Cloudflare deployment!\n');
