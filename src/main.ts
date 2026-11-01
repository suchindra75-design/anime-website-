import '@fontsource/smythe/400.css';
import '@fontsource/nunito/900.css';
import '@fontsource/dm-sans/300.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/sections.css';

import * as THREE from 'three';
import { gsap, ScrollTrigger, scroll } from './core/scroll.ts';
import { FLAVORS, state } from './core/state.ts';
import { audio } from './core/audio.ts';
import { Stage } from './gl/stage.ts';
import { svgCanvasSupported } from './gl/textures.ts';
import { Plate, COLORS, type FrameContext } from './gl/plate.ts';
import { Showcase } from './gl/showcase.ts';
import { artSvg } from './art/index.ts';
import { injectMarks, splitText, drawPanelFrames, drawNavFrame, drawCollectionEdge } from './ui/dom.ts';
import { initCursor } from './ui/cursor.ts';
import { ageGate, hideLoader, initHeader, initLegal, initProgress, loaderProgress, prepareLoaderMarks } from './ui/chrome.ts';
import { initArch, initCaptions, initFinale, initHall, initHero, initSfx } from './scenes/story.ts';
import { initHand } from './scenes/hand.ts';
import { initFlavors } from './scenes/flavors.ts';
import { initPour } from './scenes/pour.ts';
import { initVortex } from './scenes/vortex.ts';
import { initCollection } from './scenes/collection.ts';
import type { FrameFn, SceneContext } from './scenes/context.ts';

/** Artworks needed for the first screens; rasterised behind the loader. */
// The title screen takes ~1.3 viewports of scrolling, which leaves time for the
// rest of the chapter to stream in.
const PRELOAD = ['desert-ruins', 'saint-walk-back', 'saint-profile'];

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2') || !!c.getContext('webgl');
  } catch {
    return false;
  }
}

/**
 * No WebGL: show the illustrations as plain SVG backgrounds, with the
 * accent key colour substituted here (the shader normally does it).
 */
function applyFallback(): void {
  document.documentElement.classList.add('no-webgl');
  const svgUrl = (art: string, accent: string) =>
    `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(artSvg(art)!.replace(/#ff00ff/gi, accent))}")`;
  const paint = () => {
    const flavor = FLAVORS[state.flavor].color;
    document.querySelectorAll<HTMLElement>('.plate').forEach((el) => {
      const art = el.dataset.art;
      const accent = el.dataset.accent && el.dataset.accent !== 'flavor' ? el.dataset.accent : flavor;
      if (art && artSvg(art)) el.style.backgroundImage = svgUrl(art, accent);
      else if (el.dataset.color) el.style.background = COLORS[el.dataset.color] ?? el.dataset.color;
      else if (el.dataset.program === 'brush' || el.dataset.program === 'vortex') el.style.background = COLORS.charcoal;
    });
    // Stand-ins for the real-time 3D bottle and glass
    for (const [sel, art] of [['[data-3d="bottle"]', 'bottle-tall'], ['[data-3d="glass"]', 'glass']] as const) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) el.style.background = `${svgUrl(art, flavor)} center / auto ${art === 'glass' ? '60%' : '72%'} no-repeat`;
    }
  };
  paint();
  state.onFlavor(paint);
}

