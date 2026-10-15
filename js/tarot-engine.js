/* =========================================================
   LUMERA · TAROT ENGINE
   Fair shuffle, spreads, reversed cards, yes/no logic.
   ========================================================= */
window.TarotEngine = (() => {
  'use strict';

  let CARDS = [];
  let READY = false;

  /* ================= SPREADS ================= */
  const SPREADS = {
    daily: {
      key: 'daily',
      name: 'تک‌کارت روزانه',
      icon: '☀',
      desc: 'پیام امروزت را از دل کارت بشنو.',
      count: 1,
      positions: ['پیام امروز']
    },
    pph: {
      key: 'pph',
      name: 'گذشته · حال · آینده',
      icon: '⧗',
      desc: 'مسیر زمان را با سه کارت مرور کن.',
      count: 3,
      positions: ['گذشته', 'حال', 'آینده']
    },
    love: {
      key: 'love',
      name: 'فال عشق',
      icon: '❤',
      desc: 'تو، او و جنس رابطه.',
      count: 3,
      positions: ['تو', 'او', 'رابطه']
    },
    crossroad: {
      key: 'crossroad',
      name: 'دوراهی',
      icon: '⇄',
      desc: 'میان دو انتخاب، نور را ببین.',
      count: 2,
      positions: ['مسیر نخست', 'مسیر دوم']
    },
    elements: {
      key: 'elements',
      name: 'چهار عنصر',
      icon: '✦',
      desc: 'آتش، آب، باد و خاک درون تو.',
      count: 4,
      positions: ['آتش — انرژی', 'آب — احساس', 'باد — اندیشه', 'خاک — واقعیت']
    },
    yesno: {
      key: 'yesno',
      name: 'پاسخ بله / خیر',
      icon: '؟',
      desc: 'پاسخی صریح به یک پرسش روشن.',
      count: 1,
      positions: ['پاسخ']
    }
  };

  /* ================= LOAD ================= */
  async function load() {
    if (READY) return;
    const res = await fetch('data/tarot-full.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to load tarot-full.json');
    CARDS = await res.json();
    READY = true;
  }

  /* ================= FAIR SHUFFLE (crypto) ================= */
  function shuffle(arr) {
    const a = arr.slice();
    const rnd = new Uint32Array(a.length);
    crypto.getRandomValues(rnd);
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd[i] % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= DRAW ================= */
  function draw(spreadKey) {
    const spread = SPREADS[spreadKey];
    if (!spread) throw new Error('Spread not found: ' + spreadKey);
    if (!READY) throw new Error('Deck not loaded yet');

    const deck = shuffle(CARDS);
    const orient = new Uint8Array(spread.count);
    crypto.getRandomValues(orient);

    return spread.positions.map((pos, i) => {
      const c = deck[i];
      // ~38% chance reversed
      const reversed = (orient[i] % 100) < 38;
      return {
        card: c,
        reversed,
        position: pos,
        index: i
      };
    });
  }

  /* ================= YES / NO LOGIC ================= */
  // Tradition: Cups & Pentacles → positive, Swords → mixed, Wands → driven
  // Majors weighted by their number (light vs dark)
  const YES_MAJORS = [0, 1, 3, 6, 10, 14, 17, 19, 21];   // Fool, Magician, Empress, Lovers, Wheel, Temperance, Star, Sun, World
  const NO_MAJORS  = [13, 15, 16, 18];                     // Death, Devil, Tower, Moon

  function yesNoVerdict(drawn) {
    if (!drawn || drawn.length === 0) return { text: '—', tone: 'neutral', detail: '' };

    let score = 0;
    const reasons = [];

    drawn.forEach(d => {
      const c = d.card;
      let s = 0;

      if (c.arcana === 'major') {
        if (YES_MAJORS.includes(c.num)) s = 2;
        else if (NO_MAJORS.includes(c.num)) s = -2;
        else s = 1;
      } else {
        if (c.suit === 'cups') s = 2;
        else if (c.suit === 'pentacles') s = 1.5;
        else if (c.suit === 'wands') s = 1;
        else if (c.suit === 'swords') s = -1;
      }

      if (d.reversed) s = -s;
      score += s;
      reasons.push(`${c.name}${d.reversed ? ' (وارونه)' : ''}`);
    });

    let text, tone;
    if (score > 1.5)       { text = 'بله — با اطمینان'; tone = 'yes'; }
    else if (score > 0)    { text = 'بله — اما با احتیاط'; tone = 'yes-soft'; }
    else if (score === 0)  { text = 'معلق — نشانه‌ای روشن نیست'; tone = 'neutral'; }
    else if (score > -1.5) { text = 'خیر — اما نه برای همیشه'; tone = 'no-soft'; }
    else                   { text = 'خیر — با قوت'; tone = 'no'; }

    return {
      text,
      tone,
      detail: reasons.join(' · '),
      score: Math.round(score * 10) / 10
    };
  }

  /* ================= UTIL ================= */
  function getCard(id) {
    return CARDS.find(c => c.id === id) || null;
  }

  function count() {
    return CARDS.length;
  }

  function isReady() {
    return READY;
  }

   /* ================= INTERPRET (Delegates) ================= */
  function interpret(draw, spreadKey, intention) {
    if (typeof TarotInterpreter === 'undefined') {
      console.warn('TarotInterpreter not loaded');
      return { narrative: '', cards: [] };
    }
    return TarotInterpreter.interpret(draw, spreadKey, intention);
  }

  /* ================= PUBLIC API ================= */
  return {
    load,
    draw,
    interpret,
    getCard,
    count,
    isReady,
    SPREADS,
    yesNoVerdict
  };
})();