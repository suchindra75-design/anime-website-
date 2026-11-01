import { art, INK, PAPER, MAROON, rng, range, speedLines, clipped, type Pt } from '../kit.ts';
import { fillP, strokeP, polyD, ellipseD, n, lerp } from './_util.ts';

const W = 1600;
const H = 1200;
const VX = 800;
const VY = 470;
const DISC_R = 380;
// corridor cross-section at the picture plane (s = 1): walls at x = 0 / 1600, floor at y = 1200
const HALF = 800;
const FLOOR = H - VY; // 730
const S_BACK = 0.36; // depth of the far end wall

const wx = (side: number, s: number) => VX + side * HALF * s;
const fy = (s: number) => VY + FLOOR * s;

export default art({
  name: 'portal',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(2024);
    let out = '';

    // ------------------------------------------------------- far end wall
    const back = polyD([[wx(-1, S_BACK), -10], [wx(1, S_BACK), -10], [wx(1, S_BACK), fy(S_BACK)], [wx(-1, S_BACK), fy(S_BACK)]]);
    out += fillP(back, 'url(#hatch-v-fine)');

    // ---------------------------------------------------------------- walls
    const wall = (side: -1 | 1) => {
      const poly = polyD([[wx(side, S_BACK), -10], [wx(side, 1.05), -10], [wx(side, 1.05), fy(1.05)], [wx(side, S_BACK), fy(S_BACK)]]);
      let o = fillP(poly, PAPER);
      // vertical engraving, uniform in world depth (z = 1/s) -> crowds towards the vanishing point
      let hatch = '';
      let heavy = '';
      const z0 = 1 / 1.05;
      const z1 = 1 / S_BACK;
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const z = lerp(z0, z1, i / N);
        const s = 1 / z;
        const x = wx(side, s) + range(r, -0.4, 0.4);
        // broken tops so the hatch breathes
        const top = -10 + (r() < 0.25 ? range(r, 0, 300) * s : 0);
        const seg = `M${n(x)} ${n(top)}L${n(x)} ${n(fy(s))}`;
        if (i / N > 0.55) heavy += seg;
        else if (i % 2 === 0 || i / N > 0.3) hatch += seg; // sparser near the viewer
      }
      o += clipped(poly, strokeP(hatch, INK, 1) + strokeP(heavy, INK, 1.5));
      // pilasters: frontal face (paper) + inner face (converging, hatched dark)
      const zs = [1.25, 1.75, 2.25];
      for (const zp of zs) {
        const s0 = 1 / zp;
        const s1 = 1 / (zp + 0.12);
        const inset = 0.07;
        const xWall = wx(side, s0);
        const xIn0 = VX + side * HALF * (1 - inset) * s0;
        const xIn1 = VX + side * HALF * (1 - inset) * s1;
        const frontal = polyD([[xWall, -10], [xIn0, -10], [xIn0, fy(s0)], [xWall, fy(s0)]]);
        const inner = polyD([[xIn0, -10], [xIn1, -10], [xIn1, fy(s1)], [xIn0, fy(s0)]]);
        let fh = '';
        for (let x = Math.min(xWall, xIn0) + 3; x < Math.max(xWall, xIn0); x += 7) fh += `M${n(x)} -10V${n(fy(s0))}`;
        o += fillP(frontal, PAPER) + clipped(frontal, strokeP(fh, INK, 0.8, 0.8));
        o += fillP(inner, INK);
        o += strokeP(frontal, INK, 2.6);
        // base moulding
        const by = fy(s0);
        o += fillP(polyD([[xWall - side * 4 * s0, by - 26 * s0], [xIn0 + side * 6 * s0, by - 26 * s0], [xIn0 + side * 6 * s0, by], [xWall - side * 4 * s0, by]]), PAPER);
        o += strokeP(polyD([[xWall - side * 4 * s0, by - 26 * s0], [xIn0 + side * 6 * s0, by - 26 * s0], [xIn0 + side * 6 * s0, by], [xWall - side * 4 * s0, by]]), INK, 2);
      }
      o += strokeP(`M${n(wx(side, S_BACK))} -10V${n(fy(S_BACK))}L${n(wx(side, 1.05))} ${n(fy(1.05))}`, INK, 4);
      return o;
    };
    out += wall(-1) + wall(1);

    // ---------------------------------------------------------------- floor
    const floor = polyD([[wx(-1, S_BACK), fy(S_BACK)], [wx(1, S_BACK), fy(S_BACK)], [wx(1, 1.05), fy(1.05)], [wx(-1, 1.05), fy(1.05)]]);
    let joints = '';
    for (let i = -9; i <= 9; i++) {
      const xb = VX + (i / 9) * HALF * S_BACK;
      const xf = VX + (i / 9) * HALF * 1.05;
      joints += `M${n(xb)} ${n(fy(S_BACK))}L${n(xf)} ${n(fy(1.05))}`;
    }
    let rows = '';
    let hh = '';
    const zf = 1 / S_BACK;
    let prev = fy(S_BACK);
    for (let z = zf - 0.32; z > 0.9; z -= 0.32) {
      const y = fy(1 / z);
      rows += `M0 ${n(y)}H${W}`;
      const rowH = y - prev;
      const cnt = Math.max(2, Math.round(rowH / 4.6));
      for (let j = 1; j < cnt; j++) {
        if (r() < 0.25 + 0.4 * (y / H)) continue; // lighter near the viewer
        const yy = prev + (rowH * j) / cnt;
        let x = 0;
        while (x < W) {
          const len = range(r, 160, 600);
          hh += `M${n(x)} ${n(yy)}H${n(Math.min(W, x + len))}`;
          x += len + range(r, 8, 50);
        }
      }
      prev = y;
    }
    out += fillP(floor, PAPER);
    out += clipped(floor, strokeP(hh, INK, 0.9) + strokeP(joints, INK, 1.6) + strokeP(rows, INK, 2.2));
    out += strokeP(`M${n(wx(-1, S_BACK))} ${n(fy(S_BACK))}H${n(wx(1, S_BACK))}`, INK, 3);

    // -------------------------------------------------------- focus lines
    // radiate from the portal over the whole corridor, but stay off the floor under the disc
    {
      const raw = speedLines(VX, VY, DISC_R + 14, 940, 170, r, 7);
      let burst = '';
      for (const p of raw.split('M').filter(Boolean)) {
        const m = p.match(/^(-?[\d.]+)[ ,](-?[\d.]+)/);
        if (!m) continue;
        const a = Math.atan2(+m[2] - VY, +m[1] - VX);
        if (a > 0.6 && a < Math.PI - 0.6) continue;
        burst += 'M' + p;
      }
      // white halo ring keeps the lines from touching the rim
      out += fillP(burst, INK);
    }

    // ---------------------------------------------------------------- portal
    const disc = ellipseD(VX, VY, DISC_R, DISC_R);
    out += `<radialGradient id="portal-g" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stop-color="${MAROON}"/><stop offset="0.94" stop-color="#3f1718"/><stop offset="1" stop-color="#2a0f10"/></radialGradient>`;
    out += `<path d="${ellipseD(VX, VY, DISC_R + 16, DISC_R + 16)}" fill="${PAPER}"/>`;
    out += fillP(disc, 'url(#portal-g)');
    let rings = '';
    let rr = 10;
    let k = 0;
    while (rr < DISC_R - 6) {
      const t = rr / DISC_R;
      const wob = range(r, -1, 1);
      const width = lerp(0.7, 2.2, Math.pow(t, 2.5));
      const op = lerp(0.55, 0.95, t);
      const gaps = 2 + Math.floor(r() * 3);
      const a0 = range(r, 0, Math.PI * 2);
      for (let g = 0; g < gaps; g++) {
        const s0 = a0 + (g / gaps) * Math.PI * 2 + range(r, 0.04, 0.16);
        const s1 = a0 + ((g + 1) / gaps) * Math.PI * 2 - range(r, 0.02, 0.1);
        const R = rr + wob;
        const p0: Pt = [VX + Math.cos(s0) * R, VY + Math.sin(s0) * R];
        const p1: Pt = [VX + Math.cos(s1) * R, VY + Math.sin(s1) * R];
        rings += `<path d="M${n(p0[0])} ${n(p0[1])}A${n(R)} ${n(R)} 0 ${s1 - s0 > Math.PI ? 1 : 0} 1 ${n(p1[0])} ${n(p1[1])}" fill="none" stroke="${INK}" stroke-width="${n(width)}" stroke-opacity="${n(op)}"/>`;
      }
      // rings bunch into bands, like ripples on a dark pool
      rr += (Math.sin(k * 0.55) > 0.3 ? 3.2 : 7.5) * lerp(1.2, 0.75, t);
      k++;
    }
    out += rings;
    out += `<path d="${ellipseD(VX, VY, DISC_R - 7, DISC_R - 7)}" fill="none" stroke="${INK}" stroke-width="14" stroke-opacity="0.5"/>`;
    out += strokeP(disc, INK, 6);
    return out;
  },
});
