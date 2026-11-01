import { gsap, ScrollTrigger } from '../core/scroll.ts';
import { state } from '../core/state.ts';
import { audio } from '../core/audio.ts';
import { range01, type SceneContext } from './context.ts';

/** Title screen: brush backdrop, letter intro, rising ink splash on scroll. */
export function initHero(ctx: SceneContext): { intro: () => void } {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const chars = hero.querySelectorAll<HTMLElement>('.hero__word .ch');
  const the = hero.querySelectorAll<HTMLElement>('.hero__the .c');
  const hint = hero.querySelector<HTMLElement>('.hero__hint')!;
  const brush = ctx.plate('brush');
  const splash = ctx.plate('splash');
  const header = document.querySelector<HTMLElement>('.header')!;

  const motion = !state.reducedMotion;
  if (motion) {
    gsap.set(chars, { yPercent: 40, opacity: 0, filter: 'blur(8px)' });
    gsap.set(the, { yPercent: 60, opacity: 0 });
    gsap.set(hint, { opacity: 0 });
    if (brush) brush.state.opacity = 0;
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });
  ctx.onFrame(() => {
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    if (brush) (brush.uniforms.uMouse.value as { set: (x: number, y: number) => void }).set(mouse.x, mouse.y);
  });

  // Scroll: title lifts and scatters while white ink rises to paper.
  const exit = gsap.timeline({ paused: true });
  exit
    .to(hint, { opacity: 0, duration: 0.1 }, 0)
    .to(chars, motion ? { yPercent: () => gsap.utils.random(-140, -60), rotation: () => gsap.utils.random(-14, 14), opacity: 0, duration: 0.5, stagger: { each: 0.02, from: 'random' } } : { opacity: 0, duration: 0.5 }, 0.15)
    .to(the, { yPercent: -120, opacity: 0, duration: 0.3 }, 0.1);
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      const sp = range01(p, 0.12, 0.95);
      if (splash) splash.state.progress = sp;
      header.dataset.heroLight = sp > 0.6 ? '1' : '0';
      exit.progress(range01(p, 0.08, 0.7));
    },
  });

  return {
    intro() {
      if (!motion) return;
      const tl = gsap.timeline();
      if (brush) tl.to(brush.state, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0);
      tl.to(the, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0.3)
        .to(chars, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out', stagger: { each: 0.035, from: 'center' } }, 0.45)
        .to(hint, { opacity: 0.6, duration: 1 }, 1.6);
    },
  };
}

/** Caption boxes wipe in as they enter the viewport. */
export function initCaptions(): void {
  document.querySelectorAll<HTMLElement>('.caption').forEach((cap) => {
    if (state.reducedMotion) return;
    cap.classList.add('is-hidden');
    ScrollTrigger.create({
      trigger: cap,
      start: 'top 88%',
      onEnter: () => {
        cap.classList.add('is-shown');
        cap.classList.remove('is-hidden');
      },
    });
  });
}

/** Hand-lettered sound effects pop onto the page like stamped ink. */
export function initSfx(): void {
  document.querySelectorAll<HTMLElement>('.sfx').forEach((el) => {
    if (state.reducedMotion) return;
    const crack = el.classList.contains('sfx--crack');
    gsap.set(el, { opacity: 0, scale: 0.35, rotation: -14 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(el, { opacity: 1, scale: 1, rotation: 0, duration: crack ? 0.55 : 0.9, ease: crack ? 'back.out(3.2)' : 'back.out(1.8)' });
        if (crack) {
          audio.whoosh(1.1);
          tl.to(el, { x: '+=7', duration: 0.05, yoyo: true, repeat: 7, ease: 'none' }, 0.25);
        }
      },
    });
    gsap.to(el, { yPercent: -60, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/** Circular window: zoom into the red sun, then melt into darkness. */
export function initArch(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.scene--arch')!;
  const stageEl = section.querySelector<HTMLElement>('.arch__stage')!;
  const caption = section.querySelector<HTMLElement>('.c-r1')!;
  const header = document.querySelector<HTMLElement>('.header')!;
  const arch = ctx.plate('arch');
  const fig = ctx.plate('archFig');
  gsap.set(stageEl, { x: 0, y: 0, xPercent: -50, yPercent: -50, transformOrigin: '50% 33%' });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      const zoom = state.reducedMotion ? 0 : range01(p, 0.12, 0.72);
      gsap.set(stageEl, { scale: 1 + zoom * zoom * 1.6 });
      const out = range01(p, 0.62, 1);
      if (arch) arch.state.out = out;
      if (fig) {
        fig.state.out = range01(p, 0.58, 0.98);
        fig.state.y = -zoom * window.innerHeight * 0.04;
      }
      caption.style.opacity = String(1 - range01(p, 0.4, 0.55));
      header.dataset.archLight = out < 0.5 ? '1' : '0';
    },
    onEnter: () => audio.whoosh(0.5),
  });
}

/** Red hall drips into place, the eyes strip drifts over it. */
export function initHall(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.chapter--hall')!;
  const hall = ctx.plate('hall');
  const eyes = section.querySelector<HTMLElement>('.p-h2')!;
  if (hall) hall.state.in = 0;
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top 15%',
    onUpdate: (self) => {
      if (!hall) return;
      hall.state.in = state.reducedMotion ? 1 : self.progress;
      hall.state.scale = 1.12 - self.progress * 0.12;
    },
  });
  if (state.reducedMotion) return;
  gsap.fromTo(
    eyes,
    { y: '14vw' },
    { y: '-6vw', ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

/** Drink, collapse and finale beats. */
export function initFinale(ctx: SceneContext): void {
  const motion = !state.reducedMotion;
  // Drinking saint rises gently into frame
  const drinkFig = document.querySelector<HTMLElement>('.d-fig');
  if (drinkFig && motion)
    gsap.fromTo(drinkFig, { y: '8vw' }, { y: '-4vw', ease: 'none', scrollTrigger: { trigger: '.chapter--drink', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Inset panels drift at their own pace
  document.querySelectorAll<HTMLElement>('.p-d1, .p-c2, .p-a4').forEach((el) => {
    if (!motion) return;
    gsap.fromTo(el, { y: '5vw' }, { y: '-5vw', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Finale title: words rise with a slight 3D tilt
  const title = document.querySelector<HTMLElement>('.finale__title')!;
  const words = title.querySelectorAll<HTMLElement>('.finale__the, .finale__word');
  if (motion) gsap.set(words, { yPercent: 50, opacity: 0, rotateX: -50, transformPerspective: 900 });
  ScrollTrigger.create({
    trigger: title,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      audio.whoosh(1);
      if (motion) gsap.to(words, { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12 });
    },
  });
  if (motion) gsap.to(title, { y: '-12vw', ease: 'none', scrollTrigger: { trigger: '.chapter--finale', start: 'top top', end: 'bottom top', scrub: true } });

  // Ruins + walking saint melt into the black band before the collection
  const ruins = ctx.plate('ruins');
  const walker = ctx.plate('walkAway');
  const ink = ctx.plate('finaleInk');
  if (ink) ink.state.in = 0;
  ScrollTrigger.create({
    trigger: '.chapter--finale',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      if (walker) {
        walker.state.y = -p * window.innerWidth * 0.05;
        walker.state.scale = 1 - p * 0.25;
        walker.state.out = range01(p, 0.62, 0.92);
      }
      if (ruins) ruins.state.out = range01(p, 0.6, 0.98);
      if (ink) ink.state.in = range01(p, 0.35, 0.75);
    },
  });
}
