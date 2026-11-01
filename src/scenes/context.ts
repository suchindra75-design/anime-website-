import type { Stage } from '../gl/stage.ts';
import type { Plate } from '../gl/plate.ts';

export type FrameFn = (dt: number, time: number) => void;

export interface SceneContext {
  back: Stage | null;
  front: Stage | null;
  /** Look up a plate by its data-name (either layer). */
  plate(name: string): Plate | undefined;
  /** Register a per-frame callback. */
  onFrame(fn: FrameFn): void;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Maps v from [a, b] to [0, 1], clamped. */
export const range01 = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));
