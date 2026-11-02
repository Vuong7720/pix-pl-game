param([string[]]$Only)
$sp = $PSScriptRoot
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Add-Type -Path "$sp\Img.cs","$sp\Checker.cs" -ReferencedAssemblies System.Drawing
$src = "$root\back-ground\ground"
$out = "$root\assets"

# Every Gemini tileset uses the same template; caps are swapped (the "top-left" tile is drawn as a right end)
$stages = @(
  @{ n = 'hoa_diem_son'; code = 'hds'; prop = @(1101, 531, 270, 235) },
  @{ n = 'bach_cot_dong'; code = 'bcd'; prop = @(1101, 573, 270, 193) },
  @{ n = 'long_cung';    code = 'lc';  prop = @(1100, 566, 272, 202) },
  @{ n = 'dong_ban_to';  code = 'btd'; prop = $null },
  @{ n = 'thien_cung';   code = 'tc';  prop = @(1132, 563, 216, 172) },
  @{ n = 'thien_mon';    code = 'tm';  prop = @(1148, 526, 189, 228) }
)
$k = 0.8
function ScaleK($p) { return $p.Resize([int][math]::Round($p.W * $k), [int][math]::Round($p.H * $k)) }
function MirrorPair($p) { $m = [Px]::Blank($p.W * 2, $p.H); $m.Paste($p, 0, 0); $m.Paste($p.FlipX(), $p.W, 0); return $m }

foreach ($s in $stages) {
  if ($Only -and -not ($Only -contains $s.code)) { continue }
  $t = [Px]::Load("$src\$($s.n).png")
  [Checker]::Key($t, 185)
  $capW = 120
  # Row 1: ground top, also drawn smaller as the floating ledge. Caps start at y=25: crop the middle there too so the surfaces line up.
  $top = [Px]::Blank($capW + 2 * 440 + $capW, 156)
  $top.Paste($t.Crop(966, 25, $capW, 156), 0, 0)
  $top.Paste((MirrorPair $t.Crop(422, 25, 440, 156)), $capW, 0)
  $top.Paste($t.Crop(347 - $capW, 25, $capW, 156), $capW + 880, 0)
  # Row 2: fill under the top, same column layout
  $fill = [Px]::Blank($top.W, 180)
  $fill.Paste($t.Crop(6, 196, $capW, 180), 0, 0)
  $fill.Paste((MirrorPair $t.Crop(422, 196, 440, 180)), $capW, 0)
  $fill.Paste($t.Crop(877 + 300 - $capW, 196, $capW, 180), $capW + 880, 0)

  $top = ScaleK $top; $fill = ScaleK $fill
  $small = ScaleK $t.Crop(888, 558, 150, 156)
  $prop = if ($s.prop) { ScaleK $t.Crop($s.prop[0], $s.prop[1], $s.prop[2], $s.prop[3]) } else { $null }
  $y2 = $top.H; $y4 = $y2 + $fill.H + 4
  $h = $y4 + [math]::Max($small.H, $(if ($prop) { $prop.H } else { 0 }))
  $sheet = [Px]::Blank([math]::Max($top.W, $small.W + 4 + $(if ($prop) { $prop.W } else { 0 })), $h)
  $sheet.Paste($top, 0, 0); $sheet.Paste($fill, 0, $y2); $sheet.Paste($small, 0, $y4)
  if ($prop) { $sheet.Paste($prop, $small.W + 4, $y4) }
  $sheet.Save("$out\$($s.code)-tiles.png")
  "$($s.code): sheet $($sheet.W)x$($sheet.H) top=$($top.W)x$($top.H) cap=$([math]::Round($capW*$k)) fill y=$y2 h=$($fill.H) small 0,$y4 $($small.W)x$($small.H) prop " + $(if ($prop) { "$($small.W + 4),$y4 $($prop.W)x$($prop.H)" } else { '-' })
}

