$sp = $PSScriptRoot
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Add-Type -Path "$sp\Img.cs","$sp\Fx.cs" -ReferencedAssemblies System.Drawing
$tm = "$root\back-ground\thien_mon\Gemini_Generated_Image_"
$out = "$root\assets"
function Unmark($p) { $p.Patch(1135, 618, 64, 62, 1223, 618) }

# Thiên Môn has no sky picture: the rune gate painting, its magenta band filled with a night gradient
$sky = [Px]::Load("${tm}o18e1uo18e1uo18e.png")
Unmark $sky
$sky.Key()
$top = $sky.Top()
# Average colour of the painting just under the band: the gradient ends on it
$sr = 0; $sg = 0; $sb = 0; $n = 0
for ($x = 0; $x -lt $sky.W; $x += 8) { $i = (($top + 3) * $sky.W + $x) * 4; if ($sky.D[$i + 3] -gt 200) { $sb += $sky.D[$i]; $sg += $sky.D[$i + 1]; $sr += $sky.D[$i + 2]; $n++ } }
$end = @(($sr / $n), ($sg / $n), ($sb / $n))
"band=$top end=" + (($end | % { [int]$_ }) -join ",")
$grad = [Px]::Blank($sky.W, $sky.H)
for ($y = 0; $y -lt $sky.H; $y++) {
  $t = [math]::Min(1.0, $y / [double]$top)
  $r = [byte](14 + ($end[0] - 14) * $t); $g = [byte](12 + ($end[1] - 12) * $t); $b = [byte](32 + ($end[2] - 32) * $t)
  for ($x = 0; $x -lt $sky.W; $x++) { $i = ($y * $sky.W + $x) * 4; $grad.D[$i] = $b; $grad.D[$i + 1] = $g; $grad.D[$i + 2] = $r; $grad.D[$i + 3] = 255 }
}
$c = $sky.Crop(0, $top, $sky.W, $sky.H - $top); [Fx]::FeatherTop($c, 70); $sky.Paste($c, 0, $top)
[Fx]::Over($sky, $grad).Save("$out\tm-sky.png")
"tm-sky.png: band=$top"

# Floating stone islands with chains: brown copy far, dark copy near
foreach ($pair in @(@('qabos6qabos6qabo (1)', 'far'), @('qabos6qabos6qabo (2)', 'near'))) {
  $p = [Px]::Load("$tm$($pair[0]).png")
  Unmark $p
  $p.Key()
  $top = $p.Top()
  $p.Crop(0, $top, $p.W, $p.H - $top).Save("$out\tm-$($pair[1]).png")
  "tm-$($pair[1]).png: top=$top"
}
