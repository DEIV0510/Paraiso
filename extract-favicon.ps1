# Genera favicons en varios tamaños desde la imagen oficial proporcionada
# por el cliente. SIN recortes, SIN modificaciones — solo resize bicubic.

Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\Lenovo\Downloads\favicon3.png'
$outDir = 'C:\Users\Lenovo\OneDrive\Escritorio\Claude\Sesiones\paraisos\assets\images'

# Cargar la imagen original en memoria
$bytes = [System.IO.File]::ReadAllBytes($src)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$img = [System.Drawing.Image]::FromStream($ms)
$bmp = New-Object System.Drawing.Bitmap($img)
$img.Dispose(); $ms.Dispose()

Write-Host "Origen: $($bmp.Width) x $($bmp.Height)"

# Copia íntegra (1:1) para los tamaños grandes y el archivo "base"
Copy-Item $src (Join-Path $outDir 'favicon-source.png') -Force
Write-Host "Copia íntegra guardada como favicon-source.png"

# Generar resizes para los tamaños estándar de favicon
$sizes = @(512, 192, 64, 32, 16)
foreach ($s in $sizes) {
    $dst = New-Object System.Drawing.Bitmap $s, $s
    $gx = [System.Drawing.Graphics]::FromImage($dst)
    $gx.Clear([System.Drawing.Color]::Transparent)
    $gx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Si la imagen origen NO es cuadrada, la centramos preservando aspect ratio.
    $srcW = $bmp.Width; $srcH = $bmp.Height
    if ($srcW -eq $srcH) {
        $dstRect = New-Object System.Drawing.Rectangle 0, 0, $s, $s
    } else {
        $ratio = [Math]::Min($s / $srcW, $s / $srcH)
        $dw = [int]($srcW * $ratio)
        $dh = [int]($srcH * $ratio)
        $offX = [int](($s - $dw) / 2)
        $offY = [int](($s - $dh) / 2)
        $dstRect = New-Object System.Drawing.Rectangle $offX, $offY, $dw, $dh
    }
    $srcRect = New-Object System.Drawing.Rectangle 0, 0, $srcW, $srcH
    $gx.DrawImage($bmp, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gx.Dispose()

    $outPath = Join-Path $outDir "favicon-$s.png"
    $dst.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    $f = Get-Item $outPath
    Write-Host ("  favicon-{0}.png  ·  {1} KB" -f $s, [Math]::Round($f.Length/1024, 1))
}
$bmp.Dispose()
Write-Host "Listo."
