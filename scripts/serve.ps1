# Local Development & Preview Web Server for Rakhi Makeovers with Auto Photo Cleanup
$port = 5173
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dataDir = Join-Path $root "data"
$uploadsDir = Join-Path $root "assets\images\uploads"

if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
if (-not (Test-Path $uploadsDir)) { New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null }

$mimeTypes = @{
    ".html"        = "text/html; charset=utf-8"
    ".htm"         = "text/html; charset=utf-8"
    ".css"         = "text/css; charset=utf-8"
    ".js"          = "application/javascript; charset=utf-8"
    ".json"        = "application/json; charset=utf-8"
    ".png"         = "image/png"
    ".jpg"         = "image/jpeg"
    ".jpeg"        = "image/jpeg"
    ".webp"        = "image/webp"
    ".avif"        = "image/avif"
    ".gif"         = "image/gif"
    ".svg"         = "image/svg+xml"
    ".ico"         = "image/x-icon"
    ".webmanifest" = "application/manifest+json"
    ".xml"         = "application/xml"
    ".txt"         = "text/plain"
    ".woff"        = "font/woff"
    ".woff2"       = "font/woff2"
    ".ttf"         = "font/ttf"
}

function Read-JsonData($filename, $defaultValue = @()) {
    $filePath = Join-Path $dataDir $filename
    if (Test-Path $filePath) {
        try {
            $raw = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
            return $raw | ConvertFrom-Json
        } catch {
            return $defaultValue
        }
    }
    return $defaultValue
}

function Write-JsonData($filename, $data) {
    $filePath = Join-Path $dataDir $filename
    $json = $data | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($filePath, $json, [System.Text.Encoding]::UTF8)
}

function Is-ImageReferenced($imagePath, $excludeType = $null, $excludeId = $null) {
    if ([string]::IsNullOrWhiteSpace($imagePath)) { return $false }
    $baseTarget = [System.IO.Path]::GetFileName($imagePath)
    if ([string]::IsNullOrWhiteSpace($baseTarget) -or $baseTarget -eq ".gitkeep") { return $true }

    $services = Read-JsonData "services.json"
    foreach ($s in $services) {
        if ($excludeType -eq "service" -and $s.id -eq $excludeId) { continue }
        if ($s.image -and ([System.IO.Path]::GetFileName($s.image) -eq $baseTarget)) { return $true }
    }

    $gallery = Read-JsonData "gallery.json"
    foreach ($g in $gallery) {
        if ($excludeType -eq "gallery" -and $g.id -eq $excludeId) { continue }
        if ($g.image -and ([System.IO.Path]::GetFileName($g.image) -eq $baseTarget)) { return $true }
    }

    $reviews = Read-JsonData "reviews.json"
    foreach ($r in $reviews) {
        if ($excludeType -eq "review" -and $r.id -eq $excludeId) { continue }
        if ($r.avatarImage -and ([System.IO.Path]::GetFileName($r.avatarImage) -eq $baseTarget)) { return $true }
    }

    return $false
}

