import confetti from 'canvas-confetti';
import { animate, stagger } from 'animejs';
import { sounds } from './audio.js';
import { CircuitVisualizer } from './experienceTrack.js';
import { AnimeStaggerTest } from './animeStaggerTest.js';
import { Car3DScene } from './threeScene.js';

// ==========================================================================
// 1. STATE & DATA STORE (CURATED & DE-CLUTTERED)
// ==========================================================================
const STORE_PRODUCTS = [
  {
    id: 'apex-f1-desert-pro',
    title: 'Apex F1-Pro 1:8 Champagne Gold Edition',
    scale: '1:8 SCALE // RTR',
    badge: 'NEW LUXURY SPEC',
    category: 'formula',
    price: 649,
    image: '/assets/f1-gold-studio.jpg',
    specs: '6S LiPo Ready, 3800KV Brushless Motor, 135 km/h, 4mm T700 Dry Carbon, Gold Champagne Aero Wings'
  },
  {
    id: 'lotus-classic-collector',
    title: 'Lotus 97T Historic Turbo 1:8 Museum Static',
    scale: '1:8 SCALE // EXHIBIT',
    badge: 'LEGEND CLASSIC',
    category: 'collector',
    price: 899,
    image: '/assets/f1-lotus-teal.jpg',
    specs: 'Classic turbo-era side profile, Goodyear racing slicks, gold BBS wheels, museum acrylic display case'
  },
  {
    id: 'stealth-x-monocoque',
    title: 'Dark Shadow Monocoque 1:8 Telemetry RC',
    scale: '1:8 SCALE // PRO KIT',
    badge: 'LIMITED (50)',
    category: 'formula',
    price: 949,
    image: '/assets/f1-carbon-blueprint.jpg',
    specs: 'Exposed V6 hybrid carbon tub, active titanium pushrods, dual gyro yaw stabilization, 160A Telemetry ESC'
  },
  {
    id: 'apex-trophy-truck',
    title: 'Fox Racing Trophy RC 1:10 Desert Master',
    scale: '1:10 SCALE // 4WD OFF-ROAD',
    badge: 'DIRT RACING',
    category: 'touring',
    price: 529,
    image: '/assets/rc-trophy-truck.jpg',
    specs: 'High-travel long-arm suspension, aluminum threaded oil shocks, dirt rooster-tail compound, waterproof electronics'
  },
  {
    id: 'apex-drift-spec',
    title: 'Apex Drift-Spec GT 1:10 Gyro RWD',
    scale: '1:10 SCALE // DRIFT',
    badge: 'PRO DRIFT',
    category: 'touring',
    price: 429,
    image: '/assets/rc-drift-purple.jpg',
    specs: 'Adjustable steering angle (68° lock), magnetic body mounts, neon chassis underglow, high-speed titanium gear servo'
  },
  {
    id: 'rb19-collector-edition',
    title: 'Red Bull RB19 Ground Effect 1:8 Display Replica',
    scale: '1:8 SCALE // MUSEUM',
    badge: 'CHAMPION EDITION',
    category: 'collector',
    price: 980,
    image: '/assets/f1-redbull-top.jpg',
    specs: 'Exact 3D laser-scanned aero tunnels, 21-win commemorative plaque, driver helmet included'
  }
];

const LEADERBOARD_DATA = [
  { pos: '01', pilot: 'V. Verstappen // Call: APX-01', car: 'Apex 1:8 Brushless Formula', time: '00:38.412', speed: '134.2 KM/H', status: 'RECORD LAP' },
  { pos: '02', pilot: 'L. Hamilton // Call: STEALTH-44', car: 'F1 Sim Pod 01 (Monza Spec)', time: '00:39.108', speed: '131.8 KM/H', status: 'CONFIRMED' },
  { pos: '03', pilot: 'A. Senna // Call: APEX-LEGEND', car: 'Apex 1:8 Brushless Formula', time: '00:39.845', speed: '129.5 KM/H', status: 'CONFIRMED' },
  { pos: '04', pilot: 'C. Leclerc // Call: CORSA-16', car: 'F1 Sim Pod 04 (Spa Spec)', time: '00:40.231', speed: '128.0 KM/H', status: 'CONFIRMED' },
  { pos: '05', pilot: 'G. Russell // Call: ARROW-63', car: 'Monocoque X-1 1:10 Touring', time: '00:41.050', speed: '124.6 KM/H', status: 'CONFIRMED' }
];

