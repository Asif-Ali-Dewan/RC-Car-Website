import { animate, stagger } from 'animejs';

/**
 * VideoStageEngine - High-performance cinematic video controller
 * Replaces synthetic 3D mesh with the photorealistic Desert F1 Car video.
 * Handles smooth scroll scrubbing, playback velocity sync, interactive hotspots, and cinema mode.
 */
export class VideoStageEngine {
  constructor(videoElementId = 'desert-f1-video') {
    this.video = document.getElementById(videoElementId);
    this.isPlaying = true;
    this.isCinemaScope = false;
    this.showHotspots = true;
    this.scrollProgress = 0;
    this.targetTime = 0;
    this.lastScrollY = window.scrollY;
    this.scrollVelocity = 0;
    this.decayTimer = null;

    this.init();
  }

  init() {
    if (!this.video) return;

    // Ensure video is properly configured for background autoplay
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.loop = true;

    // Attempt autoplay
    const playPromise = this.video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback: resume on first user interaction
        window.addEventListener('click', () => this.video.play(), { once: true });
        window.addEventListener('scroll', () => this.video.play(), { once: true });
      });
    }

    // Attach Video Event Listeners
    this.setupControls();
    this.setupHotspots();
    this.startLoop();
  }

  setupControls() {
    // 1. Play / Pause Toggle Button
    const playBtn = document.getElementById('btn-video-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (this.video.paused) {
          this.video.play();
          this.isPlaying = true;
          playBtn.classList.remove('active');
          playBtn.querySelector('.tool-text').textContent = 'PAUSE CAR';
        } else {
          this.video.pause();
          this.isPlaying = false;
          playBtn.classList.add('active');
          playBtn.querySelector('.tool-text').textContent = 'RESUME CRUISE';
        }
      });
    }

    // 2. Cinema Scope Toggle Button
    const cinemaBtn = document.getElementById('btn-cinema');
    if (cinemaBtn) {
      cinemaBtn.addEventListener('click', () => {
        this.isCinemaScope = document.body.classList.toggle('cinema-scope-active');
        cinemaBtn.classList.toggle('active', this.isCinemaScope);
      });
    }

    // 3. Hotspots Toggle Button
    const hotspotBtn = document.getElementById('btn-toggle-hotspots');
    if (hotspotBtn) {
      hotspotBtn.addEventListener('click', () => {
        this.showHotspots = !this.showHotspots;
        document.querySelectorAll('.car-hotspot-pin').forEach((pin) => {
          pin.style.display = this.showHotspots ? 'flex' : 'none';
        });
        hotspotBtn.classList.toggle('active', this.showHotspots);
      });
    }
  }

  setupHotspots() {
    // Interactive Anime.js animations for telemetry pins on hover
    document.querySelectorAll('.car-hotspot-pin').forEach((pin) => {
      pin.addEventListener('mouseenter', () => {
        animate(pin.querySelector('.hotspot-card'), {
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.92, 1],
          duration: 350,
          ease: 'outBack'
        });
      });
    });
  }

  // Called continuously from main scroll loop
  onScroll(progress, delta) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
    this.scrollVelocity = delta;

    if (!this.video) return;

    // 1. Cinematic Scale & Parallax: Video smoothly zooms as user delves into the speed experience
    const scale = 1.04 + this.scrollProgress * 0.14;
    const translateY = this.scrollProgress * -35;
    this.video.style.transform = `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`;

    // 2. Dynamic Playback Velocity: Video accelerates when user scrolls quickly
    if (delta > 3) {
      const dynamicRate = Math.min(2.5, 1.0 + (delta / 35));
      this.video.playbackRate = dynamicRate;
    }

    clearTimeout(this.decayTimer);
    this.decayTimer = setTimeout(() => {
      if (this.video) {
        this.video.playbackRate = 1.0;
      }
    }, 150);

    // 3. Hotspots Dynamic Positioning and Visibility during scroll stages
    const hotspotsContainer = document.getElementById('video-hotspots-container');
    if (hotspotsContainer) {
      // Hotspots are prominent in Hero & Engineering stages (0 to 0.45)
      const opacity = this.scrollProgress < 0.35 ? 1 : Math.max(0, 1 - (this.scrollProgress - 0.35) * 4);
      hotspotsContainer.style.opacity = opacity;
      hotspotsContainer.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
    }
  }

  // Boost speed burst (for REV button or Spacebar)
  triggerSpeedBoost() {
    if (!this.video) return;
    this.video.playbackRate = 2.4;
    animate(this.video, {
      filter: ['contrast(1.15) saturate(1.2) brightness(0.92)', 'contrast(1.3) saturate(1.4) brightness(1.15)', 'contrast(1.15) saturate(1.2) brightness(0.92)'],
      duration: 1800,
      ease: 'outCubic',
      onComplete: () => {
        if (this.video) this.video.playbackRate = 1.0;
      }
    });
  }

  startLoop() {
    const update = () => {
      requestAnimationFrame(update);
    };
    update();
  }
}