function Remove-UnusedUpload($imagePath, $excludeType = $null, $excludeId = $null) {
    if ([string]::IsNullOrWhiteSpace($imagePath)) { return $false }
    $clean = $imagePath.Replace('\', '/').TrimStart('/')
    if (-not ($clean.StartsWith("assets/images/uploads/") -or $clean.StartsWith("uploads/"))) { return $false }

    if (Is-ImageReferenced $imagePath $excludeType $excludeId) { return $false }

    $fileName = [System.IO.Path]::GetFileName($imagePath)
    if ([string]::IsNullOrWhiteSpace($fileName) -or $fileName -eq ".gitkeep") { return $false }

    $targetPath = Join-Path $uploadsDir $fileName
    if (Test-Path $targetPath) {
        try {
            Remove-Item -Path $targetPath -Force
            Write-Host "🗑️ [Auto-Clean PS1] Removed old photo: $fileName" -ForegroundColor Yellow
            return $true
        } catch {
            Write-Host "⚠️ [Auto-Clean PS1 Error] Failed to delete: $fileName" -ForegroundColor Red
        }
    }
    return $false
}

function Get-StorageStats() {
    $files = Get-ChildItem -Path $uploadsDir -File | Where-Object { $_.Name -ne ".gitkeep" }
    $totalBytes = 0
    $orphans = @()
    $orphanBytes = 0

    foreach ($f in $files) {
        $totalBytes += $f.Length
        $rel = "assets/images/uploads/" + $f.Name
        if (-not (Is-ImageReferenced $rel)) {
            $orphans += $f.Name
            $orphanBytes += $f.Length
        }
    }

    function Format-Bytes($b) {
        if ($b -lt 1024) { return "$b B" }
        if ($b -lt 1048576) { return [math]::Round($b / 1KB, 1).ToString() + " KB" }
        return [math]::Round($b / 1MB, 2).ToString() + " MB"
    }

    return @{
        totalFiles = $files.Count
        totalSizeBytes = $totalBytes
        totalSizeFormatted = Format-Bytes $totalBytes
        activeFiles = ($files.Count - $orphans.Count)
        orphanCount = $orphans.Count
        orphanSizeBytes = $orphanBytes
        orphanSizeFormatted = Format-Bytes $orphanBytes
        orphanList = $orphans
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "✨ Rakhi Makeovers Luxury Server active at http://localhost:$port/" -ForegroundColor Cyan
} catch {
    Write-Error "Port $port occupied or error: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawPath = $request.Url.AbsolutePath
        
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        # Read body if present
        $bodyString = ""
        if ($request.HasEntityBody) {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $bodyString = $reader.ReadToEnd()
            $reader.Close()
        }

        # ==================== API HANDLERS ====================
        if ($rawPath.StartsWith("/api/")) {
            $response.ContentType = "application/json; charset=utf-8"

            # 1. AUTH
            if ($rawPath -eq "/api/auth/login") {
                $resp = @{ success = $true; token = [System.Guid]::NewGuid().ToString("N"); user = @{ username = "admin" } } | ConvertTo-Json
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
            if ($rawPath -eq "/api/auth/me") {
                $resp = @{ success = $true; user = @{ username = "admin" } } | ConvertTo-Json
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
            if ($rawPath -eq "/api/auth/logout" -or $rawPath -eq "/api/auth/change-password") {
                $resp = @{ success = $true; message = "OK" } | ConvertTo-Json
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            # 2. SERVICES
            if ($rawPath -eq "/api/services" -or $rawPath.StartsWith("/api/services/")) {
                $serviceId = ($rawPath -split '/')[-1]
                $services = Read-JsonData "services.json" @()

                if ($request.HttpMethod -eq "GET") {
                    $bytes = [System.IO.File]::ReadAllBytes((Join-Path $dataDir "services.json"))
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "POST") {
                    $newService = $bodyString | ConvertFrom-Json
                    if (-not $newService.id) { $newService | Add-Member -NotePropertyName "id" -NotePropertyValue ("service-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) }
                    $list = @($services) + @($newService)
                    Write-JsonData "services.json" $list
                    $resp = @{ success = $true; service = $newService } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                    $response.StatusCode = 201
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "PUT" -and $serviceId) {
                    $update = $bodyString | ConvertFrom-Json
                    $index = -1
                    for ($i = 0; $i -lt $services.Count; $i++) {
                        if ($services[$i].id -eq $serviceId) { $index = $i; break }
                    }
                    if ($index -ge 0) {
                        $oldImage = $services[$index].image
                        if ($update.image -and $update.image -ne $oldImage) {
                            Remove-UnusedUpload $oldImage "service" $serviceId
                        }
                        foreach ($prop in $update.PSObject.Properties) {
                            $services[$index].$($prop.Name) = $prop.Value
                        }
                        Write-JsonData "services.json" $services
                        $resp = @{ success = $true; service = $services[$index] } | ConvertTo-Json
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                        $response.StatusCode = 200
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    } else {
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Not found"}')
                        $response.StatusCode = 404
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "DELETE" -and $serviceId) {
                    $target = $services | Where-Object { $_.id -eq $serviceId } | Select-Object -First 1
                    if ($target -and $target.image) {
                        Remove-UnusedUpload $target.image "service" $serviceId
                    }
                    $filtered = @($services | Where-Object { $_.id -ne $serviceId })
                    Write-JsonData "services.json" $filtered
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Deleted"}')
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }
            }

            # 3. GALLERY
            if ($rawPath -eq "/api/gallery" -or $rawPath.StartsWith("/api/gallery/")) {
                $galleryId = ($rawPath -split '/')[-1]
                $gallery = Read-JsonData "gallery.json" @()

                if ($request.HttpMethod -eq "GET") {
                    $bytes = [System.IO.File]::ReadAllBytes((Join-Path $dataDir "gallery.json"))
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "POST") {
                    $newItem = $bodyString | ConvertFrom-Json
                    if (-not $newItem.id) { $newItem | Add-Member -NotePropertyName "id" -NotePropertyValue ("gallery-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) }
                    $list = @($gallery) + @($newItem)
                    Write-JsonData "gallery.json" $list
                    $resp = @{ success = $true; item = $newItem } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                    $response.StatusCode = 201
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "PUT" -and $galleryId) {
                    $update = $bodyString | ConvertFrom-Json
                    $index = -1
                    for ($i = 0; $i -lt $gallery.Count; $i++) {
                        if ($gallery[$i].id -eq $galleryId) { $index = $i; break }
                    }
                    if ($index -ge 0) {
                        $oldImage = $gallery[$index].image
                        if ($update.image -and $update.image -ne $oldImage) {
                            Remove-UnusedUpload $oldImage "gallery" $galleryId
                        }
                        foreach ($prop in $update.PSObject.Properties) {
                            $gallery[$index].$($prop.Name) = $prop.Value
                        }
                        Write-JsonData "gallery.json" $gallery
                        $resp = @{ success = $true; item = $gallery[$index] } | ConvertTo-Json
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                        $response.StatusCode = 200
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    } else {
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Not found"}')
                        $response.StatusCode = 404
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "DELETE" -and $galleryId) {
                    $target = $gallery | Where-Object { $_.id -eq $galleryId } | Select-Object -First 1
                    if ($target -and $target.image) {
                        Remove-UnusedUpload $target.image "gallery" $galleryId
                    }
                    $filtered = @($gallery | Where-Object { $_.id -ne $galleryId })
                    Write-JsonData "gallery.json" $filtered
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Deleted"}')
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }
            }

            # 4. REVIEWS
            if ($rawPath -eq "/api/reviews" -or $rawPath.StartsWith("/api/reviews/")) {
                $reviewId = ($rawPath -split '/')[-1]
                $reviews = Read-JsonData "reviews.json" @()

                if ($request.HttpMethod -eq "GET") {
                    $bytes = [System.IO.File]::ReadAllBytes((Join-Path $dataDir "reviews.json"))
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "POST") {
                    $newRev = $bodyString | ConvertFrom-Json
                    if (-not $newRev.id) { $newRev | Add-Member -NotePropertyName "id" -NotePropertyValue ("review-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) }
                    $list = @($reviews) + @($newRev)
                    Write-JsonData "reviews.json" $list
                    $resp = @{ success = $true; review = $newRev } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                    $response.StatusCode = 201
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "PUT" -and $reviewId) {
                    $update = $bodyString | ConvertFrom-Json
                    $index = -1
                    for ($i = 0; $i -lt $reviews.Count; $i++) {
                        if ($reviews[$i].id -eq $reviewId) { $index = $i; break }
                    }
                    if ($index -ge 0) {
                        $oldAvatar = $reviews[$index].avatarImage
                        if ($update.avatarImage -and $update.avatarImage -ne $oldAvatar) {
                            Remove-UnusedUpload $oldAvatar "review" $reviewId
                        }
                        foreach ($prop in $update.PSObject.Properties) {
                            $reviews[$index].$($prop.Name) = $prop.Value
                        }
                        Write-JsonData "reviews.json" $reviews
                        $resp = @{ success = $true; review = $reviews[$index] } | ConvertTo-Json
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                        $response.StatusCode = 200
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    } else {
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Not found"}')
                        $response.StatusCode = 404
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "DELETE" -and $reviewId) {
                    $target = $reviews | Where-Object { $_.id -eq $reviewId } | Select-Object -First 1
                    if ($target -and $target.avatarImage) {
                        Remove-UnusedUpload $target.avatarImage "review" $reviewId
                    }
                    $filtered = @($reviews | Where-Object { $_.id -ne $reviewId })
                    Write-JsonData "reviews.json" $filtered
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Deleted"}')
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }
            }

            # 5. STORAGE & ORPHAN CLEANUP
            if ($rawPath -eq "/api/media/stats") {
                $stats = Get-StorageStats
                $resp = @{ success = $true; stats = $stats } | ConvertTo-Json -Depth 5
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            if ($rawPath -eq "/api/media/cleanup") {
                $stats = Get-StorageStats
                $delCount = 0
                $freedBytes = 0
                foreach ($orphanName in $stats.orphanList) {
                    $target = Join-Path $uploadsDir $orphanName
                    if (Test-Path $target) {
                        $len = (Get-Item $target).Length
                        Remove-Item $target -Force -ErrorAction SilentlyContinue
                        $delCount++
                        $freedBytes += $len
                    }
                }
                $newStats = Get-StorageStats
                $resp = @{
                    success = $true
                    deletedCount = $delCount
                    freedBytes = $freedBytes
                    freedFormatted = [math]::Round($freedBytes / 1MB, 2).ToString() + " MB"
                    stats = $newStats
                } | ConvertTo-Json -Depth 5
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            # 6. UPLOAD
            if ($rawPath -eq "/api/upload" -and $request.HttpMethod -eq "POST") {
                try {
                    $payload = $bodyString | ConvertFrom-Json
                    $base64 = $payload.data
                    if ($base64 -match "^data:image\/([a-zA-Z0-9+]+);base64,(.+)$") {
                        $base64 = $Matches[2]
                    }
                    $binBytes = [System.Convert]::FromBase64String($base64)
                    $ext = ".jpg"
                    if ($binBytes.Length -gt 8) {
                        if ($binBytes[0] -eq 0x89 -and $binBytes[1] -eq 0x50) { $ext = ".png" }
                        elseif ($binBytes[0] -eq 0x52 -and $binBytes[1] -eq 0x49) { $ext = ".webp" }
                    }
                    $fileName = "upload_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() + "_" + ([System.Guid]::NewGuid().ToString().Substring(0,8)) + $ext
                    $savePath = Join-Path $uploadsDir $fileName
                    [System.IO.File]::WriteAllBytes($savePath, $binBytes)
                    
                    $publicUrl = "assets/images/uploads/$fileName"
                    $resp = @{ success = $true; url = $publicUrl } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } catch {
                    $resp = @{ success = $false; message = "Upload failed: $_" } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                    $response.StatusCode = 500
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $response.Close()
                continue
            }

            # Fallback
            $respText = '{"success":true,"message":"OK"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($respText)
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Static File Serving
        $cleanPath = $rawPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($cleanPath)) {
            $cleanPath = "index.html"
        } elseif ($cleanPath -eq "admin" -or $cleanPath -eq "admin/") {
            $cleanPath = "admin.html"
        }

        # Disallow admin.json direct HTTP inspection
        if ($cleanPath.ToLower().Contains("admin.json")) {
            $response.StatusCode = 403
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Forbidden"}')
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        $targetFile = Join-Path $root ($cleanPath -replace '/', '\')

        if (Test-Path $targetFile -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
            if ($mimeTypes.ContainsKey($ext)) {
                $response.ContentType = $mimeTypes[$ext]
            } else {
                $response.ContentType = "application/octet-stream"
            }

            $bytes = [System.IO.File]::ReadAllBytes($targetFile)
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFoundFile = Join-Path $root "404.html"
            if (Test-Path $notFoundFile) {
                $bytes = [System.IO.File]::ReadAllBytes($notFoundFile)
                $response.StatusCode = 404
                $response.ContentType = "text/html; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        $response.Close()
    } catch {
        # ignore client disconnects
    }
}
