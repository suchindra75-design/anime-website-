import { art, INK, PAPER, RED, RED_DEEP, STONE, GREY, FLAVOR_BLUE, FLAVOR_GREEN, FLAVOR_YELLOW, rng, range, smooth, brush, clipped, type Pt } from '../kit.ts';
import { fillP, strokeP, ribbon, polyD, rectD, ellipseD, arcPts, n, lerp, clamp } from './_util.ts';

const W = 1600;
const H = 1000;
const WALL_Y = 620;

/** Small stoppered bottle standing with its base centre at (x, y). */
function bottle(x: number, y: number, w: number, h: number, color: string): string {
  const neck = w * 0.2;
  const body = smooth(
    [
      [x - w * 0.5, y - 2],
      [x - w * 0.52, y - h * 0.55],
      [x - w * 0.42, y - h * 0.68],
      [x - neck, y - h * 0.76],
      [x - neck, y - h * 0.88],
      [x + neck, y - h * 0.88],
      [x + neck, y - h * 0.76],
      [x + w * 0.42, y - h * 0.68],
      [x + w * 0.52, y - h * 0.55],
      [x + w * 0.5, y - 2],
      [x, y + w * 0.08],
    ],
    true,
    0.3,
  );
  const stopper = polyD([
    [x - neck * 1.15, y - h * 0.86],
    [x - neck * 1.3, y - h * 1.0],
    [x + neck * 1.3, y - h * 1.0],
    [x + neck * 1.15, y - h * 0.86],
  ]);
  const label = rectD(x - w * 0.53, y - h * 0.46, w * 1.06, h * 0.17);
  let shade = '';
  for (let xx = x + w * 0.18; xx < x + w * 0.55; xx += 2.4) shade += `M${n(xx)} ${n(y - h * 0.7)}V${n(y)}`;
  return (
    fillP(body, color) +
    clipped(body, strokeP(shade, INK, 0.9, 0.6) + fillP(label, INK)) +
    fillP(polyD([[x - w * 0.12, y - h * 0.375], [x - w * 0.04, y - h * 0.41], [x + w * 0.04, y - h * 0.375], [x - w * 0.04, y - h * 0.34]]), PAPER) +
    fillP(rectD(x - w * 0.36, y - h * 0.64, w * 0.1, h * 0.16), PAPER, 0.9) +
    fillP(rectD(x - w * 0.36, y - h * 0.26, w * 0.1, h * 0.18), PAPER, 0.9) +
    fillP(stopper, GREY) +
    strokeP(`M${n(x - neck * 1.2)} ${n(y - h * 0.93)}H${n(x + neck * 1.2)}`, INK, 1) +
    strokeP(body + stopper, INK, 2.2)
  );
}

