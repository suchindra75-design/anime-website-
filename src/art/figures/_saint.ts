/**
 * The saint's head — shared so the character reads the same everywhere.
 * Canonical front frame: face centre (0,0), face width ≈ 200, eye line y≈-8,
 * chin y≈155, crown y≈-172. Place with a transform.
 */
import { INK, PAPER, SKIN, clipped, id, range, rng, smooth, type Pt } from '../kit.ts';
import { B, P, S, even, gloss, hatch, hatchLite, lerp, lock, mirror, pointed, resample, sample, shape, tail, vb } from './_util.ts';

export interface FaceOpts {
  closed?: boolean; // eyes closed
  gaze?: Pt; // iris offset
  worry?: number; // 0..1 raise inner brows
  seed?: number;
  shade?: number; // 0..1 how much hatching
  mouthOpen?: number; // 0..1
}

const faceOutlineR: Pt[] = [
  [0, -128],
  [52, -121],
  [86, -90],
  [97, -45],
  [99, -6],
  [91, 32],
  [76, 70],
  [58, 108],
  [36, 138],
  [14, 153],
  [0, 156],
];

export function faceShape(): Pt[] {
  const left = mirror(faceOutlineR, 0).reverse();
  return [...faceOutlineR, ...left.slice(1, -1)];
}

/** Neck + face (skin), features and shading. Hair is separate. */
export function faceFront(o: FaceOpts = {}): string {
  const r = rng(o.seed ?? 7);
  const shade = o.shade ?? 1;
  const worry = o.worry ?? 0;
  const g = o.gaze ?? [0, 0];
  let s = '';
  // neck
  const neck: Pt[] = [
    [-40, 100],
    [-44, 200],
    [-50, 320],
    [50, 320],
    [44, 200],
    [40, 100],
  ];
  s += P(smooth(neck, true, 0.2), SKIN);
  s += hatch([[-46, 120], [46, 120], [48, 215], [20, 190], [-20, 190], [-48, 215]], 4.2, 12, r, 1.3);
  s += hatch([[10, 150], [46, 140], [50, 300], [24, 260]], 4.5, 80, r, 1.2);
  s += B([[-41, 140], [-45, 220], [-50, 318]], even(5));
  s += B([[41, 140], [45, 220], [50, 318]], even(6));
  // tendon lines
  s += B([[-30, 210], [-14, 262], [-6, 300]], pointed(3));
  s += B([[30, 210], [14, 262], [6, 300]], pointed(3));

  // face
  const face = faceShape();
  s += P(smooth(face, true), SKIN);
  // cheek hollows (gaunt)
  if (shade > 0) {
    s += hatch([[64, 14], [94, 22], [86, 62], [66, 100], [52, 112], [56, 66]], 4.2, 62, r, 1.3);
    s += hatch([[-62, 18], [-92, 26], [-86, 62], [-70, 92], [-58, 70]], 5.5, 118, r, 1.0);
    // temple / socket shading
    s += hatch([[12, -36], [28, -24], [22, -4], [10, -12]], 3.6, 100, r, 1.1);
    s += hatch([[-12, -36], [-28, -24], [-22, -4], [-10, -12]], 4.4, 80, r, 1.0);
    s += hatch([[80, -62], [96, -40], [98, -10], [86, -20], [78, -42]], 4, 90, r, 1.1);
    // under-lip and chin
    s += hatch([[-12, 112], [12, 112], [16, 124], [-14, 124]], 3.5, 0, r, 1.1);
    s += hatch([[18, 136], [38, 124], [30, 146], [12, 154]], 3.6, 50, r, 1.1);
  }
  // jaw / face contour
  s += P(vb([[86, -90], [97, -45], [99, -6], [91, 32], [76, 70], [58, 108], [36, 138], [14, 153], [0, 156]], (t) => 3 + 4.5 * Math.sin(Math.PI * Math.min(1, t * 1.2))));
  s += P(vb([[-86, -90], [-97, -45], [-99, -6], [-91, 32], [-76, 70], [-58, 108], [-36, 138], [-14, 153], [0, 156]], (t) => 2.5 + 3 * Math.sin(Math.PI * Math.min(1, t * 1.2))));
  // cheekbone accent strokes
  s += B([[60, 12], [78, 20], [90, 30]], pointed(3.2));
  s += B([[-60, 14], [-76, 21], [-88, 30]], pointed(2.6));

  // brows
  const bi = -42 - worry * 8;
  s += B([[12, bi + 2], [36, -46], [62, -48], [86, -42]], (t) => 10 * Math.min(1, 0.5 + t * 2) * Math.pow(1 - t, 0.55) + 0.8);
  s += B([[-12, bi + 2], [-36, -46], [-62, -48], [-86, -42]], (t) => 10 * Math.min(1, 0.5 + t * 2) * Math.pow(1 - t, 0.55) + 0.8);
  if (worry > 0) {
    s += B([[8, bi - 4], [14, bi - 12]], pointed(2));
    s += B([[-8, bi - 4], [-14, bi - 12]], pointed(2));
  }

  // eyes
  for (const sx of [1, -1]) {
    const m = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x * sx, y]);
    if (o.closed) {
      // closed lid: a heavy downward arc with lashes
      s += P(vb(m([[22, -6], [36, -2], [52, 0], [66, -3], [76, -9]]), (t) => 1.5 + 6 * Math.sin(Math.PI * Math.min(1, t * 1.15))));
      s += B(m([[28, -20], [50, -24], [70, -18]]), pointed(2.2));
      for (let i = 0; i < 5; i++) {
        const x = 46 + i * 7;
        s += B(m([[x, 0 - i * 0.6], [x + 3, 7 - i * 0.6]]), pointed(1.8));
      }
      s += hatch(m([[24, -18], [50, -24], [74, -16], [70, -8], [50, -4], [26, -8]]), 3.4, 0, r, 1.0);
    } else {
      const eye: Pt[] = m([
        [22, -5],
        [34, -16],
        [52, -20],
        [67, -17],
        [76, -10],
        [68, -4],
        [54, 2],
        [38, 2],
      ]);
      s += P(smooth(eye, true), PAPER);
      const ic: Pt = [sx * 48 + g[0], -8 + g[1]];
      const ecid = id('fig-eye');
      s += `<clipPath id="${ecid}"><path d="${smooth(eye, true)}"/></clipPath><g clip-path="url(#${ecid})">`;
      s += `<circle cx="${ic[0]}" cy="${ic[1]}" r="12" fill="${INK}"/>`;
      s += `<circle cx="${ic[0] + 3}" cy="${ic[1] - 3}" r="2.6" fill="${PAPER}"/>`;
      s += P(vb(m([[22, -12], [50, -20], [78, -12]]), even(5, 0.2)), INK);
      s += `</g>`;
      // upper lid heavy line
      s += P(vb(m([[20, -4], [33, -16], [52, -21], [68, -17], [79, -9]]), (t) => 2 + 6.5 * Math.sin(Math.PI * Math.min(1, t * 1.1))));
      // lid crease (heavy lids)
      s += B(m([[26, -22], [48, -28], [70, -22], [80, -14]]), pointed(2.6));
      // lower lid
      s += B(m([[40, 4], [56, 3], [70, -3]]), pointed(1.8));
      // lashes at outer corner
      s += B(m([[74, -12], [84, -16]]), tail(3));
      // under-eye bag line
      s += B(m([[34, 12], [52, 14], [66, 8]]), pointed(1.4));
    }
  }

  // nose
  s += B([[9, -24], [11, 10], [13, 46]], pointed(2.6));
  s += B([[12, 50], [22, 58], [18, 68], [8, 70]], (t) => 1 + 3.4 * Math.sin(Math.PI * t));
  s += B([[-10, 70], [-2, 72], [6, 71]], pointed(2.5));
  s += B([[-12, 56], [-20, 62], [-16, 68]], pointed(2.2));
  s += hatch([[14, 30], [24, 52], [22, 70], [12, 62]], 3.2, 70, r, 1.0);
  s += hatch([[-8, 74], [12, 74], [8, 86], [-6, 84]], 3, 0, r, 1.0);

  // mouth
  if (o.mouthOpen) {
    const mo = o.mouthOpen * 10;
    s += P(smooth([[-20, 98], [0, 96 - mo * 0.2], [20, 98], [8, 102 + mo], [-8, 102 + mo]], true), INK);
  } else {
    s += P(vb([[-27, 103], [-12, 99], [0, 99], [12, 99], [27, 104]], (t) => 1.6 + 3.2 * Math.sin(Math.PI * t)));
  }
  s += B([[-9, 113], [0, 114], [9, 113]], pointed(2));
  return s;
}

