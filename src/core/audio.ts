/**
 * Procedural sound design (Web Audio, no audio files): a low organ-like
 * drone, wind that follows scroll speed, a pour gurgle, vortex roar and
 * small UI accents. Starts on the age-gate "Yes" click (a user gesture).
 */
const STORE_KEY = 'vigilia-audio';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private pourGain!: GainNode;
  private pourFilter!: BiquadFilterNode;
  private vortexGain!: GainNode;
  private vortexFilter!: BiquadFilterNode;
  private noise!: AudioBuffer;
  enabled = false;
  private button: HTMLButtonElement | null = null;

  bindButton(button: HTMLButtonElement): void {
    this.button = button;
    button.addEventListener('click', () => this.toggle());
  }

  get preferred(): boolean {
    try {
      return localStorage.getItem(STORE_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  private build(): void {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(ctx.destination);

    // White noise buffer shared by noisy voices
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Drone: detuned low voices through a breathing low-pass
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 380;
    droneFilter.Q.value = 6;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;
    droneFilter.connect(droneGain).connect(this.master);
    const voices: [OscillatorType, number, number][] = [
      ['sawtooth', 55, 0.22],
      ['sawtooth', 55.4, 0.22],
      ['triangle', 82.41, 0.3],
      ['sine', 110, 0.25],
      ['triangle', 164.8, 0.08],
    ];
    for (const [type, freq, amp] of voices) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(droneFilter);
      o.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(droneFilter.frequency);
    lfo.start();

    // Wind (scroll velocity)
    const [windSrc, windFilter, windGain] = this.noiseVoice('bandpass', 600, 0.8);
    this.windFilter = windFilter;
    this.windGain = windGain;
    windSrc.start();

    // Pour gurgle
    const [pourSrc, pourFilter, pourGain] = this.noiseVoice('bandpass', 1100, 4);
    this.pourFilter = pourFilter;
    this.pourGain = pourGain;
    const gurgle = ctx.createOscillator();
    gurgle.frequency.value = 9;
    const gurgleDepth = ctx.createGain();
    gurgleDepth.gain.value = 380;
    gurgle.connect(gurgleDepth).connect(pourFilter.frequency);
    gurgle.start();
    pourSrc.start();

    // Vortex roar
    const [vortexSrc, vortexFilter, vortexGain] = this.noiseVoice('lowpass', 300, 1.2);
    this.vortexFilter = vortexFilter;
    this.vortexGain = vortexGain;
    vortexSrc.start();
  }

  private noiseVoice(type: BiquadFilterType, freq: number, q: number): [AudioBufferSourceNode, BiquadFilterNode, GainNode] {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    return [src, filter, gain];
  }

  /** Must be called from a user gesture. */
  enable(): void {
    if (!this.ctx) this.build();
    void this.ctx!.resume();
    this.enabled = true;
    const t = this.ctx!.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.55, t, 0.8);
    this.sync();
  }

  disable(): void {
    this.enabled = false;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.25);
    }
    this.sync();
  }

  toggle(): void {
    if (this.enabled) this.disable();
    else this.enable();
    try {
      localStorage.setItem(STORE_KEY, this.enabled ? 'on' : 'off');
    } catch {
      /* storage unavailable */
    }
  }

  private sync(): void {
    this.button?.setAttribute('aria-pressed', String(this.enabled));
  }

  private get live(): boolean {
    return !!this.ctx && this.enabled;
  }

  /** 0..1 */
  wind(amount: number): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    this.windGain.gain.setTargetAtTime(Math.min(0.45, amount * 0.5), t, 0.15);
    this.windFilter.frequency.setTargetAtTime(400 + amount * 1400, t, 0.2);
  }

  pour(amount: number): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    this.pourGain.gain.setTargetAtTime(amount * 0.5, t, 0.08);
    this.pourFilter.Q.value = 3 + amount * 3;
  }

  vortex(power: number): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    this.vortexGain.gain.setTargetAtTime(power * 0.7, t, 0.2);
    this.vortexFilter.frequency.setTargetAtTime(220 + power * 1600, t, 0.25);
  }

  /** Short filtered noise sweep for transitions. */
  whoosh(strength = 1): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(220, t);
    f.frequency.exponentialRampToValueAtTime(2800, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * strength, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 1.4);
  }

  /** Bell-like chime (flavour selection, completion). */
  chime(pitch = 1): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    for (const [ratio, amp] of [
      [1, 0.25],
      [2.76, 0.1],
      [5.4, 0.05],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 440 * pitch * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 2.3);
    }
  }

  /** Tiny click for UI. */
  tick(): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }
}

export const audio = new AudioEngine();
