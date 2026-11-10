export class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('underneath3120_audio') !== 'off';
    this.master = null;
    this.drone = null;
    this.started = false;
    this.lastUi = 0;
  }

  start() {
    if (this.started || !this.enabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.26;
      this.master.connect(this.ctx.destination);
      const droneGain = this.ctx.createGain();
      droneGain.gain.value = 0.038;
      droneGain.connect(this.master);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 190;
      filter.Q.value = 1.4;
      filter.connect(droneGain);
      [41.2, 55, 82.4].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i === 2 ? 'triangle' : 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = i === 1 ? 7 : -4;
        const g = this.ctx.createGain();
        g.gain.value = i === 2 ? 0.24 : 0.4;
        osc.connect(g); g.connect(filter); osc.start();
      });
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.016;
      lfo.connect(lfoGain); lfoGain.connect(droneGain.gain); lfo.start();
      this.drone = droneGain;
      this.started = true;
      this.chime();
    } catch {}
  }

  chime() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    [220, 329.6, 440].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05 / (i + 1), t + 0.02 + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3 + i * 0.2);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.06); o.stop(t + 1.7 + i * 0.2);
    });
  }

  ui() {
    if (!this.ctx || !this.enabled) return;
    const now = performance.now();
    if (now - this.lastUi < 45) return;
    this.lastUi = now;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(980, t); o.frequency.exponentialRampToValueAtTime(540, t + 0.045);
    g.gain.setValueAtTime(0.018, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.07);
  }

  reward() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    [440, 554.4, 659.3, 880].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.02 + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55 + i * 0.1);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.07); o.stop(t + 0.8 + i * 0.1);
    });
  }

  hit() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, 2200, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = this.ctx.createBufferSource(); src.buffer = buffer;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 820;
    const g = this.ctx.createGain(); g.gain.value = 0.12;
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
  }

  engine(on) {
    if (!this.ctx || !this.enabled) return;
    if (on && !this.engineNodes) {
      const o = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 48; o2.frequency.value = 24;
      f.type = 'lowpass'; f.frequency.value = 240;
      g.gain.value = 0.0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(this.master);
      o.start(); o2.start();
      this.engineNodes = { o, o2, g, f };
      g.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 0.4);
    } else if (!on && this.engineNodes) {
      const { o, o2, g } = this.engineNodes;
      g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      setTimeout(() => { try { o.stop(); o2.stop(); } catch {} }, 320);
      this.engineNodes = null;
    }
  }

  setEngineSpeed(speed) {
    if (!this.engineNodes) return;
    const ratio = Math.min(1, Math.abs(speed) / 26);
    this.engineNodes.o.frequency.setTargetAtTime(48 + ratio * 90, this.ctx.currentTime, 0.12);
    this.engineNodes.o2.frequency.setTargetAtTime(24 + ratio * 38, this.ctx.currentTime, 0.12);
    this.engineNodes.g.gain.setTargetAtTime(0.025 + ratio * 0.04, this.ctx.currentTime, 0.15);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('underneath3120_audio', this.enabled ? 'on' : 'off');
    if (this.enabled) this.start();
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? 0.26 : 0.0001, this.ctx.currentTime, 0.08);
    return this.enabled;
  }

  suspend() { this.ctx?.suspend?.(); }
  resume() { this.ctx?.resume?.(); }
}
