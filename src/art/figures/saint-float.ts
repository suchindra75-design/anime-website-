import { art, ACCENT, INK, SKIN, clipped, range, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, hatch, lock, offset, pointed, relaxedHand, vb } from './_util.ts';
import { profileFace, profileHair } from './_saint.ts';

/*
 * Designed in a free "pose space" and fitted into the 900×1100 viewBox by FIT.
 * Pose: profile facing left, head thrown back (eyes closed), chest lifted and
 * back arched, arms drifting loosely, knees bent with the shins hanging back,
 * feet pointed. The ACCENT robe billows behind into a huge sail to the right.
 */
const BOX = { x0: 150, x1: 900, y0: 30, y1: 1140 };
const FS = 950 / (BOX.y1 - BOX.y0);
const FIT = `translate(${(450 - FS * ((BOX.x0 + BOX.x1) / 2)).toFixed(1)} ${(550 - FS * ((BOX.y0 + BOX.y1) / 2)).toFixed(1)}) scale(${FS.toFixed(4)})`;

// head: profile space → pose space (neck point, tilted back)
const HEAD = 'translate(418 366) rotate(34) scale(0.4) translate(-430 -600)';

/** Bare lower leg + pointed foot. K knee, A ankle; calf on the right-hand side of K→A. */
function lowerLeg(K: Pt, A: Pt, r: () => number, far: boolean): string {
  const L = Math.hypot(A[0] - K[0], A[1] - K[1]);
  const d: Pt = [(A[0] - K[0]) / L, (A[1] - K[1]) / L];
  const n: Pt = [-d[1], d[0]]; // toward the calf (back of the leg)
  const fa = Math.atan2(d[1], d[0]) - 0.16; // foot continues the shin, curling forward a touch
  const df: Pt = [Math.cos(fa), Math.sin(fa)];
  const nf: Pt = [-df[1], df[0]];
  const at = (p: Pt, u: number, v: number, dd: Pt = d, nn: Pt = n): Pt => [p[0] + dd[0] * u + nn[0] * v, p[1] + dd[1] * u + nn[1] * v];
  const T = at(A, 122, 0, df, nf); // toe tip
  // shin (front, tibia side) → instep → toes
  const front: Pt[] = [at(K, -8, -31), at(K, L * 0.2, -28), at(K, L * 0.55, -21), at(A, -12, -15), at(A, 10, -16), at(A, 52, -15, df, nf), at(A, 94, -10, df, nf), at(T, -8, -4, df, nf), T];
  // sole → heel → achilles → calf → back of knee
  const back: Pt[] = [at(T, -5, 6, df, nf), at(A, 90, 12, df, nf), at(A, 62, 16, df, nf), at(A, 30, 17, df, nf), at(A, 6, 23), at(A, -22, 16), at(K, L * 0.62, 23), at(K, L * 0.3, 40), at(K, L * 0.1, 37), at(K, -6, 30)];
  const outline = [...front, ...back];
  const od = smooth(outline, true, 0.4);
  let o = P(od, SKIN);
  const ang = (v: Pt) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  // engraving along the leg: calf side in shadow; far leg darker overall
  const shade = hatch([at(K, -10, 4), at(K, -10, 40), at(A, 20, 26), at(T, 0, 10, df, nf), at(A, 40, 2, df, nf), at(A, -10, 2)], 3.6, ang(n), r, 1.2);
  o += clipped(od, shade + (far ? hatch([at(K, -10, -40), at(K, -10, 40), at(T, 10, 30, df, nf), at(T, 10, -30, df, nf)], 5, ang(d) + 70, r, 0.9) : ''));
  o += P(vb(front, (t) => 2 + 3 * Math.sin(Math.PI * t)));
  o += P(vb(back, (t) => 2.6 + 4.2 * Math.sin(Math.PI * t)));
  // tibia ridge, ankle bone, toe creases, sole crease
  o += B([at(K, 30, -14), at(K, L * 0.5, -12), at(A, -26, -9)], pointed(1.8));
  o += B([at(A, -6, -2), at(A, 6, 2), at(A, 10, 8)], pointed(2.6));
  o += B([at(T, -22, -4, df, nf), at(T, -14, 4, df, nf)], pointed(1.6));
  o += B([at(T, -34, -6, df, nf), at(T, -27, 3, df, nf)], pointed(1.4));
  o += B([at(A, 54, 8, df, nf), at(A, 70, 9, df, nf)], pointed(1.6));
  return o;
}

