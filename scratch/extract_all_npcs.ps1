Add-Type -AssemblyName System.Drawing

$outDir = "C:\Users\Blito\Projects\OrbitaCalendar\public\assets\sprites\frames"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

function Remove-Bg-And-Save {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$x, [int]$y, [int]$w, [int]$h,
        [string]$name,
        [int]$targetR, [int]$targetG, [int]$targetB,
        [int]$tolerance = 25
    )

    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $crop = $source.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cw = $crop.Width
    $ch = $crop.Height

    # Remove background matching target color
    for ($cy = 0; $cy -lt $ch; $cy++) {
        for ($cx = 0; $cx -lt $cw; $cx++) {
            $c = $crop.GetPixel($cx, $cy)
            $dr = [Math]::Abs($c.R - $targetR)
            $dg = [Math]::Abs($c.G - $targetG)
            $db = [Math]::Abs($c.B - $targetB)

            # Check if close to background color or very dark navy corner
            $isBg = ($dr -le $tolerance -and $dg -le $tolerance -and $db -le $tolerance) -or
                    ($c.R -le 25 -and $c.G -le 35 -and $c.B -le 65 -and ($c.R -lt 30 -and $c.G -lt 40))

            if ($isBg) {
                $crop.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    $dest = "$outDir\$name.png"
    $crop.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    Write-Host "Saved: $name.png"
}

# 1. CAT PIXEL EXTRACT
Write-Host "Extracting Cat Pixel frames..."
$catSrc = [System.Drawing.Bitmap]::FromFile("C:\Users\Blito\Projects\OrbitaCalendar\public\assets\sprites\cat_pixel_sheet.jpg")

# Sitting frames
Remove-Bg-And-Save $catSrc 10 48 110 125 "cat_sit_0" 18 29 51 20
Remove-Bg-And-Save $catSrc 135 48 110 125 "cat_sit_1" 18 29 51 20
Remove-Bg-And-Save $catSrc 260 48 110 125 "cat_sit_2" 18 29 51 20
Remove-Bg-And-Save $catSrc 385 48 110 125 "cat_sit_3" 18 29 51 20 # Blinking

# Sleeping frames
Remove-Bg-And-Save $catSrc 8 240 115 95 "cat_sleep_0" 18 29 51 20
Remove-Bg-And-Save $catSrc 133 240 115 95 "cat_sleep_1" 18 29 51 20
Remove-Bg-And-Save $catSrc 256 240 115 95 "cat_sleep_2" 18 29 51 20
Remove-Bg-And-Save $catSrc 380 240 115 95 "cat_sleep_3" 18 29 51 20

# Stretching frames
Remove-Bg-And-Save $catSrc 25 520 130 140 "cat_stretch_0" 18 29 51 20
Remove-Bg-And-Save $catSrc 165 520 145 140 "cat_stretch_1" 18 29 51 20
Remove-Bg-And-Save $catSrc 315 490 145 170 "cat_stretch_2" 18 29 51 20
Remove-Bg-And-Save $catSrc 495 485 170 175 "cat_stretch_3" 18 29 51 20

# Licking paw frames
Remove-Bg-And-Save $catSrc 30 830 120 150 "cat_lick_0" 18 29 51 20
Remove-Bg-And-Save $catSrc 190 830 120 150 "cat_lick_1" 18 29 51 20
Remove-Bg-And-Save $catSrc 355 830 120 150 "cat_lick_2" 18 29 51 20
Remove-Bg-And-Save $catSrc 525 830 120 150 "cat_lick_3" 18 29 51 20

$catSrc.Dispose()

# 2. GUILD NPCS EXTRACT
Write-Host "Extracting Guild NPCs..."
$npcSrc = [System.Drawing.Bitmap]::FromFile("C:\Users\Blito\Projects\OrbitaCalendar\public\assets\sprites\guild_npcs_sheet.jpg")

# Dwarf Blacksmith at Anvil
Remove-Bg-And-Save $npcSrc 80 50 400 420 "npc_blacksmith" 1 7 55 24

# Elf Alchemist at Table
Remove-Bg-And-Save $npcSrc 580 80 380 400 "npc_alchemist" 1 7 55 24

# Guild Receptionist at Desk
Remove-Bg-And-Save $npcSrc 130 520 360 425 "npc_receptionist" 1 7 55 24

# Priestess of Wisdom
Remove-Bg-And-Save $npcSrc 650 520 220 420 "npc_priestess" 1 7 55 24

$npcSrc.Dispose()

# 3. VAULT & BEDROOM NPCS EXTRACT
Write-Host "Extracting Vault & Bedroom NPCs..."
$vbSrc = [System.Drawing.Bitmap]::FromFile("C:\Users\Blito\Projects\OrbitaCalendar\public\assets\sprites\vault_bedroom_sheet.jpg")

# Goblin Antiquarian / Treasure Collector
Remove-Bg-And-Save $vbSrc 20 25 300 235 "npc_collector_0" 25 35 70 25
Remove-Bg-And-Save $vbSrc 310 280 200 230 "npc_collector_1" 25 35 70 25

# Study Mentor Owl
Remove-Bg-And-Save $vbSrc 740 30 235 230 "npc_owl_stand" 25 35 70 25
Remove-Bg-And-Save $vbSrc 740 275 235 230 "npc_owl_read" 25 35 70 25
Remove-Bg-And-Save $vbSrc 740 770 235 230 "npc_owl_sleep" 25 35 70 25

$vbSrc.Dispose()

Write-Host "All NPCs and Cat frames extracted successfully!"
