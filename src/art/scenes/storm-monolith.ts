import { art, INK, PAPER, MAROON, rng, range, brush, smooth, clipped, type Pt, type Rng } from '../kit.ts';
import { fillP, strokeP, arcPts, polyD, rectD, ellipseD, ribbon, pl, n, lerp } from './_util.ts';

const W = 1600;
const H = 1100;

type Puff = { x: number; y: number; r: number; rim?: boolean };


function circleD(x: number, y: number, rad: number): string {
  return ellipseD(x, y, rad, rad);
}

/** Lumpy outline radius for a billow at angle a. */
function billowShape(rad: number, ph: number) {
  return (a: number) => {
    const lump = 1 + 0.05 * Math.sin(3 * a + ph) + 0.035 * Math.sin(5 * a + ph * 2.3);
    // small scallops along the lower, sunlit side
    const sc = Math.sin(a) > 0.1 ? 1 + 0.04 * Math.abs(Math.sin(a * 7 + ph)) : 1;
    return rad * lump * sc;
  };
}

/**
 * One billow of the storm: an ink body with an irregular outline, broken
 * paper rim-light arcs of varying length/weight, and an optional patch of
 * white dot tone where the light grazes it.
 */
function billow(x: number, y: number, rad: number, r: Rng, rim: number, tone: boolean): string {
  const ph = range(r, 0, 6.28);
  const R = billowShape(rad, ph);
  const at = (a: number, inset: number): Pt => [x + Math.cos(a) * (R(a) - inset), y + Math.sin(a) * (R(a) - inset) * 0.9];
  const body: Pt[] = [];
  for (let i = 0; i < 18; i++) body.push(at((i / 18) * Math.PI * 2, 0));
  let o = fillP(smooth(body, true, 0.5), INK);
  // rim-light arcs along the edge facing the light (upper left); billows on the
  // outer flank also catch it round their undersides
  const arcs = rim > 0.75 ? 2 + (r() < 0.6 ? 1 : 0) : 1 + (r() < 0.7 ? 1 : 0);
  let start = rim > 0.75 ? range(r, Math.PI * 0.35, Math.PI * 0.6) : range(r, Math.PI * 0.72, Math.PI * 1.0);
  for (let k = 0; k < arcs; k++) {
    const len = range(r, 0.3, 0.95) * (0.75 + rim * 0.5);
    const a0 = start;
    const a1 = Math.min(Math.PI * 1.85, a0 + len);
    if (a1 - a0 < 0.15) break;
    const inset = range(r, 1.5, 3) + (k > 0 && r() < 0.4 ? rad * range(r, 0.03, 0.08) : 0);
    const pts: Pt[] = [];
    const steps = Math.max(5, Math.round(((a1 - a0) * rad) / 12));
    for (let i = 0; i <= steps; i++) pts.push(at(lerp(a0, a1, i / steps), inset));
    const w = Math.max(1.8, rad * range(r, 0.03, 0.075) * (0.6 + rim * 0.6));
    const peak = range(r, 0.2, 0.75);
    o += fillP(ribbon(pts, (t) => w * Math.pow(t < peak ? t / peak : (1 - t) / (1 - peak), 0.65), 0.4, false), PAPER);
    start = a1 + range(r, 0.08, 0.35);
  }
  if (tone) {
    // dot-tone patch hugging the lit edge, ragged on its inner side
    const a0 = rim > 0.75 ? range(r, Math.PI * 0.45, Math.PI * 0.8) : range(r, Math.PI * 0.85, Math.PI * 1.15);
    const a1 = a0 + range(r, 0.5, 1.0);
    const outer: Pt[] = [];
    const inner: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = lerp(a0, a1, i / 8);
      const depth = rad * range(r, 0.14, 0.32) * Math.sin((i / 8) * Math.PI);
      outer.push(at(a, 5));
      inner.push(at(a, 5 + depth));
    }
    o += fillP(smooth([...outer, ...inner.reverse()], true, 0.4), 'url(#storm-dots)', n(range(r, 0.7, 1)));
  }
  return o;
}