export default art({
  name: 'saint-float',
  w: 900,
  h: 1100,
  draw: () => {
    const r = rng(101);
    let s = '';

    // ================================================================ the sail (robe billowing behind, to the right)
    const F: Pt = [520, 640]; // folds radiate from the hip
    const edge: Pt[] = [
      [512, 560],
      [600, 470],
      [700, 380],
      [800, 268],
      [880, 196], // top-right tip
      [892, 300],
      [874, 430],
      [828, 560],
      [760, 680],
      [672, 784],
      [570, 862],
      [470, 900],
      [380, 892],
      [330, 870], // meets the hem at the knees
    ];
    const sailPts: Pt[] = [...edge, [430, 760], [470, 680]];
    const sailD = smooth(sailPts, true, 0.35);
    s += P(sailD, ACCENT);
    let si = '';
    // radiating folds: crest line + shadow strip on its lower side
    const outer = edge.slice(4);
    const foldEnds: Pt[] = [outer[0], outer[1], [886, 370], outer[2], [852, 500], outer[3], [796, 622], outer[4], [718, 735], outer[5], [622, 826], outer[6]];
    foldEnds.forEach((e, i) => {
      const m: Pt = [(F[0] + e[0]) / 2 + (i % 2 ? 18 : -12), (F[1] + e[1]) / 2 + (i % 2 ? -10 : 14)];
      si += B([F, m, e], (t) => 0.6 + (i % 2 ? 3.4 : 5.2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t)), 0.7));
      if (i % 2 === 0) {
        const lo = offset([F, m, e], 26);
        si += hatch([F, m, e, ...lo.slice().reverse()], 4, (Math.atan2(e[1] - F[1], e[0] - F[0]) * 180) / Math.PI + 12, r, 1.25);
      }
    });
    // deep billow shadow along the lower half
    si += hatch([[470, 900], [600, 860], [720, 760], [810, 640], [870, 480], [910, 480], [910, 960], [470, 960]], 4.4, 58, r, 1.3);
    // trim bands following the hem (outer edge), two of them
    const hemIn = (dIn: number) => offset(edge.slice(4), dIn);
    si += P(smooth([...hemIn(22), ...hemIn(38).reverse()], true, 0.3), INK);
    si += P(smooth([...hemIn(48), ...hemIn(59).reverse()], true, 0.3), INK);
    s += clipped(sailD, si);
    s += P(vb(edge.slice(0, 5), (t) => 2 + 4 * Math.sin(Math.PI * t)));
    s += P(vb(edge.slice(4), (t) => 3 + 5 * Math.sin(Math.PI * t)));

    // ================================================================ hair streaming upward (behind the head)
    const N = 15;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const root: Pt = [478 + Math.sin(k * 2.4) * 56, 218 + k * 120];
      const len = 190 + Math.sin(k * Math.PI) * 120 + range(r, -16, 16);
      const a = ((-100 + k * 48 + range(r, -5, 5)) * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const wav = range(r, 6, 16) * (i % 2 ? 1 : -1);
      const pts: Pt[] = [0, 0.25, 0.5, 0.75, 1].map((t, j) => {
        const w = [0, 0.6, -0.8, 0.7, -0.3][j] * wav;
        return [root[0] + dx * len * t - dy * w + t * t * 40, root[1] + dy * len * t + dx * w] as Pt;
      });
      s += lock(pts, (t) => (36 - k * 8) * (1 - 0.62 * t), r, { strands: 5, split: 0.5, tipVar: 0.5, jitter: 0.6, gloss: i % 3 === 0 ? 1 : 0, glossW: 1.8 });
    }

    // ================================================================ far arm (behind the body) drifting out over the sail
    const farSleeve: Pt[] = [
      [452, 404],
      [520, 430],
      [590, 470],
      [650, 520],
      [688, 566], // opening top
      [664, 640], // opening bottom / hanging cloth
      [600, 650],
      [540, 610],
      [480, 540],
      [446, 470],
    ];
    const fsd = smooth(farSleeve, true, 0.35);
    s += P(fsd, ACCENT);
    const fOpen: Pt[] = [
      [688, 566],
      [676, 604],
      [664, 640],
    ];
    s += clipped(
      fsd,
      hatch([[440, 500], [700, 560], [700, 680], [440, 680]], 4.2, 12, r, 1.3) +
        B([[470, 440], [540, 500], [610, 560], [652, 620]], pointed(3.6)) +
        B([[500, 470], [560, 560], [600, 630]], pointed(3)) +
        P(smooth([...offset(fOpen, 12), ...offset(fOpen, 24).reverse()], true, 0.3), INK) +
        P(smooth([...offset(fOpen, 32), ...offset(fOpen, 40).reverse()], true, 0.3), INK),
    );
    s += P(vb(farSleeve.slice(0, 6), (t) => 2.4 + 3.4 * Math.sin(Math.PI * t)));
    s += P(vb(farSleeve.slice(5).concat([farSleeve[0]]), (t) => 2 + 3 * Math.sin(Math.PI * t)));
    // far wrist emerging + hand drifting down-right
    s += P(smooth([[672, 560], [700, 574], [716, 600], [690, 622], [668, 600]], true, 0.4), SKIN);
    s += P(vb([[672, 560], [700, 574], [716, 600]], pointed(3)));
    s += relaxedHand([706, 596], 64, 100, r, true);

    // ================================================================ legs (below the robe)
    s += lowerLeg([396, 812], [482, 966], r, true); // far leg
    s += lowerLeg([336, 842], [404, 1010], r, false); // near leg

    // ================================================================ head (face + neck + hair cap), under the collar
    const hair = profileHair({ seed: 33, capOnly: true });
    s += `<g transform="${HEAD}">${profileFace({ closed: true, worry: 0.15, seed: 34 })}${hair.front}</g>`;

    // ================================================================ torso, hips and thighs in the robe
    const body: Pt[] = [
      [366, 384], // collar front
      [344, 430],
      [334, 482], // chest lifted
      [350, 532],
      [384, 578], // waist front (narrow)
      [398, 626],
      [388, 676], // thighs go forward-left
      [350, 740],
      [312, 802],
      [296, 850], // knee
      [318, 884],
      [380, 892], // hem behind the knees
      [460, 852],
      [524, 800],
      [562, 720], // seat
      [540, 650],
      [504, 604], // small of the back (arch)
      [506, 530],
      [490, 456],
      [458, 410], // nape / upper back
      [420, 396],
    ];
    const bd = smooth(body, true, 0.38);
    s += P(bd, ACCENT);
    let bi = '';
    bi += hatch([[466, 408], [500, 450], [514, 530], [508, 600], [550, 660], [570, 730], [534, 796], [520, 720], [486, 640], [476, 560], [466, 470]], 4.2, 100, r, 1.3);
    bi += hatch([[300, 840], [460, 820], [540, 800], [520, 900], [300, 900]], 4, 8, r, 1.3);
    bi += B([[372, 470], [402, 520], [436, 560]], pointed(3));
    bi += B([[452, 452], [470, 520], [478, 580]], pointed(3.4));
    bi += B([[430, 650], [390, 720], [348, 800]], pointed(4));
    bi += B([[470, 670], [430, 750], [380, 836]], pointed(3.6));
    bi += B([[520, 700], [480, 780], [430, 850]], pointed(3.2));
    const hemFront: Pt[] = [
      [300, 846],
      [318, 878],
      [380, 886],
      [460, 846],
      [520, 796],
    ];
    bi += P(smooth([...offset(hemFront, -22), ...offset(hemFront, -36).reverse()], true, 0.3), INK);
    bi += P(smooth([...offset(hemFront, -44), ...offset(hemFront, -54).reverse()], true, 0.3), INK);
    s += clipped(bd, bi);
    s += P(vb(body.slice(0, 11), (t) => 2.6 + 4 * Math.sin(Math.PI * t)));
    s += P(vb(body.slice(10, 15), (t) => 2.4 + 3.6 * Math.sin(Math.PI * t)));
    s += P(vb(body.slice(14).concat([body[0]]), (t) => 2.6 + 4.6 * Math.sin(Math.PI * t)));
    // waist tie: a sash with ends fluttering back into the sail
    const sash: Pt[] = [
      [376, 562],
      [440, 580],
      [508, 578],
      [508, 606],
      [444, 610],
      [390, 594],
    ];
    const sashD = smooth(sash, true, 0.3);
    s += P(sashD, ACCENT) + clipped(sashD, hatch([[370, 560], [530, 560], [530, 620], [370, 620]], 3, 30, r, 1.2));
    s += B(sash.slice(0, 3), even(3, 0.05)) + B(sash.slice(3), even(3, 0.05));
    const tie1: Pt[] = [
      [514, 584],
      [570, 600],
      [640, 594],
      [690, 610],
      [640, 616],
      [580, 622],
      [520, 606],
    ];
    s += P(smooth(tie1, true, 0.4), ACCENT);
    s += P(vb(tie1.slice(0, 4), pointed(3))) + P(vb(tie1.slice(3), pointed(3)));
    const tie2: Pt[] = [
      [512, 596],
      [560, 630],
      [606, 666],
      [640, 700],
      [596, 690],
      [550, 650],
    ];
    const tie2D = smooth(tie2, true, 0.4);
    s += P(tie2D, ACCENT) + clipped(tie2D, hatch([[500, 590], [650, 590], [650, 710], [500, 710]], 3.4, 50, r, 1.1));
    s += P(vb([...tie2, [512, 600]], (t) => 1.6 + 2.4 * Math.sin(Math.PI * t)));
    // crossed collar
    const colA: Pt[] = [
      [366, 382],
      [400, 404],
      [430, 444],
      [452, 500],
    ];
    const colB: Pt[] = offset(colA, 14);
    const colD = smooth([...colA, ...colB.slice().reverse()], true, 0.3);
    s += P(colD, ACCENT) + clipped(colD, hatch([[350, 370], [470, 370], [470, 510], [350, 510]], 3, 40, r, 1.1));
    s += B(colA, even(3, 0.06)) + B(colB, even(2.6, 0.06));
    s += B([[420, 392], [444, 400], [462, 408]], even(3, 0.1));

    // ================================================================ near arm + sleeve (in front of the body)
    // upper arm drifts out to the left, forearm hangs; the wide sleeve falls in a bell under it
    const sleeve: Pt[] = [
      [400, 404],
      [430, 440],
      [404, 486], // underarm
      [372, 520],
      [356, 600], // hanging pouch of the sleeve
      [320, 670],
      [272, 690],
      [232, 660], // opening (around the wrist)
      [232, 610],
      [262, 540],
      [300, 470],
      [348, 420],
    ];
    const svd = smooth(sleeve, true, 0.35);
    s += P(svd, ACCENT);
    const opening: Pt[] = [
      [232, 660],
      [232, 610],
      [252, 566],
    ];
    s += clipped(
      svd,
      hatch([[360, 470], [440, 470], [380, 700], [330, 700]], 4.6, 96, r, 1.2) +
        hatch([[220, 640], [380, 600], [380, 720], [220, 720]], 4, 12, r, 1.2) +
        B([[370, 430], [330, 500], [300, 580], [280, 660]], pointed(4)) +
        B([[396, 456], [360, 540], [336, 630]], pointed(3)) +
        P(smooth([...offset(opening, 12), ...offset(opening, 26).reverse()], true, 0.3), INK) +
        P(smooth([...offset(opening, 34), ...offset(opening, 43).reverse()], true, 0.3), INK),
    );
    s += P(vb(sleeve.slice(0, 8), (t) => 2.6 + 4 * Math.sin(Math.PI * t)));
    s += P(vb(sleeve.slice(7).concat([sleeve[0]]), (t) => 2 + 3 * Math.sin(Math.PI * t)));
    // dark inside of the opening, wrist and the relaxed hand
    s += P(smooth([[232, 660], [232, 610], [246, 596], [244, 640], [240, 672]], true, 0.4), INK);
    s += P(smooth([[214, 624], [242, 630], [240, 668], [212, 662]], true, 0.4), SKIN);
    s += P(vb([[214, 624], [212, 662]], pointed(2.6)));
    s += relaxedHand([214, 644], 112, 104, r, false);

    // ================================================================ a few strands lifting off the crown in front
    s += B([[452, 212], [470, 160], [500, 110], [520, 60]], (t) => 3.6 * Math.pow(1 - t, 0.8));
    s += B([[470, 214], [500, 170], [540, 130], [570, 84]], (t) => 2.8 * Math.pow(1 - t, 0.8));
    return `<g transform="${FIT}">${s}</g>`;
  },
});
