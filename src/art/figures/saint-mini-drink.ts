import { art, ACCENT, INK, KHAKI, KHAKI_DEEP, PAPER, RED, SKIN, clipped, range, rng, smooth, type Pt } from '../kit.ts';
import { B, P, digit, even, hatch, limb, offset, pointed, vb } from './_util.ts';
import { profileFace, profileHair } from './_saint.ts';

// shared profile head (faces left) mirrored to face RIGHT; neck point at (HX, HY)
const HX = 372;
const HY = 252;
const HS = 0.42;
const HEAD = `translate(${HX} ${HY}) scale(${-HS} ${HS}) translate(-430 -600)`;

// glass frame: origin at the rim centre, +y down the stem, tilted toward the lips
const C: Pt = [500, 190];
const TILT = -15;
const ca = Math.cos((TILT * Math.PI) / 180);
const sa = Math.sin((TILT * Math.PI) / 180);
const G = ([u, v]: Pt): Pt => [C[0] + u * ca - v * sa, C[1] + u * sa + v * ca];
const LOCAL = (inner: string) => `<g transform="translate(${C[0]} ${C[1]}) rotate(${TILT})">${inner}</g>`;

export default art({
  name: 'saint-mini-drink',
  w: 900,
  h: 500,
  bg: RED,
  draw: () => {
    const r = rng(131);
    let s = '';
    // ---------------------------------------------------------------- speed lines in the empty red
    for (let i = 0; i < 14; i++) {
      const y = 24 + i * 34 + range(r, -8, 8);
      const x0 = range(r, 640, 720);
      const len = range(r, 140, 240);
      s += P(vb([[x0, y], [x0 + len * 0.5, y + 1], [x0 + len, y]], pointed(range(r, 2.4, 6), 0.8)));
    }
    for (let i = 0; i < 4; i++) {
      const y = 30 + i * 30;
      s += P(vb([[range(r, -10, 20), y], [range(r, 120, 180), y]], pointed(range(r, 2, 4), 0.8)));
    }

    const speed = s;
    s = '';
    // ---------------------------------------------------------------- hair down the back, face + neck
    const hair = profileHair({ seed: 41, len: 1300, sweep: 10 });
    s += `<g transform="${HEAD}">${hair.back}${profileFace({ worry: 0.25, seed: 42, closed: true })}</g>`;

    // ---------------------------------------------------------------- robe: chest and shoulders (profile facing right)
    const robe: Pt[] = [
      [414, 300], // throat / collar front
      [446, 350],
      [462, 420],
      [470, 520],
      [220, 520],
      [232, 420],
      [262, 346],
      [312, 306],
      [360, 296],
    ];
    const rd = smooth(robe, true, 0.35);
    s += P(rd, KHAKI);
    let ri = '';
    ri += P(smooth([[220, 520], [232, 420], [262, 346], [300, 330], [320, 520]], true), KHAKI_DEEP);
    ri += hatch([[210, 320], [330, 320], [340, 520], [210, 520]], 4.4, 86, r, 1.3);
    ri += B([[300, 340], [290, 420], [292, 520]], pointed(4));
    ri += B([[350, 330], [340, 430], [346, 520]], pointed(3.4));
    // collar band crossing to the front
    const colA: Pt[] = [
      [318, 304],
      [372, 300],
      [412, 304],
      [440, 346],
      [456, 420],
    ];
    const colB = offset(colA, 16);
    ri += P(smooth([...colA, ...colB.slice().reverse()], true, 0.3), KHAKI);
    ri += hatch([...colA, ...colB.slice().reverse()], 3.2, 40, r, 1.0);
    ri += B(colA, even(3.2, 0.04)) + B(colB, even(2.6, 0.04));
    s += clipped(rd, ri);
    s += P(vb(robe.slice(0, 4), (t) => 3 + 3 * Math.sin(Math.PI * t)));
    s += P(vb([[220, 520], [232, 420], [262, 346], [312, 306], [360, 296]], (t) => 3 + 3 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- front hair: cap + lock over the ear spilling on the shoulder
    s += `<g transform="${HEAD}">${hair.front}</g>`;

    // ---------------------------------------------------------------- raised arm: forearm up to the glass, wide sleeve fallen back
    const wristU = G([-96, 176]);
    const wristL = G([-70, 196]);
    const forearm: Pt[] = [wristU, wristL, [478, 470], [446, 470]];
    s += P(smooth(forearm, true, 0.3), SKIN);
    s += clipped(smooth(forearm, true, 0.3), hatch([[440, 380], [470, 380], [470, 480], [440, 480]], 3.2, 80, r, 1.1));
    s += P(vb([wristU, [446, 470]], (t) => 2 + 3 * Math.sin(Math.PI * t)));
    s += P(vb([wristL, [478, 470]], (t) => 2 + 2.6 * Math.sin(Math.PI * t)));
    // the sleeve: from the shoulder, gathered at the elbow, opening around the forearm
    const sleeve: Pt[] = [
      [340, 312],
      [392, 320],
      [430, 360],
      [440, 430], // opening, outer side
      [496, 446], // opening, inner side
      [530, 486],
      [540, 520],
      [330, 520],
      [318, 420],
    ];
    const svd = smooth(sleeve, true, 0.32);
    s += P(svd, KHAKI);
    const open: Pt[] = [
      [440, 430],
      [468, 440],
      [496, 446],
    ];
    s += clipped(
      svd,
      P(smooth([[392, 320], [430, 360], [440, 430], [540, 470], [540, 520], [440, 520], [404, 420]], true), KHAKI_DEEP) +
        hatch([[400, 330], [450, 360], [540, 470], [540, 520], [430, 520], [400, 420]], 4.2, 96, r, 1.3) +
        B([[360, 330], [370, 420], [380, 520]], pointed(4)) +
        B([[420, 380], [440, 450], [470, 520]], pointed(3.4)) +
        P(smooth([...offset(open, 10), ...offset(open, 22).reverse()], true, 0.3), INK) +
        P(smooth([...offset(open, 30), ...offset(open, 38).reverse()], true, 0.3), INK),
    );
    // dark inside of the opening
    s += P(smooth([[440, 430], [468, 436], [496, 446], [470, 446]], true, 0.4), INK);
    s += P(vb(sleeve.slice(0, 4), (t) => 2.6 + 3.4 * Math.sin(Math.PI * t)));
    s += P(vb(sleeve.slice(4, 7), (t) => 2.4 + 3 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- martini glass + the hand on its stem (glass frame)
    const RW = 62;
    let g = '';
    // back of the hand, left of the stem; knuckle row close to the stem
    const back: Pt[] = [
      [-16, 92],
      [-46, 100],
      [-84, 140],
      [-100, 180],
      [-70, 200],
      [-16, 156],
    ];
    const bd = smooth(back, true, 0.35);
    g += P(bd, SKIN);
    g += clipped(bd, hatch([[-110, 150], [-10, 140], [-10, 210], [-110, 210]], 3.2, 0, r, 1.1));
    g += B([[-78, 150], [-50, 124], [-24, 104]], pointed(1.6));
    g += B([[-76, 168], [-46, 142], [-22, 122]], pointed(1.4));
    g += P(vb(back.slice(0, 4), (t) => 2 + 3 * Math.sin(Math.PI * t)));
    g += P(vb(back.slice(3), (t) => 2 + 3.4 * Math.sin(Math.PI * t)));
    // stem + bowl + foot
    g += P(vb([[0, 72], [0, 120], [0, 176]], even(6, 0.03)));
    g += P(vb([[1.5, 80], [1.5, 170]], even(1.6, 0.1)), PAPER);
    g += `<ellipse cx="0" cy="180" rx="42" ry="8" fill="${PAPER}" stroke="${INK}" stroke-width="2.8"/>`;
    // fingers curled around the stem (index on top, just under the bowl)
    const fingers: [number, number, number][] = [
      [100, 15, 0],
      [116, 15, 1],
      [131, 14, 2],
      [145, 12, 3],
    ];
    for (const [y, w, i] of fingers) {
      const pts: Pt[] = [
        [-20, y],
        [-2, y - 1],
        [12, y + 2],
        [16, y + 9 - i],
      ];
      g += limb(pts, digit(w, w * 0.82), SKIN, 2.2);
      g += hatch([[-22, y + 2], [20, y + 2], [20, y + w], [-22, y + w]], 2.8, 0, r, 1.0);
      g += B([[-4, y - w * 0.4], [-2, y + w * 0.3]], pointed(1.4)); // PIP crease
      g += `<ellipse cx="${15 - i * 0.4}" cy="${y + 5 - i * 0.3}" rx="3.2" ry="4.6" fill="${PAPER}" stroke="${INK}" stroke-width="1.2"/>`;
    }
    // thumb along the stem, tip pressing just under the bowl
    g += limb([[-50, 126], [-28, 104], [-10, 86]], digit(17, 13), SKIN, 2.4);
    g += hatch([[-52, 132], [-30, 112], [-12, 94], [-6, 100], [-26, 120], [-46, 138]], 3, 40, r, 1.0);
    g += `<ellipse cx="-12" cy="88" rx="4.4" ry="6" transform="rotate(45 -12 88)" fill="${PAPER}" stroke="${INK}" stroke-width="1.3"/>`;
    g += B([[-36, 110], [-30, 116]], pointed(1.6));
    s += LOCAL(g);
    // liquid (level surface, global) inside the bowl
    const rimL = G([-RW, 0]);
    const rimR = G([RW, 0]);
    const apex = G([0, 74]);
    const bowlD = `M${rimL.join(' ')}L${apex.join(' ')}L${rimR.join(' ')}Z`;
    s += P(bowlD, PAPER, 'fill-opacity="0.22"');
    const level = 204;
    s += clipped(bowlD, `<rect x="0" y="${level}" width="900" height="200" fill="${ACCENT}"/>` + hatch([[440, 236], [580, 236], [580, 280], [440, 280]], 4, 60, r, 1.0) + P(vb([[462, level + 10], [500, level + 7], [530, level + 9]], pointed(3.6)), PAPER) + P(vb([[440, level], [500, level - 1], [560, level]], even(2.6, 0.05))));
    s += LOCAL(
      P(vb([[-RW, 0], [-31, 37], [0, 74]], even(2.8, 0.04))) +
        P(vb([[RW, 0], [31, 37], [0, 74]], even(2.8, 0.04))) +
        `<ellipse cx="0" cy="0" rx="${RW}" ry="10" fill="none" stroke="${INK}" stroke-width="2.8"/>` +
        P(vb([[-46, 8], [-30, 26], [-14, 46]], pointed(3.4)), PAPER) +
        P(vb([[40, 10], [28, 26]], pointed(2.4)), PAPER),
    );
    // tight close-up: enlarge about the bottom edge and pull the figure toward the centre
    return speed + `<g transform="translate(70 0) translate(380 520) scale(1.1) translate(-380 -520)">${s}</g>`;
  },
});
