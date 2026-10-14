/* =========================================================
   LUMERA · APP CONTROLLER
   Handles events, rendering, sharing, PWA, ambient audio.
   ========================================================= */
(() => {
  'use strict';

  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let currentDraw = null;
  let currentSpread = null;
  let hafezResult = null;
  let deferredInstall = null;
  let audioCtx = null;
  let ambientOn = false;
  let ambientNodes = null;

  /* ================= BOOT ================= */
  async function boot() {
    try {
      await TarotEngine.load();
// فال حافظ موقتاً غیرفعال است
// await HafezEngine.load();
    } catch (err) {
      console.error(err);
      toast('برای بارگذاری داده‌ها، پروژه را روی سرور یا GitHub Pages اجرا کن.');
    }
    renderSpreads();
    bindEvents();
    spawnParticles();
    registerSW();
  }

  /* ================= SPREADS ================= */
  function renderSpreads() {
    const grid = $('#spreadsGrid');
    if (!grid) return;
    grid.innerHTML = Object.values(TarotEngine.SPREADS).map(s => `
      <button class="spread-card" data-spread="${s.key}">
        <div class="spread-icon">${s.icon}</div>
        <div class="spread-name">${s.name}</div>
        <div class="spread-desc">${s.desc}</div>
      </button>
    `).join('');
  }

  /* ================= EVENTS ================= */
  function bindEvents() {
    // Tabs
    $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

    // Spread choice
    const grid = $('#spreadsGrid');
    if (grid) {
      grid.addEventListener('click', e => {
        const btn = e.target.closest('.spread-card');
        if (!btn) return;
        startDraw(btn.dataset.spread);
      });
    }

    // Card row
    const row = $('#cardsRow');
    if (row) {
      row.addEventListener('click', e => {
        const wrap = e.target.closest('.card-wrap');
        if (!wrap || wrap.classList.contains('flipped')) return;
        flipCard(wrap);
      });
    }

    // Reset
    const reset = $('#resetBtn');
    if (reset) reset.addEventListener('click', resetBoard);

    // Share (tarot)
    const shareBtn = $('#shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareTarotStory);

    // Hafez
    const faalBtn = $('#faalBtn');
    if (faalBtn) faalBtn.addEventListener('click', runHafez);

    const shareHafez = $('#shareHafezBtn');
    if (shareHafez) shareHafez.addEventListener('click', shareHafezStory);

    // Sound
    const soundBtn = $('#soundBtn');
    if (soundBtn) soundBtn.addEventListener('click', toggleAmbient);

    // PWA install
    const installBtn = $('#installBtn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        const choice = await deferredInstall.userChoice;
        if (choice.outcome === 'accepted') {
          deferredInstall = null;
          installBtn.classList.add('hidden');
        }
      });
    }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstall = e;
      if (installBtn) installBtn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      toast('لومِرا نصب شد ✦');
      if (installBtn) installBtn.classList.add('hidden');
    });
  }

  function switchTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    const tarot = $('#tarotTab');
    const hafez = $('#hafezTab');
    if (tarot) tarot.classList.toggle('hidden', name !== 'tarot');
    if (hafez) hafez.classList.toggle('hidden', name !== 'hafez');
    if (location.hash !== '#' + name) location.hash = name;
  }

  /* ================= TAROT FLOW ================= */
  function startDraw(spreadKey) {
    try {
      currentSpread = spreadKey;
      currentDraw = TarotEngine.draw(spreadKey);
      playShuffle();

      const spread = TarotEngine.SPREADS[spreadKey];
      $('#boardTitle').textContent = spread.name;
      $('#boardSub').textContent = `${spread.count} کارت — روی هر کارت بزن تا باز شود`;
      $('#reading').classList.add('hidden');
      $('#reading').innerHTML = '';

      const row = $('#cardsRow');
      row.innerHTML = currentDraw.map((d, i) => `
        <div style="position:relative">
          <div class="card-wrap dealing" data-idx="${i}" style="--delay:${i * 0.12}s">
            <div class="card-face">${CardArt.faceSVG(d.card)}</div>
            <div class="card-back">${CardArt.backSVG()}</div>
          </div>
          <div class="card-label">${d.position}</div>
        </div>
      `).join('');

      $('#board').classList.remove('hidden');
      $('#board').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      toast('خطا در کشیدن کارت‌ها: ' + err.message);
    }
  }

  function flipCard(el) {
    el.classList.add('flipped');
    const idx = parseInt(el.dataset.idx, 10);
    const d = currentDraw[idx];
    if (d.reversed) el.classList.add('reversed');
    playFlip();

    const all = $$('#cardsRow .card-wrap');
    if ([...all].every(x => x.classList.contains('flipped'))) {
      showReading();
    }
  }

  function showReading() {
    if (!currentDraw) return;

    // Special rendering for yes/no
    if (currentSpread === 'yesno') {
      const verdict = TarotEngine.yesNoVerdict(currentDraw);
      const d = currentDraw[0];
      const c = d.card;
      const text = d.reversed ? c.reversed : c.upright;

      const box = $('#reading');
      box.innerHTML = `
        <h3>✦ پاسخ لومِرا</h3>
        <div style="text-align:center; margin: 18px 0;">
          <div style="font-size:26px; font-weight:800; color:var(--gold-1); margin-bottom:8px;">
            ${verdict.text}
          </div>
          <div style="font-size:12.5px; color:var(--ink-dim);">
            ${verdict.detail}
          </div>
        </div>
        <div class="reading-item" style="--i:0">
          <span class="reading-pos">${d.position}</span>
          <p class="reading-name">${c.name}${d.reversed ? ' <span class="rev">⇵ وارونه</span>' : ''}</p>
          <div class="reading-text">${text}</div>
          <div class="reading-msg">${c.message || ''}</div>
        </div>
      `;
      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const html = currentDraw.map((d, i) => {
      const c = d.card;
      const text = d.reversed ? c.reversed : c.upright;
      const name = c.name + (d.reversed ? ' <span class="rev">⇵ وارونه</span>' : '');
      return `
        <div class="reading-item" style="--i:${i}">
          <span class="reading-pos">${d.position}</span>
          <p class="reading-name">${name}</p>
          <div class="reading-text">${text}</div>
          <div class="reading-msg">${c.message || ''}</div>
        </div>`;
    }).join('');

    const box = $('#reading');
    box.innerHTML = `<h3>✦ تعبیر لومِرا</h3>${html}`;
    box.classList.remove('hidden');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBoard() {
    $('#board').classList.add('hidden');
    $('#reading').classList.add('hidden');
    currentDraw = null;
    currentSpread = null;
  }

  /* ================= HAFEZ FLOW ================= */
  function runHafez() {
    const intention = ($('#hafezIntention')?.value || '').trim();
    hafezResult = HafezEngine.faal(intention);
    playShuffle();

    const g = hafezResult.ghazal;
    const versesHTML = hafezResult.chosen.map(v => `<span class="verse">${v}</span>`).join('');

    $('#ghazalCard').innerHTML = `
      ${versesHTML}
      <span class="poet">— حافظ شیرازی —</span>
    `;

    const intentText = hafezResult.intention
      ? `نیت تو: «${hafezResult.intention}». `
      : '';

   $('#hafezReading').innerHTML = `
  <h3>✦ تعبیر لومِرا</h3>
  <div class="reading-text">${hafezResult.interpretation}</div>
  <div class="reading-msg">${hafezResult.personalMessage || ''}</div>
`;

    $('#hafezResult').classList.remove('hidden');
    $('#hafezResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ================= SHARE AS STORY (TAROT) ================= */
  async function shareTarotStory() {
    if (!currentDraw) return;
    const canvas = $('#storyCanvas');
    const ctx = canvas.getContext('2d');

    drawStoryBackground(ctx, canvas);

    // Title
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 68px Vazirmatn, Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('لومِرا', canvas.width / 2, 190);
    ctx.font = '600 26px Vazirmatn, Tahoma';
    ctx.fillStyle = '#b7b2a6';
    ctx.fillText('LUMERA · TAROT', canvas.width / 2, 235);

    const spread = TarotEngine.SPREADS[currentSpread];
    ctx.font = 'bold 42px Vazirmatn, Tahoma';
    ctx.fillStyle = '#e9e3d2';
    ctx.fillText(spread.name, canvas.width / 2, 340);

    const intention = ($('#intention')?.value || '').trim();
    if (intention) {
      ctx.font = '26px Vazirmatn, Tahoma';
      ctx.fillStyle = '#b7b2a6';
      ctx.fillText('نیت: ' + truncate(intention, 42), canvas.width / 2, 395);
    }

    // Card blocks
    const startY = 470;
    currentDraw.forEach((d, i) => {
      const y = startY + i * 240;
      drawCardBlock(ctx, 120, y, canvas.width - 240, 210, d);
    });

    drawWatermark(ctx, canvas);
    await exportCanvas(canvas, 'lumera-tarot-story.png');
  }

  function drawCardBlock(ctx, x, y, w, h, d) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,217,138,0.08)');
    g.addColorStop(1, 'rgba(95,224,208,0.05)');
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(217,169,87,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 24);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 30px Vazirmatn, Tahoma';
    ctx.fillText(d.position, x + w - 26, y + 48);

    ctx.fillStyle = '#e9e3d2';
    ctx.font = 'bold 34px Vazirmatn, Tahoma';
    const name = d.card.name + (d.reversed ? ' (وارونه)' : '');
    ctx.fillText(name, x + w - 26, y + 92);

    ctx.fillStyle = '#b7b2a6';
    ctx.font = '24px Vazirmatn, Tahoma';
    const text = d.reversed ? d.card.reversed : d.card.upright;
    wrapText(ctx, text, x + w - 26, y + 132, w - 52, 32, 3);
  }

  /* ================= SHARE AS STORY (HAFEZ) ================= */
  async function shareHafezStory() {
    if (!hafezaResult) return;
    const canvas = $('#storyCanvas');
    const ctx = canvas.getContext('2d');

    drawStoryBackground(ctx, canvas);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 66px Vazirmatn, Tahoma';
    ctx.fillText('تفأل حافظ', canvas.width / 2, 190);

    ctx.font = '600 26px Vazirmatn, Tahoma';
    ctx.fillStyle = '#b7b2a6';
    ctx.fillText('LUMERA · HAFEZ', canvas.width / 2, 235);

    if (hafezResult.intention) {
      ctx.font = '26px Vazirmatn, Tahoma';
      ctx.fillStyle = '#b7b2a6';
      ctx.fillText('نیت: ' + truncate(hafezResult.intention, 42), canvas.width / 2, 320);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e9e3d2';
    ctx.font = 'bold 34px Vazirmatn, Tahoma';
    let yy = 440;
    hafezResult.chosen.forEach(v => {
      wrapText(ctx, v, canvas.width / 2, yy, canvas.width - 200, 46, 2, true);
      yy += 130;
    });

    ctx.font = 'italic 30px Vazirmatn, Tahoma';
    ctx.fillStyle = '#b7b2a6';
    ctx.fillText('— حافظ شیرازی —', canvas.width / 2, yy + 40);

    const interY = yy + 140;
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 30px Vazirmatn, Tahoma';
    ctx.fillText('تعبیر لومِرا', canvas.width / 2, interY);
    ctx.fillStyle = '#d9d3c4';
    ctx.font = '26px Vazirmatn, Tahoma';
    wrapText(ctx, hafezResult.ghazal.interpretation, canvas.width / 2, interY + 60, canvas.width - 220, 38, 8, true);

    drawWatermark(ctx, canvas);
    await exportCanvas(canvas, 'lumera-hafez-story.png');
  }

  /* ================= STORY HELPERS ================= */
  function drawStoryBackground(ctx, canvas) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#121734');
    bgGrad.addColorStop(0.5, '#0a0d1f');
    bgGrad.addColorStop(1, '#05070f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.65})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.6, 0, 7);
      ctx.fill();
    }

    ctx.strokeStyle = '#d9a957';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 60, canvas.width - 100, canvas.height - 120);
    ctx.strokeStyle = '#b8863b';
    ctx.lineWidth = 1;
    ctx.strokeRect(66, 76, canvas.width - 132, canvas.height - 152);
  }

  function drawWatermark(ctx, canvas) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 36px Vazirmatn, Tahoma';
    ctx.fillText('@lumera.tv', canvas.width / 2, canvas.height - 90);
    ctx.font = '22px Vazirmatn, Tahoma';
    ctx.fillStyle = '#b7b2a6';
    ctx.fillText('فال تاروت لومِرا', canvas.width / 2, canvas.height - 52);
  }

  async function exportCanvas(canvas, filename) {
    canvas.toBlob(async blob => {
      const file = new File([blob], filename, { type: 'image/png' });
      const shareData = {
        files: [file],
        title: 'فال لومِرا',
        text: 'فال تاروت لومِرا ✦ @lumera.tv'
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (_) {}
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
      toast('تصویر استوری ذخیره شد ✦');
    }, 'image/png', 0.95);
  }

  /* ================= UTIL ================= */
  function truncate(s, n) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3, center = false) {
    const words = text.split(' ');
    let line = '', lines = [];
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = words[n] + ' ';
        if (lines.length >= maxLines) break;
      } else {
        line = test;
      }
    }
    if (lines.length < maxLines && line) lines.push(line.trim());

    lines.forEach((l, i) => {
      ctx.textAlign = center ? 'center' : 'right';
      ctx.fillText(l, x, y + i * lineHeight);
    });
  }

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ================= AMBIENT AUDIO ================= */
  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
  }

  function playFlip() {
    try {
      initAudio();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(520, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.18);
      g.gain.setValueAtTime(0.09, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.24);
    } catch (_) {}
  }

  function playShuffle() {
    try {
      initAudio();
      for (let i = 0; i < 5; i++) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const t = audioCtx.currentTime + i * 0.05;
        o.type = 'sine';
        o.frequency.value = 380 + Math.random() * 260;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g).connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.14);
      }
    } catch (_) {}
  }

  function toggleAmbient() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const soundBtn = $('#soundBtn');

    if (ambientOn) {
      ambientNodes?.forEach(n => { try { n.stop(); } catch (_) {} });
      ambientNodes = null;
      ambientOn = false;
      soundBtn?.classList.remove('active');
      return;
    }

    const master = audioCtx.createGain();
    master.gain.value = 0.05;
    master.connect(audioCtx.destination);

    const drone = audioCtx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 174;
    drone.connect(master);
    drone.start();

    const drone2 = audioCtx.createOscillator();
    drone2.type = 'triangle';
    drone2.frequency.value = 261.6;
    drone2.detune.value = 6;
    drone2.connect(master);
    drone2.start();

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    ambientNodes = [drone, drone2, lfo];
    ambientOn = true;
    soundBtn?.classList.add('active');
    toast('صدای امبینت روشن شد ✦');
  }

  /* ================= PARTICLES ================= */
  function spawnParticles() {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.bottom = '-10px';
      p.style.animationDuration = (14 + Math.random() * 16) + 's';
      p.style.animationDelay = (-Math.random() * 20) + 's';
      p.style.opacity = 0.3 + Math.random() * 0.6;
      document.body.appendChild(p);
    }
  }

  /* ================= SERVICE WORKER ================= */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
      });
    }
  }

  /* ================= START ================= */
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    if (location.hash === '#hafez') switchTab('hafez');
    if (location.hash === '#tarot') switchTab('tarot');
  });
})();