/**
 * Hair framing a front face (canonical units). Returns back (draw before the
 * neck/face) and front (draw after face and robe).
 *  len   — y where the front locks end
 *  drape — how far the locks flare out over the shoulders
 */
export function hairFront(o: { len?: number; drape?: number; seed?: number; backLen?: number; backW?: number } = {}): { back: string; front: string } {
  const len = o.len ?? 420;
  const drape = o.drape ?? 30;
  const r = rng(o.seed ?? 3);
  const bl = o.backLen ?? len;
  const bw = o.backW ?? 150;
  const back: Pt[] = [
    [0, -176],
    [70, -166],
    [118, -126],
    [136, -60],
    [140, 40],
    [bw - 6, 160],
    [bw, bl - 60],
    [bw - 30, bl],
    [0, bl - 20],
    [-(bw - 30), bl],
    [-bw, bl - 60],
    [-(bw - 6), 160],
    [-140, 40],
    [-136, -60],
    [-118, -126],
    [-70, -166],
  ];
  const b = shape(back, INK);
  let f = '';
  for (const sx of [1, -1]) {
    const m = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x * sx, y]);
    // crown cap
    const cap = m([
      [0, -178],
      [66, -168],
      [116, -128],
      [138, -62],
      [140, -10],
      [104, -10],
      [100, -40],
      [90, -80],
      [66, -112],
      [32, -136],
      [0, -150],
    ]);
    f += P(smooth(cap, true, 0.45), INK);
    // front lock
    const c = m([
      [120, -70],
      [121, 10],
      [120, 100],
      [122 + drape * 0.2, 170],
      [128 + drape * 0.7, 240],
      [134 + drape, 310],
      [136 + drape, len - 40],
      [134 + drape, len],
    ]);
    f += lock(c, (t) => 42 + 14 * Math.sin(Math.PI * Math.min(1, t * 1.6)) - 18 * t * t, r, { strands: 9, split: 0.68, gloss: 3, glossW: 1.8, tipVar: 0.5, jitter: 0.6 });
    // a couple of loose strands over the temple and cheek edge
    f += B(m([[34, -140], [72, -112], [98, -60], [104, 0], [102, 50]]), tail(3.2));
    f += B(m([[56, -130], [90, -88], [102, -30], [100, 80]]), tail(2.4));
    // crown gloss
    f += gloss(
      [
        m([[24, -164], [64, -156], [98, -134]]),
        m([[34, -154], [76, -140], [108, -110]]),
        m([[120, -100], [130, -60]]),
      ],
      2.4,
    );
    f += gloss([m([[50, -162], [88, -146]])], 1.3);
  }
  f += S(smooth([[0, -178], [0, -164], [0, -150]]), 2.2, PAPER);
  return { back: b, front: f };
}

