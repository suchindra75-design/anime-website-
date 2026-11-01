import * as THREE from 'three';
import { gsap } from 'gsap';
import { programs, vertex, type ProgramName } from './shaders.ts';
import { ART } from '../art/index.ts';
import type { ArtTextures } from './textures.ts';

export const COLORS: Record<string, string> = {
  paper: '#efece4',
  ink: '#141210',
  red: '#c82924',
  maroon: '#592223',
  charcoal: '#1d1d1d',
  white: '#ffffff',
};

/** Animatable state — GSAP tweens these fields directly. */
export interface PlateState {
  in: number;
  out: number;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
  dim: number;
  shake: number;
  boil: number;
  fill: number;
  flash: number;
  power: number;
  spin: number;
  progress: number;
  flow: number;
  cut: number;
}

export interface FrameContext {
  vw: number;
  vh: number;
  dpr: number;
  now: number;
  time: number;
  dt: number;
  accent: THREE.Color;
  reducedMotion: boolean;
  /** How many viewports ahead to request (but not urgently rasterise) art. */
  prefetch: number;
}

const geometry = new THREE.PlaneGeometry(1, 1);

/** Colour with raw sRGB channel values (our shaders work directly in sRGB). */
export function rawColor(css: string): THREE.Color {
  return new THREE.Color().setStyle(css, THREE.LinearSRGBColorSpace);
}
const tmpRect = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A WebGL quad that tracks a DOM element's box every frame. Layout, sticky
 * pinning and responsive rules stay in CSS; the shader only draws.
 */
export class Plate {
  readonly el: HTMLElement;
  readonly name: string;
  readonly program: ProgramName;
  readonly art: string | null;
  readonly layer: 'back' | 'front';
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  readonly uniforms: Record<string, THREE.IUniform>;
  readonly state: PlateState;
  /** Rotation/scale pivot in plate-normalised coords (0..1, y down). */
  pivot = { x: 0.5, y: 0.5 };
  parallax: number;
  spin: number;
  fit: 'fill' | 'cover';
  clipEl: HTMLElement | null;
  accentMode: 'flavor' | 'fixed' | 'none';
  /** Manual screen rect (CSS px) instead of the element box. */
  override: RectLike | null = null;
  reveal: 'melt' | 'none';
  revealed = false;
  onScreen = false;
  /** Last screen-space centre/size, for interaction code. */
  readonly screen = { cx: 0, cy: 0, w: 0, h: 0, rot: 0 };
  private loaded = 0;
  private textures: ArtTextures;

