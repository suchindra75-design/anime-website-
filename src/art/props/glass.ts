import { art, INK, PAPER, STONE, ACCENT, rng, range, brush, clipped, type Pt } from '../kit.ts';

/**
 * Classic martini glass, front view. Exact geometry (the engine masks the
 * liquid level against it):
 *  rim ellipse (300,110) rx240 ry18 · cone apex (300,400) · stem 400→820 ~14 wide
 *  foot ellipse (300,835) rx150 ry22 · liquid ACCENT from y=118 to the apex.
 */

const CX = 300;
const RIM_Y = 110;
const RIM_RX = 240;
const RIM_RY = 18;
const APEX = 400;
const LIQ_Y = 118;
const FOOT_Y = 835;
const FOOT_RX = 150;
const FOOT_RY = 22;

/** Half-width of the cone at height y. */
const coneW = (y: number) => (RIM_RX * (APEX - y)) / (APEX - RIM_Y);

/** Tapered line from a to b (thick at a, fine at b). */
function taper(a: Pt, b: Pt, w: number, r: () => number, jit = 0.3): string {
  const pts: Pt[] = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([a[0] + (b[0] - a[0]) * t + range(r, -jit, jit), a[1] + (b[1] - a[1]) * t]);
  }
  // brush is symmetric; bias by extending past b so the fine end lands at b
  return brush(pts, w, 0.55);
}