// ---------------------------------------------------------------------------
// Profile head (facing LEFT). Coordinates in "profile space": forehead x≈288,
// nose tip ≈(250,412), chin ≈(290,540); crown ≈ y112. Neck to y≈720.
// ---------------------------------------------------------------------------

export const PROFILE_FACE: Pt[] = [
  [308, 204], // hairline
  [295, 236],
  [288, 274],
  [287, 306], // brow ridge
  [299, 333], // nasal root
  [286, 358],
  [268, 388],
  [250, 412], // nose tip
  [253, 423],
  [267, 428], // columella
  [279, 436], // subnasale
  [276, 448], // upper lip
  [272, 458],
  [281, 466], // lips meet
  [276, 476], // lower lip
  [283, 488],
  [294, 497], // sulcus
  [288, 514],
  [290, 532], // chin
  [304, 548],
  [340, 556],
];

/** Profile face + neck (no hair). */
export function profileFace(o: { worry?: number; closed?: boolean; seed?: number; gazeUp?: number; shade?: number } = {}): string {
  const r = rng(o.seed ?? 21);
  const worry = o.worry ?? 0.6;
  let s = '';
  // neck (behind face)
  const neck: Pt[] = [
    [326, 540],
    [338, 600],
    [346, 660],
    [350, 730],
    [540, 730],
    [520, 640],
    [500, 560],
    [470, 470],
  ];
  s += P(smooth(neck, true, 0.3), SKIN);
  // head skin (face + skull; the skull is covered by the hair cap later)
  const head: Pt[] = [...PROFILE_FACE, [390, 548], [436, 520], [470, 460], [520, 380], [560, 260], [520, 150], [420, 116], [340, 150]];
  s += P(smooth(head, true, 0.4), SKIN);
  // under-jaw shadow on the neck + neck hatch toward the back
  s += P(smooth([[330, 556], [390, 552], [440, 524], [470, 500], [472, 522], [432, 550], [384, 564], [344, 564]], true), INK);
  s += hatch([[350, 570], [470, 530], [520, 640], [540, 730], [400, 730], [380, 640]], 4.6, 72, r, 1.3);
  s += hatch([[336, 600], [380, 590], [370, 730], [350, 730]], 6.5, 78, r, 0.9);
  // sternocleidomastoid
  s += B([[456, 530], [430, 580], [404, 630], [392, 670]], pointed(2.6));
  // throat contour
  s += P(vb([[318, 552], [332, 590], [340, 630], [346, 680], [350, 728]], (t) => 2.5 + 3.5 * Math.sin(Math.PI * t)));
  s += B([[338, 616], [346, 630], [344, 646]], pointed(2.4)); // larynx hint
  // gaunt cheek hollow under the cheekbone
  s += hatch([[338, 404], [394, 400], [428, 426], [430, 470], [404, 492], [380, 470], [356, 436]], 4.4, 62, r, 1.1);
  s += hatch([[392, 404], [428, 420], [436, 470], [414, 496], [400, 470]], 4.4, 118, r, 1.0);
  // temple
  s += hatch([[330, 256], [372, 240], [388, 300], [362, 316], [334, 300]], 5, 100, r, 1.0);
  // cheekbone ridge
  s += B([[326, 376], [356, 386], [392, 394], [422, 412]], (t) => 0.8 + 3.4 * Math.sin(Math.PI * t));
  // nasolabial fold
  s += B([[290, 424], [302, 446], [312, 470], [318, 494]], pointed(2.8));
  // jaw line
  s += P(vb([[304, 548], [346, 554], [394, 544], [436, 518], [460, 484]], (t) => 2 + 5 * Math.sin(Math.PI * t)));
  // face contour (heavier ink on the profile line)
  s += P(vb(PROFILE_FACE.slice(0, 20), (t) => 3 + 3 * Math.sin(Math.PI * t)));
  // nostril wing
  s += B([[262, 420], [272, 425], [284, 421], [287, 410], [279, 402]], (t) => 1.2 + 3.4 * Math.sin(Math.PI * t));
  // mouth line & lips
  s += B([[280, 466], [290, 467], [298, 467], [305, 471]], (t) => 1.2 + 3.4 * Math.sin(Math.PI * t));
  s += hatch([[278, 480], [296, 486], [296, 498], [284, 496]], 3, 0, r, 1.0);
  // chin shading
  s += hatch([[300, 516], [330, 512], [338, 548], [306, 548]], 3.6, 40, r, 1.1);
  // brow (front end raised for worry) + eye socket shadow
  const bf = 312 - worry * 10;
  s += hatch([[296, 318], [352, 314], [360, 340], [346, 346], [306, 334]], 3.2, 8, r, 1.0);
  s += B([[292, bf], [310, bf - 6], [336, 308], [362, 312]], (t) => 1 + 8.5 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)), 0.8));
  if (worry > 0) {
    s += B([[298, bf - 18], [316, bf - 23], [330, bf - 19]], pointed(2));
    s += B([[300, bf - 31], [316, bf - 34]], pointed(1.6));
  }
  // eye
  if (o.closed) {
    s += P(vb([[308, 350], [318, 355], [332, 355], [344, 349]], (t) => 1.5 + 5 * Math.sin(Math.PI * t)));
    for (let i = 0; i < 4; i++) s += B([[314 + i * 6, 355], [309 + i * 6, 363]], pointed(1.8));
  } else {
    const gu = o.gazeUp ?? 0;
    const eye: Pt[] = [
      [309, 346],
      [318, 337],
      [332, 336],
      [343, 342],
      [334, 352],
      [318, 355],
    ];
    const cid = id('fig-peye');
    s += P(smooth(eye, true), PAPER);
    s += `<clipPath id="${cid}"><path d="${smooth(eye, true)}"/></clipPath><g clip-path="url(#${cid})"><ellipse cx="315" cy="${346 - gu}" rx="7.5" ry="10" fill="${INK}"/><circle cx="312" cy="${342 - gu}" r="2.1" fill="${PAPER}"/></g>`;
    s += P(vb([[306, 346], [316, 335], [332, 333], [347, 342]], (t) => 1.5 + 5.5 * Math.sin(Math.PI * t)));
    s += B([[310, 330], [326, 325], [344, 331]], pointed(2.4));
    s += B([[312, 355], [326, 357], [338, 352]], pointed(1.6));
    s += B([[345, 342], [356, 341]], tail(2.6));
    s += B([[318, 366], [332, 368], [344, 362]], pointed(1.3));
  }
  void (o.shade ?? 1);
  return s;
}