let cart = [];

// ==========================================================================
// 2. INITIALIZE APP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Genuine 3D Formula 1 Moving Car Scene with 0-360° Continuous Orbit
  let carScene = null;
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    carScene = new Car3DScene(canvasContainer);
  }

  // 2. Initialize GP Circuit Visualizer
  const circuitCanvas = document.getElementById('circuit-canvas');
  if (circuitCanvas) {
    const circuitTelemetryUI = {
      speedElem: document.getElementById('circuit-speed-val'),
      sectorElem: document.getElementById('circuit-sector-val'),
      throttleElem: document.getElementById('circuit-throttle-fill'),
      cornerInfo: document.getElementById('corner-info-box')
    };
    new CircuitVisualizer(circuitCanvas, circuitTelemetryUI);
  }

  // 3. Audio & SFX Setup
  setupAudioEngine();

  // 4. Scroll Timeline & 0-360° Camera Orbit Synchronization
  setupScrollTimeline(carScene);

  // 5. HUD & Tool Controls & 360° Angle Presets
  setupHudControls(carScene);

  // 6. Configurator Studio with 3D Livery Switcher
  setupConfigurator(carScene);

  // 7. Store & Shopping Cart
  setupStore();

  // 8. Experience Center Booking Form
  setupBookingModule();

  // 9. Blueprint Inspection Modals
  setupBlueprintModals();

  // 10. Populate Leaderboard
  renderLeaderboard();

  // 11. Keyboard Shortcuts
  setupKeyboardShortcuts(carScene);

  // 12. Anime.js Stagger Animation Test Lab
  new AnimeStaggerTest('anime-stagger-root');

  // 13. Anime.js Entrance Animations for Hero
  playHeroEntranceAnime();

  // 14. Architecture Section 02 Subsystem Tabs & Flip Alignment
  setupArchitectureSection(carScene);

  // 15. Experience Center Showcase Video Playback Assurance
  const expVideo = document.querySelector('.showcase-visual video');
  if (expVideo) {
    const playExpVideo = () => {
      expVideo.play().catch(() => {});
    };
    playExpVideo();
    window.addEventListener('scroll', playExpVideo, { once: true });
    window.addEventListener('click', playExpVideo, { once: true });
    window.addEventListener('touchstart', playExpVideo, { once: true });
  }
});

// ==========================================================================
// 3. ANIME.JS ENTRANCE ANIMATIONS
// ==========================================================================
function playHeroEntranceAnime() {
  try {
    animate('.hero-badge', {
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 600,
      ease: 'outBack'
    });

    animate('.title-line', {
      opacity: [0, 1],
      translateX: [-40, 0],
      delay: stagger(120, { start: 200 }),
      duration: 800,
      ease: 'outCubic'
    });

    animate('.metric-card', {
      opacity: [0, 1],
      scale: [0.85, 1],
      delay: stagger(90, { start: 500 }),
      duration: 650,
      ease: 'outBack'
    });
  } catch (e) {
    console.warn('Anime.js hero entrance notice:', e);
  }
}

