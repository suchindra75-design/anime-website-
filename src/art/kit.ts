/**
 * Art kit — shared palette, SVG defs and drawing helpers for the
 * procedurally drawn manga illustrations.
 *
 * Every illustration is a pure function returning SVG markup. Art is
 * rasterised once into a WebGL texture, so keep it static (no CSS/SMIL
 * animation) and avoid heavy SVG filters.
 *
 * ACCENT (#ff00ff) is a key colour: the WebGL ink shader swaps it at
 * runtime for the visitor's chosen flavour colour. Only mix it with
 * greys/black/white (hatching over it is fine) so the unmixing stays clean.
 */

export const INK = '#141210';
export const PAPER = '#efece4';
export const PAPER_SHADE = '#dedad0';
export const RED = '#c82924';
export const RED_DEEP = '#a8231f';
export const MAROON = '#592223';
export const KHAKI = '#b49a68';
export const KHAKI_DEEP = '#8c7449';
export const SKIN = '#e9ddd0';
export const STONE = '#f4f2ec';
export const GREY = '#8d8a83';
export const ACCENT = '#ff00ff';

export const FLAVOR_BLUE = '#6fb3e6';
export const FLAVOR_GREEN = '#86cf6a';
export const FLAVOR_YELLOW = '#f1cf3a';

export interface ArtDef {
  /** Unique name, matches the file name. */
  name: string;
  /** viewBox width / height. Layout uses this aspect ratio. */
  w: number;
  h: number;
  /** Optional solid background colour painted under the art. */
  bg?: string;
  /** Returns inner SVG markup in viewBox units. */
  draw: () => string;
}

export function art(def: ArtDef): ArtDef {
  return def;
}

/** Standard pattern / filter defs available to every illustration by id. */
export const DEFS = /* svg */ `
<defs>
  <pattern id="hatch-v" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M3.5 0V7" stroke="${INK}" stroke-width="1.6"/></pattern>
  <pattern id="hatch-v-fine" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M2 0V4" stroke="${INK}" stroke-width="0.9"/></pattern>
  <pattern id="hatch-h" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 3.5H7" stroke="${INK}" stroke-width="1.6"/></pattern>
  <pattern id="hatch-h-fine" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 2H4" stroke="${INK}" stroke-width="0.9"/></pattern>
  <pattern id="hatch-d" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M4 0V8" stroke="${INK}" stroke-width="1.5"/></pattern>
  <pattern id="hatch-d-fine" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M2.5 0V5" stroke="${INK}" stroke-width="0.8"/></pattern>
  <pattern id="hatch-x" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M4 0V8M0 4H8" stroke="${INK}" stroke-width="1.2"/></pattern>
  <pattern id="tone" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4" cy="4" r="1.7" fill="${INK}"/></pattern>
  <pattern id="tone-fine" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="0.9" fill="${INK}"/></pattern>
  <pattern id="tone-heavy" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="2.6" fill="${INK}"/></pattern>
  <pattern id="tone-white" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.4" fill="${PAPER}"/></pattern>
</defs>`;

/** Wraps an ArtDef into a standalone SVG document string. */
export function svgDocument(def: ArtDef): string {
  const bg = def.bg ? `<rect width="${def.w}" height="${def.h}" fill="${def.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w} ${def.h}" width="${def.w}" height="${def.h}">${DEFS}${bg}${def.draw()}</svg>`;
}

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

export type Rng = () => number;

/** mulberry32 — small seeded PRNG so every render of an artwork is identical. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (r: Rng, min: number, max: number) => min + (max - min) * r();
export const pick = <T>(r: Rng, list: readonly T[]): T => list[Math.floor(r() * list.length)];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

export type Pt = [number, number];

const f = (n: number) => Math.round(n * 10) / 10;

/** Polyline through points. */
export function poly(points: Pt[], close = false): string {
  return 'M' + points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + (close ? 'Z' : '');
}

/** Smooth Catmull-Rom spline through points, as cubic bezier path data. */
export function smooth(points: Pt[], close = false, tension = 0.5): string {
  if (points.length < 3) return poly(points, close);
  const pts = close ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]];
  let d = `M${f(pts[1][0])} ${f(pts[1][1])}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const t = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return close ? d + 'Z' : d;
}

/** Jitters points perpendicular-ish for a hand-inked wobble. */
export function wobble(points: Pt[], amp: number, r: Rng): Pt[] {
  return points.map(([x, y]) => [x + range(r, -amp, amp), y + range(r, -amp, amp)]);
}

/** Subdivides a straight segment into n points (for wobbling straight edges). */
export function segment(a: Pt, b: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

/** A slightly irregular, hand-drawn line between two points. */
export function inkLine(a: Pt, b: Pt, r: Rng, amp = 1.2, steps = 6): string {
  return smooth(wobble(segment(a, b, steps), amp, r));
}

/** Hand-drawn rectangle outline path (closed). */
export function roughRect(x: number, y: number, w: number, h: number, r: Rng, amp = 1.5): string {
  const pts: Pt[] = [
    ...segment([x, y], [x + w, y], 6),
    ...segment([x + w, y], [x + w, y + h], 6).slice(1),
    ...segment([x + w, y + h], [x, y + h], 6).slice(1),
    ...segment([x, y + h], [x, y], 6).slice(1, -1),
  ];
  return poly(wobble(pts, amp, r), true);
}

/**
 * Tapered brush stroke: a filled shape following a centre line, thick in
 * the middle and pointed at both ends — the core manga ink mark.
 */
export function brush(points: Pt[], width: number, taper = 1): string {
  if (points.length < 2) return '';
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const t = i / (n - 1);
    const profile = Math.pow(Math.sin(Math.PI * t), taper);
    const w = (width / 2) * Math.max(0.04, profile);
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  }
  return smooth([...left, ...right.reverse()], true, 0.4);
}

/** Radial speed lines (focus lines) between two radii around a centre. */
export function speedLines(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  count: number,
  r: Rng,
  width = 3,
): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + range(r, -0.02, 0.02);
    const inner = r0 * range(r, 0.85, 1.15);
    const outer = r1 * range(r, 0.9, 1.05);
    const pts: Pt[] = [];
    for (let s = 0; s <= 4; s++) {
      const rr = inner + ((outer - inner) * s) / 4;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    d += brush(pts, width * range(r, 0.5, 1.4), 0.6);
  }
  return d;
}

/** Parallel hatch strokes clipped by the caller — returns path data for n lines across a box. */
export function hatchLines(
  x: number,
  y: number,
  w: number,
  h: number,
  spacing: number,
  angleDeg: number,
  r: Rng,
  jitter = 0.6,
): string {
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
    const p1: Pt = [px - dx * diag, py - dy * diag];
    const p2: Pt = [px + dx * diag, py + dy * diag];
    d += inkLine(p1, p2, r, jitter, 4);
  }
  return d;
}

/** Utility: unique-ish id for clipPaths inside a single artwork. */
let uid = 0;
export function id(prefix = 'c'): string {
  uid += 1;
  return `${prefix}${uid}`;
}

/** Clip helper: wraps `content` in a clip-path defined by path data `clip`. */
export function clipped(clip: string, content: string): string {
  const cid = id('clip');
  return `<clipPath id="${cid}"><path d="${clip}"/></clipPath><g clip-path="url(#${cid})">${content}</g>`;
}
