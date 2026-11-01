import { art, PAPER, rng, range } from '../kit.ts';

/**
 * White ink splash rising from the bottom edge: a wavy solid mass with
 * bulbous crests along the bottom quarter (metaballs → marching squares),
 * and separated droplets above — bigger near the mass, smaller higher.
 * Pure PAPER fill, no outlines; an overlay for dark backgrounds.
 */

const W = 1600;
const H = 600;
const f = (n: number) => (Math.round(n * 10) / 10).toString();

interface Ball {
  x: number;
  y: number;
  r: number;
}

/** Compact metaball kernel; a lone ball's iso-contour (T=0.25) has radius r. */
function field(balls: Ball[], x: number, y: number): number {
  let v = 0;
  for (const b of balls) {
    const R2 = b.r * b.r * 2;
    const dx = x - b.x;
    const dy = y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= R2) continue;
    const t = 1 - d2 / R2;
    v += t * t;
  }
  return v;
}

/** Marching squares → closed loops as path data. Outside the grid counts as empty. */
function contour(balls: Ball[], x0: number, y0: number, x1: number, y1: number, step: number, T: number): string {
  const nx = Math.ceil((x1 - x0) / step) + 1;
  const ny = Math.ceil((y1 - y0) / step) + 1;
  const val = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const border = i === 0 || j === 0 || i === nx - 1 || j === ny - 1;
      val[j * nx + i] = border ? 0 : field(balls, x0 + i * step, y0 + j * step) - T;
    }
  const at = (i: number, j: number) => val[j * nx + i];
  // edge ids: horizontal edge (i,j)-(i+1,j) = 2*(j*nx+i), vertical (i,j)-(i,j+1) = 2*(j*nx+i)+1
  const pos = new Map<number, [number, number]>();
  const edgePt = (id: number): [number, number] => {
    let p = pos.get(id);
    if (p) return p;
    const k = id >> 1;
    const i = k % nx;
    const j = Math.floor(k / nx);
    const a = at(i, j);
    if (id & 1) {
      const b = at(i, j + 1);
      const t = a / (a - b);
      p = [x0 + i * step, y0 + (j + t) * step];
    } else {
      const b = at(i + 1, j);
      const t = a / (a - b);
      p = [x0 + (i + t) * step, y0 + j * step];
    }
    pos.set(id, p);
    return p;
  };
  const next = new Map<number, number>(); // directed: inside on the left
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const tl = at(i, j) > 0 ? 1 : 0;
      const tr = at(i + 1, j) > 0 ? 1 : 0;
      const br = at(i + 1, j + 1) > 0 ? 1 : 0;
      const bl = at(i, j + 1) > 0 ? 1 : 0;
      const c = tl * 8 + tr * 4 + br * 2 + bl;
      if (c === 0 || c === 15) continue;
      const top = 2 * (j * nx + i);
      const bottom = 2 * ((j + 1) * nx + i);
      const left = 2 * (j * nx + i) + 1;
      const right = 2 * (j * nx + i + 1) + 1;
      const centre = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 > 0;
      const seg = (a: number, b: number) => next.set(a, b);
      switch (c) {
        case 1: seg(left, bottom); break;
        case 2: seg(bottom, right); break;
        case 3: seg(left, right); break;
        case 4: seg(right, top); break;
        case 5: if (centre) { seg(left, top); seg(right, bottom); } else { seg(left, bottom); seg(right, top); } break;
        case 6: seg(bottom, top); break;
        case 7: seg(left, top); break;
        case 8: seg(top, left); break;
        case 9: seg(top, bottom); break;
        case 10: if (centre) { seg(top, right); seg(bottom, left); } else { seg(top, left); seg(bottom, right); } break;
        case 11: seg(top, right); break;
        case 12: seg(right, left); break;
        case 13: seg(right, bottom); break;
        case 14: seg(bottom, left); break;
      }
    }
  let d = '';
  const seen = new Set<number>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    let cur = start;
    const loop: [number, number][] = [];
    while (!seen.has(cur)) {
      seen.add(cur);
      loop.push(edgePt(cur));
      const n = next.get(cur);
      if (n === undefined) break;
      cur = n;
    }
    if (loop.length < 3) continue;
    d += 'M' + loop.map(([px, py]) => `${f(px)} ${f(py)}`).join('L') + 'Z';
  }
  return d;
}

