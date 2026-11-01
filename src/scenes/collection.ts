import { gsap, ScrollTrigger } from '../core/scroll.ts';
import { FLAVORS, state } from '../core/state.ts';
import { audio } from '../core/audio.ts';
import type { Showcase } from '../gl/showcase.ts';

/** Collection: headline reveals, ritual card, 3D bottle carousel. */
export function initCollection(showcase: Showcase | null): void {
  const reduce = state.reducedMotion;

  // Split-text headings rise in, character by character.
  document.querySelectorAll<HTMLElement>('.collection [data-split], .forthcoming [data-split]').forEach((el) => {
    const chars = el.querySelectorAll('.c');
    if (reduce || !chars.length) return;
    gsap.set(el, { overflow: 'hidden', paddingTop: '0.06em' });
    gsap.from(chars, {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.025,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  document.querySelectorAll<HTMLElement>('.collection .label, .collection .body, .forthcoming .label, .forthcoming__orn, .ritual__orn').forEach((el) => {
    if (reduce) return;
    gsap.from(el, { opacity: 0, y: 18, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  const card = document.querySelector<HTMLElement>('.ritual__card');
  if (card && !reduce) {
    gsap.from(card, { y: 80, rotate: -2, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 85%' } });
  }

  // Carousel
  const name = document.querySelector<HTMLElement>('.showcase__name')!;
  const notes = document.querySelector<HTMLElement>('.showcase__notes')!;
  const num = document.querySelector<HTMLElement>('.showcase__num')!;
  const abv = document.querySelector<HTMLElement>('.showcase__abv')!;
  const stage = document.querySelector<HTMLElement>('.showcase__stage')!;
  let index = state.flavor;
  let busy = false;

  const render = (i: number, dir: number) => {
    const f = FLAVORS[i];
    const inner = name.querySelector<HTMLElement>('.showcase__name-inner')!;
    gsap
      .timeline()
      .to(inner, { yPercent: -dir * 105, opacity: 0, duration: 0.45, ease: 'power3.in' })
      .to(notes, { opacity: 0, x: -dir * 20, duration: 0.3 }, 0)
      .add(() => {
        inner.innerHTML = f.headline;
        notes.innerHTML = f.notes;
        num.textContent = f.num;
        abv.textContent = f.abv;
      })
      .fromTo(inner, { yPercent: dir * 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out' })
      .fromTo(notes, { opacity: 0, x: dir * 20 }, { opacity: 1, x: 0, duration: 0.6 }, '<0.1')
      .add(() => (busy = false));
  };

  const go = (dir: number) => {
    if (busy) return;
    busy = true;
    index = (index + dir + FLAVORS.length) % FLAVORS.length;
    audio.tick();
    state.setFlavor(index);
    showcase?.showFlavor(index);
    render(index, dir);
  };

  document.querySelector('[data-slide="prev"]')?.addEventListener('click', () => go(-1));
  document.querySelector('[data-slide="next"]')?.addEventListener('click', () => go(1));
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Flavour carousel — use arrow keys to browse');
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });

  // Swipe / drag
  let startX = 0;
  let dragging = false;
  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
  });
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  // Sync with the flavour chosen during the story when the section arrives.
  const syncToChoice = () => {
    if (index === state.flavor) return;
    const dir = state.flavor > index ? 1 : -1;
    index = state.flavor;
    showcase?.showFlavor(index);
    render(index, dir);
  };
  ScrollTrigger.create({ trigger: '.showcase', start: 'top bottom', once: true, onEnter: syncToChoice });
}
