import { art, ACCENT, INK, PAPER, RED, clipped, range, rng, smooth, type Pt } from '../kit.ts';
import { B, P, hatch, lock, pointed, vb } from './_util.ts';
import { face34, hair34Cap } from './_saint.ts';

export default art({
  name: 'saint-mini-accent',
  w: 900,
  h: 600,
  bg: RED,
  draw: () => {
    const r = rng(141);
    let s = '';
    // head frame: local face → global (tilted back, looking up-left)
    const HX = 352;
    const HY = 262;
    const HS = 0.82;
    const HR = 8;
    const head = (inner: string) => `<g transform="translate(${HX} ${HY}) rotate(${HR}) scale(${HS})">${inner}</g>`;

    // ---------------------------------------------------------------- hair blown to the right (behind)
    const N = 12;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const root: Pt = [430 + k * 40, 136 + k * 220];
      const len = 260 + Math.sin(k * Math.PI) * 150 + range(r, -20, 20);
      const rise = -60 + k * 120 + range(r, -10, 10);
      const wav = range(r, 8, 18) * (i % 2 ? 1 : -1);
      const pts: Pt[] = [
        root,
        [root[0] + len * 0.25, root[1] + rise * 0.2 + wav * 0.5],
        [root[0] + len * 0.5, root[1] + rise * 0.45 - wav * 0.6],
        [root[0] + len * 0.75, root[1] + rise * 0.72 + wav * 0.6],
        [root[0] + len, root[1] + rise - wav * 0.2],
      ];
      s += lock(pts, (t) => (46 - k * 12) * (1 - 0.6 * t), r, { strands: 5, split: 0.55, tipVar: 0.5, jitter: 0.7, gloss: i % 3 === 0 ? 1 : 0, glossW: 2 });
    }
    s += P(smooth([[420, 130], [480, 150], [500, 260], [486, 380], [430, 396], [420, 300]], true, 0.4));


    // ---------------------------------------------------------------- neck + face (shared 3/4 head), then the robe over the neck base
    s += head(face34({ gazeUp: 1, wonder: 1, seed: 58 }));
    // ---------------------------------------------------------------- robe bust (ACCENT)
    const robe: Pt[] = [
      [300, 374],
      [356, 390],
      [416, 380],
      [520, 404],
      [612, 452],
      [664, 540],
      [690, 620],
      [120, 620],
      [140, 520],
      [184, 440],
      [246, 398],
    ];
    const rd = smooth(robe, true, 0.35);
    s += P(rd, ACCENT);
    let ri = '';
    // shadow side (right) and underarm
    ri += hatch([[520, 404], [612, 452], [670, 540], [700, 620], [560, 620], [540, 520]], 4.2, 100, r, 1.3);
    ri += hatch([[600, 470], [700, 540], [700, 620], [620, 620]], 4.2, 10, r, 1.1);
    ri += hatch([[120, 470], [200, 420], [214, 620], [120, 620]], 5.4, 80, r, 1.0);
    // folds: drape from the shoulders toward the waist, with shade strips beside them
    const folds: Pt[][] = [
      [[470, 400], [512, 470], [540, 548], [548, 620]],
      [[560, 430], [590, 510], [606, 620]],
      [[236, 410], [214, 480], [206, 560], [204, 620]],
      [[290, 430], [276, 520], [276, 620]],
      [[430, 470], [460, 540], [470, 620]],
    ];
    for (const f of folds) {
      ri += B(f, (t) => 0.8 + 4.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t)), 0.7));
      ri += hatch([...f, ...f.map(([x, y]) => [x + 14, y + 6] as Pt).reverse()], 3.6, 70, r, 1.0);
    }
    // crossed collar: dark trim band edged in ink
    const colL: Pt[] = [
      [300, 374],
      [352, 444],
      [404, 520],
      [440, 620],
    ];
    const colR: Pt[] = [
      [340, 378],
      [390, 444],
      [438, 520],
      [470, 620],
    ];
    ri += P(smooth([...colL, ...colR.slice().reverse()], true, 0.3), INK);
    ri += P(vb([[316, 384], [366, 452], [416, 528], [450, 620]], pointed(1.6)), PAPER);
    ri += P(smooth([[416, 380], [442, 384], [404, 440], [384, 470], [372, 452], [394, 420]], true, 0.3), INK);
    s += clipped(rd, ri);
    s += P(vb(robe.slice(2, 7), (t) => 3 + 4 * Math.sin(Math.PI * t)));
    s += P(vb([[120, 620], [140, 520], [184, 440], [246, 398], [300, 374]], (t) => 2.5 + 3.5 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- hair cap (shared 3/4 piece)
    s += head(hair34Cap(59, false));
    // loose strands lifting off the crown
    s += B([[380, 118], [440, 96], [520, 92], [600, 70]], (t) => 3.4 * Math.pow(1 - t, 0.8));
    s += B([[360, 126], [420, 110], [490, 112], [560, 100]], (t) => 2.6 * Math.pow(1 - t, 0.8));

    // ---------------------------------------------------------------- tall black grass in the bottom quarter
    for (let i = 0; i < 150; i++) {
      const x = range(r, -30, 930);
      const back = i < 60;
      const hgt = back ? range(r, 150, 230) : range(r, 70, 170);
      const bend = range(r, -50, 60);
      const w = back ? range(r, 4, 9) : range(r, 7, 16);
      s += P(vb([[x, 614], [x + bend * 0.15, 614 - hgt * 0.4], [x + bend * 0.55, 614 - hgt * 0.75], [x + bend, 614 - hgt]], (t) => w * Math.pow(1 - t, 0.9) * Math.min(1, 0.5 + t * 8)));
    }
    s += P(smooth([[-10, 580], [300, 570], [600, 578], [910, 568], [910, 610], [-10, 610]], true, 0.3));

    return s;
  },
});
