$sp = $PSScriptRoot
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Add-Type -Path "$sp\Img.cs","$sp\Checker.cs","$sp\Compose.cs" -ReferencedAssemblies System.Drawing
$src = "$root\char-and-back\Sprite boss 2D.png"
$out = "$root\assets"

# Thiên Mệnh: one sheet for the playable hero and the stage 7 boss, in the party layout
# (240x170 cells, body centre x=100, feet y=165, see hdCell in js/party.js), plus an effects sheet.
$CW = 240; $CH = 170; $AX = 100; $FOOT = 165; $K = 0.92

function LegsX($p, $x, $y, $w, $h) {
  $sum = 0; $n = 0
  for ($yy = $y + $h - 30; $yy -lt $y + $h - 4; $yy++) {
    for ($xx = $x; $xx -lt $x + $w; $xx++) { if ($p.D[(($yy * $p.W) + $xx) * 4 + 3] -gt 0) { $sum += $xx; $n++ } }
  }
  if ($n -eq 0) { return $x + $w / 2 }
  return $sum / $n
}

# Frame boxes x, y, w, h in the source (bottom = feet). Row order matches TM_ANIMS in js/party.js.
$rows = @(
  @(@(28,65,67,125), @(117,64,64,126), @(199,65,66,125)),                                   # 0 idle
  @(@(302,66,84,124), @(389,65,88,125), @(481,66,87,124), @(581,66,90,124)),                # 1 run
  @(@(727,61,85,126), @(946,46,91,139), @(1223,76,69,114)),                                 # 2 jump: rise, apex, fall
  @(@(819,267,125,111), @(943,267,118,111)),                                                # 3 atk1
  @(@(1059,268,131,110), @(1187,269,140,109)),                                              # 4 atk2
  @(@(103,472,104,104), @(207,472,114,105)),                                                # 5 atk3 (spin)
  @(,@(922,462,104,113)),                                                                   # 6 cast (dark aura)
  @(,@(1373,727,107,42)),                                                                   # 7 dead
  @(@(207,472,114,105), @(515,472,79,102), @(1048,463,98,110), @(498,653,126,120)),         # 8 spin, beam, summon, destroy
  @(@(206,266,84,112), @(189,663,121,108), @(334,661,126,109), @(555,293,171,85)),          # 9 shield, vanish, appear, roll
  @(@(1221,698,57,72), @(1051,672,64,98), @(350,270,96,108), @(456,275,96,103), @(1323,97,138,97)), # 10 hurt, stunned, dodge x2, landing
  @(),                                                                                      # 11 (unused)
  @(,@(28,65,67,125))                                                                       # 12 portrait
)

$p = [Px]::Load($src)
[Paper]::Key($p, 60)
$sheet = [Px]::Blank($CW * 5, $CH * $rows.Count)
$r = 0
foreach ($row in $rows) {
  $f = 0
  foreach ($fr in $row) {
    $x, $y, $w, $h = $fr
    $lx = LegsX $p $x $y $w $h
    $img = $p.Crop($x, $y, $w, $h)
    $img = $img.Resize([int]($w * $K), [int]($h * $K))
    $sheet.Paste($img, $f * $CW + $AX - [int](($lx - $x) * $K), $r * $CH + $FOOT - $img.H)
    $f++
  }
  $r++
}
$sheet.Save("$out\hero-thienmenh.png")
[Compose]::OnColor($sheet, 60, 70, 90).Save("$env:TEMP\preview_hero-thienmenh.png")
"hero-thienmenh.png: $($sheet.W)x$($sheet.H)"

# Effects, packed left to right; the printed rectangles go into TM_FX in js/thien-menh.js
$fx = [ordered]@{
  crescent  = @(320,484,80,90)
  beam      = @(690,473,202,101)
  dragon    = @(1133,459,186,116)
  bigDragon = @(1332,432,160,144)
  spikes    = @(420,849,69,73)
  burst     = @(349,851,59,70)
  smoke     = @(504,854,54,66)
  orb       = @(188,935,61,57)
  circle    = @(1356,919,72,73)
}
$W = 0; $H = 0
foreach ($k in $fx.Keys) { $W += $fx[$k][2] + 4; $H = [math]::Max($H, $fx[$k][3]) }
$fxSheet = [Px]::Blank($W, $H)
$x = 0; $list = @()
foreach ($k in $fx.Keys) {
  $b = $fx[$k]
  $fxSheet.Paste($p.Crop($b[0], $b[1], $b[2], $b[3]), $x, 0)
  $list += "$k`: { x: $x, y: 0, w: $($b[2]), h: $($b[3]) }"
  $x += $b[2] + 4
}
$fxSheet.Save("$out\fx-thienmenh.png")
[Compose]::OnColor($fxSheet, 60, 70, 90).Save("$env:TEMP\preview_fx-thienmenh.png")
"fx-thienmenh.png: $($fxSheet.W)x$($fxSheet.H)"
$list -join ",`n"
