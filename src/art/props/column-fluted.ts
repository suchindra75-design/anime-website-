import { art, INK, STONE, PAPER_SHADE, rng, range, brush, smooth, poly, clipped, type Pt, type Rng } from '../kit.ts';

/**
 * Giant fluted Doric column, close-up, seen slightly from below.
 * Capital (abacus + echinus + annulets) y 0–330, shaft x 120–780 below.
 */

const CX = 450;
const SR = 330; // shaft radius (x 120–780)
const SHAFT_TOP = 330;
const H = 1400;
const FLUTES = 16; // around the full circumference → 8 visible
const LIGHT: [number, number] = [-0.42, 0.91]; // (x, z) light from front-left

/** Variable-width vertical engraving line: widths sampled along y. */
function vstroke(x: number, y0: number, y1: number, width: (y: number) => number, r: Rng): string {
  const n = Math.max(6, Math.round((y1 - y0) / 60));
  const L: Pt[] = [];
  const Rr: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    const end = i === 0 ? 0.3 : i === n ? 0.05 : 1;
    const w = Math.max(0.2, width(y) * end) / 2;
    const jx = range(r, -0.35, 0.35);
    L.push([x + jx - w, y]);
    Rr.push([x + jx + w, y]);
  }
  return smooth([...L, ...Rr.reverse()], true, 0.3);
}

/** Irregular chip polygon around a centre. */
function chip(cx: number, cy: number, rx: number, ry: number, r: Rng, n = 7): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + range(r, -0.25, 0.25);
    const k = range(r, 0.55, 1.05);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}

