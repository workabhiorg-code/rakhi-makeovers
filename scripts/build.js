const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('✨ RAKHI MAKEOVERS - CLOUDFLARE PAGES BUILD OPTIMIZER');
console.log('======================================================\n');

// Clean node_modules during Cloudflare Pages CI build so large binaries (like workerd) are not scanned as static assets
const isCloudflare = process.env.CF_PAGES || process.env.CI || process.env.CLOUDFLARE_PAGES;

if (isCloudflare) {
  const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
  if (fs.existsSync(nodeModulesDir)) {
    console.log('🧹 Cleaning node_modules before Cloudflare asset packaging...');
    try {
      fs.rmSync(nodeModulesDir, { recursive: true, force: true });
      console.log('✅ node_modules removed from static assets list.');
    } catch (err) {
      console.warn('⚠️ Could not remove node_modules:', err.message);
    }
  }
}

console.log('🚀 Build optimization complete. Ready for Cloudflare Pages deployment!\n');
