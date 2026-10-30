# Prompt tạo đồ họa cho Thiên Mệnh Phá Toái

Prompt viết bằng tiếng Anh vì model tạo ảnh hiểu tiếng Anh chính xác hơn.

## Quy tắc chung (để tôi tách asset được)

- **Mỗi lần chỉ tạo 1 ảnh, 1 chủ đề.** Không gộp nhân vật với nền.
- **Nền phẳng một màu** `#FF00FF` (hồng magenta) cho nhân vật, quái, vật phẩm và UI. Không dùng "transparent": GPT hay vẽ ô caro giả, rất khó tách (ảnh `ngo_khong.png` hôm trước bị đúng lỗi này).
- **Không có chữ, nhãn hay số** trong ảnh. Bạn ghi chú bằng tin nhắn khi gửi cho tôi.
- **Khổ ảnh:** chọn landscape 1536×1024 (trừ khi prompt ghi khác).
- Nếu ảnh hỏng (lệch khung, chữ lạ, nhân vật bị cắt), tạo lại rồi mới gửi.
- Khi gửi, ghi kèm: tên file, ảnh thuộc ải nào, mỗi hàng là gì.

## Khối phong cách (dán vào ĐẦU mọi prompt)

**Không dùng khối này một mình**: nếu chỉ dán khối phong cách, GPT/Gemini sẽ vẽ một cảnh hoàn chỉnh (có nhân vật, dính liền các lớp) và không tách thành asset được. Luôn ghép khối này với một prompt ở các mục bên dưới. Ải 1 đã làm xong theo cách này; với các ải sau, nên tạo trong cùng cuộc trò chuyện và thêm câu *"Match the art style and palette of the previous image."*

```
Style: detailed 16-bit pixel art, SNES-era, crisp pixels, no anti-aliasing blur,
limited palette, strong dark outlines, Chinese mythology (Journey to the West) theme.
Side-view 2D platformer game asset. Light source from top-left.
No text, no labels, no numbers, no watermark, no UI frame.
```

Với sprite (nhân vật, quái, vật phẩm, UI) thêm khối này:

```
Solid flat #FF00FF magenta background filling the whole image, no checkerboard,
no shadows on the background, no gradient. Every sprite separated by at least
40 px of empty magenta space, none touching or overlapping. Nothing cut off at the edges.
```

---

## 1. Nền parallax cho từng ải (ưu tiên cao nhất)

Mỗi ải cần **3 ảnh riêng**: bầu trời, lớp xa, lớp gần. Lớp xa và lớp gần là dải nằm ngang, nối liền được khi lặp lại.

### 1a. Bầu trời (1 ảnh mỗi ải)
```
[KHỐI PHONG CÁCH]
A wide pixel art sky backdrop for a side-scrolling game, {SKY}.
Horizontal composition, horizon in the lower third, no ground, no characters.
The left and right edges must match so the image tiles seamlessly horizontally.
```

### 1b. Lớp xa (núi/kiến trúc mờ phía xa)
```
[KHỐI PHONG CÁCH]
A horizontal parallax background layer for a side-scrolling game: {FAR}.
Silhouettes only in the bottom 60% of the image, low contrast, desaturated, hazy.
The top 40% is solid flat #FF00FF magenta (it will be made transparent).
The left and right edges must match so it tiles seamlessly horizontally.
```

### 1c. Lớp gần (cây cối/kiến trúc gần hơn)
```
[KHỐI PHONG CÁCH]
A horizontal parallax foreground-background layer for a side-scrolling game: {NEAR}.
Shapes rise from the bottom edge and occupy the bottom 50%, more detail and contrast
than a distant layer but still darker than gameplay objects.
Everything above is solid flat #FF00FF magenta.
The left and right edges must match so it tiles seamlessly horizontally.
```

### Thay {SKY} / {FAR} / {NEAR} theo ải