/**
 * Profile hair.
 *  back — the long fall behind neck and shoulders (draw first)
 *  cap  — covers the skull from the hairline back + the lock over the ear (draw after face/robe)
 */
export function profileHair(o: { seed?: number; len?: number; sweep?: number; capOnly?: boolean } = {}): { back: string; front: string } {
  const r = rng(o.seed ?? 9);
  const len = o.len ?? 1000;
  const sw = o.sweep ?? 0;
  let back = '';
  const mass: Pt[] = [
    [440, 200],
    [560, 150],
    [630, 220],
    [664, 330],
    [690 + sw * 0.3, 520],
    [720 + sw * 0.6, 700],
    [740 + sw, len - 220],
    [660 + sw * 0.6, len - 200],
    [570, 720],
    [500, 600],
    [460, 480],
  ];
  back += P(smooth(mass, true, 0.4), INK);
  const locks: [Pt[], number][] = [
    [[[620, 280], [660, 450], [700 + sw * 0.3, 620], [750 + sw * 0.7, 800], [800 + sw, len - 30]], 64],
    [[[580, 360], [610, 520], [650 + sw * 0.3, 680], [696 + sw * 0.6, 840], [724 + sw, len + 20]], 66],
    [[[540, 430], [566, 560], [606, 700], [646 + sw * 0.5, 860], [666 + sw * 0.8, len + 20]], 56],
    [[[630, 300], [680, 440], [740 + sw * 0.4, 610], [808 + sw * 0.8, 780], [856 + sw, 930]], 40],
  ];
  for (const [c, w] of locks) back += lock(c, (t) => w * (1 - 0.3 * t), r, { strands: 7, split: 0.66, gloss: 2, glossW: 2.2, tipVar: 0.45, jitter: 0.7 });
  // flowing highlight streaks down the fall
  back += gloss(
    [
      [[600, 420], [630, 560], [668 + sw * 0.3, 700], [700 + sw * 0.5, 820]],
      [[640, 380], [672, 520], [712 + sw * 0.4, 680], [752 + sw * 0.7, 820]],
      [[560, 520], [590, 640], [620 + sw * 0.3, 760]],
    ],
    1.8,
  );
  // cap over the skull + lock over the ear falling behind the jaw
  let front = '';
  const cap: Pt[] = [
    [306, 204],
    [312, 168],
    [350, 130],
    [420, 108],
    [500, 108],
    [570, 132],
    [624, 190],
    [652, 280],
    [660, 380],
    [640, 470],
    [600, 560],
    [560, 640],
    [528, 700],
    [500, 690],
    [482, 620],
    [462, 540],
    [440, 470],
    [420, 400],
    [398, 320],
    [372, 262],
    [340, 222],
  ];
  front += P(smooth(cap, true, 0.4), INK);
  // ear lock strands spilling onto the shoulder
  if (!o.capOnly) front += lock([[420, 330], [440, 420], [462, 500], [490, 590], [518, 680], [536, 740]], (t) => 50 * (1 - 0.45 * t), r, { strands: 7, split: 0.62, gloss: 1, glossW: 1.8, tipVar: 0.4 });
  if (!o.capOnly) front += lock([[560, 420], [580, 520], [580, 620], [570, 700], [560, 760]], (t) => 50 * (1 - 0.45 * t), r, { strands: 6, split: 0.6, tipVar: 0.4 });
  // fine strands at the hairline / temple
  front += B([[318, 210], [352, 232], [382, 280], [404, 350]], tail(3));
  front += B([[336, 206], [372, 236], [402, 300], [424, 400]], tail(2.4));
  // gloss band following the skull
  front += gloss(
    [
      [[366, 150], [430, 126], [500, 126]],
      [[378, 164], [446, 142], [530, 146]],
      [[528, 136], [584, 172], [624, 236]],
      [[404, 178], [466, 160], [540, 168]],
    ],
    2.6,
  );
  front += gloss([[[566, 180], [612, 252], [636, 340]], [[470, 220], [506, 320], [520, 420]], [[600, 300], [610, 420], [590, 520]]], 1.6);
  return { back, front };
}

