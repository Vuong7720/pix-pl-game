# Script tách ảnh

Biến ảnh vẽ bằng AI (Gemini, GPT) trong `back-ground/` thành file game dùng trong `assets/`.

Các script này xóa logo ngôi sao Gemini, tách nền magenta, ô caro giả hoặc nền giấy, cắt từng khung hình rồi ghép thành sprite sheet.

Chỉ chạy được trên Windows (dùng PowerShell và System.Drawing). Thư mục `back-ground/` không đưa lên Git, nên chỉ máy nào có ảnh gốc mới chạy được.

Chạy từ thư mục gốc của repo. **Mỗi script chạy trong một tiến trình riêng**, vì PowerShell không nạp lại được thư viện `.cs` lần thứ hai:

```powershell
powershell -NoProfile -File tools\art\build-tiles.ps1
powershell -NoProfile -Command "& .\tools\art\build-mobs.ps1 -Only mob-imp,mob-bull"
```

| Script | Đọc từ `back-ground/` | Ghi ra `assets/` |
| --- | --- | --- |
| `build-backgrounds.ps1` | `<ải>/Gemini_Generated_Image_*.png` | `<mã>-sky.png`, `<mã>-far.png`, `<mã>-near.png` của ải 2–6 |
| `build-thien-mon.ps1` | `thien_mon/` | `tm-sky.png` (ghép từ ảnh cổng), `tm-far.png`, `tm-near.png` |
| `build-tiles.ps1` | `ground/<ải>.png` | `<mã>-tiles.png` (thêm `-Only tc` để chỉ làm một ải) |
| `build-bosses.ps1` | `boss/*.png` | `boss-nguma.png`, `boss-bachcot.png` |
| `build-mobs.ps1` | `enemy/ai1.png` … `ai7.png` | `mob-*.png` (thêm `-Only mob-imp` để chỉ làm một con) |
| `build-thien-menh.ps1` | `char-and-back/Sprite boss 2D.png` | `hero-thienmenh.png` (nhân vật và boss ải 7), `fx-thienmenh.png` (hiệu ứng) |

Mã ải: `hqs` Hoa Quả Sơn, `hds` Hỏa Diệm Sơn, `bcd` Bạch Cốt Động, `lc` Long Cung, `btd` Bàn Tơ Động, `tc` Thiên Cung, `tm` Thiên Môn.

Ảnh xem trước sprite (đặt trên nền tối) được lưu vào `%TEMP%\preview_*.png`.

## Khi tạo lại một ảnh

- **Nền**: tên file Gemini ghi trong bảng ở đầu `build-backgrounds.ps1` và `build-thien-mon.ps1`. Đổi sang tên file mới rồi chạy lại.
- **Gạch**: mọi bộ gạch dùng chung một bố cục (theo prompt mục 2). Ghi đè `ground/<ải>.png` rồi chạy lại là được. Nếu đồ trang trí nằm chỗ khác, sửa tọa độ `prop`.
- **Quái và boss**: mỗi khung hình ghi bằng tọa độ `x, y, rộng, cao` trong ảnh gốc, theo thứ tự hàng: đi, đánh, bị đánh, chết. Ảnh mới thì tọa độ sẽ khác. Cách tìm tọa độ:

  ```powershell
  Add-Type -Path tools\art\Img.cs,tools\art\Checker.cs -ReferencedAssemblies System.Drawing
  $p = [Px]::Load("back-ground\enemy\ai1.png"); [Paper]::Key($p, 60); $p.Blobs(300)
  ```

  Lệnh này in ra khung bao của từng hình trên nền giấy.

## Thư viện

- `Img.cs`: lớp `Px` dùng để đọc, cắt, dán, lật, đổi cỡ ảnh và tách nền magenta.
- `Checker.cs`: tách nền ô caro giả (`Checker`) và nền giấy (`Paper`).
- `Fx.cs`: làm mờ mép trên (`FeatherTop`), ghép ảnh lên nền (`Over`), khử ám hồng (`Spill`).
- `Compose.cs`: đặt sprite lên nền màu để xem trước.
