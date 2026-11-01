import { DEFS, type ArtDef } from './kit.ts';

/**
 * Art registry. Every `src/art/{figures,scenes,props}/<name>.ts` module is
 * collected automatically; files starting with `_` are private helpers.
 */
const modules = import.meta.glob<{ default: ArtDef }>(
  ['./figures/*.ts', './scenes/*.ts', './props/*.ts', '!./**/_*.ts'],
  { eager: true },
);

export const ART: Record<string, ArtDef> = {};
for (const path in modules) {
  const def = modules[path].default;
  if (def && def.name) ART[def.name] = def;
}

const svgCache = new Map<string, string>();
/** Dev aid: add ?perf to log illustration generation/raster timings. */
export const PERF = import.meta.env.DEV && location.search.includes('perf');
/** Dev aid: add ?profile to fence GPU work with gl.finish() and record per-frame costs. */
export const PROFILE = import.meta.env.DEV && location.search.includes('profile');
export const profileLog = {
  frames: [] as { t: number; js: number; gpu: number; post: number; drawn: number; y: number }[],
  uploads: [] as { name: string; size: number; px: number; decode: number; draw: number; upload: number; t: number }[],
};
if (PROFILE) Object.assign(window, { __profile: profileLog });

/** Full standalone SVG (with pattern defs) for rasterising into a texture. */
export function artSvg(name: string): string | null {
  const def = ART[name];
  if (!def) return null;
  let svg = svgCache.get(name);
  if (!svg) {
    const t0 = PERF ? performance.now() : 0;
    const bg = def.bg ? `<rect width="${def.w}" height="${def.h}" fill="${def.bg}"/>` : '';
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w} ${def.h}" width="${def.w}" height="${def.h}">${DEFS}${bg}${def.draw()}</svg>`;
    svgCache.set(name, svg);
    if (PERF) console.warn(`[perf] draw ${name} ${(performance.now() - t0).toFixed(0)}ms`);
  }
  return svg;
}

/** Inline SVG markup for brand marks (stroke="currentColor"), safe to repeat in the DOM. */
export function markSvg(name: string, title?: string): string {
  const def = ART[name];
  if (!def) return '';
  const label = title ? `<title>${title}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w} ${def.h}" ${title ? 'role="img"' : 'aria-hidden="true"'} focusable="false">${label}${def.draw()}</svg>`;
}

export function artAspect(name: string): number {
  const def = ART[name];
  return def ? def.w / def.h : 1;
}
