/* =========================================================
   LUMERA · STATS RENDERER
   Renders statistics + SVG charts from user history.
   ========================================================= */
window.LumeraStats = (() => {
  'use strict';

  const COLORS = {
    cups:      '#5fe0d0',
    swords:    '#a8b4ff',
    wands:     '#ffb06b',
    pentacles: '#ffd98a',
    major:     '#d9a957'
  };

  const SUIT_LABELS = {
    cups:      'جام',
    swords:    'شمشیر',
    wands:     'چوبدست',
    pentacles: 'سکه',
    major:     'آرکانای بزرگ'
  };

  /* ================= DONUT CHART ================= */
  function renderDonut(suitCounts) {
    const total = Object.values(suitCounts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return `<div class="stats-empty">هنوز داده‌ای برای نمایش نیست</div>`;
    }

    const size = 200;
    const cx = 100, cy = 100;
    const r = 70;
    const strokeWidth = 26;

    let offset = 0;
    const segments = [];
    const legend = [];

    Object.entries(suitCounts).forEach(([key, count]) => {
      if (count === 0) return;
      const ratio = count / total;
      const dashLength = 2 * Math.PI * r * ratio;
      const gap = 2 * Math.PI * r;
      const rot = -90 + (offset / total) * 360;

      segments.push(`
        <circle cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="${COLORS[key]}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashLength} ${gap - dashLength}"
          transform="rotate(${rot} ${cx} ${cy})"
          opacity="0.85">
          <animate attributeName="opacity" from="0" to="0.85" dur="0.6s" fill="freeze"/>
        </circle>
      `);

      legend.push(`
        <div class="legend-item">
          <span class="legend-dot" style="background:${COLORS[key]}"></span>
          <span class="legend-label">${SUIT_LABELS[key]}</span>
          <span class="legend-value">${count}</span>
        </div>
      `);

      offset += count;
    });

    return `
      <div class="chart-donut-wrap">
        <svg viewBox="0 0 ${size} ${size}" class="donut-svg">
          <circle cx="${cx}" cy="${cy}" r="${r}"
            fill="none" stroke="rgba(255,217,138,0.08)" stroke-width="${strokeWidth}"/>
          ${segments.join('')}
          <text x="${cx}" y="${cy - 4}" text-anchor="middle"
                font-family="Vazirmatn, Tahoma, sans-serif"
                font-size="22" font-weight="700" fill="#ffd98a">${total}</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle"
                font-family="Vazirmatn, Tahoma, sans-serif"
                font-size="11" fill="#b7b2a6">کارت</text>
        </svg>
        <div class="chart-legend">${legend.join('')}</div>
      </div>
    `;
  }

  /* ================= TOP CARDS ================= */
  function renderTopCards(topCards, allCardsMap) {
    if (!topCards || topCards.length === 0) {
      return `<div class="stats-empty">هنوز کارتی ثبت نشده</div>`;
    }
    const max = topCards[0].count;

    return topCards.map(({ id, count }) => {
      const card = allCardsMap[id];
      if (!card) return '';
      const width = (count / max) * 100;
      return `
        <div class="top-card-row">
          <div class="top-card-info">
            <span class="top-card-name">${card.name}</span>
            <span class="top-card-count">${count}×</span>
          </div>
          <div class="top-card-bar">
            <div class="top-card-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ================= ACTIVITY HEATMAP (30 days) ================= */
  function renderActivity(history) {
    const days = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = {};
    history.forEach(r => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      counts[key] = (counts[key] || 0) + 1;
    });

    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const c = counts[d.getTime()] || 0;
      const level = c === 0 ? 0 : c <= 1 ? 1 : c <= 3 ? 2 : 3;
      const dayName = d.toLocaleDateString('fa-IR', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' });
      cells.push(`
        <div class="heatmap-cell level-${level}" title="${dayNum} — ${c} فال"></div>
      `);
    }

    return `
      <div class="heatmap">
        <div class="heatmap-grid">${cells.join('')}</div>
        <div class="heatmap-legend">
          <span>کمتر</span>
          <span class="heatmap-cell level-0"></span>
          <span class="heatmap-cell level-1"></span>
          <span class="heatmap-cell level-2"></span>
          <span class="heatmap-cell level-3"></span>
          <span>بیشتر</span>
        </div>
      </div>
    `;
  }

  /* ================= STATS CARDS ================= */
  function renderStatCards(stats, unlockedCount, totalAchievements) {
    const memberDays = Math.floor(
      (Date.now() - LumeraUser.loadProfile().createdAt) / (1000 * 60 * 60 * 24)
    );
    const reversedPercent = Math.round(stats.reversedRatio * 100);

    const items = [
      { icon: '🎴', label: 'فال‌ها', value: stats.totalReadings },
      { icon: '🃏', label: 'کارت‌ها', value: stats.totalCards },
      { icon: '🔥', label: 'روز پیوسته', value: stats.streak },
      { icon: '🏆', label: 'دستاوردها', value: `${unlockedCount}/${totalAchievements}` },
      { icon: '🌗', label: 'کارت وارونه', value: `${reversedPercent}%` },
      { icon: '📅', label: 'روز عضویت', value: memberDays }
    ];

    return items.map(it => `
      <div class="stat-card">
        <div class="stat-card-icon">${it.icon}</div>
        <div class="stat-card-value">${it.value}</div>
        <div class="stat-card-label">${it.label}</div>
      </div>
    `).join('');
  }

  /* ================= HISTORY LIST ================= */
  function renderHistory(history, allCardsMap) {
    if (!history || history.length === 0) {
      return `<div class="stats-empty">هنوز فالی ثبت نکرده‌ای</div>`;
    }

    return history.slice(0, 8).map(r => {
      const date = new Date(r.date);
      const dateStr = date.toLocaleDateString('fa-IR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('fa-IR', {
        hour: '2-digit', minute: '2-digit'
      });

      const spreadNames = {
        daily: 'تک‌کارت روزانه',
        pph: 'گذشته-حال-آینده',
        love: 'فال عشق',
        crossroad: 'دوراهی',
        elements: 'چهار عنصر',
        yesno: 'بله / خیر'
      };

      const cardsHTML = r.cards.map(c => `
        <span class="history-card-chip" title="${c.position}">
          ${c.name}${c.reversed ? ' ⇵' : ''}
        </span>
      `).join('');

      return `
        <div class="history-item">
          <div class="history-head">
            <div class="history-spread">${spreadNames[r.spread] || r.spread}</div>
            <div class="history-date">${dateStr} — ${timeStr}</div>
          </div>
          ${r.intention ? `<div class="history-intention">«${r.intention}»</div>` : ''}
          <div class="history-cards">${cardsHTML}</div>
        </div>
      `;
    }).join('');
  }

  /* ================= ACHIEVEMENTS GRID ================= */
  function renderAchievements(achievements) {
    if (!achievements || achievements.length === 0) {
      return `<div class="stats-empty">هنوز دستاوردی نداری</div>`;
    }

    return achievements.map(a => `
      <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}"
           title="${a.desc}">
        <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="achievement-name">${a.unlocked ? a.name : '؟؟؟'}</div>
        <div class="achievement-desc">${a.unlocked ? a.desc : 'هنوز قفل است'}</div>
      </div>
    `).join('');
  }

  return {
    renderDonut,
    renderTopCards,
    renderActivity,
    renderStatCards,
    renderHistory,
    renderAchievements
  };
})();