import { art, INK, KHAKI, KHAKI_DEEP, PAPER, SKIN, STONE, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, hatch, pointed, vb } from './_util.ts';

/**
 * Bare foot + lower shin in profile facing right. Local frame: heel bottom at
 * (0,0), sole along +x to the toes (~150), leg going up (−y).
 */
function footShape(): Pt[] {
  return [
    [150, -2], // toe tip
    [146, -14],
    [126, -22], // top of the toes
    [100, -30],
    [70, -46], // instep
    [44, -74],
    [34, -110], // front of the ankle / shin
    [30, -260],
    [-30, -260],
    [-22, -150], // calf narrowing to the achilles
    [-16, -80],
    [-14, -40], // heel back
    [-10, -12],
    [4, 0], // heel bottom
    [40, 2],
    [70, -2], // arch (slightly lifted)
    [100, 2], // ball of the foot
    [138, 4],
  ];
}

export default art({
  name: 'feet-step',
  w: 800,
  h: 500,
  bg: PAPER,
  draw: () => {
    const r = rng(121);
    let s = '';

    // ---------------------------------------------------------------- stone steps rising to the right
    // lower step (left), upper step (middle), next riser at the right
    const stepA: Pt[] = [
      [-10, 402],
      [380, 402],
      [380, 510],
      [-10, 510],
    ];
    const stepB: Pt[] = [
      [380, 302],
      [740, 302],
      [740, 510],
      [380, 510],
    ];
    const stepC: Pt[] = [
      [740, 202],
      [810, 202],
      [810, 510],
      [740, 510],
    ];
    for (const [blk, dark] of [[stepA, 0], [stepB, 1], [stepC, 2]] as const) {
      const d = `M${blk.map((p) => p.join(' ')).join('L')}Z`;
      s += P(d, STONE);
      const [x0, y0] = blk[0];
      const x1 = blk[1][0];
      // tread top (thin lit band) and the block face with horizontal engraving, darker toward the bottom
      s += clipped(d, hatch([[x0, y0 + 18], [x1, y0 + 18], [x1, 520], [x0, 520]], 7.5 - dark * 0.8, 0, r, 1.1, INK, 1.2));
      s += clipped(d, hatch([[x0, y0 + 70], [x1, y0 + 70], [x1, 520], [x0, 520]], 6.5, 0, r, 1.0, INK, 1.2));
      s += clipped(d, hatch([[x1 - 40, y0 + 18], [x1, y0 + 18], [x1, 520], [x1 - 40, 520]], 3.4, 90, r, 1.0));
      // block joints and cracks
      const jx = x0 + (x1 - x0) * 0.55;
      s += P(vb([[jx, y0 + 18], [jx + 2, y0 + 60], [jx, 520]], even(3, 0.04)));
      s += P(vb([[x0 + (x1 - x0) * 0.2, y0 + 64], [x0 + (x1 - x0) * 0.25, y0 + 90], [x0 + (x1 - x0) * 0.27, y0 + 130]], pointed(2.4)));
      s += P(vb([[jx + 40, y0 + 120], [jx + 60, y0 + 140], [jx + 66, y0 + 170]], pointed(2)));
      // paper chips on the nosing
      s += P(smooth([[x0 + 60, y0 + 2], [x0 + 80, y0 + 4], [x0 + 70, y0 + 10]], true), PAPER);
      // edges: nosing line, riser corner
      s += P(vb([[x0, y0], [x1, y0]], even(4.5, 0.02)));
      s += P(vb([[x0, y0 + 16], [x1, y0 + 16]], even(2, 0.04)));
      s += P(vb([[x1, y0], [x1, 520]], even(5, 0.02)));
    }
    // shadow of the upper step falling on the lower tread
    s += P(smooth([[300, 402], [380, 402], [380, 416], [310, 412]], true), INK);

    // ---------------------------------------------------------------- feet
    const fs = footShape();
    const foot = (tx: number, ty: number, rot: number, sc: number) => {
      const inner = (() => {
        const d = smooth(fs, true, 0.35);
        let o = P(d, SKIN);
        o += clipped(
          d,
          hatch([[-40, -260], [-10, -260], [-6, 10], [-40, 10]], 3, 90, r, 1.1) + // back of the leg
            hatch([[-20, -10], [150, -10], [150, 10], [-20, 10]], 3, 0, r, 1.2) + // sole edge
            hatch([[20, -260], [40, -260], [44, -70], [30, -70]], 4, 90, r, 0.9),
        );
        o += P(vb(fs.slice(0, 8), (t) => 2.2 + 2.6 * Math.sin(Math.PI * t)));
        o += P(vb(fs.slice(8), (t) => 2.6 + 3.6 * Math.sin(Math.PI * t)));
        // ankle bone, achilles, toes
        o += B([[2, -88], [12, -82], [16, -70]], pointed(3));
        o += B([[-8, -150], [-6, -96]], pointed(2));
        o += B([[118, -20], [122, -6]], pointed(1.8));
        o += B([[132, -17], [134, -4]], pointed(1.6));
        o += P(smooth([[136, -16], [148, -12], [148, -4], [138, -6]], true), PAPER); // toenail
        o += B([[134, -16], [148, -12], [150, -4]], pointed(1.4));
        o += B([[60, -40], [80, -34]], pointed(1.6)); // tendon on the instep
        return o;
      })();
      return `<g transform="translate(${tx} ${ty}) rotate(${rot}) scale(${sc})">${inner}</g>`;
    };
    // back foot pushing off the lower step: heel lifted, pivoting on the ball
    s += foot(178, 306, 40, 0.98);
    // contact shadow under the toes of the back foot
    s += P(smooth([[270, 402], [318, 402], [314, 408], [274, 408]], true), INK);
    // front foot planted on the upper step
    s += foot(440, 300, 0, 1.04);
    s += hatch([[430, 302], [600, 302], [596, 312], [436, 312]], 2.6, 0, r, 1.2);

    // ---------------------------------------------------------------- robe hem at the top of the frame (stride lifts the front)
    const hem: Pt[] = [
      [-10, 172],
      [80, 160],
      [180, 176],
      [270, 150],
      [360, 132],
      [460, 118],
      [560, 128],
      [660, 112],
      [810, 96],
    ];
    const robe = [[-10, -10] as Pt, [810, -10] as Pt, ...hem.slice().reverse()];
    const rd = smooth(robe, true, 0.3);
    s += P(rd, KHAKI);
    const up = (dy: number) => hem.map(([x, y]) => [x, y - dy] as Pt);
    let ri = '';
    ri += P(smooth([[-10, -10], [180, -10], [160, 200], [-10, 200]], true), KHAKI_DEEP);
    ri += hatch([[-10, -10], [220, -10], [200, 200], [-10, 200]], 4.4, 96, r, 1.3);
    ri += hatch([[380, -10], [810, -10], [810, 130], [380, 140]], 6, 94, r, 1.0);
    ri += B([[120, 0], [140, 80], [176, 170]], pointed(5));
    ri += B([[300, 0], [310, 70], [356, 128]], pointed(4.5));
    ri += B([[520, 0], [530, 60], [556, 124]], pointed(4));
    ri += B([[680, 0], [676, 60], [660, 110]], pointed(3.6));
    // trim bands just above the hem (two)
    ri += P(smooth([...up(64), ...up(46).reverse()], true, 0.3), INK);
    ri += P(smooth([...up(34), ...up(22).reverse()], true, 0.3), INK);
    // the shadowed inside of the hem
    ri += P(smooth([...hem, ...hem.slice().reverse().map(([x, y]) => [x, y - 10] as Pt)], true, 0.3), INK);
    s += clipped(rd, ri);
    s += P(vb(hem, even(4.5, 0.02)));
    return s;
  },
});
