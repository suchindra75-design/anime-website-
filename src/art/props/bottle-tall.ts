import { art, INK, PAPER, STONE, GREY, ACCENT, rng, range, brush, smooth, clipped, type Pt } from '../kit.ts';

/**
 * Tall cylindrical liqueur bottle. Everything coloured is ACCENT so the
 * engine can recolour it per flavour. Body spans x 55–245, y 230–960.
 */

const CX = 150;
const METAL = '#c3c0b8';
const METAL_DARK = '#5f5c56';

/** Vertical tapered engraving line. */
function vline(x: number, y0: number, y1: number, w: number, r: () => number): string {
  const pts: Pt[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    pts.push([x + range(r, -0.25, 0.25), y]);
  }
  return brush(pts, w, 0.25);
}

/** Front arc of a horizontal ring around a cylinder (sags towards the viewer). */
function ring(x0: number, x1: number, y: number, sag: number): string {
  const mx = (x0 + x1) / 2;
  return `M${x0} ${y}Q${mx} ${y + sag * 2} ${x1} ${y}`;
}

export default art({
  name: 'bottle-tall',
  w: 300,
  h: 1000,
  draw: () => {
    const r = rng(7);
    let s = '';

    // ---------------------------------------------------------------- shadow
    s += `<ellipse cx="${CX}" cy="962" rx="128" ry="7" fill="${INK}" opacity="0.55"/>`;
    s += `<ellipse cx="${CX}" cy="961" rx="104" ry="3.5" fill="${INK}"/>`;

    // ---------------------------------------------------------------- body
    const L = 55;
    const R = 245;
    const body = `M112 228C80 230 ${L} 246 ${L} 292L${L} 944Q${L} 960 71 960L229 960Q${R} 960 ${R} 944L${R} 292C${R} 246 220 230 188 228Z`;
    let inner = `<rect x="0" y="200" width="300" height="780" fill="${ACCENT}"/>`;

    // cylinder engraving: lines at equal angular steps → denser at edges
    const half = (R - L) / 2;
    let eng = '';
    const N = 72;
    let lastX = -1e9;
    for (let i = 0; i <= N; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / N;
      const sn = Math.sin(th);
      const x = CX + half * sn;
      const right = sn > 0;
      const thr = right ? 0.4 : 0.6;
      const soft = right ? 0.22 : 0.42; // broken hairlines between soft and thr
      const a = Math.abs(sn);
      if (a < soft) continue;
      if (a < thr) {
        // graduated tone: short broken hairlines
        let y = 300 + range(r, 0, 60);
        while (y < 920) {
          const len = range(r, 40, 140) * (0.6 + (a - soft) / (thr - soft));
          eng += vline(x, y, Math.min(920, y + len), 0.7 + (a - soft) * 1.6, r);
          y += len + range(r, 18, 70) * (1.2 - (a - soft) / (thr - soft));
        }
        continue;
      }
      const k = (a - thr) / (1 - thr); // 0 → 1 towards the edge
      const w = (right ? 1.2 : 0.9) + k * (right ? 3.0 : 1.6);
      if (x - lastX < 2.2 + w * 0.5 || x < L + 3 || x > R - 3) continue;
      lastX = x;
      const y0 = 262 + (1 - k) * 34 + range(r, -6, 6);
      const y1 = 946 - (1 - k) * 14 + range(r, -4, 4);
      eng += vline(x, y0, y1, w, r);
    }
    // a few extra interleaved strokes on the far right (shadow side)
    for (let i = 0; i < 2; i++) {
      const x = R - 9.5 - i * 5;
      eng += vline(x, 284 + i * 6, 948, 1, r);
    }
    inner += `<path d="${eng}" fill="${INK}"/>`;

    // shoulder contour hatching (curved strokes following the shoulder)
    let sh = '';
    for (let i = 0; i < 6; i++) {
      const y = 246 + i * 7;
      const xl = 70 + i * 6;
      const xr = 232 - i * 6;
      sh += brush(
        [
          [xr - 46, y + 18],
          [xr - 22, y + 8],
          [xr - 6, y + 2],
          [xr, y],
        ],
        2.2 - i * 0.2,
        0.6,
      );
      if (i < 3)
        sh += brush(
          [
            [xl, y + 4],
            [xl + 10, y + 7],
            [xl + 26, y + 14],
          ],
          1.6,
          0.6,
        );
    }
    inner += `<path d="${sh}" fill="${INK}"/>`;

    // thick glass base: a punt line and denser hatch beneath it
    inner += `<path d="M${L} 928Q${CX} 942 ${R} 928L${R} 962L${L} 962Z" fill="url(#hatch-h-fine)"/>`;
    inner += `<path d="${ring(L + 2, R - 2, 928, 7)}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    inner += `<path d="${ring(L + 18, R - 18, 938, 3.5)}" fill="none" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round"/>`;

    // highlight streaks
    const hl = (x: number, y0: number, y1: number, w: number) =>
      brush(
        [
          [x, y0],
          [x - 0.6, y0 + (y1 - y0) * 0.3],
          [x - 0.8, y0 + (y1 - y0) * 0.6],
          [x, y1],
        ],
        w,
        0.35,
      );
    let hi = '';
    hi += hl(84, 300, 548, 11);
    hi += hl(84, 654, 900, 11);
    hi += hl(99, 330, 540, 3.2);
    hi += hl(99, 668, 860, 3.2);
    hi += hl(214, 360, 520, 2.4);
    hi += hl(214, 690, 820, 2.4);
    // shoulder glint
    hi += brush(
      [
        [74, 284],
        [84, 260],
        [104, 244],
        [124, 238],
      ],
      6,
      0.6,
    );
    inner += `<path d="${hi}" fill="${PAPER}"/>`;
    // thin rim reflections just inside the glass walls
    inner += `<path d="M${R - 5} 300L${R - 5} 545M${R - 5} 655L${R - 5} 920M${L + 5} 310L${L + 5} 545M${L + 5} 655L${L + 5} 915" stroke="${PAPER}" stroke-width="1.3" opacity="0.85"/>`;

    // ---------------------------------------------------------------- label band
    const ly0 = 560;
    const ly1 = 640;
    const sag = 5;
    const label = `M${L} ${ly0}Q${CX} ${ly0 + sag * 2} ${R} ${ly0}L${R} ${ly1}Q${CX} ${ly1 + sag * 2} ${L} ${ly1}Z`;
    let lab = `<path d="${label}" fill="${INK}"/>`;
    lab += `<path d="${ring(L, R, ly0 + 7, sag)}M${L} ${ly1 - 7}Q${CX} ${ly1 - 7 + sag * 2} ${R} ${ly1 - 7}" fill="none" stroke="${PAPER}" stroke-width="1.4"/>`;
    lab += `<path d="${ring(L, R, ly0 + 11, sag)}M${L} ${ly1 - 11}Q${CX} ${ly1 - 11 + sag * 2} ${R} ${ly1 - 11}" fill="none" stroke="${PAPER}" stroke-width="0.7"/>`;
    // monogram: tiny oval with a stylised V
    const my = 604;
    let mono = `<ellipse cx="${CX}" cy="${my}" rx="15" ry="20" fill="none" stroke="${PAPER}" stroke-width="1.6"/>`;
    mono += `<ellipse cx="${CX}" cy="${my}" rx="11.5" ry="16.5" fill="none" stroke="${PAPER}" stroke-width="0.6"/>`;
    const v = brush(
      [
        [CX - 9, my - 11],
        [CX - 6.5, my - 4],
        [CX - 3, my + 5],
        [CX, my + 12],
      ],
      3.6,
      0.5,
    );
    const v2 = brush(
      [
        [CX, my + 12],
        [CX + 3, my + 2],
        [CX + 6, my - 6],
        [CX + 10, my - 12],
        [CX + 13, my - 13],
      ],
      1.8,
      0.6,
    );
    mono += `<path d="${v}${v2}" fill="${PAPER}"/>`;
    // little serif flick + side dots
    mono += `<path d="M${CX - 12} ${my - 11}Q${CX - 9} ${my - 13} ${CX - 6} ${my - 11}" fill="none" stroke="${PAPER}" stroke-width="1.2" stroke-linecap="round"/>`;
    for (const dx of [-34, -26, 26, 34]) mono += `<circle cx="${CX + dx}" cy="${my + (Math.abs(dx) > 30 ? 0 : 0)}" r="${Math.abs(dx) > 30 ? 1.3 : 2}" fill="${PAPER}"/>`;
    mono += `<path d="M${CX - 82} ${my}H${CX - 42}M${CX + 42} ${my}H${CX + 82}" stroke="${PAPER}" stroke-width="0.8"/>`;
    lab += mono;
    // glossy reflection carried across the label
    lab += `<path d="${hl(84, 566, 636, 5)}" fill="${GREY}" opacity="0.8"/>`;
    inner += lab;

    s += clipped(body, inner);
    s += `<path d="${body}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;

    // ---------------------------------------------------------------- neck
    const nx0 = 113;
    const nx1 = 187;
    const neck = `M${nx0} 146L${nx1} 146L${nx1 + 1} 232L${nx0 - 1} 232Z`;
    let nk = `<rect x="100" y="140" width="100" height="100" fill="${STONE}"/>`;
    nk += `<rect x="166" y="140" width="34" height="100" fill="url(#hatch-v-fine)"/>`;
    nk += `<rect x="178" y="140" width="22" height="100" fill="${GREY}" opacity="0.5"/>`;
    let ribs = '';
    for (let y = 156; y < 230; y += 8) ribs += ring(nx0, nx1, y, 2.2);
    nk += `<path d="${ribs}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    // little shadow under each rib on the right
    let ribsh = '';
    for (let y = 156; y < 230; y += 8) ribsh += `M${CX + 18} ${y + 4.4}Q${CX + 28} ${y + 4.2} ${nx1} ${y + 2}`;
    nk += `<path d="${ribsh}" fill="none" stroke="${INK}" stroke-width="0.8"/>`;
    nk += `<path d="${brush([[124, 152], [123, 190], [124, 226]], 4, 0.4)}" fill="#ffffff"/>`;
    s += clipped(neck, nk);
    s += `<path d="${neck}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;

    // ---------------------------------------------------------------- stopper
    // skirt (ribbed cylinder) y 98–150
    const kx0 = 90;
    const kx1 = 210;
    const skirt = `M${kx0} 98L${kx1} 98L${kx1} 146Q${CX} 154 ${kx0} 146Z`;
    let sk = `<rect x="80" y="90" width="140" height="70" fill="${METAL}"/>`;
    let flutes = '';
    const kh = (kx1 - kx0) / 2;
    for (let i = 1; i < 26; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / 26;
      const sn = Math.sin(th);
      const x = CX + kh * sn;
      const w = 1 + Math.abs(sn) * 1.4 + (sn > 0 ? 0.8 : 0);
      flutes += brush(
        [
          [x, 101],
          [x, 120],
          [x, 145 + 3 * Math.cos(th)],
        ],
        w,
        0.15,
      );
    }
    sk += `<path d="${flutes}" fill="${INK}"/>`;
    sk += `<path d="M172 90Q164 125 176 160L220 160L220 90Z" fill="url(#hatch-d-fine)"/>`;
    sk += `<path d="M194 90Q188 125 198 160L220 160L220 90Z" fill="${METAL_DARK}" opacity="0.55"/>`;
    sk += `<path d="${brush([[110, 102], [109, 124], [110, 146]], 5, 0.3)}" fill="${PAPER}"/>`;
    s += clipped(skirt, sk);
    s += `<path d="${skirt}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    // collar lip at the bottom of the skirt
    s += `<path d="M${kx0 - 4} 142Q${CX} 151 ${kx1 + 4} 142L${kx1 + 4} 148Q${CX} 158 ${kx0 - 4} 148Z" fill="${METAL}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="M${CX + 30} 152Q${CX + 50} 150 ${kx1 + 3} 146" fill="none" stroke="${INK}" stroke-width="2"/>`;

    // dome y 36–100
    const DR = 64;
    const dTop = 36;
    const dBase = 100;
    const dw = (y: number) => DR * Math.sqrt(Math.max(0, 1 - ((dBase - y) / (dBase - dTop)) ** 2));
    const domePts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const y = dBase - ((dBase - dTop) * i) / 24;
      domePts.push([CX - dw(y), y]);
    }
    for (let i = 24; i >= 0; i--) {
      const y = dBase - ((dBase - dTop) * i) / 24;
      domePts.push([CX + dw(y), y]);
    }
    const dome = smooth(domePts, true, 0.5);
    let dm = `<rect x="70" y="20" width="160" height="90" fill="${METAL}"/>`;
    // meridian ribs
    let mer = '';
    for (let i = 1; i < 16; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / 16;
      const sn = Math.sin(th);
      const pts: Pt[] = [];
      for (let j = 0; j <= 10; j++) {
        const y = dTop + 6 + ((dBase - dTop - 6) * j) / 10;
        pts.push([CX + dw(y) * sn, y]);
      }
      mer += brush(pts, 1 + Math.abs(sn) * 1.2 + (sn > 0 ? 0.6 : 0), 0.5);
    }
    dm += `<path d="${mer}" fill="${INK}"/>`;
    // engraved band: two rings with a scallop pattern between them
    const band0 = 78;
    const band1 = 92;
    dm += `<path d="${ring(CX - dw(band0), CX + dw(band0), band0, 3)}${ring(CX - dw(band1), CX + dw(band1), band1, 3.6)}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    let scal = '';
    for (let i = 1; i < 14; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / 14;
      const th2 = -Math.PI / 2 + (Math.PI * (i + 1)) / 14;
      const ym = (band0 + band1) / 2 + 3;
      const xa = CX + dw(ym) * Math.sin(th);
      const xb = CX + dw(ym) * Math.sin(th2);
      if (i === 13) break;
      scal += `M${xa.toFixed(1)} ${ym - 4}Q${((xa + xb) / 2).toFixed(1)} ${ym + 6} ${xb.toFixed(1)} ${ym - 4}`;
    }
    dm += `<path d="${scal}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
    dm += `<path d="M150 30C176 40 178 80 172 110L230 110L230 20Z" fill="url(#hatch-d-fine)"/>`;
    dm += `<path d="M168 30C194 44 198 80 194 110L230 110L230 20Z" fill="${METAL_DARK}" opacity="0.55"/>`;
    dm += `<path d="${brush(
      [
        [104, 92],
        [108, 70],
        [120, 52],
        [134, 44],
      ],
      7,
      0.6,
    )}" fill="${PAPER}"/>`;
    s += clipped(dome, dm);
    s += `<path d="${dome}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    // ring between dome and skirt
    s += `<path d="M${kx0 - 6} 96Q${CX} 106 ${kx1 + 6} 96L${kx1 + 6} 101Q${CX} 111 ${kx0 - 6} 101Z" fill="${METAL}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;

    // finial knob
    s += `<ellipse cx="${CX}" cy="38" rx="16" ry="4" fill="${METAL}" stroke="${INK}" stroke-width="2.4"/>`;
    s += `<circle cx="${CX}" cy="28" r="10" fill="${METAL}" stroke="${INK}" stroke-width="2.8"/>`;
    s += `<path d="M${CX + 2} 21A8 8 0 0 1 ${CX + 8} 33" fill="none" stroke="${INK}" stroke-width="3"/>`;
    s += `<circle cx="${CX - 4}" cy="25" r="2.6" fill="${PAPER}"/>`;

    return s;
  },
});
