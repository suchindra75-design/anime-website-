import * as THREE from 'three';
import { Plate, type FrameContext } from './plate.ts';
import { ArtTextures } from './textures.ts';
import { postFragment } from './shaders.ts';
import { PROFILE, profileLog } from '../art/index.ts';

export interface StageOptions {
  canvas: HTMLCanvasElement;
  transparent: boolean;
  post: boolean;
  maxDpr: number;
  maxTexture: number;
  antialias: boolean;
}

type Hook = (renderer: THREE.WebGLRenderer, ctx: FrameContext) => boolean;

/** One WebGL canvas that draws DOM-synced plates (+ optional post pass). */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  readonly textures: ArtTextures;
  readonly plates: Plate[] = [];
  readonly hooks: Hook[] = [];
  private rt: THREE.WebGLRenderTarget | null = null;
  private post: { scene: THREE.Scene; camera: THREE.Camera; material: THREE.ShaderMaterial } | null = null;
  private opts: StageOptions;
  vw = 0;
  vh = 0;
  dpr = 0;
  velocity = 0;
  private cleared = false;
  private calmSince = 0;

  constructor(opts: StageOptions) {
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      alpha: opts.transparent,
      antialias: opts.antialias,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(opts.transparent ? 0x000000 : 0x1d1d1d, opts.transparent ? 0 : 1);
    this.renderer.autoClear = false;
    this.textures = new ArtTextures(this.renderer, opts.maxTexture);

    if (opts.post) {
      this.rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
      const material = new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: postFragment,
        uniforms: {
          tScene: { value: this.rt.texture },
          uRes: { value: new THREE.Vector2(1, 1) },
          uVel: { value: 0 },
          uTime: { value: 0 },
          uGrain: { value: 0.045 },
        },
        depthTest: false,
        depthWrite: false,
      });
      const scene = new THREE.Scene();
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      quad.frustumCulled = false;
      scene.add(quad);
      this.post = { scene, camera: new THREE.Camera(), material };
    }
    this.resize();
  }

  add(plate: Plate): void {
    this.plates.push(plate);
    this.scene.add(plate.mesh);
  }

  /**
   * Compile every shader program up front (behind the loader). Otherwise
   * each effect compiles on the frame it first appears, causing a hitch.
   */
  async precompile(extra: Array<[THREE.Object3D, THREE.Camera]> = []): Promise<void> {
    const r = this.renderer;
    const shown = this.plates.map((p) => p.mesh.visible);
    for (const p of this.plates) p.mesh.visible = true;
    try {
      await r.compileAsync(this.scene, this.camera);
      if (this.post) await r.compileAsync(this.post.scene, this.post.camera);
      for (const [scene, camera] of extra) await r.compileAsync(scene, camera);
    } catch {
      /* compileAsync unsupported — shaders will compile lazily */
    } finally {
      this.plates.forEach((p, i) => (p.mesh.visible = shown[i]));
    }
  }

  find(name: string): Plate | undefined {
    return this.plates.find((p) => p.name === name);
  }

  resize(): void {
    const c = this.opts.canvas;
    const vw = c.clientWidth || window.innerWidth;
    const vh = c.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.maxDpr);
    if (vw === this.vw && vh === this.vh && dpr === this.dpr) return;
    this.vw = vw;
    this.vh = vh;
    this.dpr = dpr;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.vw, this.vh, false);
    this.camera.left = 0;
    this.camera.right = this.vw;
    this.camera.top = 0;
    this.camera.bottom = -this.vh;
    this.camera.updateProjectionMatrix();
    if (this.rt && this.post) {
      const w = Math.round(this.vw * this.dpr);
      const h = Math.round(this.vh * this.dpr);
      this.rt.setSize(w, h);
      (this.post.material.uniforms.uRes.value as THREE.Vector2).set(w, h);
    }
  }

  render(ctx: FrameContext): void {
    ctx.vw = this.vw;
    ctx.vh = this.vh;
    ctx.dpr = this.dpr;
    const t0 = PROFILE ? performance.now() : 0;
    let drawn = 0;
    for (const p of this.plates) if (p.update(ctx)) drawn++;
    // Rasterising an SVG runs on the main thread (20-220 ms per piece), so
    // on-screen art goes first and look-ahead work only runs once scrolling
    // has been calm for a moment — i.e. while the visitor is reading.
    if (Math.abs(this.velocity) > 0.0015) this.calmSince = ctx.now;
    const calm = ctx.now - this.calmSince > 300;
    if (this.textures.urgent.size || (calm && this.textures.pendingCount > 0 && !this.textures.busyNow)) void this.textures.pump(1);

    const r = this.renderer;
    if (this.rt && this.post) {
      if (drawn === 0) return; // fully covered by DOM sections — keep last frame
      const gl = r.getContext();
      if (PROFILE) gl.finish();
      const t1 = PROFILE ? performance.now() : 0;
      r.setRenderTarget(this.rt);
      r.clear();
      r.render(this.scene, this.camera);
      if (PROFILE) gl.finish();
      const t2 = PROFILE ? performance.now() : 0;
      r.setRenderTarget(null);
      const u = this.post.material.uniforms;
      u.uVel.value = ctx.reducedMotion ? 0 : this.velocity;
      u.uTime.value = ctx.time;
      r.render(this.post.scene, this.post.camera);
      if (PROFILE) {
        gl.finish();
        const t3 = performance.now();
        profileLog.frames.push({ t: t0, js: t1 - t0, gpu: t2 - t1, post: t3 - t2, drawn, y: window.scrollY });
      }
      return;
    }

    let hooked = false;
    if (drawn === 0 && !this.hooks.length) {
      if (!this.cleared) {
        r.clear();
        this.cleared = true;
      }
      return;
    }
    r.clear();
    if (drawn) r.render(this.scene, this.camera);
    for (const hook of this.hooks) hooked = hook(r, ctx) || hooked;
    this.cleared = !drawn && !hooked;
  }
}