export default art({
  name: 'column-fluted',
  w: 900,
  h: H,
  draw: () => {
    const r = rng(1400);
    let s = '';

    // ----------------------------------------------------------------- shaft
    // left/right silhouettes with a couple of weathered notches
    const leftEdge: Pt[] = [
      [CX - SR, SHAFT_TOP - 4],
      [CX - SR, 610],
      [CX - SR + 7, 622],
      [CX - SR + 10, 640],
      [CX - SR + 3, 655],
      [CX - SR, 668],
      [CX - SR - 1, 1080],
      [CX - SR + 5, 1092],
      [CX - SR + 6, 1110],
      [CX - SR, 1118],
      [CX - SR - 1, H + 4],
    ];
    const rightEdge: Pt[] = [
      [CX + SR + 1, H + 4],
      [CX + SR, 880],
      [CX + SR - 8, 870],
      [CX + SR - 9, 852],
      [CX + SR - 3, 842],
      [CX + SR, 836],
      [CX + SR, SHAFT_TOP - 4],
    ];
    const shaft = poly([...leftEdge, ...rightEdge], true);

    // shade as a function of x (cylinder + concave flutes) and y (capital shadow)
    const fluteW = (Math.PI * 2) / FLUTES;
    const off = fluteW / 2; // a flute centred on the axis
    const shadeAt = (x: number, y: number) => {
      const u = Math.max(-0.999, Math.min(0.999, (x - CX) / SR));
      const th = Math.asin(u);
      const k = (th + Math.PI / 2 + off) / fluteW;
      const phi = (k - Math.floor(k)) * 2 - 1; // -1 left wall … 1 right wall of a flute
      const lam = Math.max(0, LIGHT[0] * Math.sin(th) + LIGHT[1] * Math.cos(th));
      const c = Math.min(1, (1 - lam) * 1.05 + 0.06 * Math.max(0, u));
      const f = (1 - phi) / 2; // 1 at the shadowed left wall of a flute, 0 at the lit right wall
      let sh = c * (0.42 + 0.78 * f) + 0.5 * Math.pow(Math.max(0, -phi), 1.6) * (1 - c * 0.6) - 0.03;
      sh += 0.3 * Math.exp(-(y - SHAFT_TOP) / 80); // shadow under the capital
      return Math.max(0, Math.min(0.9, sh));
    };

    // rounded flute tops (cubic arcs); topY(x) gives where a flute's hatching starts
    const fluteTops: [number, number, number, number][] = [];
    let tops = '';
    for (let k = 0; k < FLUTES; k++) {
      const a0 = -Math.PI / 2 - off + k * fluteW;
      const a1 = a0 + fluteW;
      if (a1 <= -Math.PI / 2 || a0 >= Math.PI / 2) continue;
      const x0 = CX + SR * Math.sin(Math.max(-Math.PI / 2, a0));
      const x1 = CX + SR * Math.sin(Math.min(Math.PI / 2, a1));
      const yTop = SHAFT_TOP + 22 - 8 * Math.cos((a0 + a1) / 2);
      const depth = Math.max(6, (x1 - x0) * 0.35);
      fluteTops.push([x0, x1, yTop, depth]);
      tops += `M${x0.toFixed(1)} ${(yTop + depth).toFixed(1)}C${x0.toFixed(1)} ${(yTop - 2).toFixed(1)} ${x1.toFixed(1)} ${(yTop - 2).toFixed(1)} ${x1.toFixed(1)} ${(yTop + depth).toFixed(1)}`;
    }
    const topY = (x: number) => {
      for (const [x0, x1, yTop, depth] of fluteTops) {
        if (x < x0 || x > x1) continue;
        // solve the cubic's x(t) by bisection, return y(t)
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 20; i++) {
          const t = (lo + hi) / 2;
          const xt = (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * x0 + 3 * (1 - t) * t * t * x1 + t ** 3 * x1;
          if (xt < x) lo = t;
          else hi = t;
        }
        const t = (lo + hi) / 2;
        return ((1 - t) ** 3 + t ** 3) * (yTop + depth) + (3 * (1 - t) ** 2 * t + 3 * (1 - t) * t * t) * (yTop - 2);
      }
      return SHAFT_TOP + 20;
    };

    let sf = `<rect x="${CX - SR - 10}" y="${SHAFT_TOP - 10}" width="${SR * 2 + 20}" height="${H}" fill="${STONE}"/>`;
    let eng = '';
    const SP = 6;
    for (let x = CX - SR + 2; x < CX + SR - 1; x += SP) {
      const xx = x + range(r, -0.5, 0.5);
      const w = (y: number) => {
        const v = shadeAt(xx, y);
        return v < 0.14 ? 0 : Math.min(SP * 0.9, (v - 0.1) * SP * 1.1);
      };
      // draw only where the line has weight (lit lines end inside the capital shadow)
      let yEnd = H + 2;
      if (w(H) < 0.5) {
        yEnd = SHAFT_TOP;
        while (yEnd < H && w(yEnd) >= 0.5) yEnd += 10;
        if (yEnd - SHAFT_TOP < 30) continue;
        yEnd += range(r, 0, 50);
      }
      eng += vstroke(xx, topY(xx) + 1, yEnd, w, r);
    }
    sf += `<path d="${eng}" fill="${INK}"/>`;

    // arrises (sharp flute edges)
    let arr = '';
    for (let k = 0; k <= FLUTES; k++) {
      const th = -Math.PI / 2 - off + k * fluteW;
      if (th <= -Math.PI / 2 + 0.02 || th >= Math.PI / 2 - 0.02) continue;
      const x = CX + SR * Math.sin(th);
      const wd = 1.2 + Math.abs(Math.sin(th)) * 1.2;
      arr += brush(
        [
          [x, topY(x - 1) - 1],
          [x + 0.4, 600],
          [x - 0.3, 1000],
          [x, H + 40],
        ],
        wd,
        0.08,
      );
    }
    sf += `<path d="${arr}" fill="${INK}"/>`;
    sf += `<path d="${tops}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;

    // weathering: chips along the arrises, pits and a crack
    let chipFill = '';
    let chipShade = '';
    let chipInk = '';
    let chipLip = '';
    const chipSpots: [number, number, number][] = [
      [3, 520, 14],
      [5, 760, 10],
      [2, 980, 18],
      [6, 1190, 12],
      [4, 1290, 9],
      [7, 450, 8],
    ];
    for (const [k, y, sz] of chipSpots) {
      const th = -Math.PI / 2 - off + k * fluteW;
      const x = CX + SR * Math.sin(th);
      const pts = chip(x, y, sz * 1.1, sz * 2.2, r, 9);
      chipFill += poly(pts, true);
      // upper-left wall of the notch in shadow, lit lower-right lip
      chipShade += poly([...pts.slice(4), pts[0], [x + sz * 0.25, y + sz * 0.3]], true);
      chipInk += brush([...pts.slice(4), pts[0]], 3.4, 0.5);
      chipLip += poly(pts.slice(0, 5));
    }
    sf += `<path d="${chipFill}" fill="${STONE}"/>`;
    sf += `<path d="${chipShade}" fill="url(#hatch-d)"/>`;
    sf += `<path d="${chipInk}" fill="${INK}"/>`;
    sf += `<path d="${chipLip}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
    let pits = '';
    for (let i = 0; i < 70; i++) {
      const x = range(r, CX - SR + 10, CX + 120);
      const y = range(r, SHAFT_TOP + 80, H);
      if (shadeAt(x, y) > 0.35) continue;
      pits += `M${x.toFixed(1)} ${y.toFixed(1)}a${range(r, 0.8, 2).toFixed(1)} ${range(r, 0.6, 1.4).toFixed(1)} 0 1 0 0.1 0Z`;
    }
    sf += `<path d="${pits}" fill="${INK}"/>`;
    const crackPts: Pt[] = [
      [210, 1180],
      [236, 1150],
      [252, 1128],
      [283, 1110],
      [300, 1072],
      [330, 1050],
      [348, 1012],
    ];
    sf += `<path d="${brush(crackPts, 3.2, 0.5)}${brush(
      [
        [283, 1110],
        [298, 1118],
        [318, 1121],
      ],
      2,
      0.6,
    )}" fill="${INK}"/>`;
    s += clipped(shaft, sf);
    s += `<path d="${poly(leftEdge)}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<path d="${poly(rightEdge)}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;

    // ----------------------------------------------------------------- necking & annulets (y 255–330)
    const ringArc = (hw: number, y: number, bow: number) => `M${CX - hw} ${y}Q${CX} ${y - bow * 2} ${CX + hw} ${y}`;
    const neck = `M${CX - SR} 300L${CX + SR} 300L${CX + SR} 332Q${CX} 316 ${CX - SR} 332Z`;
    let nk = `<rect x="${CX - SR - 5}" y="250" width="${SR * 2 + 10}" height="100" fill="${STONE}"/>`;
    nk += `<rect x="${CX - SR - 5}" y="250" width="${SR * 2 + 10}" height="100" fill="url(#hatch-v-fine)"/>`;
    nk += `<path d="M${CX + 120} 250h300v100h-300Z" fill="url(#hatch-x)"/>`;
    s += clipped(neck, nk);
    s += `<path d="${ringArc(SR, 332, 8)}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M${CX - SR} 300L${CX - SR} 332M${CX + SR} 300L${CX + SR} 332" stroke="${INK}" stroke-width="6"/>`;
    // annulets: three thin rings stepping out
    for (let i = 0; i < 3; i++) {
      const yb = 300 - i * 13;
      const hw = SR + 4 + i * 4;
      const band = `M${CX - hw} ${yb}Q${CX} ${yb - 18} ${CX + hw} ${yb}L${CX + hw} ${yb - 11}Q${CX} ${yb - 29} ${CX - hw} ${yb - 11}Z`;
      let b = `<rect x="80" y="${yb - 40}" width="740" height="50" fill="${STONE}"/>`;
      b += `<path d="M${CX - hw} ${yb - 3}Q${CX} ${yb - 21} ${CX + hw} ${yb - 3}L${CX + hw} ${yb + 4}L${CX - hw} ${yb + 4}Z" fill="url(#hatch-h-fine)"/>`;
      b += `<path d="M${CX + 215} ${yb - 40}h200v50h-200Z" fill="url(#hatch-v-fine)"/>`;
      b += `<path d="M${CX + 262} ${yb - 40}h200v50h-200Z" fill="url(#hatch-v)"/>`;
      b += `<path d="M${CX + 304} ${yb - 40}h200v50h-200Z" fill="${INK}"/>`;
      s += clipped(band, b);
      s += `<path d="${band}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    }

    // ----------------------------------------------------------------- echinus (y ~118–262)
    const eTop = 120;
    const eBot = 263;
    const eHwTop = 402;
    const eHwBot = SR + 12;
    const echL = `M${CX - eHwBot} ${eBot}C${CX - eHwBot - 34} ${eBot - 46} ${CX - eHwTop + 2} ${eTop + 60} ${CX - eHwTop} ${eTop}`;
    const echR = `M${CX + eHwBot} ${eBot}C${CX + eHwBot + 34} ${eBot - 46} ${CX + eHwTop - 2} ${eTop + 60} ${CX + eHwTop} ${eTop}`;
    const ech = `M${CX - eHwBot} ${eBot}C${CX - eHwBot - 34} ${eBot - 46} ${CX - eHwTop + 2} ${eTop + 60} ${CX - eHwTop} ${eTop}L${CX + eHwTop} ${eTop}C${CX + eHwTop - 2} ${eTop + 60} ${CX + eHwBot + 34} ${eBot - 46} ${CX + eHwBot} ${eBot}Q${CX} ${eBot - 18} ${CX - eHwBot} ${eBot}Z`;
    let ec = `<rect x="30" y="100" width="840" height="180" fill="${STONE}"/>`;
    // contour hatching: ring arcs bowing upward, denser towards the bottom
    let eh = '';
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const y = eTop + 14 + t * (eBot - eTop - 16);
      const hw = eHwTop - (eHwTop - eHwBot) * Math.pow(t, 0.8) + 10;
      const wd = 0.9 + t * 2.4;
      // left part only lightly, right part fully
      const xs = CX - hw * (t > 0.55 ? 1 : 0.15 + t);
      const pts: Pt[] = [];
      for (let j = 0; j <= 12; j++) {
        const x = xs + ((CX + hw - xs) * j) / 12;
        const u = (x - CX) / hw;
        pts.push([x, y - 10 * (1 - u * u) + range(r, -0.4, 0.4)]);
      }
      eh += brush(pts, wd, 0.25);
    }
    ec += `<path d="${eh}" fill="${INK}"/>`;
    // dark core on the right of the echinus
    ec += `<path d="M${CX + 230} 100C${CX + 300} 160 ${CX + 300} 220 ${CX + 260} 280L${CX + 430} 280L${CX + 430} 100Z" fill="url(#hatch-d)"/>`;
    ec += `<path d="M${CX + 330} 100C${CX + 370} 160 ${CX + 370} 220 ${CX + 345} 280L${CX + 430} 280L${CX + 430} 100Z" fill="${INK}"/>`;
    s += clipped(ech, ec);
    s += `<path d="${echL}${echR}" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>`;
    s += `<path d="M${CX - eHwBot} ${eBot}Q${CX} ${eBot - 18} ${CX + eHwBot} ${eBot}" fill="none" stroke="${INK}" stroke-width="3"/>`;

    // ----------------------------------------------------------------- abacus (y 0–120)
    const ax0 = 28;
    const ax1 = 872;
    // front face, top-left corner broken off
    const abFace: Pt[] = [
      [ax0, -4],
      [ax1, -4],
      [ax1, 98],
      [ax1 - 160, 99],
      [ax1 - 172, 104],
      [ax1 - 190, 99],
      [ax0 + 30, 99],
      [ax0 + 30, 99],
      [ax0, 98],
      [ax0, 62],
      [ax0 + 18, 54],
      [ax0 + 26, 36],
      [ax0 + 52, 24],
      [ax0 + 60, 8],
      [ax0 + 74, -4],
    ];
    const face = poly(abFace, true);
    let ab = `<rect x="0" y="-10" width="900" height="120" fill="${STONE}"/>`;
    // light horizontal engraving across the face, heavier to the right
    let ah = '';
    for (let y = 6; y < 98; y += 6.5) {
      ah += brush(
        [
          [CX + 70 + range(r, -30, 30), y],
          [CX + 250, y + range(r, -0.5, 0.5)],
          [ax1 + 10, y],
        ],
        1.4,
        0.2,
      );
    }
    ab += `<path d="${ah}" fill="${INK}"/>`;
    ab += `<path d="M${ax1 - 110} -10h130v120h-130Z" fill="url(#hatch-v)"/>`;
    ab += `<path d="M${ax1 - 40} -10h60v120h-60Z" fill="${INK}"/>`;
    // weathering speckle + small cracks on the face
    let sp = '';
    for (let i = 0; i < 40; i++) {
      const x = range(r, ax0 + 60, CX + 200);
      const y = range(r, 10, 92);
      sp += `M${x.toFixed(1)} ${y.toFixed(1)}a${range(r, 0.7, 1.8).toFixed(1)} ${range(r, 0.5, 1.2).toFixed(1)} 0 1 0 0.1 0Z`;
    }
    ab += `<path d="${sp}" fill="${INK}"/>`;
    ab += `<path d="${brush(
      [
        [ax0 + 60, 24],
        [ax0 + 92, 40],
        [ax0 + 110, 38],
        [ax0 + 140, 58],
        [ax0 + 152, 74],
      ],
      2.6,
      0.5,
    )}${brush(
      [
        [CX + 40, 99],
        [CX + 52, 82],
        [CX + 48, 66],
        [CX + 62, 50],
      ],
      2.2,
      0.6,
    )}" fill="${INK}"/>`;
    s += clipped(face, ab);
    // broken corner: rough fracture faces
    const frac: Pt[] = [
      [ax0, 62],
      [ax0 + 18, 54],
      [ax0 + 26, 36],
      [ax0 + 52, 24],
      [ax0 + 60, 8],
      [ax0 + 74, -4],
      [ax0, -4],
    ];
    s += `<path d="${poly(frac, true)}" fill="none"/>`;
    s += `<path d="${poly([...frac.slice(0, 6)])}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M${ax0 + 18} 54L${ax0 + 8} 44M${ax0 + 52} 24L${ax0 + 40} 16" stroke="${INK}" stroke-width="2" fill="none"/>`;
    // soffit (underside of the abacus, visible from below) — deep shadow
    const soff = `M${ax0} 98L${ax1} 98L${ax1 - 18} 120L${ax0 + 18} 120Z`;
    s += `<path d="${soff}" fill="${PAPER_SHADE}"/>`;
    s += `<path d="${soff}" fill="url(#hatch-x)"/>`;
    s += `<path d="M${ax1 - 60} 98L${ax1} 98L${ax1 - 18} 120L${ax1 - 70} 120Z" fill="${INK}"/>`;
    s += `<path d="${soff}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="${poly(abFace.slice(5).concat([abFace[0], abFace[1], abFace[2], abFace[3], abFace[4], abFace[5]]))}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
    return s;
  },
});
