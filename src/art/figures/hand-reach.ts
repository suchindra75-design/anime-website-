import { art, INK, PAPER, SKIN, rng, smooth, type Pt } from '../kit.ts';
import { P, engrave, even, lerp, pointed, sample, sstep, vb } from './_util.ts';

type V3 = [number, number, number];

// camera: elevation e, scale s, origin at the wrist
const E = (46 * Math.PI) / 180;
const SC = 33;
const OX = 800;
const OY = 352;
const ROLL = (-4 * Math.PI) / 180; // whole hand tilted slightly (fingers up a touch)

function proj(p: V3): Pt {
  const [x, y, z] = p;
  const X = OX + SC * x;
  const Y = OY + SC * (-y * Math.cos(E) + z * Math.sin(E));
  // roll in image plane around wrist
  const dx = X - OX;
  const dy = Y - OY;
  return [OX + dx * Math.cos(ROLL) - dy * Math.sin(ROLL), OY + dx * Math.sin(ROLL) + dy * Math.cos(ROLL)];
}

const deg = (d: number) => (d * Math.PI) / 180;

interface Finger {
  base: V3; // MCP joint centre
  lens: [number, number, number];
  widths: [number, number, number, number]; // at MCP, PIP, DIP, tip (cm)
  yaw: number; // fan angle (deg, + toward viewer)
  pitch: [number, number, number]; // cumulative downward bend per segment (deg)
}

function joints(f: Finger): V3[] {
  const out: V3[] = [f.base];
  let p = f.base;
  for (let i = 0; i < 3; i++) {
    const pitch = deg(f.pitch[i]);
    const yaw = deg(f.yaw);
    const h = f.lens[i] * Math.cos(pitch);
    const np: V3 = [p[0] - h * Math.cos(yaw), p[1] - f.lens[i] * Math.sin(pitch), p[2] + h * Math.sin(yaw)];
    out.push(np);
    p = np;
  }
  return out;
}

/** Unit vectors in 2D */
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const norm = (v: Pt): Pt => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const addS = (p: Pt, v: Pt, s: number): Pt => [p[0] + v[0] * s, p[1] + v[1] * s];

/**
 * Builds a finger in 2D from projected joints. Returns markup:
 * skin fill, engraving shading on the underside, contours, knuckle creases, nail.
 */
