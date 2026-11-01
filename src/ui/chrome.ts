import { gsap, ScrollTrigger } from '../core/scroll.ts';
import { audio } from '../core/audio.ts';
import { state } from '../core/state.ts';

const AGE_KEY = 'vigilia-age-ok';
const AGE_TTL = 1000 * 60 * 60 * 24 * 30;

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export function loaderProgress(p: number): void {
  const loader = document.getElementById('loader');
  loader?.style.setProperty('--p', p.toFixed(3));
}

export function prepareLoaderMarks(): void {
  document.querySelectorAll<SVGGeometryElement>('.loader__medallion svg path, .loader__medallion svg circle, .loader__medallion svg ellipse, .loader__medallion svg line, .loader__medallion svg polyline').forEach((el) => {
    try {
      el.style.setProperty('--len', `${Math.ceil(el.getTotalLength()) + 2}`);
    } catch {
      /* not measurable */
    }
  });
}

export async function hideLoader(): Promise<void> {
  const loader = document.getElementById('loader')!;
  await gsap
    .timeline()
    .to(loader.querySelector('.loader__bar'), { opacity: 0, duration: 0.4 })
    .to(loader.querySelector('.loader__medallion'), { scale: 0.85, opacity: 0, duration: 0.7, ease: 'power3.in' }, 0)
    .to(loader.querySelector('.loader__wordmark'), { y: -20, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0.1)
    .to(loader, { opacity: 0, duration: 0.5 }, 0.55)
    .then(() => loader.remove());
}

// ---------------------------------------------------------------------------
// Age gate
// ---------------------------------------------------------------------------

function ageRemembered(): boolean {
  if (new URLSearchParams(location.search).has('gate')) return false;
  try {
    const v = Number(localStorage.getItem(AGE_KEY) || 0);
    return Date.now() - v < AGE_TTL;
  } catch {
    return false;
  }
}

/** Resolves once the visitor confirms legal age. `gesture` tells if a click happened. */
export function ageGate(): Promise<{ gesture: boolean }> {
  const gate = document.getElementById('gate')!;
  if (ageRemembered()) {
    gate.remove();
    return Promise.resolve({ gesture: false });
  }
  document.body.classList.add('is-gated');
  gate.hidden = false;
  // Keep keyboard and screen-reader focus inside the dialog while it is open.
  const behind = document.querySelectorAll<HTMLElement>('main, .header, .audio, .skip-link');
  behind.forEach((el) => (el.inert = true));
  const top = gate.querySelectorAll('.gate__line--top .c');
  const bottom = gate.querySelectorAll('.gate__line--bottom .c');
  const actions = gate.querySelector('.gate__actions')!;
  gsap.set([top, bottom], { yPercent: (_i: number, el: Element) => ((el as HTMLElement).closest('.gate__line--top') ? -110 : 110) });
  gsap.set(actions, { opacity: 0, y: 10 });
  gsap
    .timeline({ delay: 0.1 })
    .to(top, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.035 })
    .to(bottom, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.035 }, 0.08)
    .to(actions, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
  (gate.querySelector('[data-gate="yes"]') as HTMLElement).focus({ preventScroll: true });

  return new Promise((resolve) => {
    gate.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-gate]');
      if (!btn) return;
      if (btn.dataset.gate === 'no') {
        const denied = gate.querySelector<HTMLElement>('.gate__denied')!;
        denied.hidden = false;
        gsap.fromTo(denied, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        return;
      }
      try {
        localStorage.setItem(AGE_KEY, String(Date.now()));
      } catch {
        /* storage unavailable */
      }
      if (audio.preferred) audio.enable();
      audio.whoosh(0.8);
      gsap
        .timeline({
          onComplete: () => {
            behind.forEach((el) => (el.inert = false));
            gate.remove();
            // Return focus to the start of the page; keyboard users land on the
            // (then visible) skip link, mouse users see nothing change.
            document.querySelector<HTMLElement>('.skip-link')?.focus({ preventScroll: true });
            document.body.classList.remove('is-gated');
            resolve({ gesture: true });
          },
        })
        .to(actions, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in' })
        .to(top, { yPercent: -110, duration: 0.7, ease: 'expo.in', stagger: { each: 0.02, from: 'end' } }, 0)
        .to(bottom, { yPercent: 110, duration: 0.7, ease: 'expo.in', stagger: 0.02 }, 0)
        .to(gate, { opacity: 0, duration: 0.45 }, 0.6);
    });
  });
}

// ---------------------------------------------------------------------------
// Header: active nav item + logo tone over light/dark backgrounds
// ---------------------------------------------------------------------------

const LIGHT_SCENES = new Set(['arrival', 'table', 'flavors', 'forthcoming']);

export function initHeader(): { update: () => void } {
  const header = document.querySelector<HTMLElement>('.header')!;
  const links = document.querySelectorAll<HTMLAnchorElement>('.nav__link');
  const setActive = (id: string) => links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === id));
  ScrollTrigger.create({
    trigger: '#collection',
    start: 'top 40%',
    endTrigger: 'body',
    end: 'bottom bottom',
    onUpdate: (self) => setActive(self.progress > 0 ? 'collection' : 'experience'),
  });

  document.querySelector('.forthcoming')?.setAttribute('data-scene', 'forthcoming');
  let last = '';
  let frame = 0;
  const probeX = 24;
  const probeY = 30;
  return {
    update() {
      if (++frame % 6) return;
      const stack = document.elementsFromPoint(probeX, probeY);
      let scene = '';
      for (const el of stack) {
        const s = (el as HTMLElement).closest?.('[data-scene]') as HTMLElement | null;
        if (s) {
          scene = s.dataset.scene!;
          break;
        }
      }
      let light = LIGHT_SCENES.has(scene);
      if (scene === 'arch') light = header.dataset.archLight === '1';
      if (scene === 'hero') light = header.dataset.heroLight === '1';
      const key = light ? 'light' : 'dark';
      if (key !== last) {
        last = key;
        header.classList.toggle('is-dark', light);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Scroll progress thumb + audio wind
// ---------------------------------------------------------------------------

export function initProgress(): (progress: number, velocity: number) => void {
  const bar = document.querySelector<HTMLElement>('.progress')!;
  return (progress, velocity) => {
    bar.style.setProperty('--p', progress.toFixed(4));
    audio.wind(state.reducedMotion ? 0 : Math.min(1, Math.abs(velocity) / 60));
  };
}

// ---------------------------------------------------------------------------
// Legal dialog
// ---------------------------------------------------------------------------

export function initLegal(): void {
  const dialog = document.getElementById('legal') as HTMLDialogElement | null;
  document.querySelector('[data-legal]')?.addEventListener('click', () => dialog?.showModal());
}
