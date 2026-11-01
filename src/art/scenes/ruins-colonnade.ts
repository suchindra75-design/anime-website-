import { art, INK, PAPER, rng, range, brush, smooth, clipped, type Pt, type Rng } from '../kit.ts';
import { fillP, strokeP, polyD, rectD, n, lerp } from './_util.ts';

const W = 1600;
const H = 900;
const ENT_BOT = 170; // underside of the entablature = top of the capitals
const PLAT_TOP = 714;
const PLAT_FACE = 734;
const PLAT_UNDER = 852;

function jag(r: Rng, a: Pt, b: Pt, steps: number, amp: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const len = Math.hypot(nx, ny) || 1;
    const o = i === 0 || i === steps ? 0 : range(r, -amp, amp);
    out.push([lerp(a[0], b[0], t) + (nx / len) * o, lerp(a[1], b[1], t) + (ny / len) * o]);
  }
  return out;
}

/** Shading for an upright cylinder lit from the left. */
function cylShade(cx: number, R: number, y0: number, y1: number, r: Rng): string {
  let d = '';
  for (let x = cx + R * 0.08; x < cx + R * 0.55; x += lerp(5, 2.3, (x - cx) / (R * 0.55))) d += `M${n(x + range(r, -0.3, 0.3))} ${n(y0)}V${n(y1)}`;
  let rim = '';
  for (let x = cx + R * 0.84; x < cx + R * 1.05; x += 3.2) rim += `M${n(x)} ${n(y0)}V${n(y1)}`;
  return strokeP(d, INK, 1.2) + fillP(rectD(cx + R * 0.55, y0, R * 0.26, y1 - y0), INK) + strokeP(rim, INK, 0.8);
}

function column(r: Rng, cx: number, R: number): string {
  const baseTop = PLAT_TOP - 34;
  const capBot = ENT_BOT + 44;
  const shaft = polyD([[cx - R, baseTop], [cx - R * 0.86, capBot], [cx + R * 0.86, capBot], [cx + R, baseTop]]);
  const torus = smooth([[cx - R * 1.22, PLAT_TOP - 12], [cx - R * 1.26, PLAT_TOP - 24], [cx - R * 1.06, baseTop], [cx + R * 1.06, baseTop], [cx + R * 1.26, PLAT_TOP - 24], [cx + R * 1.22, PLAT_TOP - 12]], true, 0.3);
  const plinth = rectD(cx - R * 1.32, PLAT_TOP - 12, R * 2.64, 14);
  const ech = smooth([[cx - R * 0.86, capBot], [cx - R * 1.16, capBot - 12], [cx - R * 1.3, capBot - 24], [cx + R * 1.3, capBot - 24], [cx + R * 1.16, capBot - 12], [cx + R * 0.86, capBot]], true, 0.3);
  const abacus = rectD(cx - R * 1.38, ENT_BOT, R * 2.76, capBot - 24 - ENT_BOT);
  let o = '';
  for (const p of [plinth, torus, shaft, ech, abacus]) o += fillP(p, PAPER);
  let flutes = '';
  for (let k = -4; k <= 4; k++) {
    const th = (k / 4.6) * (Math.PI / 2);
    const x = cx + Math.sin(th) * R * 0.92;
    flutes += `M${n(x)} ${n(capBot + 6)}L${n(x + (x - cx) * 0.08)} ${n(baseTop - 4)}`;
  }
  o += clipped(shaft, strokeP(flutes, INK, 1.3) + cylShade(cx, R, capBot - 2, baseTop + 2, r));
  o += clipped(torus, cylShade(cx, R * 1.25, baseTop, PLAT_TOP - 10, r));
  o += clipped(ech, cylShade(cx, R * 1.3, capBot - 26, capBot, r));
  o += clipped(abacus, fillP(rectD(cx + R * 0.7, ENT_BOT, R, 40), 'url(#hatch-v)'));
  o += clipped(plinth, fillP(rectD(cx + R * 0.5, PLAT_TOP - 14, R, 16), INK));
  // chips and a crack
  const cy = range(r, capBot + 60, baseTop - 120);
  const crack: Pt[] = [[cx - R * 0.9, cy]];
  for (let i = 0; i < 5; i++) crack.push([crack[i][0] + R * 0.38, crack[i][1] + range(r, -14, 14)]);
  o += clipped(shaft, fillP(brush(crack, 3, 0.5), INK));
  o += strokeP(shaft + torus + plinth + ech + abacus, INK, 3);
  // a bite out of one edge of the shaft
  if (r() < 0.6) {
    const by = range(r, capBot + 40, baseTop - 80);
    const side = r() < 0.5 ? -1 : 1;
    const ex = cx + side * R * 0.96;
    const bite = polyD([[ex, by], [ex - side * R * 0.32, by + 14], [ex - side * R * 0.2, by + 38], [ex, by + 52]]);
    o += fillP(bite, PAPER) + clipped(bite, fillP(rectD(cx - R * 1.2, by, R * 2.4, 60), 'url(#hatch-x)')) + strokeP(bite, INK, 2);
  }
  return o;
}

