/**
 * Shared drawing helpers for the FIGURES group (the saint, hands, eyes).
 * Underscore file: ignored by the art registry.
 */
import { INK, PAPER, clipped, range, smooth, type Pt, type Rng } from '../kit.ts';

export type WidthFn = (t: number) => number;

/** Densely sample a Catmull-Rom spline through `pts` (open curve). */
export function sample(pts: Pt[], per = 8): Pt[] {
  if (pts.length < 3) {
    if (pts.length < 2) return pts.slice();
    const out: Pt[] = [];
    for (let i = 0; i <= per; i++) {
      const t = i / per;
      out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]);
    }
    return out;
  }
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const h2 = (n: number) => {
  const v = Math.round(n * 2) / 2;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
/** Compact closed polygon path (half-unit precision). */
export function polyC(points: Pt[]): string {
  return 'M' + points.map(([x, y]) => `${h2(x)} ${h2(y)}`).join('L') + 'Z';
}

/**
 * Lightweight hatch: parallel, slightly bowed lines across a box (one
 * quadratic segment each, half-unit precision) — much smaller than kit
 * hatchLines but the same engraved look once clipped.
 */
export function hatchLite(x: number, y: number, w: number, h: number, spacing: number, angleDeg: number, r: Rng, jitter = 0.6): string {
  const a = (angleDeg * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const diag = Math.hypot(w, h) / 2 + spacing;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let d = '';
  for (let o = -diag; o <= diag; o += spacing * range(r, 0.8, 1.2)) {
    const px = cx - dy * o;
    const py = cy + dx * o;
    const bow = range(r, -jitter, jitter) * 2;
    const x0 = px - dx * diag + range(r, -jitter, jitter);
    const y0 = py - dy * diag + range(r, -jitter, jitter);
    const x1 = px + dx * diag + range(r, -jitter, jitter);
    const y1 = py + dy * diag + range(r, -jitter, jitter);
    d += `M${h2(x0)} ${h2(y0)}Q${h2(px - dy * bow)} ${h2(py + dx * bow)} ${h2(x1)} ${h2(y1)}`;
  }
  return d;
}

/** Resample a polyline to `n` points evenly spaced by arc length. */
export function resample(pts: Pt[], n: number): Pt[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1] || 1;
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (total * i) / (n - 1);
    while (j < acc.length - 2 && acc[j + 1] < d) j++;
    const seg = acc[j + 1] - acc[j] || 1;
    out.push(lerp(pts[j], pts[j + 1], Math.min(1, (d - acc[j]) / seg)));
  }
  return out;
}

/** Variable-width brush stroke along a smooth curve through `pts`. Returns path data. */
export function vb(pts: Pt[], w: number | WidthFn, per = 5): string {
  const wf: WidthFn = typeof w === 'number' ? pointed(w) : w;
  const c = sample(pts, per);
  const n = c.length;
  if (n < 2) return '';
  const L: Pt[] = [];
  const R: Pt[] = [];
  // arc-length parameter
  const acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const total = acc[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const hw = Math.max(0.15, wf(acc[i] / total)) / 2;
    L.push([c[i][0] - dy * hw, c[i][1] + dx * hw]);
    R.push([c[i][0] + dy * hw, c[i][1] - dx * hw]);
  }
  return polyC([...L, ...R.reverse()]);
}

/** Width profiles. */
export const pointed = (w: number, e = 0.6): WidthFn => (t) => w * Math.pow(Math.sin(Math.PI * t), e);
/** thick at start, sharp at end */
export const tail = (w: number, e = 0.8, start = 0.06): WidthFn => (t) => w * Math.min(1, 0.35 + t / start) * Math.pow(1 - t, e);
/** sharp at start, thick at end */
export const head = (w: number, e = 0.8, end = 0.06): WidthFn => (t) => w * Math.min(1, 0.35 + (1 - t) / end) * Math.pow(t, e);
/** nearly even with soft tapered ends */
export const even = (w: number, ramp = 0.12, min = 0.25): WidthFn => (t) => w * Math.max(min, Math.min(1, t / ramp, (1 - t) / ramp));
/** swelling in the middle but never thinner than `min`*w */
export const swell = (w: number, min = 0.35): WidthFn => (t) => w * (min + (1 - min) * Math.sin(Math.PI * t));

/** Filled path element. */
export const P = (d: string, fill: string = INK, extra = '') => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
/** Stroked (unfilled) path element. */
export const S = (d: string, sw: number, color: string = INK, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
/** Ink brush stroke element. */
export const B = (pts: Pt[], w: number | WidthFn, fill: string = INK) => P(vb(pts, w), fill);
/** Closed smooth shape element. */
export const shape = (pts: Pt[], fill: string, extra = '') => P(smooth(pts, true), fill, extra);

export function bbox(pts: Pt[], pad = 0): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
}

