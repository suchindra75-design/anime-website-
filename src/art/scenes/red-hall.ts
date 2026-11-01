import {
  art,
  INK,
  PAPER,
  RED,
  RED_DEEP,
  MAROON,
  STONE,
  GREY,
  FLAVOR_BLUE,
  FLAVOR_GREEN,
  FLAVOR_YELLOW,
  rng,
  range,
  smooth,
  clipped,
  type Pt,
  type Rng,
} from '../kit.ts';
import { fillP, strokeP, polyD, rectD, ellipseD, n, lerp, clamp } from './_util.ts';

const W = 1600;
const H = 1100;
const VX = 800;
const VY = 560;
const F = 700;
const P = (x: number, y: number, z: number): Pt => [VX + (x * F) / z, VY + (y * F) / z];

const FLOOR = 2.0;
const CEIL = -4.5;
const COL_X = 3.0;
const COL_R = 0.42;
const SHAFT_TOP = -3.55;
const Z_BACK = 15.8;
const Z_ALTAR = 13.6;

const fogAt = (z: number) => clamp((z - 3.2) / 10.5, 0, 1);

/** Engraved cylinder shading: line weight follows how far the surface turns from the light. */
function columnHatch(cx: number, hw: number, y0: number, y1: number, side: -1 | 1, r: Rng): string {
  const cnt = Math.max(6, Math.round((hw * 2) / 3.4));
  let thin = '';
  let mid = '';
  let thick = '';
  for (let i = 0; i <= cnt; i++) {
    const u = -1 + (2 * i) / cnt; // -1 left edge .. 1 right edge
    // the face towards the hall centre catches the glow
    const towardCentre = -side * u; // +1 = centre side
    const d = towardCentre > 0 ? 0.12 + 0.88 * Math.pow(towardCentre, 5) : 0.3 + 0.7 * Math.pow(-towardCentre, 1.4);
    if (d < 0.16 && i % 2 === 0) continue;
    const x = cx + u * hw * 0.98 + range(r, -0.3, 0.3);
    const seg = `M${n(x)} ${n(y0)}V${n(y1)}`;
    if (d > 0.7) thick += seg;
    else if (d > 0.35) mid += seg;
    else thin += seg;
  }
  const s = Math.max(0.6, hw / 40);
  return strokeP(thin, INK, n(0.7 * s)) + strokeP(mid, INK, n(1.5 * s)) + strokeP(thick, INK, n(2.6 * s));
}

