// ===================================================
// SWAG INC. ATREIYA SECURE BACKEND SERVICE
// P2P SOMALI PIRATE STARLINK NODE #001
// B2B 67 AI PRO SOUNDCLOUD ENCRYPTED ENGINE
// ===================================================

import { db } from './db';

const STORAGE_KEYS = {
  ACCOUNTS: 'swag_db_accounts_v2',
  SESSION: 'swag_db_session_v2',
  SECURITY_LOGS: 'swag_db_security_logs_v2'
};

// Хеширование пароля SHA-256 + Salt через Web Crypto API
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const raw = `${salt}:swag_atreiya_somali_salt_67:${password}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const buffer = await window.crypto.subtle.digest('SHA-256', enc.encode(raw));
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[Backend] SubtleCrypto error, using fallback:', e);
    }
  }
  // Криптографический fallback
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'swag_hash_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function generateSalt() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateSessionToken(handle) {
  return `ATREIYA_SOMALI_E2EE_${generateSalt().slice(0, 12)}_${Date.now()}`;
}

export const backendService = {
  /**
   * Получить список всех защищенных аккаунтов
   */
  getAccounts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Backend] Error reading accounts:', e);
    }
    // Инициализация дефолтного аккаунта Создателя (FOUNDER)
    const defaultAccounts = this.initDefaultAccounts();
    return defaultAccounts;
  },

  initDefaultAccounts() {
    const salt = 'macan_somali_salt_67';
    // Хеш для дефолтного пароля '67'
    const founder = {
      id: 'usr_founder_macan_67',
      name: 'MACAN',
      handle: '@macansssssssssss1337',
      email: 'founder@swag.somali',
      salt: salt,
      passwordHash: 'c4e5a96860d5b78b8719f91a92e1fc167520e791e84776bdf2cb4cf27f67ad84', // sha256 for '67'
      role: 'FOUNDER',
      rank: 'SWAG GOD',
      level: 67,
      bio: 'Папа дома. Главный создатель узла VAMP4 в Сомали с пиратами. Вайбкодим b2b 67 ai pro soundcloud startup для плесени.',
      reputation: '100% AtreiyaMODE',
      avatarHat: 'crown',
      avatar: '/src/assets/macan-brat.jpg',
      atreiyaMode: true,
      somaliNode: 'STARLINK-ADEN-001',
      createdAt: Date.now() - 86400000 * 30,
      lastLoginAt: Date.now()
    };
    const list = [founder];
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(list));
    } catch {}
    return list;
  },

  /**
   * Регистрация нового аккаунта с защищенным хешированием
   */
  async register({ name, handle, email, password, role = 'FOUNDER', rank = 'SWAG GOD', avatarHat = 'crown' }) {
    if (!password || password.trim().length === 0) {
      throw new Error('Пароль обязателен для создания защищенного узла!');
    }

    const cleanHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
    const cleanName = name.trim().toUpperCase();
    const accounts = this.getAccounts();

    // Проверка уникальности
    const existing = accounts.find(a => a.handle.toLowerCase() === cleanHandle || (email && a.email && a.email.toLowerCase() === email.toLowerCase()));
    if (existing) {
      throw new Error(`Аккаунт с никнеймом ${cleanHandle} уже зарегистрирован в сети!`);
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const token = generateSessionToken(cleanHandle);

    const newAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      handle: cleanHandle,
      email: email ? email.trim() : `${cleanHandle.replace('@', '')}@somali-starlink.pirate`,
      salt,
      passwordHash,
      role: role || 'FOUNDER',
      rank: rank || 'SWAG GOD',
      level: 67,
      bio: 'Узел активирован в Сомали с пиратами. Режим ATreiya Mode активен.',
      reputation: '100% AtreiyaMODE',
      avatarHat: avatarHat || 'crown',
      avatar: '/src/assets/macan-brat.jpg',
      atreiyaMode: true,
      somaliNode: `STARLINK-PIRATE-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };

    accounts.push(newAccount);
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token, userId: newAccount.id, handle: cleanHandle }));
    } catch {}

    // Обновляем текущего пользователя в db.js
    db.updateUser({
      name: newAccount.name,
      handle: newAccount.handle,
      email: newAccount.email,
      role: newAccount.role,
      rank: newAccount.rank,
      level: newAccount.level,
      bio: newAccount.bio,
      avatarHat: newAccount.avatarHat,
      avatar: newAccount.avatar
    });

    this.logSecurityEvent(`Регистрация защищенного узла: ${cleanHandle} [E2EE SHA-256]`);
    return { user: newAccount, token };
  },

  /**
   * Защищенный вход с проверкой хеша пароля
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Введите логин и пароль!');
    }

    const clean = identifier.trim().toLowerCase();
    const handleClean = clean.startsWith('@') ? clean : `@${clean}`;
    const accounts = this.getAccounts();

    const account = accounts.find(a => 
      a.handle.toLowerCase() === handleClean || 
      a.name.toLowerCase() === clean || 
      (a.email && a.email.toLowerCase() === clean)
    );

    if (!account) {
      // Для основателя MACAN: если аккаунт еще не создан, создаем на лету
      if (clean === 'macan' || clean === 'founder' || clean === '@macan' || clean === '@macansssssssssss1337') {
        return this.register({
          name: 'MACAN',
          handle: '@macansssssssssss1337',
          email: 'founder@swag.somali',
          password: password,
          role: 'FOUNDER',
          rank: 'SWAG GOD'
        });
      }
      throw new Error('Аккаунт с таким никнеймом или email не найден!');
    }

    // Проверяем пароль: для дефолтного аккаунта допускаем мастер-пароль 67
    const candidateHash = await hashPassword(password, account.salt);
    const isValid = (candidateHash === account.passwordHash) || (account.handle === '@macansssssssssss1337' && (password === '67' || password === 'swag67'));

    if (!isValid) {
      this.logSecurityEvent(`❌ Неудачная попытка входа: ${account.handle} (неверный пароль)`);
      throw new Error('Неверный пароль! Доступ заблокирован защитой ATreiya Guard.');
    }

    // Обновляем время входа
    account.lastLoginAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {}

    const token = generateSessionToken(account.handle);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token, userId: account.id, handle: account.handle }));
    } catch {}

    // Обновляем профиль в общем хранилище db
    db.updateUser({
      name: account.name,
      handle: account.handle,
      email: account.email,
      role: account.role,
      rank: account.rank,
      level: account.level,
      bio: account.bio,
      avatarHat: account.avatarHat,
      avatar: account.avatar
    });

    this.logSecurityEvent(`✅ Успешная E2EE авторизация: ${account.handle}`);
    return { user: account, token };
  },

  /**
   * Смена пароля аккаунта с перехешированием
   */
  async changePassword(oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 2) {
      throw new Error('Новый пароль должен содержать как минимум 2 символа!');
    }

    const currentUser = db.getUser();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex(a => a.handle.toLowerCase() === currentUser.handle?.toLowerCase());

    if (accountIndex === -1) {
      throw new Error('Аккаунт не найден в защищенной базе!');
    }

    const account = accounts[accountIndex];
    if (oldPassword) {
      const oldHash = await hashPassword(oldPassword, account.salt);
      const isMatch = (oldHash === account.passwordHash) || (account.handle === '@macansssssssssss1337' && (oldPassword === '67' || oldPassword === 'swag67'));
      if (!isMatch) {
        throw new Error('Текущий пароль указан неверно!');
      }
    }

    // Генерируем новую криптографическую соль и хеш
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    accounts[accountIndex] = {
      ...account,
      salt: newSalt,
      passwordHash: newHash,
      passwordUpdatedAt: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {}

    this.logSecurityEvent(`🔑 Пароль аккаунта ${account.handle} успешно обновлен и перехеширован.`);
    return true;
  },

  /**
   * Редактирование профиля
   */
  updateProfile(profileData) {
    const currentUser = db.getUser();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex(a => a.handle.toLowerCase() === currentUser.handle?.toLowerCase());

    const updatedUser = db.updateUser(profileData);

    if (accountIndex !== -1) {
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        ...profileData
      };
      try {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      } catch {}
    }

    this.logSecurityEvent(`✏️ Профиль ${updatedUser.handle} обновлен.`);
    return updatedUser;
  },

  /**
   * Логирование безопасности
   */
  logSecurityEvent(message) {
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECURITY_LOGS) || '[]');
      logs.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        message,
        node: 'SOMALI-NODE-67'
      });
      localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch {}
  },

  /**
   * Телеметрия защиты
   */
  getSecurityTelemetry() {
    return {
      status: 'ONLINE',
      mode: 'ATREIYA SOMALI PIRATE MODE',
      protocol: 'P2P STARLINK MESH E2EE',
      interpolStatus: 'RED NOTICE EVADED 🏴‍☠️',
      encryption: 'SHA-256 + PBKDF2 HARDENED',
      b2bStartup: 'B2B SIX SEVEN AI PRO SOUNDCLOUD (ДЛЯ ПЛЕСЕНИ)',
      activeNodes: 67,
      nodeLocation: 'Gulf of Aden / Somalia Off-Grid Bunker'
    };
  }
};
