import * as THREE from 'three';
import { ART, PERF, PROFILE, artSvg, profileLog } from '../art/index.ts';

/**
 * Rasterises SVG illustrations into GPU textures on demand.
 *
 * - Resolution follows the largest on-screen size requested (bucketed), capped
 *   per device so phones don't blow their GPU memory budget.
 * - Rasterisation is queued and processed a couple per frame to avoid jank.
 * - Textures nobody has asked for in a while are evicted (and re-made later).
 */

interface Entry {
  name: string;
  texture: THREE.Texture | null;
  size: number; // long side in px of the current texture
  want: number; // long side requested
  pending: boolean;
  lastUsed: number;
}

const BUCKETS = [256, 512, 768, 1024, 1536, 2048, 2560, 3072];

/**
 * The pre-flipped, premultiplied ImageBitmap upload is only used where it is
 * verified to behave (Chromium, and the flip option actually honoured).
 * Safari/Firefox use the spec-guaranteed canvas upload path instead.
 */
let fastPath: Promise<boolean> | null = null;
function bitmapFastPath(): Promise<boolean> {
  fastPath ??= (async () => {
    if (location.search.includes('nobitmap')) return false; // QA: force the Safari/Firefox path
    if (!('userAgentData' in navigator) || typeof createImageBitmap !== 'function') return false;
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 2;
      const g = c.getContext('2d')!;
      g.fillStyle = '#f00';
      g.fillRect(0, 0, 1, 1);
      g.fillStyle = '#00f';
      g.fillRect(0, 1, 1, 1);
      const bmp = await createImageBitmap(c, { imageOrientation: 'flipY', premultiplyAlpha: 'premultiply' });
      const d = document.createElement('canvas');
      d.width = 1;
      d.height = 2;
      const dg = d.getContext('2d')!;
      dg.drawImage(bmp, 0, 0);
      bmp.close();
      const px = dg.getImageData(0, 0, 1, 1).data;
      return px[2] > 128 && px[0] < 128; // top pixel is now the blue one
    } catch {
      return false;
    }
  })();
  return fastPath;
}

/** True if SVG images can be drawn into a readable canvas (needed for WebGL uploads). */
export async function svgCanvasSupported(): Promise<boolean> {
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#f00"/></svg>';
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    return g.getImageData(0, 0, 1, 1).data[0] > 200; // throws if the canvas is tainted
  } catch {
    return false;
  }
}

export class ArtTextures {
  private entries = new Map<string, Entry>();
  private queue: string[] = [];
  private busy = 0;
  readonly maxSize: number;
  readonly empty: THREE.Texture;
  private renderer: THREE.WebGLRenderer;
  /** Names needed on screen right now but not yet rasterised. */
  readonly urgent = new Set<string>();

  constructor(renderer: THREE.WebGLRenderer, maxSize: number) {
    this.renderer = renderer;
    this.maxSize = Math.min(maxSize, renderer.capabilities.maxTextureSize);
    const data = new Uint8Array([0, 0, 0, 0]);
    this.empty = new THREE.DataTexture(data, 1, 1);
    this.empty.needsUpdate = true;
  }

  private bucket(px: number): number {
    const target = Math.min(px, this.maxSize);
    for (const b of BUCKETS) if (b >= target) return Math.min(b, this.maxSize);
    return this.maxSize;
  }

  /**
   * Request a texture for `name` displayed with a long side of `px` device
   * pixels. `urgent` (on screen now) jumps the queue.
   */
  get(name: string, px: number, now: number, urgent = false): THREE.Texture | null {
    let e = this.entries.get(name);
    if (!e) {
      if (!ART[name]) return null;
      e = { name, texture: null, size: 0, want: 0, pending: false, lastUsed: now };
      this.entries.set(name, e);
    }
    e.lastUsed = now;
    const want = this.bucket(px);
    if (want > e.want) e.want = want;
    if ((!e.texture || e.want > e.size * 1.5) && !e.pending) {
      e.pending = true;
      if (urgent) this.queue.unshift(name);
      else this.queue.push(name);
    } else if (urgent && e.pending && !e.texture) {
      const i = this.queue.indexOf(name);
      if (i > 0) {
        this.queue.splice(i, 1);
        this.queue.unshift(name);
      }
    }
    if (urgent && !e.texture) this.urgent.add(name);
    return e.texture;
  }