export default art({
  name: 'splash-drops',
  w: W,
  h: H,
  draw: () => {
    const r = rng(1606);
    const balls: Ball[] = [];

    // the mass: a row of big overlapping balls below the frame edge, on a slow swell
    const swell = (x: number) => 22 * Math.sin(x / 230 + 0.6) + 12 * Math.sin(x / 97 + 2.1);
    for (let x = -60; x < W + 80; x += range(r, 40, 60)) balls.push({ x, y: 604 + swell(x) + range(r, -8, 8), r: range(r, 92, 116) });
    const top = (x: number) => 494 + swell(x);
    // bulbous crests riding on top of it
    const jets: Ball[] = [];
    for (let x = range(r, -20, 30); x < W + 40; x += range(r, 55, 130)) {
      const kind = r();
      if (kind < 0.35) {
        // broad swelling lobe
        const rr = range(r, 34, 58);
        balls.push({ x, y: top(x) - rr * range(r, 0.15, 0.45), r: rr });
      } else if (kind < 0.55) {
        // jet: a thinning neck carrying a round bulb, plus a drop already pinched off
        const rr = range(r, 26, 36);
        let y = top(x) - rr * 0.35;
        let cr = rr;
        let cx = x;
        const lean = range(r, -2.5, 2.5);
        balls.push({ x: cx, y, r: cr });
        const n = 2 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          y -= cr * 0.9;
          cr *= k === 0 ? 0.55 : 0.85;
          cx += lean;
          balls.push({ x: cx, y, r: cr });
        }
        const bulb = rr * range(r, 0.42, 0.55);
        y -= cr * 0.55 + bulb * 0.95;
        cx += lean;
        balls.push({ x: cx, y, r: bulb });
        if (r() < 0.7) jets.push({ x: cx + lean * 3, y: y - bulb * range(r, 2.4, 3.4), r: bulb * range(r, 0.55, 0.8) });
      } else {
        // small rounded crest
        const rr = range(r, 18, 30);
        balls.push({ x, y: top(x) - rr * range(r, 0.2, 0.6), r: rr });
      }
    }
    // small swells between crests so the edge reads lumpy
    for (let x = range(r, 0, 20); x < W + 20; x += range(r, 22, 48)) {
      balls.push({ x, y: top(x) + range(r, -2, 12), r: range(r, 13, 26) });
    }

    const mass = contour(balls, -30, 300, W + 30, H + 30, 3, 0.25);

    // ---------------------------------------------------------- droplets
    const drops: Ball[] = [...jets];
    for (let i = 0; i < 6000 && drops.length < 170; i++) {
      const t = Math.pow(r(), 0.7); // 0 top … 1 near the mass
      const y = 24 + t * 420;
      const x = range(r, 12, W - 12);
      const rr = (2 + 15 * Math.pow(t, 2.4)) * range(r, 0.6, 1.3);
      if (field(balls, x, y + rr * 3.8) > 0.01 || field(balls, x, y) > 0.005) continue;
      let ok = true;
      for (const b of drops) {
        if (Math.hypot(b.x - x, b.y - y) < b.r + rr + 8 + rr) {
          ok = false;
          break;
        }
      }
      if (ok) drops.push({ x, y, r: rr });
    }
    let dd = '';
    for (const { x, y, r: dr } of drops) {
      if (dr > 6 && r() < 0.45) {
        // rising teardrop: round head on top, tail trailing downwards
        const tail = dr * range(r, 1.4, 2.4);
        const lean = range(r, -0.25, 0.25) * tail;
        dd +=
          `M${f(x - dr)} ${f(y)}A${f(dr)} ${f(dr)} 0 0 1 ${f(x + dr)} ${f(y)}` +
          `C${f(x + dr)} ${f(y + dr * 0.9)} ${f(x + lean + dr * 0.2)} ${f(y + tail * 0.8)} ${f(x + lean)} ${f(y + dr + tail)}` +
          `C${f(x + lean - dr * 0.2)} ${f(y + tail * 0.8)} ${f(x - dr)} ${f(y + dr * 0.9)} ${f(x - dr)} ${f(y)}Z`;
      } else {
        const ry = dr * range(r, 0.88, 1.12);
        dd += `M${f(x - dr)} ${f(y)}a${f(dr)} ${f(ry)} 0 1 0 ${f(dr * 2)} 0a${f(dr)} ${f(ry)} 0 1 0 ${f(-dr * 2)} 0Z`;
      }
    }

    return `<path d="${mass}" fill="${PAPER}" fill-rule="evenodd"/><path d="${dd}" fill="${PAPER}"/>`;
  },
});
