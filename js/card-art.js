/* =========================================================
   LUMERA · CARD ART
   Renders each tarot card with its unique JPG image,
   wrapped in a gilded Persian-arch frame.
   ========================================================= */
window.CardArt = (() => {
  'use strict';

  const GOLD_1 = '#e8c076';
  const GOLD_2 = '#b8863b';
  const CREAM  = '#fbf3dd';

  /* ---------- Numerals ---------- */
  function numeralFor(card) {
    if (card.arcana === 'major') {
      return ['0','I','II','III','IV','V','VI','VII','VIII','IX','X',
              'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][card.num] || '';
    }
    return {
      ace: 'A', two: 'II', three: 'III', four: 'IV', five: 'V',
      six: 'VI', seven: 'VII', eight: 'VIII', nine: 'IX', ten: 'X',
      page: 'P', knight: 'N', queen: 'Q', king: 'K'
    }[card.rank] || '';
  }

  /* ---------- Card FRONT ---------- */
  function faceSVG(card) {
    const num = numeralFor(card);
    const imgPath = `assets/cards/${card.id}.jpg`;

    return `
    <svg viewBox="0 0 240 400" xmlns="http://www.w3.org/2000/svg"
         preserveAspectRatio="xMidYMid meet"
         xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="lum-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${GOLD_1}"/>
          <stop offset="50%" stop-color="${GOLD_2}"/>
          <stop offset="100%" stop-color="${GOLD_1}"/>
        </linearGradient>
        <clipPath id="lum-img-clip-${card.id}">
          <rect x="12" y="12" width="216" height="376" rx="10"/>
        </clipPath>
      </defs>

      <!-- Parchment background -->
      <rect width="240" height="400" fill="${CREAM}"/>

      <!-- Card image -->
      <image href="${imgPath}" xlink:href="${imgPath}"
             x="12" y="12" width="216" height="376"
             preserveAspectRatio="xMidYMid slice"
             clip-path="url(#lum-img-clip-${card.id})"/>

      <!-- Outer gilded frame -->
      <rect x="8" y="8" width="224" height="384" rx="14"
            fill="none" stroke="url(#lum-gold)" stroke-width="3"/>
      <rect x="12" y="12" width="216" height="376" rx="10"
            fill="none" stroke="${GOLD_2}" stroke-width="0.7" opacity="0.75"/>

      <!-- Numeral (top) -->
      <text x="120" y="30" text-anchor="middle"
            font-family="Georgia, serif" font-size="16" font-weight="700"
            fill="#7a4a12" opacity="0.85">${num}</text>

      <!-- Name banner (bottom) -->
      <rect x="20" y="348" width="200" height="28" rx="6"
            fill="rgba(10,13,31,0.82)"/>
      <text x="120" y="367" text-anchor="middle"
            font-family="'Vazirmatn','Tahoma',sans-serif"
            font-size="14" font-weight="700" fill="#ffd98a">
        ${card.name}
      </text>
    </svg>`;
  }

  /* ---------- Card BACK ---------- */
  function backSVG() {
    return `
    <svg viewBox="0 0 240 400" xmlns="http://www.w3.org/2000/svg"
         xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="lum-back-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${GOLD_1}"/>
          <stop offset="50%" stop-color="${GOLD_2}"/>
          <stop offset="100%" stop-color="${GOLD_1}"/>
        </linearGradient>
        <clipPath id="lum-back-clip">
          <rect x="12" y="12" width="216" height="376" rx="10"/>
        </clipPath>
      </defs>

      <!-- Back image -->
      <image href="assets/backs/back.jpg" xlink:href="assets/backs/back.jpg"
             x="0" y="0" width="240" height="400"
             preserveAspectRatio="xMidYMid slice"
             clip-path="url(#lum-back-clip)"/>

      <!-- Gilded frame -->
      <rect x="8" y="8" width="224" height="384" rx="14"
            fill="none" stroke="url(#lum-back-gold)" stroke-width="3"/>
      <rect x="12" y="12" width="216" height="376" rx="10"
            fill="none" stroke="${GOLD_2}" stroke-width="0.7" opacity="0.75"/>

      <!-- Corner flourishes -->
      <g fill="none" stroke="#b8863b" stroke-width="1.2" opacity="0.75">
        <path d="M24 24 q12 0 18 12"/>
        <path d="M216 24 q-12 0 -18 12"/>
        <path d="M24 376 q12 0 18 -12"/>
        <path d="M216 376 q-12 0 -18 -12"/>
      </g>

      <!-- Lumera signature -->
      <text x="120" y="360" text-anchor="middle"
            font-family="Georgia, serif" font-size="11" letter-spacing="4"
            fill="#ffd98a" opacity="0.9">LUMERA</text>
    </svg>`;
  }

  /* ---------- Public API ---------- */
  return { faceSVG, backSVG };
})();