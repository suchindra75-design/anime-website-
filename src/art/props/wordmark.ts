import { art } from '../kit.ts';

/**
 * "Vigilia Spirits" — hand-lettered monoline deco script, drawn as strokes
 * (no fonts). Tall looping V with "igilia" small and upright on the upper
 * line; "Spirits" on a second line under the V, led by an elongated S.
 */

/** Lowercase glyphs in x-height units: baseline y=0, x-height y=-1; each starts at (0,0). */
interface Glyph {
  d: string;
  w: number;
}

const G: Record<string, Glyph> = {
  i: { d: 'M0 0C0.1 -0.3 0.2 -0.7 0.26 -1L0.26 -0.22C0.26 -0.05 0.36 0 0.56 0M0.25 -1.42L0.33 -1.52', w: 0.56 },
  g: {
    d:
      'M0 0C0.2 -0.4 0.5 -0.95 0.86 -0.96C0.5 -1.06 0.18 -0.85 0.18 -0.48C0.18 -0.1 0.52 0.04 0.72 -0.16' +
      'C0.82 -0.28 0.86 -0.55 0.88 -1L0.88 0.62C0.88 1.02 0.42 1.04 0.42 0.74C0.42 0.42 0.86 0.14 1.2 0',
    w: 1.2,
  },
  l: { d: 'M0 0C0.22 -0.5 0.48 -1.5 0.52 -2.1C0.55 -2.5 0.28 -2.54 0.24 -2.2C0.2 -1.7 0.24 -0.6 0.26 -0.22C0.26 -0.05 0.36 0 0.56 0', w: 0.56 },
  a: {
    d:
      'M0 0C0.2 -0.4 0.5 -0.95 0.86 -0.96C0.5 -1.06 0.18 -0.85 0.18 -0.48C0.18 -0.1 0.52 0.04 0.72 -0.16' +
      'C0.82 -0.28 0.86 -0.55 0.88 -1L0.88 -0.22C0.88 -0.05 0.98 0 1.2 0',
    w: 1.2,
  },
  p: {
    d: 'M0 0C0.1 -0.3 0.2 -0.7 0.26 -1L0.26 0.7L0.26 -0.52C0.34 -0.92 0.86 -1.06 0.88 -0.52C0.9 -0.06 0.5 0.06 0.26 -0.12C0.5 -0.03 0.8 0 1.08 0',
    w: 1.08,
  },
  r: { d: 'M0 0C0.1 -0.3 0.2 -0.7 0.26 -1L0.26 0M0.26 -0.6C0.34 -0.9 0.5 -1.02 0.64 -1C0.74 -0.98 0.8 -0.92 0.82 -0.86', w: 0.86 },
  t: { d: 'M0 0C0.12 -0.4 0.24 -1.2 0.28 -1.75L0.28 -0.22C0.28 -0.05 0.38 0 0.58 0M0.02 -1L0.6 -1', w: 0.62 },
  s: { d: 'M0 0C0.16 -0.4 0.34 -0.86 0.44 -1C0.58 -0.72 0.74 -0.48 0.72 -0.24C0.7 0.04 0.32 0.06 0.14 -0.08', w: 0.82 },
};

/** Transforms glyph path data (absolute M/L/C only) into place. */
const STRETCH = 1.24; // extended deco proportions
const OFFSET = 89; // centres the lockup in the 520-wide box

function place(d: string, x0: number, y0: number, s: number): string {
  return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_m, a: string, b: string) => {
    const x = x0 + parseFloat(a) * s * STRETCH;
    const y = y0 + parseFloat(b) * s;
    return `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`;
  });
}

function word(text: string, x: number, y: number, s: number, track = 0): { d: string; x: number } {
  let d = '';
  for (const ch of text) {
    const g = G[ch];
    d += place(g.d, x, y, s);
    x += (g.w + track) * s * STRETCH;
  }
  return { d, x };
}

export default art({
  name: 'wordmark',
  w: 520,
  h: 200,
  draw: () => {
    let d = '';
    // ---- line 1: tall looping V + "igilia"
    const B1 = 98;
    d +=
      'M44 46C28 36 32 12 52 14C68 16 80 58 100 98' + // entry loop into the left arm, down to the vertex
      'C114 64 136 24 168 8C180 2 190 8 185 18C180 28 162 24 170 10'; // right arm rising high, closing in a loop
    d += word('igilia', 150, B1, 29).d;

    // ---- line 2: elongated S + "pirits"
    const B2 = 176;
    d +=
      'M118 126C124 116 116 106 100 106C84 106 72 116 76 128C80 140 98 142 112 150C124 158 124 170 112 178' +
      'C98 188 62 190 38 180C24 174 20 164 30 160';
    d += word('pirits', 130, B2, 29).d;

    return `<path transform="translate(${OFFSET} 0)" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  },
});
