import { art, INK, MAROON, RED_DEEP, rng, range, type Pt } from '../kit.ts';
import { fillP, strokeP, ribbon, pl } from './_util.ts';

const W = 1600;
const H = 1000;
const LEAN = 0.17; // dx per dy: grain leans slightly to the right going down

/** Shared flow field so grain and fissures run together like split wood. */
function flowX(x0: number, y: number): number {
  return (
    x0 +
    LEAN * y +
    16 * Math.sin(y * 0.0041 + x0 * 0.0031) +
    7 * Math.sin(y * 0.0113 + x0 * 0.0079 + 1.3) +
    2.5 * Math.sin(y * 0.031 + x0 * 0.021 + 0.4)
  );
}

export default art({
  name: 'wood-surface',
  w: W,
  h: H,
  bg: MAROON,
  draw: () => {
    const r = rng(9001);
    let out = '';
    const pad = 80;

    // --------------------------------------------------------------- grain
    let grain = '';
    let grainHeavy = '';
    for (let x0 = -260; x0 < W + 60; x0 += range(r, 7, 15)) {
      const pts: Pt[] = [];
      const y0 = -pad + (r() < 0.3 ? range(r, 0, 500) : 0);
      const y1 = H + pad - (r() < 0.3 ? range(r, 0, 500) : 0);
      for (let y = y0; y <= y1; y += 55) pts.push([flowX(x0, y) + range(r, -0.6, 0.6), y]);
      if (pts.length < 2) continue;
      if (r() < 0.22) grainHeavy += pl(pts);
      else grain += pl(pts);
    }
    out += strokeP(grain, INK, 0.9, 0.32);
    out += strokeP(grainHeavy, INK, 1.6, 0.42);

    // broad darker streaks following the grain (tonal variation, no focal point)
    let bands = '';
    for (let x0 = -240; x0 < W + 40; x0 += range(r, 60, 140)) {
      const pts: Pt[] = [];
      for (let y = -pad; y <= H + pad; y += 60) pts.push([flowX(x0, y), y]);
      const bw = range(r, 14, 46);
      bands += ribbon(pts, (t) => bw * (0.6 + 0.4 * Math.sin(t * 9 + x0)), 0.4, false);
    }
    out += fillP(bands, INK, 0.13);

    // ------------------------------------------------------------ fissures
    // jittered grid so the cracks spread evenly, nothing to focus on
    const cols = 19;
    const rows = 3;
    let cracks = '';
    let highlights = '';
    const fissure = (x0: number, yStart: number, len: number, maxW: number, depth: number) => {
      const pts: Pt[] = [];
      const step = 22;
      const own = range(r, 0, 6.28);
      const drift = range(r, -0.035, 0.035);
      for (let d = 0; d <= len; d += step) {
        const y = yStart + d;
        pts.push([flowX(x0, y) + Math.sin(d * 0.02 + own) * 3 + drift * d + range(r, -1.2, 1.2), y]);
      }
      if (pts.length < 3) return;
      const jag = pts.map(() => range(r, 0.55, 1.15));
      const peak = range(r, 0.3, 0.7);
      cracks += ribbon(
        pts,
        (t) => {
          const prof = t < peak ? Math.pow(t / peak, 0.7) : Math.pow((1 - t) / (1 - peak), 0.9);
          return maxW * prof * jag[Math.round(t * (jag.length - 1))];
        },
        0.3,
        false,
      );
      // lit lip on the left edge of some cracks
      if (depth === 0 && r() < 0.35) {
        const a = Math.floor(pts.length * range(r, 0.15, 0.4));
        const b = Math.min(pts.length - 1, a + Math.floor(pts.length * range(r, 0.2, 0.4)));
        const lip = pts.slice(a, b + 1).map(([x, y]) => [x - maxW * 0.5 - 2.2, y] as Pt);
        if (lip.length >= 3) highlights += ribbon(lip, (t) => 1.8 * Math.sin(Math.PI * t), 0.3, false);
      }
      // branches peel away and rejoin the grain
      if (depth < 2) {
        const nb = depth === 0 ? Math.floor(range(r, 1, 4)) : r() < 0.4 ? 1 : 0;
        for (let b = 0; b < nb; b++) {
          const at = range(r, 0.1, 0.8) * len;
          const by = yStart + at;
          const side = r() < 0.5 ? -1 : 1;
          const bLen = range(r, 0.2, 0.5) * len;
          const bp: Pt[] = [];
          for (let d = 0; d <= bLen; d += step) {
            const t = d / bLen;
            const spread = side * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * range(r, 10, 14) * (1 + t * 2);
            bp.push([flowX(x0, by + d) + spread + (pts[Math.min(pts.length - 1, Math.round(at / step))][0] - flowX(x0, by)), by + d]);
          }
          if (bp.length >= 3) {
            const bw = maxW * range(r, 0.35, 0.6);
            cracks += ribbon(bp, (t) => bw * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.5 + 0.5)), 0.8) * (t < 0.08 ? t / 0.08 : 1), 0.3, false);
          }
        }
      }
    };
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        const x0 = -180 + ((cx + range(r, 0.1, 0.9)) / cols) * (W + 200);
        const yStart = -pad + ((cy + range(r, -0.3, 0.3)) / rows) * (H + 2 * pad) - 120;
        const len = range(r, 420, 900);
        fissure(x0, yStart, len, r() < 0.3 ? range(r, 13, 22) : range(r, 4, 11), 0);
      }
    }
    // a layer of fine hairline splits in between
    for (let i = 0; i < 70; i++) {
      const x0 = range(r, -220, W + 20);
      const y0 = range(r, -pad, H);
      fissure(x0, y0, range(r, 120, 360), range(r, 1.4, 3.2), 2);
    }
    out += fillP(cracks, INK);
    out += fillP(highlights, RED_DEEP);
    return out;
  },
});