// ==========================================================================
// 4. AUDIO ENGINE & SOUND EFFECTS
// ==========================================================================
function setupAudioEngine() {
  const audioBtn = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');

  if (audioBtn) {
    // Start with audio active
    audioBtn.classList.add('active');
    if (audioIcon) audioIcon.textContent = '🔊';
    if (audioLabel) audioLabel.textContent = 'SOUND: ON';

    audioBtn.addEventListener('click', () => {
      const isUnmuted = sounds.toggleMute();
      if (isUnmuted) {
        audioBtn.classList.add('active');
        if (audioIcon) audioIcon.textContent = '🔊';
        if (audioLabel) audioLabel.textContent = 'SOUND: ON';
        sounds.playClick();
      } else {
        audioBtn.classList.remove('active');
        if (audioIcon) audioIcon.textContent = '🔇';
        if (audioLabel) audioLabel.textContent = 'SOUND: OFF';
      }
    });
  }

  // Attach hover sounds
  document.querySelectorAll('button, a, .eng-card, .f1-card, .product-card').forEach((el) => {
    el.addEventListener('mouseenter', () => sounds.playHover());
    el.addEventListener('click', () => sounds.playClick());
  });

  // Resume AudioContext immediately on first user interaction
  const resumeAudio = () => {
    sounds.init();
    ['click', 'scroll', 'wheel', 'pointerdown', 'keydown'].forEach(ev => {
      window.removeEventListener(ev, resumeAudio);
    });
  };
  ['click', 'scroll', 'wheel', 'pointerdown', 'keydown'].forEach(ev => {
    window.addEventListener(ev, resumeAudio, { once: true, passive: true });
  });
}

// ==========================================================================
// 5. SCROLL TIMELINE, PROPER SCROLL SOUND & 0-360° ORBIT
// ==========================================================================
function setupScrollTimeline(carScene) {
  const scrubberTrack = document.getElementById('scrubber-track');
  const scrubberFill = document.getElementById('scrubber-fill');
  const scrubberHandle = document.getElementById('scrubber-handle');
  const timelinePct = document.getElementById('timeline-pct');
  const stageName = document.getElementById('timeline-stage-name');
  const hudOrbitVal = document.getElementById('hud-orbit-val');

  const speedometerVal = document.getElementById('speedometer-val');
  const gearIndicator = document.getElementById('gear-indicator');
  const rpmBar = document.getElementById('rpm-bar');

  let lastScrollY = window.scrollY;
  let scrollTimeout = null;

  const STAGES = [
    { threshold: 0.18, name: 'STAGE 01 // 0° FRONT NOSE' },
    { threshold: 0.38, name: 'STAGE 02 // 72° STARBOARD PROFILE' },
    { threshold: 0.58, name: 'STAGE 03 // 144° REAR QUARTER' },
    { threshold: 0.78, name: 'STAGE 04 // 216° REAR DIFFUSER & DRS' },
    { threshold: 0.90, name: 'STAGE 05 // 288° PORT FLANK & HALO' },
    { threshold: 1.01, name: 'STAGE 06 // 360° PODIUM SHOWCASE' }
  ];

  // Wire real-time 360° Orbit Angle Callback to HUD with Anti-Overlap Telemetry
  if (carScene) {
    carScene.onOrbitUpdate = (deg, sector, zone, scalePct, overlapPct = 0) => {
      if (hudOrbitVal) {
        const overlapTag = overlapPct > 0 ? ` [${overlapPct}% OVL]` : ' [0% OVL // CLEAR]';
        const zoneTag = zone ? ` (${zone.toUpperCase()} ${scalePct}%${overlapTag})` : '';
        hudOrbitVal.textContent = `${String(deg).padStart(3, '0')}° // ${sector}${zoneTag}`;
      }
    };

    // Continuous Launch Control & Flame Spark Sound when parked atop footer
    carScene.onParkStatusChange = (isParked, parkIntensity) => {
      sounds.setLaunchLimiter(isParked, parkIntensity);
      const hudDrs = document.getElementById('hud-drs');
      const rpmCounter = document.getElementById('hud-rpm-counter');
      if (isParked) {
        if (hudDrs) hudDrs.textContent = 'LAUNCH CONTROL [ARMED]';
        if (rpmCounter) rpmCounter.textContent = '4,500 RPM [BURNOUT]';
      } else {
        if (hudDrs) hudDrs.textContent = 'ACTIVE [OPEN]';
        if (rpmCounter) rpmCounter.textContent = '2,200 RPM';
      }
    };
  }

  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

    const currentScrollY = window.scrollY;
    const delta = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    // 1. Move & orbit the 3D Formula 1 car continuously across 0-360 degrees
    if (carScene) {
      carScene.setScrollProgress(progress);
    }

    // 2. Play continuous dynamic F1 engine sound based on scroll delta
    sounds.onScroll(delta);

    // 3. Update Scrubber UI
    const pct = Math.round(progress * 100);
    if (scrubberFill) scrubberFill.style.width = `${pct}%`;
    if (scrubberHandle) scrubberHandle.style.left = `${pct}%`;
    if (timelinePct) timelinePct.textContent = `${pct}%`;

    // Stage name lookup
    const currentStage = STAGES.find((s) => progress <= s.threshold) || STAGES[STAGES.length - 1];
    if (stageName && currentStage) stageName.textContent = currentStage.name;

    // 4. Calculate realistic simulated speed
    const simulatedSpeed = Math.min(135, Math.round(delta * 2.5));
    if (speedometerVal) speedometerVal.textContent = simulatedSpeed;

    // Gear simulation
    let gear = 'N';
    if (simulatedSpeed > 105) gear = '6TH';
    else if (simulatedSpeed > 80) gear = '5TH';
    else if (simulatedSpeed > 55) gear = '4TH';
    else if (simulatedSpeed > 35) gear = '3RD';
    else if (simulatedSpeed > 15) gear = '2ND';
    else if (simulatedSpeed > 0) gear = '1ST';
    if (gearIndicator) gearIndicator.textContent = gear;

    // RPM Bar
    const rpmPercent = Math.min(100, Math.max(15, Math.round((simulatedSpeed / 135) * 100)));
    if (rpmBar) rpmBar.style.width = `${rpmPercent}%`;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (speedometerVal) speedometerVal.textContent = '0';
      if (gearIndicator) gearIndicator.textContent = 'N';
      if (rpmBar) rpmBar.style.width = '15%';
    }, 180);

    updateActiveNav();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Interactive scrubbing with smooth anime-style transition
  if (scrubberTrack) {
    scrubberTrack.addEventListener('click', (e) => {
      const rect = scrubberTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: ratio * maxScroll,
        behavior: 'smooth'
      });
      sounds.playSwoosh();
    });
  }
}

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 220;

  sections.forEach((sec) => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    const id = sec.getAttribute('id');
    if (scrollPos >= top && scrollPos < top + height) {
      document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-nav') === id);
      });
    }
  });
}

