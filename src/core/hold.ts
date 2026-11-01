/**
 * "Hold" interaction: press and hold anywhere in a zone (mouse), on a
 * dedicated button (touch) or with Space/Enter on the focused button.
 * Progress fills while held and drains when released.
 */
export interface HoldOptions {
  /** Seconds of holding needed to complete. */
  duration: number;
  /** Drain speed multiplier when released. */
  decay?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onComplete?: () => void;
}

export const holds = new Map<string, Hold>();

export class Hold {
  progress = 0;
  holding = false;
  completed = false;
  /** Pointer position in viewport CSS px while over the zone. */
  pointer = { x: -1, y: -1, inside: false };
  readonly zone: HTMLElement;
  readonly button: HTMLElement | null;
  private opts: HoldOptions;

  constructor(id: string, zone: HTMLElement, opts: HoldOptions) {
    this.zone = zone;
    this.opts = opts;
    this.button = zone.querySelector<HTMLElement>(`[data-hold-button="${id}"]`);
    holds.set(id, this);

    zone.addEventListener('pointermove', (e) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.inside = true;
    });
    zone.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.pointer.inside = false;
        this.end();
      }
    });
    zone.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('a, button:not([data-hold-button])')) return;
      e.preventDefault();
      this.start();
    });
    window.addEventListener('pointerup', () => this.end());
    window.addEventListener('blur', () => this.end());

    if (this.button) {
      const b = this.button;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try {
          b.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone (or synthetic) — holding still works */
        }
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
        this.start();
      });
      b.addEventListener('pointermove', (e) => {
        if (!this.holding) return;
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      });
      b.addEventListener('pointercancel', () => this.end());
      b.addEventListener('lostpointercapture', () => this.end());
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      b.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          this.start();
        }
      });
      b.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') this.end();
      });
    }
  }

  start(): void {
    if (this.holding) return;
    this.holding = true;
    this.button?.classList.add('is-held');
    this.zone.classList.add('is-holding');
    this.opts.onStart?.();
  }

  end(): void {
    if (!this.holding) return;
    this.holding = false;
    this.button?.classList.remove('is-held');
    this.zone.classList.remove('is-holding');
    this.opts.onEnd?.();
  }

  /** Advance progress; call once per frame. */
  update(dt: number): void {
    if (this.holding) this.progress = Math.min(1, this.progress + dt / this.opts.duration);
    else if (!this.completed) this.progress = Math.max(0, this.progress - dt * (this.opts.decay ?? 1.4) / this.opts.duration);
    if (this.progress >= 1 && !this.completed) {
      this.completed = true;
      this.opts.onComplete?.();
    }
    const v = this.completed ? 1 : this.progress;
    this.button?.style.setProperty('--hold', v.toFixed(3));
  }

  reset(): void {
    this.completed = false;
    this.progress = 0;
  }
}
