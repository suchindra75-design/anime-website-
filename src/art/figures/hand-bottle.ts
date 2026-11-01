import { art, ACCENT, GREY, INK, PAPER, SKIN, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, engrave, even, hatch, pointed, sstep, vb } from './_util.ts';

// bottle frame: origin at the base centre, x along the axis toward the mouth
const BASE: Pt = [321, 504];
const ANG = -25;
const R = 82; // body radius

const ca = Math.cos((ANG * Math.PI) / 180);
const sa = Math.sin((ANG * Math.PI) / 180);
const G = ([u, v]: Pt): Pt => [BASE[0] + u * ca - v * sa, BASE[1] + u * sa + v * ca];
const LOCAL = (inner: string) => `<g transform="translate(${BASE[0]} ${BASE[1]}) rotate(${ANG})">${inner}</g>`;

export default art({
  name: 'hand-bottle',
  w: 1200,
  h: 700,
  draw: () => {
    const r = rng(111);
    let s = '';

    // ---------------------------------------------------------------- sleeve (white, from the left edge to the wrist) with a turned cuff
    const sleeve: Pt[] = [
      [-10, 34],
      [120, 52],
      [250, 84],
      [340, 104],
      [400, 122],
      [446, 214],
      [430, 266],
      [330, 284],
      [200, 312],
      [80, 336],
      [-10, 352],
    ];
    const sd = smooth(sleeve, true, 0.3);
    s += P(sd, PAPER);
    // drapery folds: crests pulled from the elbow (off-frame left) toward the cuff
    const sFolds: Pt[][] = [
      [[-10, 120], [110, 132], [230, 150], [338, 170]],
      [[-10, 200], [100, 206], [210, 212], [330, 222]],
      [[40, 90], [150, 104], [260, 124]],
      [[30, 280], [140, 270], [250, 256], [340, 248]],
      [[150, 168], [240, 186], [320, 200]],
    ];
    let si = '';
    // underside in shadow + fold valleys hatched just below each crest
    si += hatch([[-10, 260], [440, 236], [440, 300], [-10, 370]], 4, 174, r, 1.3);
    si += hatch([[-10, 300], [440, 270], [440, 300], [-10, 370]], 4, 150, r, 1.1);
    sFolds.forEach((f, i) => {
      si += B(f, (t) => 0.6 + (i < 2 ? 4.6 : 3.2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.05 + t)), 0.7));
      const lo = f.map(([x, y]) => [x, y + 20 - i * 2] as Pt);
      si += hatch([...f, ...lo.slice().reverse()], 3.6, 176, r, 1.1);
    });
    si += hatch([[-10, 34], [200, 64], [200, 92], [-10, 70]], 5, 172, r, 0.9);
    s += clipped(sd, si);
    s += P(vb(sleeve.slice(0, 5), (t) => 2.5 + 3 * Math.sin(Math.PI * t)));
    s += P(vb(sleeve.slice(6), (t) => 3 + 4.4 * Math.sin(Math.PI * t)));
    // turned-back cuff: a band hugging the wrist
    const cuffOut: Pt[] = [
      [400, 122],
      [430, 166],
      [446, 214],
      [430, 266],
    ];
    const cuffIn: Pt[] = [
      [360, 112],
      [390, 162],
      [404, 216],
      [392, 274],
    ];
    const cd = smooth([...cuffOut, ...cuffIn.slice().reverse()], true, 0.3);
    s += P(cd, PAPER);
    s += clipped(cd, hatch([[350, 200], [450, 196], [450, 290], [350, 290]], 3.4, 160, r, 1.2) + B([[384, 140], [404, 190], [404, 240]], pointed(2)));
    s += P(vb(cuffOut, even(4.2, 0.06)));
    s += P(vb(cuffIn, (t) => 1.5 + 3 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- bottle
    const body: Pt[] = [
      [4, -R + 16],
      [16, -R + 2],
      [40, -R],
      [520, -R],
      [580, -R + 12],
      [628, -44],
      [646, -30],
      [646, 30],
      [628, 44],
      [580, R - 12],
      [520, R],
      [40, R],
      [16, R - 2],
      [4, R - 16],
      [0, 0],
    ];
    const bodyG = body.map(G);
    const bodyD = smooth(bodyG, true, 0.25);
    // thumb wrapping under the far side of the bottle: only its tip shows below the lower edge
    s += LOCAL(
      P(smooth([[262, 60], [320, 70], [356, 84], [364, 98], [346, 108], [300, 104], [264, 96]], true, 0.4), SKIN) +
        clipped(smooth([[262, 60], [320, 70], [356, 84], [364, 98], [346, 108], [300, 104], [264, 96]], true, 0.4), hatch([[262, 92], [366, 92], [366, 112], [262, 112]], 3, 0, r, 1.2)) +
        P(vb([[264, 96], [300, 104], [346, 108], [364, 98], [356, 84]], (t) => 2 + 3.4 * Math.sin(Math.PI * t))) +
        P(smooth([[332, 86], [354, 88], [360, 96], [338, 98]], true, 0.4), PAPER) +
        P(vb([[330, 86], [354, 87], [361, 96]], pointed(1.4))),
    );
    // glass (empty part reads as pale)
    s += P(bodyD, PAPER);
    // liquid: gravity-level surface, ~80% full
    const level = 262;
    let liq = `<rect x="0" y="${level}" width="1200" height="700" fill="${ACCENT}"/>`;
    liq += clipped(smooth(body.map(([u, v]) => G([u, v * 0.5 + R * 0.5])), true, 0.25), hatch([[0, 0], [1200, 0], [1200, 700], [0, 700]], 5.6, -25, r, 1.0)); // lower-half shadow
    liq += P(vb([[560, level], [700, level - 1], [820, level]], even(3.2, 0.05)));
    s += clipped(bodyD, liq);
    // empty glass: light grey hatch near the top edge
    s += clipped(bodyD, `<rect x="0" y="0" width="1200" height="${level}" fill="${GREY}" fill-opacity="0.25"/>`);
    // highlights on the glass (white streaks along the body)
    s += LOCAL(
      P(vb([[40, -56], [200, -58], [380, -58], [500, -54]], pointed(7, 0.6)), PAPER) +
        P(vb([[60, -40], [180, -42], [280, -42]], pointed(3, 0.7)), PAPER) +
        P(vb([[470, -40], [520, -40], [560, -30]], pointed(3, 0.7)), PAPER) +
        P(vb([[40, 50], [160, 54]], pointed(2.4, 0.7)), PAPER),
    );
    // label band with a small V monogram
    const label = [G([330, -R]), G([450, -R]), G([450, R]), G([330, R])];
    s += P(smooth([label[0], G([390, -R - 1]), label[1], G([454, 0]), label[2], G([390, R + 1]), label[3], G([334, 0])], true, 0.2), INK);
    s += LOCAL(
      P(vb([[338, -70], [338, 70]], even(1.6, 0.05)), PAPER) +
        P(vb([[442, -70], [442, 70]], even(1.6, 0.05)), PAPER) +
        // the V glyph (two tapered strokes)
        `<g transform="translate(390 0) rotate(${-ANG})">` +
        P(vb([[-16, -20], [-8, 0], [0, 20]], (t) => 2 + 5 * (1 - t)), PAPER) +
        P(vb([[16, -20], [8, 0], [0, 20]], (t) => 1 + 2.4 * (1 - t)), PAPER) +
        P(vb([[-22, -20], [-10, -20]], even(1.4, 0.1)), PAPER) +
        P(vb([[10, -20], [22, -20]], even(1.4, 0.1)), PAPER) +
        `</g>`,
    );
    // neck: ribbed white/grey rings
    let neck = '';
    neck += `<rect x="640" y="-29" width="160" height="58" fill="${PAPER}"/>`;
    for (let i = 0; i < 9; i++) {
      const x = 646 + i * 17;
      neck += `<rect x="${x}" y="-29" width="8" height="58" fill="${GREY}"/>`;
      neck += P(vb([[x - 1, -28], [x - 1, 28]], even(1.6, 0.1)));
    }
    neck += hatch([[640, 12], [800, 12], [800, 30], [640, 30]], 3, 90, r, 1.0);
    neck += P(vb([[640, -29], [800, -29]], even(3.6, 0.02)));
    neck += P(vb([[640, 29], [800, 29]], even(4.4, 0.02)));
    // stopper: collar ring + grey dome
    neck += P(smooth([[796, -36], [814, -36], [814, 36], [796, 36]], true, 0.1), GREY);
    neck += P(smooth([[814, -34], [840, -30], [856, -16], [860, 0], [856, 16], [840, 30], [814, 34]], true, 0.4), GREY);
    neck += P(vb([[822, -24], [842, -20], [852, -8]], pointed(4)), PAPER);
    neck += hatch([[814, 8], [860, 8], [860, 36], [814, 36]], 3, 70, r, 1.1);
    neck += P(vb([[796, -36], [814, -36], [814, 36], [796, 36], [796, -36]], even(3, 0.02)));
    neck += P(vb([[814, -34], [840, -30], [856, -16], [860, 0], [856, 16], [840, 30], [814, 34]], (t) => 2.5 + 2.5 * Math.sin(Math.PI * t)));
    s += LOCAL(neck);
    // bottle outline (heavier on the lower edge)
    s += `<path d="${bodyD}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
    s += P(vb(bodyG.slice(9, 12), (t) => 1 + 5 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- hand: palm on top, fingers wrapping down over the near face
    // (local bottle frame; light comes from −v / −u, so +v and +u sides are in shade)
    let h = '';
    const KN = [168, 206, 246, 286]; // MCP knuckles, pinky → index
    // back of the hand rising from the knuckle row (top edge) to the wrist
    const back: Pt[] = [
      [142, -98],
      [138, -152],
      [168, -222],
      [220, -260],
      [290, -252],
      [320, -178],
      [312, -102],
    ];
    const backD = smooth(back, true, 0.35);
    h += P(backD, SKIN);
    // cross-contour engraving across the back: heavier toward the pinky edge and the knuckle valleys
    h += engrave(backD, [120, -270, 220, 180], 4.6, 0, (x, y) => 3.2 * Math.max(1 - sstep(140, 186, x), 0.5 * sstep(-140, -106, y) * (1 - Math.min(1, Math.abs(((x - 148) % 39) - 19.5) / 10))), r);
    // extensor tendons fanning from the wrist to each knuckle, shaded on their +u flank
    KN.forEach((k, i) => {
      const w0: Pt = [214 + i * 18, -238];
      const m: Pt = [(w0[0] + k) / 2 + 3, -172];
      h += B([w0, m, [k, -122]], pointed(2.2));
      h += P(vb([[w0[0] + 5, -230], [m[0] + 6, -172], [k + 7, -128]], pointed(1.6)), PAPER);
    });
    h += P(vb(back.slice(0, 4), (t) => 2.5 + 3.4 * Math.sin(Math.PI * t)));
    h += P(vb(back.slice(3), (t) => 2.5 + 4.4 * Math.sin(Math.PI * t)));
    // knuckle planes: lit cap on each MCP, dark dip between neighbours
    KN.forEach((k, i) => {
      const w = [30, 34, 35, 33][i];
      h += P(smooth([[k - w * 0.46, -106], [k - w * 0.3, -122], [k, -127], [k + w * 0.3, -122], [k + w * 0.46, -106]], false, 0.4) + 'Z', SKIN);
      h += P(vb([[k - w * 0.48, -108], [k - w * 0.28, -123], [k, -128], [k + w * 0.3, -122], [k + w * 0.5, -106]], (t) => 0.8 + 2.6 * Math.sin(Math.PI * t)));
      h += hatch([[k + w * 0.12, -124], [k + w * 0.46, -118], [k + w * 0.5, -100], [k + w * 0.1, -104]], 2.6, 0, r, 1.0);
      if (i < 3) {
        const v = (k + KN[i + 1]) / 2;
        h += P(smooth([[v - 6, -112], [v, -98], [v + 6, -112], [v, -120]], true, 0.4));
      }
    });
    // four fingers wrapping the near face
    const fingerSpec: [number, number, number, number][] = [
      // width scale, middle phalanx, distal phalanx, lean toward the base
      [0.88, 44, 26, -10],
      [1.0, 56, 28, -8],
      [1.03, 62, 29, -6],
      [0.98, 54, 27, -4],
    ];
    fingerSpec.forEach(([ws, mid, dist, lean], fi) => {
      const u0 = KN[fi];
      const W = [40, 35, 31, 27].map((v) => v * ws);
      const J: Pt[] = [
        [u0, -106],
        [u0 + lean * 0.3, -42], // PIP (proximal phalanx foreshortened over the top edge)
        [u0 + lean * 0.65, -42 + mid], // DIP
        [u0 + lean, -42 + mid + dist], // tip
      ];
      const at = (i: number, k: number): Pt => [J[i][0] + (J[i + 1][0] - J[i][0]) * k, J[i][1] + (J[i + 1][1] - J[i][1]) * k];
      const hw = (i: number, k: number) => ((W[i] + (W[i + 1] - W[i]) * k) / 2) * (k === 0 && i === 1 ? 1.1 : k === 0 && i === 2 ? 1.05 : k === 0.5 ? 0.96 : 1);
      const side = (sgn: number): Pt[] => {
        const out: Pt[] = [];
        for (const [i, k] of [[0, 0], [0, 0.5], [1, 0], [1, 0.5], [2, 0], [2, 0.6]] as const) {
          const p = at(i, k);
          out.push([p[0] + sgn * hw(i, k) * (i === 2 && k > 0 ? 1.04 : 1), p[1]]);
        }
        return out;
      };
      const L = side(-1);
      const R2 = side(1);
      const tipC: Pt = [J[3][0], J[3][1] - W[3] * 0.42];
      const cap: Pt[] = [];
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI - (Math.PI * k) / 6;
        cap.push([tipC[0] + Math.cos(a) * W[3] * 0.52, tipC[1] + Math.sin(a) * W[3] * 0.52]);
      }
      const outline = [...L, ...cap, ...R2.slice().reverse()];
      const od = smooth(outline, true, 0.45);
      h += P(od, SKIN);
      // cross-contour engraving: lines across the finger, heavier on the shaded (+u) flank and where it turns under
      const cx = (y: number) => {
        const t = Math.max(0, Math.min(1, (y + 106) / (J[3][1] + 106)));
        return u0 + lean * t;
      };
      h += engrave(od, [u0 - 40, -112, 80, J[3][1] + 130], 4.4, 0, (x, y) => {
        const across = sstep(0.05, 1.0, (x - cx(y)) / (W[1] * 0.5));
        const down = sstep(J[2][1] - 20, J[3][1] + 4, y);
        const under = sstep(J[3][1] - dist * 0.5, J[3][1] + 8, y);
        return 3.1 * Math.max(across * (0.45 + 0.55 * down), under * 0.75);
      }, r);
      // contours: shaded flank heavier
      h += P(vb([...cap.slice(3), ...R2.slice().reverse()], (t) => 1.6 + 3.6 * Math.sin(Math.PI * Math.min(1, t * 1.05))));
      h += P(vb([...L, ...cap.slice(0, 4)], (t) => 1.2 + 2.4 * Math.sin(Math.PI * t)));
      // PIP knuckle wrinkles + a paper glint on the knuckle top
      const pip = J[1];
      for (let k = -1; k <= 1; k++) {
        const y = pip[1] + k * 5;
        h += B([[pip[0] - W[1] * 0.3, y + 2], [pip[0], y - 2], [pip[0] + W[1] * 0.3, y + 2]], pointed(1.7 - Math.abs(k) * 0.4));
      }
      h += P(vb([[pip[0] - W[1] * 0.22, pip[1] - 12], [pip[0] + W[1] * 0.05, pip[1] - 14]], pointed(2)), PAPER);
      // DIP crease
      const dip = J[2];
      h += B([[dip[0] - W[2] * 0.32, dip[1] + 1], [dip[0], dip[1] - 2], [dip[0] + W[2] * 0.3, dip[1] + 1]], pointed(1.6));
      // nail (same treatment as hand-reach): paper plate, thin rim, cuticle arc, highlight
      const n0 = dip[1] + dist * 0.38;
      const n1 = J[3][1] - 2;
      const nx = (y: number) => dip[0] + (J[3][0] - dip[0]) * ((y - dip[1]) / dist);
      const nw = W[3] * 0.3;
      const nail: Pt[] = [
        [nx(n0) - nw, n0],
        [nx(n0) + nw, n0],
        [nx(n1) + nw * 1.04, n1 - nw * 0.5],
        [nx(n1), n1 + 1],
        [nx(n1) - nw * 1.04, n1 - nw * 0.5],
      ];
      h += P(smooth(nail, true, 0.42), PAPER);
      h += P(vb([...nail.slice(1), nail[0]], (t) => 0.8 + 1.4 * Math.sin(Math.PI * t)));
      h += P(vb([[nx(n0) - nw * 1.2, n0 + 2], [nx(n0), n0 - 3], [nx(n0) + nw * 1.2, n0 + 2]], pointed(1.8)));
      h += P(vb([[nx(n0) + nw * 0.35, n0 + 4], [nx(n1) + nw * 0.4, n1 - 4]], pointed(1.2)));
    });
    s += LOCAL(h);
    return s;
  },
});