// ==========================================================================
// 6. HUD & TOOL CONTROLS & 3D CAMERA 360° ORBIT PRESETS
// ==========================================================================
function setupHudControls(carScene) {
  const triggerFlybyAction = () => {
    if (carScene) {
      carScene.triggerFlyby();
    }
    const hudRpm = document.getElementById('hud-rpm-counter');
    const speedometerVal = document.getElementById('speedometer-val');
    const gearIndicator = document.getElementById('gear-indicator');
    const rpmBar = document.getElementById('rpm-bar');

    sounds.revEngine((rpm) => {
      hudRpm.textContent = `${rpm.toLocaleString()} RPM`;
      const simulatedSpeed = Math.round((rpm / 15000) * 135);
      speedometerVal.textContent = simulatedSpeed;
      gearIndicator.textContent = rpm > 11000 ? '6TH' : rpm > 8000 ? '4TH' : '2ND';
      rpmBar.style.width = `${Math.min(100, Math.round((rpm / 15000) * 100))}%`;
    });
  };

  const btnFlyby = document.getElementById('btn-flyby');
  if (btnFlyby) btnFlyby.addEventListener('click', triggerFlybyAction);

  const heroRevBtn = document.getElementById('hero-rev-btn');
  if (heroRevBtn) heroRevBtn.addEventListener('click', triggerFlybyAction);

  // 360° Camera Preset Pills
  document.querySelectorAll('.camera-presets-bar .preset-pill[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.camera-presets-bar .preset-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');
      if (carScene) {
        carScene.setCameraPreset(preset);
      }
      sounds.playClick();
    });
  });

  // Auto-Orbit Toggle Button
  const autoOrbitBtn = document.getElementById('btn-auto-orbit');
  if (autoOrbitBtn) {
    autoOrbitBtn.addEventListener('click', () => {
      if (carScene) {
        const isAuto = carScene.toggleAutoOrbit();
        autoOrbitBtn.classList.toggle('active', isAuto);
        const textSpan = autoOrbitBtn.querySelector('.tool-text');
        if (textSpan) {
          textSpan.textContent = isAuto ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: OFF';
        }
        sounds.playClick();
      }
    });
  }

  // Reset Camera Button
  const resetCamBtn = document.getElementById('btn-reset-cam');
  if (resetCamBtn) {
    resetCamBtn.addEventListener('click', () => {
      if (carScene) {
        carScene.resetCamera();
        document.querySelectorAll('.camera-presets-bar .preset-pill').forEach((b) => b.classList.remove('active'));
        const firstPreset = document.querySelector('.camera-presets-bar .preset-pill[data-preset="drift"]');
        if (firstPreset) firstPreset.classList.add('active');
        if (autoOrbitBtn) {
          autoOrbitBtn.classList.remove('active');
          const textSpan = autoOrbitBtn.querySelector('.tool-text');
          if (textSpan) textSpan.textContent = 'AUTO-ORBIT: OFF';
        }
        sounds.playClick();
      }
    });
  }
}

