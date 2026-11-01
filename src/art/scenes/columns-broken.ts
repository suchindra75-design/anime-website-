import { art, INK, PAPER, RED, RED_DEEP, rng, range, brush, clipped, type Pt, type Rng } from '../kit.ts';
import { fillP, strokeP, polyD, rectD, n, lerp } from './_util.ts';

const W = 1600;
const H = 1100;

/** Jagged crack: a wandering tapered ink stroke with optional side branches. */
function crack(r: Rng, start: Pt, dir: number, len: number, width: number, depth = 0): string {
  const pts: Pt[] = [start];
  let [x, y] = start;
  let a = dir;
  const steps = Math.max(3, Math.round(len / 18));
  let d = '';
  for (let i = 0; i < steps; i++) {
    a += range(r, -0.6, 0.6);
    a = lerp(a, dir, 0.35);
    x += Math.cos(a) * (len / steps);
    y += Math.sin(a) * (len / steps);
    pts.push([x, y]);
    if (depth < 1 && r() < 0.18) d += crack(r, [x, y], a + (r() < 0.5 ? -1 : 1) * range(r, 0.5, 1.1), len * range(r, 0.2, 0.4), width * 0.55, depth + 1);
  }
  return brush(pts, width, 0.5) + d;
}

/**
 * An upright broken column in local coordinates (base at y=0, growing to -len),
 * placed with a translate + rotate so hatching follows the shaft.
 */
