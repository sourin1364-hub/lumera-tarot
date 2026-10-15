/* =========================================================
   LUMERA · USER PROFILE
   Manages user identity, history and preferences
   using localStorage.
   ========================================================= */
window.LumeraUser = (() => {
  'use strict';

  const STORAGE_KEY = 'lumera-user-v1';
  const HISTORY_KEY = 'lumera-history-v1';
  const MAX_HISTORY = 50;

  const DEFAULT_PROFILE = {
    name: '',
    avatarId: 'sun',
    createdAt: Date.now(),
    theme: 'night',
    totalReadings: 0,
    totalCards: 0,
    lastVisit: Date.now(),
    onboardingDone: false,
    birthDate: null,
    sunSign: null,
    element: null
  };

  /* ================= PROFILE ================= */
  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch (_) {
      return { ...DEFAULT_PROFILE };
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (_) {}
  }

  function updateProfile(patch) {
    const p = { ...loadProfile(), ...patch };
    saveProfile(p);
    return p;
  }

  function isFirstTime() {
    return !localStorage.getItem(STORAGE_KEY);
  }

  function completeOnboarding() {
    return updateProfile({ onboardingDone: true });
  }

  function isOnboardingDone() {
    return loadProfile().onboardingDone === true;
  }

  function setBirthDate(birthData, sunSign, element) {
    return updateProfile({
      birthDate: birthData,
      sunSign,
      element
    });
  }

  /* ================= HISTORY ================= */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(arr) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function addReading(payload) {
    const history = loadHistory();
    const entry = {
      id: 'r-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      date: Date.now(),
      spread: payload.spread,
      intention: payload.intention || '',
      cards: payload.cards.map(c => ({
        id: c.card.id,
        name: c.card.name,
        nameEn: c.card.nameEn,
        suit: c.card.suit,
        arcana: c.card.arcana,
        num: c.card.num,
        reversed: c.reversed,
        position: c.position
      })),
      narrative: payload.narrative || ''
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    saveHistory(history);

    const profile = loadProfile();
    profile.totalReadings = (profile.totalReadings || 0) + 1;
    profile.totalCards = (profile.totalCards || 0) + entry.cards.length;
    profile.lastVisit = Date.now();
    saveProfile(profile);

    return entry;
  }

  function getHistory() {
    return loadHistory();
  }

  function getReading(id) {
    return loadHistory().find(r => r.id === id);
  }

  function clearHistory() {
    saveHistory([]);
  }

  function deleteReading(id) {
    const history = loadHistory().filter(r => r.id !== id);
    saveHistory(history);
  }

  /* ================= STATS ================= */
  function computeStats() {
    const history = loadHistory();
    if (history.length === 0) {
      return {
        totalReadings: 0,
        totalCards: 0,
        suitCounts: { cups: 0, swords: 0, wands: 0, pentacles: 0, major: 0 },
        topCards: [],
        reversedRatio: 0,
        streak: 0,
        firstReading: null,
        lastReading: null
      };
    }

    const suitCounts = { cups: 0, swords: 0, wands: 0, pentacles: 0, major: 0 };
    const cardCounts = {};
    let reversedCount = 0;
    let totalCards = 0;

    history.forEach(r => {
      r.cards.forEach(c => {
        totalCards++;
        if (c.reversed) reversedCount++;
        const key = c.arcana === 'major' ? 'major' : c.suit;
        suitCounts[key] = (suitCounts[key] || 0) + 1;
        cardCounts[c.id] = (cardCounts[c.id] || 0) + 1;
      });
    });

    const topCards = Object.entries(cardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    const dayKeys = new Set(
      history.map(r => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    let streak = 0;
    let cursor = new Date();
    let firstPass = true;
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (dayKeys.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (firstPass) {
        firstPass = false;
        cursor.setDate(cursor.getDate() - 1);
        const keyY = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!dayKeys.has(keyY)) break;
      } else {
        break;
      }
    }

    return {
      totalReadings: history.length,
      totalCards,
      suitCounts,
      topCards,
      reversedRatio: totalCards ? reversedCount / totalCards : 0,
      streak,
      firstReading: history[history.length - 1],
      lastReading: history[0]
    };
  }

  return {
    loadProfile,
    saveProfile,
    updateProfile,
    isFirstTime,
    completeOnboarding,
    isOnboardingDone,
    setBirthDate,
    addReading,
    getHistory,
    getReading,
    deleteReading,
    clearHistory,
    computeStats
  };
})();