export default art({
  name: 'glass',
  w: 600,
  h: 900,
  draw: () => {
    const r = rng(11);
    let s = '';

    // ------------------------------------------------------------ foot
    const fx0 = CX - FOOT_RX;
    const fx1 = CX + FOOT_RX;
    const footTop = `M${fx0} ${FOOT_Y}A${FOOT_RX} ${FOOT_RY} 0 1 1 ${fx1} ${FOOT_Y}A${FOOT_RX} ${FOOT_RY} 0 1 1 ${fx0} ${FOOT_Y}Z`;
    const footEdge = `M${fx0} ${FOOT_Y}A${FOOT_RX} ${FOOT_RY} 0 0 0 ${fx1} ${FOOT_Y}L${fx1} ${FOOT_Y + 5}A${FOOT_RX} ${FOOT_RY} 0 0 1 ${fx0} ${FOOT_Y + 5}Z`;
    // shadow under foot
    s += `<ellipse cx="${CX}" cy="${FOOT_Y + 12}" rx="${FOOT_RX + 14}" ry="${FOOT_RY - 4}" fill="${INK}" opacity="0.35"/>`;
    // edge band
    let fe = `<rect x="${fx0 - 5}" y="${FOOT_Y - 5}" width="${FOOT_RX * 2 + 10}" height="40" fill="${STONE}"/>`;
    fe += `<rect x="${CX + 20}" y="${FOOT_Y - 5}" width="${FOOT_RX}" height="40" fill="url(#hatch-v-fine)"/>`;
    s += clipped(footEdge, fe);
    s += `<path d="${footEdge}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    // top surface with concentric engraving arcs on the shadow side
    let ft = `<rect x="${fx0 - 5}" y="${FOOT_Y - 30}" width="${FOOT_RX * 2 + 10}" height="60" fill="${STONE}"/>`;
    let arcs = '';
    for (let i = 0; i < 9; i++) {
      const k = 0.94 - i * 0.075;
      const rx = FOOT_RX * k;
      const ry = FOOT_RY * k;
      // right-front quadrant arcs, from front-centre around to the back-right
      const pts: Pt[] = [];
      for (let j = 0; j <= 14; j++) {
        const a = Math.PI * 0.62 - (Math.PI * 0.95 * j) / 14;
        pts.push([CX + rx * Math.cos(a) + 0, FOOT_Y + ry * Math.sin(a)]);
      }
      arcs += brush(pts.slice(2), 1.6 - i * 0.08, 0.7);
    }
    ft += `<path d="${arcs}" fill="${INK}"/>`;
    // stem shadow cast on the foot
    ft += `<path d="M${CX + 6} ${FOOT_Y - 4}Q${CX + 50} ${FOOT_Y + 2} ${CX + 120} ${FOOT_Y + 4}L${CX + 120} ${FOOT_Y + 10}Q${CX + 50} ${FOOT_Y + 8} ${CX + 4} ${FOOT_Y + 4}Z" fill="${INK}" opacity="0.8"/>`;
    // glint on the left of the foot
    ft += `<path d="${brush(
      [
        [CX - 132, FOOT_Y + 4],
        [CX - 110, FOOT_Y + 12],
        [CX - 70, FOOT_Y + 18],
        [CX - 30, FOOT_Y + 20],
      ],
      4,
      0.6,
    )}" fill="#ffffff"/>`;
    s += clipped(footTop, ft);
    s += `<path d="${footTop}" fill="none" stroke="${INK}" stroke-width="3.6"/>`;

    // ------------------------------------------------------------ stem
    const sw = 7; // half width
    const stem = `M${CX - sw} 412C${CX - sw - 1} 600 ${CX - sw - 1} 700 ${CX - sw} 790C${CX - sw} 812 ${CX - 22} 826 ${CX - 34} ${FOOT_Y - 1}L${CX + 34} ${FOOT_Y - 1}C${CX + 22} 826 ${CX + sw} 812 ${CX + sw} 790C${CX + sw + 1} 700 ${CX + sw + 1} 600 ${CX + sw} 412Z`;
    let st = `<rect x="${CX - 40}" y="400" width="80" height="440" fill="${STONE}"/>`;
    let sl = '';
    sl += taper([CX + 3.2, 420], [CX + 3.2, 800], 1.5, r, 0.15);
    sl += taper([CX + 5.2, 416], [CX + 5.2, 806], 1.8, r, 0.15);
    sl += taper([CX + 12, 812], [CX + 30, 832], 1.6, r, 0.1);
    sl += taper([CX + 8, 806], [CX + 20, 832], 1.4, r, 0.1);
    st += `<path d="${sl}" fill="${INK}"/>`;
    st += `<path d="${brush(
      [
        [CX - 3, 430],
        [CX - 3.4, 600],
        [CX - 3, 780],
      ],
      2.6,
      0.4,
    )}" fill="#ffffff"/>`;
    s += clipped(stem, st);
    s += `<path d="${stem}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

    // ------------------------------------------------------------ solid glass at the apex
    const knob = `M${CX - 30} 362Q${CX - 16} 396 ${CX - 10} 410Q${CX - 7} 418 ${CX - sw} 428L${CX + sw} 428Q${CX + 7} 418 ${CX + 10} 410Q${CX + 16} 396 ${CX + 30} 362Z`;
    let kn = `<rect x="${CX - 40}" y="350" width="80" height="90" fill="${STONE}"/>`;
    kn += `<path d="${taper([CX + 14, 380], [CX + 6, 424], 1.6, r, 0.1)}${taper([CX + 20, 372], [CX + 9, 412], 1.4, r, 0.1)}" fill="${INK}"/>`;
    kn += `<path d="${brush(
      [
        [CX - 14, 392],
        [CX - 8, 404],
        [CX - 4, 418],
      ],
      3,
      0.5,
    )}" fill="#ffffff"/>`;
    s += clipped(knob, kn);
    s += `<path d="M${CX - 30} 362Q${CX - 16} 396 ${CX - 10} 410Q${CX - 7} 418 ${CX - sw} 430M${CX + 30} 362Q${CX + 16} 396 ${CX + 10} 410Q${CX + 7} 418 ${CX + sw} 430" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

    // ------------------------------------------------------------ bowl + liquid
    const wall = 5; // glass wall thickness, inset of the liquid
    const lw = coneW(LIQ_Y) - wall;
    const SRY = 15; // liquid surface ry
    // liquid region: surface ellipse back edge, down the cone to the apex
    const liq = `M${CX - lw} ${LIQ_Y}A${lw} ${SRY} 0 0 1 ${CX + lw} ${LIQ_Y}L${CX} ${APEX - 3}Z`;
    let lq = `<rect x="40" y="90" width="520" height="320" fill="${ACCENT}"/>`;

    // engraving generators converging to the apex — right side shadow
    let gen = '';
    const G = 70;
    let lastX = -1e9;
    for (let i = 0; i <= G; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / G;
      const sn = Math.sin(th);
      const x = CX + lw * sn;
      const y = LIQ_Y + SRY * Math.cos(th);
      if (sn > 0.3) {
        const k = (sn - 0.3) / 0.7;
        const w = 1.1 + k * 2.2;
        if (x - lastX < 3.6 + w * 0.5) continue;
        lastX = x;
        // shorter, finer strokes nearer the centre
        const len = 0.55 + k * 0.42;
        const end: Pt = [x + (CX - x) * len, y + (APEX - y) * len];
        gen += taper([x, y + 1], end, w, r, 0.25);
      } else if (sn < -0.78) {
        const k = (-sn - 0.78) / 0.22;
        const w = 0.8 + k * 1.2;
        if (x - lastX < 4 + w) continue;
        lastX = x;
        const len = 0.5 + k * 0.4;
        gen += taper([x, y + 1], [x + (CX - x) * len, y + (APEX - y) * len], w, r, 0.25);
      }
    }
    // cross-contour strokes following the cone's elliptical sections (shadow side)
    for (let i = 0; i < 15; i++) {
      const yy = 160 + i * 14;
      const wHere = coneW(yy) - wall;
      const ry = wHere * (RIM_RY / RIM_RX);
      const pts: Pt[] = [];
      const a0 = 0.08;
      const a1 = 0.62 + i * 0.012;
      for (let j = 0; j <= 6; j++) {
        const a = a1 - ((a1 - a0) * j) / 6;
        pts.push([CX + wHere * Math.cos(a), yy + ry * Math.sin(a)]);
      }
      gen += brush(pts.reverse(), 1.2, 0.7);
    }
    lq += `<path d="${gen}" fill="${INK}"/>`;

    // liquid surface: slight tone on the back half, white meniscus on the front
    lq += `<path d="M${CX - lw} ${LIQ_Y}A${lw} ${SRY} 0 0 1 ${CX + lw} ${LIQ_Y}A${lw} ${SRY} 0 0 1 ${CX - lw} ${LIQ_Y}Z" fill="url(#tone-fine)" opacity="0.45"/>`;
    lq += `<path d="M${CX - lw + 6} ${LIQ_Y + 2}A${lw - 6} ${SRY - 1.5} 0 0 0 ${CX + lw - 6} ${LIQ_Y + 2}" fill="none" stroke="${PAPER}" stroke-width="2" stroke-linecap="round"/>`;
    lq += `<path d="M${CX - lw} ${LIQ_Y}A${lw} ${SRY} 0 0 0 ${CX + lw} ${LIQ_Y}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;

    // white highlight strokes on the left
    const hlx = (t: number, y: number): Pt => {
      const xx = CX - (coneW(y) - wall) * t;
      return [xx, y];
    };
    const h1: Pt[] = [];
    for (let j = 0; j <= 8; j++) h1.push(hlx(0.62, 142 + j * 23));
    lq += `<path d="${brush(h1, 9, 0.5)}" fill="${PAPER}"/>`;
    const h2: Pt[] = [];
    for (let j = 0; j <= 6; j++) h2.push(hlx(0.48, 170 + j * 20));
    lq += `<path d="${brush(h2, 3.4, 0.5)}" fill="${PAPER}"/>`;
    // small glints on the surface
    lq += `<path d="${brush(
      [
        [CX - 150, LIQ_Y + 4],
        [CX - 120, LIQ_Y + 7.5],
        [CX - 90, LIQ_Y + 9.5],
      ],
      3,
      0.6,
    )}" fill="#ffffff"/>`;
    s += clipped(liq, lq);

    // glass walls (outer contour + fine inner line for thickness)
    const bowlL: Pt = [CX - RIM_RX, RIM_Y];
    const bowlR: Pt = [CX + RIM_RX, RIM_Y];
    s += `<path d="M${bowlL[0]} ${bowlL[1]}L${CX} ${APEX}" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M${bowlR[0]} ${bowlR[1]}L${CX} ${APEX}" stroke="${INK}" stroke-width="5.6" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M${CX - RIM_RX + 9} ${RIM_Y + 4}L${CX - 3} ${APEX - 10}M${CX + RIM_RX - 9} ${RIM_Y + 4}L${CX + 3} ${APEX - 10}" stroke="${INK}" stroke-width="1.2" fill="none"/>`;
    // left wall glint (white, inside the wall line)
    s += `<path d="${brush(
      [
        [CX - RIM_RX + 12, RIM_Y + 10],
        [CX - RIM_RX + 50, RIM_Y + 56],
        [CX - RIM_RX + 96, RIM_Y + 112],
      ],
      3,
      0.6,
    )}" fill="#ffffff"/>`;

    // rim: thin ellipse (back half lighter, front half bolder)
    s += `<path d="M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 1 ${CX + RIM_RX} ${RIM_Y}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 0 ${CX + RIM_RX} ${RIM_Y}" fill="none" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M${CX - RIM_RX + 6} ${RIM_Y - 1.5}A${RIM_RX - 6} ${RIM_RY - 3} 0 0 1 ${CX + RIM_RX - 6} ${RIM_Y - 1.5}" fill="none" stroke="${INK}" stroke-width="1"/>`;
    // rim glints
    s += `<path d="M${CX - 170} ${RIM_Y - 12.5}Q${CX - 120} ${RIM_Y - 17.5} ${CX - 70} ${RIM_Y - 18.5}" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>`;
    s += `<path d="M${CX + 150} ${RIM_Y + 14}Q${CX + 180} ${RIM_Y + 11.5} ${CX + 205} ${RIM_Y + 9}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`;

    return s;
  },
});
