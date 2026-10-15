/* =========================================================
   LUMERA · NATAL TAROT (فال زاد)
   Birth card calculation based on numerology.
   Includes element detection + alignment analysis.
   ========================================================= */
window.LumeraNatal = (() => {
  'use strict';

  const STORAGE_KEY = 'lumera-natal-v1';
  const MAJOR_COUNT = 22;

  /* ================= STATE ================= */
  function loadBirthData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function saveBirthData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function clearBirthData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  /* ================= CORE CALCULATION ================= */
  function reduceToMajor(n) {
    n = Math.abs(n);
    while (n > MAJOR_COUNT - 1) {
      n = String(n).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    }
    return n;
  }

  function calculateBirthCards(year, month, day) {
    const yearDigits = String(year).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    const personalitySum = month + day + yearDigits;
    const personality = reduceToMajor(personalitySum);

    let soulSum = String(personalitySum).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    const soul = reduceToMajor(soulSum);

    const now = new Date();
    const currentYearDigits = String(now.getFullYear()).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    const yearSum = month + day + currentYearDigits;
    const yearCard = reduceToMajor(yearSum);

    const sunSign = getSunSign(month, day);

    return {
      personality,
      soul,
      year: yearCard,
      sunSign,
      raw: { personalitySum, soulSum, yearSum }
    };
  }

  /* ================= SUN SIGN ================= */
  function getSunSign(month, day) {
    const signs = [
      { name: 'جدی',      en: 'Capricorn',   start: [12, 22] },
      { name: 'دلو',      en: 'Aquarius',    start: [1, 20] },
      { name: 'حوت',      en: 'Pisces',      start: [2, 19] },
      { name: 'حمل',      en: 'Aries',       start: [3, 21] },
      { name: 'ثور',      en: 'Taurus',      start: [4, 20] },
      { name: 'جوزا',     en: 'Gemini',      start: [5, 21] },
      { name: 'سرطان',    en: 'Cancer',      start: [6, 21] },
      { name: 'اسد',      en: 'Leo',         start: [7, 23] },
      { name: 'سنبله',    en: 'Virgo',       start: [8, 23] },
      { name: 'میزان',    en: 'Libra',       start: [9, 23] },
      { name: 'عقرب',     en: 'Scorpio',     start: [10, 23] },
      { name: 'قوس',      en: 'Sagittarius', start: [11, 22] }
    ];

    for (let i = signs.length - 1; i >= 0; i--) {
      const [sm, sd] = signs[i].start;
      if (month > sm || (month === sm && day >= sd)) {
        return signs[i];
      }
    }
    return signs[0];
  }

  /* ================= CARD ELEMENTS (by zodiac) ================= */
  const CARD_ELEMENTS = {
    0:  'هوا',
    1:  'هوا',
    2:  'آب',
    3:  'خاک',
    4:  'آتش',
    5:  'خاک',
    6:  'هوا',
    7:  'آب',
    8:  'آتش',
    9:  'خاک',
    10: 'هوا',
    11: 'هوا',
    12: 'آب',
    13: 'آب',
    14: 'آتش',
    15: 'خاک',
    16: 'آتش',
    17: 'هوا',
    18: 'آب',
    19: 'آتش',
    20: 'آتش',
    21: 'خاک'
  };

  /* ================= SIGN ELEMENTS ================= */
  const SIGN_ELEMENTS = {
    'حمل':   { element: 'آتش', emoji: '🔥', icon: '🜂' },
    'ثور':   { element: 'خاک', emoji: '🌍', icon: '🜃' },
    'جوزا':  { element: 'هوا', emoji: '💨', icon: '🜁' },
    'سرطان': { element: 'آب',  emoji: '💧', icon: '🜄' },
    'اسد':   { element: 'آتش', emoji: '🔥', icon: '🜂' },
    'سنبله': { element: 'خاک', emoji: '🌍', icon: '🜃' },
    'میزان': { element: 'هوا', emoji: '💨', icon: '🜁' },
    'عقرب':  { element: 'آب',  emoji: '💧', icon: '🜄' },
    'قوس':   { element: 'آتش', emoji: '🔥', icon: '🜂' },
    'جدی':   { element: 'خاک', emoji: '🌍', icon: '🜃' },
    'دلو':   { element: 'هوا', emoji: '💨', icon: '🜁' },
    'حوت':   { element: 'آب',  emoji: '💧', icon: '🜄' }
  };

  function getElementForSign(signName) {
    return SIGN_ELEMENTS[signName] || { element: 'روح', emoji: '✨', icon: '✦' };
  }

  function getElementForNumber(num) {
    return CARD_ELEMENTS[num] || 'روح';
  }

  /* ================= ALIGNMENT ANALYSIS ================= */
  function analyzeElementAlignment(userElement, cardElements) {
    const matches = cardElements.filter(e => e === userElement).length;
    const total = cardElements.length;

    if (matches === total) {
      return {
        alignment: 'perfect',
        headline: 'هماهنگی کامل',
        description: `هر سه کارت زاد تو از عنصر ${userElement} هستند — دقیقاً هم‌عنصر با وجود تو. این یعنی مسیر زندگی‌ات، ادامه‌ی طبیعی جوهرِ روحت است. تو در جای درستی ایستاده‌ای و کائنات، هم‌صدای توست.`
      };
    }
    if (matches >= 2) {
      return {
        alignment: 'strong',
        headline: 'هماهنگی قوی',
        description: `دو کارت از سه کارت زاد تو از عنصر ${userElement} هستند. این یعنی ستون‌های اصلی زندگی‌ات بر پایه‌ی وجودت بنا شده‌اند، و یک حوزه هنوز در حال شکل‌گیری است.`
      };
    }
    if (matches === 1) {
      return {
        alignment: 'partial',
        headline: 'هماهنگی جزئی',
        description: `تنها یکی از کارت‌های زاد تو از عنصر ${userElement} است. این یعنی روحت، سفری برای تجربه‌ی عنصرهای دیگر آغاز کرده. تو در مسیر گسترش و یادگیری هستی — و این، خودش یک فرصت بزرگ است.`
      };
    }
    return {
      alignment: 'transformative',
      headline: 'سفر دگردیسی',
      description: `هیچ‌کدام از کارت‌های زاد تو از عنصر ${userElement} نیستند. این پیام عمیقی دارد: روح تو، آگاهانه عنصر وجودی‌اش را ترک کرده تا در عنصرهای دیگر بالنده شود. این سفر، دشوار اما مقدس است — تو در حال دگردیسی هستی.`
    };
  }

  /* ================= AGE ================= */
  function calculateAge(year, month, day) {
    const now = new Date();
    let age = now.getFullYear() - year;
    const m = now.getMonth() + 1;
    const d = now.getDate();
    if (m < month || (m === month && d < day)) age--;
    return Math.max(0, age);
  }

  /* ================= JALALI ↔ GREGORIAN ================= */
  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
             + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { jy, jm, jd };
  }

  function jalaliToGregorian(jy, jm, jd) {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd
             + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let gd = days + 1;
    const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28,
                   31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 1; gm <= 12; gm++) {
      if (gd <= sal_a[gm]) break;
      gd -= sal_a[gm];
    }
    return { gy, gm, gd };
  }

  /* ================= PUBLIC API ================= */
  return {
    loadBirthData,
    saveBirthData,
    clearBirthData,
    calculateBirthCards,
    getElementForNumber,
    getElementForSign,
    analyzeElementAlignment,
    calculateAge,
    gregorianToJalali,
    jalaliToGregorian,
    getSunSign
  };
})();