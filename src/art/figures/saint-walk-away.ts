import { art, ACCENT, INK, PAPER, SKIN, clipped, range, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, gloss, hatch, lock, pointed, vb } from './_util.ts';

export default art({
  name: 'saint-walk-away',
  w: 700,
  h: 1000,
  draw: () => {
    const r = rng(91);
    let s = '';

    // ---------------------------------------------------------------- hair blowing right (behind everything that follows)
    const N = 11;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const root: Pt = [262 + k * 40, 90 + k * 200];
      const len = 220 + Math.sin(k * Math.PI) * 120 + range(r, -20, 20);
      const rise = -40 + k * 110;
      const wav = range(r, 8, 20) * (i % 2 ? 1 : -1);
      const pts: Pt[] = [
        root,
        [root[0] + len * 0.25, root[1] + rise * 0.2 + wav * 0.5],
        [root[0] + len * 0.5, root[1] + rise * 0.45 - wav * 0.6],
        [root[0] + len * 0.75, root[1] + rise * 0.72 + wav * 0.6],
        [root[0] + len, root[1] + rise - wav * 0.2],
      ];
      s += lock(pts, (t) => (40 - k * 10) * (1 - 0.6 * t), r, { strands: 5, split: 0.55, tipVar: 0.5, jitter: 0.8, gloss: i % 3 === 0 ? 1 : 0, glossW: 1.8 });
    }

    // ---------------------------------------------------------------- train sweeping to the right and back
    const trainTop: Pt[] = [
      [352, 470],
      [366, 590],
      [404, 700],
      [470, 800],
      [560, 862],
      [640, 886],
      [696, 880],
    ];
    const trainBot: Pt[] = [
      [696, 930],
      [640, 950],
      [560, 962],
      [470, 960],
      [404, 946],
      [352, 930],
    ];
    const trainD = smooth([...trainTop, ...trainBot], true, 0.35);
    s += P(trainD, ACCENT);
    let ti = '';
    // underside / shadow of the billow
    ti += hatch([[380, 900], [700, 900], [700, 980], [380, 980]], 4.2, 4, r, 1.4);
    ti += hatch([[340, 600], [420, 720], [520, 820], [480, 840], [380, 740], [330, 640]], 4.6, 50, r, 1.2);
    // long folds following the flow
    const flows: Pt[][] = [
      [[350, 640], [420, 760], [520, 840], [640, 900], [696, 904]],
      [[340, 720], [410, 820], [520, 890], [640, 924]],
      [[350, 820], [440, 900], [560, 936], [680, 946]],
    ];
    for (const f of flows) ti += B(f, (t) => 0.8 + 4 * Math.sin(Math.PI * t));
    // trim bands along the train hem
    const hemT = trainBot.slice().reverse();
    const off = (dy: number) => hemT.map(([x, y]) => [x, y - dy] as Pt);
    ti += P(smooth([...off(62), ...off(48).reverse()], true, 0.3), INK);
    ti += P(smooth([...off(36), ...off(25).reverse()], true, 0.3), INK);
    s += clipped(trainD, ti);
    s += P(vb(trainTop, (t) => 2 + 4 * Math.sin(Math.PI * t)));
    s += P(vb(trainBot.slice().reverse(), (t) => 2.5 + 4 * Math.sin(Math.PI * t)));
    s += B([[696, 880], [700, 905], [696, 930]], pointed(3));

    // ---------------------------------------------------------------- lifted heel (trailing foot)
    const foot: Pt[] = [
      [258, 902],
      [292, 902],
      [298, 934],
      [300, 956],
      [292, 976],
      [284, 990],
      [266, 994],
      [254, 984],
      [248, 962],
      [250, 934],
    ];
    s += P(smooth(foot, true, 0.4), SKIN);
    s += clipped(smooth(foot, true, 0.4), hatch([[240, 958], [306, 950], [306, 1000], [240, 1000]], 2.6, 10, r, 1.2));
    s += P(vb([[258, 902], [250, 934], [248, 962], [254, 984], [266, 994], [284, 990], [292, 976], [300, 956], [298, 934], [292, 902]], (t) => 2.2 + 3.4 * Math.sin(Math.PI * t)));
    s += B([[254, 954], [272, 960], [292, 954]], pointed(2));

    // ---------------------------------------------------------------- robe body
    const hem: Pt[] = [
      [352, 930],
      [320, 918],
      [290, 926],
      [250, 916],
      [200, 924],
      [150, 914],
      [116, 902],
    ];
    const body: Pt[] = [
      [180, 196],
      [256, 186],
      [332, 196],
      [366, 230],
      [366, 330],
      [354, 470],
      [358, 600],
      [362, 760],
      [364, 880],
      ...hem,
      [120, 880],
      [130, 760],
      [144, 600],
      [156, 470],
      [144, 330],
      [146, 230],
    ];
    const bd = smooth(body, true, 0.3);
    s += P(bd, ACCENT);
    let inner = '';
    inner += hatch([[310, 470], [370, 470], [380, 960], [320, 960]], 5, 94, r, 1.2);
    const folds: Pt[][] = [
      [[180, 520], [226, 640], [278, 760], [300, 900]],
      [[206, 500], [262, 620], [316, 740], [336, 880]],
      [[170, 600], [204, 720], [234, 840], [248, 916]],
      [[150, 680], [166, 800], [176, 910]],
      [[260, 500], [306, 600], [344, 720]],
    ];
    folds.forEach((f, i) => {
      inner += B(f, (t) => 0.8 + (5 - i * 0.5) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.9)), 0.7));
      inner += hatch([...f.map(([x, y]) => [x + 2, y] as Pt), ...f.map(([x, y]) => [x + 15, y + 4] as Pt).reverse()], 3.6, 70, r, 1.0);
    });
    inner += B([[150, 470], [210, 480], [256, 478], [310, 480], [356, 470]], even(3.4, 0.05));
    const up = (dy: number) => hem.map(([x, y]) => [x, y - dy] as Pt);
    inner += P(smooth([...up(62), ...up(48).reverse()], true, 0.3), INK);
    inner += P(smooth([...up(36), ...up(25).reverse()], true, 0.3), INK);
    s += clipped(bd, inner);
    s += P(vb(hem, even(4.2, 0.04)));
    s += B([[180, 196], [146, 230], [144, 330], [156, 470], [144, 600], [130, 760], [120, 880], [116, 902]], (t) => 2.5 + 3 * Math.sin(Math.PI * t));
    s += B([[332, 196], [366, 230], [366, 330], [354, 470], [358, 560]], (t) => 3.5 + 4 * Math.sin(Math.PI * t));

    // ---------------------------------------------------------------- sleeves
    const sleeveL: Pt[] = [
      [184, 200],
      [150, 214],
      [126, 262],
      [108, 360],
      [96, 470],
      [92, 556],
      [100, 594],
      [140, 604],
      [186, 594],
      [196, 556],
      [188, 440],
      [184, 320],
    ];
    const sleeveR: Pt[] = [
      [328, 200],
      [364, 214],
      [390, 262],
      [412, 350],
      [432, 430],
      [452, 500],
      [448, 534],
      [410, 546],
      [370, 540],
      [360, 500],
      [356, 400],
      [348, 300],
    ];
    for (const [sl, side] of [[sleeveL, -1], [sleeveR, 1]] as const) {
      const sd = smooth(sl, true, 0.35);
      s += P(sd, ACCENT);
      let si = '';
      if (side > 0) {
        si += hatch([[370, 220], [470, 260], [470, 560], [390, 560], [380, 400]], 4.4, 94, r, 1.3);
        si += hatch([[400, 260], [470, 260], [470, 560], [420, 560]], 4.4, 4, r, 1.0);
      } else {
        si += hatch([[80, 240], [130, 240], [120, 620], [80, 620]], 6, 94, r, 1.0);
        si += hatch([[166, 260], [206, 260], [206, 620], [166, 620]], 4.4, 90, r, 1.2);
      }
      const base = sl[3];
      si += B([[base[0] + side * -10 + 30, 230], [base[0] + 30, 360], [base[0] + 24, 500]], pointed(3.4));
      si += B([[base[0] + 50, 280], [base[0] + 50, 420], [base[0] + 52, 560]], pointed(2.6));
      const bottom = sl.slice(5, 10);
      const bandAt = (dy: number, th: number) => P(smooth([...bottom.map(([x, y]) => [x, y - dy] as Pt), ...bottom.slice().reverse().map(([x, y]) => [x, y - dy - th] as Pt)], true, 0.3), INK);
      si += bandAt(28, 13) + bandAt(52, 10);
      s += clipped(sd, si);
      s += P(vb(sl.slice(0, 9), (t) => (side > 0 ? 5 : 3.6) * (0.5 + 0.5 * Math.sin(Math.PI * t))));
      s += B(sl.slice(8).concat([sl[0]]), even(2.6, 0.12));
    }

    // ---------------------------------------------------------------- head turned slightly right: a sliver of cheek and nose
    s += P(smooth([[300, 92], [322, 108], [330, 124], [324, 134], [326, 150], [314, 176], [292, 186], [288, 120]], true, 0.4), SKIN);
    s += hatch([[288, 130], [314, 140], [312, 176], [290, 186]], 3, 70, r, 1.0);
    s += P(vb([[304, 96], [322, 108], [331, 124], [324, 134], [326, 150], [314, 176], [294, 188]], (t) => 1.8 + 3 * Math.sin(Math.PI * t)));
    s += B([[316, 110], [326, 108]], pointed(2.4)); // lashes
    // hair: head + nape mass, locks down the back swept right
    s += P(smooth([[256, 36], [300, 44], [318, 80], [306, 120], [300, 170], [330, 210], [350, 260], [330, 290], [256, 300], [184, 286], [166, 250], [178, 210], [204, 172], [198, 126], [204, 80], [226, 48]], true, 0.45));
    const locks: [Pt[], number][] = [
      [[[226, 140], [206, 230], [198, 330], [204, 420], [214, 490]], 48],
      [[[252, 140], [248, 240], [256, 350], [272, 450], [296, 520]], 56],
      [[[280, 140], [292, 240], [312, 340], [340, 430], [376, 490]], 52],
      [[[300, 150], [330, 230], [364, 300], [404, 350], [450, 380]], 40],
    ];
    for (const [c, w] of locks) s += lock(c, (t) => w * (1 - 0.4 * t) * (0.45 + 0.55 * Math.min(1, t * 6)), r, { strands: 7, split: 0.6, tipVar: 0.5, jitter: 0.7, gloss: 2, glossW: 2 });
    s += gloss(
      [
        [[228, 62], [258, 52], [284, 58]],
        [[210, 92], [240, 80], [270, 78]],
      ],
      2.6,
    );
    // stray strands across the cheek
    s += B([[292, 70], [330, 92], [372, 100], [420, 96]], (t) => 3.2 * Math.pow(1 - t, 0.8));
    s += B([[296, 110], [340, 130], [392, 140], [440, 132]], (t) => 2.6 * Math.pow(1 - t, 0.8));
    s += P(vb([[150, 222], [184, 204], [220, 196]], pointed(2)), PAPER);
    return s;
  },
});
