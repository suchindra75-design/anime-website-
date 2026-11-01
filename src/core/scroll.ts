import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { state } from './state.ts';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/** Smooth scrolling (Lenis) wired into GSAP's ticker + ScrollTrigger. */
export const scroll = {
  lenis: null as Lenis | null,
  /** Smoothed scroll velocity in px/frame (signed). */
  velocity: 0,
  progress: 0,

  init(): void {
    const lenis = new Lenis({
      lerp: state.reducedMotion ? 1 : 0.085,
      smoothWheel: !state.reducedMotion,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: false,
      autoRaf: false,
    });
    this.lenis = lenis;
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update();
      this.progress = l.limit > 0 ? l.scroll / l.limit : 0;
    });
    // Velocity from real scroll-position change: covers wheel smoothing,
    // native touch scrolling and programmatic jumps alike.
    let lastY = window.scrollY;
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
      const y = window.scrollY;
      const delta = Math.max(-200, Math.min(200, y - lastY));
      lastY = y;
      this.velocity += (delta - this.velocity) * 0.18;
    });
    gsap.ticker.lagSmoothing(0);

    // Anchor links (nav, skip link) go through Lenis for a smooth glide.
    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!;
      const target = id === '#' ? null : document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      this.to(target, { duration: id === '#experience' ? 2.4 : 3.2 });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  },

  to(target: HTMLElement | number, opts: { duration?: number; offset?: number; immediate?: boolean } = {}): void {
    if (!this.lenis) return;
    this.lenis.scrollTo(target, {
      duration: opts.duration ?? 1.6,
      offset: opts.offset ?? 0,
      immediate: opts.immediate || state.reducedMotion,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    });
  },

  stop(): void {
    this.lenis?.stop();
  },

  start(): void {
    this.lenis?.start();
  },
};

export { ScrollTrigger, gsap };