async function boot(): Promise<void> {
  injectMarks();
  splitText();
  drawPanelFrames();
  drawNavFrame();
  drawCollectionEdge();
  prepareLoaderMarks();
  initLegal();
  audio.bindButton(document.querySelector<HTMLButtonElement>('.audio')!);

  scroll.init();
  scroll.stop();
  window.scrollTo(0, 0);

  // --- WebGL stages -------------------------------------------------------
  let back: Stage | null = null;
  let front: Stage | null = null;
  // WebGL needs both a context and an untainted SVG→canvas path for the art.
  const gl = !location.search.includes('nowebgl') && webglAvailable() && (await svgCanvasSupported());
  if (gl) {
    try {
      const phone = state.isPhone || state.touch;
      back = new Stage({
        canvas: document.getElementById('gl-back') as HTMLCanvasElement,
        transparent: false,
        post: true,
        maxDpr: phone ? 1.5 : 2,
        maxTexture: phone ? 2048 : 2560,
        antialias: false,
      });
      front = new Stage({
        canvas: document.getElementById('gl-front') as HTMLCanvasElement,
        transparent: true,
        post: false,
        maxDpr: phone ? 1.5 : 2,
        maxTexture: 1024,
        antialias: true,
      });
    } catch (err) {
      console.warn('[gl] falling back to SVG', err);
      back = front = null;
    }
  }
  if (!back || !front) applyFallback();
  else {
    let i = 0;
    document.querySelectorAll<HTMLElement>('.plate').forEach((el) => {
      const isFront = el.dataset.layer === 'front';
      const stage = isFront ? front! : back!;
      stage.add(new Plate(el, stage.textures, i++));
    });
  }

  const frameFns: FrameFn[] = [];
  const ctx: SceneContext = {
    back,
    front,
    plate: (name) => back?.find(name) ?? front?.find(name),
    onFrame: (fn) => frameFns.push(fn),
  };

  if (import.meta.env.DEV || location.search.includes('debug')) Object.assign(window, { __app: { scroll, back, front, state, ScrollTrigger, gsap } });

  // --- Loader ---------------------------------------------------------------
  const fontWait = document.fonts?.ready ?? Promise.resolve();
  let loaded = 0;
  const total = PRELOAD.length + 1;
  const shown = { p: 0 };
  const tick = () => {
    loaded++;
    gsap.to(shown, { p: loaded / total, duration: 0.6, ease: 'power2.out', onUpdate: () => loaderProgress(shown.p) });
  };
  const minTime = new Promise((r) => setTimeout(r, 1400));
  const jobs: Promise<void>[] = [fontWait.then(tick)];
  if (back) {
    const px = Math.min(back.textures.maxSize, Math.max(window.innerWidth, window.innerHeight) * back.dpr);
    for (const name of PRELOAD) jobs.push(back.textures.preload(name, px).then(tick));
  }
  if (back) jobs.push(back.precompile());
  await Promise.all([Promise.all(jobs), minTime]);
  await new Promise((r) => gsap.to(shown, { p: 1, duration: 0.4, onUpdate: () => loaderProgress(shown.p), onComplete: r }));

  // --- Scenes -------------------------------------------------------------
  const hero = initHero(ctx);
  initCaptions();
  initSfx();
  initHand(ctx);
  initArch(ctx);
  initHall(ctx);
  initFlavors(ctx);
  initPour(ctx);
  initFinale(ctx);
  initVortex(ctx);
  const showcase = front ? new Showcase(front) : null;
  if (front) void front.precompile(showcase?.compileTargets);
  initCollection(showcase);
  const cursor = initCursor();
  const header = initHeader();
  const progress = initProgress();

  // --- Frame loop -----------------------------------------------------------
  const frame: FrameContext = {
    vw: 0,
    vh: 0,
    dpr: 1,
    now: 0,
    time: 0,
    dt: 0,
    accent: state.accent,
    reducedMotion: state.reducedMotion,
    prefetch: state.touch ? 3 : 6,
  };
  let lastEvict = 0;
  gsap.ticker.add((time, deltaMs) => {
    const dt = Math.min(0.05, deltaMs / 1000);
    frame.time = time;
    frame.dt = dt;
    frame.now = performance.now();
    frame.reducedMotion = state.reducedMotion;
    for (const fn of frameFns) fn(dt, time);
    if (back) {
      back.velocity = THREE.MathUtils.clamp((scroll.velocity / Math.max(1, back.vh)) * 1.6, -0.12, 0.12);
      back.render(frame);
    }
    if (front && back) front.velocity = back.velocity;
    front?.render(frame);
    if (back && frame.now - lastEvict > 2000) {
      lastEvict = frame.now;
      back.textures.evict(frame.now, state.touch ? 8000 : 30000);
      front?.textures.evict(frame.now, 30000);
    }
    cursor.update();
    header.update();
    progress(scroll.progress, scroll.velocity);
  });

  // Mobile toolbars fire resize events while scrolling; only re-measure the
  // story layout for real changes (width, or a large height change).
  let resizeTimer = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    back?.resize();
    front?.resize();
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 160) return;
    lastW = w;
    lastH = h;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });

  // --- Enter ------------------------------------------------------------------
  await hideLoader();
  document.body.classList.remove('is-loading');
  await ageGate();
  document.body.classList.add('is-entered');
  ScrollTrigger.refresh();
  scroll.start();
  hero.intro();
  pregenerateArt();
}

/**
 * Generating an illustration's SVG can take a few hundred ms of JS, so do it
 * ahead of time, one piece per idle slot, in story order.
 */
function pregenerateArt(): void {
  const names = [...new Set([...document.querySelectorAll<HTMLElement>('.plate[data-art]')].map((el) => el.dataset.art!))];
  const idle: (cb: () => void) => void =
    'requestIdleCallback' in window ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 }) : (cb) => window.setTimeout(cb, 120);
  const next = () => {
    const name = names.shift();
    if (!name) return;
    artSvg(name);
    idle(next);
  };
  idle(next);
}

void boot();
