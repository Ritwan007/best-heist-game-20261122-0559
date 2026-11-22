// The Gilded Gallery — small synthesised sounds, no audio files.
// One job: short WebAudio blips for pickup, alarm, caught and getaway.
// Silent until the player first presses a key or clicks (browser rule).
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  blip(freq, seconds, type, gainValue, when = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(gainValue, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + seconds + 0.02);
    } catch {
      // Sound is garnish; a failure here must never break the game.
    }
  }

  pickup() {
    this.blip(880, 0.12, 'sine', 0.12);
    this.blip(1318, 0.18, 'sine', 0.1, 0.07);
  }

  diamond() {
    this.blip(523, 0.14, 'triangle', 0.14);
    this.blip(784, 0.14, 'triangle', 0.14, 0.1);
    this.blip(1046, 0.22, 'triangle', 0.14, 0.2);
  }

  alarmTick() {
    this.blip(220, 0.1, 'square', 0.05);
  }

  caught() {
    this.blip(196, 0.3, 'sawtooth', 0.12);
    this.blip(147, 0.45, 'sawtooth', 0.12, 0.18);
  }

  getaway() {
    this.blip(523, 0.16, 'triangle', 0.13);
    this.blip(659, 0.16, 'triangle', 0.13, 0.12);
    this.blip(784, 0.16, 'triangle', 0.13, 0.24);
    this.blip(1046, 0.3, 'triangle', 0.13, 0.36);
  }

  tool() {
    this.blip(330, 0.1, 'sine', 0.1);
    this.blip(262, 0.16, 'sine', 0.1, 0.06);
  }
}
