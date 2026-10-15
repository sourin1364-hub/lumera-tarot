/* =========================================================
   LUMERA · ONBOARDING
   Welcome flow, privacy notice, identity + birth date.
   Saves birth data to natal.js + user.js and applies theme.
   ========================================================= */
window.LumeraOnboarding = (() => {
  'use strict';

  const ONBOARDING_KEY = 'lumera-onboarding-done-v1';
  let currentStep = 0;

  /* ================= STATE ================= */
  function isDone() {
    return localStorage.getItem(ONBOARDING_KEY) === 'yes';
  }

  function markDone() {
    localStorage.setItem(ONBOARDING_KEY, 'yes');
  }

  function reset() {
    localStorage.removeItem(ONBOARDING_KEY);
  }

  /* ================= STEP CONTENT ================= */
  const STEPS = [
    {
      id: 'welcome',
      icon: '✦',
      title: 'به لومِرا خوش آمدی',
      subtitle: 'سفری به درون خودت، در انتظار توست.',
      body: `
        <p>لومِرا، آیینه‌ای برای شناخت روح توست.</p>
        <p>بر اساس <strong>نام</strong>، <strong>تاریخ تولد</strong> و <strong>آواتارت</strong>،
        تجربه‌ای کاملاً شخصی برایت خواهیم ساخت.</p>
        <p>در این سفر، تاروت، فال زاد و کارت روزانه با تو هم‌آوا می‌شوند.</p>
      `,
      cta: 'شروع سفر'
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: 'حریم خصوصی تو، مقدس است',
      subtitle: 'اطلاعاتت فقط برای تو می‌ماند.',
      body: `
        <div class="onb-privacy-list">
          <div class="onb-privacy-item">
            <span class="onb-privacy-icon">📱</span>
            <div>
              <strong>ذخیره‌ی محلی</strong>
              <p>همه‌ی اطلاعات تو فقط روی همین دستگاه ذخیره می‌شود.</p>
            </div>
          </div>
          <div class="onb-privacy-item">
            <span class="onb-privacy-icon">🚫</span>
            <div>
              <strong>بدون سرور</strong>
              <p>هیچ اطلاعاتی به هیچ سروری ارسال نمی‌شود.</p>
            </div>
          </div>
          <div class="onb-privacy-item">
            <span class="onb-privacy-icon">🙅</span>
            <div>
              <strong>بدون ایمیل یا شماره</strong>
              <p>برای استفاده از لومِرا، به جیمیل یا شماره تلفن نیازی نداری.</p>
            </div>
          </div>
        </div>

        <div class="onb-warning">
          <div class="onb-warning-icon">⚠️</div>
          <div>
            <strong>هشدار مهم</strong>
            <p>اگر اپلیکیشن را حذف کنی یا داده‌های مرورگر را پاک کنی،
            تمام اطلاعاتت (پروفایل، تاریخچه، دستاوردها) از بین خواهد رفت.</p>
          </div>
        </div>

        <div class="onb-backup-tip">
          <div class="onb-backup-icon">💾</div>
          <div>
            <strong>نگران نباش!</strong>
            <p>هر زمان می‌توانی از داده‌هایت بک‌آپ بگیری و در دستگاه دیگری بازگردانی.
            این امکان در بخش «پروفایل» فعال است.</p>
          </div>
        </div>
      `,
      cta: 'متوجه شدم، ادامه'
    },
    {
      id: 'identity',
      icon: '👤',
      title: 'خودت را معرفی کن',
      subtitle: 'اسمت را بنویس و آواتارت را انتخاب کن.',
      body: `
        <div class="onb-field">
          <label for="onbName">نام تو</label>
          <input type="text" id="onbName" maxlength="30" placeholder="مثلاً: ملکه‌ی نور" />
        </div>
        <div class="onb-field">
          <label>آواتار تو</label>
          <div class="onb-avatar-grid" id="onbAvatarGrid"></div>
        </div>
      `,
      cta: 'بعدی'
    },
    {
      id: 'birth',
      icon: '🎂',
      title: 'تاریخ تولدت را وارد کن',
      subtitle: 'تا لومِرا خودش را با تو هماهنگ کند.',
      body: `
        <div class="onb-birth-benefits">
          <div class="onb-benefit">
            <span>🌊</span>
            <span>عنصر وجودی تو</span>
          </div>
          <div class="onb-benefit">
            <span>⭐</span>
            <span>زودیاک تو</span>
          </div>
          <div class="onb-benefit">
            <span>🎴</span>
            <span>کارت زاد تو</span>
          </div>
          <div class="onb-benefit">
            <span>🎨</span>
            <span>تم شخصی تو</span>
          </div>
        </div>

        <div class="onb-birth-inputs">
          <div class="onb-field">
            <label for="onbDay">روز</label>
            <input type="number" id="onbDay" min="1" max="31" placeholder="۱۵" />
          </div>
          <div class="onb-field">
            <label for="onbMonth">ماه</label>
            <input type="number" id="onbMonth" min="1" max="12" placeholder="۶" />
          </div>
          <div class="onb-field">
            <label for="onbYear">سال</label>
            <input type="number" id="onbYear" min="1300" max="1450" placeholder="۱۳۷۰" />
          </div>
        </div>

        <div class="onb-birth-preview" id="onbBirthPreview"></div>
      `,
      cta: 'ورود به لومِرا ✨'
    }
  ];

  /* ================= RENDER ================= */
  let overlay = null;
  let onComplete = null;

  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  function mount(container) {
    overlay = document.createElement('div');
    overlay.className = 'onb-overlay';
    overlay.id = 'onboardingOverlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 99999 !important;
    `;
    overlay.innerHTML = `
      <div class="onb-bg">
        <div class="onb-stars"></div>
        <div class="onb-aurora"></div>
      </div>
      <div class="onb-stage">
        <div class="onb-progress" id="onbProgress"></div>
        <div class="onb-card glass" id="onbCard"></div>
      </div>
    `;
    (container || document.body).appendChild(overlay);
    lockScroll();
  }

  function render() {
    const step = STEPS[currentStep];
    if (!step) return;

    const progress = document.getElementById('onbProgress');
    if (progress) {
      progress.innerHTML = STEPS.map((_, i) => `
        <span class="onb-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}"></span>
      `).join('');
    }

    const card = document.getElementById('onbCard');
    if (!card) return;

    card.innerHTML = `
      <div class="onb-icon">${step.icon}</div>
      <h1 class="onb-title">${step.title}</h1>
      <p class="onb-subtitle">${step.subtitle}</p>
      <div class="onb-body">
        ${step.body}
      </div>
      <div class="onb-actions">
        <button class="onb-cta" id="onbNextBtn">${step.cta}</button>
      </div>
    `;

    if (step.id === 'identity') setupIdentityStep();
    if (step.id === 'birth') setupBirthStep();

    const nextBtn = document.getElementById('onbNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', next);
    }
  }

  /* ================= IDENTITY STEP ================= */
  function setupIdentityStep() {
    const grid = document.getElementById('onbAvatarGrid');
    if (!grid || typeof LumeraAvatars === 'undefined') return;

    const profile = LumeraUser.loadProfile();
    const avatars = LumeraAvatars.list();

    grid.innerHTML = avatars.map(a => `
      <button type="button" class="onb-avatar-option ${a.id === profile.avatarId ? 'selected' : ''}"
              data-avatar="${a.id}" title="${a.name}">
        ${a.svg}
      </button>
    `).join('');

    grid.querySelectorAll('.onb-avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.onb-avatar-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    const nameInput = document.getElementById('onbName');
    if (nameInput) {
      nameInput.value = profile.name || '';
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  /* ================= BIRTH STEP ================= */
  function setupBirthStep() {
    const d = document.getElementById('onbDay');
    const m = document.getElementById('onbMonth');
    const y = document.getElementById('onbYear');
    const preview = document.getElementById('onbBirthPreview');

    [d, m, y].forEach(el => {
      if (el) el.addEventListener('input', updateBirthPreview);
    });

    function updateBirthPreview() {
      if (!preview) return;
      const jd = parseInt(d.value, 10);
      const jm = parseInt(m.value, 10);
      const jy = parseInt(y.value, 10);

      if (!jd || !jm || !jy || jd < 1 || jd > 31 || jm < 1 || jm > 12 || jy < 1300 || jy > 1450) {
        preview.innerHTML = '';
        return;
      }

      try {
        const g = LumeraNatal.jalaliToGregorian(jy, jm, jd);
        const cards = LumeraNatal.calculateBirthCards(g.gy, g.gm, g.gd);
        const sign = cards.sunSign;
        const elementInfo = LumeraNatal.getElementForSign(sign.name);

        preview.innerHTML = `
          <div class="onb-preview-inner">
            <div class="onb-preview-row">
              <span class="onb-preview-label">زودیاک تو</span>
              <span class="onb-preview-value">${sign.name} · ${sign.en}</span>
            </div>
            <div class="onb-preview-row">
              <span class="onb-preview-label">عنصر وجودی</span>
              <span class="onb-preview-value">${elementInfo.emoji} ${elementInfo.element}</span>
            </div>
            <div class="onb-preview-row">
              <span class="onb-preview-label">کارت زاد</span>
              <span class="onb-preview-value">${getCardName(cards.personality)}</span>
            </div>
          </div>
        `;
      } catch (e) {
        preview.innerHTML = '';
      }
    }
  }

  function getCardName(num) {
    if (typeof TarotEngine === 'undefined') return '—';
    const id = 'major-' + String(num).padStart(2, '0');
    const card = TarotEngine.getCard(id);
    return card ? card.name : '—';
  }

  /* ================= NAVIGATION ================= */
  function next() {
    const step = STEPS[currentStep];
    if (!step) return;

    if (step.id === 'identity') {
      const nameInput = document.getElementById('onbName');
      const selectedAvatar = document.querySelector('.onb-avatar-option.selected');
      const name = (nameInput?.value || '').trim();

      if (!name) {
        toastOnb('لطفاً نامت را بنویس');
        nameInput?.focus();
        return;
      }
      if (!selectedAvatar) {
        toastOnb('لطفاً یک آواتار انتخاب کن');
        return;
      }

      LumeraUser.updateProfile({
        name: name.slice(0, 30),
        avatarId: selectedAvatar.dataset.avatar
      });
    }

    if (step.id === 'birth') {
      const d = document.getElementById('onbDay');
      const m = document.getElementById('onbMonth');
      const y = document.getElementById('onbYear');
      const jd = parseInt(d?.value, 10);
      const jm = parseInt(m?.value, 10);
      const jy = parseInt(y?.value, 10);

      if (!jd || !jm || !jy || jd < 1 || jd > 31 || jm < 1 || jm > 12 || jy < 1300 || jy > 1450) {
        toastOnb('لطفاً تاریخ تولد را درست وارد کن');
        return;
      }

      try {
        const g = LumeraNatal.jalaliToGregorian(jy, jm, jd);
        const cards = LumeraNatal.calculateBirthCards(g.gy, g.gm, g.gd);

        // ✅ 1. Save to natal.js
        LumeraNatal.saveBirthData({
          jy: jy, jm: jm, jd: jd,
          gy: g.gy, gm: g.gm, gd: g.gd,
          cards: cards
        });

        // ✅ 2. Save to user profile
        const elementInfo = LumeraNatal.getElementForSign(cards.sunSign.name);
        LumeraUser.setBirthDate(
          { jy: jy, jm: jm, jd: jd },
          cards.sunSign,
          elementInfo.element
        );

        // ✅ 3. Apply elemental theme
        if (typeof LumeraTheme !== 'undefined') {
          LumeraTheme.apply(elementInfo.element);
        }

        // ✅ 4. Apply background animation
        if (typeof LumeraBG !== 'undefined') {
          LumeraBG.apply(elementInfo.element);
        }

        // ✅ 5. Mark onboarding done
        LumeraUser.completeOnboarding();
      } catch (e) {
        console.error(e);
        toastOnb('خطا در محاسبه‌ی تاریخ تولد');
        return;
      }
    }

    currentStep++;
    if (currentStep >= STEPS.length) {
      finish();
      return;
    }
    render();
  }

  function finish() {
    markDone();
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        overlay = null;
        unlockScroll();
        if (typeof onComplete === 'function') onComplete();
      }, 600);
    }
  }

  /* ================= TOAST ================= */
  function toastOnb(msg) {
    const t = document.createElement('div');
    t.className = 'onb-toast';
    t.textContent = msg;
    overlay?.appendChild(t);
    setTimeout(() => t.classList.add('show'), 50);
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 2400);
  }

  /* ================= PUBLIC API ================= */
  function start(opts) {
    opts = opts || {};
    onComplete = opts.onComplete;
    currentStep = 0;

    if (!overlay) mount(opts.container);
    render();
  }

  return {
    isDone: isDone,
    markDone: markDone,
    reset: reset,
    start: start
  };
})();