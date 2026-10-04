// Web Audio API procedural sound synthesizer for Formula 1 motorsport acoustics, scroll audio, and tactile UI
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    
    // Continuous scroll sound nodes
    this.scrollEngineOsc1 = null;
    this.scrollEngineOsc2 = null;
    this.scrollTurboWhistle = null;
    this.scrollFilter = null;
    this.scrollMasterGain = null;
    this.scrollTurboGain = null;
    this.isScrollAudioActive = false;
    this.scrollDecayTimer = null;
    this.lastScrollTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.setupContinuousScrollAudio();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupContinuousScrollAudio() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Master gain for scrolling sound
      this.scrollMasterGain = this.ctx.createGain();
      this.scrollMasterGain.gain.setValueAtTime(0, now);

      // Low pass resonant filter for throaty V6 hybrid growl
      this.scrollFilter = this.ctx.createBiquadFilter();
      this.scrollFilter.type = 'lowpass';
      this.scrollFilter.frequency.setValueAtTime(320, now);
      this.scrollFilter.Q.setValueAtTime(4.0, now);

      // Primary V6 Sawtooth generator (main cylinder firing)
      this.scrollEngineOsc1 = this.ctx.createOscillator();
      this.scrollEngineOsc1.type = 'sawtooth';
      this.scrollEngineOsc1.frequency.setValueAtTime(75, now);

      // Secondary V6 harmonic oscillator (tuned 1 octave lower for deep mechanical bass)
      this.scrollEngineOsc2 = this.ctx.createOscillator();
      this.scrollEngineOsc2.type = 'triangle';
      this.scrollEngineOsc2.frequency.setValueAtTime(37.5, now);

      // Turbocharger Whistle Generator (high-frequency electric MGU-H spool)
      this.scrollTurboWhistle = this.ctx.createOscillator();
      this.scrollTurboWhistle.type = 'sine';
      this.scrollTurboWhistle.frequency.setValueAtTime(580, now);

      this.scrollTurboGain = this.ctx.createGain();
      this.scrollTurboGain.gain.setValueAtTime(0, now);

      // Aerodynamic aerodynamic wind noise
      const bufferSize = this.ctx.sampleRate * 2.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.35;
      }
      const windBuffer = this.ctx.createBufferSource();
      windBuffer.buffer = buffer;
      windBuffer.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(650, now);
      windFilter.Q.setValueAtTime(1.8, now);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.09, now);

      windBuffer.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.scrollMasterGain);

      // Connect Turbo
      this.scrollTurboWhistle.connect(this.scrollTurboGain);
      this.scrollTurboGain.connect(this.scrollMasterGain);

      // Connect Oscillators
      this.scrollEngineOsc1.connect(this.scrollFilter);
      this.scrollEngineOsc2.connect(this.scrollFilter);
      this.scrollFilter.connect(this.scrollMasterGain);

      // Output to speakers
      this.scrollMasterGain.connect(this.ctx.destination);

      this.scrollEngineOsc1.start();
      this.scrollEngineOsc2.start();
      this.scrollTurboWhistle.start();
      windBuffer.start();
      this.isScrollAudioActive = true;
    } catch (e) {
      console.warn('Scroll audio setup notice:', e);
    }
  }

  // Modulates dynamic F1 engine pitch, turbo whine, and resonant exhaust volume on scroll
  onScroll(scrollDelta) {
    if (this.isMuted) return;
    this.init();

    if (!this.scrollMasterGain || !this.scrollEngineOsc1) return;

    try {
      const now = this.ctx.currentTime;
      // Normalizing velocity: delta is typically between 5 and 120
      const velocity = Math.min(120, Math.max(2, scrollDelta));
      const normalizedSpeed = velocity / 100;

      // Dynamic F1 engine pitch: sweeps from 80Hz (idle) to 360Hz (full throttle)
      const targetHz = 80 + Math.pow(normalizedSpeed, 1.15) * 280;
      // Turbocharger electric whistle: sweeps from 600Hz to 1650Hz
      const turboHz = 600 + normalizedSpeed * 1050;
      // Resonant filter opens up as speed increases
      const filterCutoff = 320 + normalizedSpeed * 1650;
      // Volume scales cleanly and generously without distortion
      const targetVol = 0.05 + Math.min(0.24, normalizedSpeed * 0.22);
      const turboVol = Math.min(0.08, normalizedSpeed * 0.08);

      this.scrollEngineOsc1.frequency.setTargetAtTime(targetHz, now, 0.04);
      this.scrollEngineOsc2.frequency.setTargetAtTime(targetHz * 0.5, now, 0.04);
      this.scrollTurboWhistle.frequency.setTargetAtTime(turboHz, now, 0.05);
      this.scrollFilter.frequency.setTargetAtTime(filterCutoff, now, 0.06);

      this.scrollMasterGain.gain.setTargetAtTime(targetVol, now, 0.035);
      this.scrollTurboGain.gain.setTargetAtTime(turboVol, now, 0.04);

      // Settle down smoothly after user pauses scrolling
      clearTimeout(this.scrollDecayTimer);
      this.scrollDecayTimer = setTimeout(() => {
        if (this.scrollMasterGain && this.ctx) {
          const t = this.ctx.currentTime;
          this.scrollMasterGain.gain.setTargetAtTime(0, t, 0.28);
          this.scrollTurboGain.gain.setTargetAtTime(0, t, 0.22);
          this.scrollEngineOsc1.frequency.setTargetAtTime(75, t, 0.35);
          this.scrollEngineOsc2.frequency.setTargetAtTime(37.5, t, 0.35);
          this.scrollFilter.frequency.setTargetAtTime(320, t, 0.35);
        }
      }, 140);
    } catch (e) {}
  }

  // Continuous Two-Step Launch Control Limiter & Flame Pop Sound when parked
  setLaunchLimiter(active, intensity = 1.0) {
    if (this.isMuted) return;
    this.init();

    if (active) {
      if (!this.limiterOsc) {
        try {
          const now = this.ctx.currentTime;
          this.limiterOsc = this.ctx.createOscillator();
          this.limiterOsc.type = 'sawtooth';
          this.limiterOsc.frequency.setValueAtTime(118, now); // F1 hybrid 4,500 RPM idle limiter

          // High-speed 26Hz modulation LFO for machine-gun cylinder chop
          this.limiterLFO = this.ctx.createOscillator();
          this.limiterLFO.type = 'square';
          this.limiterLFO.frequency.setValueAtTime(26, now);

          const lfoAmp = this.ctx.createGain();
          lfoAmp.gain.setValueAtTime(0.5, now);

          this.limiterGate = this.ctx.createGain();
          this.limiterGate.gain.setValueAtTime(0.5, now);

          this.limiterLFO.connect(lfoAmp);
          lfoAmp.connect(this.limiterGate.gain);

          this.limiterFilter = this.ctx.createBiquadFilter();
          this.limiterFilter.type = 'lowpass';
          this.limiterFilter.frequency.setValueAtTime(920, now);
          this.limiterFilter.Q.setValueAtTime(3.8, now);

          this.limiterMasterGain = this.ctx.createGain();
          this.limiterMasterGain.gain.setValueAtTime(0, now);

          this.limiterOsc.connect(this.limiterGate);
          this.limiterGate.connect(this.limiterFilter);
          this.limiterFilter.connect(this.limiterMasterGain);
          this.limiterMasterGain.connect(this.ctx.destination);

          this.limiterOsc.start();
          this.limiterLFO.start();
        } catch (e) {}
      }

      if (this.limiterMasterGain && this.ctx) {
        const targetVol = Math.min(0.16, 0.11 * intensity);
        this.limiterMasterGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
      }
    } else {
      if (this.limiterMasterGain && this.ctx) {
        this.limiterMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      }
    }
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.scrollMasterGain) this.scrollMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.limiterMasterGain) this.limiterMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  playHover() {
    if (this.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch (e) {}
  }

  playSwoosh() {
    if (this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.28;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.14);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.28);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  revEngine(callback) {
    if (this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const duration = 2.4;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc2.type = 'triangle';

      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.9);
      osc.frequency.exponentialRampToValueAtTime(380, now + 1.5);
      osc.frequency.exponentialRampToValueAtTime(80, now + duration);

      osc2.frequency.setValueAtTime(45, now);
      osc2.frequency.exponentialRampToValueAtTime(210, now + 0.9);
      osc2.frequency.exponentialRampToValueAtTime(40, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + 0.9);
      filter.frequency.exponentialRampToValueAtTime(350, now + duration);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.26, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(now + duration);
      osc2.stop(now + duration);

      if (callback) {
        const interval = 40;
        const totalSteps = (duration * 1000) / interval;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / totalSteps;
          let rpm = 2500;
          if (progress < 0.4) {
            rpm = 2500 + (progress / 0.4) * 11500;
          } else if (progress < 0.65) {
            rpm = 14000 - Math.sin((progress - 0.4) * 10) * 800;
          } else {
            rpm = 13200 - ((progress - 0.65) / 0.35) * 10700;
          }
          callback(Math.round(rpm));
          if (step >= totalSteps) {
            clearInterval(timer);
            callback(2200);
          }
        }, interval);
      }
    } catch (e) {}
  }
}

export const sounds = new SoundEngine();
