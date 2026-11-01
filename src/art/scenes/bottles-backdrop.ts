import { art, INK, PAPER, rng, range, smooth, type Pt } from '../kit.ts';
import { fillP, strokeP, ribbon, polyD, rectD, ellipseD, n, lerp, clamp } from './_util.ts';

const W = 1600;
const H = 1000;
const FIELD = 800; // bottom of the stroke field
const SLAB_BACK = 778;
const SLAB_FRONT = 832;
const SLAB_UNDER = 906;

/** Shared wave so neighbouring strokes ripple together like a hanging curtain. */
const flowX = (x0: number, y: number) => x0 + 3.6 * Math.sin(y * 0.011 + x0 * 0.009) + 1.6 * Math.sin(y * 0.029 + x0 * 0.021 + 1.1);

export default art({
  name: 'bottles-backdrop',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(7);
    let out = '';

    // ------------------------------------------------------------- field
    // Drawn in negative: solid ink with tapering paper gaps between the strokes.
    out += fillP(rectD(0, -2, W, FIELD + 2), INK);
    const sp = 8.6;
    let gaps = '';
    let drops = '';
    for (let x0 = -sp; x0 < W + sp; x0 += sp * range(r, 0.92, 1.08)) {
      const centre = 1 - Math.pow(Math.abs(x0 - W / 2) / (W / 2), 2) * 0.35; // brighter behind the middle
      const g0 = (sp - 1.4) * centre * range(r, 0.85, 1.05);
      // where this gap pinches shut: mostly in the lower band
      const yEnd = clamp(lerp(560, 790, Math.pow(r(), 0.55)), 0, FIELD - 6);
      const p = range(r, 1.8, 3.2);
      const pts: Pt[] = [];
      for (let y = -6; y <= yEnd; y += 30) pts.push([flowX(x0, y), y]);
      pts.push([flowX(x0, yEnd), yEnd]);
      const hasDrip = r() < 0.45;
      const tail = hasDrip ? range(r, 1.6, 2.6) : 0.4;
      gaps += ribbon(
        pts,
        (t) => {
          const y = lerp(-6, yEnd, t);
          const k = clamp(y / yEnd, 0, 1);
          const w = g0 * (1 - Math.pow(k, p) * 0.9);
          return Math.max(tail, hasDrip ? w : w * (1 - Math.pow(k, 6)));
        },
        0.4,
        false,
      );
      if (hasDrip) {
        // teardrop: narrow neck swelling into a round drop
        const bx = flowX(x0, yEnd);
        const bulb = range(r, 2, 3.6);
        drops += smooth(
          [
            [bx - tail * 0.5, yEnd - 4],
            [bx - bulb, yEnd + bulb * 1.2],
            [bx - bulb * 0.7, yEnd + bulb * 2.3],
            [bx, yEnd + bulb * 2.6],
            [bx + bulb * 0.7, yEnd + bulb * 2.3],
            [bx + bulb, yEnd + bulb * 1.2],
            [bx + tail * 0.5, yEnd - 4],
          ],
          true,
          0.45,
        );
        // occasionally a detached drop falls below
        if (r() < 0.3 && yEnd < FIELD - 40) {
          const dy = yEnd + range(r, 18, 46);
          const db = range(r, 1.4, 2.6);
          drops += ellipseD(flowX(x0, dy), dy, db, db * 1.45);
        }
      }
    }
    out += fillP(gaps, PAPER);
    out += fillP(drops, PAPER);
    // fine ink hairlines inside the widest gaps near the top (engraving texture)
    let hair = '';
    for (let x0 = -sp / 2; x0 < W; x0 += sp * 2.1) {
      const pts: Pt[] = [];
      const yEnd = range(r, 120, 380);
      for (let y = -6; y <= yEnd; y += 40) pts.push([flowX(x0, y), y]);
      hair += smooth(pts);
    }
    out += strokeP(hair, INK, 0.6, 0.6);

    // ------------------------------------------------------------- slab
    // top face seen slightly from above
    const top = polyD([[-10, SLAB_BACK], [W + 10, SLAB_BACK], [W + 10, SLAB_FRONT], [-10, SLAB_FRONT]]);
    out += fillP(top, PAPER);
    let refl = '';
    for (let x = 20; x < W; x += range(r, 30, 90)) refl += `M${n(x)} ${SLAB_BACK + 4}L${n(x + (x - W / 2) * 0.03)} ${n(SLAB_BACK + range(r, 14, 40))}`;
    out += strokeP(refl, INK, 0.9, 0.5);
    out += strokeP(`M-10 ${SLAB_BACK}H${W + 10}`, INK, 2.4);
    // front edge with fine horizontal lines, tightening downwards
    let fl = '';
    let y = SLAB_FRONT + 5;
    while (y < SLAB_UNDER) {
      const t = (y - SLAB_FRONT) / (SLAB_UNDER - SLAB_FRONT);
      let x = -10;
      while (x < W + 10) {
        const len = range(r, 200, 800);
        fl += `M${n(x)} ${n(y + range(r, -0.4, 0.4))}H${n(x + len)}`;
        x += len + range(r, 4, 30) * (1 - t);
      }
      y += lerp(5.4, 2.6, t);
    }
    out += strokeP(fl, INK, 1);
    out += strokeP(`M-10 ${SLAB_FRONT}H${W + 10}`, INK, 4);
    // black underside with a slightly ragged lip
    const lip: Pt[] = [];
    for (let x = -10; x <= W + 10; x += 10) lip.push([x, SLAB_UNDER + range(r, -2.5, 2.5)]);
    out += fillP(polyD([...lip, [W + 10, H + 10], [-10, H + 10]]), INK);
    return out;
  },
});
