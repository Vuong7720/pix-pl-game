using System;
using System.Collections.Generic;

// Fake "transparent" checkerboard (white + light grey squares) -> real transparency.
// Flood fill from the image border through grey/white pixels; dark outlines stop the fill,
// so white parts inside a sprite survive.
public static class Checker {
    static bool Like(byte[] D, int i, int lo) {
        int b = D[i], g = D[i + 1], r = D[i + 2];
        int mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
        return mn >= lo && mx - mn <= 12;
    }
    public static void Key(Px p, int lo) {
        int W = p.W, H = p.H; var D = p.D;
        var bg = new bool[W * H]; var st = new Stack<int>();
        for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
        for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
        while (st.Count > 0) {
            int q = st.Pop();
            if (bg[q] || !Like(D, q * 4, lo)) continue;
            bg[q] = true;
            int x = q % W, y = q / W;
            if (x > 0) st.Push(q - 1); if (x < W - 1) st.Push(q + 1);
            if (y > 0) st.Push(q - W); if (y < H - 1) st.Push(q + W);
        }
        for (int q = 0; q < W * H; q++) if (bg[q]) D[q * 4 + 3] = 0;
        // 1px soft fringe left by antialiasing against the checker: drop pale neighbours of the background
        var drop = new List<int>();
        for (int y = 1; y < H - 1; y++) for (int x = 1; x < W - 1; x++) {
            int q = y * W + x; if (bg[q]) continue;
            if (!(bg[q - 1] || bg[q + 1] || bg[q - W] || bg[q + W])) continue;
            if (Like(D, q * 4, lo - 40)) drop.Add(q);
        }
        foreach (int q in drop) D[q * 4 + 3] = 0;
    }
}

// Flat paper background (beige sprite sheets): flood fill from the border through pixels close to its colour
public static class Paper {
    public static void Key(Px p, int tol) {
        int W = p.W, H = p.H; var D = p.D;
        int r0 = D[2], g0 = D[1], b0 = D[0];
        var bg = new bool[W * H]; var st = new System.Collections.Generic.Stack<int>();
        for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
        for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
        while (st.Count > 0) {
            int q = st.Pop(); if (bg[q]) continue;
            int i = q * 4;
            if (Math.Abs(D[i + 2] - r0) + Math.Abs(D[i + 1] - g0) + Math.Abs(D[i] - b0) > tol) continue;
            bg[q] = true;
            int x = q % W, y = q / W;
            if (x > 0) st.Push(q - 1); if (x < W - 1) st.Push(q + 1);
            if (y > 0) st.Push(q - W); if (y < H - 1) st.Push(q + W);
        }
        for (int q = 0; q < W * H; q++) if (bg[q]) D[q * 4 + 3] = 0;
        // Pockets of paper shut in by the sprite (between the legs): only near-exact matches
        for (int q = 0; q < W * H; q++) {
            int i = q * 4;
            if (Math.Abs(D[i + 2] - r0) + Math.Abs(D[i + 1] - g0) + Math.Abs(D[i] - b0) <= 30) D[i + 3] = 0;
        }
    }
}
