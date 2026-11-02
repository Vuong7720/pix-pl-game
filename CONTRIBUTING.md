# Hướng dẫn cùng phát triển

Nhánh `main` là bản đang chạy trên GitHub Pages, nên **không ai push thẳng lên `main`**, kể cả chủ repo. Mọi thay đổi đi qua Pull Request. Ai có quyền vào repo đều tự gộp được Pull Request của mình, miễn là bước **Kiểm tra** báo xanh.

## Lần đầu

```bash
git clone https://github.com/Vuong7720/pix-pl-game.git
cd pix-pl-game
```

Mở `index.html` bằng trình duyệt là chơi được, không cần cài gì. Thêm `?dev` vào cuối địa chỉ (`index.html?dev`) để mở mọi ải, bất tử và Pháp Lực vô hạn khi thử.

## Mỗi lần làm một việc

```bash
git checkout main
git pull                              # lấy bản mới nhất
git checkout -b ten-viec              # ví dụ: them-ai-7, sua-boss-ai
# ... sửa code, chơi thử ...
node tools/check.js                   # cần cài Node.js
git add -A
git commit -m "Mô tả ngắn thay đổi"
git push -u origin ten-viec
```

Sau đó vào trang repo trên GitHub, bấm **Compare & pull request**, điền mẫu có sẵn rồi gửi. Chờ bước **Kiểm tra** báo xanh rồi bấm **Merge pull request**. Sau khoảng 1–2 phút GitHub Pages cập nhật bản mới.

Thay đổi lớn thì nên nhờ người kia xem qua trước khi gộp. Nếu cần sửa thêm: cứ sửa tiếp trên cùng nhánh, commit và `git push` lại, Pull Request tự cập nhật.

## Cấu trúc

Game không cần build: `index.html` nạp lần lượt các file trong `js/`. Các file này là script thường, dùng chung một phạm vi toàn cục, nên **thứ tự nạp quan trọng**. Code chạy ngay khi tải trang chỉ được dùng thứ đã khai báo ở file đứng trước. Code bên trong hàm thì gọi được mọi thứ.

| File | Nội dung |
| --- | --- |
| `index.html` | Khung HTML: canvas, HUD, các bảng menu |
| `css/game.css` | Font và giao diện ngoài canvas |
| `js/core.js` | Canvas, chế độ `?dev`, lưu tiến trình, nâng cấp cửa hàng, hàm dùng chung |
| `js/input.js` | Bàn phím, chuột (chạy được khi bật Unikey) |
| `js/audio.js` | Âm thanh và nhạc |
| `js/assets.js` | Danh sách file hình (`ASSET_FILES`), bố cục sprite, gạch, giao diện từng ải (`THEMES`), hình quái theo ải (`THEME_MOBS`) |
| `js/code-sprites.js` | Sprite vẽ bằng code (sinh vật biển, hang, trời) |
| `js/party.js` | Nhân vật chơi được |
| `js/levels.js` | Bản đồ từng ải (`LEVELS`) và đoạn nối dài tự sinh |
| `js/effects.js` | Camera, hạt, chữ bay, sóng chấn động, vệt chém |
| `js/objects.js` | Đào, rương, cờ hồi sinh, đạn, gai, mạng nhện |
| `js/player.js` | Nhân vật người chơi |
| `js/skills.js` | Thần thông của mọi nhân vật, phân thân |
| `js/monster-chatter.js` | Quái nói chuyện |
| `js/weird.js` | Quái dị và trò troll |
| `js/enemy.js` | Quái và boss |
| `js/world.js` | Cổng, cảnh nền, vẽ màn chơi |
| `js/story.js` | Cốt truyện, câu đố, hộp thoại |
| `js/menus.js` | Bản đồ hành trình, chọn nhân vật, cửa hàng |
| `js/duel.js` | Solo online |
| `js/main.js` | Nút cảm ứng, vòng lặp game, nút bấm, bảng dev, khởi động |

Thư mục khác:

- `assets/`: file hình game dùng. Hình mới thêm vào đây và khai báo trong `ASSET_FILES` (`js/assets.js`).
- `kich_ban/`: cốt truyện và prompt tạo đồ họa.
- `tools/check.js`: kiểm tra cú pháp, tên trùng giữa các file và đủ file hình. GitHub chạy tự động với mỗi Pull Request.
- `tools/smoke.mjs`: mở game trong Chrome, chạy qua từng ải và báo lỗi JavaScript. Chạy tay trước khi gửi PR lớn: `node tools/smoke.mjs` (cần Node 22+ và Chrome).
- `tools/art/`: script biến ảnh vẽ bằng AI thành file trong `assets/`. Xem `tools/art/README.md`.

Thêm file mới vào `js/` thì nhớ thêm thẻ `<script>` vào `index.html`, đặt sau các file mà nó cần lúc nạp.

## Quy ước

- Viết code giống phong cách code xung quanh: tên biến tiếng Anh, chú thích ngắn, chữ hiển thị trong game bằng tiếng Việt.
- Mỗi Pull Request chỉ làm một việc, dễ duyệt hơn.
- Không đưa lên pack hình gốc, file zip hay file backup (đã có trong `.gitignore`).
- Hình mới phải được phép dùng và đăng công khai (ưu tiên giấy phép CC0 / CC-BY).