function finger(J: Pt[], Wcm: number[], r: () => number, o: { nail?: boolean; shadeK?: number; topBase?: boolean; base?: boolean } = {}): string {
  const W = Wcm.map((w) => (w * SC) / 2); // half widths in px
  const dirs: Pt[] = [];
  for (let i = 0; i < 3; i++) dirs.push(norm(sub(J[i + 1], J[i])));
  const jd = (i: number): Pt => (i === 0 ? dirs[0] : i === 3 ? dirs[2] : norm([dirs[i - 1][0] + dirs[i][0], dirs[i - 1][1] + dirs[i][1]]));
  const up = (d: Pt): Pt => [-d[1] * Math.sign(-d[0] || -1), d[0] * Math.sign(-d[0] || -1)];
  // n points to the dorsal (upper) side for fingers pointing left
  const nU = (i: number): Pt => {
    const d = jd(i);
    return [-d[1], d[0]];
  };
  void up;
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  // segment sample points: at joint i and mid of segment i
  for (let i = 0; i <= 3; i++) {
    const n = nU(i);
    const bump = i === 1 ? 0.17 : i === 2 ? 0.1 : 0;
    if (i < 3) {
      upper.push(addS(J[i], n, W[i] * (1 + bump)));
      lower.push(addS(J[i], n, -W[i] * (1 - bump * 0.6)));
      const m = lerp(J[i], J[i + 1], 0.5);
      const nm = norm([n[0] + nU(i + 1)[0], n[1] + nU(i + 1)[1]]);
      const wm = (W[i] + W[i + 1]) / 2;
      upper.push(addS(m, nm, wm * 0.97));
      lower.push(addS(m, nm, -wm * (i === 2 ? 1.08 : 1.04))); // fleshy pads
    }
  }
  // fingertip: round cap around J[3]
  const d3 = dirs[2];
  const n3 = nU(3);
  const tipC = addS(J[3], d3, -W[3] * 0.85);
  const cap: Pt[] = [];
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI / 2 - (Math.PI * k) / 6;
    const v: Pt = [n3[0] * Math.sin(a) + d3[0] * Math.cos(a), n3[1] * Math.sin(a) + d3[1] * Math.cos(a)];
    cap.push(addS(tipC, v, W[3] * (k > 3 ? 1.05 : 1)));
  }
  // the base runs back under the knuckle into the back of the hand, so no seam shows
  const ext = o.base === false ? [] : [addS(addS(J[0], dirs[0], -W[0] * 1.5), nU(0), W[0] * 0.7), addS(J[0], dirs[0], -W[0] * 1.9), addS(addS(J[0], dirs[0], -W[0] * 1.5), nU(0), -W[0] * 0.7)];
  const outline = [...upper, ...cap, ...lower.slice().reverse(), ...ext.slice().reverse()];
  const od = smooth(outline, true, 0.45);
  let s = P(od, SKIN);
  // engraving on the underside: widths swell toward the lower contour
  const axis = sample(J, 8);
  const axisY = (x: number) => {
    // nearest axis point by x
    let best = axis[0];
    let bd = Infinity;
    for (const p of axis) {
      const dd = Math.abs(p[0] - x);
      if (dd < bd) {
        bd = dd;
        best = p;
      }
    }
    return best[1];
  };
  const k = o.shadeK ?? 1;
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const box: [number, number, number, number] = [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) - Math.min(...xs) + 8, Math.max(...ys) - Math.min(...ys) + 8];
  const wavg = (W[0] + W[3]) / 2;
  const baseX = J[0][0];
  s += engrave(od, box, 5.2, 0, (x, y) => k * 3.4 * sstep(axisY(x) - wavg * 0.15, axisY(x) + wavg * 0.95, y) * (1 - sstep(baseX - W[0] * 2.2, baseX - W[0] * 0.3, x)), r, INK, 0.6);
  // contours: lower edge heavier
  const lowerFull = [...cap.slice(3), ...lower.slice(1).reverse()];
  s += P(vb(lowerFull, (t) => 2 + 4.2 * Math.sin(Math.PI * Math.min(1, t * 1.1))));
  s += P(vb([...(o.topBase ? upper : upper.slice(1)), ...cap.slice(0, 4)], (t) => 0.8 + 2.6 * Math.sin(Math.PI * t)));
  // PIP knuckle wrinkles (dorsal)
  {
    const n = nU(1);
    const d = jd(1);
    const c = addS(J[1], n, W[1] * 0.55);
    for (let i = -1; i <= 1; i++) {
      const cc = addS(c, d, i * W[1] * 0.28);
      const a = addS(cc, n, W[1] * 0.32);
      const b = addS(cc, n, -W[1] * 0.18);
      s += P(vb([a, addS(lerp(a, b, 0.5), d, -3), b], pointed(1.9 - Math.abs(i) * 0.4)));
    }
  }
  // DIP crease
  {
    const n = nU(2);
    const d = jd(2);
    const c = addS(J[2], n, W[2] * 0.45);
    const a = addS(c, n, W[2] * 0.35);
    const b = addS(c, n, -W[2] * 0.2);
    s += P(vb([a, addS(lerp(a, b, 0.5), d, -1.5), b], pointed(1.3)));
  }
  // palmar creases at joints (short ticks from the lower contour)
  for (const i of [1, 2]) {
    const n = nU(i);
    const a = addS(J[i], n, -W[i] * 0.92);
    const b = addS(J[i], n, -W[i] * 0.45);
    s += P(vb([a, b], pointed(2)));
  }
  // nail
  if (o.nail !== false) {
    const d = dirs[2];
    const n = nU(3);
    const L = Math.hypot(J[3][0] - J[2][0], J[3][1] - J[2][1]);
    const nb = addS(addS(J[2], d, L * 0.38), n, W[3] * 0.42);
    const nt = addS(addS(J[3], d, -W[3] * 0.32), n, W[3] * 0.52);
    const nw = W[3] * 0.5;
    const nailPts: Pt[] = [addS(nb, n, nw * 0.55), addS(lerp(nb, nt, 0.6), n, nw * 0.62), addS(nt, n, nw * 0.25), addS(nt, d, 2), addS(nt, n, -nw * 0.5), addS(lerp(nb, nt, 0.6), n, -nw * 0.62), addS(nb, n, -nw * 0.5)];
    s += P(smooth(nailPts, true), PAPER);
    s += P(vb([...nailPts.slice(0, 4)], (t) => 0.8 + 1.4 * Math.sin(Math.PI * t)));
    s += P(vb([addS(nt, d, 2), ...nailPts.slice(4)], (t) => 1 + 1.6 * Math.sin(Math.PI * t)));
    // cuticle
    s += P(vb([addS(nb, n, nw * 0.6), addS(nb, d, -2), addS(nb, n, -nw * 0.55)], pointed(1.8)));
    // nail highlight hatch
    s += P(vb([addS(lerp(nb, nt, 0.25), n, -nw * 0.1), addS(lerp(nb, nt, 0.75), n, -nw * 0.05)], pointed(1.1)));
  }
  return s;
}

