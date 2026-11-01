import { gsap, ScrollTrigger } from '../core/scroll.ts';
import { FLAVORS, state } from '../core/state.ts';
import { audio } from '../core/audio.ts';
import { damp, range01, type SceneContext } from './context.ts';
import type { Plate } from '../gl/plate.ts';

/**
 * "Choose flavor": three bottles shimmer on hover; clicking (or arrow keys
 * in the radio group) picks the flavour that colours the rest of the story.
 */
export function initFlavors(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.scene--flavors')!;
  const hits = [...section.querySelectorAll<HTMLButtonElement>('.bottle-hit')];
  const labelNum = section.querySelector<HTMLElement>('.flavors__num')!;
  const labelName = section.querySelector<HTMLElement>('.flavors__name')!;
  const label = section.querySelector<HTMLElement>('.flavors__label')!;
  // Without WebGL the plates don't exist, but choosing a flavour must still work.
  const bottles = [0, 1, 2].map((i) => ctx.plate(`bottle${i}`)).filter(Boolean) as Plate[];
  const animated = bottles.length === 3;

  let hover = -1;
  let chosen = false;
  let p = 0;
  const anim = bottles.map(() => ({ lift: 0, shake: 0, dim: 0 }));

  const showLabel = (i: number) => {
    const f = FLAVORS[i];
    if (labelName.textContent === f.name) return;
    gsap.to(label, {
      opacity: 0,
      y: 6,
      duration: 0.15,
      onComplete: () => {
        labelNum.textContent = f.num;
        labelName.textContent = f.name;
        gsap.to(label, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      },
    });
  };

  const select = (i: number) => {
    chosen = true;
    state.setFlavor(i);
    hits.forEach((h, j) => {
      h.setAttribute('aria-checked', String(j === i));
      h.tabIndex = j === i ? 0 : -1;
    });
    showLabel(i);
    audio.chime(1 + i * 0.12);
    if (animated) gsap.fromTo(bottles[i].state, { flash: 0.6 }, { flash: 0, duration: 0.8, ease: 'power2.out' });
  };

  hits.forEach((h, i) => {
    h.tabIndex = i === state.flavor ? 0 : -1;
    h.addEventListener('pointerenter', () => {
      hover = i;
      showLabel(i);
      audio.tick();
    });
    h.addEventListener('pointerleave', () => {
      hover = -1;
      showLabel(state.flavor);
    });
    h.addEventListener('focus', () => {
      hover = i;
      showLabel(i);
    });
    h.addEventListener('blur', () => (hover = -1));
    h.addEventListener('click', () => select(i));
    h.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = (i + dir + 3) % 3;
      hits[next].focus();
      select(next);
    });
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (p = self.progress),
  });

  ctx.onFrame((dt, time) => {
    if (!animated || (!bottles[0].onScreen && !bottles[2].onScreen)) return;
    const vh = window.innerHeight;
    const rise = 1 - range01(p, 0, 0.16);
    bottles.forEach((b, i) => {
      const a = anim[i];
      const isHover = hover === i;
      const isChosen = chosen && state.flavor === i;
      a.lift = damp(a.lift, isHover || isChosen ? 1 : 0, 6, dt);
      a.shake = damp(a.shake, isHover ? 1 : 0.12, 8, dt);
      a.dim = damp(a.dim, chosen && !isChosen && !isHover ? 0.55 : 0, 4, dt);
      b.state.y = -a.lift * vh * 0.035 + Math.sin(time * 1.6 + i * 1.3) * 3 + rise * vh * (0.5 + i * 0.12);
      b.state.rot = Math.sin(time * 9 + i) * a.shake * 1.4;
      b.pivot = { x: 0.5, y: 0.95 };
      b.state.shake = a.shake * 0.6;
      b.state.dim = a.dim;
    });
  });
}