  /** Same as get() but resolves once the texture exists (used by the loader). */
  async preload(name: string, px: number): Promise<void> {
    this.get(name, px, performance.now());
    const e = this.entries.get(name);
    if (!e) return;
    while (e.pending || !e.texture) {
      // pump() resolves immediately when all slots are busy, so always yield
      // to a macrotask too — otherwise this loop starves the main thread.
      if (this.queue.length) await this.pump(4);
      await new Promise((r) => setTimeout(r, 16));
      if (!e.pending && !e.texture) return;
    }
  }

  /** Process queued rasterisations. */
  async pump(maxConcurrent = 2): Promise<void> {
    const jobs: Promise<void>[] = [];
    while (this.queue.length && this.busy < maxConcurrent) {
      const name = this.queue.shift()!;
      jobs.push(this.rasterise(name));
    }
    await Promise.all(jobs);
  }

  private async rasterise(name: string): Promise<void> {
    const e = this.entries.get(name);
    const def = ART[name];
    if (!e || !def) return;
    this.busy++;
    try {
      const svg = artSvg(name)!;
      const size = e.want;
      const t0 = PERF || PROFILE ? performance.now() : 0;
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      const scale = size / Math.max(def.w, def.h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(2, Math.round(def.w * scale));
      canvas.height = Math.max(2, Math.round(def.h * scale));
      const ctx = canvas.getContext('2d')!;
      const t1 = PERF || PROFILE ? performance.now() : 0;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      // Upload through a pre-flipped, premultiplied ImageBitmap: the browser's
      // fast path. A canvas with flipY/unpremultiply forces a slow CPU copy
      // that stalls the GPU for large illustrations. The shaders unpremultiply.
      let source: HTMLCanvasElement | ImageBitmap = canvas;
      if (await bitmapFastPath()) {
        try {
          source = await createImageBitmap(canvas, { imageOrientation: 'flipY', premultiplyAlpha: 'premultiply' });
        } catch {
          source = canvas;
        }
      }
      const bitmap = source !== canvas;
      const tex = bitmap ? new THREE.Texture(source as ImageBitmap) : new THREE.CanvasTexture(canvas);
      tex.flipY = !bitmap;
      tex.premultiplyAlpha = true; // canvas fallback uploads premultiplied too (bitmaps already are)
      tex.needsUpdate = true;
      tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      // Textures are sized to their on-screen size, so big ones are drawn
      // close to 1:1; skipping their mipmap chain saves a costly GPU step.
      const mips = size < 1536;
      tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = mips;
      tex.userData.release = () => (source as ImageBitmap).close?.();
      const t2 = PERF || PROFILE ? performance.now() : 0;
      this.renderer.initTexture(tex);
      if (PROFILE) {
        this.renderer.getContext().finish();
        const w = (source as { width: number }).width;
        const h = (source as { height: number }).height;
        profileLog.uploads.push({ name, size, px: w * h, decode: t1 - t0, draw: t2 - t1, upload: performance.now() - t2, t: t2 });
      }
      if (PERF) console.warn(`[perf] raster ${name}@${size} decode ${(t1 - t0).toFixed(0)} draw ${(t2 - t1).toFixed(0)} upload ${(performance.now() - t2).toFixed(0)}ms`);
      e.texture?.dispose();
      e.texture?.userData.release?.();
      e.texture = tex;
      e.size = size;
      this.urgent.delete(name);
    } catch (err) {
      console.warn(`[art] failed to rasterise "${name}"`, err);
    } finally {
      e.pending = false;
      this.busy--;
    }
  }

  /** Free textures not requested for `idleMs`. */
  evict(now: number, idleMs: number): void {
    for (const e of this.entries.values()) {
      if (e.texture && !e.pending && now - e.lastUsed > idleMs) {
        e.texture.dispose();
        e.texture.userData.release?.();
        e.texture = null;
        e.size = 0;
        e.want = 0;
      }
    }
  }

  get busyNow(): boolean {
    return this.busy > 0;
  }

  get pendingCount(): number {
    return this.queue.length + this.busy;
  }
}
