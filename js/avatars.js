/* =========================================================
   LUMERA · AVATARS
   12 hand-crafted SVG avatars in the Lumera palette.
   ========================================================= */
window.LumeraAvatars = (() => {
  'use strict';

  const GOLD_1 = '#ffd98a';
  const GOLD_2 = '#d9a957';
  const GOLD_3 = '#b8863b';
  const TURQ   = '#5fe0d0';
  const BG     = 'rgba(10,13,31,0.85)';

  function wrap(inner, id) {
    return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${GOLD_1}"/>
          <stop offset="50%" stop-color="${GOLD_2}"/>
          <stop offset="100%" stop-color="${GOLD_3}"/>
        </linearGradient>
        <radialGradient id="bg-${id}" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#1a2150"/>
          <stop offset="100%" stop-color="#0a0d1f"/>
        </radialGradient>
        <radialGradient id="glow-${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${GOLD_1}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${GOLD_1}" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="120" height="120" rx="60" fill="url(#bg-${id})"/>
      <circle cx="60" cy="60" r="58" fill="url(#glow-${id})"/>

      <!-- Outer ring -->
      <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gold-${id})" stroke-width="1.4" opacity="0.85"/>
      <circle cx="60" cy="60" r="49" fill="none" stroke="${GOLD_3}" stroke-width="0.5" opacity="0.55"/>

      <!-- Inner art -->
      ${inner}
    </svg>`;
  }

  const AVATARS = {
    sun: {
      id: 'sun',
      name: 'خورشید',
      svg: wrap(`
        <circle cx="60" cy="60" r="16" fill="url(#gold-sun)"/>
        <circle cx="60" cy="60" r="10" fill="#0a0d1f"/>
        <g stroke="url(#gold-sun)" stroke-width="2" stroke-linecap="round" fill="none">
          <line x1="60" y1="28" x2="60" y2="22"/>
          <line x1="60" y1="92" x2="60" y2="98"/>
          <line x1="28" y1="60" x2="22" y2="60"/>
          <line x1="92" y1="60" x2="98" y2="60"/>
          <line x1="37" y1="37" x2="33" y2="33"/>
          <line x1="83" y1="83" x2="87" y2="87"/>
          <line x1="37" y1="83" x2="33" y2="87"/>
          <line x1="83" y1="37" x2="87" y2="33"/>
        </g>
      `, 'sun')
    },
    moon: {
      id: 'moon',
      name: 'ماه',
      svg: wrap(`
        <path d="M72 44 a22 22 0 1 0 0 32 a28 28 0 1 1 0 -32 z"
              fill="none" stroke="url(#gold-moon)" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="44" cy="46" r="1.6" fill="${GOLD_1}"/>
        <circle cx="40" cy="60" r="1.2" fill="${GOLD_1}"/>
        <circle cx="44" cy="74" r="1.6" fill="${GOLD_1}"/>
      `, 'moon')
    },
    star: {
      id: 'star',
      name: 'ستاره',
      svg: wrap(`
        <polygon points="60,26 66,48 90,52 72,68 78,92 60,78 42,92 48,68 30,52 54,48"
                 fill="url(#gold-star)" stroke="${GOLD_3}" stroke-width="1" stroke-linejoin="round"/>
        <circle cx="60" cy="60" r="3" fill="#0a0d1f"/>
      `, 'star')
    },
    flower: {
      id: 'flower',
      name: 'گل اسلیمی',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-flower)" stroke-width="1.8" stroke-linejoin="round">
          <path d="M60 38 q10 -10 20 0 q-10 10 -20 0 z"/>
          <path d="M60 38 q-10 -10 -20 0 q10 10 20 0 z"/>
          <path d="M60 60 q14 -4 18 8 q-14 8 -18 -8 z"/>
          <path d="M60 60 q-14 -4 -18 8 q14 8 18 -8 z"/>
          <path d="M52 82 q8 -6 16 0 q-8 6 -16 0 z"/>
          <path d="M60 60 v-16 M60 60 v22"/>
        </g>
        <circle cx="60" cy="60" r="3.5" fill="url(#gold-flower)"/>
      `, 'flower')
    },
    fire: {
      id: 'fire',
      name: 'آتش',
      svg: wrap(`
        <path d="M60 34 q6 12 4 18 q-2 6 -4 10 q-2 -4 -4 -10 q-2 -6 4 -18 z"
              fill="none" stroke="url(#gold-fire)" stroke-width="2" stroke-linejoin="round"/>
        <path d="M60 44 q10 12 8 22 q-2 10 -8 14 q-6 -4 -8 -14 q-2 -10 8 -22 z"
              fill="none" stroke="url(#gold-fire)" stroke-width="2" stroke-linejoin="round" opacity="0.85"/>
        <path d="M60 54 q8 10 6 18 q-2 8 -6 12 q-4 -4 -6 -12 q-2 -8 6 -18 z"
              fill="url(#gold-fire)" opacity="0.35"/>
      `, 'fire')
    },
    water: {
      id: 'water',
      name: 'آب',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-water)" stroke-width="2" stroke-linecap="round">
          <path d="M32 52 q10 -6 20 0 t20 0 t20 0"/>
          <path d="M32 68 q10 -6 20 0 t20 0 t20 0"/>
          <path d="M32 84 q10 -6 20 0 t20 0 t20 0"/>
        </g>
      `, 'water')
    },
    air: {
      id: 'air',
      name: 'باد',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-air)" stroke-width="2.2" stroke-linecap="round">
          <path d="M30 50 h40 q8 0 8 -6 q0 -6 -8 -6 q-4 0 -6 3"/>
          <path d="M30 64 h50 q10 0 10 -8"/>
          <path d="M30 78 h40 q12 0 12 10"/>
        </g>
      `, 'air')
    },
    earth: {
      id: 'earth',
      name: 'خاک',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-earth)" stroke-width="2" stroke-linejoin="round">
          <path d="M60 30 l26 20 l-10 34 h-32 l-10 -34 z"/>
          <path d="M60 44 l14 12 l-5 20 h-18 l-5 -20 z" stroke-width="1.4" opacity="0.85"/>
          <circle cx="60" cy="64" r="3" fill="url(#gold-earth)" stroke="none"/>
        </g>
      `, 'earth')
    },
    ankh: {
      id: 'ankh',
      name: 'آنخ',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-ankh)" stroke-width="2.4" stroke-linecap="round">
          <ellipse cx="60" cy="42" rx="12" ry="14"/>
          <line x1="60" y1="56" x2="60" y2="90"/>
          <line x1="42" y1="66" x2="78" y2="66"/>
        </g>
      `, 'ankh')
    },
    eye: {
      id: 'eye',
      name: 'چشم بصیرت',
      svg: wrap(`
        <path d="M28 60 q32 -26 64 0 q-32 26 -64 0 z"
              fill="none" stroke="url(#gold-eye)" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="60" cy="60" r="9" fill="none" stroke="url(#gold-eye)" stroke-width="1.6"/>
        <circle cx="60" cy="60" r="3.5" fill="url(#gold-eye)"/>
        <g stroke="${GOLD_3}" stroke-width="1" opacity="0.65">
          <line x1="60" y1="32" x2="60" y2="26"/>
          <line x1="80" y1="38" x2="84" y2="33"/>
          <line x1="40" y1="38" x2="36" y2="33"/>
        </g>
      `, 'eye')
    },
    knot: {
      id: 'knot',
      name: 'گره‌چینی',
      svg: wrap(`
        <g fill="none" stroke="url(#gold-knot)" stroke-width="1.8" stroke-linejoin="round">
          <path d="M60 28 l14 14 l14 -14 l-14 32 l14 32 l-14 -14 l-14 14 z"/>
          <path d="M60 28 l-14 14 l-14 -14 l14 32 l-14 32 l14 -14 l14 14 z"/>
        </g>
        <circle cx="60" cy="60" r="4" fill="url(#gold-knot)"/>
      `, 'knot')
    },
    yinyang: {
      id: 'yinyang',
      name: 'تعادل',
      svg: wrap(`
        <circle cx="60" cy="60" r="26" fill="none" stroke="url(#gold-yin)" stroke-width="2"/>
        <path d="M60 34 a26 26 0 0 1 0 52 a13 13 0 0 1 0 -26 a13 13 0 0 0 0 -26 z"
              fill="url(#gold-yin)"/>
        <circle cx="60" cy="47" r="3.5" fill="#0a0d1f"/>
        <circle cx="60" cy="73" r="3.5" fill="url(#gold-yin)"/>
      `, 'yinyang')
    }
  };

  function list() {
    return Object.values(AVATARS);
  }

  function get(id) {
    return AVATARS[id] || AVATARS.sun;
  }

  return { list, get };
})();