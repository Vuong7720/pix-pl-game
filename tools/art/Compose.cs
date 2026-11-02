using System;

public static class Compose {
    // Alpha-blend src over a solid colour (for previewing cut-outs)
    public static Px OnColor(Px s, byte r, byte g, byte b) {
        var o = Px.Blank(s.W, s.H);
        for (int i = 0; i < s.W * s.H * 4; i += 4) {
            double a = s.D[i + 3] / 255.0;
            o.D[i] = (byte)(s.D[i] * a + b * (1 - a));
            o.D[i + 1] = (byte)(s.D[i + 1] * a + g * (1 - a));
            o.D[i + 2] = (byte)(s.D[i + 2] * a + r * (1 - a));
            o.D[i + 3] = 255;
        }
        return o;
    }
}