// ---------------------------------------------------------------------------
// Extreme close-up eye (for the eye strips).
// ---------------------------------------------------------------------------
export interface BigEyeOpts {
  cx: number;
  cy: number;
  w: number; // corner to corner
  h: number; // opening height
  side: -1 | 1; // -1: viewer-left eye (inner corner on the right)
  irisR: number;
  pupilR: number;
  irisFill: string;
  irisOff?: Pt; // iris centre offset from eye centre
  seed?: number;
  lashes?: number; // lash density multiplier
  creaseGap?: number; // gap from lid to crease as fraction of h
  shadowLid?: boolean;
}

export function bigEye(o: BigEyeOpts): string {
  const r = rng(o.seed ?? 77);
  const { cx, cy, w, h, side } = o;
  // x from -0.5 (outer) to +0.5 (inner); side=-1 → outer at left
  const upperL: [number, number][] = [
    [-0.5, -0.02],
    [-0.34, -0.4],
    [-0.08, -0.56],
    [0.2, -0.52],
    [0.4, -0.24],
    [0.5, 0.06],
  ];
  const lowerL: [number, number][] = [
    [0.5, 0.06],
    [0.38, 0.32],
    [0.1, 0.44],
    [-0.2, 0.38],
    [-0.42, 0.16],
    [-0.5, -0.02],
  ];
  // side=-1: X(lx) = cx + lx*w → outer (lx=-0.5) at left. side=1 mirrors.
  const P2 = (a: number, b: number): Pt => [cx + (side === -1 ? a : -a) * w, cy + b * h];
  const up = upperL.map(([a, b]) => P2(a, b));
  const lo = lowerL.map(([a, b]) => P2(a, b));
  const eyeD = smooth([...up, ...lo.slice(1, -1)], true, 0.5);
  let s = '';
  // sclera
  s += P(eyeD, PAPER);
  const cid = id('fig-be');
  const ic: Pt = [cx + (o.irisOff?.[0] ?? 0), cy + (o.irisOff?.[1] ?? 0)];
  let inner = '';
  // corner shading on the eyeball
  inner += hatch([P2(-0.52, -0.6), P2(-0.3, -0.6), P2(-0.32, 0.6), P2(-0.52, 0.6)], 5, 80, r, 1.4);
  inner += hatch([P2(0.34, -0.6), P2(0.52, -0.6), P2(0.52, 0.6), P2(0.32, 0.6)], 5, 100, r, 1.4);
  // iris
  inner += `<circle cx="${ic[0]}" cy="${ic[1]}" r="${o.irisR}" fill="${o.irisFill}"/>`;
  // radial strokes
  let rad = '';
  const n = Math.round(o.irisR * 0.9);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + range(r, -0.03, 0.03);
    const r0 = o.pupilR * range(r, 1.0, 1.15);
    const r1 = o.irisR * range(r, 0.72, 0.98);
    const p0: Pt = [ic[0] + Math.cos(a) * r0, ic[1] + Math.sin(a) * r0];
    const pm: Pt = [ic[0] + Math.cos(a + 0.04) * (r0 + r1) / 2, ic[1] + Math.sin(a + 0.04) * (r0 + r1) / 2];
    const p1: Pt = [ic[0] + Math.cos(a) * r1, ic[1] + Math.sin(a) * r1];
    rad += vb([p0, pm, p1], pointed(range(r, 1.4, 3.2) * (o.irisR / 80), 0.7));
  }
  inner += P(rad, INK);
  // limbal ring and inner darkening
  inner += `<circle cx="${ic[0]}" cy="${ic[1]}" r="${o.irisR - o.irisR * 0.06}" fill="none" stroke="${INK}" stroke-width="${o.irisR * 0.12}"/>`;
  inner += `<circle cx="${ic[0]}" cy="${ic[1]}" r="${o.pupilR * 1.25}" fill="none" stroke="${INK}" stroke-width="${o.pupilR * 0.18}" stroke-dasharray="${o.pupilR * 0.25} ${o.pupilR * 0.18}"/>`;
  // pupil
  inner += `<circle cx="${ic[0]}" cy="${ic[1]}" r="${o.pupilR}" fill="${INK}"/>`;
  // upper lid shadow on the eyeball (band under the lid)
  const shadowBand = [...up, ...up.slice().reverse().map(([x, y]) => [x, y + h * 0.3] as Pt)];
  inner += clipped(smooth(shadowBand, true, 0.4), S(hatchLite(cx - w, cy - h, w * 2, h, 4.4, -8, r, 0.5), 1.6));
  if (o.shadowLid !== false) inner += P(smooth([...up, ...up.slice().reverse().map(([x, y]) => [x, y + h * 0.1] as Pt)], true, 0.4), INK);
  // catchlights
  inner += `<circle cx="${ic[0] - o.irisR * 0.3}" cy="${ic[1] - o.irisR * 0.32}" r="${o.irisR * 0.2}" fill="${PAPER}"/>`;
  inner += `<circle cx="${ic[0] + o.irisR * 0.34}" cy="${ic[1] + o.irisR * 0.3}" r="${o.irisR * 0.07}" fill="${PAPER}"/>`;
  s += `<clipPath id="${cid}"><path d="${eyeD}"/></clipPath><g clip-path="url(#${cid})">${inner}</g>`;
  // caruncle at the inner corner
  const ic0 = P2(0.47, 0.04);
  s += B([P2(0.5, 0.08), P2(0.45, -0.06), P2(0.42, 0.05), P2(0.45, 0.16)], pointed(w * 0.006));
  void ic0;
  // upper lid line (heavy), extended past the outer corner as a flick
  const lidLine = [P2(-0.58, 0.04), ...up.slice(0, 5), P2(0.48, -0.02)];
  s += P(vb(lidLine, (t) => w * (0.005 + 0.042 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.6))));
  // lid crease (heavy lids)
  const gap = o.creaseGap ?? 0.42;
  const crease = [P2(-0.46, -0.3 - gap * 0.5), P2(-0.28, -0.52 - gap), P2(0.0, -0.66 - gap), P2(0.26, -0.6 - gap), P2(0.42, -0.36 - gap * 0.6)];
  s += B(crease, pointed(w * 0.012));
  s += B(crease.map(([x, y]) => [x, y - h * 0.12] as Pt).slice(0, 4), pointed(w * 0.005));
  // lid fold shading between lid and crease
  s += hatch([...crease, ...up.slice(0, 5).reverse()], 4.6, 6, r, 1.3);
  // lashes
  const L = o.lashes ?? 1;
  const lashN = Math.round(14 * L);
  for (let i = 0; i < lashN; i++) {
    const t = 0.05 + (i / lashN) * 0.7;
    const k = Math.min(up.length - 2, Math.floor(t * (up.length - 1)));
    const base = lerp(up[k], up[k + 1], t * (up.length - 1) - k);
    const outward = 1 - t; // longer toward the outer corner
    const len = h * (0.12 + 0.22 * outward) * range(r, 0.8, 1.2);
    const dirX = (side === -1 ? -1 : 1) * (0.3 + 0.7 * outward);
    const tip: Pt = [base[0] + dirX * len, base[1] - len * (0.8 - 0.3 * outward)];
    const mid: Pt = [(base[0] + tip[0]) / 2 + dirX * len * 0.1, (base[1] + tip[1]) / 2 - len * 0.12];
    s += P(vb([base, mid, tip], tail(w * 0.012 * range(r, 0.8, 1.2), 0.9, 0.1)));
  }
  // lower lid and lower lashes
  s += P(vb([P2(0.46, 0.14), ...lo.slice(1, 5), P2(-0.52, 0.0)], (t) => w * (0.003 + 0.01 * Math.sin(Math.PI * t))));
  for (let i = 0; i < 7; i++) {
    const t = 0.45 + i * 0.07;
    const k = Math.min(lo.length - 2, Math.floor(t * (lo.length - 1)));
    const base = lerp(lo[k], lo[k + 1], t * (lo.length - 1) - k);
    const dirX = side === -1 ? -0.5 : 0.5;
    s += P(vb([base, [base[0] + dirX * h * 0.08, base[1] + h * 0.12]], tail(w * 0.006)));
  }
  // under-eye lines
  s += B([P2(0.3, 0.6), P2(0.05, 0.72), P2(-0.25, 0.64)], pointed(w * 0.008));
  s += B([P2(0.36, 0.8), P2(0.1, 0.94), P2(-0.15, 0.9)], pointed(w * 0.005));
  return s;
}

