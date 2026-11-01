import { art, INK, PAPER, rng, range, smooth, brush, clipped, hatchLines, type Pt, type Rng } from '../kit.ts';
import { fillP, strokeP, ribbon, pl, polyD, rectD, clamp, n } from './_util.ts';

const W = 1600;
const H = 700;
const HOR = 430;

/** Long lens-shaped screentone cloud band. */
function cloudBand(r: Rng, x0: number, x1: number, cy: number, thick: number): string {
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = x0 + (x1 - x0) * u;
    const env = Math.pow(Math.sin(Math.PI * u), 0.55);
    const bump = 0.65 + 0.45 * Math.abs(Math.sin(u * 9 + range(r, -0.4, 0.4)));
    top.push([x, cy - thick * env * bump]);
    bot.push([x, cy + thick * 0.28 * env]);
  }
  const shape = smooth([...top, ...bot.slice(1, -1).reverse()], true, 0.5);
  // flat inked underside, broken
  const under = bot.filter((_, i) => i > 2 && i < steps - 2);
  return (
    fillP(shape, 'url(#tone-fine)') +
    fillP(brush(under.map(([x, y]) => [x, y + 0.5] as Pt), 2.2, 0.8), INK)
  );
}

/** Broken pillar silhouette standing on the horizon. */
function pillar(r: Rng, x: number, w: number, h: number): string {
  const base = HOR + 2;
  const topL = base - h * range(r, 0.85, 1);
  const topR = base - h * range(r, 0.7, 1);
  const pts: Pt[] = [
    [x - w * 0.62, base],
    [x - w * 0.55, base - 4],
    [x - w / 2, base - 6],
    [x - w / 2, topL],
    [x - w * 0.15, topL - range(r, 2, 7)],
    [x + w * 0.1, (topL + topR) / 2 + range(r, -3, 4)],
    [x + w / 2, topR],
    [x + w / 2, base - 6],
    [x + w * 0.55, base - 4],
    [x + w * 0.62, base],
  ];
  // thin paper flute lines to show the drum
  let flutes = '';
  for (let i = 1; i < 3; i++) {
    const fx = x - w / 2 + (w * i) / 3;
    flutes += `M${n(fx)} ${n(base - 8)}V${n(Math.max(topL, topR) + 4)}`;
  }
  return fillP(polyD(pts), INK) + strokeP(flutes, PAPER, 0.7, 0.55);
}

