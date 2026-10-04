import { animate, stagger } from 'animejs';

/**
 * AnimeStaggerTest - Component demonstrating staggered animations using Anime.js
 */
export class AnimeStaggerTest {
  constructor(mountContainerId = 'anime-stagger-root') {
    this.containerId = mountContainerId;
    this.container = document.getElementById(mountContainerId);
    this.items = [
      { id: 1, title: 'AERO // DOWNFORCE', value: '42.8 KG', desc: 'Front wing vortex load', color: '#00f0ff' },
      { id: 2, title: 'TELEMETRY // ESC', value: '160A PEAK', desc: 'Active FET phase control', color: '#ff1844' },
      { id: 3, title: 'POWERTRAIN // 6S', value: '22.2V 98%', desc: 'Graphene cell discharge', color: '#ffb800' },
      { id: 4, title: 'MOTOR // RPM', value: '38,200', desc: '4-pole brushless sensor', color: '#00ff88' },
      { id: 5, title: 'SUSPENSION // TRAVEL', value: '12.4 MM', desc: 'Coilover pushrod damper', color: '#00f0ff' },
      { id: 6, title: 'DRS // ACTUATOR', value: 'ACTIVE [85MM]', desc: 'Micro titanium servo', color: '#ff1844' },
      { id: 7, title: 'BRAKE // HEAT', value: '620°C GLOW', desc: 'Carbon-ceramic disc', color: '#ffb800' },
      { id: 8, title: 'CIRCUIT // SECTOR', value: 'S1 [00:11.2]', desc: 'Apex Monza loop', color: '#00ff88' }
    ];
    this.currentAnimation = null;
    this.init();
  }

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.containerId;
      const targetMount = document.querySelector('.hero-section') || document.body;
      targetMount.parentNode.insertBefore(this.container, targetMount.nextSibling);
    }

    this.render();
    this.attachEvents();
    
    // Automatically trigger initial staggered entrance animation
    setTimeout(() => {
      this.playStaggerEntrance();
    }, 200);
  }

  render() {
    this.container.innerHTML = `
      <section class="story-section anime-lab-section" id="anime-lab">
        <div class="section-inner">
          <div class="section-header">
            <div class="anime-badge-strip">
              <span class="pulse-dot"></span>
              <span class="mono-code">ANIME.JS V4 ENGINE INTEGRATED</span>
              <span class="separator">/</span>
              <span class="mono-code" id="anime-status-text">STATUS: INITIALIZING...</span>
            </div>
            <h2 class="section-heading">KINETIC STAGGERED TELEMETRY LAB</h2>
            <p class="section-lead">Testing smooth staggered layouts powered by Anime.js. Each telemetry node cascades with variable cubic physics and coordinate transforms.</p>
          </div>

          <!-- Interactive Control Toolbar -->
          <div class="anime-controls-toolbar">
            <button class="primary-btn" id="btn-anime-replay">
              <span>⟳ REPLAY STAGGER</span>
            </button>
            <button class="secondary-btn" id="btn-anime-wave">
              <span>⚡ KINETIC WAVE</span>
            </button>
            <button class="secondary-btn" id="btn-anime-reverse">
              <span>⇄ REVERSE STAGGER</span>
            </button>
          </div>

          <!-- Staggered Grid Container -->
          <div class="stagger-grid" id="stagger-grid-target">
            ${this.items.map((item, idx) => `
              <div class="stagger-card" data-idx="${idx}" style="border-top-color: ${item.color};">
                <div class="stagger-card-header">
                  <span class="stagger-idx">[0${item.id}]</span>
                  <span class="stagger-ping" style="background: ${item.color};"></span>
                </div>
                <div class="stagger-title">${item.title}</div>
                <div class="stagger-value" style="color: ${item.color};">${item.value}</div>
                <div class="stagger-desc">${item.desc}</div>
                <div class="stagger-bar-wrap">
                  <div class="stagger-bar-fill" style="background: ${item.color}; width: ${60 + (idx * 5)}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  attachEvents() {
    const replayBtn = this.container.querySelector('#btn-anime-replay');
    const waveBtn = this.container.querySelector('#btn-anime-wave');
    const reverseBtn = this.container.querySelector('#btn-anime-reverse');

    if (replayBtn) replayBtn.addEventListener('click', () => this.playStaggerEntrance());
    if (waveBtn) waveBtn.addEventListener('click', () => this.playKineticWave());
    if (reverseBtn) reverseBtn.addEventListener('click', () => this.playReverseStagger());
  }

  updateStatus(message) {
    const statusElem = this.container.querySelector('#anime-status-text');
    if (statusElem) {
      statusElem.textContent = `STATUS: ${message.toUpperCase()}`;
    }
  }

  playStaggerEntrance() {
    this.updateStatus('EXECUTING STAGGER ENTRANCE (80MS OFFSET)...');
    const cards = this.container.querySelectorAll('.stagger-card');

    // Reset initial state
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px) scale(0.85)';
    });

    try {
      this.currentAnimation = animate(cards, {
        opacity: [0, 1],
        translateY: [50, 0],
        scale: [0.85, 1],
        delay: stagger(80, { start: 50 }),
        duration: 750,
        ease: 'outBack',
        onComplete: () => {
          this.updateStatus('ANIMATION COMPLETE // 8 TILES SYNCED');
        }
      });
    } catch (e) {
      console.error('Anime.js execution error:', e);
      this.updateStatus('ERROR: ' + e.message);
    }
  }

  playKineticWave() {
    this.updateStatus('EXECUTING KINETIC WAVE ROTATION...');
    const cards = this.container.querySelectorAll('.stagger-card');

    try {
      animate(cards, {
        translateY: [0, -20, 0],
        rotateZ: [0, 4, -4, 0],
        delay: stagger(60, { from: 'center' }),
        duration: 800,
        ease: 'inOutQuad',
        onComplete: () => {
          this.updateStatus('WAVE COMPLETE // ALL NODES AT REST');
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  playReverseStagger() {
    this.updateStatus('EXECUTING REVERSE STAGGER...');
    const cards = this.container.querySelectorAll('.stagger-card');

    try {
      animate(cards, {
        opacity: [1, 0.3, 1],
        scale: [1, 0.9, 1],
        translateY: [0, -15, 0],
        delay: stagger(90, { from: 'last' }),
        duration: 700,
        ease: 'outCubic',
        onComplete: () => {
          this.updateStatus('REVERSE STAGGER COMPLETE');
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
}