export default art({
  name: 'table-scene',
  w: W,
  h: H,
  bg: RED,
  draw: () => {
    const r = rng(4242);
    let out = '';

    // ---------------------------------------------------------------- wall
    // soft vertical engraving gradient deepening into both corners
    let edgeThin = '';
    let edgeMid = '';
    let edgeHeavy = '';
    for (const side of [0, 1]) {
      for (let i = 0; i < 70; i++) {
        const t = i / 70; // 0 at the corner .. 1 towards the middle
        const d = Math.pow(t, 1.7) * 330 + range(r, -0.6, 0.6);
        const x = side ? W - d : d;
        if (t > 0.55 && r() < (t - 0.55) * 1.6) continue;
        const seg = `M${n(x)} -2V${n(WALL_Y - (t > 0.6 ? range(r, 0, 80) * t : 0))}`;
        if (t < 0.22) edgeHeavy += seg;
        else if (t < 0.5) edgeMid += seg;
        else edgeThin += seg;
      }
    }
    out += strokeP(edgeHeavy, INK, 2.2, 0.5) + strokeP(edgeMid, INK, 1.4, 0.42) + strokeP(edgeThin, INK, 0.8, 0.35);

    // tall arched niche behind the pedestal, cut into the wall in deep-red hatching
    const nx0 = 862;
    const nx1 = 1218;
    const nR = (nx1 - nx0) / 2;
    const nTop = 128;
    const niche = `M${nx0} ${WALL_Y}V${nTop + nR}A${nR} ${nR} 0 0 1 ${nx1} ${nTop + nR}V${WALL_Y}Z`;
    let nh = '';
    for (let x = nx0 + 3; x < nx1; x += 5.2) nh += `M${n(x)} ${nTop - 4}V${WALL_Y}`;
    // reveal: the left inner jamb and the arch soffit sit in shadow
    const jamb = `M${nx0} ${WALL_Y}V${nTop + nR}A${nR} ${nR} 0 0 1 ${nx0 + nR} ${nTop}L${nx0 + nR} ${nTop + 22}A${nR - 22} ${nR - 22} 0 0 0 ${nx0 + 22} ${nTop + nR + 8}V${WALL_Y}Z`;
    let jh = '';
    for (let x = nx0 - 4; x < nx0 + nR + 4; x += 2.6) jh += `M${n(x)} ${nTop - 4}V${WALL_Y}`;
    out += clipped(niche, strokeP(nh, RED_DEEP, 1.6) + clipped(jamb, strokeP(jh, RED_DEEP, 1.6) + strokeP(jh, INK, 0.5, 0.35)));
    out += strokeP(niche, RED_DEEP, 4);
    out += strokeP(`M${nx0 + 22} ${WALL_Y}V${nTop + nR + 8}A${nR - 22} ${nR - 22} 0 0 1 ${nx1 - 4} ${nTop + nR + 12}`, RED_DEEP, 1.6);
    // a faint shadow band where the wall meets the floor
    let band = '';
    for (let yy = WALL_Y - 42; yy < WALL_Y; yy += lerp(6, 2.4, (yy - (WALL_Y - 42)) / 42)) band += `M0 ${n(yy)}H${W}`;
    out += strokeP(band, INK, 1, 0.4);

    // --------------------------------------------------------------- floor
    out += fillP(rectD(0, WALL_Y, W, H - WALL_Y), STONE);
    // long wavy lines, denser and heavier towards the bottom
    let thin = '';
    let heavy = '';
    let y = WALL_Y + 6;
    let k = 0;
    while (y < H + 10) {
      const t = (y - WALL_Y) / (H - WALL_Y);
      const amp = lerp(1.2, 5, t);
      const ph = range(r, 0, 6.28);
      const ph2 = range(r, 0, 6.28);
      const fr = range(r, 0.004, 0.008);
      let x = -20;
      while (x < W + 20) {
        const len = range(r, 300, 1100) * lerp(1, 0.6, t);
        const pts: Pt[] = [];
        for (let xx = x; xx <= Math.min(W + 20, x + len); xx += 40) {
          pts.push([xx, y + Math.sin(xx * fr + ph) * amp + Math.sin(xx * 0.019 + ph2) * amp * 0.3]);
        }
        if (pts.length > 2) {
          const d = smooth(pts);
          if (t > 0.45 && k % 3 !== 0) heavy += d;
          else thin += d;
        }
        x += len + range(r, 10, 80);
      }
      y += lerp(15, 4.2, Math.pow(t, 0.8));
      k++;
    }
    out += strokeP(thin, INK, 0.9);
    out += strokeP(heavy, INK, 1.6);
    // wall base: crisp shadow line
    out += fillP(rectD(0, WALL_Y - 2, W, 6), INK);

    // ---------------------------------------------------------------- table
    const cx = 1040;
    const drumRx = 104;
    const ry = (rx: number) => rx * 0.17;
    const baseY = 900;
    const drumTop = 588;
    const slabRx = 160;
    const slabTop = 540;
    const slabBot = 580;

    // crisp cast shadow falling down-right across the floor (light from the upper left)
    {
      const dir: Pt = [300, 78]; // offset of the slab's shadow
      const hull = (pts: Pt[]): Pt[] => {
        const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const lo: Pt[] = [];
        for (const q of p) {
          while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
          lo.push(q);
        }
        const up: Pt[] = [];
        for (const q of p.reverse()) {
          while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
          up.push(q);
        }
        return [...lo.slice(0, -1), ...up.slice(0, -1)];
      };
      const shadowPts = hull([
        ...arcPts(cx, baseY + 2, drumRx + 16, ry(drumRx + 16), 0, Math.PI * 2, 28),
        ...arcPts(cx + dir[0], baseY + dir[1], slabRx, ry(slabRx), 0, Math.PI * 2, 32),
      ]);
      const shadow = polyD(shadowPts);
      out += fillP(shadow, INK);
      // floor ripples glint faintly through the shadow so it lies on the surface
      let glint = '';
      for (let yy = baseY - 20; yy < H + 10; yy += range(r, 5, 9)) {
        const pts: Pt[] = [];
        const ph = range(r, 0, 6.28);
        for (let x = cx - 160; x <= cx + dir[0] + slabRx + 20; x += 40) pts.push([x, yy + Math.sin(x * 0.006 + ph) * 3]);
        glint += smooth(pts);
      }
      out += clipped(shadow, strokeP(glint, PAPER, 0.8, 0.22));
    }

    // foot moulding
    const footTop = baseY - 26;
    const footRx = drumRx + 16;
    const foot = polyD([
      ...arcPts(cx, footTop, footRx, ry(footRx), Math.PI, Math.PI * 2, 16),
      ...arcPts(cx, baseY + 4, footRx, ry(footRx), 0, Math.PI, 16),
    ]);
    out += fillP(foot, PAPER) + clipped(foot, fillP(rectD(cx + footRx * 0.35, footTop - 40, 260, 90), 'url(#hatch-v)') + fillP(rectD(cx + footRx * 0.68, footTop - 40, 60, 90), INK));
    out += strokeP(foot, INK, 2.8);

    // drum body
    const drum = polyD([
      ...arcPts(cx, drumTop, drumRx, ry(drumRx), Math.PI, 0, 1),
      ...arcPts(cx, footTop + 2, drumRx, ry(drumRx), 0, Math.PI, 18),
    ]);
    out += fillP(drum, PAPER);
    // horizontal hatch rings that thicken towards the shadow side (right)
    let rings = '';
    for (let yy = drumTop + 10; yy < footTop + 4; yy += 6.4) {
      const pts = arcPts(cx, yy, drumRx, ry(drumRx), 0, Math.PI, 20).reverse(); // left -> right
      rings += ribbon(pts, (t) => 0.25 + 2.9 * clamp((t - 0.4) / 0.5, 0, 1) ** 1.4 + 1 * clamp((0.1 - t) / 0.1, 0, 1), 0.4, false);
    }
    // stacked drum joints
    let jointD = '';
    for (const jy of [690, 800]) jointD += 'M' + arcPts(cx, jy, drumRx, ry(drumRx), Math.PI, 0, 20).reverse().map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
    // core shadow band on the right, leaving a reflected-light rim at the edge
    out += clipped(
      drum,
      fillP(rings, INK) +
        fillP(polyD([[cx + drumRx * 0.64, drumTop - 20], [cx + drumRx * 0.84, drumTop - 20], [cx + drumRx * 0.84, baseY + 30], [cx + drumRx * 0.64, baseY + 30]]), INK) +
        strokeP(jointD, INK, 2.4),
    );
    out += strokeP(`M${n(cx - drumRx)} ${drumTop}V${n(footTop + 2)}M${n(cx + drumRx)} ${drumTop}V${n(footTop + 2)}`, INK, 3.4);
    out += strokeP('M' + arcPts(cx, footTop + 2, drumRx, ry(drumRx), 0, Math.PI, 18).map(([x, y]) => `${n(x)} ${n(y)}`).join('L'), INK, 2.4);
    // a long crack down the drum
    {
      const pts: Pt[] = [[cx - drumRx * 0.35, drumTop + 30]];
      for (let i = 0; i < 8; i++) pts.push([pts[i][0] + range(r, -10, 12), pts[i][1] + range(r, 22, 36)]);
      out += clipped(drum, fillP(brush(pts, 3, 0.5), INK));
    }
    // top slab: thick disc seen slightly from above
    const slabSide = polyD([
      ...arcPts(cx, slabTop, slabRx, ry(slabRx), Math.PI, 0, 1),
      ...arcPts(cx, slabBot, slabRx, ry(slabRx), 0, Math.PI, 26),
    ]);
    out += fillP(ellipseD(cx + 8, slabBot + 6, slabRx * 0.92, ry(slabRx) * 0.9), INK); // shadow under the slab
    out += fillP(slabSide, PAPER);
    let sideHatch = '';
    for (let yy = slabTop + 4; yy < slabBot + ry(slabRx); yy += 4) {
      const pts = arcPts(cx, yy, slabRx, ry(slabRx), 0, Math.PI, 22).reverse();
      sideHatch += ribbon(pts, (t) => 0.3 + 2.4 * clamp((t - 0.48) / 0.45, 0, 1) ** 1.3, 0.4, false);
    }
    out += clipped(slabSide, fillP(sideHatch, INK));
    out += strokeP(slabSide, INK, 3.6);
    const slabTopFace = ellipseD(cx, slabTop, slabRx, ry(slabRx));
    out += fillP(slabTopFace, PAPER);
    out += clipped(
      slabTopFace,
      strokeP(smooth(arcPts(cx, slabTop + 3, slabRx * 0.82, ry(slabRx) * 0.64, Math.PI * 0.05, Math.PI * 0.95, 12)), INK, 1.1, 0.5) +
        strokeP(smooth(arcPts(cx, slabTop - 2, slabRx * 0.9, ry(slabRx) * 0.8, Math.PI * 1.15, Math.PI * 1.6, 8)), INK, 0.9, 0.35),
    );
    out += strokeP(slabTopFace, INK, 3.4);

    // bottles
    const bw = 46;
    const bh = 122;
    const spots: [number, number, string][] = [
      [cx - 72, slabTop + 9, FLAVOR_BLUE],
      [cx + 2, slabTop - 6, FLAVOR_GREEN],
      [cx + 76, slabTop + 11, FLAVOR_YELLOW],
    ];
    for (const [bx, by] of spots) out += fillP(ellipseD(bx + 16, by + 1, bw * 0.7, 5.5), INK, 0.85);
    for (const [bx, by, col] of spots) out += bottle(bx, by, bw, bh, col);
    return out;
  },
});
