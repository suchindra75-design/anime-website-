import { holds } from '../core/hold.ts';
import { state } from '../core/state.ts';

/**
 * Custom cursor: a small dot that always follows, plus a lagging white bubble
 * with a contextual label ("Hold & move", "Choose flavor"...) and a red
 * hold-progress ring.
 */
export function initCursor(): { update: () => void } {
  const root = document.getElementById('cursor')!;
  const label = root.querySelector<HTMLElement>('.cursor__label')!;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || state.touch) return { update: () => {} };
  document.body.classList.add('has-cursor');

  const pos = { x: -200, y: -200 };
  const bubble = { x: -200, y: -200, s: 0 };
  let zone: HTMLElement | null = null;
  let overInteractive = false;
  let visible = false;

  const resolve = (t: Element | null) => {
    overInteractive = !!t?.closest('a, button:not(.bottle-hit), [role="button"], input, label');
    const z = t?.closest<HTMLElement>('[data-cursor]') ?? null;
    if (z !== zone) {
      zone = z;
      if (z) label.innerHTML = z.dataset.cursor!.replace(' & ', ' &amp;<br>');
    }
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    visible = true;
    resolve(e.target as Element);
  });
  // Scrolling under a still mouse changes what's beneath it, so re-check.
  let lastScroll = window.scrollY;
  let pressed = false;
  document.addEventListener('pointerleave', () => (visible = false));
  window.addEventListener('pointerdown', () => (pressed = true));
  window.addEventListener('pointerup', () => (pressed = false));

  return {
    update() {
      if (visible && window.scrollY !== lastScroll) {
        lastScroll = window.scrollY;
        resolve(document.elementFromPoint(pos.x, pos.y));
      }
      const showBubble = visible && !!zone && !overInteractive && !document.body.classList.contains('is-gated');
      const k = 0.16;
      bubble.x += (pos.x - bubble.x) * k;
      bubble.y += (pos.y - bubble.y) * k;
      bubble.s += ((showBubble ? 1 : 0) - bubble.s) * 0.15;
      const hold = zone?.dataset.holdZone ? holds.get(zone.dataset.holdZone) : undefined;
      const hp = hold ? (hold.completed ? 1 : hold.progress) : 0;
      root.style.setProperty('--dx', `${pos.x}px`);
      root.style.setProperty('--dy', `${pos.y}px`);
      root.style.setProperty('--bx', `${bubble.x}px`);
      root.style.setProperty('--by', `${bubble.y}px`);
      root.style.setProperty('--bs', (bubble.s * (hold?.holding ? 0.9 : 1)).toFixed(3));
      root.style.setProperty('--hold', hp.toFixed(3));
      root.style.setProperty('--ds', pressed ? '0.6' : overInteractive ? '2.2' : '1');
      (root.firstElementChild as HTMLElement).style.opacity = visible ? '1' : '0';
    },
  };
}
