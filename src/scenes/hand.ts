import * as THREE from 'three';
import { gsap, ScrollTrigger, scroll } from '../core/scroll.ts';
import { Hold } from '../core/hold.ts';
import { audio } from '../core/audio.ts';
import { state } from '../core/state.ts';
import { damp, range01, type SceneContext } from './context.ts';

const TRAIL = 128;

/**
 * "Hold & move": the engraved hand follows the pointer while held and the
 * fibrous surface smears around it (a small velocity-encoded trail canvas
 * drives the displacement shader). Completing the hold pushes through.
 */
export function initHand(ctx: SceneContext): void {
  const section = document.querySelector<HTMLElement>('.scene--hand')!;
  const pin = section.querySelector<HTMLElement>('.scene__pin')!;
  const caption = section.querySelector<HTMLElement>('.c-h1')!;
  const frame = section.querySelector<HTMLElement>('.frame-box')!;
  const wood = ctx.plate('wood');
  const hand = ctx.plate('hand');
  if (!wood || !hand) return;

  // Velocity trail canvas: R,G = direction (0.5 neutral), B = intensity.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TRAIL;
  const g = canvas.getContext('2d')!;
  g.fillStyle = 'rgb(128,128,0)';
  g.fillRect(0, 0, TRAIL, TRAIL);
  const trailTex = new THREE.CanvasTexture(canvas);
  trailTex.minFilter = THREE.LinearFilter;
  trailTex.generateMipmaps = false;
  wood.uniforms.uTrail.value = trailTex;

  let completed = false;
  const hold = new Hold('hand', pin, {
    duration: 2.6,
    onStart: () => audio.tick(),
    onComplete: () => {
      completed = true;
      audio.chime(0.75);
      audio.whoosh(1.2);
      gsap.to(wood.state, { power: 1, duration: 0.6, ease: 'power2.out' });
      gsap.to(hand.state, { scale: 1.18, duration: 1.2, ease: 'expo.out' });
      const st = ScrollTrigger.getAll().find((t) => t.trigger === section);
      if (st) gsap.delayedCall(0.5, () => scroll.to(st.end - window.innerHeight * 0.02, { duration: 2.4 }));
    },
  });

  const last = { x: -1, y: -1 };
  const handPos = { x: 0, y: 0, rot: 0 };
  let p = 0;
  let autoT = 0;

  const splat = (nx: number, ny: number, vx: number, vy: number, strength: number) => {
    const r = TRAIL * (0.09 + strength * 0.1);
    const x = nx * TRAIL;
    const y = ny * TRAIL;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const R = Math.round(128 + Math.max(-1, Math.min(1, vx)) * 127);
    const G = Math.round(128 - Math.max(-1, Math.min(1, vy)) * 127);
    const B = Math.round(255 * Math.min(1, strength));
    grd.addColorStop(0, `rgba(${R},${G},${B},0.85)`);
    grd.addColorStop(1, `rgba(${R},${G},${B},0)`);
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (p = self.progress),
  });

  ctx.onFrame((dt, time) => {
    hold.update(dt);
    if (!wood.onScreen && !hand.onScreen) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Fade the trail toward neutral.
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(128,128,0,0.045)';
    g.fillRect(0, 0, TRAIL, TRAIL);

    // Pointer (or an automatic path on touch) drives splats.
    const rect = pin.getBoundingClientRect();
    let px = hold.pointer.x;
    let py = hold.pointer.y;
    const touchAuto = hold.holding && !hold.pointer.inside;
    if (touchAuto || (state.touch && hold.holding)) {
      autoT += dt;
      px = vw * (0.48 + Math.cos(autoT * 1.7) * 0.16);
      py = vh * (0.5 + Math.sin(autoT * 2.3) * 0.12);
    }
    if (px >= 0 && (hold.pointer.inside || hold.holding)) {
      const nx = (px - rect.left) / rect.width;
      const ny = (py - rect.top) / rect.height;
      if (last.x >= 0) {
        const vx = (px - last.x) / 18;
        const vy = (py - last.y) / 18;
        const speed = Math.min(1, Math.hypot(vx, vy));
        const strength = hold.holding ? 0.45 + speed * 0.55 : speed * 0.35;
        if (strength > 0.02) splat(nx, ny, vx, vy, strength);
      }
      last.x = px;
      last.y = py;
    }
    trailTex.needsUpdate = true;

    // Hand: enters from the right with scroll, follows the pointer while held.
    const enter = 1 - range01(p, 0.0, 0.18);
    const leave = range01(p, 0.8, 0.98);
    let tx = enter * vw * 0.45 + leave * vw * 0.5;
    let ty = Math.sin(time * 0.8) * 8;
    let trot = Math.sin(time * 0.6) * 1.2;
    if (hold.holding || completed) {
      // fingertips sit at ~18% across the plate; steer them toward the pointer
      const tip = hand.toScreen(0.18, 0.48);
      const goalX = px >= 0 ? px : vw * 0.4;
      const goalY = py >= 0 ? py : vh * 0.5;
      tx += Math.max(-vw * 0.13, Math.min(vw * 0.1, (goalX - (tip.x - handPos.x)) * 0.5));
      ty += Math.max(-vh * 0.22, Math.min(vh * 0.22, goalY - (tip.y - handPos.y)));
      trot += ((goalY - vh / 2) / vh) * -14 + Math.min(0, goalX - tip.x) / vw * -6;
    }
    handPos.x = damp(handPos.x, tx, hold.holding ? 4 : 2.5, dt);
    handPos.y = damp(handPos.y, ty, hold.holding ? 4 : 2.5, dt);
    handPos.rot = damp(handPos.rot, trot, 3, dt);
    hand.state.x = handPos.x;
    hand.state.y = handPos.y;
    hand.state.rot = handPos.rot;
    hand.pivot = { x: 1, y: 0.55 };

    if (!completed) wood.state.power = damp(wood.state.power, hold.progress * 0.7, 3, dt);
    // The surface stays; the next section's maroon drips carry the transition.
    hand.state.out = leave;
    hand.state.opacity = 1 - range01(p, 0.9, 1);
    caption.style.opacity = String(1 - leave * 2);
    frame.style.opacity = String(1 - leave * 2);
  });
}
