import { art, INK, KHAKI, KHAKI_DEEP, SKIN, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, hatch, pointed, tail, vb } from './_util.ts';
import { faceFront, hairFront } from './_saint.ts';

/** A relaxed hanging hand seen from the thumb side; wrist at (0,0). sx=1: palm faces +x. */
function hangingHand(x: number, y: number, sx: number, r: () => number): string {
  const m = (pts: Pt[]): Pt[] => pts.map(([px, py]) => [x + px * sx, y + py]);
  let s = '';
  const outline = m([
    [-10, -4],
    [-12, 18],
    [-12.5, 38],
    [-10.5, 54],
    [-7, 67],
    [-2, 76],
    [3, 77],
    [7, 72],
    [9, 58],
    [11, 46],
    [14, 30],
    [13, 12],
    [10, -4],
  ]);
  s += P(smooth(outline, true), SKIN);
  s += hatch(m([[-12, 0], [-6, 0], [-5, 40], [-3, 70], [-8, 70], [-12, 40]]), 2.6, 90, r, 0.8);
  s += P(vb(outline.slice(0, 8), (t) => 1.6 + 1.6 * Math.sin(Math.PI * t)));
  s += P(vb(outline.slice(7), (t) => 1.2 + 1.4 * Math.sin(Math.PI * t)));
  // thumb lying along the index finger
  s += B(m([[9, 8], [6, 26], [5, 42], [7, 50]]), (t) => 0.6 + 1.8 * Math.sin(Math.PI * t));
  s += B(m([[5, 44], [8, 48]]), pointed(1.2));
  // index / middle finger separation, joint creases
  s += B(m([[-3, 44], [-1, 60], [2, 74]]), pointed(1.4));
  s += B(m([[-8, 50], [-5, 52]]), pointed(1));
  s += B(m([[-4, 62], [-1, 63]]), pointed(1));
  s += B(m([[-9, 34], [-4, 37]]), pointed(1.1));
  return s;
}

/** Bare foot seen from the front, peeking under the hem. sx=1: big toe toward +x. */
function frontFoot(x: number, y: number, sx: number): string {
  const m = (pts: Pt[]): Pt[] => pts.map(([px, py]) => [x + px * sx, y + py]);
  let s = '';
  const foot = m([
    [-14, -8],
    [-17, 10],
    [-17, 20],
    [-13, 24],
    [-9, 23],
    [-5, 26],
    [0, 26],
    [4, 28],
    [9, 28],
    [12, 31],
    [17, 29],
    [18, 18],
    [15, 4],
    [13, -8],
  ]);
  s += P(smooth(foot, true), SKIN);
  s += hatch(m([[5, -8], [14, -8], [18, 18], [10, 16]]), 2.4, 90, rng(x), 0.8);
  s += P(vb(foot, (t) => 1.4 + 1.5 * Math.sin(Math.PI * t)));
  // toe separations
  s += B(m([[-11, 18], [-11, 23]]), pointed(1.2));
  s += B(m([[-6, 20], [-6, 25]]), pointed(1.2));
  s += B(m([[-1, 21], [-1, 26]]), pointed(1.2));
  s += B(m([[6, 20], [7, 27]]), pointed(1.4));
  s += B(m([[-4, 4], [2, 10], [8, 8]]), pointed(1.2));
  return s;
}