/** Parallel ink hatching clipped to the closed smooth shape through `pts`. */
export function hatch(pts: Pt[], spacing: number, angle: number, r: Rng, sw = 1.4, color: string = INK, jitter = 0.6): string {
  const [x, y, w, h] = bbox(pts, 4);
  return clipped(smooth(pts, true), S(hatchLite(x, y, w, h, spacing, angle, r, jitter), sw, color));
}

/** Same but clip given as raw path data plus explicit box. */
export function hatchD(clipD: string, box: [number, number, number, number], spacing: number, angle: number, r: Rng, sw = 1.4, color: string = INK, jitter = 0.6): string {
  const [x, y, w, h] = box;
  return clipped(clipD, S(hatchLite(x, y, w, h, spacing, angle, r, jitter), sw, color));
}

/**
 * Engraving hatch: parallel lines at `angle` across `box`, each line a filled
 * ribbon whose width at a point is widthAt(x, y) — swelling into shadow.
 * Clipped to `clipD`.
 */
export function engrave(
  clipD: string,
  box: [number, number, number, number],
  spacing: number,
  angle: number,
  widthAt: (x: number, y: number) => number,
  r: Rng,
  color: string = INK,
  wav = 0.8,
): string {
  const [x, y, w, h] = box;
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const diag = Math.hypot(w, h) / 2 + spacing;
  let d = '';
  for (let o = -diag; o <= diag; o += spacing * range(r, 0.85, 1.15)) {
    const px = cx - dy * o;
    const py = cy + dx * o;
    const steps = Math.max(6, Math.round((diag * 2) / 18));
    const L: Pt[] = [];
    const R: Pt[] = [];
    let any = false;
    const ph = range(r, 0, 6.28);
    for (let s = 0; s <= steps; s++) {
      const t = -diag + (2 * diag * s) / steps;
      const wv = Math.sin(t * 0.02 + ph) * wav;
      const qx = px + dx * t - dy * wv;
      const qy = py + dy * t + dx * wv;
      const ww = Math.max(0, widthAt(qx, qy)) / 2;
      if (ww > 0.12) any = true;
      L.push([qx - dy * ww, qy + dx * ww]);
      R.push([qx + dy * ww, qy - dx * ww]);
    }
    if (any) d += polyC([...L, ...R.reverse()]);
  }
  return clipped(clipD, P(d, color));
}

/** Smoothstep. */
export const sstep = (e0: number, e1: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Point helpers */
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const rot = (p: Pt, deg: number, c: Pt = [0, 0]): Pt => {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
};
export const mirror = (pts: Pt[], cx: number): Pt[] => pts.map(([x, y]) => [2 * cx - x, y]);

/** Distance from point p to segment ab, and signed side. */
export function segDist(p: Pt, a: Pt, b: Pt): { d: number; t: number; side: number } {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2));
  const qx = a[0] + vx * t;
  const qy = a[1] + vy * t;
  const side = Math.sign(vx * (p[1] - a[1]) - vy * (p[0] - a[0]));
  return { d: Math.hypot(p[0] - qx, p[1] - qy), t, side };
}

/**
 * A lock of hair: many tapered ink strands fanning between two edge curves.
 * `left` and `right` are polylines (same direction, root → tip). Strands are
 * interpolated between them with some jitter.
 */
export function hairLock(left: Pt[], right: Pt[], count: number, r: Rng, w = 6, fill: string = INK, spread = 0.0): string {
  let out = '';
  const n = Math.min(left.length, right.length);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const pts: Pt[] = [];
    const tipLen = range(r, 0.82, 1.0);
    for (let k = 0; k < n; k++) {
      const p = lerp(left[k], right[k], t);
      const j = k === 0 ? 0 : range(r, -spread, spread);
      pts.push([p[0] + j, p[1] + j * 0.3]);
    }
    // shorten some strands
    const last = pts[n - 1];
    const prev = pts[n - 2];
    pts[n - 1] = lerp(prev, last, tipLen);
    out += P(vb(pts, tail(w * range(r, 0.6, 1.25), 0.9, 0.08)), fill);
  }
  return out;
}

/** Thin highlight strokes (gloss) in PAPER along given guide curves. */
export function gloss(curves: Pt[][], w = 2.2, color: string = PAPER): string {
  return curves.map((c) => P(vb(c, pointed(w, 0.7)), color)).join('');
}

/** Sleeve / hem trim band: a ribbon between two curves, filled. */
export function band(top: Pt[], bottom: Pt[], fill: string = INK): string {
  return P(smooth([...top, ...bottom.slice().reverse()], true, 0.3), fill);
}

/** Path data for a closed region made of two open curves (top then bottom reversed). */
export function region(a: Pt[], b: Pt[]): Pt[] {
  return [...a, ...b.slice().reverse()];
}

