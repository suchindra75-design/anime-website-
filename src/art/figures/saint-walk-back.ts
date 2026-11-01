import { art, INK, KHAKI, KHAKI_DEEP, PAPER, SKIN, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, gloss, hatch, lock, pointed, vb } from './_util.ts';

export default art({
  name: 'saint-walk-back',
  w: 600,
  h: 1000,
  draw: () => {
    const r = rng(81);
    let s = '';
    // hem curve: lifted on the right by the trailing leg
    const hem: Pt[] = [
      [458, 912],
      [432, 930],
      [404, 922],
      [372, 932],
      [338, 926],
      [300, 940],
      [250, 934],
      [200, 922],
      [160, 914],
      [136, 904],
    ];

    // ---------------------------------------------------------------- trailing foot (behind the hem): heel lifted, sole toward us
    // ankle + lifted heel, sole facing us, ball of the foot on the ground beyond
    const foot: Pt[] = [
      [348, 900],
      [388, 900],
      [394, 930],
      [398, 954],
      [390, 974],
      [382, 990],
      [364, 994],
      [350, 984],
      [340, 962],
      [340, 934],
    ];
    s += P(smooth(foot, true, 0.4), SKIN);
    // sole (darker, hatched) below the heel bulb
    s += clipped(smooth(foot, true, 0.4), hatch([[340, 958], [396, 950], [396, 1000], [340, 1000]], 2.6, 10, r, 1.2) + hatch([[376, 900], [396, 900], [396, 960], [380, 960]], 3, 84, r, 1.0));
    s += P(vb([[352, 900], [344, 936], [346, 962], [354, 984], [366, 994], [380, 990], [386, 972], [392, 952], [388, 930], [384, 900]], (t) => 2.2 + 3.6 * Math.sin(Math.PI * t)));
    s += B([[350, 954], [366, 960], [386, 954]], pointed(2.2));
    s += B([[366, 904], [367, 934]], pointed(2.4));
    s += B([[356, 970], [370, 976]], pointed(1.6));
    // contact shadow under the planted (hidden) forward foot
    s += hatch([[150, 930], [320, 942], [310, 952], [160, 944]], 3, 0, r, 1.2);
    s += hatch([[350, 990], [400, 990], [396, 998], [354, 998]], 2.6, 0, r, 1.1);

    // ---------------------------------------------------------------- robe body
    const body: Pt[] = [
      [210, 196],
      [300, 186],
      [392, 196],
      [430, 230],
      [432, 330],
      [420, 470],
      [430, 600],
      [446, 760],
      [458, 880],
      ...hem,
      [140, 880],
      [150, 760],
      [168, 600],
      [180, 470],
      [168, 330],
      [172, 230],
    ];
    const bd = smooth(body, true, 0.3);
    s += P(bd, KHAKI);
    let inner = '';
    // right side in shadow (light from upper-left)
    inner += P(smooth([[370, 470], [430, 470], [450, 760], [470, 960], [390, 960], [380, 760]], true), KHAKI_DEEP);
    inner += hatch([[360, 470], [434, 470], [456, 760], [480, 970], [380, 970], [370, 760]], 4.8, 96, r, 1.3);
    // stride tension folds from the left hip toward the trailing right leg
    const folds: Pt[][] = [
      [[200, 520], [250, 640], [312, 760], [340, 900]],
      [[230, 500], [290, 620], [350, 740], [372, 880]],
      [[196, 600], [234, 720], [270, 840], [290, 940]],
      [[180, 680], [200, 800], [214, 940]],
      [[300, 500], [350, 600], [400, 720], [424, 860]],
      [[160, 760], [166, 860], [168, 930]],
    ];
    folds.forEach((f, i) => {
      inner += B(f, (t) => 0.8 + (5 - i * 0.4) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.9)), 0.7));
      const shade = f.map(([x, y]) => [x + 16, y + 4] as Pt);
      inner += hatch([...f.map(([x, y]) => [x + 2, y] as Pt), ...shade.slice().reverse()], 3.6, 70, r, 1.0);
    });
    // the trailing calf pushing the cloth: a dark crease and hatch
    inner += P(vb([[330, 820], [352, 880], [360, 940]], pointed(7, 0.8)));
    inner += hatch([[330, 860], [380, 860], [400, 950], [330, 950]], 3.4, 80, r, 1.2);
    // waist cinch
    inner += B([[178, 470], [240, 480], [300, 478], [360, 480], [422, 470]], even(3.4, 0.05));
    inner += B([[182, 488], [300, 496], [420, 488]], pointed(2));
    // hem trim bands (two), following the hem
    const up = (dy: number) => hem.map(([x, y]) => [x, y - dy] as Pt);
    inner += P(smooth([...up(64).map(([x, y]) => [x + 6, y] as Pt), ...up(48).slice().reverse()], true, 0.3), INK);
    inner += P(smooth([...up(36), ...up(24).slice().reverse()], true, 0.3), INK);
    s += clipped(bd, inner);
    s += P(vb(hem.slice().reverse(), even(4.5, 0.04)));
    s += B([[210, 196], [172, 230], [168, 330], [180, 470], [168, 600], [150, 760], [140, 880], [136, 904]], (t) => 2.5 + 3 * Math.sin(Math.PI * t));
    s += B([[392, 196], [430, 230], [432, 330], [420, 470], [430, 600], [446, 760], [458, 880], [452, 908]], (t) => 3.5 + 4.5 * Math.sin(Math.PI * t));

    // ---------------------------------------------------------------- sleeves
    // left arm swings back (toward us): sleeve hangs a little lower and outward
    const sleeveL: Pt[] = [
      [214, 200],
      [176, 214],
      [150, 260],
      [130, 360],
      [116, 470],
      [110, 560],
      [118, 600],
      [160, 610],
      [210, 600],
      [222, 560],
      [214, 440],
      [212, 320],
    ];
    const sleeveR: Pt[] = [
      [386, 200],
      [424, 214],
      [446, 262],
      [462, 350],
      [472, 440],
      [478, 520],
      [470, 552],
      [430, 562],
      [392, 552],
      [386, 500],
      [390, 400],
      [388, 300],
    ];
    for (const [sl, side] of [[sleeveL, -1], [sleeveR, 1]] as const) {
      const sd = smooth(sl, true, 0.35);
      s += P(sd, KHAKI);
      let si = '';
      const bottom = sl.slice(5, 10);
      if (side > 0) {
        si += P(smooth([[430, 220], [500, 260], [500, 580], [436, 580], [430, 400]], true), KHAKI_DEEP);
        si += hatch([[420, 220], [500, 260], [500, 580], [426, 580], [420, 400]], 4.4, 94, r, 1.3);
      } else {
        si += hatch([[100, 240], [150, 240], [140, 620], [100, 620]], 6, 94, r, 1.0);
        si += hatch([[190, 260], [230, 260], [230, 620], [190, 620]], 4.4, 90, r, 1.2);
      }
      // folds hanging from the shoulder
      const mx = (x: number) => (side < 0 ? x : 600 - x);
      si += B([[mx(178), 230], [mx(160), 340], [mx(150), 460], [mx(146), 580]], pointed(3.6));
      si += B([[mx(196), 280], [mx(190), 400], [mx(188), 540]], pointed(2.8));
      // trim bands following the sleeve bottom
      const bandAt = (dy: number, th: number) => P(smooth([...bottom.map(([x, y]) => [x, y - dy] as Pt), ...bottom.slice().reverse().map(([x, y]) => [x, y - dy - th] as Pt)], true, 0.3), INK);
      si += bandAt(30, 14) + bandAt(56, 10);
      s += clipped(sd, si);
      s += P(vb(sl.slice(0, 9), (t) => (side > 0 ? 5 : 3.6) * (0.5 + 0.5 * Math.sin(Math.PI * t))));
      s += B(sl.slice(8).concat([sl[0]]), even(2.6, 0.12));
    }

    // ---------------------------------------------------------------- hair down the back
    s += P(smooth([[300, 36], [348, 46], [372, 84], [378, 130], [378, 172], [394, 214], [400, 250], [380, 282], [300, 290], [220, 282], [200, 250], [206, 214], [222, 172], [222, 130], [228, 84], [252, 46]], true, 0.45));
    const locks: [Pt[], number][] = [
      [[[262, 130], [238, 230], [224, 340], [218, 430], [216, 500]], 56],
      [[[288, 130], [276, 240], [268, 360], [266, 470], [264, 556]], 60],
      [[[312, 130], [318, 240], [322, 360], [326, 480], [330, 572]], 60],
      [[[338, 130], [360, 230], [372, 340], [380, 440], [384, 520]], 56],
      [[[238, 140], [214, 230], [202, 330], [198, 400], [200, 450]], 34],
      [[[362, 140], [388, 230], [402, 330], [406, 400], [406, 460]], 34],
    ];
    for (const [c, w] of locks) s += lock(c, (t) => w * (1 - 0.35 * t) * (0.45 + 0.55 * Math.min(1, t * 6)), r, { strands: 8, split: 0.62, tipVar: 0.5, jitter: 0.5, gloss: 2, glossW: 2 });
    // crown gloss + strand partings
    s += gloss(
      [
        [[262, 66], [300, 54], [340, 66]],
        [[250, 84], [300, 70], [352, 84]],
        [[240, 110], [298, 98], [360, 110]],
      ],
      2.6,
    );
    s += gloss([[[300, 140], [298, 260], [296, 380]], [[256, 160], [244, 280], [238, 400]], [[344, 160], [356, 280], [362, 380]]], 1.4);
    // a few loose strands over the shoulders
    s += B([[226, 180], [196, 230], [180, 300], [176, 360]], (t) => 3 * Math.pow(1 - t, 0.8));
    s += B([[374, 180], [404, 230], [418, 300]], (t) => 3 * Math.pow(1 - t, 0.8));
    // rim light on the shoulder line
    s += P(vb([[180, 222], [214, 204], [250, 196]], pointed(2)), PAPER);
    return s;
  },
});