export default art({
  name: 'hand-reach',
  w: 1100,
  h: 800,
  draw: () => {
    const r = rng(23);
    let s = '';

    const fingers: { f: Finger; nail: boolean; k: number }[] = [
      // pinky (farthest)
      { f: { base: [-7.7, -0.1, -2.9], lens: [3.6, 2.1, 1.9], widths: [1.5, 1.3, 1.12, 0.98], yaw: -21, pitch: [6, 24, 42] }, nail: true, k: 1.25 },
      // ring
      { f: { base: [-8.7, 0.25, -0.9], lens: [4.5, 2.8, 2.05], widths: [1.7, 1.48, 1.28, 1.1], yaw: -9, pitch: [4, 20, 38] }, nail: true, k: 1.15 },
      // middle
      { f: { base: [-9.2, 0.4, 1.2], lens: [4.9, 3.0, 2.15], widths: [1.82, 1.58, 1.36, 1.18], yaw: 2, pitch: [1, 14, 30] }, nail: true, k: 1.05 },
      // index (nearest, most extended)
      { f: { base: [-8.8, 0.2, 3.3], lens: [4.4, 2.6, 2.05], widths: [1.8, 1.55, 1.33, 1.15], yaw: 12, pitch: [-4, 6, 18] }, nail: true, k: 1 },
    ];

    // ------------------------------------------------------------ sleeve + inside of the cuff (behind the wrist)
    const C: Pt = [842, 352];
    const RX = 34;
    const RY = 112;
    const BW = 64; // cuff band width
    const ell = (t: number, dx = 0): Pt => {
      const x = Math.cos(t) * RX;
      const y = Math.sin(t) * RY;
      const a = (-7 * Math.PI) / 180;
      return [C[0] + dx + x * Math.cos(a) - y * Math.sin(a), C[1] + x * Math.sin(a) + y * Math.cos(a)];
    };
    const arc = (dx: number, n = 14): Pt[] => {
      const out: Pt[] = [];
      for (let i = 0; i <= n; i++) out.push(ell(-Math.PI / 2 - (Math.PI * i) / n, dx));
      return out; // top → left → bottom
    };
    s += P(smooth([...arc(BW, 16), [930, 470], [1010, 516], [1110, 556], [1110, 196], [1010, 214], [930, 236]], true, 0.3), INK);
    s += P(smooth(arc(0, 24).concat(arc(BW, 24).reverse()), true, 0.3), INK);
    s += `<ellipse cx="${C[0]}" cy="${C[1]}" rx="${RX}" ry="${RY}" transform="rotate(-7 ${C[0]} ${C[1]})" fill="${INK}"/>`;

    // ------------------------------------------------------------ thumb
    const thumb: Finger = { base: [-2.3, -0.6, 3.5], lens: [3.6, 2.7, 2.3], widths: [2.5, 1.85, 1.6, 1.35], yaw: 20, pitch: [16, 22, 32] };
    const TJ = joints(thumb);
    // bend the thumb tip toward -x a little
    TJ[3] = [TJ[3][0] - 0.4, TJ[3][1] + 0.1, TJ[3][2] - 0.6];
    s += finger(TJ.map(proj), thumb.widths, r, { nail: true, shadeK: 1.3 });
    // thenar fold where the thumb meets the palm
    const th0 = proj([-1.2, -0.8, 3.4]);
    const th1 = proj([-3.0, -0.9, 4.4]);
    const th2 = proj([-4.6, -1.1, 4.9]);
    s += P(vb([th0, th1, th2], pointed(3)));

    // ------------------------------------------------------------ back of hand
    const dorsal: V3[] = [
      [1.4, 0.95, -2.1], // wrist far
      [-1.2, 1.12, -2.5],
      [-3.4, 0.98, -2.95],
      [-5.4, 0.9, -3.45],
      [-7.9, 0.45, -3.75], // pinky MCP far side
      [-8.25, 0.95, -2.85], // pinky knuckle
      [-9.7, 0.55, -2.0], // web
      [-9.15, 1.3, -0.9], // ring knuckle
      [-10.5, 0.8, 0.15], // web
      [-9.75, 1.45, 1.2], // middle knuckle
      [-10.4, 0.8, 2.3], // web
      [-9.35, 1.05, 3.3], // index knuckle
      [-8.9, 0.2, 4.35], // index near side
      [-6.6, -0.6, 4.7], // thumb web
      [-3.6, -1.85, 4.55], // thenar
      [-1.0, -1.6, 3.5],
      [1.4, -1.1, 2.4], // wrist near
    ];
    const D = dorsal.map(proj);
    const dd = smooth(D, true, 0.4);
    s += P(dd, SKIN);
    // dorsal shading: far edge, knuckle valleys, near (thumb-side) underside
    const box: [number, number, number, number] = [480, 260, 340, 260];
    const farLine = proj([-4, 1.1, -3.4]);
    const nearLine = proj([-4, -0.4, 4.3]);
    s += engrave(
      dd,
      box,
      5.4,
      -4,
      (x, y) => {
        const toFar = 1 - sstep(farLine[1] - 10, farLine[1] + 16, y);
        const toNear = sstep(nearLine[1] - 50, nearLine[1] + 6, y);
        const nearWrist = sstep(700, 800, x) * 0.6;
        return 3.2 * Math.max(toFar * 0.9, toNear, nearWrist * toNear);
      },
      r,
    );
    // extensor tendons fanning from the wrist to the knuckles (light engraving lines)
    const tendonEnds: V3[] = [
      [-8.3, 0.95, -2.7],
      [-9.0, 1.3, -0.85],
      [-9.45, 1.45, 1.2],
      [-9.15, 1.15, 3.1],
    ];
    tendonEnds.forEach((te, i) => {
      const a = proj([-1.5, 1.25, -1.2 + i * 1.0]);
      const m = proj([(-1.5 + te[0]) / 2, 1.35, (te[2] + (-1.2 + i * 1.0)) / 2]);
      const b = proj([te[0] + 1.1, te[1], te[2]]);
      s += P(vb([a, m, b], pointed(1.6 + (i === 2 ? 0.4 : 0))));
    });
    // contour of the back of the hand
    s += P(vb(D.slice(0, 5), (t) => 1.5 + 3 * Math.sin(Math.PI * t)));
    s += P(vb(D.slice(D.length - 5), (t) => 2.5 + 5 * Math.sin(Math.PI * t)));
    // ------------------------------------------------------------ fingers
    const projected = fingers.map(({ f }) => joints(f).map(proj));
    fingers.forEach(({ f, nail, k }, i) => {
      s += finger(projected[i], f.widths, r, { nail, shadeK: k, topBase: i === 0 });
    });

    // knuckle bumps (MCP) — little arcs on the dorsal surface
    const knuck: V3[] = [
      [-8.05, 0.95, -2.85],
      [-8.85, 1.3, -0.9],
      [-9.4, 1.45, 1.2],
      [-9.05, 1.1, 3.3],
    ];
    knuck.forEach((kp) => {
      const c = proj(kp);
      s += P(vb([[c[0] + 4, c[1] - 12], [c[0] - 2, c[1] - 2], [c[0] + 3, c[1] + 10]], pointed(1.8)));
    });
    // ------------------------------------------------------------ cuff (front band over the wrist)
    const front = arc(0, 24);
    const back = arc(BW, 24);
    s += P(smooth([...front, ...back.slice().reverse()], true, 0.3), INK);
    // PAPER circles in two staggered rows + dots
    for (const [off, phase, rad] of [[17, 0, 5.4], [41, 1, 5.4]] as const) {
      const row = arc(off, 18);
      row.forEach((p, i) => {
        if (i % 2 === phase && i > 0 && i < 18) s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${rad}" fill="none" stroke="${PAPER}" stroke-width="2.2"/>`;
      });
    }
    arc(29, 18).forEach((p, i) => {
      if (i > 0 && i < 18) s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.9" fill="${PAPER}"/>`;
    });
    // rim lines: opening edge and seam
    s += P(vb(arc(-1, 24), even(2.6, 0.06)), PAPER);
    s += P(vb(arc(BW + 2, 24).slice(3, 22), pointed(1.8)), PAPER);
    s += P(vb(arc(6, 24).slice(4, 21), pointed(1)), PAPER);
    // sleeve folds (thin paper lines) and top rim light
    s += P(vb([[930, 268], [1010, 262], [1110, 252]], pointed(2.2)), PAPER);
    s += P(vb([[920, 420], [1000, 448], [1110, 470]], pointed(2)), PAPER);
    s += P(vb([[946, 344], [1030, 356], [1110, 360]], pointed(1.4)), PAPER);
    s += P(vb([[930, 246], [1010, 226], [1110, 210]], pointed(2.6)), PAPER);
    return s;
  },
});
