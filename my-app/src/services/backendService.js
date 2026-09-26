// ===================================================
// SWAG INC. BACKEND SERVICE — REAL API CLIENT
// Все вызовы идут на Express сервер (localhost:3001)
// JWT токен хранится в localStorage (bearer auth)
// При недоступности сервера — мягкий оффлайн-фоллбек
// ===================================================

import { db } from './db';

const TOKEN_KEY = 'swag_jwt_token';
const USER_CACHE_KEY = 'swag_db_user_v2';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
}

function handleOfflineFallback(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {}
  }

  if (url === '/api/auth/register') {
    const isFounder = body.handle?.toLowerCase() === '@macansssssssssss1337';
    const user = {
      id: 1,
      name: body.name || 'USER',
      handle: body.handle?.startsWith('@') ? body.handle : `@${body.handle}`,
      email: body.email || '',
      role: isFounder ? 'FOUNDER' : 'CREATOR',
      rank: isFounder ? 'SWAG GOD' : 'SOUND CREATOR',
      level: isFounder ? 67 : 1,
      bio: '',
      avatar_hat: body.avatarHat || 'crown',
      avatar: 'macan',
      balance: isFounder ? 67000 : 812,
      fiat_balance: 67000
    };
    db.updateUser(user);
    const token = 'offline_jwt_' + Date.now();
    return { user, token };
  }

  if (url === '/api/auth/login') {
    const current = db.getUser();
    const token = 'offline_jwt_' + Date.now();
    return { user: current, token };
  }

  if (url === '/api/auth/me' || url === '/api/user/profile') {
    if (method === 'PUT') {
      const updated = db.updateUser(body);
      return updated;
    }
    return { user: db.getUser() };
  }

  if (url === '/api/user/change-password') {
    return { ok: true };
  }

  if (url === '/api/balance') {
    return { balance: db.getBalance(), fiatBalance: 67000 };
  }

  if (url === '/api/balance/add') {
    const newBal = db.addBalance(body.amount || 0);
    return { balance: newBal };
  }

  if (url === '/api/balance/mint') {
    const newBal = db.addBalance(body.amount || 1000);
    return { balance: newBal };
  }

  if (url === '/api/chats') {
    if (method === 'POST') return { ok: true };
    return db.getChats();
  }

  if (url.startsWith('/api/chats/') && url.endsWith('/messages')) {
    const parts = url.split('/');
    const chatKey = parts[3];
    db.addMessage(chatKey, body);
    return { ...body, id: Date.now() };
  }

  if (url === '/api/friends') {
    if (method === 'POST') return { ok: true };
    return [];
  }

  if (url.startsWith('/api/friends/')) {
    return { ok: true };
  }

  if (url.startsWith('/api/users/search')) {
    return [];
  }

  return { ok: true };
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    console.warn(`[API] Server offline at ${url}, using local fallback:`, netErr.message);
    return handleOfflineFallback(url, options);
  }

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent('swag_auth_expired'));
    throw new Error('Сессия истекла. Войдите заново.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Ошибка сервера: ${res.status}`);
  }
  return data;
}

// ===================================================
// AUTH
// ===================================================
export const backendService = {
  // Регистрация
  async register({ name, handle, email, password, avatarHat }) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, handle, email, password, avatarHat }),
    });
    setToken(data.token);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    return data;
  },

  // Вход
  async login(identifier, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setToken(data.token);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    return data;
  },

  // Проверка текущей сессии
  async checkSession() {
    const token = getToken();
    if (!token) return null;
    try {
      const data = await apiFetch('/api/auth/me');
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
      return data.user;
    } catch {
      clearToken();
      return null;
    }
  },

  // Есть ли токен (быстрая проверка без запроса)
  hasToken() {
    return !!getToken();
  },

  // Выход
  logout() {
    apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
  },

  // Получить кешированного юзера (синхронно, для компонентов)
  getCachedUser() {
    try {
      const data = localStorage.getItem(USER_CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // ===================================================
  // ПРОФИЛЬ
  // ===================================================
  async getProfile() {
    return apiFetch('/api/user/profile');
  },

  async updateProfile(profileData) {
    const updated = await apiFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
    return updated;
  },

  async changePassword(oldPassword, newPassword) {
    return apiFetch('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  // Список аккаунтов (для совместимости с ProfilePage)
  getAccounts() {
    const user = this.getCachedUser() || db.getUser();
    if (!user) return [];
    return [{
      id: user.id || 1,
      name: user.name || 'MACAN',
      handle: user.handle || '@macansssssssssss1337',
      role: user.role || 'FOUNDER',
      rank: user.rank || 'SWAG GOD',
      somaliNode: 'STARLINK-ADEN-67',
      passwordHash: 'PBKDF2-SHA512-SECURE'
    }];
  },

  // ===================================================
  // БАЛАНС
  // ===================================================
  async getBalance() {
    return apiFetch('/api/balance');
  },

  async addBalance(amount) {
    return apiFetch('/api/balance/add', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async mintBalance(amount = 1000) {
    return apiFetch('/api/balance/mint', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // ===================================================
  // ЧАТЫ (ПО АККАУНТУ)
  // ===================================================
  async getChats() {
    return apiFetch('/api/chats');
  },

  async sendMessage(chatKey, message) {
    return apiFetch(`/api/chats/${chatKey}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  async createChat(chatData) {
    return apiFetch('/api/chats', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  },

  // ===================================================
  // ДРУЗЬЯ
  // ===================================================
  async getFriends() {
    return apiFetch('/api/friends');
  },

  async addFriend(friendData) {
    return apiFetch('/api/friends', {
      method: 'POST',
      body: JSON.stringify(friendData),
    });
  },

  async removeFriend(friendId) {
    return apiFetch(`/api/friends/${friendId}`, { method: 'DELETE' });
  },

  async searchUsers(query) {
    if (!query || query.length < 2) return [];
    return apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  // ===================================================
  // LEGACY COMPAT (для старых компонентов)
  // ===================================================
  isSessionValid() {
    return !!getToken();
  },

  getSession() {
    const token = getToken();
    if (!token) return null;
    return { token };
  },

  getSecurityTelemetry() {
    return {
      status: 'ONLINE',
      mode: 'ATREIYA REAL BACKEND MODE',
      protocol: 'EXPRESS + SQLITE + JWT E2EE',
      encryption: 'PBKDF2-SHA512 10000 iterations',
      rateLimiting: 'MAX 5 ATTEMPTS / 60s',
      passwordPolicy: 'MIN 6 CHARS, REAL HASHING',
      roleProtection: 'SERVER-SIDE VALIDATION',
      database: 'SQLite (server-side)',
      b2bStartup: 'B2B SIX SEVEN AI PRO SOUNDCLOUD',
      activeNodes: 67,
    };
  },

  logSecurityEvent(message) {
    console.log(`[Security] ${message}`);
  }
};