  constructor(el: HTMLElement, textures: ArtTextures, index: number) {
    this.el = el;
    this.textures = textures;
    const d = el.dataset;
    this.name = d.name ?? '';
    this.art = d.art ?? null;
    this.program = (d.program as ProgramName) ?? 'art';
    if (!(this.program in programs)) this.program = 'art';
    this.layer = d.layer === 'front' ? 'front' : 'back';
    this.parallax = parseFloat(d.parallax ?? '0') || 0;
    this.spin = parseFloat(d.spin ?? '0') || 0;
    this.fit = d.fit === 'cover' ? 'cover' : 'fill';
    this.reveal = d.reveal === 'melt' ? 'melt' : 'none';
    this.clipEl = d.noclip !== undefined ? null : (el.parentElement?.closest<HTMLElement>('[data-panel]') ?? null);

    const accent = d.accent;
    this.accentMode = accent === 'flavor' ? 'flavor' : accent ? 'fixed' : 'none';

    this.state = {
      in: this.reveal === 'melt' ? 0 : 1,
      out: 0,
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rot: 0,
      dim: 0,
      shake: 0,
      boil: this.program === 'art' || this.program === 'smear' ? 1 : 0,
      fill: 1,
      flash: 0,
      power: 0,
      spin: 0,
      progress: 0,
      flow: 0,
      cut: 0,
    };

    const colorName = d.color ?? 'paper';
    this.uniforms = {
      uTime: { value: 0 },
      uSize: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uClip: { value: new THREE.Vector4(-1e5, -1e5, 1e5, 1e5) },
      uOpacity: { value: 1 },
      uIn: { value: this.state.in },
      uOut: { value: 0 },
      uSeed: { value: Math.random() * 10 },
      uMap: { value: textures.empty },
      uUvRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uAccent: { value: rawColor(accent && accent !== 'flavor' ? accent : '#6fb3e6') },
      uBoil: { value: this.state.boil },
      uDim: { value: 0 },
      uShake: { value: 0 },
      uLoaded: { value: 0 },
      uFill: { value: 1 },
      uFillBox: { value: new THREE.Vector3(0, 1, 0) },
      uFlash: { value: 0 },
      uColor: { value: rawColor(COLORS[colorName] ?? colorName) },
      uMouse: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uSpin: { value: 0 },
      uPower: { value: 0 },
      uTrail: { value: textures.empty },
      uFlow: { value: 0 },
      uCut: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: programs[this.program],
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = index;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  get hasTexture(): boolean {
    return this.art !== null && (this.program === 'art' || this.program === 'smear');
  }

  /** Reads layout, updates transform + uniforms. Returns whether drawn this frame. */
  update(ctx: FrameContext): boolean {
    const { vw, vh, dpr } = ctx;
    let r: RectLike;
    if (this.override) {
      r = this.override;
    } else {
      const b = this.el.getBoundingClientRect();
      tmpRect.left = b.left;
      tmpRect.top = b.top;
      tmpRect.width = b.width;
      tmpRect.height = b.height;
      r = tmpRect;
    }
    const s = this.state;
    if (r.width < 1 || r.height < 1) {
      this.mesh.visible = false;
      this.onScreen = false;
      return false;
    }

    // Parallax only acts within ~1.3 viewports of the centre so far-away
    // plates never get dragged on screen.
    const centreOffset = Math.max(-vh * 1.3, Math.min(vh * 1.3, r.top + r.height / 2 - vh / 2));
    const par = this.parallax && !ctx.reducedMotion ? centreOffset * this.parallax : 0;
    const spinDeg = this.spin && !ctx.reducedMotion ? (centreOffset / vh) * this.spin : 0;
    const w = r.width * s.scale;
    const h = r.height * s.scale;
    let cx = r.left + r.width / 2 + s.x;
    let cy = r.top + r.height / 2 + s.y + par;
    const rot = ((s.rot + spinDeg) * Math.PI) / 180;
    if (rot !== 0 && (this.pivot.x !== 0.5 || this.pivot.y !== 0.5)) {
      const px = cx + (this.pivot.x - 0.5) * w;
      const py = cy + (this.pivot.y - 0.5) * h;
      const dx = cx - px;
      const dy = cy - py;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      cx = px + dx * cos - dy * sin;
      cy = py + dx * sin + dy * cos;
    }
    this.screen.cx = cx;
    this.screen.cy = cy;
    this.screen.w = w;
    this.screen.h = h;
    this.screen.rot = rot;

    const radius = Math.hypot(w, h) / 2;
    const near = cy + radius > -vh * 1.25 && cy - radius < vh * 2.5;
    const visible =
      cx + radius > -40 && cx - radius < vw + 40 && cy + radius > -40 && cy - radius < vh + 40 && s.opacity > 0.002;

    // Cover-fit UVs (needed before sizing the texture request)
    const u = this.uniforms;
    const uvRect = u.uUvRect.value as THREE.Vector4;
    const def = this.art ? ART[this.art] : undefined;
    if (def && this.fit === 'cover') {
      const plateAspect = w / h;
      const artAspect = def.w / def.h;
      if (plateAspect > artAspect) {
        const sy = artAspect / plateAspect;
        uvRect.set(0, (1 - sy) / 2, 1, sy);
      } else {
        const sx = plateAspect / artAspect;
        uvRect.set((1 - sx) / 2, 0, sx, 1);
      }
    }

    const ahead = cy + radius > -vh * 1.25 && cy - radius < vh * ctx.prefetch;
    if (this.hasTexture && (near || ahead) && def) {
      const needW = (w / uvRect.z) * dpr;
      const needH = (h / uvRect.w) * dpr;
      const long = Math.max(def.w, def.h);
      const px = Math.max((needW * long) / def.w, (needH * long) / def.h);
      const tex = this.textures.get(this.art!, px, ctx.now, visible);
      if (tex) {
        u.uMap.value = tex;
        this.loaded = Math.min(1, this.loaded + ctx.dt * 3);
      } else if (u.uMap.value !== this.textures.empty) {
        // evicted while away — fade back in once re-rasterised
        u.uMap.value = this.textures.empty;
        this.loaded = 0;
      }
    }

    // Melt-in when the plate first scrolls into view.
    if (this.reveal === 'melt' && !this.revealed && near && r.top < vh * 0.9 && r.top + r.height > 0) {
      this.revealed = true;
      if (ctx.reducedMotion) s.in = 1;
      else gsap.to(s, { in: 1, duration: 1.7, ease: 'power2.out', delay: 0.05 });
    }

    // Section-boundary drips grow as their top edge rises through the viewport.
    if (this.program === 'drips') s.progress = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));

    this.onScreen = visible;
    this.mesh.visible = visible;
    if (!visible) return false;

    this.mesh.position.set(cx, -cy, 0);
    this.mesh.scale.set(w, h, 1);
    this.mesh.rotation.z = -rot;

    (u.uSize.value as THREE.Vector2).set(w, h);
    u.uDpr.value = dpr;
    u.uTime.value = ctx.time;
    u.uOpacity.value = s.opacity;
    u.uIn.value = ctx.reducedMotion ? 1 : s.in;
    u.uOut.value = ctx.reducedMotion ? (s.out > 0.5 ? 1 : 0) : s.out;
    u.uBoil.value = ctx.reducedMotion ? 0 : s.boil;
    u.uDim.value = s.dim;
    u.uShake.value = s.shake;
    u.uLoaded.value = this.hasTexture ? this.loaded : 1;
    u.uFill.value = s.fill;
    u.uFlash.value = s.flash;
    u.uProgress.value = s.progress;
    u.uSpin.value = s.spin;
    u.uPower.value = s.power;
    u.uFlow.value = s.flow;
    u.uCut.value = s.cut;
    if (this.accentMode === 'flavor') (u.uAccent.value as THREE.Color).copy(ctx.accent);

    const clip = u.uClip.value as THREE.Vector4;
    if (this.clipEl) {
      const c = this.clipEl.getBoundingClientRect();
      clip.set(c.left * dpr, (vh - c.bottom) * dpr, c.right * dpr, (vh - c.top) * dpr);
    } else {
      clip.set(-1e5, -1e5, 1e5, 1e5);
    }
    return true;
  }

  /** Converts a point in plate-normalised coords (0..1, y down) to screen CSS px. */
  toScreen(nx: number, ny: number): { x: number; y: number } {
    const { cx, cy, w, h, rot } = this.screen;
    const lx = (nx - 0.5) * w;
    const ly = (ny - 0.5) * h;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return { x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos };
  }

  dispose(): void {
    this.material.dispose();
  }
}
