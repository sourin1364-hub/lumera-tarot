/* =========================================================
   LUMERA · BACKGROUND ANIMATION
   Canvas-based animated background for each element.
   ========================================================= */
window.LumeraBG = (() => {
  'use strict';

  let canvas = null;
  let ctx = null;
  let animId = null;
  let particles = [];
  let currentElement = null;
  let time = 0;

  const THEMES = {
    'آب': {
      key: 'water',
      particleColor: '#5fe0d0',
      particleGlow: 'rgba(95,224,208,0.8)',
      waveColor: 'rgba(95,224,208,0.15)',
      bgTop: '#0a3a5c',
      bgBottom: '#010a12',
      particleShape: 'drop',
      count: 50,
      speed: 0.4
    },
    'آتش': {
      key: 'fire',
      particleColor: '#ffb06b',
      particleGlow: 'rgba(255,107,26,0.9)',
      waveColor: 'rgba(255,107,26,0.15)',
      bgTop: '#5c1414',
      bgBottom: '#0a0202',
      particleShape: 'ember',
      count: 60,
      speed: 0.8
    },
    'خاک': {
      key: 'earth',
      particleColor: '#d9a957',
      particleGlow: 'rgba(217,169,87,0.7)',
      waveColor: 'rgba(217,169,87,0.12)',
      bgTop: '#2f5220',
      bgBottom: '#070d05',
      particleShape: 'dust',
      count: 45,
      speed: 0.3
    },
    'هوا': {
      key: 'air',
      particleColor: '#a8c8e8',
      particleGlow: 'rgba(168,200,232,0.8)',
      waveColor: 'rgba(168,200,232,0.12)',
      bgTop: '#2f5aa0',
      bgBottom: '#060b15',
      particleShape: 'wisp',
      count: 55,
      speed: 1.2
    }
  };

  /* ================= SETUP ================= */
  function setup() {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.id = 'bgCanvas';
    canvas.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'z-index: -1',
      'pointer-events: none',
      'transition: opacity 1.5s ease',
      'opacity: 0'
    ].join(';');

    document.body.insertBefore(canvas, document.body.firstChild);

    ctx = canvas.getContext('2d', { willReadFrequently: true });
    resize();

    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas._w = window.innerWidth;
    canvas._h = window.innerHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  /* ================= PARTICLES ================= */
    function createParticles(config) {
    const w = canvas._w || window.innerWidth;
    const h = canvas._h || window.innerHeight;
    particles = [];

    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: config.particleShape === 'wisp'
          ? 20 + Math.random() * 40
          : 1.2 + Math.random() * 2.5,
        speedY: -(config.speed + Math.random() * config.speed),
        speedX: (Math.random() - 0.5) * config.speed,
        opacity: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        wobble: Math.random() * 1.5,
        shape: config.particleShape
      });
    }
  }

  /* ================= DRAW ================= */
    function drawBackground(config) {
    const w = canvas._w;
    const h = canvas._h;

    // Base gradient — softer
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, config.bgTop);
    grad.addColorStop(0.6, config.bgBottom);
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Radial glow at bottom — softer pulse
    const pulse = 0.3 + Math.sin(time * 1.2) * 0.15;
    const radial = ctx.createRadialGradient(w / 2, h + 150, 0, w / 2, h + 150, h * 1.2);
    const waveRGB = config.waveColor.match(/[\d.]+/g);
    const r = waveRGB[0];
    const g = waveRGB[1];
    const b = waveRGB[2];
    radial.addColorStop(0, `rgba(${r},${g},${b},${pulse})`);
    radial.addColorStop(0.4, `rgba(${r},${g},${b},0.08)`);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    // Secondary moving glow — subtle
    const xPos = w * (0.5 + Math.sin(time * 0.25) * 0.3);
    const yPos = h * (0.35 + Math.cos(time * 0.35) * 0.1);
    const radial2 = ctx.createRadialGradient(xPos, yPos, 0, xPos, yPos, h * 0.8);
    radial2.addColorStop(0, `rgba(${r},${g},${b},0.1)`);
    radial2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial2;
    ctx.fillRect(0, 0, w, h);
  }

    function drawParticles(config) {
    const w = canvas._w;
    const h = canvas._h;

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(time + p.phase) * p.wobble;

      if (p.y < -p.size * 4) {
        p.y = h + p.size * 4;
        p.x = Math.random() * w;
      }
      if (p.x < -p.size * 4) p.x = w + p.size * 4;
      if (p.x > w + p.size * 4) p.x = -p.size * 4;

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (p.shape === 'ember') {
        // Fire ember — small and glowing
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        grd.addColorStop(0, 'rgba(255,255,255,0.9)');
        grd.addColorStop(0.15, '#ffd98a');
        grd.addColorStop(0.4, config.particleColor);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'wisp') {
        // Air wisp — soft cloud
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grd.addColorStop(0, 'rgba(255,255,255,0.35)');
        grd.addColorStop(0.4, config.particleColor);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'drop') {
        // Water drop — soft
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grd.addColorStop(0, 'rgba(255,255,255,0.7)');
        grd.addColorStop(0.3, '#7ef0e0');
        grd.addColorStop(0.6, config.particleColor);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Earth dust — soft
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grd.addColorStop(0, '#fff2c9');
        grd.addColorStop(0.4, config.particleColor);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  /* ================= LOOP ================= */
  function loop() {
    if (!currentElement) return;
    const config = THEMES[currentElement];
    if (!config) return;

    time += 0.016;

    drawBackground(config);
    drawParticles(config);

    animId = requestAnimationFrame(loop);
  }

  /* ================= PUBLIC ================= */
  function apply(element) {
    setup();

    if (!THEMES[element]) {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      canvas.style.opacity = '0';
      currentElement = null;
      return;
    }

    const config = THEMES[element];

    if (currentElement !== element) {
      currentElement = element;
      createParticles(config);

      if (animId) cancelAnimationFrame(animId);
      loop();

      canvas.style.opacity = '1';
    }

    document.body.classList.remove(
      'element-water', 'element-fire', 'element-earth', 'element-air'
    );
    document.body.classList.add('element-' + config.key);
  }

  function applyFromProfile() {
    try {
      const profile = LumeraUser.loadProfile();
      if (profile.element) {
        apply(profile.element);
      }
    } catch (_) {}
  }

  return {
    apply: apply,
    applyFromProfile: applyFromProfile
  };
})();