// ---------------------------------------------------------------------------
// Three-quarter head turned to the viewer's LEFT (same canonical units and
// stroke vocabulary as faceFront: face ≈200 wide, eye line ≈-8, chin ≈156).
// ---------------------------------------------------------------------------
export const FACE34: Pt[] = [
  [-8, -130],
  [52, -122],
  [88, -92],
  [100, -46],
  [102, -8], // near cheekbone
  [94, 30],
  [80, 68], // near cheek hollow
  [62, 104],
  [38, 136],
  [10, 154],
  [-14, 158], // chin
  [-32, 148],
  [-46, 126], // far jaw
  [-56, 94],
  [-60, 62], // far cheek hollow
  [-70, 22],
  [-78, -6], // far cheekbone
  [-72, -26], // socket dip
  [-78, -50], // brow ridge
  [-74, -92],
  [-50, -120],
];

export function face34(o: { gazeUp?: number; wonder?: number; closed?: boolean; seed?: number } = {}): string {
  const r = rng(o.seed ?? 51);
  const gu = o.gazeUp ?? 0;
  const wo = o.wonder ?? 0;
  let s = '';
  // neck
  s += P(smooth([[-36, 100], [-40, 200], [-44, 320], [64, 320], [56, 200], [52, 96]], true, 0.2), SKIN);
  s += hatch([[-44, 120], [56, 120], [60, 210], [10, 186], [-44, 200]], 4.2, 12, r, 1.3);
  s += hatch([[20, 150], [56, 140], [62, 320], [36, 300]], 4.5, 80, r, 1.2);
  s += B([[-38, 150], [-42, 230], [-44, 318]], even(4.4));
  s += B([[54, 140], [58, 230], [62, 318]], even(6));
  s += B([[30, 200], [10, 262], [2, 300]], pointed(3));
  // face
  s += P(smooth(FACE34, true, 0.42), SKIN);
  // gaunt cheek hollows, socket and temple shading (same angles as faceFront)
  s += hatch([[66, 14], [98, 24], [88, 64], [66, 102], [50, 112], [56, 64]], 4.2, 62, r, 1.3);
  s += hatch([[-62, 30], [-50, 40], [-48, 96], [-54, 110], [-62, 80]], 4.2, 118, r, 1.1);
  s += hatch([[80, -64], [98, -42], [100, -12], [88, -20], [78, -42]], 4, 90, r, 1.1);
  s += hatch([[2, -36], [16, -24], [12, -4], [0, -12]], 3.6, 100, r, 1.1);
  s += hatch([[-30, 116], [-4, 114], [-2, 126], [-28, 128]], 3.5, 0, r, 1.1);
  s += hatch([[10, 138], [34, 126], [26, 148], [6, 156]], 3.6, 50, r, 1.1);
  // nose: bridge from the inner corner of the near eye, shaded on the near side
  s += hatch([[4, -20], [16, 10], [8, 56], [-6, 66], [-10, 30]], 3.4, 70, r, 1.0);
  s += B([[2, -26], [-4, 6], [-18, 40], [-34, 58]], (t) => 1 + 2.6 * Math.sin(Math.PI * t));
  s += B([[-34, 58], [-40, 66], [-32, 72], [-20, 72]], (t) => 1 + 3.2 * Math.sin(Math.PI * t));
  s += B([[-6, 58], [2, 64], [-4, 72], [-14, 72]], (t) => 1 + 3 * Math.sin(Math.PI * t));
  s += B([[-24, 68], [-18, 70]], pointed(2.2));
  // contours: near side heavier
  s += P(vb(FACE34.slice(2, 12), (t) => 3 + 4.5 * Math.sin(Math.PI * Math.min(1, t * 1.1))));
  s += P(vb(FACE34.slice(11).concat([FACE34[0]]), (t) => 2.4 + 2.8 * Math.sin(Math.PI * t)));
  s += B([[62, 12], [80, 20], [92, 30]], pointed(3.2)); // cheekbone accent
  s += B([[-60, 16], [-68, 26]], pointed(2.4));
  // brows (raised, inner ends lifted in wonder)
  const lift = wo * 10;
  s += B([[6, -48 - lift], [30, -58 - lift * 0.6], [58, -58 - lift * 0.2], [84, -48]], (t) => 10 * Math.min(1, 0.5 + t * 2) * Math.pow(1 - t, 0.55) + 0.8);
  s += B([[-18, -48 - lift], [-38, -56 - lift * 0.6], [-58, -56 - lift * 0.2], [-76, -50]], (t) => 8 * Math.min(1, 0.5 + t * 2) * Math.pow(1 - t, 0.55) + 0.8);
  if (wo > 0) {
    s += B([[-14, -84], [10, -90], [36, -86]], pointed(2));
    s += B([[-8, -98], [12, -102], [30, -98]], pointed(1.5));
  }
  // eyes: near (wide) and far (foreshortened)
  const eye = (cx: number, w: number, k: number) => {
    const X = (u: number) => cx + u * w;
    const pts: Pt[] = [
      [X(-0.5), -5],
      [X(-0.28), -15],
      [X(0.02), -19],
      [X(0.3), -16],
      [X(0.5), -9],
      [X(0.3), -2],
      [X(0.0), 2],
      [X(-0.3), 0],
    ];
    const d = smooth(pts, true, 0.5);
    let e = P(d, PAPER);
    if (!o.closed) {
      const cid = id('fig-e34');
      const ic: Pt = [X(-0.08 - 0.06 * gu), -8 - gu * 6];
      e += `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})"><circle cx="${ic[0].toFixed(1)}" cy="${ic[1].toFixed(1)}" r="${(10.5 * k).toFixed(1)}" fill="${INK}"/><circle cx="${(ic[0] + 2.5).toFixed(1)}" cy="${(ic[1] - 3).toFixed(1)}" r="${(2.4 * k).toFixed(1)}" fill="${PAPER}"/>${P(vb([[X(-0.6), -14], [X(0), -20], [X(0.6), -12]], even(4.5, 0.2)))}</g>`;
    }
    e += P(vb([[X(-0.56), -4], [X(-0.3), -16], [X(0.02), -21], [X(0.3), -17], [X(0.54), -8]], (t) => 2 + 6.5 * k * Math.sin(Math.PI * Math.min(1, t * 1.1))));
    e += B([[X(-0.4), -24], [X(0), -30 - wo * 3], [X(0.42), -22]], pointed(2.4 * k));
    e += B([[X(-0.1), 2], [X(0.28), -1], [X(0.48), -6]], pointed(1.7));
    e += B([[X(-0.2), 12], [X(0.12), 13], [X(0.36), 7]], pointed(1.3));
    return e;
  };
  s += eye(38, 54, 1);
  s += eye(-46, 34, 0.8);
  // mouth: lips slightly parted
  const mo = wo * 7;
  s += P(smooth([[-44, 103], [-26, 98], [-8, 98], [16, 104], [-6, 104 + mo], [-28, 105 + mo]], true, 0.4), INK);
  s += P(vb([[-26, 100], [-10, 100]], pointed(1.6)), PAPER); // teeth glint
  s += B([[-30, 118 + mo * 0.5], [-16, 120 + mo * 0.5], [-2, 118 + mo * 0.5]], pointed(2));
  s += B([[30, 70], [36, 92], [30, 108]], pointed(2.4)); // nasolabial fold
  return s;
}

