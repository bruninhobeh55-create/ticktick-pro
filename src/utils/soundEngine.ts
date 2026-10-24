/**
 * Web Audio API Synthesizer for TickTick Premium White Noise & Task Chimes
 * Generates studio-quality ambient noise (Rain, Forest Wind, Deep Focus Pink Noise,
 * Binaural Alpha Waves, Cozy Brown Noise, Ticking Clock) without external MP3 dependencies.
 */

export type WhiteNoiseId =
  | 'none'
  | 'rain'
  | 'forest-wind'
  | 'deep-pink'
  | 'cafe-brown'
  | 'binaural-alpha'
  | 'clock-tick';

export interface WhiteNoiseOption {
  id: WhiteNoiseId;
  name: string;
  subtitle: string;
  isPremium: boolean;
  icon: string;
}

export const WHITE_NOISE_OPTIONS: WhiteNoiseOption[] = [
  { id: 'none', name: 'Silent', subtitle: 'No ambient audio', isPremium: false, icon: 'volume-x' },
  { id: 'clock-tick', name: 'Mechanical Tick', subtitle: '60 BPM precision pulse', isPremium: false, icon: 'clock' },
  { id: 'rain', name: 'Summer Rain', subtitle: 'Bandpass rainfall texture', isPremium: true, icon: 'cloud-rain' },
  { id: 'cafe-brown', name: 'Warm Study', subtitle: 'Low-frequency brown noise', isPremium: true, icon: 'coffee' },
  { id: 'forest-wind', name: 'Pine Breeze', subtitle: 'LFO-modulated wind filter', isPremium: true, icon: 'trees' },
  { id: 'deep-pink', name: 'Flow State', subtitle: 'Balanced -3dB/oct pink noise', isPremium: true, icon: 'waves' },
  { id: 'binaural-alpha', name: 'Alpha 10Hz', subtitle: '400Hz / 410Hz harmonic carrier', isPremium: true, icon: 'activity' },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;
  private tickInterval: number | null = null;
  private currentNoise: WhiteNoiseId = 'none';
  private volume = 0.35;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public playCompletionBell() {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.42);
      osc2.stop(now + 0.42);
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  public playPomodoroCompleteAlarm() {
    try {
      const ctx = this.ensureContext();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      // Ignore
    }
  }

  public stopWhiteNoise() {
    if (this.tickInterval) {
      window.clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped
      }
    });
    this.activeNodes = [];
    this.currentNoise = 'none';
  }

  public startWhiteNoise(type: WhiteNoiseId, volume = this.volume) {
    this.stopWhiteNoise();
    this.volume = volume;
    this.currentNoise = type;
    if (type === 'none') return;

    try {
      const ctx = this.ensureContext();
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume, ctx.currentTime);
      master.connect(ctx.destination);
      this.masterGain = master;
      this.activeNodes.push(master);

      if (type === 'clock-tick') {
        const triggerTick = () => {
          if (this.currentNoise !== 'clock-tick') return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
          g.gain.setValueAtTime(0.25, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(g);
          g.connect(master);
          osc.start(now);
          osc.stop(now + 0.035);
        };
        triggerTick();
        this.tickInterval = window.setInterval(triggerTick, 1000);
        return;
      }

      if (type === 'binaural-alpha') {
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.25, ctx.currentTime);

        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.setValueAtTime(400, ctx.currentTime);
        oscR.frequency.setValueAtTime(410, ctx.currentTime);

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(subGain);
        subGain.connect(master);

        oscL.start();
        oscR.start();
        this.activeNodes.push(oscL, oscR, merger, subGain);
        return;
      }

      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      if (type === 'cafe-brown' || type === 'rain') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.2;
        }
      } else {
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.08;
          b6 = white * 0.115926;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, ctx.currentTime);
        filter.Q.setValueAtTime(0.7, ctx.currentTime);
      } else if (type === 'forest-wind') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, ctx.currentTime);
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
        lfoGain.gain.setValueAtTime(220, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.activeNodes.push(lfo, lfoGain);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      }

      noiseSource.connect(filter);
      filter.connect(master);
      noiseSource.start();
      this.activeNodes.push(noiseSource, filter);
    } catch {
      // Ignore if audio context not allowed yet
    }
  }
}

export const soundEngine = new SoundEngine();