export default art({
  name: 'red-hall',
  w: W,
  h: H,
  bg: INK,
  draw: () => {
    const r = rng(666);
    let out = '';

    out += `<radialGradient id="hall-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${RED}" stop-opacity="0.95"/><stop offset="0.35" stop-color="${RED_DEEP}" stop-opacity="0.55"/><stop offset="1" stop-color="${MAROON}" stop-opacity="0"/></radialGradient>`;
    out += `<linearGradient id="floor-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0.15"/><stop offset="1" stop-color="${INK}" stop-opacity="0.8"/></linearGradient>`;
    out += `<linearGradient id="ceil-dark" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${INK}" stop-opacity="0.2"/><stop offset="1" stop-color="${INK}" stop-opacity="1"/></linearGradient>`;

    // ------------------------------------------------------------ back wall
    const bwL = P(-COL_X - 1, CEIL, Z_BACK);
    const bwR = P(COL_X + 1, FLOOR, Z_BACK);
    out += fillP(rectD(bwL[0], bwL[1], bwR[0] - bwL[0], bwR[1] - bwL[1]), MAROON);
    // a tall niche behind the altar
    const nL = P(-1.3, -2.6, Z_BACK);
    const nR = P(1.3, FLOOR, Z_BACK);
    const nw = nR[0] - nL[0];
    const niche = `M${n(nL[0])} ${n(nR[1])}V${n(nL[1] + nw / 2)}A${n(nw / 2)} ${n(nw / 2)} 0 0 1 ${n(nR[0])} ${n(nL[1] + nw / 2)}V${n(nR[1])}Z`;
    out += fillP(niche, RED_DEEP);
    let nh = '';
    for (let x = nL[0] + 2; x < nR[0]; x += 2.6) nh += `M${n(x)} ${n(nL[1])}V${n(nR[1])}`;
    out += clipped(niche, strokeP(nh, INK, 0.7, 0.55));
    out += strokeP(niche, INK, 2);
    // glow pooling around the altar
    const g = P(0, 0.6, Z_ALTAR);
    out += fillP(ellipseD(g[0], g[1], 330, 260), 'url(#hall-glow)');

    // ---------------------------------------------------------------- ceiling
    const zNear = 1.2;
    const ceilPoly = polyD([P(-COL_X + 0.4, CEIL, zNear), P(COL_X - 0.4, CEIL, zNear), P(COL_X - 0.4, CEIL, Z_BACK), P(-COL_X + 0.4, CEIL, Z_BACK)]);
    out += fillP(ceilPoly, INK);
    let coffers = '';
    const cw = 0.86;
    for (let zc = Z_BACK - 0.2; zc > zNear; zc -= 1.0) {
      for (let xc = -COL_X + 0.6; xc < COL_X - 0.6 - cw + 0.01; xc += 1.0) {
        const inset = 0.16;
        const q = polyD([P(xc, CEIL, zc), P(xc + cw, CEIL, zc), P(xc + cw, CEIL, zc - cw), P(xc, CEIL, zc - cw)]);
        const qi = polyD([P(xc + inset, CEIL, zc - inset), P(xc + cw - inset, CEIL, zc - inset), P(xc + cw - inset, CEIL, zc - cw + inset), P(xc + inset, CEIL, zc - cw + inset)]);
        const lit = 1 - fogAt(zc) * 0.4;
        coffers += `<g opacity="${n(lit * 0.9)}">${fillP(q, MAROON)}${fillP(qi, INK)}${strokeP(qi, RED_DEEP, 1)}</g>`;
      }
    }
    out += clipped(ceilPoly, coffers + fillP(rectD(0, -10, W, VY), 'url(#ceil-dark)'));

    // ------------------------------------------------------------------ floor
    const zF0 = 1.15;
    const floorPoly = polyD([P(-9, FLOOR, zF0), P(9, FLOOR, zF0), P(9, FLOOR, Z_BACK), P(-9, FLOOR, Z_BACK)]);
    out += fillP(floorPoly, RED);
    let grout = '';
    const tile = 0.8;
    for (let x = -8.8; x <= 8.8; x += tile) grout += `M${n(P(x, FLOOR, zF0)[0])} ${n(P(x, FLOOR, zF0)[1])}L${n(P(x, FLOOR, Z_BACK)[0])} ${n(P(x, FLOOR, Z_BACK)[1])}`;
    let groutX = '';
    for (let z = Z_BACK; z > zF0; z -= tile) {
      const a = P(-9, FLOOR, z);
      const b = P(9, FLOOR, z);
      groutX += `M${n(a[0])} ${n(a[1])}H${n(b[0])}`;
    }
    // per-tile engraving: fine horizontal lines in alternate tiles near the viewer
    let tileHatch = '';
    for (let z = zF0 + 0.05; z < 6; z += tile) {
      for (let x = -8.8; x < 8.8; x += tile) {
        if ((Math.round(x / tile) + Math.round(z / tile)) % 2) continue;
        for (let k = 1; k < 5; k++) {
          const zz = z + (tile * k) / 5;
          const p0 = P(x + 0.06, FLOOR, zz);
          const p1 = P(x + tile - 0.06, FLOOR, zz);
          tileHatch += `M${n(p0[0])} ${n(p0[1])}H${n(p1[0])}`;
        }
      }
    }
    // column shadows thrown towards the viewer by the altar glow
    let shadows = '';
    const light = [0, Z_ALTAR - 0.4];
    for (let z = 2.6; z < Z_BACK - 0.5; z += 1.6) {
      for (const side of [-1, 1]) {
        const cx = side * COL_X;
        const dx = cx - light[0];
        const dz = z - light[1];
        const len = Math.hypot(dx, dz);
        const ux = dx / len;
        const uz = dz / len;
        const L = 9;
        const px = -uz;
        const pz = ux;
        const w0 = COL_R;
        const w1 = COL_R * 2.2;
        const pts: Pt[] = [
          P(cx + px * w0, FLOOR, z + pz * w0),
          P(cx + ux * L + px * w1, FLOOR, Math.max(0.6, z + uz * L + pz * w1)),
          P(cx + ux * L - px * w1, FLOOR, Math.max(0.6, z + uz * L - pz * w1)),
          P(cx - px * w0, FLOOR, z - pz * w0),
        ];
        shadows += polyD(pts);
      }
    }
    out += clipped(
      floorPoly,
      strokeP(tileHatch, INK, 0.9, 0.55) +
        strokeP(grout, INK, 1.6) +
        strokeP(groutX, INK, 1.6) +
        fillP(shadows, INK, 0.55) +
        fillP(rectD(0, VY, W, H - VY), 'url(#floor-dark)'),
    );
    // beyond the colonnades the floor sinks into darkness
    for (const side of [-1, 1]) {
      const outer = polyD([P(side * (COL_X + 0.5), FLOOR, Z_BACK), P(side * 9, FLOOR, Z_BACK), P(side * 9, FLOOR, zF0), P(side * (COL_X + 0.5), FLOOR, zF0)]);
      out += fillP(outer, INK, 0.78);
    }
    // centre aisle catches the glow: a soft red sheen over the darkening
    const aisle = polyD([P(-1.2, FLOOR, Z_ALTAR - 0.5), P(1.2, FLOOR, Z_ALTAR - 0.5), P(2.4, FLOOR, 1.2), P(-2.4, FLOOR, 1.2)]);
    out += fillP(aisle, RED, 0.25);

    // ------------------------------------------------------------------ altar
    {
      const z = Z_ALTAR;
      const zb = z + 0.7;
      const hw = 0.75;
      const top = 0.95;
      const f0 = P(-hw, top, z);
      const f1 = P(hw, FLOOR, z);
      const front = rectD(f0[0], f0[1], f1[0] - f0[0], f1[1] - f0[1]);
      const topFace = polyD([P(-hw, top, z), P(hw, top, z), P(hw, top, zb), P(-hw, top, zb)]);
      out += fillP(ellipseD((f0[0] + f1[0]) / 2, f1[1], (f1[0] - f0[0]) * 0.9, 8), INK, 0.7);
      out += fillP(front, STONE) + clipped(front, strokeP(Array.from({ length: 12 }, (_, i) => `M${n(lerp(f0[0], f1[0], 0.55 + i * 0.04))} ${n(f0[1])}V${n(f1[1])}`).join(''), INK, 1.1) + fillP(rectD(f0[0], f0[1] + 6, f1[0] - f0[0], 3), INK));
      out += fillP(topFace, PAPER);
      out += strokeP(front + topFace, INK, 2);
      // cornice slab and plinth mouldings
      const c0 = P(-hw - 0.1, top - 0.02, z - 0.08);
      const c1 = P(hw + 0.1, top + 0.14, z - 0.08);
      const cornice = rectD(c0[0], c0[1], c1[0] - c0[0], c1[1] - c0[1]);
      const p0 = P(-hw - 0.12, FLOOR - 0.16, z - 0.1);
      const p1 = P(hw + 0.12, FLOOR, z - 0.1);
      const plinth = rectD(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
      out += fillP(cornice + plinth, STONE) + clipped(cornice + plinth, fillP(rectD(c0[0], c0[1], W, H), 'url(#hatch-h-fine)', 0.8)) + strokeP(cornice + plinth, INK, 1.6);
      // three tiny bottles catching the light
      const colors = [FLAVOR_BLUE, FLAVOR_GREEN, FLAVOR_YELLOW];
      for (let i = 0; i < 3; i++) {
        const bx = -0.42 + i * 0.42;
        const base = P(bx, top, z + 0.3);
        const sc = F / (z + 0.3); // px per unit
        const bw = 0.13 * sc;
        const bh = 0.36 * sc;
        const neck = 0.05 * sc;
        const x = base[0];
        const y = base[1];
        const body = smooth(
          [
            [x - bw, y],
            [x - bw, y - bh * 0.62],
            [x - neck, y - bh * 0.82],
            [x - neck, y - bh],
            [x + neck, y - bh],
            [x + neck, y - bh * 0.82],
            [x + bw, y - bh * 0.62],
            [x + bw, y],
          ],
          true,
          0.2,
        );
        out += fillP(body, colors[i]);
        out += fillP(rectD(x - bw, y - bh * 0.45, bw * 2, bh * 0.16), INK);
        out += fillP(rectD(x - neck * 1.2, y - bh * 1.12, neck * 2.4, bh * 0.14), GREY);
        out += fillP(rectD(x - bw * 0.62, y - bh * 0.6, bw * 0.28, bh * 0.5), PAPER, 0.85);
        out += strokeP(body, INK, 1.1);
      }
      // halo of light rays rising from the altar
      let rays = '';
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + range(r, -0.75, 0.75);
        const r0 = range(r, 40, 60);
        const r1 = range(r, 120, 230);
        rays += `M${n(g[0] + Math.cos(a) * r0)} ${n(g[1] - 20 + Math.sin(a) * r0)}L${n(g[0] + Math.cos(a) * r1)} ${n(g[1] - 20 + Math.sin(a) * r1)}`;
      }
      out += strokeP(rays, RED, 1.2, 0.5);
    }

    // ---------------------------------------------------------------- columns
    const zs: number[] = [];
    for (let z = 2.6; z < Z_BACK - 0.5; z += 1.6) zs.push(z);
    zs.reverse();
    const beams = (side: -1 | 1) => {
      const xi = side * (COL_X - COL_R - 0.12);
      const xo = side * (COL_X + 0.7);
      const front = polyD([P(xi, SHAFT_TOP - 0.42, 1.0), P(xi, SHAFT_TOP - 0.42, Z_BACK), P(xi, CEIL, Z_BACK), P(xi, CEIL, 1.0)]);
      const under = polyD([P(xi, SHAFT_TOP - 0.42, 1.0), P(xi, SHAFT_TOP - 0.42, Z_BACK), P(xo, SHAFT_TOP - 0.42, Z_BACK), P(xo, SHAFT_TOP - 0.42, 1.0)]);
      // moulding lines along the beam, converging to the vanishing point
      let lines = '';
      for (const yy of [SHAFT_TOP - 0.55, SHAFT_TOP - 0.62, CEIL + 0.3, CEIL + 0.38]) {
        const a = P(xi, yy, 1.0);
        const b = P(xi, yy, Z_BACK);
        lines += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
      }
      // dentils
      let dent = '';
      for (let z = 1.2; z < Z_BACK; z += 0.22) {
        const a = P(xi, CEIL + 0.38, z);
        const b = P(xi, CEIL + 0.62, z);
        dent += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
      }
      return { under: fillP(under, INK), front: fillP(front, RED_DEEP) + clipped(front, strokeP(lines, INK, 2) + strokeP(dent, INK, 1.4) + fillP(rectD(0, 0, W, H), INK, 0.35)) + strokeP(front, INK, 2) };
    };
    const bl = beams(-1);
    const br = beams(1);
    // soffits sit behind the columns, the beam faces in front of them
    out += bl.under + br.under;
    for (const z of zs) {
      for (const side of [-1, 1] as const) {
        const cx = side * COL_X;
        const c = P(cx, 0, z);
        const hw = (COL_R * F) / z;
        const yb = P(0, FLOOR, z)[1];
        const yPlinth = P(0, FLOOR - 0.22, z)[1];
        const yTorus = P(0, FLOOR - 0.36, z)[1];
        const yTop = P(0, SHAFT_TOP, z)[1];
        const yEch = P(0, SHAFT_TOP - 0.22, z)[1];
        const yAb = P(0, SHAFT_TOP - 0.42, z)[1];
        const shaft = polyD([[c[0] - hw, yTorus], [c[0] - hw * 0.9, yTop], [c[0] + hw * 0.9, yTop], [c[0] + hw, yTorus]]);
        const torus = smooth([[c[0] - hw * 1.18, yPlinth], [c[0] - hw * 1.22, (yPlinth + yTorus) / 2], [c[0] - hw * 1.05, yTorus], [c[0] + hw * 1.05, yTorus], [c[0] + hw * 1.22, (yPlinth + yTorus) / 2], [c[0] + hw * 1.18, yPlinth]], true, 0.3);
        const plinth = rectD(c[0] - hw * 1.3, yPlinth, hw * 2.6, yb - yPlinth);
        const ech = smooth([[c[0] - hw * 0.9, yTop], [c[0] - hw * 1.2, (yTop + yEch) / 2], [c[0] - hw * 1.32, yEch], [c[0] + hw * 1.32, yEch], [c[0] + hw * 1.2, (yTop + yEch) / 2], [c[0] + hw * 0.9, yTop]], true, 0.3);
        const abacus = rectD(c[0] - hw * 1.42, yAb, hw * 2.84, yEch - yAb);
        let g2 = '';
        for (const part of [plinth, torus, shaft, ech, abacus]) g2 += fillP(part, RED);
        g2 += clipped(shaft, columnHatch(c[0], hw * 0.95, yTop, yTorus, side, r));
        g2 += clipped(torus, columnHatch(c[0], hw * 1.2, yTorus, yPlinth, side, r));
        g2 += clipped(ech, columnHatch(c[0], hw * 1.3, yEch, yTop, side, r));
        g2 += clipped(plinth, fillP(rectD(c[0] - hw * 1.3, yPlinth, hw * 2.6, yb - yPlinth), 'url(#hatch-h)'));
        g2 += clipped(abacus, fillP(rectD(c[0] - hw * 1.42, yAb, hw * 2.84, yEch - yAb), 'url(#hatch-v)'));
        // capital detail: neck rings
        const neckY = P(0, SHAFT_TOP + 0.18, z)[1];
        g2 += strokeP(`M${n(c[0] - hw * 0.9)} ${n(neckY)}H${n(c[0] + hw * 0.9)}M${n(c[0] - hw * 0.9)} ${n(neckY + Math.max(1.5, hw * 0.05))}H${n(c[0] + hw * 0.9)}`, INK, Math.max(0.8, hw / 50));
        const lw = Math.max(1, hw / 22);
        g2 += strokeP(shaft + torus + plinth + ech + abacus, INK, n(lw));
        // distance fog swallows the columns
        const fog = fogAt(z);
        if (fog > 0) g2 += fillP(shaft + torus + plinth + ech + abacus, INK, n(fog * 0.72));
        out += g2;
      }
    }
    out += bl.front + br.front;

    // vignette: the room dissolves into black at the edges
    out += `<radialGradient id="hall-vig" cx="0.5" cy="0.52" r="0.72"><stop offset="0.55" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity="0.85"/></radialGradient>`;
    out += fillP(rectD(0, 0, W, H), 'url(#hall-vig)');
    return out;
  },
});
