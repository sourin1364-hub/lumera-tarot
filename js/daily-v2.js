/* =========================================================
   LUMERA · DAILY CARD v2
   Personalized daily card (unique per user),
   with reminders and streak tracking.
   ========================================================= */
window.LumeraDaily = (() => {
  'use strict';

  const STORAGE_KEY = 'lumera-daily-v1';
  const NOTIFICATION_KEY = 'lumera-daily-notify-v1';

  /* ================= HELPERS ================= */
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function dateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getUserSeed() {
    try {
      const profile = LumeraUser.loadProfile();

      if (profile.birthDate) {
        const bd = profile.birthDate;
        const jy = bd.jy;
        const jm = bd.jm;
        const jd = bd.jd;
        return 'birth-' + jy + '-' + jm + '-' + jd;
      }

      const name = profile.name || '';
      const avatar = profile.avatarId || 'sun';
      const created = profile.createdAt || 0;
      return 'profile-' + name + '-' + avatar + '-' + created;
    } catch (_) {
      return 'guest-' + (localStorage.getItem('lumera-first-visit') || 'anon');
    }
  }

  /* ================= DAILY CARD PICK ================= */
  function pickTodayCard(cards) {
    if (!cards || cards.length === 0) return null;

    const seed = getUserSeed();
    const combined = seed + '::' + todayKey();

    const hash = dateHash(combined);
    const idx = hash % cards.length;
    const card = cards[idx];

    const revHash = dateHash(combined + '::rev');
    const reversed = (revHash % 100) < 38;

    return { card: card, reversed: reversed };
  }

  /* ================= STATE ================= */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { lastOpenDate: null, currentStreak: 0, longestStreak: 0, totalOpens: 0 };
      return JSON.parse(raw);
    } catch (_) {
      return { lastOpenDate: null, currentStreak: 0, longestStreak: 0, totalOpens: 0 };
    }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function markTodayOpened() {
    const state = loadState();
    const today = todayKey();

    if (state.lastOpenDate === today) return state;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();

    if (state.lastOpenDate === yKey) {
      state.currentStreak = (state.currentStreak || 0) + 1;
    } else {
      state.currentStreak = 1;
    }

    state.lastOpenDate = today;
    state.totalOpens = (state.totalOpens || 0) + 1;
    state.longestStreak = Math.max(state.longestStreak || 0, state.currentStreak);

    saveState(state);
    return state;
  }

  function isTodayOpened() {
    return loadState().lastOpenDate === todayKey();
  }

  function getStreak() {
    const state = loadState();
    const today = todayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();

    if (state.lastOpenDate === today) return state.currentStreak;
    if (state.lastOpenDate === yKey) return state.currentStreak;
    return 0;
  }

  /* ================= NOTIFICATIONS ================= */
  function isNotificationEnabled() {
    return localStorage.getItem(NOTIFICATION_KEY) === 'on';
  }

  async function enableNotification() {
    if (!('Notification' in window)) {
      return { ok: false, reason: 'unsupported' };
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    localStorage.setItem(NOTIFICATION_KEY, 'on');
    return { ok: true };
  }

  function disableNotification() {
    localStorage.setItem(NOTIFICATION_KEY, 'off');
  }

  function showTodayNotification(cardName) {
    if (!isNotificationEnabled()) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification('✦ کارت امروز لومِرا', {
        body: 'کارت امروز تو: ' + cardName + '. برای دیدن تعبیر کامل، لومِرا را باز کن.',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: 'lumera-daily'
      });
    } catch (_) {}
  }

  return {
    pickTodayCard: pickTodayCard,
    markTodayOpened: markTodayOpened,
    isTodayOpened: isTodayOpened,
    getStreak: getStreak,
    isNotificationEnabled: isNotificationEnabled,
    enableNotification: enableNotification,
    disableNotification: disableNotification,
    showTodayNotification: showTodayNotification,
    loadState: loadState,
    getUserSeed: getUserSeed
  };
})();