export default art({
  name: 'saint-standing',
  w: 500,
  h: 1100,
  draw: () => {
    const r = rng(11);
    let s = '';
    const HX = 250;
    const HY = 124;
    const HS = 0.42;
    const hair = hairFront({ len: 690, drape: 46, seed: 5, backLen: 520, backW: 160 });
    // ---------------------------------------------------------------- hair behind + face
    s += `<g transform="translate(${HX} ${HY}) scale(${HS})">${hair.back}${faceFront({ seed: 4 })}</g>`;
    // chest skin in the V of the collar
    s += P(smooth([[226, 200], [274, 200], [266, 240], [250, 276], [234, 240]], true), SKIN);
    s += P(smooth([[262, 206], [276, 206], [262, 240], [252, 262], [254, 236]], true), INK);

    // ---------------------------------------------------------------- hem geometry
    const hemY = (x: number) => 1046 + 14 * (1 - Math.pow((x - 250) / 124, 2)) + 2.5 * Math.sin(((x - 126) / 248) * Math.PI * 7);
    const curveAt = (dy: number, x0: number, x1: number, n = 24): Pt[] => {
      const out: Pt[] = [];
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        out.push([x, hemY(x) + dy]);
      }
      return out;
    };
    const skirtL = (y: number) => 156 - ((y - 620) / 430) * 30; // left edge x at y
    const skirtR = (y: number) => 344 + ((y - 620) / 430) * 30;

    // ---------------------------------------------------------------- feet (under the robe)
    s += hatch([[176, 1076], [326, 1076], [318, 1092], [184, 1092]], 3.2, 0, r, 1.2);
    s += frontFoot(220, 1062, -1);
    s += frontFoot(282, 1062, 1);

    // ---------------------------------------------------------------- robe body
    const body: Pt[] = [
      [220, 204],
      [250, 268],
      [282, 204],
      [306, 214],
      [334, 232],
      [350, 254],
      [348, 400],
      [344, 620],
      [skirtR(800), 800],
      [skirtR(960), 960],
      ...curveAt(0, 374, 126, 30),
      [skirtL(960), 960],
      [skirtL(800), 800],
      [156, 620],
      [152, 400],
      [150, 254],
      [166, 232],
      [194, 214],
    ];
    const bodyD = smooth(body, true, 0.3);
    s += P(bodyD, KHAKI);
    let inner = '';
    // shadow side of skirt
    inner += P(smooth([[312, 640], [350, 640], [380, 1080], [324, 1080], [320, 860]], true), KHAKI_DEEP);
    inner += hatch([[300, 630], [352, 630], [384, 1084], [318, 1084], [312, 860]], 5, 92, r, 1.3);
    inner += hatch([[150, 640], [192, 640], [180, 860], [168, 1084], [120, 1084]], 6.5, 93, r, 1.0);
    // cast shadow from the sleeves / hands across the hips
    inner += hatch([[140, 640], [360, 640], [356, 700], [300, 676], [250, 690], [200, 676], [144, 700]], 4, 6, r, 1.2);
    // torso shading: under the hair locks (cast shadow) and the right flank
    inner += P(smooth([[300, 236], [322, 250], [330, 330], [326, 470], [316, 480], [312, 330]], true), INK);
    inner += P(smooth([[196, 226], [210, 232], [204, 330], [198, 470], [190, 476], [186, 330]], true), KHAKI_DEEP);
    inner += hatch([[290, 300], [346, 300], [346, 640], [300, 640]], 4.2, 88, r, 1.2);
    // folds on the skirt: [top, mid, hem x]
    const foldX = [150, 178, 206, 236, 266, 296, 324, 350];
    foldX.forEach((hx, i) => {
      const top: Pt = [250 + (hx - 250) * 0.62, 650 + (i % 3) * 30];
      const mid: Pt = [250 + (hx - 250) * 0.82 + (i % 2 ? 3 : -3), 860];
      const end: Pt = [hx, hemY(hx) - 2];
      inner += B([top, mid, end], (t) => 0.6 + 4.2 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)), 0.7));
      // shade strip on the right of each fold
      if (i > 0 && i < foldX.length - 1) {
        const w = 9 + (i % 3) * 3;
        inner += hatch([[top[0] + 1, top[1] + 30], [top[0] + w * 0.6, top[1] + 30], [mid[0] + w, 860], [end[0] + w, end[1] + 4], [end[0] + 1, end[1] + 4], [mid[0] + 1, 860]], 3.6, 92, r, 1.0);
      }
    });
    // deep fold crevices (spot black)
    inner += B([[236, 900], [238, 1000], [240, hemY(240)]], pointed(5, 0.9));
    inner += B([[296, 880], [300, 990], [302, hemY(302)]], pointed(5.5, 0.9));
    // chest/waist drape folds
    inner += B([[232, 322], [218, 400], [212, 520], [214, 610]], pointed(3));
    inner += B([[276, 300], [288, 400], [292, 520], [290, 610]], pointed(3.4));
    inner += B([[252, 420], [250, 520], [252, 620]], pointed(2.4));
    // trim bands near hem (two)
    inner += P(smooth([...curveAt(-64, 110, 390), ...curveAt(-48, 390, 110)], true), INK);
    inner += P(smooth([...curveAt(-36, 110, 390), ...curveAt(-25, 390, 110)], true), INK);
    s += clipped(bodyD, inner);
    // robe outlines
    s += P(vb(curveAt(0, 126, 374, 30), even(4.5, 0.03)));
    s += B([[150, 254], [152, 400], [156, 620], [skirtL(800), 800], [skirtL(960), 960], [126, hemY(126)]], (t) => 2.5 + 3 * Math.sin(Math.PI * t));
    s += B([[350, 254], [348, 400], [344, 620], [skirtR(800), 800], [skirtR(960), 960], [374, hemY(374)]], (t) => 3.5 + 4 * Math.sin(Math.PI * t));

    // ---------------------------------------------------------------- collar
    // under lapel (viewer's left) and over lapel (crossing)
    s += P(smooth([[220, 204], [232, 204], [256, 256], [250, 268]], true), KHAKI);
    s += B([[220, 204], [236, 238], [250, 268]], even(3));
    s += B([[232, 204], [246, 234], [256, 254]], even(2));
    s += P(smooth([[282, 204], [294, 206], [266, 262], [236, 330], [224, 326], [252, 262]], true), KHAKI);
    s += B([[282, 204], [264, 238], [240, 296], [224, 326]], even(3.2));
    s += B([[294, 206], [276, 242], [254, 290], [236, 330]], even(2.6));

    // ---------------------------------------------------------------- sleeves
    const sleeve: Pt[] = [
      [198, 220],
      [170, 232],
      [150, 254],
      [136, 320],
      [126, 420],
      [118, 520],
      [114, 600],
      [116, 650],
      [140, 662],
      [170, 658],
      [196, 648],
      [208, 638],
      [210, 540],
      [206, 440],
      [202, 340],
      [200, 280],
    ];
    for (const side of [-1, 1]) {
      const mx = (x: number) => (side < 0 ? x : 500 - x);
      const M = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [mx(x), y]);
      const sl = M(sleeve);
      const sd = smooth(sl, true, 0.35);
      s += P(sd, KHAKI);
      let si = '';
      if (side > 0) {
        // shadow sleeve (viewer's right)
        si += P(smooth(M([[100, 240], [168, 240], [160, 400], [156, 560], [160, 680], [100, 680]]), true), KHAKI_DEEP);
        si += hatch(M([[100, 240], [176, 240], [170, 400], [166, 560], [170, 680], [100, 680]]), 4.4, 93, r, 1.3);
        si += hatch(M([[100, 240], [140, 240], [134, 500], [130, 680], [100, 680]]), 4.4, 3, r, 1.0);
      } else {
        si += hatch(M([[100, 240], [146, 250], [136, 420], [128, 680], [100, 680]]), 6, 94, r, 1.0);
      }
      // inner edge shadow (toward the body)
      si += hatch(M([[188, 300], [214, 300], [214, 650], [184, 650]]), 4, 90, r, 1.2);
      // folds hanging from the shoulder
      si += B(M([[178, 238], [164, 340], [152, 470], [146, 600], [144, 654]]), pointed(3.6));
      si += B(M([[192, 280], [186, 400], [184, 520], [186, 640]]), pointed(2.8));
      si += B(M([[156, 300], [146, 380], [140, 470]]), pointed(2.4));
      si += B(M([[170, 470], [166, 560], [168, 650]]), pointed(2.4));
      // trim bands following the opening
      si += P(smooth(M([[100, 598], [140, 610], [170, 606], [214, 590], [214, 604], [170, 620], [140, 624], [100, 612]]), true), INK);
      si += P(smooth(M([[100, 624], [140, 636], [170, 632], [214, 616], [214, 627], [170, 643], [140, 647], [100, 635]]), true), INK);
      s += clipped(sd, si);
      // opening: dark inside of the sleeve
      s += P(smooth(M([[160, 657], [182, 640], [204, 630], [208, 638], [196, 650], [172, 660]]), true), INK);
      // outline
      s += P(vb(M([[198, 220], [170, 232], [150, 254], [136, 320], [126, 420], [118, 520], [114, 600], [116, 650], [140, 662], [170, 658], [196, 648], [208, 638]]), (t) => (side > 0 ? 5.5 : 3.6) * (0.55 + 0.45 * Math.sin(Math.PI * t))));
      s += B(M([[208, 636], [210, 540], [206, 440], [202, 340], [200, 290]]), even(2.6, 0.15));
      // hand
      s += hangingHand(mx(192), 638, side, r);
    }

    // ---------------------------------------------------------------- front hair
    s += `<g transform="translate(${HX} ${HY}) scale(${HS})">${hair.front}</g>`;
    void tail;
    return s;
  },
});
