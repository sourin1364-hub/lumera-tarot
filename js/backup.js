/* =========================================================
   LUMERA · BACKUP ENGINE
   Encrypted backup & restore using AES-GCM (Web Crypto API)
   File format: .lumera
   ========================================================= */
window.LumeraBackup = (() => {
  'use strict';

  const MAGIC = 'LUMERA-BACKUP-V1';
  const PBKDF2_ITERATIONS = 100000;
  const SALT_LENGTH = 16;
  const IV_LENGTH = 12;

  /* ================= HELPERS ================= */
  function str2ab(str) {
    return new TextEncoder().encode(str);
  }

  function ab2str(buf) {
    return new TextDecoder().decode(buf);
  }

  function ab2base64(buf) {
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base642ab(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /* ================= KEY DERIVATION ================= */
  async function deriveKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      str2ab(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /* ================= COLLECT DATA ================= */
  function collectAllData() {
    const data = {
      _meta: {
        app: 'Lumera',
        version: '1.0',
        exportedAt: new Date().toISOString()
      },
      profile: null,
      history: null,
      achievements: null,
      natal: null,
      daily: null,
      onboarding: null
    };

    try {
      const raw = localStorage.getItem('lumera-user-v1');
      data.profile = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    try {
      const raw = localStorage.getItem('lumera-history-v1');
      data.history = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    try {
      const raw = localStorage.getItem('lumera-achievements-v1');
      data.achievements = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    try {
      const raw = localStorage.getItem('lumera-natal-v1');
      data.natal = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    try {
      const raw = localStorage.getItem('lumera-daily-v1');
      data.daily = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    try {
      data.onboarding = localStorage.getItem('lumera-onboarding-done-v1');
    } catch (_) {}

    return data;
  }

  /* ================= ENCRYPT ================= */
  async function encryptData(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      str2ab(plaintext)
    );

    const payload = {
      magic: MAGIC,
      salt: ab2base64(salt),
      iv: ab2base64(iv),
      data: ab2base64(ciphertext)
    };

    return JSON.stringify(payload, null, 2);
  }

  /* ================= DECRYPT ================= */
  async function decryptData(encryptedStr, password) {
    let payload;
    try {
      payload = JSON.parse(encryptedStr);
    } catch (_) {
      throw new Error('فایل بک‌آپ معتبر نیست');
    }

    if (payload.magic !== MAGIC) {
      throw new Error('فرمت فایل پشتیبانی نمی‌شود');
    }

    const salt = new Uint8Array(base642ab(payload.salt));
    const iv = new Uint8Array(base642ab(payload.iv));
    const ciphertext = base642ab(payload.data);

    const key = await deriveKey(password, salt);

    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
    } catch (_) {
      throw new Error('پسورد اشتباه است');
    }

    return ab2str(plaintext);
  }

  /* ================= EXPORT (Download .lumera) ================= */
  async function exportBackup(password) {
    if (!password || password.length < 6) {
      throw new Error('پسورد باید حداقل ۶ کاراکتر باشه');
    }

    const data = collectAllData();
    const plaintext = JSON.stringify(data);

    const encrypted = await encryptData(plaintext, password);

    // Create file with .lumera extension
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const filename = 'lumera-backup-' + new Date().toISOString().slice(0, 10) + '.lumera';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);

    return { ok: true, filename: filename };
  }

  /* ================= IMPORT (Restore from .lumera) ================= */
  async function importBackup(file, password) {
    if (!file) throw new Error('فایلی انتخاب نشده');
    if (!password) throw new Error('پسورد وارد نشده');

    const text = await file.text();

    const plaintext = await decryptData(text, password);

    let data;
    try {
      data = JSON.parse(plaintext);
    } catch (_) {
      throw new Error('محتوای فایل معتبر نیست');
    }

    // Restore to localStorage
    if (data.profile) {
      localStorage.setItem('lumera-user-v1', JSON.stringify(data.profile));
    }
    if (data.history) {
      localStorage.setItem('lumera-history-v1', JSON.stringify(data.history));
    }
    if (data.achievements) {
      localStorage.setItem('lumera-achievements-v1', JSON.stringify(data.achievements));
    }
    if (data.natal) {
      localStorage.setItem('lumera-natal-v1', JSON.stringify(data.natal));
    }
    if (data.daily) {
      localStorage.setItem('lumera-daily-v1', JSON.stringify(data.daily));
    }
    if (data.onboarding) {
      localStorage.setItem('lumera-onboarding-done-v1', data.onboarding);
    }

    return { ok: true, data: data };
  }

  /* ================= DELETE ALL ================= */
  function deleteAllData() {
    const keys = [
      'lumera-user-v1',
      'lumera-history-v1',
      'lumera-achievements-v1',
      'lumera-natal-v1',
      'lumera-daily-v1',
      'lumera-daily-notify-v1',
      'lumera-onboarding-done-v1',
      'lumera-first-visit'
    ];

    keys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    return { ok: true };
  }

  /* ================= PUBLIC API ================= */
  return {
    exportBackup: exportBackup,
    importBackup: importBackup,
    deleteAllData: deleteAllData,
    collectAllData: collectAllData
  };
})();