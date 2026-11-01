import { art, INK, PAPER, RED, rng, range, smooth, brush, clipped, type Pt, type Rng } from '../kit.ts';
import { fillP, strokeP, polyD, rectD, ellipseD, n, lerp } from './_util.ts';

const W = 1600;
const H = 1000;
const CX = 800;
const CY = 330;
const R_OUT = 330;
const R_IN = 285;
const FLOOR_Y = 820;
const VP: Pt = [800, 360];

/** Vertical hatch inside a box (cheap straight lines). */
function vHatch(x0: number, x1: number, y0: number, y1: number, sp: number, r: Rng): string {
  let d = '';
  for (let x = x0; x <= x1; x += sp * range(r, 0.85, 1.15)) d += `M${n(x)} ${n(y0)}V${n(y1)}`;
  return d;
}

/** Profile (t from bottom 0 to top 1, half-width factor) -> closed outline. */
function lathe(cx: number, yBot: number, yTop: number, halfW: number, prof: [number, number][]): string {
  const right: Pt[] = prof.map(([t, w]) => [cx + w * halfW, lerp(yBot, yTop, t)]);
  const left: Pt[] = prof.map(([t, w]): Pt => [cx - w * halfW, lerp(yBot, yTop, t)]).reverse();
  return smooth([...right, ...left], true, 0.25);
}

const BALUSTER: [number, number][] = [
  [0, 1],
  [0.09, 1],
  [0.11, 0.78],
  [0.17, 0.6],
  [0.36, 0.92],
  [0.52, 0.62],
  [0.7, 0.32],
  [0.78, 0.36],
  [0.84, 0.6],
  [0.89, 1],
  [1, 1],
];

/** Shading for a turned/round element lit from the left, with a reflected-light rim on the dark side. */
function roundShade(shape: string, cx: number, yTop: number, yBot: number, halfW: number, r: Rng): string {
  const x0 = cx + halfW * 0.12;
  const x1 = cx + halfW * 0.46;
  let d = '';
  for (let x = x0; x <= x1; x += lerp(4.6, 2.2, (x - x0) / (x1 - x0))) d += `M${n(x + range(r, -0.3, 0.3))} ${n(yTop)}V${n(yBot)}`;
  const core = polyD([[cx + halfW * 0.44, yTop], [cx + halfW * 0.74, yTop], [cx + halfW * 0.74, yBot], [cx + halfW * 0.44, yBot]]);
  let rim = '';
  for (let x = cx + halfW * 0.8; x <= cx + halfW * 1.3; x += 3.2) rim += `M${n(x)} ${n(yTop)}V${n(yBot)}`;
  return clipped(shape, strokeP(d, INK, 1.2) + fillP(core, INK) + strokeP(rim, INK, 0.6));
}

