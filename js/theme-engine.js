/* =========================================================
   LUMERA · THEME ENGINE
   Applies elemental theme (water/fire/earth/air) based on
   the user's birth element, using inline SVG icons.
   ========================================================= */
window.LumeraTheme = (() => {
  'use strict';

  /* ================= SVG ICONS ================= */
  const SVG_ICONS = {
    water: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7ef0e0"/>
            <stop offset="100%" stop-color="#2aa8a0"/>
          </linearGradient>
        </defs>
        <path d="M32 6 C 20 24, 12 34, 12 44 a20 20 0 0 0 40 0 C 52 34, 44 24, 32 6 z"
              fill="url(#water-grad)" opacity="0.85"/>
        <path d="M22 42 q6 -8 12 -2 q6 6 12 -2"
              stroke="#e0fff8" stroke-width="1.6" fill="none" opacity="0.7"/>
        <path d="M24 50 q6 -6 12 0 q6 6 12 -2"
              stroke="#e0fff8" stroke-width="1.4" fill="none" opacity="0.5"/>
      </svg>
    `,
    fire: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <linearGradient id="fire-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffd98a"/>
            <stop offset="40%" stop-color="#ffb06b"/>
            <stop offset="100%" stop-color="#ff6b1a"/>
          </linearGradient>
        </defs>
        <path d="M32 6 q-6 12 -10 20 q-4 8 -4 14 a14 14 0 0 0 28 0 q0 -6 -4 -14 q-4 -8 -10 -20 z"
              fill="url(#fire-grad)" opacity="0.9"/>
        <path d="M32 20 q-4 10 -6 16 q-2 6 0 10 a8 8 0 0 0 12 0 q2 -4 0 -10 q-2 -6 -6 -16 z"
              fill="#fff2c9" opacity="0.6"/>
        <path d="M32 34 q-2 6 -3 9 a3 3 0 0 0 6 0 q-1 -3 -3 -9 z"
              fill="#fffaf0" opacity="0.85"/>
      </svg>
    `,
    earth: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <linearGradient id="earth-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d9a957"/>
            <stop offset="50%" stop-color="#8a5a2b"/>
            <stop offset="100%" stop-color="#3d2a10"/>
          </linearGradient>
        </defs>
        <path d="M8 52 L20 28 L30 42 L40 20 L56 52 Z"
              fill="url(#earth-grad)" opacity="0.9"/>
        <path d="M20 28 L26 38 L30 42 L24 42 Z" fill="#fff2c9" opacity="0.35"/>
        <path d="M40 20 L46 32 L40 32 Z" fill="#fff2c9" opacity="0.5"/>
        <path d="M8 52 L56 52 L56 56 L8 56 Z" fill="#5a3a1a" opacity="0.8"/>
      </svg>
    `,
    air: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <linearGradient id="air-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e8f0ff"/>
            <stop offset="100%" stop-color="#7aa8d9"/>
          </linearGradient>
        </defs>
        <path d="M6 24 h34 q6 0 6 -6 q0 -6 -6 -6 q-4 0 -5 3"
              stroke="url(#air-grad)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M6 36 h40 q8 0 8 -7"
              stroke="url(#air-grad)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M6 48 h34 q10 0 10 8"
              stroke="url(#air-grad)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      </svg>
    `
  };

  /* ================= ELEMENTS CONFIG ================= */
  const ELEMENTS = {
    'آب': {
      key: 'water',
      name: 'آب',
      icon: SVG_ICONS.water,
      colors: {
        bg0: '#05101a',
        bg1: '#0a2030',
        accent: '#5fe0d0',
        accent2: '#2aa8a0'
      }
    },
    'آتش': {
      key: 'fire',
      name: 'آتش',
      icon: SVG_ICONS.fire,
      colors: {
        bg0: '#1a0505',
        bg1: '#2a0a0a',
        accent: '#ffb06b',
        accent2: '#ff6b1a'
      }
    },
    'خاک': {
      key: 'earth',
      name: 'خاک',
      icon: SVG_ICONS.earth,
      colors: {
        bg0: '#0a0f0a',
        bg1: '#1a2a1a',
        accent: '#d9a957',
        accent2: '#8a5a2b'
      }
    },
    'هوا': {
      key: 'air',
      name: 'هوا',
      icon: SVG_ICONS.air,
      colors: {
        bg0: '#0a0f1a',
        bg1: '#1a2a4a',
        accent: '#a8c8e8',
        accent2: '#7aa8d9'
      }
    }
  };

  let currentElement = null;

  /* ================= APPLY THEME ================= */
   function apply(element) {
    if (!element || !ELEMENTS[element]) {
      document.body.classList.remove(
        'element-water', 'element-fire', 'element-earth', 'element-air'
      );
      currentElement = null;
      if (typeof LumeraBG !== 'undefined') LumeraBG.apply(null);
      return;
    }

    const config = ELEMENTS[element];

    document.body.classList.remove(
      'element-water', 'element-fire', 'element-earth', 'element-air'
    );

    document.body.classList.add(`element-${config.key}`);
    currentElement = config.key;

    const root = document.documentElement;
    root.style.setProperty('--elem-bg-0', config.colors.bg0);
    root.style.setProperty('--elem-bg-1', config.colors.bg1);
    root.style.setProperty('--elem-accent', config.colors.accent);
    root.style.setProperty('--elem-accent-2', config.colors.accent2);

    // ✅ Trigger canvas animation
    if (typeof LumeraBG !== 'undefined') {
      LumeraBG.apply(element);
    }
  }
  function applyFromProfile() {
    try {
      const profile = LumeraUser.loadProfile();
      if (profile.element) {
        apply(profile.element);
      }
    } catch (_) {}
  }

  /* ================= PUBLIC API ================= */
  function getCurrent() {
    return currentElement;
  }

  function list() {
    return Object.values(ELEMENTS);
  }

  function getConfig(elementName) {
    return ELEMENTS[elementName] || null;
  }

  function getIcon(elementName) {
    const config = ELEMENTS[elementName];
    return config ? config.icon : '';
  }

  return {
    apply,
    applyFromProfile,
    getCurrent,
    list,
    getConfig,
    getIcon,
    ELEMENTS
  };
})();