// Synthesized sound for Glowtide Keep. Every effect is built from
// oscillators and filtered noise in code; the game ships no audio files.
// Audio starts only after a player gesture, and every call is guarded so
// a browser without WebAudio still plays silently.

function makeTone(ctx, dest, freq, freqEnd, dur, type, gain, when) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (freqEnd !== null && freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), when + dur);
  }
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(amp);
  amp.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

function makeNoise(ctx, dest, dur, gain, when, filterFreq) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(dest);
  src.start(when);
}

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastShoot = 0;
    this.padNodes = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  tone(freq, freqEnd, dur, type, gain) {
    if (!this.ctx || !this.master || this.muted) return;
    try {
      makeTone(this.ctx, this.master, freq, freqEnd, dur, type, gain, this.ctx.currentTime);
    } catch { /* silent */ }
  }

  noise(dur, gain, filterFreq) {
    if (!this.ctx || !this.master || this.muted) return;
    try {
      makeNoise(this.ctx, this.master, dur, gain, this.ctx.currentTime, filterFreq);
    } catch { /* silent */ }
  }

  shoot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastShoot < 0.05) return;
    this.lastShoot = now;
    this.tone(880, 420, 0.07, 'square', 0.05);
  }

  dash() {
    this.noise(0.16, 0.12, 1800);
    this.tone(220, 520, 0.14, 'sine', 0.06);
  }

  hit() {
    this.tone(190, 90, 0.08, 'triangle', 0.09);
  }

  enemyDown() {
    this.tone(520, 130, 0.16, 'sawtooth', 0.06);
    this.noise(0.12, 0.08, 900);
  }

  pickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      makeTone(this.ctx, this.master, 660, null, 0.09, 'sine', 0.09, t);
      makeTone(this.ctx, this.master, 990, null, 0.12, 'sine', 0.09, t + 0.07);
    } catch { /* silent */ }
  }

  hurt() {
    this.tone(160, 60, 0.22, 'sawtooth', 0.12);
  }

  waveStart() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      makeTone(this.ctx, this.master, 196, null, 0.35, 'triangle', 0.1, t);
      makeTone(this.ctx, this.master, 294, null, 0.35, 'triangle', 0.1, t + 0.12);
    } catch { /* silent */ }
  }

  upgradePick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      [523, 659, 784].forEach((f, i) => {
        makeTone(this.ctx, this.master, f, null, 0.14, 'sine', 0.08, t + i * 0.07);
      });
    } catch { /* silent */ }
  }

  click() {
    this.tone(700, 500, 0.05, 'sine', 0.06);
  }

  victory() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      [392, 494, 587, 784, 988].forEach((f, i) => {
        makeTone(this.ctx, this.master, f, null, 0.28, 'triangle', 0.09, t + i * 0.13);
      });
    } catch { /* silent */ }
  }

  defeat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      [330, 262, 196, 147].forEach((f, i) => {
        makeTone(this.ctx, this.master, f, null, 0.34, 'triangle', 0.09, t + i * 0.18);
      });
    } catch { /* silent */ }
  }

  startPad() {
    if (!this.ctx || this.padNodes || this.muted) return;
    try {
      const ctx = this.ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      gain.connect(this.master);
      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = 110;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 164.8;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      o1.connect(gain);
      o2.connect(gain);
      o1.start();
      o2.start();
      lfo.start();
      this.padNodes = { gain, o1, o2, lfo };
    } catch {
      this.padNodes = null;
    }
  }

  stopPad() {
    if (!this.padNodes) return;
    try {
      this.padNodes.o1.stop();
      this.padNodes.o2.stop();
      this.padNodes.lfo.stop();
      this.padNodes.gain.disconnect();
    } catch { /* silent */ }
    this.padNodes = null;
  }
}
