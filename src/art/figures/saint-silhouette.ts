import { art, INK, PAPER, range, rng, smooth, type Pt } from '../kit.ts';
import { P, lock, pointed, vb } from './_util.ts';

export default art({
  name: 'saint-silhouette',
  w: 700,
  h: 1000,
  draw: () => {
    const r = rng(71);
    let s = '';
    // ---------------------------------------------------------------- hair streaming right (behind the body)
    // locks rooted along the back of the head and down the nape; long hair lifted into a fan
    const N = 13;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const root: Pt = [322 + Math.sin(k * 2.6) * 18, 84 + k * 170];
      const len = 300 + Math.sin(k * Math.PI) * 50 + range(r, -16, 16);
      const rise = -60 + k * 150 + range(r, -12, 12); // upper locks lift, lower ones droop
      const wav = range(r, 6, 16) * (i % 2 ? 1 : -1);
      const pts: Pt[] = [
        root,
        [root[0] + len * 0.25, root[1] + rise * 0.18 + wav * 0.5],
        [root[0] + len * 0.5, root[1] + rise * 0.42 - wav * 0.6],
        [root[0] + len * 0.76, root[1] + rise * 0.7 + wav * 0.7],
        [root[0] + len, root[1] + rise - wav * 0.2],
      ];
      s += lock(pts, (t) => (34 - k * 8) * (1 - 0.6 * t), r, { strands: 4, split: 0.52, tipVar: 0.55, jitter: 0.8 });
    }
    // loose single strands flying off
    for (let i = 0; i < 16; i++) {
      const k = i / 15;
      const y0 = 86 + k * 190;
      const len = range(r, 260, 350);
      const rise = -70 + k * 160;
      const wav = range(r, 6, 18) * (i % 2 ? 1 : -1);
      s += P(vb([[330, y0], [330 + len * 0.3, y0 + rise * 0.25 + wav], [330 + len * 0.62, y0 + rise * 0.6 - wav * 0.7], [330 + len, y0 + rise + wav * 0.4]], pointed(range(r, 2.4, 5), 0.9)));
    }
    // root mass behind the head and nape
    s += P(smooth([[270, 80], [330, 74], [372, 120], [400, 200], [404, 260], [360, 280], [320, 250], [290, 200]], true, 0.4));

    // ---------------------------------------------------------------- body
    const body: Pt[] = [
      // head
      [300, 58],
      [334, 72],
      [346, 112],
      [342, 150],
      [332, 180],
      [318, 196],
      [314, 214], // neck
      [346, 230],
      [392, 252], // shoulder
      [414, 290],
      [424, 380],
      [432, 470],
      [442, 560], // sleeve bottom right
      [444, 600],
      [412, 610],
      [404, 640],
      [418, 760],
      [440, 880],
      [470, 950], // hem flares right (wind)
      [436, 962],
      [380, 966],
      [350, 978], // right foot
      [324, 984],
      [306, 972],
      [282, 984], // left foot
      [254, 978],
      [236, 966],
      [180, 962],
      [148, 952],
      [166, 880],
      [182, 760],
      [194, 640],
      [188, 610],
      [158, 600],
      [158, 560], // sleeve bottom left
      [168, 470],
      [176, 380],
      [186, 290],
      [208, 252],
      [254, 230],
      [286, 214],
      [284, 196],
      [268, 180],
      [258, 150],
      [254, 112],
      [266, 72],
    ];
    s += P(smooth(body, true, 0.3), INK);
    // hands just visible under the sleeves
    s += P(smooth([[196, 604], [214, 606], [212, 650], [204, 668], [194, 650]], true), INK);
    s += P(smooth([[404, 604], [388, 606], [390, 650], [398, 668], [408, 650]], true), INK);
    // hair framing the face on the left, pulled across by the wind
    s += P(smooth([[262, 72], [300, 54], [338, 70], [330, 84], [296, 84], [270, 110], [256, 112]], true));

    // ---------------------------------------------------------------- thin paper rim light (back-lit from the disc)
    s += P(vb([[262, 76], [252, 112], [256, 150], [266, 178]], pointed(3, 0.8)), PAPER);
    s += P(vb([[206, 258], [190, 290], [182, 380], [172, 470], [164, 560]], pointed(3.4, 0.8)), PAPER);
    s += P(vb([[192, 660], [184, 760], [170, 880], [158, 944]], pointed(2.6, 0.8)), PAPER);
    s += P(vb([[396, 256], [414, 292], [422, 360]], pointed(2.2, 0.8)), PAPER);
    return s;
  },
});
