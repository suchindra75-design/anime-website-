import { art, ACCENT, INK, KHAKI, KHAKI_DEEP, PAPER, SKIN, clipped, rng, smooth, type Pt } from '../kit.ts';
import { B, P, digit, even, hatch, limb, pointed, vb } from './_util.ts';
import { faceFront, hairFront } from './_saint.ts';

const C: Pt = [309, 345]; // glass rim centre
const TILT = 25;

/** local glass frame → global */
function G(p: Pt): Pt {
  const a = (TILT * Math.PI) / 180;
  return [C[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), C[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
}

export default art({
  name: 'saint-drink',
  w: 800,
  h: 1000,
  draw: () => {
    const r = rng(61);
    let s = '';
    const HX = 400;
    const HY = 278;
    const HS = 0.92;
    const hair = hairFront({ len: 690, drape: 60, seed: 8, backLen: 600, backW: 170 });
    s += `<g transform="translate(${HX} ${HY}) scale(${HS})">${hair.back}${faceFront({ closed: true, seed: 9 })}</g>`;

    // ---------------------------------------------------------------- torso / robe
    const robe: Pt[] = [
      [352, 488],
      [400, 500],
      [448, 488],
      [520, 506],
      [610, 540],
      [672, 590],
      [700, 680],
      [716, 820],
      [724, 1010],
      [76, 1010],
      [84, 820],
      [100, 680],
      [128, 590],
      [190, 540],
      [280, 506],
    ];
    const rd = smooth(robe, true, 0.35);
    s += P(rd, KHAKI);
    let inner = '';
    inner += P(smooth([[600, 540], [690, 600], [730, 1010], [640, 1010], [620, 800]], true), KHAKI_DEEP);
    inner += hatch([[580, 540], [700, 600], [740, 1010], [620, 1010], [600, 800]], 5, 94, r, 1.3);
    // cast shadow of the chin/hair on the chest
    inner += hatch([[330, 492], [470, 492], [460, 540], [400, 560], [340, 540]], 4, 10, r, 1.2);
    // collar (crossed)
    inner += P(smooth([[352, 486], [400, 560], [448, 486], [440, 486], [400, 540], [360, 486]], true), SKIN);
    inner += P(smooth([[448, 486], [468, 490], [420, 590], [370, 700], [350, 696], [400, 580]], true), KHAKI);
    inner += B([[448, 486], [400, 590], [350, 698]], even(4));
    inner += B([[468, 490], [420, 594], [372, 700]], even(3));
    inner += B([[352, 486], [376, 528], [398, 562]], even(3.4));
    inner += hatch([[326, 720], [384, 600], [440, 500], [436, 530], [392, 620], [340, 740]], 3.4, 60, r, 1.2);
    // folds
    inner += B([[520, 560], [560, 700], [590, 860], [600, 1010]], pointed(4.5));
    inner += B([[480, 620], [500, 760], [508, 900], [500, 1010]], pointed(3.6));
    inner += B([[620, 620], [650, 760], [668, 1010]], pointed(3.4));
    inner += B([[420, 760], [430, 880], [420, 1010]], pointed(3));
    inner += B([[300, 700], [290, 860], [280, 1010]], pointed(3));
    s += clipped(rd, inner);
    s += B([[448, 488], [520, 506], [610, 540], [672, 590], [700, 680], [716, 820], [724, 1008]], (t) => 3 + 5 * Math.sin(Math.PI * t));
    s += B([[352, 488], [280, 506], [190, 540], [128, 590], [100, 680], [84, 820], [76, 1008]], (t) => 3 + 4 * Math.sin(Math.PI * t));
    // left arm sleeve (viewer's right) hanging, trim bands near the bottom
    const sl: Pt[] = [
      [640, 560],
      [690, 600],
      [730, 720],
      [760, 860],
      [780, 1010],
      [600, 1010],
      [620, 860],
      [630, 720],
    ];
    const sld = smooth(sl, true, 0.35);
    s += P(sld, KHAKI);
    s += clipped(
      sld,
      P(smooth([[690, 600], [740, 720], [790, 1010], [700, 1010], [680, 760]], true), KHAKI_DEEP) +
        hatch([[680, 600], [740, 720], [800, 1010], [690, 1010], [670, 760]], 4.6, 96, r, 1.3) +
        B([[660, 620], [668, 780], [680, 1010]], pointed(4)) +
        B([[630, 760], [630, 1010]], pointed(3)) +
        P(smooth([[590, 940], [800, 960], [800, 978], [590, 958]], true), INK) +
        P(smooth([[590, 980], [800, 1000], [800, 1012], [590, 994]], true), INK),
    );
    s += B([[640, 560], [690, 600], [730, 720], [760, 860], [780, 1008]], (t) => 3 + 5 * Math.sin(Math.PI * t));
    s += B([[630, 720], [620, 860], [600, 1008]], (t) => 2 + 3 * Math.sin(Math.PI * t));

    // ---------------------------------------------------------------- front hair
    s += `<g transform="translate(${HX} ${HY}) scale(${HS})">${hair.front}</g>`;

    // ---------------------------------------------------------------- raised right arm (viewer's left)
    // shoulder → upper arm out to a visible elbow → forearm rising to the glass; the wide
    // sleeve has slid down the raised forearm and bunches at the elbow, hanging below it
    const wristT = G([-146, 158]);
    const wristB = G([-150, 228]);
    const faPts: Pt[] = [wristT, [114, 520], [104, 606], [48, 604], [56, 540], wristB];
    const faD = smooth(faPts, true, 0.3);
    s += P(faD, SKIN);
    s += clipped(faD, hatch([[40, 470], [80, 470], [80, 620], [40, 620]], 3.6, 96, r, 1.3) + hatch([[40, 560], [120, 560], [120, 620], [40, 620]], 3.4, 4, r, 1.1));
    s += B([wristB, [56, 540], [48, 604]], (t) => 2.6 + 4 * Math.sin(Math.PI * t));
    s += B([wristT, [114, 520], [104, 606]], (t) => 2 + 3 * Math.sin(Math.PI * t));
    s += B([[86, 470], [92, 520], [90, 570]], pointed(2)); // forearm muscle line
    // sleeve: from the shoulder seam, along the upper arm, around the elbow and hanging
    const opening: Pt[] = [
      [114, 606],
      [80, 600],
      [42, 594],
    ];
    const sleeve: Pt[] = [
      [206, 540], // shoulder seam
      [168, 566],
      [126, 610], // inner elbow, under the opening
      ...opening,
      [24, 640],
      [10, 704], // the elbow point
      [-2, 790],
      [-6, 1010],
      [196, 1010],
      [194, 880],
      [184, 760],
      [200, 660], // armpit
      [222, 590],
    ];
    const svd = smooth(sleeve, true, 0.3);
    s += P(svd, KHAKI);
    s += clipped(
      svd,
      // shadowed underside of the raised arm and the hanging drape
      P(smooth([[10, 704], [-2, 790], [-6, 1010], [70, 1010], [60, 820], [40, 720]], true), KHAKI_DEEP) +
        hatch([[-10, 700], [70, 700], [80, 1010], [-10, 1010]], 4.4, 94, r, 1.3) +
        hatch([[120, 640], [210, 600], [210, 1010], [150, 1010]], 5, 98, r, 1.1) +
        hatch([[20, 620], [130, 620], [110, 700], [20, 720]], 4, 24, r, 1.1) +
        // folds radiating from the elbow point and the inner elbow
        B([[16, 712], [36, 820], [50, 1010]], pointed(4.6)) +
        B([[30, 690], [80, 800], [104, 1010]], pointed(3.8)) +
        B([[120, 630], [130, 760], [150, 1010]], pointed(3.6)) +
        B([[180, 580], [150, 640], [126, 700]], pointed(3)) +
        B([[60, 660], [110, 700], [160, 780]], pointed(2.6)) +
        // trim bands following the opening
        P(smooth([...opening.map(([x, y]) => [x, y + 12] as Pt), ...opening.slice().reverse().map(([x, y]) => [x - 2, y + 26] as Pt)], true, 0.3), INK) +
        P(smooth([...opening.map(([x, y]) => [x - 2, y + 34] as Pt), ...opening.slice().reverse().map(([x, y]) => [x - 4, y + 44] as Pt)], true, 0.3), INK),
    );
    // dark inside of the opening around the forearm
    s += P(smooth([[114, 606], [80, 600], [42, 594], [80, 612]], true, 0.4), INK);
    s += P(vb([[206, 540], [168, 566], [126, 610]], (t) => 2.6 + 3.4 * Math.sin(Math.PI * t)));
    s += P(vb(opening, even(3.6, 0.06)));
    s += P(vb([[42, 594], [24, 640], [10, 704], [-2, 790], [-6, 1008]], (t) => 3 + 5 * Math.sin(Math.PI * Math.min(1, t * 1.3))));
    s += P(vb([[196, 1008], [194, 880], [184, 760], [200, 660]], (t) => 2.4 + 3.4 * Math.sin(Math.PI * t)));

    // ---------------------------------------------------------------- glass + hand, drawn in the tilted glass frame
    const L = (inner: string) => `<g transform="translate(${C[0]} ${C[1]}) rotate(${TILT})">${inner}</g>`;
    const RIM = 92;
    let gl = '';
    // hand: back of the hand (behind the stem)
    const back: Pt[] = [
      [-150, 160],
      [-110, 140],
      [-62, 138],
      [-56, 160],
      [-60, 186],
      [-62, 210],
      [-66, 226],
      [-110, 232],
      [-150, 226],
    ];
    gl += P(smooth(back, true, 0.35), SKIN);
    gl += hatch([[-150, 200], [-62, 196], [-66, 232], [-150, 232]], 3.6, 0, r, 1.2);
    gl += B([[-130, 166], [-90, 160], [-62, 158]], pointed(1.8));
    gl += B([[-130, 188], [-90, 182], [-64, 180]], pointed(1.6));
    // fingers (index on top), wrapping behind the stem; tips curl toward us on the right
    const fingers: [number, number, number][] = [
      [146, 20, 20],
      [168, 21, 22],
      [190, 20, 18],
      [210, 17, 8],
    ];
    for (const [y, w, reach] of fingers) {
      const pts: Pt[] = [[-64, y], [-30, y - 2], [-4, y], [reach - 2, y + 4], [reach + 2, y + 14]];
      gl += limb(pts, digit(w, w * 0.85), SKIN, 2.4);
      // underside shading + knuckle crease + nail
      gl += hatch([[-60, y + 2], [reach - 4, y + 4], [reach - 4, y + w * 0.48], [-60, y + w * 0.5]], 3, 0, r, 1.0);
      gl += B([[-34, y - w * 0.45], [-32, y + w * 0.2]], pointed(1.8));
      gl += B([[-8, y - w * 0.45], [-6, y + w * 0.1]], pointed(1.4));
      gl += P(smooth([[reach - 6, y + 2], [reach + 2, y + 2], [reach + 5, y + 12], [reach - 4, y + 12]], true), PAPER);
      gl += B([[reach - 7, y + 1], [reach + 3, y + 1], [reach + 6, y + 13]], pointed(1.6));
    }
    // knuckle bumps
    gl += B([[-70, 136], [-56, 140], [-54, 156]], pointed(2.6));
    gl += B([[-60, 166], [-56, 176]], pointed(2));
    // glass: bowl
    const bowlD = `M${-RIM} 0L0 118L${RIM} 0Z`;
    gl += P(bowlD, PAPER, 'fill-opacity="0.18"');
    // stem (over the fingers) and foot
    gl += P(vb([[0, 116], [0, 200], [0, 286]], even(8, 0.02)));
    gl += P(vb([[2, 124], [2, 276]], even(2, 0.1)), PAPER);
    gl += `<ellipse cx="0" cy="288" rx="62" ry="12" fill="${PAPER}" stroke="${INK}" stroke-width="3.4"/>`;
    gl += P(vb([[-40, 286], [0, 292], [40, 286]], pointed(2.4)));
    // thumb in front of the stem, tip pressing it just under the bowl
    gl += limb([[-104, 214], [-70, 190], [-36, 164], [-8, 142]], digit(26, 20), SKIN, 2.6);
    gl += hatch([[-100, 218], [-66, 196], [-30, 170], [-12, 152], [-6, 160], [-30, 182], [-66, 210], [-96, 230]], 3.2, 30, r, 1.0);
    gl += P(smooth([[-22, 146], [-10, 138], [-4, 146], [-16, 154]], true), PAPER);
    gl += B([[-24, 148], [-12, 138], [-4, 146]], pointed(1.6));
    gl += B([[-52, 168], [-46, 184]], pointed(1.8));
    s += L(gl);

    // liquid (gravity-level surface) + glass outlines — global frame so the surface stays horizontal
    const rimL = G([-RIM, 0]);
    const rimR = G([RIM, 0]);
    const apex = G([0, 118]);
    const bowlG = `M${rimL.join(' ')}L${apex.join(' ')}L${rimR.join(' ')}Z`;
    const level = 356;
    s += clipped(bowlG, `<rect x="0" y="${level}" width="800" height="400" fill="${ACCENT}"/>` + hatch([[180, level + 30], [420, level + 30], [420, 480], [180, 480]], 5, 60, r, 1.1));
    s += clipped(bowlG, P(vb([[200, level], [320, level - 1], [420, level]], even(3.2)), INK) + P(vb([[226, level + 12], [270, level + 7], [320, level + 9]], pointed(4)), PAPER));
    s += L(
      P(vb([[-RIM, 0], [-46, 59], [0, 118]], even(3.4, 0.04))) +
        P(vb([[RIM, 0], [46, 59], [0, 118]], even(3.4, 0.04))) +
        `<ellipse cx="0" cy="0" rx="${RIM}" ry="15" fill="none" stroke="${INK}" stroke-width="3.2"/>` +
        P(vb([[-72, 8], [-50, 36], [-24, 70]], pointed(4)), PAPER) +
        P(vb([[56, 12], [40, 34]], pointed(2.6)), PAPER),
    );
    void PAPER;
    return s;
  },
});