/** Offset a curve sideways (approx normal offset by `off`). */
export function offset(pts: Pt[], off: number): Pt[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    return [p[0] - dy * off, p[1] + dx * off] as Pt;
  });
}

export interface LockOpts {
  strands?: number; // number of tip strands
  split?: number; // 0..1 where the lock splits into strands
  fill?: string;
  gloss?: number; // number of highlight lines
  glossColor?: string;
  glossW?: number;
  jitter?: number; // tip wander
  tipVar?: number; // 0..1 random length variation of strands
  strandW?: number; // multiplier
}

/**
 * A lock of hair along a centre line: a solid slab that splits into tapered
 * strands toward the tip. `width(t)` gives the lock width along the line.
 */
export function lock(center: Pt[], width: WidthFn | number, r: Rng, o: LockOpts = {}): string {
  const wf: WidthFn = typeof width === 'number' ? (t) => width * (1 - 0.35 * t) : width;
  const c = resample(sample(center, 8), 48);
  const n = c.length;
  const acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const total = acc[n - 1] || 1;
  const T = acc.map((a) => a / total);
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const hw = wf(T[i]) / 2;
    L.push([c[i][0] - dy * hw, c[i][1] + dx * hw]);
    R.push([c[i][0] + dy * hw, c[i][1] - dx * hw]);
  }
  const fill = o.fill ?? INK;
  const split = o.split ?? 0.7;
  const N = o.strands ?? 6;
  const jit = o.jitter ?? 0.4;
  const tv = o.tipVar ?? 0.35;
  const sIdx = Math.max(1, T.findIndex((t) => t >= split));
  const slabEnd = Math.min(n - 1, sIdx + 2);
  // slab ends in a soft V so no straight cut shows between the strands
  const vTip = c[Math.min(n - 1, slabEnd + 4)];
  let out = P(smooth([...L.slice(0, slabEnd + 1), vTip, ...R.slice(0, slabEnd + 1).reverse()], true, 0.2), fill);
  const startIdx = Math.max(0, sIdx - Math.round(n * 0.12));
  for (let k = 0; k < N; k++) {
    const f = N === 1 ? 0.5 : (k + range(r, 0.15, 0.85)) / N;
    const keep = 1 - range(r, 0, tv);
    const endIdx = Math.max(startIdx + 2, Math.round(startIdx + (n - 1 - startIdx) * keep));
    const pts: Pt[] = [];
    const wob = range(r, -1, 1) * jit;
    for (let i = startIdx; i <= endIdx; i++) {
      const p = lerp(L[i], R[i], f);
      const u = (i - startIdx) / Math.max(1, n - 1 - startIdx);
      const hw = wf(T[i]);
      pts.push([p[0] + wob * hw * u * u, p[1] + wob * hw * u * u * 0.3]);
    }
    const sw = (wf(T[startIdx]) / N) * 1.9 * (o.strandW ?? 1) * range(r, 0.75, 1.25);
    out += P(vb(pts, (t) => sw * Math.min(1, 0.6 + t * 6) * Math.pow(1 - t, 0.85), 3), fill);
  }
  const G = o.gloss ?? 0;
  for (let g = 0; g < G; g++) {
    const f = (g + 1) / (G + 1) + range(r, -0.08, 0.08);
    const t0 = range(r, 0.05, 0.25);
    const t1 = Math.min(split, t0 + range(r, 0.25, 0.5));
    const i0 = Math.round(t0 * (n - 1));
    const i1 = Math.round(t1 * (n - 1));
    const pts: Pt[] = [];
    for (let i = i0; i <= i1; i++) pts.push(lerp(L[i], R[i], f));
    if (pts.length > 2) out += P(vb(pts, pointed(o.glossW ?? 2, 0.8), 3), o.glossColor ?? PAPER);
  }
  return out;
}

/** Outlined tapered limb (finger, thumb, toe): ink rim under a filled body. */
export function limb(pts: Pt[], w: WidthFn, fill: string, lw = 2.6, per = 6): string {
  return P(vb(pts, (t) => w(t) + lw * 2, per)) + P(vb(pts, w, per), fill);
}
/** Finger-like width profile: rounded tip at t=1, base at t=0 stays full. */
export const digit = (w0: number, w1: number): WidthFn => (t) => {
  const base = w0 + (w1 - w0) * t;
  const tip = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.82) / 0.18), 2)));
  return base * Math.max(0.12, tip);
};

/**
 * Relaxed hand seen from the thumb side, hanging from the wrist `w` toward
 * direction `deg` (0 = +x, 90 = down). `len` = wrist → fingertip. `flip`
 * mirrors which side the palm faces. Fingers softly curled, pinky most.
 */
