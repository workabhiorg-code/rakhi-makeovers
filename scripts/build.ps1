# PowerShell Production Build Pipeline for Rakhi Makeovers
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$src = Join-Path $root "src"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "✨ RAKHI MAKEOVERS - SECURE PRODUCTION BUILD PIPELINE" -ForegroundColor Cyan
Write-Host "======================================================`n" -ForegroundColor Cyan

# 1. Clean dist
if (Test-Path $dist) {
    Remove-Item -Path $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $dist -Force | Out-Null

# 2. Generate embeddedAssets.js for Cloudflare Worker resilient fallback
$adminHtml = [System.IO.File]::ReadAllText((Join-Path $root "admin.html"), [System.Text.Encoding]::UTF8)
$indexHtml = [System.IO.File]::ReadAllText((Join-Path $root "index.html"), [System.Text.Encoding]::UTF8)
$notFoundHtml = [System.IO.File]::ReadAllText((Join-Path $root "404.html"), [System.Text.Encoding]::UTF8)
$adminCss = [System.IO.File]::ReadAllText((Join-Path $root "assets\css\admin.css"), [System.Text.Encoding]::UTF8)
$adminJs = [System.IO.File]::ReadAllText((Join-Path $root "assets\js\admin.js"), [System.Text.Encoding]::UTF8)

function Json-EscapeString($str) {
    return ($str | ConvertTo-Json -Compress)
}

$embeddedContent = @"
// Auto-generated embedded assets for Cloudflare Worker fallback
export const ADMIN_HTML = $(Json-EscapeString $adminHtml);
export const INDEX_HTML = $(Json-EscapeString $indexHtml);
export const NOT_FOUND_HTML = $(Json-EscapeString $notFoundHtml);
export const ADMIN_CSS = $(Json-EscapeString $adminCss);
export const ADMIN_JS = $(Json-EscapeString $adminJs);
"@

[System.IO.File]::WriteAllText((Join-Path $src "embeddedAssets.js"), $embeddedContent, [System.Text.Encoding]::UTF8)
Write-Host " ✓ Generated src/embeddedAssets.js" -ForegroundColor Green

# 3. Copy production items to dist
$items = @(
    "index.html",
    "admin.html",
    "404.html",
    "favicon.ico",
    "favicon.svg",
    "apple-touch-icon.png",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
    "_headers",
    "_redirects",
    "assets",
    "data",
    "functions",
    "src"
)

$excludedNames = @("admin.json", ".DS_Store", "Thumbs.db")

function Copy-ItemRecursive($srcPath, $dstPath) {
    $baseName = [System.IO.Path]::GetFileName($srcPath)
    if ($excludedNames -contains $baseName) {
        Write-Host " 🛡️ Excluded sensitive/unneeded file: $baseName" -ForegroundColor Yellow
        return
    }

    if (Test-Path $srcPath -PathType Container) {
        New-Item -ItemType Directory -Path $dstPath -Force | Out-Null
        $children = Get-ChildItem -Path $srcPath
        foreach ($child in $children) {
            if ($excludedNames -contains $child.Name) {
                Write-Host " 🛡️ Excluded sensitive/unneeded file: $($child.Name)" -ForegroundColor Yellow
                continue
            }
            Copy-ItemRecursive $child.FullName (Join-Path $dstPath $child.Name)
        }
    } else {
        Copy-Item -Path $srcPath -Destination $dstPath -Force
    }
}

foreach ($item in $items) {
    $srcPath = Join-Path $root $item
    $dstPath = Join-Path $dist $item
    if (Test-Path $srcPath) {
        Copy-ItemRecursive $srcPath $dstPath
        Write-Host " ✓ Packaged $item -> dist/$item" -ForegroundColor Green
    }
}

# 4. Security Check: Assert admin.json is NOT in dist
$leakedAdmin = Join-Path $dist "data\admin.json"
if (Test-Path $leakedAdmin) {
    Write-Host "`n❌ CRITICAL SECURITY ERROR: admin.json leaked into dist! Removing..." -ForegroundColor Red
    Remove-Item -Path $leakedAdmin -Force
    exit 1
}

Write-Host "`n🎉 Production build completed successfully in dist/" -ForegroundColor Cyan