/** Hair cap for the 3/4 head (crown, back of skull to the right, framing locks). */
export function hair34Cap(seed = 52, earLock = true): string {
  const r = rng(seed);
  let f = '';
  const cap: Pt[] = [
    [-24, -136], // part
    [-60, -120],
    [-82, -86],
    [-90, -30],
    [-96, 40], // far lock beside the cheek
    [-104, 110],
    [-112, 60],
    [-108, -40],
    [-98, -120],
    [-56, -168],
    [10, -184],
    [90, -170],
    [150, -120],
    [176, -40],
    [174, 60],
    [150, 160],
    [120, 150],
    [108, 60],
    [104, -20],
    [96, -70],
    [70, -108],
    [24, -128],
  ];
  f += P(smooth(cap, true, 0.4), INK);
  if (earLock) f += lock([[120, 60], [126, 140], [124, 230], [118, 300]], (t) => 46 * (1 - 0.4 * t), r, { strands: 6, split: 0.55, tipVar: 0.4 });
  f += B([[-30, -132], [-70, -100], [-86, -40]], tail(3));
  f += B([[0, -132], [50, -116], [86, -80], [100, -20]], tail(3));
  f += gloss(
    [
      [[-40, -156], [10, -170], [70, -160]],
      [[-30, -144], [20, -156], [86, -146]],
      [[120, -110], [150, -60], [160, 0]],
    ],
    2.4,
  );
  f += gloss([[[-60, -140], [-30, -158]], [[140, 20], [138, 100]]], 1.4);
  return f;
}

