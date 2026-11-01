import { gsap, ScrollTrigger } from '../core/scroll.ts';
import { Hold } from '../core/hold.ts';
import { audio } from '../core/audio.ts';
import { clamp01, damp, easeInOut, lerp, range01, type SceneContext } from './context.ts';

/** Geometry of the `hand-bottle` and `glass` artworks (normalised, y down). */
const MOUTH = { x: 1100 / 1200, y: 140 / 700 };
const GRIP = { x: 0.4, y: 0.56 }; // palm, ~(480, 390) in the 1200×700 art
const GLASS_RIM = 103 / 900;
const GLASS_APEX = 397 / 900;
const POUR_ANGLE = 52;

/**
 * "Hold & pour": holding tips the bottle over the glass; once the stream
 * lands, the glass fills (masked in the shader). Releasing stops the pour.
 */
export function initPour(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.scene--pour')!;
  const pin = section.querySelector<HTMLElement>('.scene__pin')!;
  const caption = section.querySelector<HTMLElement>('.c-p1')!;
  const bottle = ctx.plate('pourBottle');
  const glass = ctx.plate('glass');
  const stream = ctx.plate('stream');
  if (!bottle || !glass || !stream) return;

  glass.uniforms.uFillBox.value.set(GLASS_RIM, GLASS_APEX, 1);
  glass.state.fill = 0;
  bottle.pivot = { x: GRIP.x, y: GRIP.y };
  stream.override = { left: -100, top: -100, width: 1, height: 1 };
  stream.state.opacity = 0;

  let full = false;
  const hold = new Hold('pour', pin, {
    duration: 999, // progress is driven by the fill level instead
    onStart: () => audio.tick(),
  });

  let p = 0;
  let tilt = 0;
  let flow = 0;
  let cut = 0;

  const complete = () => {
    full = true;
    hold.end();
    audio.pour(0);
    audio.chime(1.1);
    caption.innerHTML = '<em>Perfect.</em> The colour of the night, poured to the brim.';
    gsap.fromTo(caption, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.out' });
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      p = self.progress;
      // Scrolling past without pouring still completes the story beat.
      if (p > 0.9 && !full) {
        gsap.to(glass.state, { fill: 1, duration: 0.8, ease: 'power2.out', onComplete: complete });
        full = true;
      }
    },
  });

  ctx.onFrame((dt) => {
    hold.update(dt);
    if (!bottle.onScreen && !glass.onScreen) {
      audio.pour(0);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pouring = hold.holding && !full;
    tilt = damp(tilt, pouring ? 1 : 0, pouring ? 3.2 : 4.5, dt);
    const e = easeInOut(clamp01(tilt));

    // Solve the offset that brings the tilted mouth above the glass.
    const br = bottle.el.getBoundingClientRect();
    const gr = glass.el.getBoundingClientRect();
    const theta = (POUR_ANGLE * e * Math.PI) / 180;
    const pvx = br.left + GRIP.x * br.width;
    const pvy = br.top + GRIP.y * br.height;
    const mx = br.left + MOUTH.x * br.width - pvx;
    const my = br.top + MOUTH.y * br.height - pvy;
    const rmx = pvx + mx * Math.cos(theta) - my * Math.sin(theta);
    const rmy = pvy + mx * Math.sin(theta) + my * Math.cos(theta);
    const targetX = gr.left + gr.width * 0.47;
    const targetY = gr.top + gr.height * GLASS_RIM - vh * 0.1;
    const enter = 1 - range01(p, 0, 0.14);
    const leave = full ? range01(p, 0.92, 1) : 0;
    bottle.state.rot = POUR_ANGLE * e;
    bottle.state.x = (targetX - rmx) * e - enter * vw * 0.5 - leave * vw * 0.4;
    bottle.state.y = (targetY - rmy) * e + Math.sin(performance.now() / 700) * 4;

    // Stream: grows from the mouth once the bottle is tipped enough.
    const flowing = pouring && tilt > 0.9;
    flow = flowing ? Math.min(1, flow + dt * 2.6) : flow;
    cut = flowing ? 0 : flow > 0 ? Math.min(1, cut + dt * 3) : 0;
    if (cut >= 1) {
      flow = 0;
      cut = 0;
    }
    const mouth = bottle.toScreen(MOUTH.x, MOUTH.y);
    const surfaceY = gr.top + gr.height * lerp(GLASS_APEX, GLASS_RIM + 0.015, glass.state.fill);
    const width = Math.max(6, gr.width * 0.07);
    stream.override = { left: mouth.x - width / 2, top: mouth.y, width, height: Math.max(1, surfaceY - mouth.y) };
    stream.state.flow = flow;
    stream.state.cut = cut;
    stream.state.opacity = flow > 0 ? 1 : 0;

    if (flowing && flow >= 1 && !full) {
      glass.state.fill = Math.min(1, glass.state.fill + dt / 4.2);
      if (glass.state.fill >= 1) complete();
    }
    hold.progress = glass.state.fill;
    glass.state.shake = flowing ? 0.08 : 0;
    audio.pour(flowing ? 0.9 : 0);
  });
}