| Ải | {SKY} | {FAR} | {NEAR} |
|---|---|---|---|
| 1 Hoa Quả Sơn | warm sunset sky, soft clouds, faint cracks of golden light in the sky | misty green mountain peaks with waterfalls, Chinese ink-painting shapes | peach trees with pink blossoms, bamboo, mossy rocks |
| 2 Hỏa Diệm Sơn | blood-red smoky sky, falling embers | jagged volcanic mountains with glowing lava rivers | burnt dead trees, smoking black rocks, lava glow at the bottom |
| 3 Bạch Cốt Động | dim purple cave darkness with pale green ghost lights | cave walls with huge skeletal ribs and skulls | stalagmites made of bones, hanging chains, pale torches |
| 4 Long Cung | deep blue underwater light rays, bubbles | distant underwater palace with Chinese roofs, coral reef | coral, swaying seaweed, jade pillars |
| 5 Bàn Tơ Động | dark violet cave, moonlight through a hole | cave walls covered in giant spider webs | thick web strands, cocoons hanging, glowing purple mushrooms |
| 6 Thiên Cung | bright golden heavenly sky above the clouds | floating celestial palaces with golden roofs on clouds | white jade railings, red pillars, sea of clouds |
| 7 Thiên Môn | cracked night sky, broken stars, glowing golden runes floating | colossal ancient gate made of stone and light, giant rotating rune circle | broken floating stone platforms, chains of light |

---

## 2. Tileset mặt đất (1 ảnh mỗi ải)

```
[KHỐI PHONG CÁCH] [KHỐI SPRITE]
A pixel art platformer tileset for {THEME}, arranged on a strict grid of 64x64 px tiles.
Include: top-left / top / top-right ground edge tiles, left / center / right fill tiles,
bottom edge tiles, a 3-tile floating platform (left, middle, right), a single small
floating block, a vertical wall tile, one decoration tile for {DECOR}.
All tiles seamless with each other, orthogonal side view, no perspective.
```

| Ải | {THEME} | {DECOR} |
|---|---|---|
| 1 | grassy mountain earth with mossy stone | peach, flowers |
| 2 | cracked black volcanic rock with glowing orange lava cracks | small fire |
| 3 | grey bone-filled cave stone | skull |
| 4 | blue-green coral stone and jade tiles | shell, pearl |
| 5 | dark purple rock covered in spider silk | cocoon |
| 6 | white jade marble with gold trim and clouds underneath | lotus |
| 7 | ancient stone engraved with glowing golden runes | rune crystal |

---

## 3. Quái thường (thay lợn rừng, ốc sên, ong)

Mỗi quái 1 ảnh. Bố cục giống ảnh nhân vật hôm trước.

```
[KHỐI PHONG CÁCH] [KHỐI SPRITE]
A sprite sheet of {ENEMY}, facing right, side view, about 120 px tall, same scale in every frame.
Row 1: walk cycle, 6 frames.
Row 2: attack, 4 frames.
Row 3: hurt, 1 frame; death, 3 frames.
Frames evenly spaced in a grid, feet aligned on the same baseline in each row.
```

Gợi ý {ENEMY}:
- Ải 1: `a small mischievous monkey-demon soldier with a wooden club`; `a heavenly soldier in silver armor with a spear` (thiên binh tiên phong)
- Ải 2: `a fire imp with burning horns`; `a bull-headed demon soldier`
- Ải 3: `a skeleton warrior with a rusted sword`; `a floating ghost lantern`
- Ải 4: `a shrimp soldier with a trident`; `a crab general with a big shield`
- Ải 5: `a giant purple spider`; `a spider-woman servant with silk claws`
- Ải 6: `a golden-armored heavenly guard with a halberd`; `a flying celestial crane warrior`
- Ải 7: `a faceless puppet soldier made of glowing runes and chains`

---

## 4. Boss

```
[KHỐI PHONG CÁCH] [KHỐI SPRITE]
A boss sprite sheet of {BOSS}, facing left, side view, about 250 px tall, same scale in every frame.
Row 1: idle, 4 frames.
Row 2: walk or charge, 6 frames.
Row 3: attack 1 (melee), 4 frames.
Row 4: attack 2 ({SPECIAL}), 4 frames, plus 2 separate projectile/effect sprites.
Row 5: enraged pose, 2 frames; defeated, 3 frames.
Frames evenly spaced in a grid, feet aligned on the same baseline in each row.
```

