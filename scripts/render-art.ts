/**
 * Preview helper for illustrations.
 *   node scripts/render-art.ts <outDir> <path/to/art.ts> [more.ts...]
 * Writes <name>.svg and a <name>.svg.png Quick Look render into outDir.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { svgDocument, type ArtDef } from '../src/art/kit.ts';

const [outDir, ...files] = process.argv.slice(2);
if (!outDir || files.length === 0) {
  console.error('usage: node scripts/render-art.ts <outDir> <art.ts...>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
for (const file of files) {
  const mod = (await import(pathToFileURL(resolve(file)).href)) as { default: ArtDef };
  const def = mod.default;
  const svg = svgDocument(def);
  const name = basename(file, '.ts');
  const svgPath = resolve(outDir, `${name}.svg`);
  writeFileSync(svgPath, svg);
  execFileSync('qlmanage', ['-t', '-s', '1400', '-o', outDir, svgPath], { stdio: 'ignore' });
  console.log(`${name}: ${def.w}x${def.h} -> ${svgPath}.png (${(svg.length / 1024).toFixed(0)} KB svg)`);
}