// ==========================================================================
// 7. CONFIGURATOR STUDIO (CHAMPAGNE & BURGUNDY PALETTES)
// ==========================================================================
function setupConfigurator(carScene) {
  const liveryPills = document.querySelectorAll('#livery-pills .config-pill');

  liveryPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      liveryPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const livery = pill.getAttribute('data-livery');

      if (carScene) {
        carScene.setLivery(livery);
      }
      sounds.playSwoosh();
    });
  });

  const compoundPills = document.querySelectorAll('#compound-pills .config-pill');
  compoundPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      compoundPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const compound = pill.getAttribute('data-compound');
      if (carScene && compound) {
        carScene.setTireCompound(compound);
      }
      sounds.playClick();
    });
  });

  const underglowPills = document.querySelectorAll('#underglow-pills .config-pill');
  underglowPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      underglowPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const underglow = pill.getAttribute('data-underglow');
      if (carScene && carScene.chassisLight && underglow) {
        carScene.chassisLight.color.setHex(parseInt(underglow, 16));
      }
      sounds.playClick();
    });
  });

  document.getElementById('config-order-btn').addEventListener('click', () => {
    const activeLivery = document.querySelector('#livery-pills .config-pill.active').textContent.trim();
    const activeCompound = document.querySelector('#compound-pills .config-pill.active').textContent.trim();

    const customMachine = {
      id: `custom-f1-${Date.now()}`,
      title: `Bespoke Formula RC // ${activeLivery}`,
      price: 789,
      image: '/assets/f1-redbull-top.jpg',
      specs: `Custom Livery: ${activeLivery}, Compound: ${activeCompound}, Toray Carbon Tub, 6S High-Output Brushless`
    };

    addToCart(customMachine);
    openCartDrawer();
    sounds.playSwoosh();
  });

  document.getElementById('config-reset-btn').addEventListener('click', () => {
    liveryPills[0].click();
    compoundPills[0].click();
    underglowPills[0].click();
    if (carScene) {
      carScene.setLivery('redbull');
      carScene.setTireCompound('medium');
      if (carScene.chassisLight) carScene.chassisLight.color.setHex(0x800020);
    }
    sounds.playClick();
  });
}


