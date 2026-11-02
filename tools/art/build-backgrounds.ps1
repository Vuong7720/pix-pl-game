$sp = $PSScriptRoot
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Add-Type -Path "$sp\Img.cs","$sp\Fx.cs" -ReferencedAssemblies System.Drawing
$bg = "$root\back-ground"
$out = "$root\assets"

# Gemini sparkle watermark: same place in every image; cover it with the area just left of it
function Unmark($p) { $p.Patch(1135, 618, 64, 62, 1223, 618) }

$sets = @(
  @{ code = 'hds'; dir = 'hoa_diem_son';  sky = '3dis4m3dis4m3dis'; far = 'roiye8roiye8roiy'; near = '3dis4m3dis4m3dis' },
  @{ code = 'bcd'; dir = 'bach_cot_dong'; sky = 'p83cubp83cubp83c'; far = 'debikedebikedebi'; near = 'xzf7s9xzf7s9xzf7' },
  @{ code = 'lc';  dir = 'long_cung';     sky = 'vdkgwovdkgwovdkg'; far = 'ynnjxhynnjxhynnj'; near = '8d0cs68d0cs68d0c' },
  @{ code = 'btd'; dir = 'dong_ban_to';   sky = 'i2ozb7i2ozb7i2oz'; far = 'r51314r51314r513'; near = 'k3hxb0k3hxb0k3hx' },
  @{ code = 'tc';  dir = 'thien_cung';    sky = 'jqxveqjqxveqjqxv'; far = 'mz72eomz72eomz72'; near = 'rcwzx3rcwzx3rcwz' }
)
$sets[0].sky = 'vzp1kovzp1kovzp1'

foreach ($s in $sets) {
  $sky = [Px]::Load("$bg\$($s.dir)\Gemini_Generated_Image_$($s.sky).png")
  Unmark $sky
  $sky.Save("$out\$($s.code)-sky.png")
  foreach ($layer in @('far', 'near')) {
    $p = [Px]::Load("$bg\$($s.dir)\Gemini_Generated_Image_$($s[$layer]).png")
    Unmark $p
    $p.Key()
    if ($s.code -eq "lc") { [Spill]::Demagenta($p, 0.85) }
    $top = $p.Top()
    $c = $p.Crop(0, $top, $p.W, $p.H - $top)
    # A full-width painting cut flat by the magenta band: soften that straight edge
    $fill = [Fx]::RowFill($c, 3)
    if ($fill -gt 0.9) { [Fx]::FeatherTop($c, 90) }
    $c.Save("$out\$($s.code)-$layer.png")
    "$($s.code)-$layer.png: top=$top size=$($c.W)x$($c.H) firstRowFill=$([math]::Round($fill, 2))"
  }
}

