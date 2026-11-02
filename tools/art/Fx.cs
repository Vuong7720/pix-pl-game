using System;

public static class Fx {
    // Share of opaque pixels in a row
    public static double RowFill(Px p, int y) {
        int n = 0; for (int x = 0; x < p.W; x++) if (p.D[(y * p.W + x) * 4 + 3] > 128) n++;
        return (double)n / p.W;
    }
    // src over an opaque background of the same size
    public static Px Over(Px src, Px bg) {
        var o = Px.Blank(src.W, src.H);
        for (int i = 0; i < src.D.Length; i += 4) {
            double a = src.D[i + 3] / 255.0;
            for (int k = 0; k < 3; k++) o.D[i + k] = (byte)(src.D[i + k] * a + bg.D[i + k] * (1 - a));
            o.D[i + 3] = 255;
        }
        return o;
    }
    // Fade alpha in over the first `rows` rows (smoothstep), for layers that end in a straight cut
    public static void FeatherTop(Px p, int rows) {
        for (int y = 0; y < Math.Min(rows, p.H); y++) {
            double t = (double)y / rows; double k = t * t * (3 - 2 * t);
            for (int x = 0; x < p.W; x++) { int i = (y * p.W + x) * 4 + 3; p.D[i] = (byte)(p.D[i] * k); }
        }
    }
}

public static class Spill {
    // Take out the magenta part of every pixel (pink haze bled from the key colour)
    public static void Demagenta(Px p, double k) {
        for (int i = 0; i < p.D.Length; i += 4) {
            int b = p.D[i], g = p.D[i + 1], r = p.D[i + 2];
            int m = Math.Min(r, b) - g; if (m <= 0) continue;
            p.D[i + 2] = (byte)(r - m * k); p.D[i] = (byte)(b - m * k);
        }
    }
}
