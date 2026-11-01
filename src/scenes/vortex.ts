import { gsap, ScrollTrigger, scroll } from '../core/scroll.ts';
import { Hold } from '../core/hold.ts';
import { audio } from '../core/audio.ts';
import { damp, range01, type SceneContext } from './context.ts';

/**
 * "Hold": the whirlwind spins up while held, lifting the saint; completing
 * the hold flashes white and carries the story forward.
 */
export function initVortex(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.scene--vortex')!;
  const pin = section.querySelector<HTMLElement>('.scene__pin')!;
  const caption = section.querySelector<HTMLElement>('.c-v1')!;
  const vortex = ctx.plate('vortex');
  const fig = ctx.plate('floatFig');
  if (!vortex || !fig) return;

  let completed = false;
  let p = 0;
  let power = 0;
  const hold = new Hold('vortex', pin, {
    duration: 2.8,
    onStart: () => audio.tick(),
    onComplete: () => {
      completed = true;
      audio.chime(1.3);
      audio.whoosh(1.4);
      gsap.fromTo([vortex.state, fig.state], { flash: 0 }, { flash: 1, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      const st = ScrollTrigger.getAll().find((t) => t.trigger === section);
      if (st) gsap.delayedCall(0.6, () => scroll.to(st.end - window.innerHeight * 0.05, { duration: 2.6 }));
    },
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (p = self.progress),
  });

  ctx.onFrame((dt, time) => {
    hold.update(dt);
    if (!vortex.onScreen) {
      audio.vortex(0);
      return;
    }
    const vh = window.innerHeight;
    const target = Math.max(range01(p, 0.05, 0.6) * 0.35, completed ? 1 : hold.progress);
    power = damp(power, target, 2.5, dt);
    vortex.state.power = power;
    vortex.state.spin += dt * (0.25 + power * 3.2);
    audio.vortex(power);

    const rise = 1 - range01(p, 0, 0.18);
    fig.state.y = Math.sin(time * 1.3) * 10 - power * vh * 0.07 + rise * vh * 0.3;
    fig.state.rot = Math.sin(time * 0.9) * 3 + power * 7;
    fig.state.scale = 1 + power * 0.06;
    fig.state.shake = power * 0.25;

    const leave = range01(p, 0.86, 1);
    vortex.state.out = leave;
    fig.state.out = leave;
    caption.style.opacity = String(1 - leave * 2);
  });
}
