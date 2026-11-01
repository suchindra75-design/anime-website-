import { art, ACCENT, INK, PAPER, rng, smooth, type Pt } from '../kit.ts';
import { B, P, hatch, lock, pointed, tail, vb } from './_util.ts';
import { bigEye, featherBrow } from './_saint.ts';

const W = 1600;
const H = 600;

/** Sweat drop outline with a highlight. */
function drop(x: number, y: number, s: number, rot: number): string {
  const pts: Pt[] = [
    [0, -26],
    [9, -6],
    [13, 8],
    [8, 18],
    [0, 21],
    [-8, 18],
    [-13, 8],
    [-9, -6],
  ];
  const d = smooth(pts.map(([px, py]) => [px * s, py * s] as Pt), true, 0.5);
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}" fill="${PAPER}" stroke="${INK}" stroke-width="${3.2 * s}"/><path d="${vb([[-6 * s, 2 * s], [-5 * s, 10 * s], [0, 14 * s]], pointed(3 * s))}" fill="${INK}"/></g>`;
}

export default art({
  name: 'eyes-wide',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(52);
    let s = '';
    const M = (pts: Pt[], side: number): Pt[] => (side < 0 ? pts : pts.map(([x, y]) => [W - x, y] as Pt));

    for (const side of [-1, 1]) {
      const dir = side < 0 ? -1 : 1;
      // socket shading (lighter: the lids are stretched open)
      s += hatch(M([[700, 200], [600, 214], [420, 190], [230, 210], [130, 270], [150, 300], [260, 250], [420, 236], [600, 262], [700, 320]], side), 7, side < 0 ? 20 : 160, r, 1.1);
      s += hatch(M([[706, 230], [668, 260], [660, 360], [700, 430], [716, 450]], side), 5, side < 0 ? 96 : 84, r, 1.2);
      // cheek tops
      s += hatch(M([[660, 500], [500, 520], [320, 520], [140, 480], [100, 540], [200, 600], [660, 600]], side), 8, side < 0 ? 160 : 20, r, 0.9);
      // raised, arched brows: feathered hair strokes, dense at the inner head, thinning to the tail
      const top = M([[690, 168], [600, 112], [460, 76], [300, 74], [180, 98], [104, 138]], side);
      const bot = M([[684, 192], [590, 138], [450, 104], [300, 100], [186, 116], [104, 150]], side);
      s += featherBrow(top, bot, side < 0 ? 401 : 402, 400, 6);
      // tremble marks beside the outer corners
      for (let i = 0; i < 3; i++) {
        const x = side < 0 ? 132 - i * 16 : W - 132 + i * 16;
        s += B([[x, 300 + i * 4], [x - dir * 6, 340 + i * 2], [x, 380]], pointed(3.4 - i * 0.6));
      }
      // shock lines radiating from above the eye
      for (let i = 0; i < 4; i++) {
        const bx = side < 0 ? 330 + i * 70 : W - 330 - i * 70;
        s += B([[bx, 40 - (i % 2) * 8], [bx + dir * 4, 58]], pointed(3));
      }
    }
    // forehead wrinkles (brows raised)
    for (let i = 0; i < 3; i++) {
      const y = 38 + i * 22;
      s += B([[560 + i * 30, y + 14], [680, y], [800, y + 8], [920, y], [1040 - i * 30, y + 14]], pointed(3.2 - i * 0.6));
    }
    // eyes: wide open, iris ringed by white, tiny pupils
    s += bigEye({ cx: 420, cy: 352, w: 470, h: 200, side: -1, irisR: 86, pupilR: 10, irisFill: ACCENT, irisOff: [6, 2], seed: 13, creaseGap: 0.22, lashes: 1.2, shadowLid: false });
    s += bigEye({ cx: W - 420, cy: 352, w: 470, h: 200, side: 1, irisR: 86, pupilR: 10, irisFill: ACCENT, irisOff: [-6, 2], seed: 14, creaseGap: 0.22, lashes: 1.2, shadowLid: false });

    // nose bridge
    s += P(vb([[716, 260], [728, 420], [734, 600]], (t) => 2 + 5 * Math.sin(Math.PI * t)));
    s += P(vb([[884, 260], [874, 420], [866, 600]], (t) => 2 + 4 * Math.sin(Math.PI * t)));
    s += hatch([[880, 250], [930, 270], [920, 600], [864, 600], [872, 420]], 4, 96, r, 1.4);
    s += hatch([[700, 250], [726, 266], [734, 600], [690, 600]], 6, 84, r, 1.0);

    // sweat
    s += drop(150, 236, 1.5, -18);
    s += drop(1488, 220, 1.2, 14);
    s += drop(760, 300, 1.0, -6);
    s += drop(1464, 300, 0.8, 10);

    // long hair framing both edges
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : W;
      const dir = side < 0 ? 1 : -1;
      s += P(`M${x0} -10L${x0 + dir * 26} -10L${x0 + dir * 18} ${H + 10}L${x0} ${H + 10}Z`, INK);
      for (let i = 0; i < 9; i++) {
        const xi = x0 + dir * (8 + i * 11);
        const sway = (i % 3) * 10;
        s += lock(
          [
            [xi, -30],
            [xi + dir * (4 + sway), 160],
            [xi + dir * (2 + i * 4), 340],
            [xi + dir * (10 + i * 8 + sway), 480],
            [xi + dir * (14 + i * 11), H + 30],
          ],
          32 - i * 2.6,
          r,
          { strands: 3, split: 0.6, tipVar: 0.55, gloss: i % 2, glossW: 1.8 },
        );
      }
      // stray strands across the cheek
      s += B([[x0 + dir * 60, 120], [x0 + dir * 120, 300], [x0 + dir * 150, 470], [x0 + dir * 140, 600]], tail(3.2));
      s += B([[x0 + dir * 50, 60], [x0 + dir * 100, 240], [x0 + dir * 170, 420]], tail(2.4));
    }
    return s;
  },
});
