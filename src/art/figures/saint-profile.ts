import { art, INK, KHAKI, KHAKI_DEEP, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, even, hatch, pointed } from './_util.ts';
import { profileFace, profileHair } from './_saint.ts';

export default art({
  name: 'saint-profile',
  w: 900,
  h: 1000,
  draw: () => {
    const r = rng(31);
    const hair = profileHair({ seed: 12, len: 1000, sweep: 30 });
    let s = '';
    s += hair.back;
    s += profileFace({ worry: 0.7, seed: 21 });

    // ---------------------------------------------------------------- robe
    const robe: Pt[] = [
      [344, 676],
      [372, 660],
      [430, 642],
      [500, 626],
      [566, 640],
      [632, 680],
      [682, 764],
      [706, 862],
      [718, 1004],
      [280, 1004],
      [286, 900],
      [298, 820],
      [318, 760],
    ];
    const rd = smooth(robe, true, 0.35);
    s += P(rd, KHAKI);
    let inner = '';
    // back / shoulder shadow
    inner += P(smooth([[612, 690], [690, 740], [730, 1010], [640, 1010], [630, 860]], true), KHAKI_DEEP);
    inner += hatch([[590, 680], [700, 740], [740, 1010], [610, 1010], [600, 860]], 5.5, 96, r, 1.4);
    // arm front edge shadow (the sleeve hangs in front of the torso side)
    inner += hatch([[520, 760], [570, 740], [560, 1010], [500, 1010], [506, 880]], 5, 94, r, 1.2);
    // cast shadow under the collar
    inner += P(smooth([[360, 724], [420, 704], [500, 688], [566, 696], [500, 714], [420, 732], [366, 750]], true), INK);
    inner += hatch([[340, 740], [540, 690], [540, 760], [350, 800]], 4.4, 20, r, 1.1);
    // chest front light shading
    inner += hatch([[290, 820], [320, 800], [330, 1010], [280, 1010]], 6, 100, r, 1.0);
    // folds
    inner += B([[628, 724], [650, 820], [664, 920], [668, 1004]], (t) => 1 + 5 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.1)));
    inner += B([[592, 706], [600, 800], [606, 900], [600, 1004]], (t) => 1 + 4 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.1)));
    inner += B([[548, 752], [536, 860], [528, 1004]], (t) => 1 + 5.5 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.1)));
    inner += B([[400, 780], [450, 850], [492, 930], [508, 1004]], pointed(4));
    inner += B([[360, 820], [392, 900], [410, 1004]], pointed(3.4));
    inner += B([[460, 780], [500, 830], [520, 880]], pointed(2.6));
    inner += B([[680, 800], [690, 900], [700, 1004]], pointed(3));
    s += clipped(rd, inner);
    // collar band around the neck and down the chest
    const collarA: Pt[] = [[548, 632], [486, 634], [424, 652], [374, 670], [344, 690], [324, 740], [306, 830], [294, 930], [290, 1004]];
    const collarB: Pt[] = [[556, 664], [494, 666], [434, 684], [392, 702], [368, 724], [350, 780], [332, 870], [322, 950], [318, 1004]];
    s += P(smooth([...collarA, ...collarB.slice().reverse()], true, 0.35), KHAKI);
    s += hatch([...collarA.slice(0, 4), ...collarB.slice(0, 4).reverse()], 3.5, 30, r, 1.0);
    s += B(collarA, even(4, 0.04));
    s += B(collarB, even(3.2, 0.06));
    // robe outline
    s += B([[344, 676], [318, 750], [298, 820], [286, 900], [280, 1002]], (t) => 3 + 4 * Math.sin(Math.PI * t));
    s += B([[500, 626], [566, 640], [632, 680], [682, 764], [706, 862], [718, 1002]], (t) => 3 + 5 * Math.sin(Math.PI * t));

    // ---------------------------------------------------------------- hair in front (ear lock)
    s += hair.front;
    return s;
  },
});
