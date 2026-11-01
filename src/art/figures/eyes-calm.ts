import { art, GREY, INK, PAPER, rng, type Pt } from '../kit.ts';
import { B, P, hatch, lock, pointed, tail, vb } from './_util.ts';
import { bigEye, featherBrow } from './_saint.ts';

const W = 1600;

export default art({
  name: 'eyes-calm',
  w: W,
  h: 500,
  bg: PAPER,
  draw: () => {
    const r = rng(41);
    let s = '';
    const M = (pts: Pt[], side: number): Pt[] => (side < 0 ? pts : pts.map(([x, y]) => [W - x, y] as Pt));

    for (const side of [-1, 1]) {
      // eye socket shading (between brow and lid), darker toward the nose
      s += hatch(M([[700, 150], [600, 190], [420, 168], [220, 180], [110, 230], [130, 280], [260, 230], [420, 214], [600, 240], [700, 300]], side), 6, side < 0 ? 20 : 160, r, 1.3);
      s += hatch(M([[704, 190], [660, 220], [650, 300], [690, 360], [710, 380]], side), 5, side < 0 ? 96 : 84, r, 1.2);
      // under-eye / cheek top
      s += hatch(M([[660, 400], [500, 430], [320, 432], [150, 390], [100, 440], [200, 500], [660, 500]], side), 8, side < 0 ? 160 : 20, r, 0.9);
      s += hatch(M([[30, 160], [110, 160], [120, 400], [60, 500], [30, 500]], side), 5, 90, r, 1.3);
      // brow: feathered hair strokes, dense and upright at the inner head, thinning to the tail
      const top = M([[668, 150], [560, 112], [400, 92], [240, 98], [120, 124], [70, 150]], side);
      const bot = M([[664, 190], [560, 156], [420, 138], [260, 136], [130, 146], [70, 160]], side);
      s += featherBrow(top, bot, side < 0 ? 301 : 302, 430, 6.4);
      s += B(M([[662, 196], [600, 178], [540, 170]], side), tail(3));
    }
    // eyes
    s += bigEye({ cx: 400, cy: 296, w: 480, h: 118, side: -1, irisR: 86, pupilR: 27, irisFill: GREY, irisOff: [16, 14], seed: 3, creaseGap: 0.36 });
    s += bigEye({ cx: W - 400, cy: 296, w: 480, h: 118, side: 1, irisR: 86, pupilR: 27, irisFill: GREY, irisOff: [-16, 14], seed: 4, creaseGap: 0.36 });

    // nose bridge
    s += P(vb([[716, 230], [728, 360], [732, 500]], (t) => 2 + 5 * Math.sin(Math.PI * t)));
    s += P(vb([[884, 230], [874, 360], [868, 500]], (t) => 2 + 4 * Math.sin(Math.PI * t)));
    s += hatch([[880, 220], [930, 240], [920, 500], [866, 500], [872, 360]], 4, 96, r, 1.4);
    s += hatch([[700, 220], [726, 236], [732, 500], [690, 500]], 6, 84, r, 1.0);
    // brow knot (steady frown)
    s += B([[772, 160], [776, 196], [778, 222]], pointed(2.2));
    s += B([[828, 160], [824, 196], [822, 222]], pointed(2.2));
    // hair at the frame edges (curtain of locks)
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : W;
      const dir = side < 0 ? 1 : -1;
      s += P(`M${x0} -10L${x0 + dir * 22} -10L${x0 + dir * 16} 510L${x0} 510Z`, INK);
      for (let i = 0; i < 6; i++) {
        const xi = x0 + dir * (14 + i * 11);
        s += lock([[xi, -30], [xi + dir * 4, 150], [xi + dir * (6 + i * 3), 330], [xi + dir * (8 + i * 6), 530]], 30 - i * 3, r, { strands: 3, split: 0.55, tipVar: 0.6, gloss: i % 2, glossW: 1.6 });
      }
    }
    return s;
  },
});
