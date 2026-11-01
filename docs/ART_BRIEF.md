# Illustration brief (shared by all art modules)

## What we are building
A scroll-driven manga/comic storytelling website (recreation of the *style* of an
award-winning WebGL site). All artwork is ORIGINAL and drawn in code as SVG.
Visual language: Japanese horror-manga / engraving ink — think Junji Ito meets Moebius:
bold black ink contours made from tapered brush strokes, engraving-style parallel
hatching for shading, screentone dots, flat spot colours. Strong graphic silhouettes.
Off-white paper, vermilion red, deep maroon, khaki robes, one "accent" colour.

## Contract
Each artwork is one file `src/art/<group>/<name>.ts` with a default export:

```ts
import { art, INK, PAPER, RED, ACCENT, rng, brush, smooth, hatchLines, clipped /* ... */ } from '../kit.ts';
export default art({ name: '<name>', w: 1600, h: 1000, bg: PAPER /* omit for transparent */, draw: () => {
  const r = rng(42);            // deterministic randomness only (never Math.random)
  return `...svg markup in viewBox units...`;
}});
```
- Import with the explicit `.ts` extension (`'../kit.ts'`). Read `src/art/kit.ts` first —
  it has the palette, pattern ids (`url(#hatch-v)`, `url(#hatch-d)`, `url(#hatch-x)`, `url(#tone)`, `url(#tone-fine)`,
  `url(#tone-heavy)`, `url(#tone-white)`, `#hatch-h`, `*-fine` variants), and helpers: `brush()` (tapered ink stroke → filled path),
  `smooth()`, `poly()`, `wobble()`, `segment()`, `inkLine()`, `roughRect()`, `speedLines()`, `hatchLines()`, `clipped()`, `id()`, `rng()`, `range()`.
  You may add small private helpers inside your own files; do NOT edit kit.ts (others depend on it). If you need a
  shared helper, put it in `src/art/<group>/_util.ts` (underscore files are ignored by the registry).
- Static SVG only: no `<text>` unless the spec asks, no `<image>`, no external refs, no CSS/SMIL animation,
  no `<filter>` (too slow when rasterised). Gradients are allowed but use sparingly — ink art is flat.
- `ACCENT` (#ff00ff) is a key colour swapped at runtime for the visitor's chosen flavour colour.
  Use it ONLY where the spec says "ACCENT", and only adjacent to black/white/grey (hatching/tone over it is good).
- Transparent artworks (no `bg`) are layered over other plates: leave everything outside the subject empty.
- Keep each generated SVG under ~300 KB (the preview script prints the size). Prefer fewer, bolder strokes
  over thousands of hairlines. Line weights: contours 3–8 units, hatching 0.8–2 units at 1600-wide scale.
- Fill the whole viewBox for opaque scenes; respect the composition notes (figures are overlaid later).
- TypeScript strict mode (no unused locals/params).

## Preview loop (do this for EVERY artwork, iterate until it looks good)
```bash
cd "/Users/apple/anime website " && node scripts/render-art.ts "<your scratch dir>" src/art/<group>/<name>.ts
```
Then Read the produced `<name>.svg.png` image to look at it (Quick Look pads to a square; ignore the white padding).
Judge it honestly: readable silhouette, convincing anatomy/perspective, manga ink feel, not clip-art.
Iterate 2–4 times per piece. Anatomy (hands, faces) deserves the most iterations.

Type-check your files when done:
```bash
cd "/Users/apple/anime website " && npx tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUnusedLocals --noUnusedParameters src/art/<group>/*.ts
```

## Palette (from kit.ts)
INK #141210 · PAPER #efece4 · PAPER_SHADE #dedad0 · RED #c82924 · RED_DEEP #a8231f · MAROON #592223 ·
KHAKI #b49a68 · KHAKI_DEEP #8c7449 · SKIN #e9ddd0 · STONE #f4f2ec · GREY #8d8a83 · ACCENT #ff00ff ·
FLAVOR_BLUE #6fb3e6 · FLAVOR_GREEN #86cf6a · FLAVOR_YELLOW #f1cf3a

## The protagonist ("the saint")
Androgynous, very long straight black hair (below the shoulders), gaunt calm face, ankle-length heavy draped robe
with wide sleeves; the robe has two dark horizontal trim bands near the hem and on the sleeves. Barefoot.
Default robe colour KHAKI with INK folds and KHAKI_DEEP/hatching for shadows. After drinking, the robe is ACCENT.
