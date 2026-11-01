/**
 * Private helpers for the SCENES group (underscore file: ignored by the registry).
 */
import { range, smooth, type Pt, type Rng } from '../kit.ts';

/** Round to 0.1 for compact path data. */
export const n = (v: number) => Math.round(v * 10) / 10;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Filled path element. */
export function fillP(d: string, fill: string, opacity = 1): string {
  if (!d) return '';
  return `<path d="${d}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}

/** Stroked path element (round caps). */
export function strokeP(d: string, stroke: string, width: number, opacity = 1): string {
  if (!d) return '';
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${
    opacity < 1 ? ` stroke-opacity="${opacity}"` : ''
  }/>`;
}

/** Straight segment path data, cheap. */
export function seg(a: Pt, b: Pt): string {
  return `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
}

/** Open polyline path data (no smoothing). */
export function pl(points: Pt[]): string {
  return 'M' + points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
}

/**
 * Variable-width stroke: a filled outline around a centre line with an
 * arbitrary width profile (t in 0..1 along the line).
 */
export function ribbon(points: Pt[], widthAt: (t: number) => number, tension = 0.4, smoothed = true): string {
  const cnt = points.length;
  if (cnt < 2) return '';
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < cnt; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(cnt - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = Math.max(0.05, widthAt(i / (cnt - 1))) / 2;
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  }
  const outline = [...left, ...right.reverse()];
  return smoothed ? smooth(outline, true, tension) : polyD(outline);
}

/** Smooth 1D value noise built from a few random sines. Returns f(x) in about -1..1. */
export function noise1(r: Rng, octaves = 3, baseFreq = 0.004): (x: number) => number {
  const comps: { f: number; p: number; a: number }[] = [];
  let amp = 1;
  let freq = baseFreq;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    comps.push({ f: freq * range(r, 0.8, 1.25), p: range(r, 0, Math.PI * 2), a: amp });
    total += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return (x: number) => comps.reduce((s, c) => s + Math.sin(x * c.f + c.p) * c.a, 0) / total;
}

/** Points along an ellipse arc (angles in radians). */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

/** Simple ellipse path (full). */
export function ellipseD(cx: number, cy: number, rx: number, ry: number): string {
  return `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`;
}

/** Rectangle path. */
export function rectD(x: number, y: number, w: number, h: number): string {
  return `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
}

/** Closed polygon path data. */
export function polyD(points: Pt[]): string {
  return pl(points) + 'Z';
}

/**
 * A hand-made broken line: a polyline through `points`, split randomly into
 * dashes with small gaps (for engraving lines that "breathe").
 */
export function brokenLine(points: Pt[], r: Rng, gapChance = 0.15): string {
  let d = '';
  let pen = false;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!pen) {
      d += `M${n(x)} ${n(y)}`;
      pen = true;
    } else {
      d += `L${n(x)} ${n(y)}`;
      if (r() < gapChance) pen = false;
    }
  }
  return d;
}

/** Simple one-point perspective camera. */
export function camera(vx: number, vy: number, focal: number) {
  return (x: number, y: number, z: number): Pt => [vx + (x * focal) / z, vy + (y * focal) / z];
}