function colonnade(side: -1 | 1, r: Rng): string {
  let o = '';
  const fx0 = side < 0 ? 34 : W - 34 - 404;
  const fw = 404;
  // ---------------- upper frame: colonnade
  const uy0 = 40;
  const uy1 = 452;
  const frame = (x: number, y: number, w: number, h: number) => {
    const outer = rectD(x - 22, y - 22, w + 44, h + 44);
    const inner = rectD(x, y, w, h);
    let f = fillP(outer, PAPER) + strokeP(outer, INK, 3.5) + strokeP(rectD(x - 10, y - 10, w + 20, h + 20), INK, 1.4);
    // dark interior: heavy vertical hatch over near-black
    // deep interior: near-black, heavy vertical hatch lifting slightly towards the floor
    f += fillP(inner, INK);
    f += clipped(inner, strokeP(vHatch(x + 3, x + w, y + h * 0.35, y + h, 5.5, r), PAPER, 0.9, 0.3));
    // reveal: top and inner-side faces of the opening
    const revealTop = polyD([[x, y], [x + w, y], [x + w - 14, y + 14], [x + 14, y + 14]]);
    const sideX = side < 0 ? x + w : x;
    const revealSide = polyD([[sideX, y], [sideX - side * -14, y + 14], [sideX - side * -14, y + h], [sideX, y + h]]);
    f += fillP(revealTop, PAPER) + clipped(revealTop, strokeP(vHatch(x, x + w, y, y + 14, 3, r), INK, 1)) + strokeP(revealTop, INK, 1.6);
    f += fillP(revealSide, PAPER) + strokeP(revealSide, INK, 1.6);
    return f;
  };
  o += frame(fx0, uy0, fw, uy1 - uy0);
  // ledge the columns stand on
  const ledgeY = uy1 - 34;
  o += fillP(rectD(fx0, ledgeY, fw, 34), PAPER) + clipped(rectD(fx0, ledgeY, fw, 34), strokeP(`M${fx0} ${ledgeY + 10}H${fx0 + fw}`, INK, 1.4) + fillP(rectD(fx0, ledgeY + 26, fw, 8), 'url(#hatch-h)')) + strokeP(rectD(fx0, ledgeY, fw, 34), INK, 2.4);
  // entablature band under the frame top
  const archY = uy0 + 14;
  o += fillP(rectD(fx0, archY, fw, 40), PAPER) + clipped(rectD(fx0, archY, fw, 40), fillP(rectD(fx0, archY + 30, fw, 10), 'url(#hatch-h)') + strokeP(`M${fx0} ${archY + 12}H${fx0 + fw}`, INK, 1.2)) + strokeP(rectD(fx0, archY, fw, 40), INK, 2.4);
  const cols = 4;
  for (let i = 0; i < cols; i++) {
    const cx = fx0 + ((i + 0.5) / cols) * fw;
    const top = archY + 40;
    const bot = ledgeY;
    const hw = 20;
    // capital + base blocks, slightly tapered shaft
    const shaft = polyD([[cx - hw, bot - 22], [cx - hw * 0.86, top + 30], [cx + hw * 0.86, top + 30], [cx + hw, bot - 22]]);
    const cap = smooth([[cx - hw * 1.5, top], [cx + hw * 1.5, top], [cx + hw * 1.5, top + 12], [cx + hw * 1.05, top + 22], [cx + hw * 0.9, top + 30], [cx - hw * 0.9, top + 30], [cx - hw * 1.05, top + 22], [cx - hw * 1.5, top + 12]], true, 0.15);
    const base = polyD([[cx - hw * 1.45, bot], [cx - hw * 1.45, bot - 10], [cx - hw * 1.15, bot - 14], [cx - hw * 1.05, bot - 22], [cx + hw * 1.05, bot - 22], [cx + hw * 1.15, bot - 14], [cx + hw * 1.45, bot - 10], [cx + hw * 1.45, bot]]);
    for (const part of [shaft, cap, base]) o += fillP(part, PAPER);
    o += roundShade(shaft, cx, top + 30, bot - 22, hw, r);
    o += roundShade(base, cx, bot - 22, bot, hw * 1.45, r);
    o += roundShade(cap, cx, top, top + 30, hw * 1.5, r);
    // flutes
    let fl = '';
    for (let k = -2; k <= 1; k++) fl += `M${n(cx + k * hw * 0.32)} ${top + 34}V${bot - 26}`;
    o += strokeP(fl, INK, 0.9, 0.8);
    o += strokeP(shaft + cap + base, INK, 1.6);
    // cast shadow of the column on the dark back wall is lost in black; add a pale rim on the lit side
    o += strokeP(`M${n(cx - hw + 3)} ${top + 34}V${bot - 26}`, PAPER, 1.4, 0.6);
  }

  // ---------------- lower frame: balustrade
  const ly0 = 520;
  const ly1 = 790;
  o += frame(fx0, ly0, fw, ly1 - ly0);
  const railTop = ly0 + 40;
  const railBot = ly1 - 30;
  // handrail and plinth
  o += fillP(rectD(fx0, railTop - 26, fw, 26), PAPER) + clipped(rectD(fx0, railTop - 26, fw, 26), fillP(rectD(fx0, railTop - 8, fw, 8), 'url(#hatch-h)')) + strokeP(rectD(fx0, railTop - 26, fw, 26), INK, 2.4);
  o += fillP(rectD(fx0, railBot, fw, 30), PAPER) + clipped(rectD(fx0, railBot, fw, 30), fillP(rectD(fx0, railBot + 22, fw, 8), 'url(#hatch-h)')) + strokeP(rectD(fx0, railBot, fw, 30), INK, 2.4);
  const nb = 7;
  for (let i = 0; i < nb; i++) {
    const cx = fx0 + ((i + 0.5) / nb) * fw;
    const hw = 19;
    const shape = lathe(cx, railBot, railTop, hw, BALUSTER);
    o += fillP(shape, PAPER);
    o += roundShade(shape, cx, railTop, railBot, hw, r);
    o += strokeP(shape, INK, 1.6);
  }
  return o;
}

