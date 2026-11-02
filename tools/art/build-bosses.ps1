$sp = $PSScriptRoot
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Add-Type -Path "$sp\Img.cs","$sp\Checker.cs","$sp\Compose.cs" -ReferencedAssemblies System.Drawing
$src = "$root\back-ground\boss"
$out = "$root\assets"

# Output cells: 280x190, body centre at x=140, feet at y=184
$CW = 280; $CH = 190; $AX = 140; $FOOT = 184

# Body centre of a frame: mean x of the opaque pixels in the legs band (above the shadow line)
function LegsX($p, $x, $y, $w, $h) {
  $sum = 0; $n = 0
  for ($yy = $y + $h - 40; $yy -lt $y + $h - 6; $yy++) {
    for ($xx = $x; $xx -lt $x + $w; $xx++) { if ($p.D[(($yy * $p.W) + $xx) * 4 + 3] -gt 0) { $sum += $xx; $n++ } }
  }
  if ($n -eq 0) { return $x + $w / 2 }
  return $sum / $n
}

# Frame boxes x, y, w, h (bottom = feet / shadow line), rows in game order
$bosses = @(
  @{ file = 'nguu_ma_vuong'; name = 'boss-nguma'; rows = @(
    @(@(573,22,121,159), @(731,28,112,153), @(871,25,113,156)),                          # walk
    @(@(25,209,165,156), @(192,200,112,164), @(1008,39,156,142), @(1172,39,161,142)),  # windup x2, charge x2
    @(@(155,406,161,171), @(321,403,190,174), @(522,438,200,138)),                       # leap: raise, swing, slam
    @(@(485,610,163,141), @(671,624,159,127)),                                           # hurt
    @(@(671,624,159,127), @(848,636,144,127), @(1001,690,168,70), @(1193,613,158,138)),  # death
    @(@(51,596,136,155), @(251,593,191,158))                                             # rage
  ) },
  @{ file = 'bach_cot_tinh'; name = 'boss-bachcot'; rows = @(
    @(@(596,31,97,150), @(714,31,126,150), @(868,31,124,150)),
    @(@(46,215,112,149), @(197,206,101,159), @(1021,40,143,141), @(1164,40,169,141)),
    @(@(31,20,141,161), @(206,20,141,161), @(378,20,142,161)),
    @(@(516,613,118,138), @(680,639,123,112)),
    @(@(680,639,123,112), @(849,650,132,115), @(1004,679,165,78), @(1193,613,157,138)),
    @(@(49,601,135,150), @(223,590,259,162))
  ) }
)

foreach ($b in $bosses) {
  $p = [Px]::Load("$src\$($b.file).png")
  [Paper]::Key($p, 60)
  $sheet = [Px]::Blank($CW * 4, $CH * $b.rows.Count)
  $r = 0
  foreach ($row in $b.rows) {
    $f = 0
    foreach ($fr in $row) {
      $x, $y, $w, $h = $fr
      $lx = LegsX $p $x $y $w $h
      $sheet.Paste($p.Crop($x, $y, $w, $h), $f * $CW + $AX - [int]($lx - $x), $r * $CH + $FOOT - $h)
      $f++
    }
    $r++
  }
  $sheet.Save("$out\$($b.name).png")
  [Compose]::OnColor($sheet, 60, 70, 90).Save("$env:TEMP\preview_$($b.name).png")
  "$($b.name): $($sheet.W)x$($sheet.H)"
}
