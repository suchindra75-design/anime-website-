import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import type { Stage } from './stage.ts';
import type { FrameContext } from './plate.ts';
import { FLAVORS, state } from '../core/state.ts';

/**
 * Real-time 3D for the collection: a glass liqueur bottle in the carousel
 * and a martini glass floating over the ritual card. Both render on the
 * front canvas inside the box of their DOM anchors (scissored viewports).
 */

function lathe(points: [number, number][], segments = 72): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

function bottleProfile(): [number, number][] {
  const pts: [number, number][] = [
    [0, 0],
    [0.36, 0],
    [0.41, 0.03],
    [0.42, 0.1],
    [0.42, 2.05],
    [0.41, 2.18],
    [0.36, 2.3],
    [0.25, 2.4],
    [0.17, 2.47],
  ];
  // Ribbed neck
  for (let i = 0; i <= 10; i++) {
    const y = 2.5 + i * 0.03;
    pts.push([i % 2 ? 0.175 : 0.158, y]);
  }
  pts.push([0.17, 2.82], [0.19, 2.86], [0.19, 2.9], [0.0, 2.9]);
  return pts;
}

function labelTexture(index: number): THREE.CanvasTexture {
  const f = FLAVORS[index];
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3b1513';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#d9a35c';
  g.lineWidth = 4;
  g.strokeRect(10, 14, c.width - 20, c.height - 28);
  g.fillStyle = '#e8b878';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '400 92px Smythe, Georgia, serif';
  g.fillText('VIGILIA', 256, 112);
  g.font = '900 30px Nunito, sans-serif';
  g.fillText(`NOCTURNE ${f.num}`, 256, 186);
  g.font = '400 64px Smythe, Georgia, serif';
  g.fillText(f.name.split(' & ')[0].toUpperCase(), 768, 112);
  g.font = '900 26px Nunito, sans-serif';
  g.fillText(`${f.abv} · 700 ML`, 768, 186);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

interface View {
  anchor: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  fit: number;
}

export class Showcase {
  private views: View[] = [];
  private bottle!: THREE.Group;
  private liquids: THREE.MeshStandardMaterial[] = [];
  private label!: THREE.MeshStandardMaterial;
  private pointer = new THREE.Vector2();
  private spin = { y: 0, bob: 0 };
  private current = 0;

  constructor(stage: Stage) {
    const r = stage.renderer;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(r);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const bottleAnchor = document.querySelector<HTMLElement>('[data-3d="bottle"]');
    const glassAnchor = document.querySelector<HTMLElement>('[data-3d="glass"]');
    if (bottleAnchor) this.views.push(this.makeView(bottleAnchor, env, this.buildBottle(), 3.9));
    if (glassAnchor) this.views.push(this.makeView(glassAnchor, env, this.buildGlass(), 3.4));

    window.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });

    stage.hooks.push((renderer, ctx) => this.render(renderer, ctx));
  }

  private makeView(anchor: HTMLElement, env: THREE.Texture, root: THREE.Group, fit: number): View {
    const scene = new THREE.Scene();
    scene.environment = env;
    const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xff6a50, 2.4);
    rim.position.set(-4, 2, -3);
    scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25), root);
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    return { anchor, scene, camera, root, fit };
  }

  private glassMaterial(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  private liquidMaterial(): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({
      color: state.accent.clone().convertSRGBToLinear(),
      roughness: 0.3,
      metalness: 0,
      emissive: state.accent.clone().convertSRGBToLinear().multiplyScalar(0.35),
      envMapIntensity: 0.9,
    });
    // Skip tone mapping so the flavour colour stays as saturated as in the comic.
    m.toneMapped = false;
    this.liquids.push(m);
    return m;
  }

  private buildBottle(): THREE.Group {
    const group = new THREE.Group();
    const glass = new THREE.Mesh(lathe(bottleProfile()), this.glassMaterial());
    glass.renderOrder = 2;

    const liquid = new THREE.Mesh(
      lathe([
        [0, 0.06],
        [0.385, 0.06],
        [0.395, 0.1],
        [0.395, 1.92],
        [0, 1.92],
      ]),
      this.liquidMaterial(),
    );
    liquid.renderOrder = 1;

    const labelTex = labelTexture(state.flavor);
    this.label = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.55, metalness: 0.15 });
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.426, 0.426, 0.62, 72, 1, true), this.label);
    label.position.y = 1.05;
    label.renderOrder = 3;

    const capMat = new THREE.MeshStandardMaterial({ color: 0x6b1e1b, roughness: 0.35, metalness: 0.35 });
    const capBand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 48), capMat);
    capBand.position.y = 2.93;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    dome.scale.set(1, 0.72, 1);
    dome.position.y = 2.98;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.025, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0xd9a35c, roughness: 0.3, metalness: 0.9 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.99;

    group.add(liquid, glass, label, capBand, dome, ring);
    group.position.y = -1.6;
    const pivot = new THREE.Group();
    pivot.add(group);
    pivot.rotation.z = 0.32;
    this.bottle = pivot;
    return pivot;
  }

  private buildGlass(): THREE.Group {
    const group = new THREE.Group();
    const glassMat = this.glassMaterial();
    glassMat.opacity = 0.22;
    const profile: [number, number][] = [
      [0, 0],
      [0.62, 0],
      [0.64, 0.03],
      [0.6, 0.06],
      [0.1, 0.1],
      [0.05, 0.18],
      [0.04, 1.4],
      [0.06, 1.48],
      [1.0, 2.35],
      [1.02, 2.38],
      [0.99, 2.38],
      [0.08, 1.52],
    ];
    const glass = new THREE.Mesh(lathe(profile, 96), glassMat);
    glass.renderOrder = 2;
    const liquid = new THREE.Mesh(
      lathe(
        [
          [0, 1.52],
          [0.86, 2.24],
          [0, 2.24],
        ],
        96,
      ),
      this.liquidMaterial(),
    );
    liquid.renderOrder = 1;
    group.add(liquid, glass);
    group.position.y = -1.2;
    const pivot = new THREE.Group();
    pivot.add(group);
    pivot.rotation.x = 0.25;
    return pivot;
  }

  /** Scenes + cameras to precompile behind the loader. */
  get compileTargets(): Array<[THREE.Object3D, THREE.Camera]> {
    return this.views.map((v) => [v.scene, v.camera]);
  }

  /** Carousel change: spin the bottle and swap liquid + label mid-turn. */
  showFlavor(index: number): void {
    const dir = index > this.current || (this.current === FLAVORS.length - 1 && index === 0) ? 1 : -1;
    this.current = index;
    gsap.to(this.spin, { y: this.spin.y + dir * Math.PI * 2, duration: 1.4, ease: 'expo.inOut' });
    gsap.fromTo(this.spin, { bob: 0 }, { bob: 1, duration: 1.4, ease: 'sine.inOut' });
    gsap.delayedCall(0.6, () => {
      const old = this.label.map;
      this.label.map = labelTexture(index);
      this.label.needsUpdate = true;
      old?.dispose();
    });
  }

  private render(renderer: THREE.WebGLRenderer, ctx: FrameContext): boolean {
    for (const m of this.liquids) {
      m.color.copy(state.accent).convertSRGBToLinear();
      m.emissive.copy(m.color).multiplyScalar(0.35);
    }
    let any = false;
    const vh = ctx.vh;
    for (const v of this.views) {
      const r = v.anchor.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.width < 2 || r.height < 2) continue;
      any = true;
      const t = ctx.time;
      if (v.root === this.bottle) {
        v.root.rotation.y = t * 0.35 + this.spin.y + this.pointer.x * 0.5;
        v.root.rotation.z = 0.28 + this.pointer.x * 0.06 + Math.sin(this.spin.bob * Math.PI) * 0.25;
        v.root.position.y = Math.sin(t * 0.9) * 0.06 + Math.sin(this.spin.bob * Math.PI) * 0.25;
      } else {
        const inView = 1 - Math.min(1, Math.max(0, (r.top + r.height / 2) / vh));
        v.root.rotation.y = t * 0.5;
        v.root.rotation.x = 0.2 + this.pointer.y * 0.12 + (inView - 0.5) * 0.4;
        v.root.rotation.z = -0.15 + this.pointer.x * 0.1;
        v.root.position.y = Math.sin(t * 1.1) * 0.08;
      }
      v.camera.aspect = r.width / r.height;
      const dist = v.fit / (2 * Math.tan((v.camera.fov * Math.PI) / 360)) / Math.min(1, v.camera.aspect);
      v.camera.position.set(0, 0, dist);
      v.camera.lookAt(0, 0, 0);
      v.camera.updateProjectionMatrix();

      renderer.setScissorTest(true);
      renderer.setViewport(r.left, vh - r.bottom, r.width, r.height);
      renderer.setScissor(Math.max(0, r.left), Math.max(0, vh - r.bottom), r.width, r.height);
      renderer.clearDepth();
      renderer.render(v.scene, v.camera);
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, ctx.vw, ctx.vh);
    return any;
  }
}