export default art({
  name: 'storm-monolith',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(77);
    let out = '';

    // ------------------------------------------------------------ sky
    // faint tone wash near the cloud, a few wind streaks on the open left
    let streaks = '';
    for (let i = 0; i < 6; i++) {
      const y = range(r, 160, 640);
      const x0 = range(r, -40, 300);
      streaks += brush([[x0, y], [x0 + range(r, 120, 260), y - range(r, 2, 8)], [x0 + range(r, 280, 420), y - range(r, 4, 14)]], range(r, 1.2, 2.2), 0.7);
    }
    out += fillP(streaks, INK);

    // ---------------------------------------------------------- storm cloud
    const puffs: Puff[] = [
      // back core masses
      { x: 1250, y: 120, r: 360 },
      { x: 930, y: 60, r: 250 },
      { x: 1500, y: 300, r: 300 },
      { x: 660, y: 20, r: 190 },
      { x: 1060, y: 330, r: 250 },
      { x: 1320, y: 420, r: 150 },
      { x: 1560, y: 470, r: 160 },
      // anvil spreading left at the top
      { x: 470, y: 30, r: 150, rim: true },
      { x: 330, y: 70, r: 105, rim: true },
      { x: 560, y: 150, r: 120, rim: true },
      { x: 420, y: 160, r: 85, rim: true },
      { x: 730, y: 210, r: 120, rim: true },
      // flank stepping down the left side
      { x: 860, y: 300, r: 115, rim: true },
      { x: 810, y: 400, r: 95, rim: true },
      { x: 920, y: 450, r: 110, rim: true },
      // billowing underside
      { x: 870, y: 530, r: 85, rim: true },
      { x: 960, y: 560, r: 100 },
      { x: 1100, y: 520, r: 120 },
      { x: 1250, y: 575, r: 105 },
      { x: 1400, y: 560, r: 115 },
      { x: 1540, y: 600, r: 105 },
      { x: 1050, y: 620, r: 70 },
      { x: 1180, y: 650, r: 60 },
      { x: 1330, y: 655, r: 72 },
      { x: 1480, y: 670, r: 66 },
      { x: 1610, y: 680, r: 80 },
      { x: 900, y: 600, r: 55, rim: true },
    ];
    out += `<defs><pattern id="storm-dots" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3" cy="3" r="1.05" fill="${PAPER}"/></pattern><pattern id="storm-dots-sparse" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="1" fill="${PAPER}"/></pattern></defs>`;
    // solid core first (no outlines), then billows back-to-front
    const core = puffs.slice(0, 7);
    let cloud = '';
    for (const p of core) cloud += fillP(circleD(p.x, p.y, p.r), INK);
    cloud += fillP(polyD([[700, -20], [W + 20, -20], [W + 20, 640], [1000, 560], [860, 380]]), INK);
    // deep interior haze: soft patches of sparse dots so the mass has depth
    const haze: [number, number, number, number][] = [
      [1000, 180, 120, 70],
      [1460, 120, 150, 80],
      [1480, 380, 110, 60],
      [960, 420, 90, 50],
      [1250, 40, 140, 50],
    ];
    for (const [hx, hy, hrx, hry] of haze) {
      const pts: Pt[] = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const k = range(r, 0.7, 1.15);
        pts.push([hx + Math.cos(a) * hrx * k, hy + Math.sin(a) * hry * k]);
      }
      cloud += fillP(smooth(pts, true, 0.5), 'url(#storm-dots-sparse)', 0.7);
    }
    type B = { x: number; y: number; r: number; rim: number };
    const billows: B[] = puffs.slice(7).map((p) => ({ x: p.x, y: p.y, r: p.r, rim: p.rim ? 1 : 0.6 }));
    // overlapping billows filling the body of the cloud (the monolith hides its middle)
    for (let gy = -60; gy < 600; gy += 85) {
      const row = Math.round((gy + 60) / 85);
      for (let gx = 860 + (row % 2) * 55; gx < W + 90; gx += 112) {
        const x = gx + range(r, -35, 35);
        const y = gy + range(r, -25, 25);
        if (x > 1090 && x < 1300 && y > 130) continue; // fully behind the monolith
        if (x < 900 && y > 470) continue; // keep the lower flank as drawn
        billows.push({ x, y, r: range(r, 52, 100), rim: range(r, 0.2, 0.65) });
      }
    }
    // the anvil's interior, spreading over the top-left
    for (let gy = -50; gy < 300; gy += 80) {
      for (let gx = 520 + ((gy + 50) / 80) % 2 * 50; gx < 880; gx += 105) {
        const x = gx + range(r, -30, 30);
        const y = gy + range(r, -20, 20);
        const rad = range(r, 48, 90);
        if (y + rad > 330 && x - rad < 720) continue; // stay out of the figure's sky
        if (y > 230 - (x - 520) * 0.2 && x < 640) continue; // inside the anvil silhouette only
        billows.push({ x, y, r: rad, rim: range(r, 0.3, 0.7) });
      }
    }
    // the outer flank lobes sit a little behind the body so the inner billows overlap them
    const key = (b: B) => b.y + (b.rim > 0.9 ? -b.r * 0.35 : b.r * 0.45);
    billows.sort((a, b) => key(a) - key(b));
    for (const b of billows) {
      cloud += billow(b.x, b.y, b.r, r, b.rim, r() < (b.rim > 0.8 ? 0.75 : 0.45));
      // small buds on the bigger billows' lower edge
      if (b.r > 80) {
        const buds = 1 + Math.floor(r() * 2);
        for (let i = 0; i < buds; i++) {
          const a = range(r, Math.PI * 0.3, Math.PI * 0.95);
          const br = b.r * range(r, 0.25, 0.4);
          const d = b.r - br * range(r, 0.4, 0.75);
          cloud += billow(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d * 0.9, br, r, b.rim * 0.9, r() < 0.3);
        }
      }
    }
    out += cloud;
    // rain: pale streaks hanging out of the cloud base, ink streaks falling below it
    let rainW = '';
    let rainB = '';
    for (let i = 0; i < 120; i++) {
      const x = range(r, 960, W + 30);
      const y0 = range(r, 600, 680);
      const len = range(r, 18, 70);
      rainW += `M${n(x)} ${n(y0)}l${n(-len * 0.22)} ${n(len)}`;
    }
    for (let i = 0; i < 90; i++) {
      const x = range(r, 1000, W + 40);
      const y0 = range(r, 655, 690);
      const len = range(r, 10, 46);
      rainB += `M${n(x)} ${n(y0)}l${n(-len * 0.22)} ${n(len)}`;
    }
    out += clipped(rectD(940, 560, W, 140), strokeP(rainW, PAPER, 0.9, 0.55));
    out += clipped(rectD(940, 560, W, 140), strokeP(rainB, INK, 0.9, 0.7));
    // ---------------------------------------------------------- far ground
    const LAND_BACK = 700;
    const LAND_FRONT = 792;
    // distant horizon band visible under the cloud on the right
    out += strokeP(`M-10 ${LAND_BACK}H${W + 10}`, INK, 2);

    // the world far below, seen past the left edge of the stair: flat sea of haze
    let sea = '';
    for (let i = 0; i < 26; i++) {
      const yy = LAND_BACK + 6 + Math.pow(i / 26, 1.6) * 420;
      let x = -20;
      while (x < 700) {
        const len = range(r, 40, 200);
        sea += `M${n(x)} ${n(yy)}H${n(x + len)}`;
        x += len + range(r, 10, 60);
      }
    }
    out += strokeP(sea, INK, 0.8, 0.8);

    // landing (top platform) receding in slight perspective
    const landLeft = 300;
    out += fillP(polyD([[landLeft + 40, LAND_BACK], [W + 10, LAND_BACK], [W + 10, LAND_FRONT], [landLeft, LAND_FRONT]]), PAPER);
    let landLines = '';
    for (let i = 1; i < 4; i++) {
      const t = Math.pow(i / 4, 1.4);
      const y = lerp(LAND_BACK, LAND_FRONT, t);
      const xl = lerp(landLeft + 40, landLeft, t);
      landLines += `M${n(xl)} ${n(y)}H${W + 10}`;
    }
    // slab joints converge towards a vanishing point high above the monolith
    const vp: Pt = [1200, 300];
    for (let x = 400; x < W + 200; x += range(r, 150, 260)) {
      const t0 = (LAND_BACK - vp[1]) / (LAND_FRONT - vp[1]);
      landLines += `M${n(vp[0] + (x - vp[0]) * t0)} ${LAND_BACK}L${n(x)} ${LAND_FRONT}`;
    }
    out += strokeP(landLines, INK, 1);
    out += strokeP(`M${landLeft + 40} ${LAND_BACK}L${landLeft} ${LAND_FRONT}`, INK, 3);

    // ------------------------------------------------------------ monolith
    const mx0 = 1050;
    const mx1 = 1350;
    const side = 34; // right side face width
    const mTop = 120;
    const mBot = 722;
    const front = polyD([[mx0, mTop + 6], [mx1 - side, mTop], [mx1 - side, mBot], [mx0, mBot]]);
    const sideF = polyD([[mx1 - side, mTop], [mx1, mTop + 14], [mx1, mBot - 6], [mx1 - side, mBot]]);
    out += fillP(front, PAPER);
    // vertical engraving hatch: sparse on the lit left, dense towards the right edge
    let vh = '';
    for (let x = mx0 + 10; x < mx1 - side; x += lerp(9, 3.2, Math.pow((x - mx0) / (mx1 - side - mx0), 0.8))) {
      const y0 = mTop + range(r, 8, 40);
      const y1 = mBot - range(r, 0, 20);
      vh += `M${n(x + range(r, -0.6, 0.6))} ${n(y0)}L${n(x + range(r, -0.6, 0.6))} ${n(y1)}`;
    }
    // carved inner frame (the "doorway")
    const fx0 = mx0 + 46;
    const fx1 = mx1 - side - 46;
    const fy0 = mTop + 60;
    const recess = polyD([[fx0, fy0], [fx1, fy0], [fx1, mBot], [fx0, mBot]]);
    out += clipped(front, strokeP(vh, INK, 1.15));
    out += fillP(recess, PAPER);
    let rh = '';
    for (let x = fx0 + 6; x < fx1; x += 4.2) rh += `M${n(x)} ${fy0 + 4}V${mBot}`;
    out += clipped(recess, strokeP(rh, INK, 1.2) + fillP(rectD(fx0, fy0, 16, mBot - fy0), INK) + fillP(rectD(fx0, fy0, fx1 - fx0, 14), INK));
    out += strokeP(recess, INK, 3);
    out += fillP(sideF, INK);
    // a few lit chips on the dark side face
    let chips = '';
    for (let i = 0; i < 7; i++) {
      const y = range(r, mTop + 40, mBot - 40);
      chips += brush([[mx1 - side + 6, y], [mx1 - side + 14, y + range(r, 8, 20)]], 2, 0.8);
    }
    out += fillP(chips, PAPER, 0.9);
    // weathered cracks on the front face
    let cracks = '';
    for (let i = 0; i < 4; i++) {
      let x = range(r, mx0 + 20, mx1 - side - 20);
      let y = range(r, mTop + 20, mTop + 200);
      const pts: Pt[] = [[x, y]];
      for (let k = 0; k < 6; k++) {
        x += range(r, -14, 14);
        y += range(r, 14, 30);
        pts.push([x, y]);
      }
      cracks += brush(pts, 2.4, 0.6);
    }
    out += clipped(front, fillP(cracks, INK));
    out += strokeP(front + sideF, INK, 4.5);
    // broken top edge chip

    // shadow of monolith + orb on the landing
    out += fillP(polyD([[mx1, mBot - 6], [mx1 + 220, LAND_FRONT - 4], [mx1 + 120, LAND_FRONT - 2], [mx1 - side, mBot]]), 'url(#hatch-d)');
    out += fillP(brush([[mx0 - 20, mBot + 1], [mx1 - 100, mBot + 2], [mx1 + 30, mBot - 3]], 6, 0.4), INK);

    // --------------------------------------------------------------- orb
    const ox = 1196;
    const oy = 652;
    const orr = 130;
    out += fillP(ellipseD(ox + 20, oy + orr - 6, orr * 1.05, 18), INK);
    const orbD = circleD(ox, oy, orr);
    let radial = '';
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * Math.PI * 2 + range(r, -0.01, 0.01);
      const r0 = range(r, 6, 40);
      const r1 = orr * range(r, 0.55, 1);
      const bend = range(r, -0.08, 0.08);
      const pts: Pt[] = [];
      for (let s = 0; s <= 4; s++) {
        const rr = lerp(r0, r1, s / 4);
        const aa = a + bend * (s / 4) * (s / 4);
        pts.push([ox + Math.cos(aa) * rr, oy + Math.sin(aa) * rr]);
      }
      radial += pl(pts);
    }
    // dark edge: concentric strokes growing heavier towards the rim
    let rings = '';
    for (let k = 0; k < 7; k++) {
      const rr = orr - 3 - k * 4.5;
      rings += `<path d="${circleD(ox, oy, rr)}" fill="none" stroke="${INK}" stroke-width="${n(5.5 - k * 0.7)}" stroke-opacity="${n(0.9 - k * 0.11)}"/>`;
    }
    out += fillP(orbD, MAROON);
    out += clipped(orbD, strokeP(radial, INK, 0.8, 0.75) + rings + fillP(ellipseD(ox + 30, oy + 40, orr * 0.95, orr * 0.9), 'url(#tone)', 0.55));
    // specular highlight on the upper left
    out += fillP(brush(arcPts(ox, oy, orr * 0.8, orr * 0.8, Math.PI * 1.1, Math.PI * 1.42, 8), 7, 0.9), PAPER);
    out += fillP(ellipseD(ox - 52, oy - 66, 9, 6), PAPER);
    out += strokeP(orbD, INK, 5);

    // -------------------------------------------------------------- steps
    // frontal flight, each step nearer and taller; the left ends climb diagonally
    type Step = { top: number; nose: number; bot: number; left: number };
    const steps: Step[] = [];
    let y = LAND_FRONT;
    let k = 0;
    while (y < H + 20) {
      const s = 1 + 0.2 * k;
      const riser = 26 * s;
      const tread = 10 * s;
      steps.push({ top: y, nose: y, bot: y + riser, left: 0 });
      y += riser;
      // tread of the next step
      if (y < H + 20) {
        steps[steps.length - 1].bot = y;
        y += tread;
      }
      k++;
    }
    const leftAt = (yy: number) => lerp(landLeft, -140, (yy - LAND_FRONT) / (H - LAND_FRONT));
    let stepSvg = '';
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const xl = leftAt(st.top);
      const nextTop = i + 1 < steps.length ? steps[i + 1].top : H + 40;
      const xlNext = leftAt(nextTop);
      // riser (vertical face): horizontal fine hatch, heavy shadow under the nosing
      const riser = polyD([[xl, st.top], [W + 10, st.top], [W + 10, st.bot], [xl, st.bot]]);
      let hh = '';
      const rh2 = st.bot - st.top;
      const sp = 2.6 + i * 0.35;
      for (let yy = st.top + rh2 * 0.2; yy < st.bot - 1; yy += sp) {
        const t = (yy - st.top) / rh2;
        if (t > 0.55 && r() < (t - 0.55) * 1.6) continue; // lighter towards the bottom of each riser
        hh += `M${n(xl)} ${n(yy + range(r, -0.3, 0.3))}L${n(W + 10)} ${n(yy + range(r, -0.6, 0.6))}`;
      }
      let joints = '';
      for (let x = xl + range(r, 60, 200); x < W; x += range(r, 160, 320)) joints += `M${n(x)} ${n(st.top)}V${n(st.bot)}`;
      stepSvg += fillP(riser, PAPER);
      const shadowEdge: Pt[] = [];
      for (let x = xl; x <= W + 20; x += 40) shadowEdge.push([x, st.top + rh2 * range(r, 0.18, 0.3)]);
      stepSvg += clipped(riser, strokeP(hh, INK, 1) + fillP(polyD([[xl, st.top - 2], [W + 20, st.top - 2], ...shadowEdge.reverse()]), INK) + strokeP(joints, INK, 1.6));
      // tread (top face, white) between this riser bottom and the next riser top
      const tread = polyD([[xl, st.bot], [W + 10, st.bot], [W + 10, nextTop], [xlNext, nextTop]]);
      stepSvg += fillP(tread, PAPER);
      // nosing line + chips
      stepSvg += fillP(brush([[xl, st.top], [lerp(xl, W, 0.3), st.top + 0.6], [lerp(xl, W, 0.7), st.top - 0.4], [W + 20, st.top]], 4.2, 0.25), INK);
      stepSvg += strokeP(`M${n(xl)} ${n(st.bot)}H${W + 10}`, INK, 1.4);
      stepSvg += strokeP(`M${n(xl)} ${n(st.top)}V${n(st.bot)}L${n(xlNext)} ${n(nextTop)}`, INK, 3);
      for (let c = 0; c < 3; c++) {
        const cx = range(r, xl + 40, W - 40);
        stepSvg += fillP(polyD([[cx, st.top - 1], [cx + range(r, 10, 24), st.top - 1], [cx + range(r, 4, 10), st.top + range(r, 4, 9)]]), INK);
      }
    }
    // ground beneath the left ends of the steps (out of the open sky)
    out += stepSvg;
    // sky side of the staircase silhouette: a hard ink edge
    return out;
  },
});
