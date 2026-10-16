/* =========================================================
   LUMERA · APP CONTROLLER v6
   Full controller: tarot, daily, natal, profile, stats,
   achievements, theme, onboarding, backup, audio, sharing.
   ========================================================= */
(() => {
  'use strict';

  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let currentDraw = null;
  let currentSpread = null;
  let deferredInstall = null;
  let audioCtx = null;
  let ambientOn = false;
  let ambientNodes = null;

  /* ================= BOOT ================= */
  async function boot() {
    try {
      await TarotEngine.load();
    } catch (err) {
      console.error(err);
      toast('برای بارگذاری داده‌ها، پروژه را روی سرور اجرا کن.');
    }

    renderSpreads();
    bindEvents();
    spawnParticles();
    registerSW();

    // Apply night/day theme
    applyTheme(LumeraUser.loadProfile().theme || 'night');

    // Apply elemental theme (from saved profile)
    try {
      if (typeof LumeraTheme !== 'undefined') {
        LumeraTheme.applyFromProfile();
      }
      if (typeof LumeraBG !== 'undefined') {
        LumeraBG.applyFromProfile();
      }
    } catch (_) {}

    // ✅ Onboarding FIRST (before everything)
    if (!LumeraUser.isOnboardingDone()) {
      if (LumeraUser.isFirstTime()) {
        LumeraUser.saveProfile({ name: '', avatarId: 'sun' });
      }

      LumeraOnboarding.start({
        onComplete: () => {
          initializeProfile();
          renderDailyWidget();
          bindDailyEvents();
          checkAchievements();

          // ✅ Apply elemental theme after onboarding
          try {
            if (typeof LumeraTheme !== 'undefined') {
              LumeraTheme.applyFromProfile();
            }
            if (typeof LumeraBG !== 'undefined') {
              LumeraBG.applyFromProfile();
            }
          } catch (_) {}

          // ✅ Personalized welcome
          const profile = LumeraUser.loadProfile();
          const userName = profile.name || 'مهمان';
          toast(`${userName} به لومِرا خوش آمدی ✦`);
          showWelcomeOverlay(userName);

          // ✅ Localize numbers
          setTimeout(() => localizeNumbers(), 100);
        }
      });
      return;
    }

    // Normal boot (returning user)
    renderDailyWidget();
    bindDailyEvents();
    initializeProfile();
    checkAchievements();

    // ✅ Localize numbers
    setTimeout(() => localizeNumbers(), 100);
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
    $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

    const grid = $('#spreadsGrid');
    if (grid) {
      grid.addEventListener('click', e => {
        const btn = e.target.closest('.spread-card');
        if (!btn) return;
        startDraw(btn.dataset.spread);
      });
    }

    const row = $('#cardsRow');
    if (row) {
      row.addEventListener('click', e => {
        const wrap = e.target.closest('.card-wrap');
        if (!wrap || wrap.classList.contains('flipped')) return;
        flipCard(wrap);
      });
    }

    const reset = $('#resetBtn');
    if (reset) reset.addEventListener('click', resetBoard);

    const shareBtn = $('#shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareTarotStory);

    const soundBtn = $('#soundBtn');
    if (soundBtn) soundBtn.addEventListener('click', toggleAmbient);

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

    bindProfileEvents();
  }

  function switchTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    const tarot = $('#tarotTab');
    const natal = $('#natalTab');
    const profile = $('#profileTab');
    if (tarot) tarot.classList.toggle('hidden', name !== 'tarot');
    if (natal) natal.classList.toggle('hidden', name !== 'natal');
    if (profile) profile.classList.toggle('hidden', name !== 'profile');
    if (location.hash !== '#' + name) location.hash = name;

    if (name === 'profile') refreshProfile();
    if (name === 'natal') refreshNatal();

    setTimeout(() => localizeNumbers(), 50);
  }

  /* ================= DAILY WIDGET ================= */
  function renderDailyWidget() {
    const body = $('#dailyBody');
    if (!body) return;

    const deck = getAllCards();
    if (!deck || deck.length === 0) {
      body.innerHTML = '<div class="daily-loading">در حال بارگذاری کارت‌ها...</div>';
      return;
    }

    const today = LumeraDaily.pickTodayCard(deck);
    if (!today) return;

    LumeraDaily.markTodayOpened();
    const streak = LumeraDaily.getStreak();

    const streakNum = $('#dailyStreakNum');
    if (streakNum) streakNum.textContent = toPersianDigits(streak);

    const { card, reversed } = today;
    const message = reversed ? card.reversed : card.upright;
    const shortMessage = message.split('.')[0] + '.';

    body.innerHTML = `
      <div class="daily-card-thumb ${reversed ? 'reversed' : ''}">
        ${CardArt.faceSVG(card)}
      </div>
      <div class="daily-info">
        <h3 class="daily-card-name">
          ${card.name}
          ${reversed ? '<span class="daily-rev-tag">⇵ وارونه</span>' : ''}
        </h3>
        <div class="daily-message">${shortMessage}</div>
      </div>
    `;

    window.__lumeraTodayCard = today;
  }

  function getAllCards() {
    const ids = [
      'major-00','major-01','major-02','major-03','major-04','major-05','major-06',
      'major-07','major-08','major-09','major-10','major-11','major-12','major-13',
      'major-14','major-15','major-16','major-17','major-18','major-19','major-20',
      'major-21',
      'cups-ace','cups-two','cups-three','cups-four','cups-five','cups-six',
      'cups-seven','cups-eight','cups-nine','cups-ten','cups-page','cups-knight',
      'cups-queen','cups-king',
      'swords-ace','swords-two','swords-three','swords-four','swords-five','swords-six',
      'swords-seven','swords-eight','swords-nine','swords-ten','swords-page','swords-knight',
      'swords-queen','swords-king',
      'wands-ace','wands-two','wands-three','wands-four','wands-five','wands-six',
      'wands-seven','wands-eight','wands-nine','wands-ten','wands-page','wands-knight',
      'wands-queen','wands-king',
      'pentacles-ace','pentacles-two','pentacles-three','pentacles-four','pentacles-five',
      'pentacles-six','pentacles-seven','pentacles-eight','pentacles-nine','pentacles-ten',
      'pentacles-page','pentacles-knight','pentacles-queen','pentacles-king'
    ];
    return ids.map(id => TarotEngine.getCard(id)).filter(Boolean);
  }

  function bindDailyEvents() {
    const openBtn = $('#dailyOpenBtn');
    if (openBtn && !openBtn.dataset.bound) {
      openBtn.dataset.bound = '1';
      openBtn.addEventListener('click', () => {
        const today = window.__lumeraTodayCard;
        if (!today) return;

        currentSpread = 'daily';
        currentDraw = [{
          card: today.card,
          reversed: today.reversed,
          position: 'پیام امروز',
          index: 0
        }];

        const spread = TarotEngine.SPREADS.daily;
        $('#boardTitle').textContent = spread.name;
        $('#boardSub').textContent = 'روی کارت بزن تا باز شود';
        $('#reading').classList.add('hidden');
        $('#reading').innerHTML = '';

        const row = $('#cardsRow');
        row.innerHTML = `
          <div style="position:relative">
            <div class="card-wrap" data-idx="0">
              <div class="card-face">${CardArt.faceSVG(today.card)}</div>
              <div class="card-back">${CardArt.backSVG()}</div>
            </div>
            <div class="card-label">پیام امروز</div>
          </div>
        `;

        $('#board').classList.remove('hidden');
        $('#board').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const notifyBtn = $('#dailyNotifyBtn');
    const notifyLabel = $('#dailyNotifyLabel');
    if (notifyBtn && notifyLabel && !notifyBtn.dataset.bound) {
      notifyBtn.dataset.bound = '1';

      if (LumeraDaily.isNotificationEnabled()) {
        notifyBtn.classList.add('active');
        notifyLabel.textContent = 'یادآوری روشن';
      }

      notifyBtn.addEventListener('click', async () => {
        if (LumeraDaily.isNotificationEnabled()) {
          LumeraDaily.disableNotification();
          notifyBtn.classList.remove('active');
          notifyLabel.textContent = 'یادآوری روزانه';
          toast('یادآوری خاموش شد');
        } else {
          const result = await LumeraDaily.enableNotification();
          if (result.ok) {
            notifyBtn.classList.add('active');
            notifyLabel.textContent = 'یادآوری روشن';
            toast('یادآوری روزانه روشن شد ✦');
          } else if (result.reason === 'unsupported') {
            toast('مرورگر شما از اعلان پشتیبانی نمی‌کند');
          } else if (result.reason === 'denied') {
            toast('اجازه‌ی اعلان رد شد');
          }
        }
      });
    }
  }

  /* ================= TAROT FLOW ================= */
  function startDraw(spreadKey) {
    try {
      currentSpread = spreadKey;
      currentDraw = TarotEngine.draw(spreadKey);
      playShuffle();

      const spread = TarotEngine.SPREADS[spreadKey];
      $('#boardTitle').textContent = spread.name;
      $('#boardSub').textContent = `${toPersianDigits(spread.count)} کارت — روی هر کارت بزن تا باز شود`;
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

    const intention = ($('#intention')?.value || '').trim();

    if (currentSpread === 'yesno') {
      const verdict = TarotEngine.yesNoVerdict(currentDraw);
      const d = currentDraw[0];
      const c = d.card;
      const text = d.reversed ? c.reversed : c.upright;

      const box = $('#reading');
      box.innerHTML = `
        <h3>✦ پاسخ لومِرا</h3>
        <div class="verdict-box">
          <div class="verdict-text">${verdict.text}</div>
          <div class="verdict-detail">${verdict.detail}</div>
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
      saveReadingToHistory(currentDraw, currentSpread, intention, verdict.text);
      return;
    }

    const result = TarotEngine.interpret(currentDraw, currentSpread, intention);

    const tagsHTML = result.tags && result.tags.length
      ? `<div class="reading-tags">${result.tags.map(t => `<span class="reading-tag">${t}</span>`).join('')}</div>`
      : '';

    const narrativeHTML = result.narrative
      ? `<div class="reading-narrative">
           <div class="narrative-label">✦ خوانش جامع</div>
           <div class="narrative-text">${result.narrative.replace(/\n\n/g, '</p><p>')}</div>
         </div>`
      : '';

    const cardsHTML = result.cards.map((c, i) => {
      const ctx = c.positionContext
        ? `<span class="reading-ctx">${c.positionContext}</span>`
        : '';
      return `
        <div class="reading-item" style="--i:${i}">
          <span class="reading-pos">${c.position}</span>
          ${ctx}
          <p class="reading-name">${c.card.name}${c.reversed ? ' <span class="rev">⇵ وارونه</span>' : ''}</p>
          <div class="reading-text">${c.meaning}</div>
          <div class="reading-msg">${c.message || ''}</div>
        </div>`;
    }).join('');

    const box = $('#reading');
    box.innerHTML = `
      <h3>✦ تعبیر لومِرا</h3>
      ${tagsHTML}
      ${narrativeHTML}
      <div class="reading-cards">
        <div class="narrative-label">✦ کارت‌ها</div>
        ${cardsHTML}
      </div>
    `;
    box.classList.remove('hidden');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    saveReadingToHistory(currentDraw, currentSpread, intention, result.narrative);
  }

  function saveReadingToHistory(cards, spread, intention, narrative) {
    try {
      LumeraUser.addReading({ spread, intention, cards, narrative });
      const newlyUnlocked = LumeraAchievements.checkAll();
      newlyUnlocked.forEach((a, i) => {
        setTimeout(() => toast(`🏆 دستاورد جدید: ${a.name} ${a.icon}`), 800 + i * 1200);
      });
    } catch (e) {
      console.warn('Save history failed', e);
    }
  }

  function resetBoard() {
    $('#board').classList.add('hidden');
    $('#reading').classList.add('hidden');
    currentDraw = null;
    currentSpread = null;
  }

  /* ================= NATAL (فال زاد) ================= */
  function refreshNatal() {
    const saved = LumeraNatal.loadBirthData();
    if (saved) {
      renderNatalResult(saved);
    } else {
      showNatalForm();
    }
    bindNatalEvents();
  }

  function showNatalForm() {
    const form = $('#natalForm');
    const result = $('#natalResult');
    if (form) form.classList.remove('hidden');
    if (result) {
      result.classList.add('hidden');
      result.innerHTML = '';
    }
  }

  function bindNatalEvents() {
    const calcBtn = $('#natalCalcBtn');
    const clearBtn = $('#natalClearBtn');

    if (calcBtn && !calcBtn.dataset.bound) {
      calcBtn.dataset.bound = '1';
      calcBtn.addEventListener('click', calculateNatal);
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = '1';
      clearBtn.addEventListener('click', () => {
        if (confirm('اطلاعات تولد پاک شود؟')) {
          LumeraNatal.clearBirthData();
          showNatalForm();
          const d = $('#natalDay'); if (d) d.value = '';
          const m = $('#natalMonth'); if (m) m.value = '';
          const y = $('#natalYear'); if (y) y.value = '';
          toast('اطلاعات پاک شد');
        }
      });
    }
  }

  function calculateNatal() {
    const dayEl = $('#natalDay');
    const monthEl = $('#natalMonth');
    const yearEl = $('#natalYear');

    if (!dayEl || !monthEl || !yearEl) return;

    const jd = parseInt(dayEl.value, 10);
    const jm = parseInt(monthEl.value, 10);
    const jy = parseInt(yearEl.value, 10);

    if (!jd || !jm || !jy || jd < 1 || jd > 31 || jm < 1 || jm > 12 || jy < 1300 || jy > 1450) {
      toast('لطفاً تاریخ تولد را درست وارد کن');
      return;
    }

    const g = LumeraNatal.jalaliToGregorian(jy, jm, jd);
    const cards = LumeraNatal.calculateBirthCards(g.gy, g.gm, g.gd);

    const data = {
      jy, jm, jd,
      gy: g.gy, gm: g.gm, gd: g.gd,
      cards
    };
    LumeraNatal.saveBirthData(data);

    try {
      const elementInfo = LumeraNatal.getElementForSign(cards.sunSign.name);
      LumeraUser.setBirthDate({ jy, jm, jd }, cards.sunSign, elementInfo.element);

      if (typeof LumeraTheme !== 'undefined') {
        LumeraTheme.apply(elementInfo.element);
      }
      if (typeof LumeraBG !== 'undefined') {
        LumeraBG.apply(elementInfo.element);
      }
    } catch (_) {}

    renderNatalResult(data);
    toast('کارت زاد تو محاسبه شد ✦');
  }

  function renderNatalResult(data) {
    const form = $('#natalForm');
    const result = $('#natalResult');
    if (!form || !result) return;

    form.classList.add('hidden');
    result.classList.remove('hidden');

    const { cards, jy, jm, jd, gy, gm, gd } = data;

    const personalityCard = getCardByMajorNum(cards.personality);
    const soulCard = getCardByMajorNum(cards.soul);
    const yearCard = getCardByMajorNum(cards.year);

    if (!personalityCard || !soulCard || !yearCard) {
      result.innerHTML = '<div class="natal-section glass"><p>خطا در محاسبه‌ی کارت‌ها</p></div>';
      return;
    }

    const personalityElement = LumeraNatal.getElementForNumber(cards.personality);
    const soulElement = LumeraNatal.getElementForNumber(cards.soul);
    const yearElement = LumeraNatal.getElementForNumber(cards.year);

    const age = LumeraNatal.calculateAge(gy, gm, gd);
    const sunSign = cards.sunSign;

    const userElementInfo = LumeraNatal.getElementForSign(sunSign.name);
    const userElement = userElementInfo.element;
    const alignment = LumeraNatal.analyzeElementAlignment(userElement, [
      personalityElement, soulElement, yearElement
    ]);

    const jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

    let elementIconHTML = userElementInfo.emoji;
    if (typeof LumeraTheme !== 'undefined') {
      const svg = LumeraTheme.getIcon(userElement);
      if (svg) elementIconHTML = svg;
    }

    result.innerHTML = `
      <div class="natal-header glass">
        <div class="natal-sign">${sunSign.name} · ${sunSign.en}</div>
        <h2 class="natal-title">کارت‌های زاد تو</h2>
        <p class="natal-subtitle">
          این کارت‌ها بر اساس تاریخ تولد تو محاسبه شده‌اند و آینه‌ای از روح و مسیر زندگی‌ات هستند.
        </p>
      </div>

      <div class="natal-birth-info glass">
        <span>تاریخ تولد: <strong>${toPersianDigits(jd)} ${jalaliMonths[jm - 1]} ${toPersianDigits(jy)}</strong></span>
        <span class="natal-birth-sep">·</span>
        <span>سن: <strong>${toPersianDigits(age)}</strong> سال</span>
      </div>

      <div class="natal-element-box glass">
        <div class="natal-element-icon">${elementIconHTML}</div>
        <div class="natal-element-info">
          <div class="natal-element-label">عنصر وجودی تو</div>
          <div class="natal-element-value">${userElement}</div>
          <div class="natal-element-desc">
            از زودیاک <strong>${sunSign.name}</strong> — این عنصر، جوهرِ روحت و پایه‌ی وجود توست.
          </div>
        </div>
      </div>

      <div class="natal-cards">
        ${renderNatalCard('کارت شخصیت', 'Personality', personalityCard, personalityElement, 'چهره‌ای که به جهان نشان می‌دهی')}
        ${renderNatalCard('کارت روح', 'Soul', soulCard, soulElement, 'جوهر درونی و رسالت تو')}
        ${renderNatalCard('کارت امسال', 'Year', yearCard, yearElement, 'انرژی حاکم بر سال جاری')}
      </div>

      <div class="natal-alignment glass alignment-${alignment.alignment}">
        <div class="natal-alignment-badge">${alignment.headline}</div>
        <h3>✦ هم‌خوانی عناصر</h3>
        <p>
          <strong>عنصر وجودی تو:</strong> ${userElement} ${userElementInfo.emoji}
        </p>
        <p>
          <strong>عنصر کارت‌های زاد تو:</strong>
          شخصیت (${personalityElement}) · روح (${soulElement}) · سال (${yearElement})
        </p>
        <p>${alignment.description}</p>
      </div>

      <div class="natal-section glass">
        <h3>✦ کارت شخصیت تو</h3>
        <p>
          کارت شخصیت، چهره‌ای است که به جهان نشان می‌دهی. تو با انرژی <strong>${personalityCard.name}</strong> به دنیا آمده‌ای — این یعنی دیگران تو را با این کیفیت می‌بینند، حتی اگر خودت از آن آگاه نباشی.
        </p>
        <p>${personalityCard.upright.split('.').slice(0, 2).join('.') + '.'}</p>
      </div>

      <div class="natal-section glass">
        <h3>✦ کارت روح تو</h3>
        <p>
          کارت روح، جوهر درونی و رسالت زندگی توست. این کارت به تو می‌گوید که در عمق وجودت، به دنبال چه هستی. <strong>${soulCard.name}</strong> راهنمای مسیر تکامل توست.
        </p>
        <p>${soulCard.message}</p>
      </div>

      <div class="natal-section glass">
        <h3>✦ انرژی سال جاری</h3>
        <p>
          کارت امسال تو، <strong>${yearCard.name}</strong> است. این کارت انرژی غالب بر سال جاری زندگی‌ات را نشان می‌دهد. آگاهانه با این انرژی کار کن تا بهترین نتیجه را بگیری.
        </p>
        <p>${yearCard.message}</p>
      </div>
    `;

    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderNatalCard(type, typeEn, card, element, desc) {
    if (!card) return '';
    return `
      <div class="natal-card">
        <div class="natal-card-type">${typeEn}</div>
        <div class="natal-card-thumb">
          ${CardArt.faceSVG(card)}
        </div>
        <h3 class="natal-card-name">${card.name}</h3>
        <div class="natal-card-element">عنصر: <strong>${element}</strong></div>
        <p class="natal-card-desc">${desc}</p>
      </div>
    `;
  }

  function getCardByMajorNum(num) {
    if (typeof TarotEngine === 'undefined') return null;
    const id = 'major-' + String(num).padStart(2, '0');
    return TarotEngine.getCard(id);
  }

  /* ================= PROFILE ================= */
  function initializeProfile() {
    renderAvatarPicker();
    refreshProfile();
  }

  function refreshProfile() {
    const profile = LumeraUser.loadProfile();
    const stats = LumeraUser.computeStats();
    const achievements = LumeraAchievements.getAll();
    const unlockedCount = LumeraAchievements.getUnlockedCount();
    const totalCount = LumeraAchievements.getTotalCount();

    const nameEl = $('#profileName');
    if (nameEl) nameEl.textContent = profile.name || 'مهمان لومِرا';

    const metaEl = $('#profileMeta');
    if (metaEl) {
      const memberDays = Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24));
      if (stats.totalReadings > 0) {
        metaEl.innerHTML = `
          <strong>${toPersianDigits(stats.totalReadings)}</strong> فال تا امروز ·
          <strong>${toPersianDigits(stats.streak)}</strong> روز پیوسته ·
          <strong>${toPersianDigits(memberDays)}</strong> روز با لومِرا
        `;
      } else {
        metaEl.textContent = 'سفری تازه در انتظار توست';
      }
    }

    const avatarEl = $('#profileAvatar');
    if (avatarEl) {
      const av = LumeraAvatars.get(profile.avatarId);
      avatarEl.innerHTML = av.svg;
    }

    const statsCardsEl = $('#statsCards');
    if (statsCardsEl) {
      statsCardsEl.innerHTML = LumeraStats.renderStatCards(stats, unlockedCount, totalCount);
    }

    const donutEl = $('#donutChart');
    if (donutEl) {
      donutEl.innerHTML = LumeraStats.renderDonut(stats.suitCounts);
    }

    const topCardsEl = $('#topCards');
    if (topCardsEl) {
      const allCards = {};
      LumeraUser.getHistory().forEach(r => {
        r.cards.forEach(c => {
          if (!allCards[c.id]) {
            allCards[c.id] = { name: c.name, nameEn: c.nameEn };
          }
        });
      });
      topCardsEl.innerHTML = LumeraStats.renderTopCards(stats.topCards, allCards);
    }

    const activityEl = $('#activityHeatmap');
    if (activityEl) {
      activityEl.innerHTML = LumeraStats.renderActivity(LumeraUser.getHistory());
    }

    const achEl = $('#achievementsGrid');
    if (achEl) {
      achEl.innerHTML = LumeraStats.renderAchievements(achievements);
    }

    const achCount = $('#achievementCount');
    if (achCount) achCount.textContent = `${toPersianDigits(unlockedCount)}/${toPersianDigits(totalCount)}`;

    const historyEl = $('#historyList');
    if (historyEl) {
      const allCardsMap = {};
      LumeraUser.getHistory().forEach(r => {
        r.cards.forEach(c => {
          allCardsMap[c.id] = { name: c.name };
        });
      });
      historyEl.innerHTML = LumeraStats.renderHistory(LumeraUser.getHistory(), allCardsMap);
    }

    const historyCount = $('#historyCount');
    if (historyCount) historyCount.textContent = toPersianDigits(LumeraUser.getHistory().length);

    const themeSwitch = $('#themeSwitch');
    if (themeSwitch) {
      themeSwitch.classList.toggle('on', profile.theme === 'day');
      themeSwitch.setAttribute('aria-checked', profile.theme === 'day');
    }

    setTimeout(() => localizeNumbers(), 50);
  }

  function bindProfileEvents() {
    // ✅ Backup & Restore & Reset
    bindBackupEvents();

    // Avatar click
    const avatarWrap = $('#profileAvatarWrap');
    if (avatarWrap) {
      avatarWrap.addEventListener('click', () => openAvatarModal());
    }

    const avatarModal = $('#avatarModal');
    const avatarModalClose = $('#avatarModalClose');
    if (avatarModalClose) {
      avatarModalClose.addEventListener('click', () => avatarModal.classList.add('hidden'));
    }
    if (avatarModal) {
      avatarModal.addEventListener('click', e => {
        if (e.target === avatarModal) avatarModal.classList.add('hidden');
      });
    }

    const editBtn = $('#profileEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => openNameModal());
    }

    const nameModal = $('#nameModal');
    const nameModalClose = $('#nameModalClose');
    const nameSaveBtn = $('#nameSaveBtn');
    if (nameModalClose) {
      nameModalClose.addEventListener('click', () => nameModal.classList.add('hidden'));
    }
    if (nameModal) {
      nameModal.addEventListener('click', e => {
        if (e.target === nameModal) nameModal.classList.add('hidden');
      });
    }
    if (nameSaveBtn) {
      nameSaveBtn.addEventListener('click', saveName);
    }
    const nameInput = $('#nameInput');
    if (nameInput) {
      nameInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') saveName();
      });
    }

    const themeSwitch = $('#themeSwitch');
    if (themeSwitch) {
      themeSwitch.addEventListener('click', toggleTheme);
    }

    // ========== Background Animation Toggle ==========
    const bgAnimSwitch = $('#bgAnimSwitch');
    if (bgAnimSwitch) {
      // همگام‌سازی وضعیت اولیه
      const bgEnabled = window.LumeraBG && typeof window.LumeraBG.isEnabled === 'function'
        ? window.LumeraBG.isEnabled()
        : true;
      bgAnimSwitch.classList.toggle('on', bgEnabled);
      bgAnimSwitch.setAttribute('aria-checked', String(bgEnabled));

      // با کلیک، وضعیت رو toggle کن
      bgAnimSwitch.addEventListener('click', () => {
        if (window.LumeraBG && typeof window.LumeraBG.setEnabled === 'function') {
          const newState = !window.LumeraBG.isEnabled();
          window.LumeraBG.setEnabled(newState);
          bgAnimSwitch.classList.toggle('on', newState);
          bgAnimSwitch.setAttribute('aria-checked', String(newState));
        }
      });
    }

    const clearBtn = $('#clearHistoryBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('همه‌ی تاریخچه‌ی فال‌ها پاک شود؟')) {
          LumeraUser.clearHistory();
          refreshProfile();
          toast('تاریخچه پاک شد');
        }
      });
    }
  }

  /* ================= BACKUP & RESTORE ================= */
  function bindBackupEvents() {
    const backupBtn = $('#backupBtn');
    const restoreBtn = $('#restoreBtn');
    const backupModal = $('#backupModal');
    const backupModalClose = $('#backupModalClose');
    const backupModalSubmit = $('#backupModalSubmit');
    const backupModalTitle = $('#backupModalTitle');
    const backupModalDesc = $('#backupModalDesc');
    const backupPassword = $('#backupPassword');
    const backupPasswordConfirm = $('#backupPasswordConfirm');
    const backupModalError = $('#backupModalError');
    const restoreFileInput = $('#restoreFileInput');

    let backupMode = 'export';
    let selectedFile = null;

    function resetBackupModal() {
      if (backupPassword) backupPassword.value = '';
      if (backupPasswordConfirm) backupPasswordConfirm.value = '';
      if (backupModalError) {
        backupModalError.classList.add('hidden');
        backupModalError.textContent = '';
      }
      selectedFile = null;
    }

    function showBackupError(msg) {
      if (!backupModalError) return;
      backupModalError.textContent = msg;
      backupModalError.classList.remove('hidden');
    }

    // Open modal for EXPORT
    if (backupBtn && !backupBtn.dataset.bound) {
      backupBtn.dataset.bound = '1';
      backupBtn.addEventListener('click', () => {
        backupMode = 'export';
        resetBackupModal();

        if (backupModalTitle) backupModalTitle.textContent = 'پسورد بک‌آپ';
        if (backupModalDesc) {
          backupModalDesc.innerHTML = 'یه پسورد قوی (حداقل ۶ کاراکتر) انتخاب کن. با این پسورد، داده‌هات رمزگذاری می‌شن.';
        }
        if (backupPassword) backupPassword.placeholder = 'پسورد';
        if (backupPasswordConfirm) backupPasswordConfirm.style.display = '';
        if (backupModalSubmit) backupModalSubmit.textContent = 'دانلود بک‌آپ';

        backupModal.classList.remove('hidden');
        setTimeout(() => backupPassword?.focus(), 100);
      });
    }

    // Open file picker for IMPORT
    if (restoreBtn && !restoreBtn.dataset.bound) {
      restoreBtn.dataset.bound = '1';
      restoreBtn.addEventListener('click', () => {
        if (restoreFileInput) {
          restoreFileInput.value = '';
          restoreFileInput.click();
        }
      });
    }

    // File selected
    if (restoreFileInput && !restoreFileInput.dataset.bound) {
      restoreFileInput.dataset.bound = '1';
      restoreFileInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;

        selectedFile = file;
        backupMode = 'import';

        if (backupPassword) backupPassword.value = '';
        if (backupPasswordConfirm) backupPasswordConfirm.value = '';
        if (backupModalError) {
          backupModalError.classList.add('hidden');
          backupModalError.textContent = '';
        }

        if (backupModalTitle) backupModalTitle.textContent = 'پسورد بک‌آپ';
        if (backupModalDesc) {
          backupModalDesc.innerHTML = 'پسوردی که هنگام بک‌آپ گرفتن وارد کردی رو بنویس.';
        }
        if (backupPassword) backupPassword.placeholder = 'پسورد';
        if (backupPasswordConfirm) backupPasswordConfirm.style.display = 'none';
        if (backupModalSubmit) backupModalSubmit.textContent = 'بازیابی داده‌ها';

        backupModal.classList.remove('hidden');
        setTimeout(() => backupPassword?.focus(), 100);
      });
    }

    // Close modal
    if (backupModalClose && !backupModalClose.dataset.bound) {
      backupModalClose.dataset.bound = '1';
      backupModalClose.addEventListener('click', () => {
        backupModal.classList.add('hidden');
        resetBackupModal();
      });
    }
    if (backupModal && !backupModal.dataset.bound) {
      backupModal.dataset.bound = '1';
      backupModal.addEventListener('click', e => {
        if (e.target === backupModal) {
          backupModal.classList.add('hidden');
          resetBackupModal();
        }
      });
    }

    // Submit modal
    if (backupModalSubmit && !backupModalSubmit.dataset.bound) {
      backupModalSubmit.dataset.bound = '1';
      backupModalSubmit.addEventListener('click', async () => {
        const password = (backupPassword?.value || '').trim();

        if (!password || password.length < 6) {
          showBackupError('پسورد باید حداقل ۶ کاراکتر باشه');
          return;
        }

        if (backupMode === 'export') {
          const confirmPassword = (backupPasswordConfirm?.value || '').trim();
          if (password !== confirmPassword) {
            showBackupError('پسورد و تکرارش یکسان نیستن');
            return;
          }

          try {
            backupModalSubmit.disabled = true;
            backupModalSubmit.textContent = 'در حال ساخت...';

            await LumeraBackup.exportBackup(password);

            toast('✅ بک‌آپ با موفقیت دانلود شد');
            backupModal.classList.add('hidden');
            resetBackupModal();
          } catch (err) {
            console.error(err);
            showBackupError(err.message || 'خطا در ساخت بک‌آپ');
          } finally {
            backupModalSubmit.disabled = false;
            backupModalSubmit.textContent = 'دانلود بک‌آپ';
          }
        } else if (backupMode === 'import') {
          if (!selectedFile) {
            showBackupError('فایلی انتخاب نشده');
            return;
          }

          try {
            backupModalSubmit.disabled = true;
            backupModalSubmit.textContent = 'در حال بازیابی...';

            await LumeraBackup.importBackup(selectedFile, password);

            toast('✅ داده‌ها با موفقیت بازیابی شد');
            setTimeout(() => location.reload(), 1500);
          } catch (err) {
            console.error(err);
            showBackupError(err.message || 'خطا در بازیابی');
            backupModalSubmit.disabled = false;
            backupModalSubmit.textContent = 'بازیابی داده‌ها';
          }
        }
      });
    }

    // ============ RESET MODAL ============
    const resetBtn = $('#resetAllBtn');
    const resetModal = $('#resetModal');
    const resetModalClose = $('#resetModalClose');
    const resetConfirmInput = $('#resetConfirmInput');
    const resetModalSubmit = $('#resetModalSubmit');
    const resetModalError = $('#resetModalError');

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = '1';
      resetBtn.addEventListener('click', () => {
        if (resetConfirmInput) resetConfirmInput.value = '';
        if (resetModalSubmit) resetModalSubmit.disabled = true;
        if (resetModalError) {
          resetModalError.classList.add('hidden');
          resetModalError.textContent = '';
        }
        resetModal?.classList.remove('hidden');
        setTimeout(() => resetConfirmInput?.focus(), 100);
      });
    }

    if (resetModalClose && !resetModalClose.dataset.bound) {
      resetModalClose.dataset.bound = '1';
      resetModalClose.addEventListener('click', () => {
        resetModal.classList.add('hidden');
      });
    }
    if (resetModal && !resetModal.dataset.bound) {
      resetModal.dataset.bound = '1';
      resetModal.addEventListener('click', e => {
        if (e.target === resetModal) resetModal.classList.add('hidden');
      });
    }

    if (resetConfirmInput && !resetConfirmInput.dataset.bound) {
      resetConfirmInput.dataset.bound = '1';
      resetConfirmInput.addEventListener('input', () => {
        const value = resetConfirmInput.value.trim();
        if (resetModalSubmit) {
          resetModalSubmit.disabled = value !== 'پاک کن';
        }
      });
    }

    if (resetModalSubmit && !resetModalSubmit.dataset.bound) {
      resetModalSubmit.dataset.bound = '1';
      resetModalSubmit.addEventListener('click', () => {
        const value = resetConfirmInput?.value.trim();
        if (value !== 'پاک کن') {
          if (resetModalError) {
            resetModalError.textContent = 'عبارت تأیید اشتباه است';
            resetModalError.classList.remove('hidden');
          }
          return;
        }

        LumeraBackup.deleteAllData();
        toast('🗑 همه‌ی داده‌ها پاک شد');
        setTimeout(() => location.reload(), 1000);
      });
    }
  }

  function openAvatarModal() {
    const modal = $('#avatarModal');
    if (!modal) return;
    renderAvatarPicker();
    modal.classList.remove('hidden');
  }

  function renderAvatarPicker() {
    const grid = $('#avatarGrid');
    if (!grid) return;
    const profile = LumeraUser.loadProfile();
    const avatars = LumeraAvatars.list();

    grid.innerHTML = avatars.map(a => `
      <button class="avatar-option ${a.id === profile.avatarId ? 'selected' : ''}"
              data-avatar="${a.id}"
              title="${a.name}"
              aria-label="${a.name}">
        ${a.svg}
      </button>
    `).join('');

    grid.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.avatar;
        LumeraUser.updateProfile({ avatarId: id });
        $('#avatarModal').classList.add('hidden');
        refreshProfile();
        toast('آواتار ذخیره شد ✦');
      });
    });
  }

  function openNameModal() {
    const modal = $('#nameModal');
    const input = $('#nameInput');
    if (!modal || !input) return;
    const profile = LumeraUser.loadProfile();
    input.value = profile.name || '';
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
  }

  function saveName() {
    const input = $('#nameInput');
    if (!input) return;
    const name = input.value.trim().slice(0, 30);
    LumeraUser.updateProfile({ name });
    $('#nameModal').classList.add('hidden');
    refreshProfile();
    toast('نام ذخیره شد ✦');
  }

  /* ================= THEME ================= */
  function toggleTheme() {
    const profile = LumeraUser.loadProfile();
    const newTheme = profile.theme === 'day' ? 'night' : 'day';
    LumeraUser.updateProfile({ theme: newTheme });
    applyTheme(newTheme);
    refreshProfile();
  }

  function applyTheme(theme) {
    document.body.classList.toggle('theme-day', theme === 'day');
  }

  /* ================= ACHIEVEMENTS ================= */
  function checkAchievements() {
    const newlyUnlocked = LumeraAchievements.checkAll();
    newlyUnlocked.forEach((a, i) => {
      setTimeout(() => toast(`🏆 دستاورد جدید: ${a.name} ${a.icon}`), 1500 + i * 1200);
    });
  }

  /* ================= WELCOME OVERLAY ================= */
  function showWelcomeOverlay(userName) {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
      <div class="welcome-content">
        <div class="welcome-icon">✦</div>
        <h1 class="welcome-title">${userName} عزیز</h1>
        <p class="welcome-sub">به لومِرا خوش آمدی</p>
        <p class="welcome-desc">سفرت در دنیای تاروت آغاز شد</p>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 800);
    }, 3500);

    overlay.addEventListener('click', () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 800);
    });
  }

  /* ================= SHARE AS STORY ================= */
  async function shareTarotStory() {
    if (!currentDraw) return;
    const canvas = $('#storyCanvas');
    const ctx = canvas.getContext('2d');

    drawStoryBackground(ctx, canvas);

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
        try { await navigator.share(shareData); return; } catch (_) {}
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

  function toPersianDigits(input) {
    if (input === null || input === undefined) return '';
    const map = {
      '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
      '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    };
    return String(input).replace(/[0-9]/g, d => map[d]);
  }

  function localizeNumbers(root) {
    const el = root || document;
    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      if (/[0-9]/.test(node.nodeValue)) {
        node.nodeValue = toPersianDigits(node.nodeValue);
      }
    }
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
        navigator.serviceWorker.register('sw.js?v=29').catch(err => console.warn('SW', err));
      });
    }
  }

  /* ================= START ================= */
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    const hash = location.hash.replace('#', '');
    if (hash === 'profile') switchTab('profile');
    else if (hash === 'natal') switchTab('natal');
    else if (hash === 'tarot') switchTab('tarot');

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              setTimeout(() => localizeNumbers(node), 10);
            }
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();