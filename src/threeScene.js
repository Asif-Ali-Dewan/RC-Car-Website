import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Creates a soft, circular radial-gradient glow particle texture.
 * Used for subtle luxury champagne dust motes.
 */
function createParticleTexture(colorInner = 'rgba(243, 230, 213, 0.8)', colorOuter = 'rgba(128, 0, 32, 0)') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(0.4, 'rgba(243, 230, 213, 0.3)');
  grad.addColorStop(1.0, colorOuter);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class Car3DScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.carRoot = null;
    this.f1Car = null;
    this.carMeshes = [];
    this.bodyMaterials = [];

    // Continuous 0-360° Orbit Parameters
    this.orbitRadius = 6.8;
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.manualAngleOffset = 0;
    this.idleTurntableAngle = 0;
    this.autoOrbitEnabled = false; // Pure tactile scroll-driven 0-360° orbit by default!
    this.orbitScrollMultiplier = Math.PI * 2 * 2.2; // Smooth, cinematic 360° rotation pace across scroll
    this.isDragging = false;
    this.isTopView = false;
    this.prevMouse = { x: 0, y: 0 };
    this.mouseParallax = { x: 0, y: 0 };
    this.targetMouseParallax = { x: 0, y: 0 };

    // Autonomous White Space Docking & Dynamic Anti-Overlap Scaling
    this.baseScale = 0.096;
    this.currentScale = 0.096;
    this.targetScale = 0.096;
    this.currentWhitespaceZone = 'right';
    this.availableWhitespaceWidth = (typeof window !== 'undefined') ? window.innerWidth * 0.5 : 800;
    this.currentScreenX = (typeof window !== 'undefined') ? window.innerWidth * 0.72 : 960;
    this.targetScreenX = (typeof window !== 'undefined') ? window.innerWidth * 0.72 : 960;
    this.currentOverlapPct = 0;

    // Dynamic Waypoint-based Car Position & Rotation
    this.currentCarPos = new THREE.Vector3(0, 0.08, -0.2);
    this.targetCarPos = new THREE.Vector3(0, 0.08, -0.2);
    this.currentCarRot = new THREE.Vector3(0, 0, 0);
    this.targetCarRot = new THREE.Vector3(0, 0, 0);

    // Camera smoothing
    this.currentCamPos = new THREE.Vector3(0, 1.8, 6.8);
    this.targetCamPos = new THREE.Vector3(0, 1.8, 6.8);
    this.currentLookAt = new THREE.Vector3(0, 0.35, -0.2);
    this.targetLookAt = new THREE.Vector3(0, 0.35, -0.2);

    // Micro-Particles / Subtle Champagne Dust Motes
    this.embers = null;
    this.emberVelocities = null;

    // Footer Staging, Parking & Continuous Sparks/Flames
    this.isParked = false;
    this.parkRatio = 0;
    this.onParkStatusChange = null;
    this.sparks = null;
    this.sparkData = null;
    this.rearFlameLight = null;

    // HUD Callback
    this.onOrbitUpdate = null;
    this.currentSectorName = 'FRONT 3/4 NOSE';
    this.currentLivery = 'redbull';

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera Setup (Perspective with Dynamic View Offset for Off-Center Whitespace Docking)
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 150);
    this.camera.position.set(0, 1.8, 6.8);
    this.camera.lookAt(0, 0.35, -0.2);
    this.camera.setViewOffset(width, height, (width * 0.5) - this.currentScreenX, 0, width, height);

    // 3. Renderer Setup (Pure Alpha Transparent WebGL over #F3E6D5 Background)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Luxury Studio Lighting: Primary #F3E6D5 (Champagne) & Secondary #800020 (Burgundy)
    this.setupLighting();

    // 5. Contact Shadow Floor (Casts soft shadow directly on the #F3E6D5 page background)
    this.buildShadowFloor();

    // 6. Subtle Floating Ambient Champagne Dust Motes
    this.buildLivelyEmbers();

    // 7. High-Energy Launch Sparks & Rear Flame Jet Emitter
    this.buildLaunchSparks();

    // 8. Load Genuine 2022 Formula 1 High-Poly Model
    this.loadF1CarModel();

    // 9. Interactive Drag & Mouse Parallax
    this.setupInteractivity();

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // 1. Ambient Fill Light (Soft Champagne Tint)
    const ambient = new THREE.AmbientLight(0xF3E6D5, 1.7);
    this.scene.add(ambient);

    // 2. Key Sun Directional Light (Warm Champagne Radiance)
    const keySun = new THREE.DirectionalLight(0xfff8ee, 3.2);
    keySun.position.set(8, 12, 6);
    keySun.castShadow = true;
    keySun.shadow.mapSize.width = 2048;
    keySun.shadow.mapSize.height = 2048;
    keySun.shadow.camera.near = 0.5;
    keySun.shadow.camera.far = 40;
    keySun.shadow.camera.left = -7;
    keySun.shadow.camera.right = 7;
    keySun.shadow.camera.top = 7;
    keySun.shadow.camera.bottom = -7;
    keySun.shadow.bias = -0.0003;
    keySun.shadow.radius = 2.0;
    this.scene.add(keySun);

    // 3. Secondary Rim Light (Deep Luxury Burgundy #800020)
    const burgundyRim = new THREE.DirectionalLight(0x800020, 3.6);
    burgundyRim.position.set(-8, 6, -7);
    this.scene.add(burgundyRim);

    // 4. Secondary Side Accent (Wine Red #9b111e)
    const sideAccent = new THREE.DirectionalLight(0x9b111e, 2.0);
    sideAccent.position.set(-5, 3, 6);
    this.scene.add(sideAccent);

    // 5. Ground Upward Bounce (Champagne Cream #F3E6D5)
    const bounceLight = new THREE.DirectionalLight(0xF3E6D5, 1.4);
    bounceLight.position.set(0, -4, 0);
    this.scene.add(bounceLight);

    // 6. Glowing Under-Chassis Accent Light (#800020 Burgundy)
    this.chassisLight = new THREE.PointLight(0x800020, 2.8, 8, 2);
    this.chassisLight.position.set(0, 0.12, 0);
    this.scene.add(this.chassisLight);
  }

  buildShadowFloor() {
    // Subtle shadow catcher plane
    const shadowGeo = new THREE.PlaneGeometry(80, 80);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.22
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    shadowMesh.receiveShadow = true;
    this.scene.add(shadowMesh);
  }

  buildLivelyEmbers() {
    // 80 gentle micro-dust particles floating in the champagne atmosphere
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 4.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;

      vels[i * 3] = (Math.random() - 0.5) * 0.008;
      vels[i * 3 + 1] = 0.003 + Math.random() * 0.008;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.emberVelocities = vels;

    const emberMat = new THREE.PointsMaterial({
      map: createParticleTexture('rgba(128, 0, 32, 0.35)', 'rgba(243, 230, 213, 0)'),
      size: 0.22,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.embers = new THREE.Points(geo, emberMat);
    this.scene.add(this.embers);
  }

  buildLaunchSparks() {
    // 160 Incandescent Launch Sparks & Flames emitting from rear wheels & exhaust
    const count = 160;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const lives = new Float32Array(count);
    const maxLives = new Float32Array(count);

    // Initialize all dormant/off-screen
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -100;
      pos[i * 3 + 2] = 0;

      vels[i * 3] = 0;
      vels[i * 3 + 1] = 0;
      vels[i * 3 + 2] = 0;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.45;
      colors[i * 3 + 2] = 0.05;

      lives[i] = 1.0;
      maxLives[i] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom incandescent racing spark texture (hot white core, electric orange corona, crimson halo)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.22, '#ffe875');
    grad.addColorStop(0.52, '#ff5000');
    grad.addColorStop(0.82, '#800020');
    grad.addColorStop(1, 'rgba(128, 0, 32, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sparkTex = new THREE.CanvasTexture(canvas);

    const sparkMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 0.38,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparks = new THREE.Points(geo, sparkMat);
    this.scene.add(this.sparks);

    this.sparkData = {
      vels,
      colors,
      lives,
      maxLives,
      nextIdx: 0,
      count
    };

    // Dynamic flickering flame illumination under the rear wheels & diffuser
    this.rearFlameLight = new THREE.PointLight(0xff3700, 0, 7.5, 1.8);
    this.rearFlameLight.position.set(1.5, 0.25, 0);
    this.scene.add(this.rearFlameLight);
  }

  emitLaunchSparks(delta, intensity) {
    if (!this.sparks || !this.sparkData) return;
    const d = this.sparkData;
    const pos = this.sparks.geometry.attributes.position.array;
    const col = this.sparks.geometry.attributes.color.array;

    // 1. Continuous Spark Generation: Rate proportional to parking launch intensity
    const spawnCount = Math.floor(intensity * 10);
    for (let s = 0; s < spawnCount; s++) {
      const idx = d.nextIdx;
      d.nextIdx = (d.nextIdx + 1) % d.count;

      // When car is parked left-faced (Y rot = -90°), rear wheels are at +X:
      // Emitter 0 = Port Rear Wheel, Emitter 1 = Starboard Rear Wheel, Emitter 2 = Exhaust Diffuser
      const emitterType = Math.floor(Math.random() * 3);
      let spawnX = 1.35 + Math.random() * 0.35;
      let spawnY = 0.08 + Math.random() * 0.12;
      let spawnZ = 0;

      const carZ = this.currentCarPos ? this.currentCarPos.z : 0;
      if (emitterType === 0) {
        spawnZ = carZ - 0.78 + (Math.random() - 0.5) * 0.16; // Left rear wheel contact
      } else if (emitterType === 1) {
        spawnZ = carZ + 0.78 + (Math.random() - 0.5) * 0.16; // Right rear wheel contact
      } else {
        spawnX = 1.72 + Math.random() * 0.18; // Twin exhaust blowers
        spawnY = 0.28 + Math.random() * 0.14;
        spawnZ = carZ + (Math.random() - 0.5) * 0.22;
      }

      pos[idx * 3] = spawnX;
      pos[idx * 3 + 1] = spawnY;
      pos[idx * 3 + 2] = spawnZ;

      // Dynamic Launch Velocity: Shoots backwards towards +X with high energy
      const speed = 4.8 + Math.random() * 6.5;
      d.vels[idx * 3] = speed; // Backwards along +X
      d.vels[idx * 3 + 1] = 0.8 + Math.random() * 2.4; // Upward spark launch
      d.vels[idx * 3 + 2] = (Math.random() - 0.5) * 2.2; // Lateral spray

      // Incandescent temperature gradient
      const temp = Math.random();
      if (temp > 0.6) {
        col[idx * 3] = 1.0; col[idx * 3 + 1] = 0.94; col[idx * 3 + 2] = 0.65; // Hot incandescent white/yellow
      } else if (temp > 0.25) {
        col[idx * 3] = 1.0; col[idx * 3 + 1] = 0.42; col[idx * 3 + 2] = 0.05; // Fiery racing orange
      } else {
        col[idx * 3] = 0.95; col[idx * 3 + 1] = 0.06; col[idx * 3 + 2] = 0.18; // Crimson/burgundy exhaust flame
      }

      d.lives[idx] = 0;
      d.maxLives[idx] = 0.26 + Math.random() * 0.38; // Snappy spark lifespan
    }

    // 2. Physics & Particle Life Decay
    for (let i = 0; i < d.count; i++) {
      if (d.lives[i] < d.maxLives[i]) {
        d.lives[i] += delta;

        pos[i * 3] += d.vels[i * 3] * delta;
        pos[i * 3 + 1] += d.vels[i * 3 + 1] * delta;
        pos[i * 3 + 2] += d.vels[i * 3 + 2] * delta;

        // Gravity & air drag
        d.vels[i * 3 + 1] -= 7.8 * delta;
        d.vels[i * 3] *= 0.93;

        // Ground floor bounce
        if (pos[i * 3 + 1] < 0.02) {
          pos[i * 3 + 1] = 0.02;
          d.vels[i * 3 + 1] = -d.vels[i * 3 + 1] * 0.42;
        }

        // Color cooling
        col[i * 3 + 1] = Math.max(0, col[i * 3 + 1] - delta * 1.6);
        col[i * 3 + 2] = Math.max(0, col[i * 3 + 2] - delta * 2.2);

        if (d.lives[i] >= d.maxLives[i]) {
          pos[i * 3 + 1] = -100; // Recycle off-screen
        }
      }
    }

    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.geometry.attributes.color.needsUpdate = true;

    // 3. Flickering Rear Flame Glow Light
    if (this.rearFlameLight) {
      const flicker = (Math.random() - 0.5) * 1.2;
      this.rearFlameLight.intensity = Math.max(0, (4.2 + flicker) * intensity);
      this.rearFlameLight.position.set(1.5, 0.25, this.currentCarPos ? this.currentCarPos.z : 0);
    }
  }

  loadF1CarModel() {
    this.carRoot = new THREE.Group();
    this.scene.add(this.carRoot);

    const loader = new GLTFLoader();

    loader.load(
      '/assets/f1_c42.glb',
      (gltf) => {
        const model = gltf.scene;

        // Scale to realistic Formula 1 scale (~4.45m length)
        const scaleFactor = this.currentScale || this.baseScale;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center model and orient front towards +Z
        model.rotation.y = Math.PI;
        model.position.set(0, 0, 0);

        this.carMeshes = [];
        this.bodyMaterials = [];

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            this.carMeshes.push(child);

            if (child.material) {
              const mat = child.material;
              mat.roughness = Math.min(0.65, Math.max(0.18, mat.roughness || 0.32));
              mat.metalness = Math.min(0.88, Math.max(0.2, mat.metalness || 0.55));
              mat.envMapIntensity = 1.4;
              mat.needsUpdate = true;
              this.bodyMaterials.push(mat);
            }
          }
        });

        this.f1Car = model;
        this.carRoot.add(this.f1Car);
        this.isLoaded = true;

        this.setLivery(this.currentLivery);

        console.log('🏎️ 3D Formula 1 Showcase Machine Loaded with Autonomous White Space Finding & Dynamic Scaling!');
      },
      undefined,
      (err) => {
        console.warn('F1 GLTF Load Error:', err);
      }
    );
  }

  // Drive 0-360° camera orbit as user scrolls through the page
  setScrollProgress(progress) {
    this.targetScrollProgress = Math.max(0, Math.min(1, progress));
    this.isScrolling = true;
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 320);
  }

  /**
   * Autonomous White Space Detection & Anti-Overlap Scaling System:
   * Real-time DOM viewport scanning to locate the maximum unoccluded white space.
   * - If white space is available: GUARANTEES 0% overlap (car is 100% in white space with safe padding).
   * - If white space is limited (<420px / mobile / wide cards): Scales down and limits overlap to strictly 20-30%.
   */
  detectOptimalWhitespace(orbitAngle = 0) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        targetScreenX: 960,
        targetScale: this.baseScale,
        availableWidth: 800,
        zone: 'right',
        overlapPercent: 0
      };
    }

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // 1. Content cards to detect in the viewport reading zone (18% to 82% viewport height)
    const cards = document.querySelectorAll(
      '.section-inner, .hero-inner, .eng-card, .f1-card, .booking-module, .circuit-interactive-container, .product-card, .leaderboard-table-card'
    );

    let minLeft = winW;
    let maxRight = 0;
    let cardCountInView = 0;

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (rect.bottom > winH * 0.18 && rect.top < winH * 0.82 && rect.width > 80) {
        cardCountInView++;
        if (rect.left < minLeft) minLeft = Math.max(0, rect.left);
        if (rect.right > maxRight) maxRight = Math.min(winW, rect.right);
      }
    }

    // 2. Physical 3D projection & car width calculation
    // Camera setup: FOV = 40 deg, distance = 6.8 units
    const halfFovRad = (this.camera ? this.camera.fov : 40) * Math.PI / 360;
    const visibleWorldHeight = 2 * Math.tan(halfFovRad) * this.orbitRadius;
    const pxPerUnit = winH / visibleWorldHeight;

    // Car bounding dimensions at baseScale (0.096):
    // Length ~ 4.45m, Width ~ 1.95m
    const baseLength = 4.45;
    const baseWidth = 1.95;
    // Projected 3D horizontal span in world units at current orbit angle
    const cosA = Math.abs(Math.cos(orbitAngle));
    const sinA = Math.abs(Math.sin(orbitAngle));
    const span3D = Math.max(baseWidth, Math.min(baseLength, cosA * baseWidth + sinA * baseLength));
    const baseCarWidthPx = span3D * pxPerUnit;

    let targetScreenX = winW * 0.72;
    let scaleMultiplier = 0.95;
    let availableWidth = winW * 0.5;
    let whitespaceZone = 'right';
    let overlapPercent = 0;

    if (cardCountInView > 0) {
      const leftSpace = minLeft; // Open pixels on left
      const rightSpace = winW - maxRight; // Open pixels on right

      // Determine which side has the greatest open whitespace
      if (rightSpace >= leftSpace && rightSpace >= 400) {
        // --- ABUNDANT WHITE SPACE ON RIGHT (Hero, Experience, or flipped dock) ---
        // STRICT 0% OVERLAP: Car is placed 100% inside white space with safe margins
        whitespaceZone = 'right';
        availableWidth = rightSpace;

        // Dynamic whitespace-based scaling: 700px represents 100% (1.0) scale
        scaleMultiplier = Math.max(0.68, Math.min(1.15, availableWidth / 700));
        const carHalfWidthPx = 175 * scaleMultiplier;

        // Center car cleanly inside open right whitespace with safety buffer
        const safeMinX = maxRight + 45 + carHalfWidthPx;
        const safeMaxX = winW - 35 - carHalfWidthPx;

        if (safeMaxX >= safeMinX) {
          targetScreenX = Math.max(safeMinX, Math.min(safeMaxX, maxRight + (availableWidth * 0.5)));
        } else {
          targetScreenX = Math.min(safeMaxX, maxRight + (availableWidth * 0.5));
        }
        overlapPercent = 0;

      } else if (leftSpace > rightSpace && leftSpace >= 400) {
        // --- ABUNDANT WHITE SPACE ON LEFT (Architecture, Anime Lab, Heritage Vault) ---
        // STRICT 0% OVERLAP: Car is placed 100% inside left white space
        whitespaceZone = 'left';
        availableWidth = leftSpace;

        // Dynamic whitespace-based scaling: 700px represents 1.0 scale
        scaleMultiplier = Math.max(0.68, Math.min(1.15, availableWidth / 700));
        const carHalfWidthPx = 175 * scaleMultiplier;

        // Center car cleanly inside open left whitespace with safety buffer
        const safeMinX = 35 + carHalfWidthPx;
        const safeMaxX = minLeft - 45 - carHalfWidthPx;

        if (safeMaxX >= safeMinX) {
          targetScreenX = Math.min(safeMaxX, Math.max(safeMinX, availableWidth * 0.5));
        } else {
          targetScreenX = Math.max(safeMinX, availableWidth * 0.5);
        }
        overlapPercent = 0;

      } else {
        // --- LIMITED WHITE SPACE (< 400px, mobile or wide multi-column layout) ---
        // Per user specification: limit overlap strictly to 20-24%
        scaleMultiplier = 0.68; // Sleek compact scale
        const actualCarWidthPx = 360 * scaleMultiplier;
        const carHalfWidthPx = actualCarWidthPx * 0.5;
        const allowedOverlapPx = actualCarWidthPx * 0.24; // Strictly 24% overlap
        overlapPercent = 24;

        if (rightSpace >= leftSpace) {
          whitespaceZone = 'right-constrained';
          availableWidth = rightSpace;
          const leftEdge = maxRight - allowedOverlapPx;
          targetScreenX = Math.min(winW - carHalfWidthPx - 20, leftEdge + carHalfWidthPx);
        } else if (leftSpace > 200) {
          whitespaceZone = 'left-constrained';
          availableWidth = leftSpace;
          // Car right edge allowed to overlap into card by at most 24%
          const rightEdge = minLeft + allowedOverlapPx;
          targetScreenX = Math.max(carHalfWidthPx + 20, rightEdge - carHalfWidthPx);
        } else {
          // Center glide mode for full width cards
          whitespaceZone = 'center-glide';
          availableWidth = winW * 0.5;
          targetScreenX = winW * 0.5;
        }
      }
    } else {
      // No cards in view: Center showcase
      whitespaceZone = 'center';
      targetScreenX = winW * 0.5;
      availableWidth = winW;
      scaleMultiplier = 1.0;
      overlapPercent = 0;
    }

    const targetScale = this.baseScale * scaleMultiplier;

    return {
      targetScreenX: targetScreenX,
      targetScale: targetScale,
      availableWidth: availableWidth,
      zone: whitespaceZone,
      overlapPercent: overlapPercent,
      scaleMultiplier: scaleMultiplier
    };
  }

  /**
   * Cinematic Trajectory System:
   * Maps scrollProgress (0 to 1) to smooth 3D depth, rotation, and camera parameters.
   */
  getCinematicWaypoint(progress) {
    const waypoints = [
      // 0.00: Hero (Right side, low dynamic angle)
      { p: 0.00, posZ: -0.2, rot: [0.00, 0.00,  0.00], camH: 1.6 },
      // 0.18: Transition
      { p: 0.18, posZ:  0.5, rot: [0.04, 0.00, -0.05], camH: 1.8 },
      // 0.38: Engineering
      { p: 0.38, posZ:  0.3, rot: [0.02, 0.00,  0.05], camH: 1.5 },
      // 0.58: Experience Center
      { p: 0.58, posZ:  0.7, rot: [0.06, 0.00, -0.05], camH: 1.9 },
      // 0.78: Vault Museum
      { p: 0.78, posZ:  0.2, rot: [0.02, 0.00,  0.04], camH: 1.7 },
      // 1.00: Configurator & Store
      { p: 1.00, posZ:  0.0, rot: [0.00, 0.00,  0.00], camH: 1.6 }
    ];

    const clampedP = Math.max(0, Math.min(1, progress));
    let i = 0;
    while (i < waypoints.length - 1 && waypoints[i + 1].p < clampedP) {
      i++;
    }
    const w1 = waypoints[i];
    const w2 = waypoints[Math.min(waypoints.length - 1, i + 1)];
    const range = w2.p - w1.p;
    const t = range > 0 ? (clampedP - w1.p) / range : 0;
    
    // Smooth cubic ease-in-out curve
    const easeT = t * t * (3 - 2 * t);

    const posZ = w1.posZ + (w2.posZ - w1.posZ) * easeT;
    const rotX = w1.rot[0] + (w2.rot[0] - w1.rot[0]) * easeT;
    const rotY = w1.rot[1] + (w2.rot[1] - w1.rot[1]) * easeT;
    const rotZ = w1.rot[2] + (w2.rot[2] - w1.rot[2]) * easeT;
    const camH = w1.camH + (w2.camH - w1.camH) * easeT;

    return {
      position: new THREE.Vector3(0, 0, posZ),
      rotation: new THREE.Vector3(rotX, rotY, rotZ),
      camHeight: camH
    };
  }

  // Interactive Drag & Parallax
  setupInteractivity() {
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Mouse movement adds subtle lively parallax to the car & camera
    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetMouseParallax.x = normX * 0.4;
      this.targetMouseParallax.y = normY * 0.3;

      if (this.isDragging) {
        const dx = e.clientX - this.prevMouse.x;
        this.prevMouse = { x: e.clientX, y: e.clientY };

        // Manual orbit offset in radians
        this.manualAngleOffset -= dx * 0.009;
        this.autoOrbitEnabled = false; // Pause auto-orbit while user manually drags
      }
    });

    window.addEventListener('mousedown', (e) => {
      // Don't hijack clicks on buttons, inputs, links, or interactive pills
      if (e.target.closest('button, a, input, select, textarea, .nav-link, .hud-btn, .preset-pill, .tool-btn, .primary-btn, .secondary-btn, .color-swatch, .mode-btn')) {
        return;
      }
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for mobile / tablets
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !e.target.closest('button, a, input, select, textarea')) {
        this.isDragging = true;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.prevMouse.x;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.manualAngleOffset -= dx * 0.009;
        this.autoOrbitEnabled = false;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  // Camera Presets (Fixed 360° Angles)
  setCameraPreset(preset) {
    this.autoOrbitEnabled = false;
    this.idleTurntableAngle = 0;
    this.isTopView = (preset === 'top');

    switch (preset) {
      case 'drift':
        // 0° - Dynamic Front 3/4 Nose
        this.manualAngleOffset = -this.scrollProgress * this.orbitScrollMultiplier;
        break;
      case 'side':
        // 90° - Starboard Side Profile
        this.manualAngleOffset = Math.PI * 0.5 - this.scrollProgress * this.orbitScrollMultiplier;
        break;
      case 'rear':
        // 180° - Direct Rear Diffuser & DRS
        this.manualAngleOffset = Math.PI - this.scrollProgress * this.orbitScrollMultiplier;
        break;
      case 'cockpit':
        // 270° - Port Flank & Titanium Halo
        this.manualAngleOffset = Math.PI * 1.5 - this.scrollProgress * this.orbitScrollMultiplier;
        break;
      case 'top':
        // High Angle Ground-Effect Downforce View
        this.manualAngleOffset = Math.PI * 0.25 - this.scrollProgress * this.orbitScrollMultiplier;
        break;
    }
  }

  toggleAutoOrbit() {
    this.autoOrbitEnabled = !this.autoOrbitEnabled;
    return this.autoOrbitEnabled;
  }

  resetCamera() {
    this.manualAngleOffset = 0;
    this.idleTurntableAngle = 0;
    this.autoOrbitEnabled = false;
  }

  triggerFlyby() {
    const startOffset = this.manualAngleOffset;
    const targetOffset = startOffset + Math.PI * 2;
    const startTime = performance.now();
    const duration = 2200; // 2.2s cinematic sweep

    const animateFlyby = (currentTime) => {
      const elapsed = currentTime - startTime;
      const p = Math.min(1, elapsed / duration);
      // Smooth cubic easeInOut
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      this.manualAngleOffset = startOffset + (targetOffset - startOffset) * ease;
      if (p < 1) {
        requestAnimationFrame(animateFlyby);
      }
    };
    requestAnimationFrame(animateFlyby);
  }

  setLivery(liveryKey) {
    this.currentLivery = liveryKey;
    if (!this.bodyMaterials || this.bodyMaterials.length === 0) return;

    let tintColor = 0xF3E6D5;
    let underglowColor = 0x800020;

    switch (liveryKey) {
      case 'redbull':
      case 'desert':
        tintColor = 0xF3E6D5;
        underglowColor = 0x800020;
        break;
      case 'mercedes':
        tintColor = 0x800020;
        underglowColor = 0x5e0017;
        break;
      case 'cyberpunk':
        tintColor = 0x5e0017;
        underglowColor = 0x800020;
        break;
      case 'ferrari':
        tintColor = 0x800020;
        underglowColor = 0x5e0017;
        break;
      case 'gulf':
        tintColor = 0xF3E6D5;
        underglowColor = 0x800020;
        break;
    }

    this.bodyMaterials.forEach((mat) => {
      mat.color.setHex(tintColor);
      mat.needsUpdate = true;
    });

    if (this.chassisLight) {
      this.chassisLight.color.setHex(underglowColor);
    }
  }

  setTireCompound(compoundKey) {
    let tireGlow = 0x800020;
    switch (compoundKey) {
      case 'soft':
        tireGlow = 0x800020;
        break;
      case 'medium':
        tireGlow = 0xb8860b;
        break;
      case 'hard':
        tireGlow = 0xF3E6D5;
        break;
      case 'wet':
        tireGlow = 0x4682b4;
        break;
    }
    if (this.chassisLight) {
      this.chassisLight.color.setHex(tireGlow);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Lively Mouse Parallax Smoothing
    this.mouseParallax.x += (this.targetMouseParallax.x - this.mouseParallax.x) * 0.06;
    this.mouseParallax.y += (this.targetMouseParallax.y - this.mouseParallax.y) * 0.06;

    // 2. Direct Window Scroll Progress Sample & Smooth Interpolation
    const winScrollY = (typeof window !== 'undefined') ? (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0) : 0;
    const maxDocScroll = (typeof document !== 'undefined') ? Math.max(1, document.documentElement.scrollHeight - window.innerHeight) : 1;
    const measuredScrollProgress = Math.max(0, Math.min(1, winScrollY / maxDocScroll));

    // Keep targetScrollProgress in sync with measured real-world scroll
    this.targetScrollProgress = measuredScrollProgress;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.16;

    // Detect active scrolling from scroll motion
    const scrollDelta = Math.abs(this.targetScrollProgress - this.scrollProgress);
    if (scrollDelta > 0.0005) {
      this.isScrolling = true;
    } else {
      this.isScrolling = false;
    }

    // 3. Auto-Orbit Turntable Glide (Only when enabled and user is completely idle)
    if (this.autoOrbitEnabled && !this.isDragging && !this.isScrolling) {
      this.idleTurntableAngle += delta * 0.22;
    } else if (this.isScrolling) {
      // While user is scrolling, smoothly damp out idle & manual offsets so scroll rotation is 100% pure & reversible
      this.idleTurntableAngle += (0 - this.idleTurntableAngle) * 0.14;
      this.manualAngleOffset += (0 - this.manualAngleOffset) * 0.14;
    }

    // 4. Compute Continuous 0-360° Orbit Angle:
    // DIRECT SCROLL BINDING:
    // - Scroll DOWN: Increases angle from 0° through 360°
    // - Scroll UP: Decreases angle, REVERSING rotation back to 0°!
    const scrollAngle = this.scrollProgress * this.orbitScrollMultiplier;
    const driveYaw = scrollAngle + this.manualAngleOffset + this.idleTurntableAngle + 0.35;

    // 5. Detect if parking stage / footer is approaching / in viewport for staging & parking
    const parkingStageEl = document.querySelector('.parking-staging-section');
    const footerEl = document.querySelector('.apex-footer');
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let targetParkRatio = 0;
    let footerTop = winH;

    if (parkingStageEl) {
      const stageRect = parkingStageEl.getBoundingClientRect();
      if (stageRect.top <= winH * 0.85) {
        targetParkRatio = Math.max(0, Math.min(1, (winH * 0.85 - stageRect.top) / (winH * 0.45)));
      }
    } else if (footerEl) {
      const footerRect = footerEl.getBoundingClientRect();
      footerTop = footerRect.top;
      const parkTrigger = winH * 0.75;
      if (footerRect.top <= parkTrigger) {
        targetParkRatio = Math.max(0, Math.min(1, (parkTrigger - footerRect.top) / (parkTrigger * 0.5)));
      }
    }
    if (this.scrollProgress >= 0.89) {
      targetParkRatio = Math.max(targetParkRatio, (this.scrollProgress - 0.89) / 0.11);
    }

    this.parkRatio += (targetParkRatio - this.parkRatio) * 0.16;
    const wasParked = this.isParked;
    this.isParked = this.parkRatio >= 0.45;

    if (this.onParkStatusChange && (wasParked !== this.isParked || this.isParked)) {
      this.onParkStatusChange(this.isParked, this.parkRatio);
    }

    // 6. At the end, park on the footer facing left (+Math.PI * 0.5 in this coordinate space):
    // Smoothly ease into the nearest left-facing orientation without extra spins
    const desiredParkYaw = Math.PI * 0.5;
    const nearestParkYaw = Math.round((driveYaw - desiredParkYaw) / (Math.PI * 2)) * (Math.PI * 2) + desiredParkYaw;
    const finalYaw = THREE.MathUtils.lerp(driveYaw, nearestParkYaw, this.parkRatio);

    // Normalized Degree for HUD (0° to 359°)
    let normalizedDeg = Math.round(
      ((((finalYaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180) / Math.PI
    );
    if (normalizedDeg === 360) normalizedDeg = 0;

    // Compute Sector Name for HUD
    let sectorName = 'FRONT 3/4 NOSE';
    if (this.isParked) {
      sectorName = 'PIT APRON // PARKED [LEFT FACED]';
    } else if (normalizedDeg >= 45 && normalizedDeg < 135) {
      sectorName = 'STARBOARD PROFILE';
    } else if (normalizedDeg >= 135 && normalizedDeg < 225) {
      sectorName = 'AERO DIFFUSER & DRS';
    } else if (normalizedDeg >= 225 && normalizedDeg < 315) {
      sectorName = 'PORT FLANK & HALO';
    } else {
      sectorName = 'FRONT 3/4 NOSE';
    }

    // 7. Autonomous White Space Detection & Dynamic Anti-Overlap Scaling
    const whitespace = this.detectOptimalWhitespace(finalYaw);
    this.currentWhitespaceZone = whitespace.zone;
    this.availableWhitespaceWidth = whitespace.availableWidth;
    this.currentOverlapPct = whitespace.overlapPercent;

    const waypoint = this.getCinematicWaypoint(this.scrollProgress);

    if (this.onOrbitUpdate) {
      const scalePercent = Math.round((this.currentScale / this.baseScale) * 100);
      const displayZone = this.isParked ? 'PIT-APRON [PARKED]' : whitespace.zone;
      this.onOrbitUpdate(normalizedDeg, sectorName, displayZone, scalePercent, this.isParked ? 0 : whitespace.overlapPercent);
    }

    // Target Screen X: When driving, dock into whitespace; when parked, center over footer staging line
    const driveScreenX = whitespace.targetScreenX;
    const parkScreenX = winW * 0.5;
    this.targetScreenX = THREE.MathUtils.lerp(driveScreenX, parkScreenX, this.parkRatio);

    // Target Scale: Sleek fully-visible scale when parked (fits complete 5.5m car cleanly on any screen)
    const driveScale = whitespace.targetScale;
    const maxParkWidth = Math.min(760, winW * 0.58);
    const parkScale = Math.min(this.baseScale * 0.58, (maxParkWidth / 1100) * this.baseScale);
    this.targetScale = THREE.MathUtils.lerp(driveScale, parkScale, this.parkRatio);

    // Smooth horizontal screen interpolation and dynamic scale lerping
    this.currentScreenX += (this.targetScreenX - this.currentScreenX) * 0.08;
    this.currentScale += (this.targetScale - this.currentScale) * 0.08;
    if (this.f1Car) {
      this.f1Car.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }

    if (this.carRoot) {
      // Subtle organic breathing motion
      const breathingY = Math.sin(elapsedTime * 2.0) * 0.012;
      const breathingPitch = Math.sin(elapsedTime * 1.5) * 0.008;

      let carElevatedY = 0.08;
      if (whitespace.zone === 'center-glide') {
        carElevatedY = 0.28;
      }

      this.targetCarPos.set(0, carElevatedY + breathingY, waypoint.position.z);
      this.currentCarPos.lerp(this.targetCarPos, 0.08);
      this.carRoot.position.copy(this.currentCarPos);

      // Launch control ready-to-launch stance: slight rear squat + high-RPM tremor
      const driveRotX = waypoint.rotation.x + breathingPitch;
      const parkRotX = -0.026; // Aggressive squat
      const launchTremblePitch = this.isParked ? (Math.sin(elapsedTime * 36) * 0.0022 * this.parkRatio) : 0;

      this.carRoot.rotation.x = THREE.MathUtils.lerp(driveRotX, parkRotX, this.parkRatio) + launchTremblePitch;
      this.carRoot.rotation.y = finalYaw;
      this.carRoot.rotation.z = THREE.MathUtils.lerp(waypoint.rotation.z, 0, this.parkRatio);

      // Update chassis point light position with car
      if (this.chassisLight) {
        this.chassisLight.position.set(0, this.currentCarPos.y + 0.1, this.currentCarPos.z);
      }
    }

    // 5. Stable Cinematic Camera Rig (Aimed at the car, framed cleanly)
    const orbitR = this.orbitRadius;
    const baseCamH = (this.isTopView ? 3.2 : waypoint.camHeight) + this.mouseParallax.y * 0.45;
    const camSideOffset = this.mouseParallax.x * 0.4;

    this.targetCamPos.set(camSideOffset, this.currentCarPos.y + baseCamH, this.currentCarPos.z + orbitR);
    this.targetLookAt.set(0, this.currentCarPos.y + 0.35, this.currentCarPos.z);

    this.currentCamPos.lerp(this.targetCamPos, 0.08);
    this.currentLookAt.lerp(this.targetLookAt, 0.08);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    // 6. Dynamic Viewport Off-Center Projection:
    // Elevate car so it sits safely ON TOP of the footer (never submerged!)
    const parallaxX = this.mouseParallax.x * 24;
    const parallaxY = this.mouseParallax.y * 16;
    const finalScreenX = this.currentScreenX + parallaxX;
    const viewOffsetX = (winW * 0.5) - finalScreenX;

    const normalScreenY = winH * 0.5;
    const trackLineEl = document.querySelector('.staging-track-line');
    const stagingSectionEl = document.querySelector('.parking-staging-section');
    let safeParkScreenY = winH * 0.45;

    if (trackLineEl) {
      const trackRect = trackLineEl.getBoundingClientRect();
      // Sit cleanly right on top of the staging track line, fully unoccluded above the dark footer:
      safeParkScreenY = Math.max(winH * 0.15, Math.min(winH * 0.68, trackRect.top - 55));
    } else if (stagingSectionEl) {
      const stageRect = stagingSectionEl.getBoundingClientRect();
      safeParkScreenY = Math.max(winH * 0.15, Math.min(winH * 0.68, stageRect.top + 70));
    } else if (footerEl) {
      const footerRect = footerEl.getBoundingClientRect();
      safeParkScreenY = Math.max(winH * 0.15, Math.min(winH * 0.65, footerRect.top - 120));
    }
    const targetScreenY = THREE.MathUtils.lerp(normalScreenY, safeParkScreenY, this.parkRatio);
    const viewOffsetY = (winH * 0.5) - (targetScreenY - parallaxY);

    this.camera.setViewOffset(winW, winH, viewOffsetX, viewOffsetY, winW, winH);

    // 7. Continuous Launch Sparks & Rear Flame Jet Emitter
    if (this.parkRatio > 0.15) {
      this.emitLaunchSparks(delta, this.parkRatio);
    } else if (this.rearFlameLight) {
      this.rearFlameLight.intensity = 0;
    }

    // 6. Update Subtle Ambient Champagne Dust Motes
    if (this.embers) {
      const pos = this.embers.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        pos[i * 3] += this.emberVelocities[i * 3];
        pos[i * 3 + 1] += this.emberVelocities[i * 3 + 1];
        pos[i * 3 + 2] += this.emberVelocities[i * 3 + 2];

        // Reset if drifted too high
        if (pos[i * 3 + 1] > 4.5) {
          pos[i * 3 + 1] = 0.1;
          pos[i * 3] = this.currentCarPos.x + (Math.random() - 0.5) * 12;
          pos[i * 3 + 2] = this.currentCarPos.z + (Math.random() - 0.5) * 12;
        }
      }
      this.embers.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