/** One broken half of the entablature, x0..x1, ragged at the broken end. */
function entablature(r: Rng, x0: number, x1: number, brokenAt: 'left' | 'right'): string {
  const t1 = 52; // cornice
  const t2 = 112; // frieze bottom
  // ragged outline: top edge crumbles, broken end is a jagged diagonal
  const topEdge: Pt[] = [];
  for (let x = x0; x <= x1; x += 28) topEdge.push([x, range(r, -4, 10)]);
  // missing chunk in the top edge
  const chunkX = lerp(x0, x1, brokenAt === 'right' ? 0.38 : 0.62);
  const chunk = (x: number) => Math.max(0, 1 - Math.abs(x - chunkX) / 70);
  const top = topEdge.map(([x, y]) => [x, y + chunk(x) * 58 + (chunk(x) > 0 ? range(r, -8, 8) : 0)] as Pt);
  const endX = brokenAt === 'right' ? x1 : x0;
  const dirX = brokenAt === 'right' ? -1 : 1;
  const breakLine = jag(r, [endX, top[brokenAt === 'right' ? top.length - 1 : 0][1]], [endX + dirX * 70, ENT_BOT], 7, 14);
  let outline: Pt[];
  if (brokenAt === 'right') outline = [[x0, ENT_BOT], [x0, top[0][1]], ...top.slice(1), ...breakLine.slice(1)];
  else outline = [...breakLine.slice().reverse(), ...top.slice(1), [x1, top[top.length - 1][1]], [x1, ENT_BOT]];
  // a bite missing from the underside, between two capitals
  const biteX = lerp(x0, x1, brokenAt === 'right' ? 0.55 : 0.45);
  const bite: Pt[] = jag(r, [biteX + 60, ENT_BOT], [biteX - 60, ENT_BOT], 6, 0).map(([x], i, arr) => [x, ENT_BOT - Math.sin((i / (arr.length - 1)) * Math.PI) * 46 + range(r, -6, 6)] as Pt);
  outline = [...outline, ...bite];
  const body = polyD(outline);
  let inner = '';
  // cornice: crown mouldings, dentils and a hatched soffit shadow
  inner += strokeP(`M${x0 - 10} 14H${x1 + 10}M${x0 - 10} 20H${x1 + 10}`, INK, 1.4);
  let cornHatch = '';
  for (let y = 24; y < t1 - 18; y += 3.6) cornHatch += `M${x0 - 10} ${n(y)}H${x1 + 10}`;
  inner += strokeP(cornHatch, INK, 0.8, 0.7);
  let dent = '';
  for (let x = x0 + 4; x < x1; x += 18) dent += rectD(x, t1 - 18, 10, 12);
  inner += fillP(rectD(x0 - 10, t1 - 18, x1 - x0 + 20, 12), INK) + fillP(dent, PAPER) + strokeP(dent, INK, 1);
  inner += fillP(rectD(x0 - 10, t1 - 4, x1 - x0 + 20, 14), INK);
  inner += strokeP(`M${x0 - 10} ${t1 + 18}H${x1 + 10}`, INK, 1.2);
  let trig = '';
  for (let x = x0 + 30; x < x1 - 20; x += 96) {
    trig += rectD(x, t1 + 22, 40, t2 - t1 - 26);
    inner += fillP(rectD(x + 9, t1 + 26, 5, t2 - t1 - 34), INK) + fillP(rectD(x + 23, t1 + 26, 5, t2 - t1 - 34), INK);
  }
  inner += strokeP(trig, INK, 1.6);
  inner += fillP(rectD(x0 - 10, t2, x1 - x0 + 20, 8), 'url(#hatch-h)');
  inner += strokeP(`M${x0 - 10} ${t2 + 8}H${x1 + 10}`, INK, 2);
  // engraved hatch over the shadowed lower half of the architrave
  let hh = '';
  for (let y = t2 + 34; y < ENT_BOT; y += 4) hh += `M${x0 - 10} ${y}H${x1 + 10}`;
  inner += strokeP(hh, INK, 0.9, 0.85);
  // the fractured end face, hatched with facets
  const faceEdge = breakLine.map(([x, y]) => [x + dirX * range(r, 18, 34), y + 6] as Pt);
  const face = polyD([...breakLine, ...faceEdge.slice().reverse()]);
  inner += fillP(face, PAPER) + clipped(face, fillP(rectD(Math.min(x0, x1) - 100, -10, W, 200), 'url(#hatch-x)'));
  inner += strokeP(pl2(faceEdge), INK, 2);
  // the chunk's exposed floor
  const chunkPts = top.filter(([x]) => chunk(x) > 0);
  if (chunkPts.length > 1) {
    const cf = polyD([...chunkPts, ...chunkPts.slice().reverse().map(([x, y]) => [x + 10, y + 16] as Pt)]);
    inner += fillP(cf, 'url(#hatch-d)');
  }
  // the bite's broken surface
  const biteFace = polyD([...bite, ...bite.slice().reverse().map(([x, y]) => [x - 4, y - 14] as Pt)]);
  inner += fillP(biteFace, 'url(#hatch-x)');
  // cracks running through the blocks
  let cr = '';
  for (let i = 0; i < 3; i++) {
    const sx = lerp(x0, x1, range(r, 0.1, 0.9));
    const pts: Pt[] = [[sx, range(r, 10, 40)]];
    for (let k = 0; k < 5; k++) pts.push([pts[k][0] + range(r, -20, 20), pts[k][1] + range(r, 18, 34)]);
    cr += brush(pts, 3, 0.5);
  }
  inner += fillP(cr, INK);
  // block joints
  let joints = '';
  for (let x = x0 + 150; x < x1 - 40; x += 210) joints += `M${n(x)} ${t2 + 8}V${ENT_BOT}`;
  inner += strokeP(joints, INK, 1.6);
  return fillP(body, PAPER) + clipped(body, inner) + strokeP(body, INK, 4);
}