function column(r: Rng, bx: number, by: number, angle: number, R: number, len: number, notchSide: -1 | 1): string {
  const L = len;
  // jagged broken top (left -> right)
  const top: Pt[] = [];
  const tn = 9;
  for (let i = 0; i <= tn; i++) {
    const u = i / tn;
    const x = -R + 2 * R * u;
    const big = Math.sin(u * Math.PI * 1.3 + 0.4) * 55;
    top.push([x, -L + big + range(r, -26, 26) + (i % 3 === 1 ? 18 : 0)]);
  }
  // notch bitten out of one flank below the break
  const ny0 = -L * 0.72;
  const ny1 = -L * 0.9;
  const nDepth = R * 0.42;
  const s = notchSide;
  const notch: Pt[] = [
    [s * R, ny0],
    [s * (R - nDepth * 0.55), ny0 - 30],
    [s * (R - nDepth), (ny0 + ny1) / 2 + 10],
    [s * (R - nDepth * 0.7), ny1 + 26],
    [s * R, ny1],
  ];
  const leftSide: Pt[] = s < 0 ? [[-R, 60], ...notch, [-R, top[0][1]]] : [[-R, 60], [-R, top[0][1]]];
  const rightSide: Pt[] = s > 0 ? [[R, top[tn][1]], ...notch.slice().reverse(), [R, 60]] : [[R, top[tn][1]], [R, 60]];
  const outline: Pt[] = [...leftSide, ...top.slice(1, -1), ...rightSide];
  const shaft = polyD(outline);

  let g = fillP(shaft, PAPER);
  let inner = '';
  // flutes: projected around the cylinder, bunching at the edges
  let flutes = '';
  let fluteShadow = '';
  for (let k = -5; k <= 5; k++) {
    const th = (k / 5.6) * (Math.PI / 2);
    const x = Math.sin(th) * R;
    flutes += `M${n(x)} 70V${n(-L - 80)}`;
    fluteShadow += `M${n(x + 3 + Math.cos(th) * 4)} 70V${n(-L - 80)}`;
  }
  inner += strokeP(flutes, INK, 1.6) + strokeP(fluteShadow, INK, 0.8, 0.7);
  // cylinder shading: light from the upper left
  let shade = '';
  for (let x = R * 0.05; x < R * 0.55; x += lerp(5, 2.4, x / (R * 0.55))) shade += `M${n(x)} 70V${n(-L - 80)}`;
  inner += strokeP(shade, INK, 1.1);
  inner += fillP(rectD(R * 0.55, -L - 100, R * 0.27, L + 200), INK);
  let rim = '';
  for (let x = R * 0.86; x < R; x += 3.4) rim += `M${n(x)} 70V${n(-L - 80)}`;
  inner += strokeP(rim, INK, 0.8);
  // drum joints (slightly curved: we look a little up at the shaft)
  let joints = '';
  for (let y = -150; y > -L + 40; y -= range(r, 150, 200)) {
    joints += `M${n(-R)} ${n(y)}Q0 ${n(y + R * 0.16)} ${n(R)} ${n(y)}`;
  }
  inner += strokeP(joints, INK, 2.6);
  // fractured top: exposed interior under the jagged rim, broken into facets of different values
  const band: Pt[] = top.map(([x, y], i) => [x + range(r, -6, 6), y + 34 + Math.abs(Math.sin(i * 1.7)) * 46 + range(r, 0, 18)]);
  const fills = ['url(#hatch-x)', INK, 'url(#hatch-d)', PAPER, 'url(#hatch-d-fine)', INK];
  for (let i = 0; i < tn; i++) {
    const mid: Pt = [(top[i][0] + top[i + 1][0]) / 2 + range(r, -8, 8), (band[i][1] + band[i + 1][1]) / 2 - range(r, 6, 20)];
    const f1 = polyD([top[i], top[i + 1], mid]);
    const f2 = polyD([top[i], mid, band[i]]);
    const f3 = polyD([mid, top[i + 1], band[i + 1], band[i]]);
    const lit = top[i][0] < R * 0.2;
    inner += fillP(f1, PAPER) + fillP(f1, lit ? fills[(i * 3) % 6] : INK);
    inner += fillP(f2, PAPER) + fillP(f2, fills[(i * 3 + 2) % 6]);
    inner += fillP(f3, PAPER) + fillP(f3, lit ? 'url(#hatch-x)' : INK);
    inner += strokeP(f1 + f2 + f3, INK, 1.4);
  }
  inner += strokeP(`M${band.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}`, INK, 2.8);
  // the notch's exposed faces
  const nFace = polyD([...notch, ...notch.slice().reverse().map(([x, y]) => [x - s * 26, y + 8] as Pt)]);
  inner += fillP(nFace, PAPER) + clipped(nFace, fillP(rectD(-R, ny1 - 40, 2 * R, ny0 - ny1 + 80), 'url(#hatch-d)'));
  // cracks
  let cr = '';
  cr += crack(r, [top[3][0], band[3][1]], Math.PI / 2 + 0.3, L * 0.45, 5);
  cr += crack(r, [top[6][0], band[6][1]], Math.PI / 2 - 0.4, L * 0.3, 4);
  cr += crack(r, [s * (R - nDepth), (ny0 + ny1) / 2], Math.PI / 2 + s * 0.6, L * 0.35, 4);
  cr += crack(r, [-R * 0.9, -L * 0.35], -0.2, R * 1.2, 3.5);
  cr += crack(r, [R * 0.7, -L * 0.18], Math.PI + 0.3, R * 1.1, 3);
  inner += fillP(cr, INK);
  g += clipped(shaft, inner);
  g += strokeP(shaft, INK, 6);
  return `<g transform="translate(${n(bx)} ${n(by)}) rotate(${n(angle)})">${g}</g>`;
}

