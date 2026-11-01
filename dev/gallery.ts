// Dev-only contact sheet of every illustration: /dev/gallery.html?group=figures&h=420
import { ART, artSvg } from '../src/art/index.ts';

const params = new URLSearchParams(location.search);
const group = params.get('group');
const only = params.get('only')?.split(',');
document.documentElement.style.setProperty('--h', `${params.get('h') ?? 360}px`);
const grid = document.getElementById('grid')!;
const modules = import.meta.glob('../src/art/*/*.ts');
const groupOf = new Map<string, string>();
for (const path of Object.keys(modules)) {
  const [, , , g, file] = path.split('/');
  groupOf.set(file.replace('.ts', ''), g);
}
for (const name of Object.keys(ART).sort()) {
  if (group && groupOf.get(name) !== group) continue;
  if (only && !only.includes(name)) continue;
  const fig = document.createElement('figure');
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([artSvg(name)!], { type: 'image/svg+xml' }));
  fig.append(img, Object.assign(document.createElement('figcaption'), { textContent: `${name} ${ART[name].w}×${ART[name].h}` }));
  grid.append(fig);
}