export function relaxedHand(w: Pt, deg: number, len: number, r: Rng, flip = false, fill = '#e9ddd0'): string {
  const a = (deg * Math.PI) / 180;
  const d: Pt = [Math.cos(a), Math.sin(a)];
  const n0: Pt = [-d[1], d[0]];
  const n: Pt = flip ? [-n0[0], -n0[1]] : n0; // toward the palm
  const at = (u: number, v: number): Pt => [w[0] + d[0] * u * len + n[0] * v * len, w[1] + d[1] * u * len + n[1] * v * len];
  const sgn = flip ? -1 : 1;
  const finger = (i: number) => {
    const scale = [1, 1.06, 0.98, 0.82][i];
    const curl = [8 + i * 7, 26 + i * 9, 24 + i * 8];
    let u = 0.44 - i * 0.015;
    let v = -0.1 + i * 0.05;
    const pts: Pt[] = [[u, v]];
    let ang = 0;
    [0.22, 0.14, 0.11].forEach((L, j) => {
      ang += (curl[j] * Math.PI) / 180;
      u += Math.cos(ang) * L * scale;
      v += Math.sin(ang) * L * scale;
      pts.push([u, v]);
    });
    const g = pts.map(([uu, vv]) => at(uu, vv));
    const wf = digit(len * 0.12, len * 0.09);
    let o = P(vb(g, (t) => wf(t) + 4.4, 4)) + P(vb(g, wf, 4), fill);
    // shade the palm-side half
    o += P(vb(g.map((p) => [p[0] + n[0] * len * 0.025, p[1] + n[1] * len * 0.025] as Pt), (t) => wf(t) * 0.45, 4), fill === '#e9ddd0' ? '#d4c6b6' : fill);
    // joint creases
    for (const k of [1, 2]) {
      const c = g[k];
      o += B([[c[0] - n[0] * len * 0.05, c[1] - n[1] * len * 0.05], [c[0] - n[0] * len * 0.015 + d[0] * 2, c[1] - n[1] * len * 0.015 + d[1] * 2]], pointed(1.4));
    }
    if (i === 0) {
      // nail on the index fingertip
      const tip = g[3];
      const pre = g[2];
      const td: Pt = [(tip[0] - pre[0]) / len, (tip[1] - pre[1]) / len];
      const nn: Pt = [-td[1] * sgn, td[0] * sgn];
      const c: Pt = [tip[0] - td[0] * len * 0.02 - nn[0] * len * 0.02, tip[1] - td[1] * len * 0.02 - nn[1] * len * 0.02];
      o += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(len * 0.04).toFixed(1)}" ry="${(len * 0.025).toFixed(1)}" transform="rotate(${((Math.atan2(td[1], td[0]) * 180) / Math.PI).toFixed(0)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`;
    }
    return o;
  };
  let s = finger(3) + finger(2) + finger(1);
  // back of the hand / palm block
  const blk: Pt[] = [at(0, -0.16), at(0.24, -0.19), at(0.46, -0.17), at(0.5, -0.04), at(0.46, 0.1), at(0.3, 0.18), at(0.12, 0.17), at(0, 0.14)];
  const bd = smooth(blk, true, 0.4);
  s += P(bd, fill);
  s += clipped(bd, S(hatchLite(w[0] - len, w[1] - len, len * 2, len * 2, Math.max(2.6, len * 0.04), deg + 8 * sgn, r, 0.4), Math.max(0.8, len * 0.012)) + P(smooth([at(0, -0.17), at(0.46, -0.18), at(0.46, -0.02), at(0.0, 0.02)], true, 0.3), fill));
  s += P(vb([at(0, -0.16), at(0.24, -0.19), at(0.46, -0.17), at(0.5, -0.06)], (t) => len * (0.012 + 0.02 * Math.sin(Math.PI * t))));
  s += P(vb([at(0.46, 0.1), at(0.3, 0.18), at(0.12, 0.17), at(0, 0.14)], (t) => len * (0.012 + 0.024 * Math.sin(Math.PI * t))));
  // tendons
  s += B([at(0.06, -0.12), at(0.26, -0.13), at(0.42, -0.12)], pointed(len * 0.012));
  s += B([at(0.08, -0.07), at(0.26, -0.08), at(0.42, -0.07)], pointed(len * 0.01));
  s += finger(0);
  // thumb along the index finger
  const th: Pt[] = [at(0.12, 0.12), at(0.3, 0.17), at(0.46, 0.13), at(0.56, 0.07)];
  const tw = digit(len * 0.15, len * 0.1);
  s += P(vb(th, (t) => tw(t) + 4.6, 4)) + P(vb(th, tw, 4), fill);
  s += B([at(0.2, 0.18), at(0.34, 0.2), at(0.46, 0.16)], pointed(len * 0.014));
  s += B([at(0.4, 0.11), at(0.42, 0.16)], pointed(1.3));
  return s;
}
