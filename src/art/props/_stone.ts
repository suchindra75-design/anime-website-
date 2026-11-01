import { INK, STONE, rng, range, brush, smooth, type Pt, type Rng } from '../kit.ts';

/** Shared renderer for the flying stone debris chunks (stone-a/b/c). */

export type FaceKind = 'top' | 'mid' | 'dark';

export interface StoneSpec {
  seed: number;
  verts: Pt[];
  /** Silhouette as vertex indices, in order. */
  outline: number[];
  /** Facets as vertex indices, with a lighting kind and hatch angle (degrees). */
  faces: { v: number[]; kind: FaceKind; angle: number }[];
  /** Crack polylines (brushed). */
  cracks: Pt[][];
}

const f1 = (n: number) => n.toFixed(1);

function inside(p: Pt, poly: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Hatch strokes clipped analytically to a polygon; each stroke swells towards the shadow (bottom-right). */
function hatchPoly(poly: Pt[], spacing: number, angleDeg: number, w: number, r: Rng): string {
  const a = (angleDeg * Math.PI) / 180;
  const dir: Pt = [Math.cos(a), Math.sin(a)];
  const nrm: Pt = [-dir[1], dir[0]];
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const rad = Math.max(...poly.map((p) => Math.hypot(p[0] - cx, p[1] - cy))) + spacing;
  let d = '';
  for (let o = -rad; o <= rad; o += spacing * range(r, 0.85, 1.15)) {
    const ox = cx + nrm[0] * o;
    const oy = cy + nrm[1] * o;
    const ts: number[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const ex = q[0] - p[0];
      const ey = q[1] - p[1];
      const den = dir[0] * ey - dir[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((p[0] - ox) * ey - (p[1] - oy) * ex) / den;
      const u = ((p[0] - ox) * dir[1] - (p[1] - oy) * dir[0]) / den;
      if (u >= 0 && u < 1) ts.push(t);
    }
    ts.sort((x, y) => x - y);
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const inset = 1.2;
      let A: Pt = [ox + dir[0] * (ts[i] + inset), oy + dir[1] * (ts[i] + inset)];
      let B: Pt = [ox + dir[0] * (ts[i + 1] - inset), oy + dir[1] * (ts[i + 1] - inset)];
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 4) continue;
      if (A[0] + A[1] > B[0] + B[1]) [A, B] = [B, A]; // B = shadow end
      // light end may stop short, leaving a ragged highlight edge
      const cut = range(r, 0, 0.25);
      A = [A[0] + (B[0] - A[0]) * cut, A[1] + (B[1] - A[1]) * cut];
      const w0 = w * 0.25;
      const w1 = w * range(r, 0.9, 1.25);
      const m: Pt = [(A[0] + B[0]) / 2 + range(r, -0.5, 0.5), (A[1] + B[1]) / 2 + range(r, -0.5, 0.5)];
      const wm = (w0 + w1) / 2;
      d +=
        `M${f1(A[0] + nrm[0] * w0)} ${f1(A[1] + nrm[1] * w0)}` +
        `Q${f1(m[0] + nrm[0] * wm)} ${f1(m[1] + nrm[1] * wm)} ${f1(B[0] + nrm[0] * w1)} ${f1(B[1] + nrm[1] * w1)}` +
        `L${f1(B[0] - nrm[0] * w1)} ${f1(B[1] - nrm[1] * w1)}` +
        `Q${f1(m[0] - nrm[0] * wm)} ${f1(m[1] - nrm[1] * wm)} ${f1(A[0] - nrm[0] * w0)} ${f1(A[1] - nrm[1] * w0)}Z`;
    }
  }
  return d;
}

export function drawStone(spec: StoneSpec): string {
  const r = rng(spec.seed);

  // wobble every edge once so shared edges stay identical between facets
  const outlineSet = new Set<string>();
  for (let i = 0; i < spec.outline.length; i++) {
    const a = spec.outline[i];
    const b = spec.outline[(i + 1) % spec.outline.length];
    outlineSet.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }
  const edgeCache = new Map<string, Pt[]>();
  const edge = (a: number, b: number): Pt[] => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edgeCache.has(key)) {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const p = spec.verts[lo];
      const q = spec.verts[hi];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const n = Math.max(2, Math.round(len / 22));
      const amp = outlineSet.has(key) ? 3.2 : 1.6;
      const nx = -(q[1] - p[1]) / len;
      const ny = (q[0] - p[0]) / len;
      const pts: Pt[] = [p];
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const j = range(r, -amp, amp);
        pts.push([p[0] + (q[0] - p[0]) * t + nx * j, p[1] + (q[1] - p[1]) * t + ny * j]);
      }
      pts.push(q);
      edgeCache.set(key, pts);
    }
    const pts = edgeCache.get(key)!;
    return a < b ? pts : [...pts].reverse();
  };
  const ring = (ids: number[]): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ids.length; i++) out.push(...edge(ids[i], ids[(i + 1) % ids.length]).slice(0, -1));
    return out;
  };
  const path = (pts: Pt[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';

  let s = '';
  let hatch = '';
  let pits = '';
  for (const f of spec.faces) {
    const pts = ring(f.v);
    s += `<path d="${path(pts)}" fill="${STONE}"/>`;
    if (f.kind === 'top') {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      for (let i = 0; i < 9; i++) {
        const x = range(r, Math.min(...xs) + 20, Math.max(...xs) - 20);
        const y = range(r, Math.min(...ys) + 14, Math.max(...ys) - 14);
        if (!inside([x, y], pts)) continue;
        pits += `M${f1(x)} ${f1(y)}a${f1(range(r, 0.8, 1.6))} ${f1(range(r, 0.6, 1.2))} 0 1 0 0.1 0Z`;
      }
    } else if (f.kind === 'mid') {
      hatch += hatchPoly(pts, 6.2, f.angle, 1.7, r);
    } else {
      hatch += hatchPoly(pts, 4.4, f.angle, 2.1, r);
      hatch += hatchPoly(pts, 6.5, f.angle + 64, 1.4, r);
    }
  }
  s += `<path d="${hatch}${pits}" fill="${INK}"/>`;

  // internal facet edges (thin), then the core shadow along dark lower silhouettes
  let edges = '';
  for (const f of spec.faces) edges += smooth(ring(f.v), true, 0.2);
  s += `<path d="${edges}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  for (const f of spec.faces) {
    if (f.kind !== 'dark') continue;
    const run = spec.outline.filter((i) => f.v.includes(i));
    if (run.length < 2) continue;
    const pts: Pt[] = [];
    for (let i = 0; i + 1 < run.length; i++) pts.push(...edge(run[i], run[i + 1]).slice(0, -1));
    pts.push(spec.verts[run[run.length - 1]]);
    s += `<path d="${brush(pts, 12, 0.6)}" fill="${INK}"/>`;
  }

  let cr = '';
  for (const c of spec.cracks) cr += brush(c, 3.2, 0.5);
  s += `<path d="${cr}" fill="${INK}"/>`;

  s += `<path d="${path(ring(spec.outline))}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>`;
  return s;
}
