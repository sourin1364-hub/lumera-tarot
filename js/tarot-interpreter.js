/* =========================================================
   LUMERA · TAROT INTERPRETER
   Comprehensive multi-card interpretation engine.
   Analyzes elements, majors, numbers, reversals,
   positions and interactions — then weaves a unified story.
   ========================================================= */
window.TarotInterpreter = (() => {
  'use strict';

  /* ================= SUIT INFO ================= */
  const SUITS = {
    cups:      { fa: 'جام',      element: 'آب',   theme: 'احساسات، عشق، روابط، شهود' },
    swords:    { fa: 'شمشیر',    element: 'باد',  theme: 'اندیشه، حقیقت، تصمیم، گفتگو' },
    wands:     { fa: 'چوبدست',   element: 'آتش',  theme: 'انرژی، الهام، خلاقیت، عمل' },
    pentacles: { fa: 'سکه',      element: 'خاک',  theme: 'مادیات، کار، بدن، پایداری' },
    major:     { fa: 'آرکانای بزرگ', element: 'روح', theme: 'سرنوشت، درس‌های روحی، تحولات بزرگ' }
  };

  /* ================= POSITION MEANINGS ================= */
  const POSITION_CONTEXT = {
    daily:    { 'پیام امروز': 'انرژی غالب امروز تو' },
    pph: {
      'گذشته': 'ریشه‌ها و آنچه تو را به امروز رساند',
      'حال':   'وضعیت کنونی و آنچه در آن ایستاده‌ای',
      'آینده':'جهتی که به سویش می‌روی'
    },
    love: {
      'تو':    'احساسات و جایگاه تو در این پیوند',
      'او':    'احساسات و جایگاه او',
      'رابطه':'جنس و سرنوشت این پیوند'
    },
    crossroad: {
      'مسیر نخست': 'انرژی و نتیجه‌ی انتخاب اول',
      'مسیر دوم':  'انرژی و نتیجه‌ی انتخاب دوم'
    },
    elements: {
      'آتش — انرژی':   'شور، انگیزه و نیروی محرک تو',
      'آب — احساس':   'دنیای عاطفی و شهودی تو',
      'باد — اندیشه': 'ذهن، گفتگو و تصمیم‌های تو',
      'خاک — واقعیت':'مادیات، بدن و پایه‌های زندگی تو'
    },
    yesno:    { 'پاسخ': 'پاسخ صریح به پرسش تو' }
  };

  /* ================= COMBINATION HIGHLIGHTS ================= */
  // Specific card-pair interactions (order-agnostic)
  const PAIR_INSIGHTS = [
    { a: 'major-00', b: 'major-21', text: 'سفر کامل روح: از بی‌پروایی تا کمال.' },
    { a: 'major-13', b: 'major-16', text: 'تحول عمیق و رهایی از ساختارهای کهنه.' },
    { a: 'major-15', b: 'major-18', text: 'زنجیرهای پنهان و توهم — بیداری در راه است.' },
    { a: 'major-19', b: 'major-17', text: 'نور و امید در اوج؛ لحظه‌ی شکوفایی.' },
    { a: 'major-06', b: 'cups-two', text: 'عشقی متقابل و انتخابی از دل.' },
    { a: 'major-11', b: 'swords-ace', text: 'حقیقت با شمشیر برهنه آشکار می‌شود.' },
    { a: 'major-04', b: 'pentacles-king', text: 'اقتدار پایدار و ساختاری محکم.' },
    { a: 'major-08', b: 'wands-seven', text: 'قدرت نرم در برابر ایستادگی — ترکیب شکست‌ناپذیر.' },
    { a: 'major-16', b: 'major-17', text: 'پس از فروپاشی، ستاره‌ای می‌درخشد.' },
    { a: 'major-09', b: 'major-02', text: 'خلوت و شهود — پاسخ در سکوت.' }
  ];

  /* ================= HELPERS ================= */
  function getSuitKey(card) {
    return card.arcana === 'major' ? 'major' : card.suit;
  }

  function isReversed(d) { return d.reversed === true; }

  /* ================= ANALYSIS: SUIT DOMINANCE ================= */
  function analyzeSuits(draw) {
    const counts = { cups: 0, swords: 0, wands: 0, pentacles: 0, major: 0 };
    draw.forEach(d => { counts[getSuitKey(d.card)]++; });

    const total = draw.length;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topSuit, topCount] = entries[0];

    if (topCount === 0) return null;

    const dominant = topCount / total >= 0.5 && topCount >= 2;
    const info = SUITS[topSuit];

    if (!dominant && topCount < 2) return null;

    if (topSuit === 'major') {
      return {
        type: 'major',
        text: `حضور ${topCount} کارت از آرکانای بزرگ نشان می‌دهد که این فال در سطح **سرنوشت** جریان دارد. رویدادهایی در راه‌اند که فراتر از کنترل روزمره‌اند و درس‌های روحی عمیقی با خود می‌آورند.`,
        tag: 'غلبه‌ی سرنوشت'
      };
    }

    return {
      type: topSuit,
      text: `غلبه‌ی ${info.fa} (عنصر ${info.element}) در این فال، محور اصلی پیام را به **${info.theme}** معطوف می‌کند. این حوزه، قلب ماجراست.`,
      tag: `غلبه‌ی ${info.fa}`
    };
  }

  /* ================= ANALYSIS: MAJORS vs MINORS ================= */
  function analyzeMajors(draw) {
    const majors = draw.filter(d => d.card.arcana === 'major').length;
    const total = draw.length;

    if (majors === 0) {
      return {
        text: 'در این فال، کارت‌های کوچک غالب‌اند. این یعنی موضوع، در سطح **رویدادهای روزمره و انتخاب‌های شخصی** جریان دارد؛ نه تقدیر. تو بازیگر اصلی هستی.',
        tag: 'عرصه‌ی انتخاب'
      };
    }
    if (majors === total) {
      return {
        text: 'همه‌ی کارت‌های این فال از آرکانای بزرگ‌اند. این یکی از قوی‌ترین نشانه‌های تاروت است: **لحظه‌ای سرنوشت‌ساز** در راه است و تو زیر نگاه تقدیر ایستاده‌ای.',
        tag: 'لحظه‌ی تقدیری'
      };
    }
    if (majors >= total / 2) {
      return {
        text: `نیمی از کارت‌ها (${majors} از ${total}) از آرکانای بزرگ‌اند. این یعنی رویدادی مهم، در سطحی فراتر از روزمره، در حال شکل‌گیری است. انتخاب‌های تو وزن دارند.`,
        tag: 'تحول عمیق'
      };
    }
    return null;
  }

  /* ================= ANALYSIS: NUMBER REPETITION ================= */
  function analyzeNumbers(draw) {
    const numbers = {};
    draw.forEach(d => {
      if (d.card.arcana === 'major') {
        numbers[d.card.num] = (numbers[d.card.num] || 0) + 1;
      } else if (d.card.rank && !isNaN(parseInt(d.card.rank, 10))) {
        const n = parseInt(d.card.rank, 10);
        numbers[n] = (numbers[n] || 0) + 1;
      } else if (d.card.rank === 'ace') {
        numbers[1] = (numbers[1] || 0) + 1;
      }
    });
    const repeated = Object.entries(numbers).filter(([_, c]) => c >= 2);
    if (repeated.length === 0) return null;

    const [num, count] = repeated[0];
    return {
      text: `تکرار عدد **${num}** در این فال، پیام خاصی دارد: عدد ${num} در تاروت نمادِ مرحله‌ای تازه در مسیر تکامل توست.`,
      tag: `تکرار عدد ${num}`
    };
  }

  /* ================= ANALYSIS: REVERSALS ================= */
  function analyzeReversals(draw) {
    const reversed = draw.filter(isReversed);
    if (reversed.length === 0) {
      return {
        text: 'تمام کارت‌ها مستقیم ظاهر شده‌اند. این نشانه‌ای از **جریان آزاد انرژی** و هم‌راستایی مثبت است.',
        tag: 'هم‌راستایی کامل'
      };
    }
    const total = draw.length;
    const ratio = reversed.length / total;

    if (ratio >= 0.6) {
      return {
        text: 'بیشتر کارت‌ها وارونه‌اند. این یعنی مسیر فعلی نیازمند **بازنگری و درون‌نگری** است. انرژی‌ها به سمت بیرون جریان ندارند؛ وقتِ پرداختن به سایه‌ها و موانع درونی است.',
        tag: 'فراخوان درون'
      };
    }
    if (reversed.length === 1 && total >= 3) {
      return {
        text: `در میان این چیدمان، تنها «${reversed[0].card.name}» وارونه است. این یک نقطه‌ی کانونی است: **همین‌جاست که باید کار کنی**.`,
        tag: 'نقطه‌ی کانونی'
      };
    }
    return {
      text: `${reversed.length} کارت وارونه در فال تو دیده می‌شود. این‌ها نشان می‌دهند انرژی‌هایی وجود دارند که هنوز به کمال نرسیده‌اند — نه مانع، بلکه **فرصت رشد**.`,
      tag: 'انرژی‌های در حال شکل‌گیری'
    };
  }

  /* ================= ANALYSIS: PAIR INSIGHTS ================= */
  function analyzePairInsights(draw) {
    const ids = draw.map(d => d.card.id);
    const found = [];
    for (const pair of PAIR_INSIGHTS) {
      if (ids.includes(pair.a) && ids.includes(pair.b)) {
        found.push(pair.text);
      }
    }
    if (found.length === 0) return null;
    return {
      text: found.join(' '),
      tag: 'ترکیب ویژه'
    };
  }

  /* ================= ANALYSIS: POSITION FLOW (Narrative) ================= */
  function analyzePositionFlow(draw, spreadKey) {
    if (draw.length < 2) return null;
    const ctx = POSITION_CONTEXT[spreadKey];

    if (spreadKey === 'pph') {
      const past = draw[0], present = draw[1], future = draw[2];
      return {
        text: `مسیر تو از «${past.card.name}» در گذشته آغاز شد، به «${present.card.name}» در امروز رسید و به سوی «${future.card.name}» می‌رود.`,
        tag: 'مسیر زمان'
      };
    }

    if (spreadKey === 'love') {
      const you = draw[0], them = draw[1], rel = draw[2];
      return {
        text: `تو با انرژی «${you.card.name}» وارد این رابطه شده‌ای، او با انرژی «${them.card.name}»، و جنس این پیوند را کارت «${rel.card.name}» می‌سازد.`,
        tag: 'سه‌گانه‌ی عشق'
      };
    }

    if (spreadKey === 'crossroad') {
      const a = draw[0], b = draw[1];
      return {
        text: `مسیر نخست با «${a.card.name}» و مسیر دوم با «${b.card.name}» تصویر شده است. انتخاب، در نسبت میان این دو انرژی شکل می‌گیرد.`,
        tag: 'سنجش دو راه'
      };
    }

    if (spreadKey === 'elements') {
      return {
        text: `چهار عنصر با «${draw[0].card.name}» (آتش)، «${draw[1].card.name}» (آب)، «${draw[2].card.name}» (باد) و «${draw[3].card.name}» (خاک) در تو ترسیم شده‌اند.`,
        tag: 'چهار عنصر وجود'
      };
    }

    return null;
  }

  /* ================= SYNTHESIS: Narrative ================= */
  function synthesizeNarrative(draw, spreadKey, intention, analyses) {
    const intro = intention
      ? `نیت تو: «${intention}».\n\n`
      : '';

    const parts = [];

    // 1. Opening line — the "story"
    if (draw.length === 1) {
      const d = draw[0];
      parts.push(`کارت «${d.card.name}»${d.reversed ? ' (وارونه)' : ''} در این لحظه‌ی خاص، پیام اصلی را می‌آورد.`);
    } else {
      const names = draw.map(d => `«${d.card.name}»${d.reversed ? '(و)' : ''}`).join('، ');
      parts.push(`این فال از ${names} شکل گرفته است.`);
    }

    // 2. Suit / element dominance
    if (analyses.suit) parts.push(analyses.suit.text);

    // 3. Majors vs Minors
    if (analyses.majors) parts.push(analyses.majors.text);

    // 4. Numbers
    if (analyses.numbers) parts.push(analyses.numbers.text);

    // 5. Reversals
    if (analyses.reversals) parts.push(analyses.reversals.text);

    // 6. Position flow (narrative)
    if (analyses.flow) parts.push(analyses.flow.text);

    // 7. Pair insights
    if (analyses.pairs) parts.push(analyses.pairs.text);

    // 8. Closing — actionable advice
    parts.push(closingAdvice(draw, spreadKey, analyses));

    return intro + parts.join('\n\n');
  }

  /* ================= CLOSING ADVICE ================= */
  function closingAdvice(draw, spreadKey, analyses) {
    const reversedCount = draw.filter(isReversed).length;
    const majors = draw.filter(d => d.card.arcana === 'major').length;

    if (spreadKey === 'yesno') {
      // Handled elsewhere by yes/no logic — just a supportive note
      return 'به این پاسخ، با آگاهی از شرایط درونی و بیرونی‌ات نگاه کن.';
    }

    if (reversedCount >= draw.length / 2) {
      return '👁 **توصیه‌ی لومِرا:** پیش از هر اقدام بیرونی، زمانی را به مراقبه، نوشتن و درون‌نگری اختصاص بده. آنچه در بیرون رخ می‌دهد، آینه‌ای از درون است.';
    }

    if (majors >= draw.length / 2) {
      return '✦ **توصیه‌ی لومِرا:** لحظه‌ای سرنوشت‌ساز در راه است. با آگاهی و شجاعت، این گذار را در آغوش بگیر. کارت‌ها در کنارت هستند.';
    }

    if (spreadKey === 'love') {
      return '❤ **توصیه‌ی لومِرا:** صداقت با خود، نخستین گام برای صداقت در پیوند است. پیش از پرسیدن از دیگری، از دلِ خودت بپرس.';
    }

    if (spreadKey === 'crossroad') {
      return '⇄ **توصیه‌ی لومِرا:** هر دو مسیر، درس‌هایی دارند. آن را برگزین که روحت را روشن‌تر می‌کند، نه آنکه فقط آسان‌تر است.';
    }

    if (spreadKey === 'elements') {
      return '✦ **توصیه‌ی لومِرا:** چهار عنصر وجودت را در هماهنگی نگه دار. اگر یک عنصر ضعیف است، آگاهانه روی آن کار کن.';
    }

    return '✦ **توصیه‌ی لومِرا:** به این پیام، به‌عنوان آینه‌ای برای خودشناسی بنگر. کارت‌ها راه را نشان می‌دهند، اما پیمودنش بر عهده‌ی توست.';
  }

  /* ================= PUBLIC: INTERPRET ================= */
  function interpret(draw, spreadKey, intention) {
    if (!draw || draw.length === 0) {
      return { narrative: '', cards: [] };
    }

    const analyses = {
      suit:      analyzeSuits(draw),
      majors:    analyzeMajors(draw),
      numbers:   analyzeNumbers(draw),
      reversals: analyzeReversals(draw),
      pairs:     analyzePairInsights(draw),
      flow:      analyzePositionFlow(draw, spreadKey)
    };

    const narrative = synthesizeNarrative(draw, spreadKey, intention, analyses);

    // Per-card "in context" line
    const cards = draw.map((d, i) => {
      const ctxMap = POSITION_CONTEXT[spreadKey];
      const positionContext = ctxMap && ctxMap[d.position] ? ctxMap[d.position] : '';
      return {
        index: i,
        card: d.card,
        reversed: d.reversed,
        position: d.position,
        positionContext,
        meaning: d.reversed ? d.card.reversed : d.card.upright,
        message: d.card.message || ''
      };
    });

    return {
      narrative,
      cards,
      analyses,
      tags: [
        analyses.suit?.tag,
        analyses.majors?.tag,
        analyses.reversals?.tag,
        analyses.numbers?.tag,
        analyses.pairs?.tag,
        analyses.flow?.tag
      ].filter(Boolean)
    };
  }

  return { interpret };
})();