function pl2(pts: Pt[]): string {
  return 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
}

export default art({
  name: 'ruins-colonnade',
  w: W,
  h: H,
  draw: () => {
    const r = rng(812);
    let out = '';

    // -------------------------------------------------------------- platform
    const roughTop: Pt[] = [];
    for (let x = -10; x <= W + 10; x += 18) {
      let y = PLAT_TOP + range(r, -2.5, 2.5);
      if (r() < 0.08) y += range(r, 4, 12); // chipped edge
      roughTop.push([x, y]);
    }
    const ragUnder: Pt[] = [];
    let drift = 0;
    for (let x = W + 10; x >= -10; x -= 8) {
      drift = drift * 0.75 + range(r, -2.4, 2.4);
      ragUnder.push([x, PLAT_UNDER + drift + Math.sin(x * 0.013) * 4]);
    }
    const slab = polyD([...roughTop, [W + 10, H + 10], [-10, H + 10]]);
    out += fillP(slab, PAPER);
    let ph = '';
    for (let y = PLAT_FACE + 5; y < PLAT_UNDER + 6; y += lerp(6, 3, (y - PLAT_FACE) / (PLAT_UNDER - PLAT_FACE))) {
      let x = -10;
      while (x < W + 10) {
        const len = range(r, 140, 520);
        ph += `M${n(x)} ${n(y + range(r, -0.6, 0.6))}H${n(x + len)}`;
        x += len + range(r, 6, 40);
      }
    }
    let pj = '';
    for (let x = range(r, 80, 200); x < W; x += range(r, 220, 360)) pj += `M${n(x)} ${PLAT_FACE}V${PLAT_UNDER}`;
    let topLines = '';
    for (let y = PLAT_TOP + 7; y < PLAT_FACE - 2; y += 6) topLines += `M-10 ${y}H${W + 10}`;
    const under = polyD([...ragUnder, [-10, H + 10], [W + 10, H + 10]]);
    out += clipped(slab, strokeP(topLines, INK, 0.7, 0.6) + strokeP(ph, INK, 1) + strokeP(pj, INK, 1.8) + fillP(under, INK));
    out += strokeP(`M-10 ${PLAT_FACE}H${W + 10}`, INK, 3.4);
    out += strokeP(pl2(roughTop), INK, 3);

    // ------------------------------------------------------------- columns
    const R = 42;
    const xsL = [62, 182, 302, 422, 542];
    const xsR = xsL.map((x) => W - x);
    // cast shadows on the platform top (light from the left)
    let shadows = '';
    for (const cx of [...xsL, ...xsR]) shadows += polyD([[cx - R * 0.6, PLAT_TOP + 1], [cx + R * 1.3, PLAT_TOP + 1], [cx + R * 2.6, PLAT_FACE - 2], [cx + R * 0.6, PLAT_FACE - 2]]);
    out += fillP(shadows, INK, 0.9);
    for (const cx of [...xsL, ...xsR]) out += column(r, cx, R);

    // --------------------------------------------------------- entablature
    out += entablature(r, -10, 640, 'right');
    out += entablature(r, 960, W + 10, 'left');

    // loose fallen blocks on the platform in the gap
    const block = (x: number, w: number, h: number, tilt: number) => {
      const pts: Pt[] = [[x, PLAT_TOP], [x + w, PLAT_TOP + tilt], [x + w - 4, PLAT_TOP - h + tilt], [x + 6, PLAT_TOP - h]];
      const b = polyD(pts);
      return fillP(b, PAPER) + clipped(b, fillP(rectD(x + w * 0.6, PLAT_TOP - h - 10, w, h + 20), 'url(#hatch-v)')) + strokeP(b, INK, 2.6);
    };
    out += block(640, 70, 34, -3);
    out += block(905, 46, 22, 2);
    return out;
  },
});
