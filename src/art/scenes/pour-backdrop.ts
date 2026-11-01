import { art, INK, PAPER, RED, rng, range, smooth, clipped, type Pt } from '../kit.ts';
import { fillP, strokeP, polyD, rectD, n, lerp } from './_util.ts';

const W = 1600;
const H = 1000;
const TOP = 780; // back edge of the counter top
const EDGE = 802; // front edge (nosing)
const UNDER = 942; // where the ragged underside begins (average)

export default art({
  name: 'pour-backdrop',
  w: W,
  h: H,
  bg: RED,
  draw: () => {
    const r = rng(31337);
    let out = '';

    // ------------------------------------------------- wall edge streaks
    for (const side of [0, 1]) {
      let x = 0;
      for (let i = 0; i < 7; i++) {
        const w = range(r, 8, 46) * (1 - i / 9);
        const xx = side ? W - x - w : x;
        const y1 = TOP - range(r, 0, 220);
        out += fillP(rectD(xx, -5, w, y1 + 5), 'url(#tone-fine)', n(lerp(0.55, 0.15, i / 7)));
        x += w + range(r, 10, 60);
      }
      let lines = '';
      for (let i = 0; i < 18; i++) {
        const d = Math.pow(i / 18, 1.5) * 210 + range(r, -3, 3);
        const xx = side ? W - d : d;
        lines += `M${n(xx)} ${n(range(r, -5, 120))}V${n(TOP - range(r, 0, 160))}`;
      }
      out += strokeP(lines, INK, 1, 0.35);
    }
    // a soft shadow where the wall meets the counter
    out += fillP(rectD(0, TOP - 14, W, 14), 'url(#hatch-h-fine)', 0.5);

    // ---------------------------------------------------------- counter
    // ragged underside boundary: dry-brush edge, small jags at two scales
    const rag: Pt[] = [];
    let drift = 0;
    for (let x = -10; x <= W + 10; x += 6) {
      drift = drift * 0.8 + range(r, -2.2, 2.2);
      rag.push([x, UNDER + Math.sin(x * 0.009) * 3 + drift + (r() < 0.12 ? range(r, -7, 3) : 0)]);
    }
    const face = polyD([[-10, EDGE], [W + 10, EDGE], ...rag.slice().reverse()]);
    out += fillP(polyD([[-10, TOP], [W + 10, TOP], [W + 10, H + 10], [-10, H + 10]]), PAPER);
    // top surface: a sliver seen from just above, with a few long reflections
    let topLines = '';
    for (let y = TOP + 5; y < EDGE - 3; y += 5) {
      let x = range(r, -40, 40);
      while (x < W) {
        const len = range(r, 200, 700);
        topLines += `M${n(x)} ${n(y)}H${n(x + len)}`;
        x += len + range(r, 40, 200);
      }
    }
    out += strokeP(topLines, INK, 0.7, 0.55);
    out += strokeP(`M-10 ${TOP}H${W + 10}`, INK, 2.2);
    // front face: many fine horizontal lines, tightening and thickening downwards
    let face1 = '';
    let face2 = '';
    let face3 = '';
    let y = EDGE + 6;
    while (y < UNDER + 6) {
      const t = (y - EDGE) / (UNDER - EDGE);
      const pts: Pt[] = [];
      for (let x = -10; x <= W + 10; x += 80) pts.push([x, y + range(r, -0.5, 0.5)]);
      let d = smooth(pts);
      if (r() < 0.25 - t * 0.2) {
        // broken line: two pieces
        const cut = range(r, 100, W - 100);
        d = smooth(pts.filter(([x]) => x < cut)) + smooth(pts.filter(([x]) => x > cut + range(r, 30, 160)));
      }
      if (t < 0.4) face1 += d;
      else if (t < 0.75) face2 += d;
      else face3 += d;
      y += lerp(6.2, 2.6, Math.pow(t, 0.9));
    }
    out += clipped(face, strokeP(face1, INK, 0.8) + strokeP(face2, INK, 1.2) + strokeP(face3, INK, 1.8));
    // heavy nosing line
    out += strokeP(`M-10 ${EDGE}H${W + 10}`, INK, 4);
    // dark underside with ragged top edge and a few drips
    let under = polyD([...rag, [W + 10, H + 10], [-10, H + 10]]);
    // dry-brush streaks: horizontal ink tongues licking up into the hatched face
    for (let i = 0; i < 26; i++) {
      const x = range(r, -20, W - 60);
      const len = range(r, 40, 220);
      const yy = UNDER - range(r, 2, 14);
      under += smooth([[x, yy + 3], [x + len * 0.3, yy - range(r, 0.5, 2)], [x + len, yy + 1], [x + len * 0.5, yy + 4]], true, 0.4);
    }
    out += fillP(under, INK);
    // pale flecks in the black so it reads as worn stone, not a void
    let flecks = '';
    for (let i = 0; i < 40; i++) {
      const x = range(r, 0, W);
      const yy = range(r, UNDER + 14, H - 6);
      flecks += `M${n(x)} ${n(yy)}h${n(range(r, 6, 30))}`;
    }
    out += strokeP(flecks, PAPER, 0.9, 0.35);
    return out;
  },
});
