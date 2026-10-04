// Interactive GP Circuit Canvas for the Apex Experience Center
export class CircuitVisualizer {
  constructor(canvasElement, telemetryElements) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.ui = telemetryElements; // { speedElem, sectorElem, throttleElem }
    this.carProgress = 0;
    this.speed = 0.0035;
    this.activeCorner = null;

    // Defined Track Waypoints (Apex International Indoor Circuit)
    this.trackPoints = [
      { x: 120, y: 340, corner: 'Turn 1: Parabolica Entry', apexSpeed: '85 km/h', gear: '4th' },
      { x: 280, y: 340, corner: 'Turn 2: Apex Straight', apexSpeed: '124 km/h', gear: '6th' },
      { x: 440, y: 330, corner: 'Turn 3: Speed Trap Sector 1', apexSpeed: '132 km/h', gear: '6th' },
      { x: 540, y: 260, corner: 'Turn 4: Senna Esses In', apexSpeed: '78 km/h', gear: '3rd' },
      { x: 480, y: 160, corner: 'Turn 5: Senna Esses Out', apexSpeed: '92 km/h', gear: '4th' },
      { x: 380, y: 190, corner: 'Turn 6: Technical Chicane', apexSpeed: '55 km/h', gear: '2nd' },
      { x: 260, y: 140, corner: 'Turn 7: High Bank Loop (18°)', apexSpeed: '105 km/h', gear: '5th' },
      { x: 160, y: 120, corner: 'Turn 8: Pit Entry Complex', apexSpeed: '64 km/h', gear: '2nd' },
      { x: 80, y: 220, corner: 'Turn 9: Grandstand Hairpin', apexSpeed: '42 km/h', gear: '1st' }
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInteractivity();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    this.scaleX = this.canvas.width / 600;
    this.scaleY = this.canvas.height / 400;
  }

  setupInteractivity() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      // Check proximity to corners
      let found = null;
      this.trackPoints.forEach((pt) => {
        const px = pt.x * this.scaleX;
        const py = pt.y * this.scaleY;
        const dist = Math.hypot(mouseX - px, mouseY - py);
        if (dist < 28) {
          found = pt;
        }
      });

      this.activeCorner = found;
      if (this.ui.cornerInfo && found) {
        this.ui.cornerInfo.innerHTML = `
          <div class="corner-popup">
            <div class="badge-corner">APEX TELEMETRY</div>
            <h4>${found.corner}</h4>
            <div class="stat-row"><span>Target Apex Speed:</span> <strong>${found.apexSpeed}</strong></div>
            <div class="stat-row"><span>Optimal Gear:</span> <strong>${found.gear}</strong></div>
            <p class="tip-text">Late apex entry recommended for optimal exit velocity into the main straight.</p>
          </div>
        `;
      }
    });
  }

  // Get interpolated position along closed loop track
  getTrackPosition(t) {
    const points = this.trackPoints;
    const n = points.length;
    const index = Math.floor(t * n);
    const subT = (t * n) - index;

    const p0 = points[(index - 1 + n) % n];
    const p1 = points[index % n];
    const p2 = points[(index + 1) % n];
    const p3 = points[(index + 2) % n];

    // Catmull-Rom spline interpolation
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * subT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * subT * subT +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * subT * subT * subT
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * subT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * subT * subT +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * subT * subT * subT
    );

    return { x: x * this.scaleX, y: y * this.scaleY };
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw track outer glow
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const pos = this.getTrackPosition(i / 100);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 2. Draw asphalt track surface
    ctx.strokeStyle = '#121720';
    ctx.lineWidth = 24;
    ctx.stroke();

    // 3. Draw track borders / kerbs
    ctx.strokeStyle = 'rgba(255, 27, 45, 0.4)';
    ctx.lineWidth = 28;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Racing Line (glowing cyan / amber line)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5. Draw Apex Hotspot Markers
    this.trackPoints.forEach((pt, i) => {
      const px = pt.x * this.scaleX;
      const py = pt.y * this.scaleY;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.activeCorner === pt ? '#ff1844' : '#ffcc00';
      ctx.fill();

      // Outer ripple
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Apex label
      ctx.fillStyle = '#8f9ba8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`T${i + 1}`, px + 9, py - 4);
    });

    // 6. Draw Moving Ghost Car (Telemetry Beacon)
    this.carProgress = (this.carProgress + this.speed) % 1;
    const carPos = this.getTrackPosition(this.carProgress);
    const nextPos = this.getTrackPosition((this.carProgress + 0.01) % 1);
    const angle = Math.atan2(nextPos.y - carPos.y, nextPos.x - carPos.x);

    // Car shadow & trail
    ctx.save();
    ctx.translate(carPos.x, carPos.y);
    ctx.rotate(angle);

    // Light trail
    ctx.fillStyle = 'rgba(255, 24, 68, 0.8)';
    ctx.fillRect(-18, -2, 14, 4);

    // Car body representation
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.fillRect(-10, -5, 20, 10);

    // Front spoiler
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(8, -8, 3, 16);

    // Rear wing
    ctx.fillStyle = '#ff1844';
    ctx.fillRect(-10, -9, 3, 18);

    ctx.restore();

    // 7. Calculate real-time simulated speed and sector
    const currentSector = this.carProgress < 0.33 ? 'SECTOR 1' : this.carProgress < 0.66 ? 'SECTOR 2' : 'SECTOR 3';
    // Calculate speed based on straightaway vs corner
    let instantSpeed = 118;
    if (this.carProgress > 0.45 && this.carProgress < 0.65) instantSpeed = 64; // Chicane
    else if (this.carProgress > 0.85 || this.carProgress < 0.1) instantSpeed = 48; // Hairpin
    else if (this.carProgress > 0.15 && this.carProgress < 0.4) instantSpeed = 134; // Main straight

    if (this.ui.speedElem) this.ui.speedElem.textContent = `${instantSpeed} KM/H`;
    if (this.ui.sectorElem) this.ui.sectorElem.textContent = currentSector;
    if (this.ui.throttleElem) {
      const throttlePercent = Math.min(100, Math.round((instantSpeed / 135) * 100));
      this.ui.throttleElem.style.width = `${throttlePercent}%`;
    }
  }
}