export default art({
  name: 'desert-ruins',
  w: W,
  h: H,
  bg: PAPER,
  draw: () => {
    const r = rng(1307);
    let out = '';

    // ---------------------------------------------------------------- sky
    out += cloudBand(r, 840, 1680, 74, 30);
    out += cloudBand(r, -80, 560, 132, 22);
    out += cloudBand(r, 1040, 1660, 214, 13);
    out += cloudBand(r, 120, 760, 268, 7);
    out += cloudBand(r, 860, 1380, 352, 6);
    // a couple of long wind streaks
    out += fillP(brush([[180, 300], [520, 298], [880, 301]], 1.6, 0.7), INK);
    out += fillP(brush([[860, 372], [1010, 371], [1150, 373]], 1.3, 0.7), INK);

    // --------------------------------------------------------- far ruins
    // faint very distant ruin in tone
    out += fillP(polyD([[936, HOR + 2], [938, HOR - 26], [946, HOR - 29], [950, HOR - 22], [951, HOR + 2]]), 'url(#hatch-v-fine)');
    out += fillP(polyD([[968, HOR + 2], [970, HOR - 15], [977, HOR - 13], [979, HOR + 2]]), 'url(#hatch-v-fine)');
    let ruins = '';
    ruins += pillar(r, 1072, 15, 64);
    ruins += pillar(r, 1098, 14, 40);
    ruins += pillar(r, 1236, 19, 112);
    ruins += pillar(r, 1282, 19, 96);
    ruins += pillar(r, 1330, 20, 128);
    ruins += pillar(r, 1378, 20, 124);
    ruins += pillar(r, 1424, 18, 58);
    // lintel resting on the two tall pillars, broken off at the right
    ruins += fillP(
      polyD([[1312, HOR - 124], [1404, HOR - 127], [1418, HOR - 121], [1407, HOR - 112], [1395, HOR - 108], [1310, HOR - 106]]),
      INK,
    );
    // fallen lintel block leaning at the foot
    ruins += fillP(polyD([[1180, HOR + 2], [1196, HOR - 20], [1224, HOR - 14], [1214, HOR + 2]]), INK);
    // broken arch on the far right: two piers, keystone section fallen
    {
      const cx = 1526;
      const sy = HOR - 62;
      const band = (aa: number, ab: number) => {
        const o: Pt[] = [];
        const iN: Pt[] = [];
        for (let i = 0; i <= 8; i++) {
          const a = aa + ((ab - aa) * i) / 8;
          o.push([cx + Math.cos(a) * 42, sy + Math.sin(a) * 42]);
          iN.push([cx + Math.cos(a) * 28, sy + Math.sin(a) * 29]);
        }
        return { o, i: iN.reverse() };
      };
      const lb = band(Math.PI, Math.PI * 1.38);
      ruins += fillP(polyD([[cx - 42, HOR + 2], ...lb.o, ...lb.i, [cx - 28, HOR + 2]]), INK);
      const rb = band(Math.PI * 1.6, Math.PI * 2);
      ruins += fillP(polyD([...rb.o, [cx + 42, HOR + 2], [cx + 28, HOR + 2], ...rb.i]), INK);
    }
    // rubble mound along the base
    {
      const mound: Pt[] = [[1030, HOR + 2]];
      for (let x = 1040; x <= 1590; x += 14) mound.push([x, HOR + 1 - Math.abs(Math.sin(x * 0.05)) * range(r, 2, 8)]);
      mound.push([1600, HOR + 2]);
      ruins += fillP(smooth(mound, true, 0.4), INK);
    }
    out += ruins;

    // ------------------------------------------------------- dune field
    // Painter's algorithm: flat ground lines and dune bodies are sorted by
    // their base depth (screen y) and drawn far -> near.
    type Item = { y: number; svg: () => string };
    const items: Item[] = [];
    const calmAt = (x: number) => clamp(1 - Math.max(0, Math.max(380 - x, x - 720)) / 120, 0, 1);

    // flat ground lines (fine, wavy, broken into drifting patches)
    const L = 30;
    for (let i = 1; i <= L; i++) {
      const u = Math.pow(i / L, 1.8);
      const Y = HOR + 1.5 + 272 * u;
      const ph = range(r, 0, 6.28);
      const ph2 = range(r, 0, 6.28);
      const patch = range(r, 0, 6.28);
      items.push({
        y: Y,
        svg: () => {
          let d = '';
          let run: Pt[] = [];
          const flush = () => {
            if (run.length > 1) d += smooth(run, false, 0.5);
            run = [];
          };
          for (let x = -20; x <= W + 20; x += 26) {
            const amp = (0.5 + u * 6) * (1 - 0.6 * calmAt(x));
            const p: Pt = [x, Y + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.017 + ph2) * amp * 0.35];
            const present = Math.sin(x * 0.0045 + patch) + Math.sin(x * 0.011 + patch * 2) * 0.5 > -0.55 - u * 0.6;
            const skip = (calmAt(x) > 0.5 && u > 0.3 && i % 2 === 0) || !present;
            if (skip) {
              flush();
              continue;
            }
            run.push(p);
            if (r() < 0.04) flush();
          }
          flush();
          return strokeP(d, INK, 0.7 + u * 0.55);
        },
      });
    }

    // dunes: crest rises from x0 to peak xp, falls to x1; slip face (shadow) right of the peak down to foot xf
    const dune = (base: number, x0: number, x1: number, xp: number, hpk: number, xf: number, weight: number) => {
      const wob = range(r, 0, 6.28);
      const crestY = (x: number) => {
        let t: number;
        if (x <= xp) {
          t = clamp((x - x0) / (xp - x0), 0, 1);
          t = t * t * (3 - 2 * t);
          t = Math.pow(t, 1.3);
        } else {
          t = clamp(1 - (x - xp) / (x1 - xp), 0, 1);
          t = Math.pow(t * t * (3 - 2 * t), 0.9);
        }
        return base - hpk * t + Math.sin(x * 0.03 + wob) * hpk * 0.025 * t;
      };
      const crest: Pt[] = [];
      for (let x = x0; x <= x1; x += 12) crest.push([x, crestY(x)]);
      if (crest[crest.length - 1][0] < x1) crest.push([x1, crestY(x1)]);
      if (!crest.some(([x]) => x === xp)) {
        crest.push([xp, crestY(xp)]);
        crest.sort((a, b) => a[0] - b[0]);
      }
      const yp = crestY(xp);
      const boundary: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        boundary.push([xp + (xf - xp) * Math.pow(t, 0.75) + Math.sin(t * Math.PI) * (xf - xp) * 0.08, yp + (base - yp) * Math.pow(t, 0.85)]);
      }
      const body = polyD([...crest, [x1, base + 2], [x0, base + 2]]);
      const litPoly = polyD([...crest.filter(([x]) => x <= xp), ...boundary, [x0, base + 2]]);
      const shadePoly = polyD([...crest.filter(([x]) => x >= xp), ...boundary.slice().reverse()]);
      items.push({
        y: base,
        svg: () => {
          let o = fillP(body, PAPER);
          // windward contour lines, flattening towards the base
          let contours = '';
          const m = Math.max(4, Math.round(hpk / 6));
          for (let j = 1; j <= m; j++) {
            const a = Math.pow(j / (m + 1), 0.8);
            const pts: Pt[] = crest.map(([x, y]) => [x, y + (base - y) * a + Math.sin(x * 0.02 + j) * 0.8]);
            let run: Pt[] = [];
            for (const p of pts) {
              run.push(p);
              if (r() < 0.06) {
                if (run.length > 1) contours += pl(run);
                run = [];
              }
            }
            if (run.length > 1) contours += pl(run);
          }
          o += clipped(litPoly, strokeP(contours, INK, 0.75 * weight + 0.2));
          // slip face: dense fall-line hatching, solid near the crest
          const sh = hatchLines(xp - 10, yp - 10, x1 - xp + 20, base - yp + 20, 3.2, 62, r, 0.4);
          const span = (x1 - xp) * 0.6;
          const top = crest.filter(([x]) => x >= xp && x <= xp + span);
          const solid = polyD([
            ...top,
            ...top
              .slice()
              .reverse()
              .map(([x, y]) => [x - 2, y + 1 + hpk * 0.13 * Math.pow(Math.sin(Math.PI * Math.min(1, (x - xp) / span)), 0.8)] as Pt),
          ]);
          o += clipped(shadePoly, strokeP(sh, INK, 1.1 * weight) + fillP(solid, INK));
          // inked crest: heavier over the shadow side
          o += fillP(
            ribbon(crest, (t) => {
              const x = x0 + (x1 - x0) * t;
              const side = x > xp ? 1.6 : 0.8;
              return (0.5 + Math.sin(Math.PI * t) * 2.6 * side) * weight;
            }, 0.4, false),
            INK,
          );
          o += strokeP(pl(boundary), INK, 0.9 * weight);
          return o;
        },
      });
    };
    dune(450, -70, 520, 170, 28, 270, 0.8);
    dune(462, 600, 1060, 880, 16, 950, 0.7);
    dune(502, 1000, 1720, 1330, 50, 1440, 0.95);
    dune(548, -90, 390, 80, 64, 200, 1.05);
    dune(590, 300, 860, 600, 12, 680, 0.55);
    dune(690, 820, 1720, 1430, 140, 1530, 1.35);
    dune(716, -90, 330, 40, 92, 150, 1.3);

    items.sort((a, b) => a.y - b.y);
    for (const it of items) out += it.svg();

    // ------------------------------------------------------ foreground
    const stone = (cx: number, cy: number, s: number): string => {
      const pts: Pt[] = [];
      const cnt = 7;
      for (let i = 0; i < cnt; i++) {
        const a = Math.PI + (i / (cnt - 1)) * Math.PI;
        pts.push([cx + Math.cos(a) * s * range(r, 0.85, 1.15), cy + Math.sin(a) * s * range(r, 0.45, 0.75)]);
      }
      pts.push([cx + s * 0.9, cy + s * 0.08], [cx - s * 0.9, cy + s * 0.1]);
      const body = smooth(pts, true, 0.3);
      const shadow = brush([[cx - s * 0.4, cy + s * 0.12], [cx + s * 0.6, cy + s * 0.16], [cx + s * 2.2, cy + s * 0.1]], s * 0.22, 0.6);
      const shade = clipped(body, strokeP(hatchLines(cx, cy - s, s * 1.2, s * 1.4, 2.6, 70, r, 0.3), INK, 1));
      return fillP(shadow, INK) + fillP(body, PAPER) + shade + strokeP(body, INK, Math.max(1.4, s * 0.09));
    };
    out += stone(250, 690, 13);
    out += stone(300, 682, 6);
    out += stone(905, 676, 10);
    out += stone(1010, 650, 7);

    // half-buried broken column stump on the big right dune
    {
      const cx = 1190;
      const rad = 30;
      const baseY = 632;
      // slanted fracture: high on the left, low on the right, with a few jags
      const breakPts: Pt[] = [
        [cx - rad, 514],
        [cx - rad * 0.55, 520],
        [cx - rad * 0.35, 512],
        [cx - rad * 0.05, 530],
        [cx + rad * 0.3, 536],
        [cx + rad * 0.5, 548],
        [cx + rad * 0.8, 546],
        [cx + rad, 560],
      ];
      const outline: Pt[] = [[cx - rad, baseY], ...breakPts, [cx + rad, baseY]];
      const body = polyD(outline);
      let flutes = '';
      for (let j = 1; j < 6; j++) {
        const fx = cx - rad + (2 * rad * j) / 6;
        const topAt = breakPts.reduce((acc, [bx, by]) => (Math.abs(bx - fx) < Math.abs(acc[0] - fx) ? [bx, by] : acc), breakPts[0])[1];
        flutes += `M${n(fx)} ${n(baseY)}V${n(topAt + 10)}`;
      }
      // fracture face seen from slightly above
      const face = polyD([...breakPts, [cx + rad * 0.6, 566], [cx, 548], [cx - rad * 0.6, 528]]);
      const shade = clipped(rectD(cx + rad * 0.2, 470, rad, 200), strokeP(hatchLines(cx + rad * 0.2, 470, rad, 200, 2.6, 90, r, 0.3), INK, 1.1));
            out += fillP(body, PAPER);
      out += clipped(body, strokeP(flutes, INK, 1) + shade + fillP(polyD([[cx + rad * 0.66, 480], [cx + rad + 2, 480], [cx + rad + 2, baseY], [cx + rad * 0.66, baseY]]), INK));
      out += fillP(face, PAPER) + clipped(face, strokeP(hatchLines(cx - rad, 500, rad * 2, 70, 3.2, 28, r, 0.4), INK, 0.9));
      out += strokeP(polyD(outline), INK, 3);
      out += strokeP(face, INK, 1.5);
      // sand drift around the foot
      const drift: Pt[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        drift.push([cx - rad - 46 + (2 * rad + 100) * t, baseY - 4 - Math.sin(t * Math.PI) * 16 + Math.sin(t * 9) * 2]);
      }
      const under = drift.map(([x], i) => [x, baseY + 6 + Math.sin((i / 10) * Math.PI) * 4] as Pt).reverse();
      out += fillP(smooth([...drift, ...under], true, 0.4), PAPER);
      out += fillP(brush(drift, 3, 0.5), INK);
      out += strokeP(smooth(drift.slice(1, 9).map(([x, y]) => [x + 6, y + 5] as Pt)) + smooth(drift.slice(3, 10).map(([x, y]) => [x + 4, y + 10] as Pt)), INK, 0.8);
      out += fillP(polyD([[cx + rad, baseY - 12], [cx + rad + 40, baseY - 2], [cx + rad + 6, baseY - 4]]), INK);
    }

    // sparse foreground hatch tufts
    let tufts = '';
    const tuft = (x: number, y: number, cnt: number, len: number) => {
      for (let i = 0; i < cnt; i++) {
        const ox = x + i * range(r, 4, 6);
        tufts += `M${n(ox)} ${n(y + range(r, -2, 2))}l${n(len * 0.55)} ${n(len * range(r, 0.15, 0.3))}`;
      }
    };
    tuft(210, 690, 9, 22);
    tuft(880, 690, 6, 18);
    tuft(1070, 640, 5, 14);
    out += strokeP(tufts, INK, 1.1);

    return out;
  },
});