/** A flying stone fragment with motion streaks trailing behind it. */
function fragment(r: Rng, x: number, y: number, size: number, dir: number, white: boolean, maxStreak = 1e9): string {
  const pts: Pt[] = [];
  const cnt = 4 + Math.floor(r() * 3);
  const rot = range(r, 0, Math.PI * 2);
  for (let i = 0; i < cnt; i++) {
    const a = rot + (i / cnt) * Math.PI * 2 + range(r, -0.3, 0.3);
    const rr = size * range(r, 0.55, 1.1);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * range(r, 0.6, 1)]);
  }
  const shape = polyD(pts);
  // streaks behind (opposite to the motion)
  let streaks = '';
  const back = dir + Math.PI;
  const lines = size > 14 ? 3 : 2;
  for (let i = 0; i < lines; i++) {
    const off = (i - (lines - 1) / 2) * size * 0.55;
    const sx = x + Math.cos(dir + Math.PI / 2) * off;
    const sy = y + Math.sin(dir + Math.PI / 2) * off;
    const len = Math.min(size * range(r, 3, 8), maxStreak);
    streaks += brush(
      [
        [sx + Math.cos(back) * size * 0.6, sy + Math.sin(back) * size * 0.6],
        [sx + Math.cos(back) * len * 0.5, sy + Math.sin(back) * len * 0.5],
        [sx + Math.cos(back) * len, sy + Math.sin(back) * len],
      ],
      Math.max(1.2, size * 0.14),
      0.5,
    );
  }
  let o = fillP(streaks, white ? INK : INK);
  if (white) {
    o += fillP(shape, PAPER);
    const half = polyD([pts[0], pts[1], pts[2], [x, y]]);
    o += clipped(shape, fillP(half, 'url(#hatch-d)'));
    o += strokeP(shape, INK, Math.max(1.4, size * 0.12));
  } else {
    o += fillP(shape, INK);
  }
  return o;
}

export default art({
  name: 'columns-broken',
  w: W,
  h: H,
  bg: RED,
  draw: () => {
    const r = rng(1066);
    let out = '';

    // sky: a few broad deep-red wind streaks along the blast direction
    let wind = '';
    for (let i = 0; i < 14; i++) {
      const x = range(r, -200, W);
      const y = range(r, 0, H);
      const len = range(r, 300, 900);
      const a = -0.55 + range(r, -0.08, 0.08);
      wind += brush([[x, y], [x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5], [x + Math.cos(a) * len, y + Math.sin(a) * len]], range(r, 6, 22), 0.6);
    }
    out += fillP(wind, RED_DEEP, 0.75);

    // background fragments (small, behind the columns)
    for (let i = 0; i < 26; i++) {
      out += fragment(r, range(r, 0, W), range(r, 0, H * 0.75), range(r, 3, 8), -0.55 + range(r, -0.3, 0.3), r() < 0.5);
    }

    out += column(r, 360, 1210, 15, 150, 1040, 1);
    out += column(r, 1330, 1230, -10, 128, 860, -1);

    // foreground debris bursting from the broken tops
    const burst = (cx: number, cy: number, baseDir: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const dir = baseDir + range(r, -0.7, 0.7);
        const dist = range(r, 30, 420);
        const x = cx + Math.cos(dir) * dist;
        const y = cy + Math.sin(dir) * dist;
        const size = range(r, 4, 30) * lerp(1, 0.45, dist / 420);
        out += fragment(r, x, y, size, dir, r() < 0.72, dist * 0.7);
      }
    };
    burst(620, 190, -1.0, 26);
    burst(1150, 350, -1.9, 20);
    // a scatter of mid-size chunks crossing the open sky between the columns
    for (let i = 0; i < 9; i++) {
      out += fragment(r, range(r, 650, 1100), range(r, 420, 1000), range(r, 8, 20), -0.6 + range(r, -0.25, 0.25), r() < 0.7, 140);
    }
    // drifting flecks across the whole sky
    let flecksW = '';
    let flecksB = '';
    for (let i = 0; i < 70; i++) {
      const x = range(r, 0, W);
      const y = range(r, 0, H);
      const len = range(r, 6, 26);
      const a = -0.55 + range(r, -0.15, 0.15);
      const d = brush([[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], range(r, 1.5, 3.4), 0.5);
      if (r() < 0.5) flecksW += d;
      else flecksB += d;
    }
    out += fillP(flecksW, PAPER) + fillP(flecksB, INK);
    return out;
  },
});