// ==========================================================================
// 8. STORE & SHOPPING CART
// ==========================================================================
function setupStore() {
  const productsGrid = document.getElementById('products-grid');
  const filterBtns = document.querySelectorAll('.store-filter');

  function renderProducts(filter = 'all') {
    productsGrid.innerHTML = '';
    const filtered = filter === 'all' 
      ? STORE_PRODUCTS 
      : STORE_PRODUCTS.filter((p) => p.category === filter);

    filtered.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-thumb-wrap">
          <img src="${p.image}" alt="${p.title}" class="product-thumb-img" loading="lazy">
          <span class="prod-scale-tag">${p.scale}</span>
          <span class="prod-badge">${p.badge}</span>
        </div>
        <div class="product-card-body">
          <div class="prod-category">APEX COMPETITION WORKSHOP</div>
          <h3>${p.title}</h3>
          <p class="prod-specs-summary">${p.specs}</p>
          <div class="prod-foot">
            <span class="prod-price">$${p.price}</span>
            <button class="add-cart-btn" data-id="${p.id}">ADD TO CART</button>
          </div>
        </div>
      `;

      card.querySelector('.add-cart-btn').addEventListener('click', () => {
        addToCart(p);
      });

      productsGrid.appendChild(card);
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.getAttribute('data-filter'));
      sounds.playClick();
    });
  });

  renderProducts('all');

  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  cartToggleBtn.addEventListener('click', openCartDrawer);
  drawerCloseBtn.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);

  document.getElementById('drawer-checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your pit cart is empty. Add a competition machine first!');
      return;
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f15a24', '#e29d62', '#d84315', '#ffffff']
    });

    sounds.playSwoosh();
    alert('🎉 Order Confirmed! Your bespoke desert formula machine is now entering assembly.');
    cart = [];
    renderCart();
    closeCartDrawer();
  });
}

function addToCart(product) {
  cart.push(product);
  renderCart();
  sounds.playClick();

  confetti({
    particleCount: 45,
    spread: 55,
    origin: { x: 0.9, y: 0.1 },
    colors: ['#f15a24', '#e29d62', '#d84315']
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  sounds.playClick();
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const counter = document.getElementById('cart-counter');
  const drawerCount = document.getElementById('drawer-items-count');
  const subtotalVal = document.getElementById('drawer-subtotal-val');

  counter.textContent = cart.length;
  drawerCount.textContent = `(${cart.length} ITEMS)`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
        <span class="empty-icon">🏎️</span>
        <h4>YOUR PIT CART IS EMPTY</h4>
        <p>Explore our competition RC formula cars and 1:8 scale museum replicas.</p>
      </div>
    `;
    subtotalVal.textContent = '$0.00';
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, idx) => {
    subtotal += item.price;
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">$${item.price}.00</div>
        <button class="cart-item-remove" data-index="${idx}">REMOVE ITEM</button>
      </div>
    `;

    itemEl.querySelector('.cart-item-remove').addEventListener('click', () => {
      removeFromCart(idx);
    });

    container.appendChild(itemEl);
  });

  subtotalVal.textContent = `$${subtotal.toLocaleString()}.00`;
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-drawer-overlay').classList.add('open');
  sounds.playSwoosh();
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-drawer-overlay').classList.remove('open');
}

// ==========================================================================
// 9. EXPERIENCE CENTER BOOKING PASS MODAL
// ==========================================================================
function setupBookingModule() {
  const bookingForm = document.getElementById('track-booking-form');
  const modalBackdrop = document.getElementById('booking-modal-backdrop');
  const modalClose = document.getElementById('booking-modal-close');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = document.getElementById('book-date');
  if (dateInput) {
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const driver = document.getElementById('book-driver').value;
    const pkgSelect = document.getElementById('book-package');
    const pkgText = pkgSelect.options[pkgSelect.selectedIndex].text;
    const dateVal = document.getElementById('book-date').value;
    const slotSelect = document.getElementById('book-slot');
    const slotText = slotSelect.options[slotSelect.selectedIndex].text;

    document.getElementById('pass-driver-name').textContent = driver.toUpperCase();
    document.getElementById('pass-experience-title').textContent = pkgText.split(' - ')[0];
    document.getElementById('pass-date-val').textContent = dateVal;
    document.getElementById('pass-time-val').textContent = slotText.split(' (')[0];

    modalBackdrop.classList.add('open');
    sounds.playSwoosh();

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f15a24', '#e29d62', '#d84315']
    });
  });

  modalClose.addEventListener('click', () => {
    modalBackdrop.classList.remove('open');
  });

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove('open');
    }
  });

  document.getElementById('print-pass-btn').addEventListener('click', () => {
    alert('📲 Pass saved to your Digital Wallet! Present this QR code at the Pit Reception.');
    modalBackdrop.classList.remove('open');
  });
}

// ==========================================================================
// 10. BLUEPRINT INSPECTION MODALS & F1 VAULT
// ==========================================================================
function setupBlueprintModals(videoEngine) {
  const modalBackdrop = document.getElementById('blueprint-modal-backdrop');
  const modalClose = document.getElementById('blueprint-modal-close');
  const bpTitle = document.getElementById('bp-title');
  const bpImage = document.getElementById('bp-image');
  const bpInfo = document.getElementById('bp-info-text');

  const BLUEPRINT_DATA = {
    'inspect-rb': {
      title: 'RED BULL RACING RB19 // CHASSIS AERODYNAMICS',
      image: '/assets/f1-redbull-top.jpg',
      info: `
        <div class="bp-info-item">
          <h4>GROUND EFFECT TUNNELS</h4>
          <p>Underfloor 3D venturi tunnels create intense suction, minimizing reliance on high-angle upper wings and drastically reducing aerodynamic drag down the straights.</p>
        </div>
        <div class="bp-info-item">
          <h4>VORTEX SHEDDING FRONT ENDPLATES</h4>
          <p>Outwash curved endplates channel high-pressure turbulent tire wake outward, shielding the underfloor air intake from dirty air.</p>
        </div>
        <div class="bp-info-item">
          <h4>HONDA RBPT V6 TURBO HYBRID</h4>
          <p>1,020 HP with 50% thermal efficiency, regenerative MGU-K and MGU-H energy harvesting delivering instantaneous battery boost.</p>
        </div>
      `
    },
    'inspect-merc': {
      title: 'MERCEDES-AMG W12 // STEALTH SPEC BLUEPRINT',
      image: '/assets/f1-mercedes-side.jpg',
      info: `
        <div class="bp-info-item">
          <h4>AERODYNAMIC SIDE POD UNDERCUTS</h4>
          <p>Extreme tight packaging directing laminar airflow directly over the carbon diffuser strakes, generating maximum mid-corner stability.</p>
        </div>
        <div class="bp-info-item">
          <h4>SWEPT CARBON PUSHROD GEOMETRY</h4>
          <p>Aerodynamically profiled carbon suspension wishbones acting as secondary turning vanes for cooling ducts.</p>
        </div>
        <div class="bp-info-item">
          <h4>DRS HYDRAULIC ACTUATOR</h4>
          <p>Rear wing slot gap opens to 85mm under DRS activation, reducing drag by 22% for high-speed overtaking maneuvers.</p>
        </div>
      `
    },
    'inspect-stealth': {
      title: 'DARK SHADOW MONOCOQUE // 1:8 R&D PROTOTYPE',
      image: '/assets/f1-carbon-blueprint.jpg',
      info: `
        <div class="bp-info-item">
          <h4>TORAY T700 DRY CARBON MONOCOQUE</h4>
          <p>Autoclave pre-preg composite chassis plate with CNC chamfered edges, delivering unmatched torsional stiffness for sub-2.0s 0-100 launches.</p>
        </div>
        <div class="bp-info-item">
          <h4>100HZ REALTIME TELEMETRY SENSORS</h4>
          <p>Integrated infrared tire surface temperature sensors, 3-axis accelerometer, and wireless motor telemetry data logging.</p>
        </div>
      `
    }
  };

  document.querySelectorAll('[data-action^="inspect-"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const data = BLUEPRINT_DATA[action];
      if (data) {
        bpTitle.textContent = data.title;
        bpImage.src = data.image;
        bpInfo.innerHTML = data.info;
        modalBackdrop.classList.add('open');
        sounds.playSwoosh();
      }
    });
  });

  document.querySelectorAll('[data-action^="livery-"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      sounds.playSwoosh();
    });
  });

  modalClose.addEventListener('click', () => {
    modalBackdrop.classList.remove('open');
  });

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove('open');
    }
  });
}

// ==========================================================================
// 11. LEADERBOARD RENDERING
// ==========================================================================
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-body');
  if (!container) return;

  container.innerHTML = '';
  LEADERBOARD_DATA.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = `lb-row ${row.pos === '01' ? 'pos-1' : ''}`;
    rowEl.innerHTML = `
      <span class="pos-col">${row.pos}</span>
      <span class="pilot-col"><strong>${row.pilot}</strong></span>
      <span class="car-col">${row.car}</span>
      <span class="time-col">${row.time}</span>
      <span class="speed-col">${row.speed}</span>
      <span class="status-col"><span class="tag-par ${row.pos === '01' ? 'green' : ''}">${row.status}</span></span>
    `;
    container.appendChild(rowEl);
  });
}

// ==========================================================================
// 12. KEYBOARD SHORTCUTS
// ==========================================================================
function setupKeyboardShortcuts(carScene) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const btnFlyby = document.getElementById('btn-flyby');
      if (btnFlyby) btnFlyby.click();
    } else if (e.code === 'KeyO' && e.target.tagName !== 'INPUT') {
      const btnAuto = document.getElementById('btn-auto-orbit');
      if (btnAuto) btnAuto.click();
    } else if (e.code === 'KeyR' && e.target.tagName !== 'INPUT') {
      const btnReset = document.getElementById('btn-reset-cam');
      if (btnReset) btnReset.click();
    }
  });
}

// ==========================================================================
// 13. SECTION 02 ARCHITECTURE: HORIZONTAL TABS & SIDE-DOCKING TOGGLE
// ==========================================================================
function setupArchitectureSection(carScene) {
  const engSection = document.getElementById('engineering');
  const flipBtn = document.getElementById('arch-layout-flip-btn');
  const flipLabel = flipBtn ? flipBtn.querySelector('.flip-label') : null;
  const tabBtns = document.querySelectorAll('.arch-tab-btn');
  const engCards = document.querySelectorAll('.eng-card');
  const specsBox = document.querySelector('.specs-comparison-box');

  // 1. Flip alignment between Right (Car on Left) and Left (Car on Right)
  if (flipBtn && engSection) {
    flipBtn.addEventListener('click', () => {
      const isCurrentlyDockedLeft = engSection.classList.toggle('dock-left');
      if (flipLabel) {
        flipLabel.textContent = isCurrentlyDockedLeft ? 'CAR ON RIGHT' : 'CAR ON LEFT';
      }
      sounds.playClick();
    });
  }

  // 2. Horizontal Subsystem Tabs
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedTab = btn.getAttribute('data-tab');
      const targetCamera = btn.getAttribute('data-camera');

      // Filter cards
      engCards.forEach((card) => {
        const cardSystem = card.getAttribute('data-system');
        if (selectedTab === 'all' || selectedTab === cardSystem) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });

      // Filter specs table
      if (specsBox) {
        if (selectedTab === 'all' || selectedTab === 'specs') {
          specsBox.style.display = 'block';
        } else {
          specsBox.style.display = 'none';
        }
      }

      // Smoothly orbit 3D car to target subsystem camera angle
      if (carScene && targetCamera) {
        carScene.setCameraPreset(targetCamera);
      }

      sounds.playClick();
    });
  });

  // 3. Clicking any individual engineering card also focuses the camera on that zone
  engCards.forEach((card) => {
    card.addEventListener('click', () => {
      const cameraPreset = card.getAttribute('data-camera');
      if (carScene && cameraPreset) {
        carScene.setCameraPreset(cameraPreset);
      }
    });
  });
}
