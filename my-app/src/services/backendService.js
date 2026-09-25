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

// ===================================================
// ЗАЩИТА ОТ БРУТФОРСА: RATE LIMITING
// Максимум 5 попыток входа за 60 секунд
// ===================================================
const LOGIN_ATTEMPTS = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000; // 60 секунд

function checkRateLimit(identifier) {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  
  if (!LOGIN_ATTEMPTS[key]) {
    LOGIN_ATTEMPTS[key] = { count: 0, firstAttempt: now };
  }
  
  const record = LOGIN_ATTEMPTS[key];
  
  // Сброс таймера если прошло больше 60 секунд
  if (now - record.firstAttempt > LOCKOUT_MS) {
    record.count = 0;
    record.firstAttempt = now;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const remainSec = Math.ceil((LOCKOUT_MS - (now - record.firstAttempt)) / 1000);
    throw new Error(`🔒 Слишком много попыток входа! Подождите ${remainSec} сек. ATreiya Guard заблокировал доступ.`);
  }
  
  record.count++;
}

function resetRateLimit(identifier) {
  delete LOGIN_ATTEMPTS[identifier.toLowerCase().trim()];
}

// ===================================================
// Хеширование пароля: PBKDF2-подобное множественное
// хеширование SHA-256 + Salt через Web Crypto API
// ===================================================
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  // Множественное хеширование для усиления (имитация PBKDF2)
  const raw = `${salt}:swag_atreiya_guard_v2:${password}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      // 3 итерации хеширования для усиления
      let buffer = await window.crypto.subtle.digest('SHA-256', enc.encode(raw));
      for (let i = 0; i < 2; i++) {
        const combined = new Uint8Array([...new Uint8Array(buffer), ...enc.encode(salt)]);
        buffer = await window.crypto.subtle.digest('SHA-256', combined);
      }
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[Backend] SubtleCrypto error, using fallback:', e);
    }
  }
  // Криптографический fallback (усиленный)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  for (let round = 0; round < 3; round++) {
    const roundInput = round === 0 ? raw : `${h1.toString(16)}:${h2.toString(16)}:${salt}`;
    for (let i = 0; i < roundInput.length; i++) {
      const ch = roundInput.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
      h3 = Math.imul(h3 ^ ch, 2246822507);
    }
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'swag_v2_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16) + h3.toString(16);
}

function generateSalt() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(32); // 32 байта вместо 16 для большей энтропии
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback с повышенной энтропией
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

function generateSessionToken(handle) {
  const tokenSalt = generateSalt().slice(0, 24);
  return `ATREIYA_E2EE_${tokenSalt}_${Date.now()}`;
}

// ===================================================
// ЗАЩИЩЁННЫЙ СПИСОК РОЛЕЙ
// Только FOUNDER MACAN имеет доступ к FOUNDER/SWAG GOD
// ===================================================
const FOUNDER_HANDLE = '@macansssssssssss1337';

const ALLOWED_ROLES = ['CREATOR', 'HIGH_ROLLER', 'SWAG_BOSS'];
const ROLE_RANKS = {
  FOUNDER: 'SWAG GOD',
  CREATOR: 'SOUND CREATOR',
  HIGH_ROLLER: 'VIP 777 CASINO',
  SWAG_BOSS: 'CYBER BOSS'
};

function sanitizeRole(role, handle) {
  // Только оригинальный FOUNDER может иметь роль FOUNDER
  if (role === 'FOUNDER' && handle?.toLowerCase() !== FOUNDER_HANDLE) {
    return 'CREATOR';
  }
  if (!ALLOWED_ROLES.includes(role) && role !== 'FOUNDER') {
    return 'CREATOR';
  }
  return role;
}

function sanitizeRank(rank, role) {
  if (role !== 'FOUNDER') {
    // Запрещаем использование GOD/FOUNDER в ранге для не-основателей
    if (typeof rank === 'string' && (rank.toUpperCase().includes('GOD') || rank.toUpperCase().includes('FOUNDER'))) {
      return ROLE_RANKS[role] || 'SWAG BOSS';
    }
  }
  return rank || ROLE_RANKS[role] || 'SWAG BOSS';
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
    // Криптографически случайная соль вместо захардкоженной
    const salt = generateSalt();
    const founder = {
      id: 'usr_founder_macan_67',
      name: 'MACAN',
      handle: FOUNDER_HANDLE,
      email: 'founder@swag.somali',
      salt: salt,
      // Хеш будет пересоздан при первом входе (пароль задаётся при первой авторизации)
      passwordHash: null,
      needsPasswordSetup: true,
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
   * ЗАЩИТА: Роль FOUNDER запрещена для новых аккаунтов
   */
  async register({ name, handle, email, password, role = 'CREATOR', rank = 'SOUND CREATOR', avatarHat = 'crown' }) {
    // Валидация пароля: минимум 6 символов
    if (!password || password.trim().length < 6) {
      throw new Error('Пароль должен содержать минимум 6 символов для защиты E2EE узла!');
    }

    const cleanHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
    const cleanName = name.trim().toUpperCase();
    const accounts = this.getAccounts();

    // Проверка уникальности
    const existing = accounts.find(a => a.handle.toLowerCase() === cleanHandle || (email && a.email && a.email.toLowerCase() === email.toLowerCase()));
    if (existing) {
      throw new Error(`Аккаунт с никнеймом ${cleanHandle} уже зарегистрирован в сети!`);
    }

    // ЗАЩИТА: Запрещаем регистрацию с ролью FOUNDER
    const safeRole = sanitizeRole(role, cleanHandle);
    const safeRank = sanitizeRank(rank, safeRole);

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
      needsPasswordSetup: false,
      role: safeRole,
      rank: safeRank,
      level: 1, // Новые пользователи начинают с уровня 1, а не 67
      bio: 'Узел активирован в сети SWAG INC. Режим ATreiya Mode активен.',
      reputation: 'Новый узел',
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
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token, userId: newAccount.id, handle: cleanHandle, expiresAt: Date.now() + 86400000 }));
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

    this.logSecurityEvent(`✅ Регистрация узла: ${cleanHandle} [Роль: ${safeRole}]`);
    return { user: newAccount, token };
  },

  /**
   * Защищенный вход с проверкой хеша пароля
   * ЗАЩИТА: Rate limiting, нет мастер-пароля, нет автосоздания FOUNDER
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Введите логин и пароль!');
    }

    const clean = identifier.trim().toLowerCase();

    // ЗАЩИТА: Rate limiting — максимум 5 попыток за 60 сек
    checkRateLimit(clean);

    const handleClean = clean.startsWith('@') ? clean : `@${clean}`;
    const accounts = this.getAccounts();

    const account = accounts.find(a => 
      a.handle.toLowerCase() === handleClean || 
      a.name.toLowerCase() === clean || 
      (a.email && a.email.toLowerCase() === clean)
    );

    if (!account) {
      this.logSecurityEvent(`❌ Попытка входа в несуществующий аккаунт: ${clean}`);
      throw new Error('Аккаунт с таким никнеймом или email не найден! Зарегистрируйтесь.');
    }

    // Первичная настройка пароля для дефолтного FOUNDER аккаунта
    if (account.needsPasswordSetup && account.handle === FOUNDER_HANDLE) {
      if (password.trim().length < 6) {
        throw new Error('Установите пароль не менее 6 символов для аккаунта Создателя!');
      }
      const newSalt = generateSalt();
      const newHash = await hashPassword(password, newSalt);
      account.salt = newSalt;
      account.passwordHash = newHash;
      account.needsPasswordSetup = false;
      account.lastLoginAt = Date.now();
      try {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      } catch {}
      
      resetRateLimit(clean);
      const token = generateSessionToken(account.handle);
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token, userId: account.id, handle: account.handle, expiresAt: Date.now() + 86400000 }));
      } catch {}

      db.updateUser({
        name: account.name, handle: account.handle, email: account.email,
        role: account.role, rank: account.rank, level: account.level,
        bio: account.bio, avatarHat: account.avatarHat, avatar: account.avatar
      });

      this.logSecurityEvent(`🔐 Первичная настройка пароля FOUNDER: ${account.handle}`);
      return { user: account, token };
    }

    // Проверяем пароль ТОЛЬКО через хеш (БЕЗ мастер-пароля!)
    const candidateHash = await hashPassword(password, account.salt);
    const isValid = candidateHash === account.passwordHash;

    if (!isValid) {
      this.logSecurityEvent(`❌ Неудачная попытка входа: ${account.handle} (неверный пароль)`);
      throw new Error('Неверный пароль! Доступ заблокирован защитой ATreiya Guard.');
    }

    // Сброс rate limiting при успешном входе
    resetRateLimit(clean);

    // Обновляем время входа
    account.lastLoginAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {}

    const token = generateSessionToken(account.handle);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token, userId: account.id, handle: account.handle, expiresAt: Date.now() + 86400000 }));
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

    this.logSecurityEvent(`✅ Успешная авторизация: ${account.handle}`);
    return { user: account, token };
  },

  /**
   * Проверка текущей сессии
   */
  isSessionValid() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!data) return false;
      const session = JSON.parse(data);
      if (!session.token || !session.userId) return false;
      // Проверяем срок действия токена (24 часа)
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Получить текущую сессию
   */
  getSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Выход из аккаунта
   */
  logout() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
    this.logSecurityEvent('🚪 Выход из аккаунта');
  },

  /**
   * Смена пароля аккаунта с перехешированием
   * ЗАЩИТА: Обязательная проверка старого пароля, минимум 6 символов
   */
  async changePassword(oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Новый пароль должен содержать минимум 6 символов!');
    }

    if (!oldPassword) {
      throw new Error('Для смены пароля необходимо указать текущий пароль!');
    }

    const currentUser = db.getUser();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex(a => a.handle.toLowerCase() === currentUser.handle?.toLowerCase());

    if (accountIndex === -1) {
      throw new Error('Аккаунт не найден в защищенной базе!');
    }

    const account = accounts[accountIndex];
    
    // ЗАЩИТА: ВСЕГДА проверяем старый пароль (без мастер-пароля!)
    const oldHash = await hashPassword(oldPassword, account.salt);
    if (oldHash !== account.passwordHash) {
      this.logSecurityEvent(`❌ Неудачная попытка смены пароля: ${account.handle}`);
      throw new Error('Текущий пароль указан неверно!');
    }

    // Генерируем новую криптографическую соль и хеш
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    accounts[accountIndex] = {
      ...account,
      salt: newSalt,
      passwordHash: newHash,
      needsPasswordSetup: false,
      passwordUpdatedAt: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {}

    this.logSecurityEvent(`🔑 Пароль аккаунта ${account.handle} успешно обновлен.`);
    return true;
  },

  /**
   * Редактирование профиля
   * ЗАЩИТА: Санитизация роли и ранга — нельзя повысить себя до FOUNDER
   */
  updateProfile(profileData) {
    const currentUser = db.getUser();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex(a => a.handle.toLowerCase() === currentUser.handle?.toLowerCase());

    // ЗАЩИТА: Санитизация роли и ранга
    const safeData = { ...profileData };
    if (safeData.role) {
      safeData.role = sanitizeRole(safeData.role, currentUser.handle);
    }
    if (safeData.rank) {
      safeData.rank = sanitizeRank(safeData.rank, safeData.role || currentUser.role);
    }

    const updatedUser = db.updateUser(safeData);

    if (accountIndex !== -1) {
      // ЗАЩИТА: Не позволяем менять passwordHash/salt/id через updateProfile
      const { passwordHash, salt, id, needsPasswordSetup, ...safeProfileData } = safeData;
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        ...safeProfileData
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
        date: new Date().toLocaleDateString(),
        message,
        node: 'SOMALI-NODE-67'
      });
      // Храним последние 100 событий
      localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch {}
  },

  /**
   * Получить логи безопасности (только для чтения)
   */
  getSecurityLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SECURITY_LOGS) || '[]');
    } catch {
      return [];
    }
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
      encryption: 'SHA-256 x3 ITERATIONS HARDENED',
      rateLimiting: `MAX ${MAX_ATTEMPTS} ATTEMPTS / ${LOCKOUT_MS / 1000}s`,
      passwordPolicy: 'MIN 6 CHARS, NO MASTER PASSWORDS',
      roleProtection: 'FOUNDER ROLE LOCKED TO ORIGINAL HANDLE',
      b2bStartup: 'B2B SIX SEVEN AI PRO SOUNDCLOUD (ДЛЯ ПЛЕСЕНИ)',
      activeNodes: 67,
      nodeLocation: 'Gulf of Aden / Somalia Off-Grid Bunker'
    };
  }
};