| Boss | {BOSS} | {SPECIAL} |
|---|---|---|
| Ngưu Ma Vương | the Bull Demon King, huge muscular bull-headed warrior in dark iron armor, giant iron staff | slams the ground, fire shockwave |
| Bạch Cốt Tinh | the White Bone Demon, pale elegant woman in white robes with a ghostly skeletal form showing through | throws floating bone shards |
| Thiên Mệnh Pháp Tướng | the Avatar of Heavenly Destiny, a towering faceless deity made of golden light, stone and floating runes, six arms holding a scroll, a sword, chains and a rune wheel, a giant eye on its chest | fires a beam of runes from its chest eye |

(Long Vương, Nhện Tinh, Nhị Lang Thần đã có hình vẽ bằng code. Nếu muốn đồng bộ với hero thì dùng cùng prompt này.)

---

## 5. Giao diện (HUD, menu)

### 5a. Bộ khung HUD
```
[KHỐI PHONG CÁCH] [KHỐI SPRITE]
A pixel art game UI kit in Chinese imperial style: red lacquer, gold trim, jade accents.
Include separately:
1. an empty horizontal health bar frame (long, thin, 400x40 px), with a round portrait slot on the left
2. an empty horizontal mana bar frame (same size as 1, blue jade accents)
3. a square skill slot frame (64x64 px), normal state
4. the same skill slot frame, highlighted/glowing state
5. a large empty dialogue box (wide rectangle, parchment interior, gold dragon corners)
6. an empty boss health bar frame (very long, with demon/skull ornaments on both ends)
7. a small coin icon (Chinese copper coin with square hole)
8. a small heart / life icon (peach)
All frames empty inside: no bars filled, no portraits, no text.
```

### 5b. Nút và bảng menu
```
[KHỐI PHONG CÁCH] [KHỐI SPRITE]
A pixel art menu UI kit in Chinese imperial style: red lacquer, gold trim, scroll paper.
Include separately: a horizontal button (normal), the same button (hovered, glowing gold),
a large vertical scroll panel (unrolled paper with wooden rods top and bottom),
a small square close button, a left arrow and a right arrow button, a lock icon,
a checkmark icon. All buttons empty, no text.
```

---

## 6. Màn hình tiêu đề và bản đồ thế giới

### 6a. Màn hình tiêu đề (1536×1024)
```
[KHỐI PHONG CÁCH]
Title screen illustration: the Monkey King standing on a cliff of Flower Fruit Mountain,
golden staff on his shoulder, cape blowing in the wind, seen from behind at a 3/4 angle,
looking up at a sky cracked open with golden light and a giant ancient gate faintly visible
among the clouds. Epic, dramatic composition. Leave empty sky in the upper middle
for the game title (do not draw any title text).
```

### 6b. Bản đồ hành trình (1536×1024)
```
[KHỐI PHONG CÁCH]
Top-down fantasy world map painted on an old Chinese scroll, journey to the west.
From bottom-left to top-right: a green mountain with peach trees, a volcano with lava,
a dark cave with bones, a sea with an underwater palace, a cave covered in spider webs,
a golden palace on clouds, and at the top-right a mysterious gate in a cracked starry sky.
A winding dotted path connects all seven places. No text, no labels, no markers.
```

### 6c. Tranh kể chuyện (mở đầu và kết thúc, mỗi cảnh 1 ảnh)
```
[KHỐI PHONG CÁCH]
Story illustration, cinematic, wide 3:2: {SCENE}. No text.
```
- Mở đầu: `night on Flower Fruit Mountain, the Monkey King and the monk Tang Sanzang look up as stars vanish one by one and a bell rings from the sky`
- Kết thúc A: `the Monkey King shatters a giant golden rune circle, light washing over the three realms`
- Kết thúc B: `the Monkey King walks away from a great gate, one lone star shaped like a stone shining apart from the others`

---

## Thứ tự nên làm

1. Nền + tileset ải 1 (thử trước để chốt phong cách, rồi mới làm các ải khác)
2. Bộ khung HUD
3. Nền + tileset ải 2–7
4. Boss Ngưu Ma Vương, Bạch Cốt Tinh, Thiên Mệnh Pháp Tướng
5. Quái thường
6. Màn hình tiêu đề, bản đồ, tranh kể chuyện
