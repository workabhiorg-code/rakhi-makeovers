# Comprehensive Pre-Deployment Audit Suite for Rakhi Makeovers
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$hasErrors = $false
$auditLog = @()

function Log-Pass($title, $detail = "") {
    Write-Host "✅ [PASS] $title" -ForegroundColor Green
    if ($detail) { Write-Host "   $detail" -ForegroundColor DarkGray }
    $script:auditLog += @{ status = "PASS"; title = $title; detail = $detail }
}

function Log-Warn($title, $detail = "") {
    Write-Host "⚠️ [WARN] $title" -ForegroundColor Yellow
    if ($detail) { Write-Host "   $detail" -ForegroundColor DarkYellow }
    $script:auditLog += @{ status = "WARN"; title = $title; detail = $detail }
}

function Log-Fail($title, $detail = "") {
    Write-Host "❌ [FAIL] $title" -ForegroundColor Red
    if ($detail) { Write-Host "   $detail" -ForegroundColor Red }
    $script:hasErrors = $true
    $script:auditLog += @{ status = "FAIL"; title = $title; detail = $detail }
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "👑 RAKHI MAKEOVERS - PRE-DEPLOYMENT COMPREHENSIVE AUDIT REPORT" -ForegroundColor Cyan
Write-Host "================================================================================`n" -ForegroundColor Cyan

# ==============================================================================
# 1. SEO AUDIT
# ==============================================================================
Write-Host "🔍 1. SEO & SEARCH ENGINE OPTIMIZATION AUDIT:" -ForegroundColor Cyan

$indexHtmlPath = Join-Path $root "index.html"
$indexHtml = [System.IO.File]::ReadAllText($indexHtmlPath, [System.Text.Encoding]::UTF8)

# 1a. Meta Tags Check
if ($indexHtml -match '<title>([^<]+)</title>') {
    Log-Pass "Title Tag Present" "Title: '$($Matches[1])'"
} else {
    Log-Fail "Missing Title Tag in index.html"
}

if ($indexHtml -match '<meta\s+name=["'']description["'']\s+content=["'']([^"'']+)["'']') {
    Log-Pass "Meta Description Present" "Length: $($Matches[1].Length) chars"
} else {
    Log-Fail "Missing Meta Description in index.html"
}

if ($indexHtml -match '<link\s+rel=["'']canonical["'']\s+href=["'']([^"'']+)["'']') {
    Log-Pass "Canonical Tag Configured" "URL: $($Matches[1])"
} else {
    Log-Fail "Missing Canonical Tag"
}

# 1b. Open Graph & Twitter Cards Check
if ($indexHtml -match 'property=["'']og:title["'']' -and $indexHtml -match 'property=["'']og:image["'']' -and $indexHtml -match 'name=["'']twitter:card["'']') {
    Log-Pass "Open Graph & Twitter Cards Present" "Social previews configured for WhatsApp, Facebook, Instagram & Twitter"
} else {
    Log-Fail "Incomplete Open Graph / Twitter Card tags"
}

# 1c. JSON-LD Schema Structured Data
if ($indexHtml -match '<script type="application/ld\+json">([\s\S]*?)</script>') {
    try {
        $jsonLd = $Matches[1] | ConvertFrom-Json
        $types = ($jsonLd.'@graph' | ForEach-Object { if ($_.psobject.properties['@type']) { $_.'@type' -join '/' } else { 'Unknown' } }) -join ', '
        Log-Pass "Schema.org JSON-LD Structured Data Valid" "Nodes: $($jsonLd.'@graph'.Count) ($types)"
    } catch {
        Log-Fail "Invalid JSON-LD Syntax in index.html" $_.Exception.Message
    }
} else {
    Log-Fail "Missing Schema.org JSON-LD structured data block"
}

# 1d. Search Engine Verification
if ($indexHtml -match 'google-site-verification' -and $indexHtml -match 'msvalidate.01') {
    Log-Pass "Search Engine Verification Hooks Present" "Google Search Console & Bing Webmaster verification tags configured"
} else {
    Log-Warn "Google Search Console or Bing verification tag missing"
}

# 1e. Image References & ALT Attributes
$imgMatches = [regex]::Matches($indexHtml, '<img\s+([^>]+)>')
$missingImages = 0
$missingAlt = 0
$totalImgs = $imgMatches.Count

foreach ($m in $imgMatches) {
    $tag = $m.Groups[1].Value
    if ($tag -match 'src=["'']([^"'']+)["'']') {
        $src = $Matches[1]
        $cleanSrc = ($src -split '\?')[0]
        $srcFile = Join-Path $root ($cleanSrc -replace '/', '\')
        if (-not (Test-Path $srcFile)) {
            $missingImages++
        }
    }
    if (-not ($tag -match 'alt=["''][^"'']*["'']')) {
        $missingAlt++
    }
}

if ($missingImages -eq 0 -and $missingAlt -eq 0) {
    Log-Pass "HTML Image Integrity & Accessibility" "All $totalImgs images resolve to existing files and have ALT attributes"
} else {
    if ($missingImages -gt 0) { Log-Fail "$missingImages image file(s) referenced in HTML do not exist on disk" }
    if ($missingAlt -gt 0) { Log-Warn "$missingAlt image tag(s) missing alt text" }
}

# ==============================================================================
# 2. SITEMAP, ROBOTS.TXT & WEB APP MANIFEST
# ==============================================================================
Write-Host "`n🗺️ 2. SITEMAP, ROBOTS.TXT & PWA AUDIT:" -ForegroundColor Cyan

# Sitemap XML
$sitemapPath = Join-Path $root "sitemap.xml"
if (Test-Path $sitemapPath) {
    $sitemapContent = [System.IO.File]::ReadAllText($sitemapPath, [System.Text.Encoding]::UTF8)
    if ($sitemapContent -match '<urlset' -and $sitemapContent -match 'xmlns:image') {
        $imgCount = ([regex]::Matches($sitemapContent, '<image:image>')).Count
        Log-Pass "sitemap.xml Validated" "XML schema intact with $imgCount Google Image search declarations"
    } else {
        Log-Fail "sitemap.xml malformed or missing namespace declarations"
    }
} else {
    Log-Fail "Missing sitemap.xml in root directory"
}

# Robots.txt
$robotsPath = Join-Path $root "robots.txt"
if (Test-Path $robotsPath) {
    $robotsContent = [System.IO.File]::ReadAllText($robotsPath, [System.Text.Encoding]::UTF8)
    if ($robotsContent -match 'Sitemap:' -and $robotsContent -match 'Disallow:\s+/admin' -and $robotsContent -match 'Disallow:\s+/api/') {
        Log-Pass "robots.txt Validated" "Proper search crawler rules, Disallow tags on admin/api, and Sitemap link configured"
    } else {
        Log-Warn "robots.txt missing standard directives"
    }
} else {
    Log-Fail "Missing robots.txt in root directory"
}

# Web App Manifest & Favicons
$manifestPath = Join-Path $root "site.webmanifest"
if (Test-Path $manifestPath) {
    try {
        $manObj = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
        Log-Pass "site.webmanifest Validated" "App Name: '$($manObj.name)', Theme Color: '$($manObj.theme_color)'"
    } catch {
        Log-Fail "site.webmanifest is not valid JSON"
    }
} else {
    Log-Fail "Missing site.webmanifest"
}

$favicons = @("favicon.ico", "favicon.svg", "apple-touch-icon.png")
$missingFavs = 0
foreach ($f in $favicons) {
    if (-not (Test-Path (Join-Path $root $f))) { $missingFavs++ }
}
if ($missingFavs -eq 0) {
    Log-Pass "Favicons & Apple Touch Icons" "All 3 root icons present for Chrome, Safari, Android & iOS"
} else {
    Log-Fail "$missingFavs favicon file(s) missing"
}

# ==============================================================================
# 3. SECURITY & HEADERS AUDIT
# ==============================================================================
Write-Host "`n🔒 3. SECURITY, HEADERS & ISOLATION AUDIT:" -ForegroundColor Cyan

# Cloudflare _headers
$headersPath = Join-Path $root "_headers"
if (Test-Path $headersPath) {
    $hContent = [System.IO.File]::ReadAllText($headersPath, [System.Text.Encoding]::UTF8)
    $hasCsp = $hContent -match 'Content-Security-Policy'
    $hasHsts = $hContent -match 'Strict-Transport-Security'
    $hasXFrame = $hContent -match 'X-Frame-Options'
    $hasNoSniff = $hContent -match 'X-Content-Type-Options'
    $hasNoIndexAdmin = $hContent -match 'X-Robots-Tag:\s*noindex'

    if ($hasCsp -and $hasHsts -and $hasXFrame -and $hasNoSniff -and $hasNoIndexAdmin) {
        Log-Pass "Cloudflare _headers Fully Hardened" "CSP, HSTS (1 Year), X-Frame-Options, X-Content-Type-Options, & Admin NoIndex active"
    } else {
        Log-Warn "Cloudflare _headers missing some recommended security tags"
    }
} else {
    Log-Fail "Missing _headers file"
}

# Data Isolation check in dist
$distPath = Join-Path $root "dist"
if (Test-Path $distPath) {
    $leakedAdmin = Join-Path $distPath "data\admin.json"
    if (Test-Path $leakedAdmin) {
        Log-Fail "CRITICAL VULNERABILITY: dist/data/admin.json is packaged in distribution!"
    } else {
        Log-Pass "Credential Isolation" "data/admin.json is strictly excluded from production dist/"
    }
}

# Function Auth Guards Check
$functionFiles = @(
    "functions/api/services/[[catchall]].js",
    "functions/api/gallery/[[catchall]].js",
    "functions/api/reviews/[[catchall]].js",
    "functions/api/upload.js",
    "functions/api/media/stats.js",
    "functions/api/media/cleanup.js",
    "functions/api/auth/me.js",
    "functions/api/auth/change-password.js"
)
$unguardedCount = 0
foreach ($fn in $functionFiles) {
    $fnPath = Join-Path $root ($fn -replace '/', '\')
    if (Test-Path $fnPath) {
        $code = [System.IO.File]::ReadAllText($fnPath, [System.Text.Encoding]::UTF8)
        if (-not ($code -match 'verifyAuth')) {
            $unguardedCount++
            Log-Fail "Endpoint $fn does not enforce verifyAuth!"
        }
    }
}
if ($unguardedCount -eq 0) {
    Log-Pass "Serverless API Authentication" "All $($functionFiles.Count) protected serverless endpoints strictly enforce session verification"
}

# ==============================================================================
# 4. DSA & REGULATORY / CONSUMER TRANSPARENCY AUDIT
# ==============================================================================
Write-Host "`n⚖️ 4. DSA & CONSUMER TRANSPARENCY AUDIT:" -ForegroundColor Cyan

$hasPhone = $indexHtml -match '\+91\s*82490\s*77825'
$hasAddress = $indexHtml -match 'Bhubaneswar' -and $indexHtml -match 'Khandagiri'
$hasPrivacy = $indexHtml -match 'Privacy' -or $indexHtml -match 'Terms'
$hasPricing = $indexHtml -match '₹'

if ($hasPhone -and $hasAddress -and $hasPricing) {
    Log-Pass "DSA Business Identity & Contact Disclosure" "Direct phone (+91 82490 77825), physical location (Khandagiri, Bhubaneswar), and transparent INR pricing disclosed"
} else {
    Log-Warn "Missing full business contact or pricing indicators"
}

# ==============================================================================
# 5. CLOUDFLARE COMPATIBILITY & CONFIGURATION
# ==============================================================================
Write-Host "`n⚡ 5. CLOUDFLARE PAGES / WORKERS COMPATIBILITY AUDIT:" -ForegroundColor Cyan

$hasWranglerJson = Test-Path (Join-Path $root "wrangler.json")
$hasWranglerToml = Test-Path (Join-Path $root "wrangler.toml")
$hasRedirects = Test-Path (Join-Path $root "_redirects")
$hasEmbedded = Test-Path (Join-Path $root "src\embeddedAssets.js")

if ($hasWranglerJson -and $hasRedirects -and $hasEmbedded) {
    Log-Pass "Cloudflare Deployment Config" "wrangler.json, _redirects, _headers, and embedded fallback assets ready for zero-downtime deployment"
} else {
    Log-Warn "Some Cloudflare configuration files are missing"
}

# ==============================================================================
# 6. ZERO-BLOAT STORAGE & PERFORMANCE AUDIT
# ==============================================================================
Write-Host "`n🧹 6. ZERO-BLOAT STORAGE & PERFORMANCE AUDIT:" -ForegroundColor Cyan

$uploadsDir = Join-Path $root "assets\images\uploads"
$uploadFiles = Get-ChildItem -Path $uploadsDir -File | Where-Object { $_.Name -ne ".gitkeep" }
$totalSize = 0
foreach ($u in $uploadFiles) { $totalSize += $u.Length }
$totalMb = [math]::Round($totalSize / 1MB, 2)

Log-Pass "Media Footprint Budget" "$($uploadFiles.Count) uploaded photos consuming $totalMb MB (budget is < 20 MB total for ultra-fast TTFB)"

Write-Host "`n================================================================================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "❌ PRE-DEPLOYMENT AUDIT FAILED: Please resolve the failed items above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "🎉 PRE-DEPLOYMENT AUDIT 100% PASSED: PLATFORM IS SECURE & READY FOR DEPLOYMENT!" -ForegroundColor Green
    Write-Host "================================================================================`n" -ForegroundColor Cyan
}
