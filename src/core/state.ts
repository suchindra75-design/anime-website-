import * as THREE from 'three';
import { gsap } from 'gsap';

export interface Flavor {
  id: string;
  num: string;
  name: string;
  /** Display name for the big serif headline (line breaks allowed). */
  headline: string;
  notes: string;
  abv: string;
  color: string;
}

export const FLAVORS: Flavor[] = [
  {
    id: 'berry',
    num: 'N.01',
    name: 'Midnight Berry & Cream',
    headline: 'Midnight Berry<br><span class="amp">&amp;</span> Cream',
    notes: 'Velvet cream<br>dark berries<br>a hint of vanilla',
    abv: '14% ABV',
    color: '#6fb3e6',
  },
  {
    id: 'pistachio',
    num: 'N.02',
    name: 'Pistachio & Honey',
    headline: 'Pistachio<br><span class="amp">&amp;</span> Honey',
    notes: 'Toasted pistachio<br>wild honey<br>soft cream',
    abv: '13% ABV',
    color: '#86cf6a',
  },
  {
    id: 'lemon',
    num: 'N.03',
    name: 'Lemon & Saffron',
    headline: 'Lemon<br><span class="amp">&amp;</span> Saffron',
    notes: 'Candied lemon<br>golden saffron<br>a cool finish',
    abv: '15% ABV',
    color: '#f1cf3a',
  },
];

type Listener = (index: number) => void;

/** Global, tiny app state shared by scenes, GL and UI. */
export const state = {
  flavor: 0,
  /** Animated accent colour fed to every `data-accent="flavor"` plate. */
  accent: new THREE.Color().setStyle(FLAVORS[0].color, THREE.LinearSRGBColorSpace),
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: window.matchMedia('(hover: none), (pointer: coarse)').matches,
  isPhone: window.matchMedia('(max-width: 767px), (orientation: portrait) and (max-width: 1100px)').matches,
  listeners: [] as Listener[],

  setFlavor(index: number): void {
    const i = ((index % FLAVORS.length) + FLAVORS.length) % FLAVORS.length;
    if (i === this.flavor) return;
    this.flavor = i;
    const target = new THREE.Color().setStyle(FLAVORS[i].color, THREE.LinearSRGBColorSpace);
    gsap.to(this.accent, { r: target.r, g: target.g, b: target.b, duration: 0.9, ease: 'power2.out' });
    document.documentElement.style.setProperty('--accent', FLAVORS[i].color);
    for (const l of this.listeners) l(i);
  },

  onFlavor(fn: Listener): void {
    this.listeners.push(fn);
  },
};

window.matchMedia('(max-width: 767px), (orientation: portrait) and (max-width: 1100px)').addEventListener('change', (e) => (state.isPhone = e.matches));
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => (state.reducedMotion = e.matches));
