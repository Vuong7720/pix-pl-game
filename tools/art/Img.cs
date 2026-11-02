using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

public class Px {
    public int W, H; public byte[] D; // BGRA
    public static Px Load(string p) {
        using (var b0 = new Bitmap(p)) {
            var b = new Bitmap(b0.Width, b0.Height, PixelFormat.Format32bppArgb);
            using (var g = Graphics.FromImage(b)) g.DrawImage(b0, 0, 0, b0.Width, b0.Height);
            var r = FromBitmap(b); b.Dispose(); return r;
        }
    }
    public static Px FromBitmap(Bitmap b) {
        var px = new Px { W = b.Width, H = b.Height, D = new byte[b.Width * b.Height * 4] };
        var bd = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        for (int y = 0; y < b.Height; y++) Marshal.Copy(bd.Scan0 + y * bd.Stride, px.D, y * b.Width * 4, b.Width * 4);
        b.UnlockBits(bd); return px;
    }
    public Bitmap ToBitmap() {
        var b = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var bd = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        for (int y = 0; y < H; y++) Marshal.Copy(D, y * W * 4, bd.Scan0 + y * bd.Stride, W * 4);
        b.UnlockBits(bd); return b;
    }
    public void Save(string p) { using (var b = ToBitmap()) b.Save(p, ImageFormat.Png); }
    int I(int x, int y) { return (y * W + x) * 4; }
    public string At(int x, int y) { int i = I(x, y); return D[i + 2] + "," + D[i + 1] + "," + D[i] + "," + D[i + 3]; }

    bool IsKey(int i) {
        int b = D[i], g = D[i + 1], r = D[i + 2];
        return r > 150 && b > 150 && Math.Min(r, b) - g > 110;
    }

    // Magenta -> transparent, then remove pink spill on the 2px border of what is left
    public void Key() {
        var key = new bool[W * H];
        for (int p = 0; p < W * H; p++) key[p] = IsKey(p * 4);
        for (int p = 0; p < W * H; p++) if (key[p]) { D[p * 4 + 3] = 0; }
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
            int p = y * W + x; if (key[p]) continue;
            bool edge = false;
            for (int dy = -2; dy <= 2 && !edge; dy++) for (int dx = -2; dx <= 2; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < W && ny < H && key[ny * W + nx]) { edge = true; break; }
            }
            if (!edge) continue;
            int i = p * 4; int b = D[i], g = D[i + 1], r = D[i + 2];
            int ex = Math.Min(r, b) - g;
            if (ex > 60) { D[i + 3] = 0; continue; }   // mostly magenta: drop
            if (ex > 0) { D[i + 2] = (byte)(r - ex); D[i] = (byte)(b - ex); }
        }
    }

    // Bounding boxes of opaque blobs (4-connected), area >= minArea
    public string Blobs(int minArea) {
        var seen = new bool[W * H]; var sb = new StringBuilder(); var st = new Stack<int>();
        for (int s = 0; s < W * H; s++) {
            if (seen[s] || D[s * 4 + 3] == 0) continue;
            int x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0; st.Push(s); seen[s] = true;
            while (st.Count > 0) {
                int p = st.Pop(); int x = p % W, y = p / W; n++;
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
                int[] nb = { x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1 };
                foreach (int q in nb) if (q >= 0 && !seen[q] && D[q * 4 + 3] != 0) { seen[q] = true; st.Push(q); }
            }
            if (n >= minArea) sb.AppendLine(x0 + " " + y0 + " " + (x1 - x0 + 1) + " " + (y1 - y0 + 1) + " n=" + n);
        }
        return sb.ToString();
    }

    public Px Crop(int x, int y, int w, int h) {
        var o = new Px { W = w, H = h, D = new byte[w * h * 4] };
        for (int r = 0; r < h; r++) Buffer.BlockCopy(D, I(x, y + r), o.D, r * w * 4, w * 4);
        return o;
    }
    public void Paste(Px s, int x, int y) {
        for (int r = 0; r < s.H; r++) for (int c = 0; c < s.W; c++) {
            int tx = x + c, ty = y + r; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
            Buffer.BlockCopy(s.D, (r * s.W + c) * 4, D, I(tx, ty), 4);
        }
    }
    // Copy a rectangle of this image onto itself (watermark patching)
    public void Patch(int sx, int sy, int w, int h, int dx, int dy) { Paste(Crop(sx, sy, w, h), dx, dy); }

    public Px Resize(int w, int h) {
        using (var src = ToBitmap()) using (var dst = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(dst)) {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingMode = CompositingMode.SourceCopy;
                using (var wa = new ImageAttributes()) {
                    wa.SetWrapMode(WrapMode.TileFlipXY);
                    g.DrawImage(src, new Rectangle(0, 0, w, h), 0, 0, W, H, GraphicsUnit.Pixel, wa);
                }
            }
            return FromBitmap(dst);
        }
    }
    public Px FlipX() {
        var o = new Px { W = W, H = H, D = new byte[D.Length] };
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) Buffer.BlockCopy(D, I(x, y), o.D, ((y * W) + (W - 1 - x)) * 4, 4);
        return o;
    }
    public static Px Blank(int w, int h) { return new Px { W = w, H = h, D = new byte[w * h * 4] }; }
    // Highest row that has any opaque pixel
    public int Top() { for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) if (D[I(x, y) + 3] > 0) return y; return H; }
}
