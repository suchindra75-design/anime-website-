import { markSvg } from '../art/index.ts';
import { rng, roughRect, smooth, type Pt } from '../art/kit.ts';

/** Injects the brand marks (medallion, wordmark, ornaments) as inline SVG. */
export function injectMarks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-mark]').forEach((el) => {
    const name = el.dataset.mark!;
    const title = name === 'wordmark' ? 'Vigilia Spirits' : undefined;
    el.innerHTML = markSvg(name, title);
  });
}

/** Splits `[data-split]` text into word + character spans for staggered motion. */
export function splitText(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const text = el.textContent ?? '';
    el.setAttribute('aria-label', text.trim());
    el.innerHTML = text
      .trim()
      .split(/\s+/)
      .map(
        (word) =>
          `<span class="w" aria-hidden="true">${[...word].map((ch) => `<span class="c">${ch}</span>`).join('')}</span>`,
      )
      .join(' ');
  });
}

/** Rough, hand-inked frames for every comic panel. */
export function drawPanelFrames(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel, i) => {
    let svg = panel.querySelector<SVGSVGElement>(':scope > .panel__frame');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('panel__frame');
      svg.setAttribute('viewBox', '0 0 1000 1000');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<path/>';
      panel.appendChild(svg);
    }
    const r = rng(101 + i * 7);
    svg.querySelector('path')!.setAttribute('d', roughRect(2, 2, 996, 996, r, 2.2));
  });
}

/** The nav's rough white box outline. */
export function drawNavFrame(): void {
  const path = document.querySelector<SVGPathElement>('.nav__frame path');
  if (path) path.setAttribute('d', roughRect(1, 2, 98, 96, rng(7), 0.9));
}

/** Ragged torn edge on top of the red collection section. */
export function drawCollectionEdge(): void {
  const path = document.querySelector<SVGPathElement>('.collection__edge path');
  if (!path) return;
  const r = rng(33);
  const pts: Pt[] = [];
  for (let x = 0; x <= 1440; x += 18) pts.push([x, 22 + (r() - 0.5) * 26 + Math.sin(x * 0.013) * 8]);
  path.setAttribute('d', `${smooth(pts)}L1440 60L0 60Z`);
}
