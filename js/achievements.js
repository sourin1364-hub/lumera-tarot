/* =========================================================
   LUMERA · ACHIEVEMENTS
   15 unlockable achievements based on user activity.
   ========================================================= */
window.LumeraAchievements = (() => {
  'use strict';

  const STORAGE_KEY = 'lumera-achievements-v1';

  /* ================= DEFINITIONS ================= */
  const DEFINITIONS = [
    {
      id: 'first-step',
      name: 'نخستین گام',
      desc: 'اولین فال خود را گرفتی',
      icon: '🌱',
      check: (ctx) => ctx.stats.totalReadings >= 1
    },
    {
      id: 'explorer',
      name: 'کاوش‌گر',
      desc: '۱۰ فال گرفته‌ای',
      icon: '🔍',
      check: (ctx) => ctx.stats.totalReadings >= 10
    },
    {
      id: 'tarotist',
      name: 'تاروت‌شناس',
      desc: '۵۰ فال گرفته‌ای',
      icon: '📚',
      check: (ctx) => ctx.stats.totalReadings >= 50
    },
    {
      id: 'tarot-master',
      name: 'استاد تاروت',
      desc: '۱۰۰ فال گرفته‌ای',
      icon: '🎓',
      check: (ctx) => ctx.stats.totalReadings >= 100
    },
    {
      id: 'daily-bond',
      name: 'پیوند روزانه',
      desc: '۳ روز پشت‌سرهم فال گرفته‌ای',
      icon: '🔥',
      check: (ctx) => ctx.stats.streak >= 3
    },
    {
      id: 'holy-week',
      name: 'هفته‌ی مقدس',
      desc: '۷ روز پشت‌سرهم فال گرفته‌ای',
      icon: '✨',
      check: (ctx) => ctx.stats.streak >= 7
    },
    {
      id: 'full-moon',
      name: 'ماه کامل',
      desc: '۳۰ روز پشت‌سرهم فال گرفته‌ای',
      icon: '🌕',
      check: (ctx) => ctx.stats.streak >= 30
    },
    {
      id: 'lover',
      name: 'عاشق',
      desc: '۱۰ فال عشق گرفته‌ای',
      icon: '❤',
      check: (ctx) => ctx.spreadCounts.love >= 10
    },
    {
      id: 'time-traveler',
      name: 'مسافر زمان',
      desc: '۱۰ فال گذشته-حال-آینده گرفته‌ای',
      icon: '⧗',
      check: (ctx) => ctx.spreadCounts.pph >= 10
    },
    {
      id: 'crossroad',
      name: 'در دوراهی',
      desc: '۱۰ فال دوراهی گرفته‌ای',
      icon: '⇄',
      check: (ctx) => ctx.spreadCounts.crossroad >= 10
    },
    {
      id: 'elements',
      name: 'چهار عنصر',
      desc: '۱۰ فال چهار عنصر گرفته‌ای',
      icon: '✦',
      check: (ctx) => ctx.spreadCounts.elements >= 10
    },
    {
      id: 'questioner',
      name: 'پرسش‌گر',
      desc: '۱۰ فال بله/خیر گرفته‌ای',
      icon: '؟',
      check: (ctx) => ctx.spreadCounts.yesno >= 10
    },
    {
      id: 'arcana-explorer',
      name: 'کاوش‌گر آرکانا',
      desc: 'همه‌ی ۲۲ کارت بزرگ را دیده‌ای',
      icon: '🌟',
      check: (ctx) => {
        const seenMajors = new Set();
        ctx.history.forEach(r => {
          r.cards.forEach(c => {
            if (c.arcana === 'major') seenMajors.add(c.id);
          });
        });
        return seenMajors.size >= 22;
      }
    },
    {
      id: 'thinker',
      name: 'متفکر',
      desc: 'در ۲۰ فال نیت نوشته‌ای',
      icon: '💭',
      check: (ctx) => {
        const withIntention = ctx.history.filter(r => r.intention && r.intention.length > 0);
        return withIntention.length >= 20;
      }
    },
    {
      id: 'home-return',
      name: 'بازگشت به خانه',
      desc: '۳۰ روز از عضویت تو گذشته',
      icon: '🏠',
      check: (ctx) => {
        const daysSince = (Date.now() - ctx.profile.createdAt) / (1000 * 60 * 60 * 24);
        return daysSince >= 30;
      }
    }
  ];

  /* ================= STATE ================= */
  function loadUnlocked() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (_) {
      return {};
    }
  }

  function saveUnlocked(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  /* ================= CORE ================= */
  function getContext() {
    const stats = LumeraUser.computeStats();
    const profile = LumeraUser.loadProfile();
    const history = LumeraUser.getHistory();

    const spreadCounts = {};
    history.forEach(r => {
      spreadCounts[r.spread] = (spreadCounts[r.spread] || 0) + 1;
    });

    return { stats, profile, history, spreadCounts };
  }

  /**
   * Check all achievements and unlock any newly earned ones.
   * @returns {Array} newly unlocked achievement definitions
   */
  function checkAll() {
    const unlocked = loadUnlocked();
    const ctx = getContext();
    const newlyUnlocked = [];

    DEFINITIONS.forEach(def => {
      if (unlocked[def.id]) return; // already unlocked
      let earned = false;
      try {
        earned = def.check(ctx);
      } catch (_) {
        earned = false;
      }
      if (earned) {
        unlocked[def.id] = Date.now();
        newlyUnlocked.push(def);
      }
    });

    if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
    return newlyUnlocked;
  }

  /**
   * Get all achievements with their lock status.
   */
  function getAll() {
    const unlocked = loadUnlocked();
    return DEFINITIONS.map(def => ({
      ...def,
      unlocked: !!unlocked[def.id],
      unlockedAt: unlocked[def.id] || null
    }));
  }

  function getUnlockedCount() {
    return Object.keys(loadUnlocked()).length;
  }

  function getTotalCount() {
    return DEFINITIONS.length;
  }

  function reset() {
    saveUnlocked({});
  }

  return {
    checkAll,
    getAll,
    getUnlockedCount,
    getTotalCount,
    reset
  };
})();