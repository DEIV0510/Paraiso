# =====================================================================
# PARAISOS — Servidor HTTP local sin dependencias externas.
# Usa System.Net.HttpListener que viene incluido en .NET / Windows.
# Sirve la carpeta donde está este script en http://localhost:8080
# =====================================================================

param(
    [int]$Port = 8080,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Url  = "http://localhost:$Port/"

# Mapa de Content-Type por extensión
$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.otf'  = 'font/otf'
    '.txt'  = 'text/plain; charset=utf-8'
    '.md'   = 'text/markdown; charset=utf-8'
    '.pdf'  = 'application/pdf'
    '.mp4'  = 'video/mp4'
    '.webm' = 'video/webm'
    '.mp3'  = 'audio/mpeg'
    '.wav'  = 'audio/wav'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Url)

try {
    $listener.Start()
} catch [System.Net.HttpListenerException] {
    Write-Host ""
    Write-Host "  [ERROR] No se pudo abrir el puerto $Port." -ForegroundColor Red
    Write-Host "  Probablemente ya hay un servidor corriendo. Cierra el otro o cambia de puerto:" -ForegroundColor Yellow
    Write-Host "    .\start-server.ps1 -Port 8081" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "  =============================================================" -ForegroundColor Cyan
Write-Host "   PARAISOS · Servidor local listo" -ForegroundColor White
Write-Host "  =============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "    URL:     $Url" -ForegroundColor Green
Write-Host "    Raiz:    $Root"
Write-Host "    Detener: Ctrl+C  (o cierra esta ventana)"
Write-Host ""
Write-Host "  =============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $NoOpen) {
    Start-Process $Url | Out-Null
}

# Loop principal
while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
    } catch {
        break
    }
    $req  = $ctx.Request
    $resp = $ctx.Response

    # Resolver path
    $path = $req.Url.LocalPath
    if ([string]::IsNullOrEmpty($path) -or $path -eq '/') { $path = '/index.html' }
    # Decodificar URL (espacios %20, etc)
    $relative = [System.Uri]::UnescapeDataString($path.TrimStart('/'))
    # Normalizar separadores y prevenir path-traversal
    $relative = $relative -replace '/', '\'
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
    $rootFull = [System.IO.Path]::GetFullPath($Root)

    $status = 404
    $bytes  = $null
    $ctype  = 'application/octet-stream'

    if ($fullPath.StartsWith($rootFull) -and (Test-Path $fullPath -PathType Leaf)) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            if ($mime.ContainsKey($ext)) { $ctype = $mime[$ext] }
            $status = 200
        } catch {
            $status = 500
        }
    }

    $resp.StatusCode = $status
    $resp.Headers.Add('Cache-Control', 'no-cache')
    if ($status -eq 200) {
        $resp.ContentType = $ctype
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $msg = "$status · $($req.Url.AbsolutePath)"
        $body = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $resp.ContentType = 'text/plain; charset=utf-8'
        $resp.ContentLength64 = $body.Length
        $resp.OutputStream.Write($body, 0, $body.Length)
    }

    # Log compacto
    $color = if ($status -eq 200) { 'DarkGray' } else { 'Yellow' }
    Write-Host ("  {0}  {1}  {2}" -f $status, $req.HttpMethod.PadRight(4), $req.Url.AbsolutePath) -ForegroundColor $color

    $resp.OutputStream.Close()
    $resp.Close()
}

$listener.Stop()
