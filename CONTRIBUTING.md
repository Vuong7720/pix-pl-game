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

- `index.html`: toàn bộ game (HTML, giao diện và code JavaScript).
- `assets/`: các file hình game dùng. Hình mới thêm vào đây và khai báo trong `ASSET_FILES`.
- `tools/check.js`: kiểm tra cú pháp và đủ file hình. GitHub chạy tự động với mỗi Pull Request.

## Quy ước

- Viết code giống phong cách code xung quanh: tên biến tiếng Anh, chú thích ngắn, chữ hiển thị trong game bằng tiếng Việt.
- Mỗi Pull Request chỉ làm một việc, dễ duyệt hơn.
- Không đưa lên pack hình gốc, file zip hay file backup (đã có trong `.gitignore`).
- Hình mới phải được phép dùng và đăng công khai (ưu tiên giấy phép CC0 / CC-BY).