export default art({
  name: 'arch-window',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(515);
    let out = '';

    // --------------------------------------------------------------- wall
    // ashlar courses, faint, with soft tone gathering at the edges
    let courses = '';
    for (let y = 60; y < FLOOR_Y; y += 64) {
      courses += `M0 ${y}H${W}`;
      const off = ((y / 64) % 2) * 90;
      for (let x = off; x < W; x += 180) courses += `M${n(x)} ${y}V${y + 64}`;
    }
    out += strokeP(courses, INK, 1, 0.3);
    out += fillP(rectD(0, 0, 60, FLOOR_Y), 'url(#tone-fine)', 0.6);
    out += fillP(rectD(W - 60, 0, 60, FLOOR_Y), 'url(#tone-fine)', 0.6);

    // ------------------------------------------------------- colonnades
    out += colonnade(-1, r) + colonnade(1, r);

    // ------------------------------------------------------- round window
    const outer = ellipseD(CX, CY, R_OUT, R_OUT);
    const inner = ellipseD(CX, CY, R_IN, R_IN);
    // the ring stone
    out += fillP(outer, PAPER);
    // voussoir joints
    let joints = '';
    const blocks = 28;
    for (let i = 0; i < blocks; i++) {
      const a = (i / blocks) * Math.PI * 2 + 0.05;
      joints += `M${n(CX + Math.cos(a) * R_IN)} ${n(CY + Math.sin(a) * R_IN)}L${n(CX + Math.cos(a) * R_OUT)} ${n(CY + Math.sin(a) * R_OUT)}`;
    }
    out += strokeP(joints, INK, 1.6);
    // outer moulding line
    out += strokeP(ellipseD(CX, CY, R_OUT - 12, R_OUT - 12), INK, 1.2);
    // shadow cast by the ring onto the wall (light from upper left)
    const shadowRing = `${ellipseD(CX + 10, CY + 12, R_OUT + 4, R_OUT + 4)}${ellipseD(CX, CY, R_OUT, R_OUT)}`;
    out += `<path d="${shadowRing}" fill="url(#hatch-d)" fill-rule="evenodd"/>`;

    // the sky/sun disc
    out += fillP(inner, RED);
    let rings = '';
    for (let k = 0; k < 9; k++) {
      const rr = R_IN - 5 - k * 5 - k * k * 0.5;
      rings += `<path d="${ellipseD(CX, CY, rr, rr)}" fill="none" stroke="${INK}" stroke-width="${n(lerp(1.2, 0.6, k / 8))}" stroke-opacity="${n(lerp(0.45, 0.06, k / 8))}"/>`;
    }
    out += rings;
    // inner reveal: the stone's thickness, hatched, visible along the upper-right inside edge
    const revealPts: Pt[] = [];
    const a0 = -Math.PI * 0.95;
    const a1 = Math.PI * 0.12;
    for (let i = 0; i <= 30; i++) {
      const a = lerp(a0, a1, i / 30);
      revealPts.push([CX + Math.cos(a) * R_IN, CY + Math.sin(a) * R_IN]);
    }
    const depthAt = (i: number) => 22 * Math.pow(Math.sin((i / 30) * Math.PI), 0.9);
    const innerEdge: Pt[] = revealPts.map(([x, y], i) => {
      const d = depthAt(i);
      return [x + (CX - x) * (d / R_IN) - 4 * (d / 22), y + (CY - y) * (d / R_IN) + 6 * (d / 22)];
    });
    const reveal = polyD([...revealPts, ...innerEdge.reverse()]);
    let rh = '';
    for (let i = 0; i < 90; i++) {
      const a = lerp(a0, a1, i / 89);
      rh += `M${n(CX + Math.cos(a) * (R_IN + 2))} ${n(CY + Math.sin(a) * (R_IN + 2))}L${n(CX + Math.cos(a) * (R_IN - 26))} ${n(CY + Math.sin(a) * (R_IN - 26))}`;
    }
    out += fillP(reveal, PAPER) + clipped(reveal, strokeP(rh, INK, 1.3));
    out += strokeP(reveal, INK, 1.2);
    out += strokeP(outer, INK, 5) + strokeP(inner, INK, 4);

    // weathering: a few jagged cracks in the wall and the ring
    let cracks = '';
    const crack = (x: number, y: number, dx: number, dy: number, steps: number, w: number) => {
      const pts: Pt[] = [[x, y]];
      for (let i = 0; i < steps; i++) {
        x += dx + range(r, -8, 8);
        y += dy + range(r, -6, 6);
        pts.push([x, y]);
      }
      cracks += brush(pts, w, 0.5);
    };
    crack(470, 640, 14, 22, 6, 3);
    crack(1110, 120, 16, 14, 5, 2.6);
    crack(1150, 620, 10, 20, 4, 2.4);
    crack(560, 70, -12, 18, 4, 2.2);
    crack(640, 690, -8, 14, 4, 2);
    out += fillP(cracks, INK);

    // ------------------------------------------------------------ dado
    out += fillP(rectD(0, FLOOR_Y - 50, W, 50), PAPER);
    out += strokeP(`M0 ${FLOOR_Y - 50}H${W}M0 ${FLOOR_Y - 42}H${W}`, INK, 1.6);
    out += fillP(rectD(0, FLOOR_Y - 12, W, 12), 'url(#hatch-h)');

    // ------------------------------------------------------------- floor
    const floor = rectD(0, FLOOR_Y, W, H - FLOOR_Y);
    out += fillP(floor, PAPER);
    let fl = '';
    for (let i = -16; i <= 16; i++) {
      const xb = VP[0] + i * 90;
      const t = (H + 10 - VP[1]) / (FLOOR_Y - VP[1]);
      fl += `M${n(xb)} ${FLOOR_Y}L${n(VP[0] + (xb - VP[0]) * t)} ${H + 10}`;
    }
    let rows = '';
    let hh = '';
    let prev = FLOOR_Y;
    for (let z = 1 / 1.0; ; ) {
      z *= 0.84;
      const s = 1 / z;
      const y = VP[1] + (FLOOR_Y - VP[1]) * s;
      if (y > H + 10) break;
      rows += `M0 ${n(y)}H${W}`;
      const cnt = Math.max(1, Math.round((y - prev) / 6));
      for (let j = 1; j < cnt; j++) if (r() < 0.55) hh += `M0 ${n(prev + ((y - prev) * j) / cnt)}H${W}`;
      prev = y;
    }
    out += clipped(floor, strokeP(hh, INK, 0.8, 0.7) + strokeP(fl, INK, 1.4) + strokeP(rows, INK, 1.8));
    out += strokeP(`M0 ${FLOOR_Y}H${W}`, INK, 3.5);
    return out;
  },
});
