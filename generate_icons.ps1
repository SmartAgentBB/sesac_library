Add-Type -AssemblyName System.Drawing

function Create-BookIcon([int]$size, [string]$filePath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(0, 102, 255),
        [System.Drawing.Color]::FromArgb(0, 70, 180),
        45.0
    )
    $g.FillRectangle($brush, $rect)

    # Stylized White Book icon
    $midX = [float]($size * 0.5)
    $topY = [float]($size * 0.28)
    $botY = [float]($size * 0.68)
    $leftX = [float]($size * 0.22)
    $rightX = [float]($size * 0.78)
    $dipY = [float]($size * 0.35)
    $botDipY = [float]($size * 0.75)

    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($size * 0.05))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Left Page
    $leftPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leftPath.AddBezier($leftX, $topY, ($leftX + $midX) * 0.5, $topY - ($size * 0.03), ($leftX + $midX) * 0.5, $dipY, $midX, $dipY)
    $leftPath.AddLine($midX, $dipY, $midX, $botDipY)
    $leftPath.AddBezier($midX, $botDipY, ($leftX + $midX) * 0.5, $botDipY, ($leftX + $midX) * 0.5, $botY - ($size * 0.03), $leftX, $botY)
    $leftPath.CloseFigure()
    
    $leftFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 242, 255))
    $g.FillPath($leftFill, $leftPath)
    $g.DrawPath($pen, $leftPath)

    # Right Page
    $rightPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rightPath.AddBezier($midX, $dipY, ($rightX + $midX) * 0.5, $dipY, ($rightX + $midX) * 0.5, $topY - ($size * 0.03), $rightX, $topY)
    $rightPath.AddLine($rightX, $topY, $rightX, $botY)
    $rightPath.AddBezier($rightX, $botY, ($rightX + $midX) * 0.5, $botY - ($size * 0.03), ($rightX + $midX) * 0.5, $botDipY, $midX, $botDipY)
    $rightPath.CloseFigure()

    $rightFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPath($rightFill, $rightPath)
    $g.DrawPath($pen, $rightPath)

    # Spine Center Line
    $spinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0, 80, 200), [float]($size * 0.03))
    $g.DrawLine($spinePen, $midX, $dipY, $midX, $botDipY)

    # Save
    $dir = [System.IO.Path]::GetDirectoryName($filePath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-BookIcon -size 192 -filePath "c:\Users\USER\github\sesac_library\icons\icon-192.png"
Create-BookIcon -size 512 -filePath "c:\Users\USER\github\sesac_library\icons\icon-512.png"
Write-Host "PWA icons created successfully!"