/**
 * Brow built from feathered, tapered hair strokes. `top` and `bot` are the
 * brow's upper and lower edges, both ordered inner head → outer tail. Dense
 * and upright at the head, sparse and lying along the brow toward the tail.
 */
export function featherBrow(top: Pt[], bot: Pt[], seed: number, n = 230, wMax = 4.4): string {
  const r = rng(seed);
  const T = resample(sample(top, 6), 61);
  const Bm = resample(sample(bot, 6), 61);
  const norm = (v: Pt): Pt => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = Math.pow((i + r()) / n, 1.45);
    const k = Math.min(59, Math.floor(t * 60));
    const pt = T[k];
    const pb = Bm[k];
    const along = norm([T[k + 1][0] - T[k][0] + Bm[k + 1][0] - Bm[k][0], T[k + 1][1] - T[k][1] + Bm[k + 1][1] - Bm[k][1]]);
    const up = norm([pt[0] - pb[0], pt[1] - pb[1]]);
    const thick = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]);
    const f = range(r, 0, 0.92);
    const base = lerp(pb, pt, f);
    const mix = Math.min(1, t / 0.28); // 0: upright at the head, 1: lying along toward the tail
    const dir = norm([up[0] * (1.15 - mix * 0.85) + along[0] * (0.3 + mix * 1.2), up[1] * (1.15 - mix * 0.85) + along[1] * (0.3 + mix * 1.2)]);
    const len = (1 - f) * thick * (1.2 - 0.4 * mix) + 8 + mix * range(r, 16, 34);
    const tip: Pt = [base[0] + dir[0] * len, base[1] + dir[1] * len];
    const bend = range(r, -0.08, 0.12) * len;
    const mid: Pt = [(base[0] + tip[0]) / 2 + up[0] * bend, (base[1] + tip[1]) / 2 + up[1] * bend];
    const w = wMax * (1 - 0.55 * t) * range(r, 0.7, 1.15);
    d += vb([base, mid, tip], (u) => w * Math.min(1, 0.45 + u * 5) * Math.pow(1 - u, 0.9), 2);
  }
  return P(d, INK);
}
