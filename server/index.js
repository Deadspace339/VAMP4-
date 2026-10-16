// ===================================================
// SWAG INC. VAMP 4 — REAL BACKEND SERVER [HARDENED]
// Express + SQLite (sql.js) + JWT Auth + Zero-Trust Gateway
// ===================================================
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Attempt to load .env natively (Node.js 20+) from root, server, or my-app
try {
  const serverEnv = path.resolve(__dirname, '.env');
  const rootEnv = path.resolve(__dirname, '../.env');
  const myAppEnv = path.resolve(__dirname, '../my-app/.env');
  if (fs.existsSync(serverEnv)) {
    process.loadEnvFile(serverEnv);
  } else if (fs.existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  } else if (fs.existsSync(myAppEnv)) {
    process.loadEnvFile(myAppEnv);
  }
} catch {
  // Silent fallback if loadEnvFile is unavailable
}

const app = express();
app.set('trust proxy', 1); // Trust first hop reverse proxy (Vercel/Nginx)

const PORT = process.env.PORT || 3001;
const JWT_EXPIRES = '7d';
const FOUNDER_HANDLE = '@macansssssssssss1337';
const FOUNDER_INVITE_CODE = process.env.FOUNDER_INVITE_CODE || 'swag_founder_master_key_777';

// Cryptographically secure JWT secret handling
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'swag_vamp4_atreiya_somali_secret_67') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be explicitly configured in production!');
    process.exit(1);
  } else {
    console.warn('⚠️ [SECURITY] JWT_SECRET missing or default. Generating secure ephemeral key for this session.');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
  }
}

// Security: restrict CORS to known origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://localhost:4173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked by SWAG INC. security policy'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Serve static assets from my-app/public/assets
app.use('/assets', express.static(path.join(__dirname, '../my-app/public/assets')));

// Helper to normalize avatar keys to valid asset paths
function normalizeAvatar(avatar, keyOrName = '') {
  if (!avatar) return '/assets/macan-brat.jpg';
  const a = String(avatar).toLowerCase().trim();
  const k = String(keyOrName).toLowerCase().trim();
  if (a === 'shield' || a === 'jarvis' || a.includes('plashka2') || k.includes('jarvis') || k.includes('shield')) return '/assets/plashka2.png';
  if (a === 'crown' || a === 'admin' || a === 'official' || a.includes('plashka.png') || a.includes('plashka.jpg') || k.includes('swag') || k.includes('official') || k.includes('admin')) return '/assets/plashka.png';
  if (a === 'radio' || a === 'market' || a === 'dark-market' || a.includes('plashka3') || k.includes('dark') || k.includes('market') || k.includes('deal') || k.includes('auction')) return '/assets/plashka3.png';
  if (a === 'macan' || a === 'default' || a.includes('macan-brat') || k.includes('macan')) return '/assets/macan-brat.jpg';
  return avatar;
}

// Validator to ensure avatar is safe from dangerous schemes (XSS, script injection)
function isSafeAvatar(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.includes('<script')) return false;
  if (trimmed.startsWith('/assets/') || trimmed.startsWith('/src/assets/')) return true;
  if (trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('data:image/png;') || trimmed.startsWith('data:image/jpeg;') || trimmed.startsWith('data:image/jpg;') || trimmed.startsWith('data:image/webp;')) return true;
  if (trimmed.startsWith('data:image/svg+xml;') && !trimmed.includes('<script') && !trimmed.includes('onerror=')) return true;
  return false;
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Memory-safe global rate limiter with periodic garbage collection
const ipHits = new Map();
const loginAttempts = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of ipHits.entries()) {
    if (now - rec.start > 60000) ipHits.delete(ip);
  }
  for (const [key, rec] of loginAttempts.entries()) {
    if (now - rec.first > 60000) loginAttempts.delete(key);
  }
}, 300000); // Clean every 5 minutes

app.use((req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = ipHits.get(ip) || { count: 0, start: now };
  if (now - rec.start > 60000) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count++;
  ipHits.set(ip, rec);

  // Prevent memory exhaustion under flood
  if (ipHits.size > 10000) {
    const oldestKey = ipHits.keys().next().value;
    ipHits.delete(oldestKey);
  }

  if (rec.count > 120) {
    return res.status(429).json({ error: 'Слишком много запросов. Подождите.' });
  }
  next();
});

// ===================================================
// DATABASE SETUP (sql.js — pure JS SQLite via WASM)
// ===================================================
let db;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'swag.db');

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      email TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT DEFAULT 'CREATOR',
      rank TEXT DEFAULT 'SOUND CREATOR',
      level INTEGER DEFAULT 1,
      bio TEXT DEFAULT '',
      avatar_hat TEXT DEFAULT 'crown',
      avatar TEXT DEFAULT 'macan',
      balance INTEGER DEFAULT 812,
      fiat_balance INTEGER DEFAULT 67000,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_key TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'dm',
      is_bot INTEGER DEFAULT 0,
      online INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      avatar TEXT DEFAULT 'macan',
      status_text TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, chat_key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      is_me INTEGER DEFAULT 0,
      type TEXT DEFAULT 'text',
      text TEXT DEFAULT '',
      file_name TEXT,
      audio_src TEXT,
      duration TEXT,
      time_str TEXT DEFAULT '',
      reactions TEXT DEFAULT '{}',
      my_reaction TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_name TEXT NOT NULL,
      friend_handle TEXT NOT NULL,
      friend_avatar TEXT DEFAULT 'macan',
      status_text TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      online INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      chips INTEGER DEFAULT 25000,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_handle),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migrate legacy avatar aliases to static paths
  try {
    db.run("UPDATE chats SET avatar='/assets/plashka2.png' WHERE avatar='shield' OR chat_key='jarvis'");
    db.run("UPDATE chats SET avatar='/assets/macan-brat.jpg' WHERE avatar='macan' OR chat_key='macan'");
    db.run("UPDATE chats SET avatar='/assets/plashka.png' WHERE avatar='crown' OR chat_key='swag-channel'");
    db.run("UPDATE chats SET avatar='/assets/plashka3.png' WHERE avatar='radio' OR chat_key='dark-market'");
    db.run("UPDATE users SET avatar='/assets/macan-brat.jpg' WHERE avatar='macan' OR avatar IS NULL OR avatar=''");
    db.run("UPDATE friends SET friend_avatar='/assets/macan-brat.jpg' WHERE friend_avatar='macan' OR friend_avatar IS NULL OR friend_avatar=''");
  } catch (err) {
    console.warn('DB migration warning:', err);
  }

  saveDB();
  console.log('💾 SQLite database initialized & avatar keys migrated');
}

function saveDB() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  } catch (e) {
    console.error('DB save error:', e);
  }
}

// Auto-save every 30 seconds
setInterval(saveDB, 30000);

// ===================================================
// CRYPTO HELPERS (PBKDF2 100k iters + auto-migration)
// ===================================================
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_LEGACY_ITERATIONS = 10000;

function hashPwd(password, salt, iterations = PBKDF2_ITERATIONS) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function genSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function genToken(user) {
  return jwt.sign({ id: user.id, handle: user.handle, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Пароль должен быть от 8 до 128 символов!';
  }
  if (!/[0-9]/.test(password) || !/[a-zA-Zа-яА-ЯёЁ]/.test(password)) {
    return 'Пароль должен содержать как минимум одну букву и одну цифру!';
  }
  return null;
}

// ===================================================
// AUTH MIDDLEWARE
// ===================================================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Не авторизован' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Токен истёк или недействителен' });
  }
}

function founderOnly(req, res, next) {
  if (req.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Только для FOUNDER' });
  next();
}

// ===================================================
// HELPER: database queries
// ===================================================
function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// ===================================================
// CREATE DEFAULT CHATS FOR NEW USER
// ===================================================
function createDefaultChats(userId) {
  const chats = [
    { key: 'jarvis', name: '🤖 J.A.R.V.I.S.', type: 'bot', is_bot: 1, online: 1, verified: 1, avatar: '/assets/plashka2.png', status: 'Gemini 2.5 Flash • E2EE Guard' },
    { key: 'macan', name: 'MACAN (Брат)', type: 'dm', is_bot: 0, online: 1, verified: 1, avatar: '/assets/macan-brat.jpg', status: 'в сети (Porsche Studio)' },
    { key: 'swag-channel', name: '🔥 SWAG INC. OFFICIAL', type: 'channel', is_bot: 0, online: 1, verified: 1, avatar: '/assets/plashka.png', status: '13 420 участников' },
    { key: 'dark-market', name: '💀 DEALS & AUCTIONS', type: 'channel', is_bot: 0, online: 0, verified: 0, avatar: '/assets/plashka3.png', status: '8 910 участников' }
  ];
  
  const defaultMessages = {
    'jarvis': [
      { sender: 'J.A.R.V.I.S.', is_me: 0, text: 'Добро пожаловать в защищённый командный центр, сэр. Все системы SWAG INC. под контролем. Готов к выполнению директив.', time: '01:10', reactions: '{"🦾":1,"⚡":2}', my_reaction: '⚡' }
    ],
    'macan': [
      { sender: 'MACAN', is_me: 0, text: 'Салют, создатель! Готовим мощный релиз на маркете. Будет жара! 🔥', time: '00:18', reactions: '{"👑":2}', my_reaction: null },
      { sender: 'MACAN', is_me: 0, text: 'Брат, трек Летник заценил? Под него слоты крутить — совсем другой вайб 🤝', time: '00:20', reactions: '{"⚡":2}', my_reaction: null }
    ],
    'swag-channel': [
      { sender: 'Admin', is_me: 0, text: '🎰 Запущен протокол Web 4.0 Казино! Gates of SWAGUS™ теперь доступен для всех узлов.', time: '18:40', reactions: '{"🔥":28,"🚀":14}', my_reaction: null }
    ],
    'dark-market': [
      { sender: 'CyberBroker', is_me: 0, text: '💀 Продан лот #67: Neon Matrix Helmet за 1500 SWAG. Следующий аукцион через 2 часа.', time: '14:02', reactions: '{"💀":8}', my_reaction: null }
    ]
  };

  for (const c of chats) {
    db.run(
      'INSERT OR IGNORE INTO chats (chat_key, user_id, name, type, is_bot, online, verified, avatar, status_text) VALUES (?,?,?,?,?,?,?,?,?)',
      [c.key, userId, c.name, c.type, c.is_bot, c.online, c.verified, c.avatar, c.status]
    );
    const chatRow = getOne('SELECT id FROM chats WHERE user_id=? AND chat_key=?', [userId, c.key]);
    if (chatRow && defaultMessages[c.key]) {
      for (const m of defaultMessages[c.key]) {
        db.run(
          'INSERT INTO messages (chat_id, sender, is_me, type, text, time_str, reactions, my_reaction) VALUES (?,?,?,?,?,?,?,?)',
          [chatRow.id, m.sender, m.is_me, 'text', m.text, m.time, m.reactions, m.my_reaction]
        );
      }
    }
  }
  saveDB();
}

// ===================================================
// AUTH ROUTES
// ===================================================

// REGISTER [PROTECTED AGAINST PRIVILEGE ESCALATION]
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, handle, email, password, avatarHat, founderCode, founderInviteCode } = req.body;
    if (!name || !handle || !password) return res.status(400).json({ error: 'Имя, никнейм и пароль обязательны!' });
    if (typeof name !== 'string' || name.length > 50) return res.status(400).json({ error: 'Имя максимум 50 символов' });
    if (typeof handle !== 'string' || handle.length > 30) return res.status(400).json({ error: 'Хэндл максимум 30 символов' });

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const cleanHandle = handle.startsWith('@') ? handle.toLowerCase().trim() : `@${handle.toLowerCase().trim()}`;
    const cleanName = name.trim().toUpperCase();

    const existing = getOne('SELECT id FROM users WHERE handle=?', [cleanHandle]);
    if (existing) return res.status(409).json({ error: `Никнейм ${cleanHandle} уже занят!` });

    // Privilege escalation defense: registration of FOUNDER requires master code
    const isTargetingFounder = cleanHandle === FOUNDER_HANDLE;
    if (isTargetingFounder) {
      const submittedCode = String(founderCode || founderInviteCode || '').trim();
      if (!submittedCode || submittedCode !== FOUNDER_INVITE_CODE) {
        return res.status(403).json({ 
          error: 'Никнейм @macansssssssssss1337 зарезервирован для Создателя. Необходим валидный секретный код основателя.' 
        });
      }
    }

    const salt = genSalt();
    const hash = hashPwd(password, salt, PBKDF2_ITERATIONS);
    const role = isTargetingFounder ? 'FOUNDER' : 'CREATOR';
    const rank = isTargetingFounder ? 'SWAG GOD' : 'SOUND CREATOR';
    const level = isTargetingFounder ? 67 : 1;

    db.run(
      'INSERT INTO users (name, handle, email, password_hash, salt, role, rank, level, bio, avatar_hat, avatar, balance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [cleanName, cleanHandle, email || '', hash, salt, role, rank, level, '', avatarHat || 'crown', 'macan', isTargetingFounder ? 67000 : 812]
    );

    const user = getOne('SELECT * FROM users WHERE handle=?', [cleanHandle]);
    createDefaultChats(user.id);

    const token = genToken(user);
    const { password_hash, salt: s, ...safeUser } = user;
    safeUser.avatar = normalizeAvatar(safeUser.avatar, safeUser.name);
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// LOGIN [WITH PBKDF2 AUTO-MIGRATION]
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Введите логин и пароль!' });

    const clean = identifier.trim().toLowerCase();
    
    // Rate limiting with map
    const now = Date.now();
    const rec = loginAttempts.get(clean) || { count: 0, first: now };
    if (now - rec.first > 60000) {
      rec.count = 0;
      rec.first = now;
    }
    if (rec.count >= 5) {
      const wait = Math.ceil((60000 - (now - rec.first)) / 1000);
      return res.status(429).json({ error: `Слишком много попыток! Подождите ${wait} сек.` });
    }
    rec.count++;
    loginAttempts.set(clean, rec);

    const handleClean = clean.startsWith('@') ? clean : `@${clean}`;
    const user = getOne(
      'SELECT * FROM users WHERE handle=? OR LOWER(name)=? OR LOWER(email)=?',
      [handleClean, clean, clean]
    );

    if (!user) return res.status(404).json({ error: 'Аккаунт не найден! Зарегистрируйтесь.' });

    // Validate using 100,000 iterations first
    const candidateHash100k = hashPwd(password, user.salt, PBKDF2_ITERATIONS);
    let isPasswordValid = candidateHash100k === user.password_hash;

    // Check legacy 10,000 iterations for backward compatibility and auto-upgrade
    if (!isPasswordValid) {
      const candidateHashLegacy = hashPwd(password, user.salt, PBKDF2_LEGACY_ITERATIONS);
      if (candidateHashLegacy === user.password_hash) {
        isPasswordValid = true;
        // Transparent auto-upgrade to 100,000 iterations
        const newSalt = genSalt();
        const upgradedHash = hashPwd(password, newSalt, PBKDF2_ITERATIONS);
        db.run('UPDATE users SET password_hash=?, salt=? WHERE id=?', [upgradedHash, newSalt, user.id]);
        saveDB();
        user.salt = newSalt;
        user.password_hash = upgradedHash;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный пароль!' });
    }

    loginAttempts.delete(clean);
    db.run('UPDATE users SET last_login=datetime("now") WHERE id=?', [user.id]);
    saveDB();

    const token = genToken(user);
    const { password_hash, salt, ...safeUser } = user;
    safeUser.avatar = normalizeAvatar(safeUser.avatar, safeUser.name);
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// CHECK SESSION
app.get('/api/auth/me', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password_hash, salt, ...safeUser } = user;
  safeUser.avatar = normalizeAvatar(safeUser.avatar, safeUser.name);
  res.json({ user: safeUser });
});

// LOGOUT (client-side, acknowledge)
app.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

// ===================================================
// USER PROFILE ROUTES [IMMUTABLE ROLES & INPUT SANITATION]
// ===================================================
app.get('/api/user/profile', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  const { password_hash, salt, ...safeUser } = user;
  safeUser.avatar = normalizeAvatar(safeUser.avatar, safeUser.name);
  res.json(safeUser);
});

app.put('/api/user/profile', auth, (req, res) => {
  const { name, bio, avatar_hat, avatar } = req.body;
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Не найден' });

  // Security: level and role cannot be modified by user via profile PUT
  const safeName = typeof name === 'string' ? name.trim().slice(0, 50) : user.name;
  const safeBio = typeof bio === 'string' ? bio.slice(0, 500) : user.bio;
  const safeHat = ['crown', 'five_plus', 'odnoklassniki', 'none'].includes(avatar_hat) ? avatar_hat : user.avatar_hat;

  let safeAvatar = user.avatar;
  if (avatar && isSafeAvatar(avatar)) {
    safeAvatar = avatar;
  }

  db.run(
    'UPDATE users SET name=?, bio=?, avatar_hat=?, avatar=? WHERE id=?',
    [safeName, safeBio, safeHat, safeAvatar, req.user.id]
  );
  saveDB();

  const updated = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  const { password_hash, salt, ...safeUser } = updated;
  safeUser.avatar = normalizeAvatar(safeUser.avatar, safeUser.name);
  res.json(safeUser);
});

app.post('/api/user/change-password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Оба пароля обязательны' });

  const policyErr = validatePasswordPolicy(newPassword);
  if (policyErr) return res.status(400).json({ error: policyErr });

  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  
  // Verify current password with both current and legacy iterations
  const oldHash100k = hashPwd(oldPassword, user.salt, PBKDF2_ITERATIONS);
  const oldHashLegacy = hashPwd(oldPassword, user.salt, PBKDF2_LEGACY_ITERATIONS);
  if (oldHash100k !== user.password_hash && oldHashLegacy !== user.password_hash) {
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  }

  const newSalt = genSalt();
  const newHash = hashPwd(newPassword, newSalt, PBKDF2_ITERATIONS);
  db.run('UPDATE users SET password_hash=?, salt=? WHERE id=?', [newHash, newSalt, req.user.id]);
  saveDB();
  res.json({ ok: true });
});

// ===================================================
// BALANCE ROUTES
// ===================================================
app.get('/api/balance', auth, (req, res) => {
  const user = getOne('SELECT balance, fiat_balance FROM users WHERE id=?', [req.user.id]);
  res.json({ balance: user.balance, fiatBalance: user.fiat_balance });
});

app.post('/api/balance/add', auth, (req, res) => {
  const { amount } = req.body;
  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount)) return res.status(400).json({ error: 'Некорректная сумма' });

  // Security: only allow negative amounts (spending) — no free money
  if (parsedAmount > 0) return res.status(403).json({ error: 'Пополнение доступно только через минт' });
  if (parsedAmount < -100000) return res.status(400).json({ error: 'Слишком большая сумма' });

  db.run('UPDATE users SET balance = MAX(0, balance + ?) WHERE id=?', [parsedAmount, req.user.id]);
  saveDB();
  const user = getOne('SELECT balance FROM users WHERE id=?', [req.user.id]);
  res.json({ balance: user.balance });
});

app.post('/api/balance/mint', auth, (req, res) => {
  const user = getOne('SELECT role, handle FROM users WHERE id=?', [req.user.id]);
  if (user.role !== 'FOUNDER' && user.handle !== FOUNDER_HANDLE) {
    return res.status(403).json({ error: 'Минт доступен только для FOUNDER' });
  }
  const { amount } = req.body;
  const parsed = parseInt(amount, 10);
  const mintAmount = Math.min(Math.max(1, isNaN(parsed) ? 1000 : parsed), 1000000); // Cap at 1M per mint
  db.run('UPDATE users SET balance = balance + ? WHERE id=?', [mintAmount, req.user.id]);
  saveDB();
  const updated = getOne('SELECT balance FROM users WHERE id=?', [req.user.id]);
  res.json({ balance: updated.balance });
});

// ===================================================
// JARVIS AI PROXY [EXPRESS GATEWAY]
// ===================================================
app.post('/api/jarvis', auth, async (req, res) => {
  const apiKey = process.env.JARVIS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'JARVIS_API_KEY не настроен на сервере', fallback: true });
  }

  try {
    const { contents, systemInstruction, tools, generationConfig } = req.body;
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Неверное тело запроса' });
    }

    // Limit dialogue context size
    const safeContents = contents.slice(-6);
    const totalChars = JSON.stringify(safeContents).length;
    if (totalChars > 15000) {
      return res.status(413).json({ error: 'Превышен лимит размера контекста', fallback: true });
    }

    const model = process.env.JARVIS_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: safeContents,
          systemInstruction,
          tools: tools || undefined,
          generationConfig: {
            ...(generationConfig || {}),
            maxOutputTokens: Math.min(Math.max(10, generationConfig?.maxOutputTokens || 200), 300)
          }
        })
      }
    );

    if (!response.ok) {
      console.error('[Express Jarvis Proxy] Upstream API code:', response.status);
      return res.status(response.status).json({ error: 'Сервис ИИ временно недоступен', fallback: true });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('[Express Jarvis Proxy] Server error:', err.message);
    return res.status(500).json({ error: 'Внутренняя ошибка шлюза J.A.R.V.I.S.', fallback: true });
  }
});

// ===================================================
// CHAT ROUTES (PER-USER)
// ===================================================
app.get('/api/chats', auth, (req, res) => {
  const chats = getAll('SELECT * FROM chats WHERE user_id=? ORDER BY id', [req.user.id]);
  const result = chats.map(c => {
    const messages = getAll(
      'SELECT * FROM messages WHERE chat_id=? ORDER BY id',
      [c.id]
    ).map(m => ({
      id: m.id,
      sender: m.sender,
      isMe: !!m.is_me,
      type: m.type,
      text: m.text,
      fileName: m.file_name,
      audioSrc: m.audio_src,
      duration: m.duration,
      time: m.time_str,
      reactions: JSON.parse(m.reactions || '{}'),
      myReaction: m.my_reaction
    }));

    const lastMsg = messages[messages.length - 1];
    return {
      id: c.chat_key,
      _dbId: c.id,
      name: c.name,
      type: c.type,
      isBot: !!c.is_bot,
      online: !!c.online,
      verified: !!c.verified,
      avatar: normalizeAvatar(c.avatar, c.chat_key || c.name),
      statusText: c.status_text,
      time: lastMsg?.time || '',
      lastMessage: lastMsg?.text || '',
      lastSender: lastMsg ? (lastMsg.isMe ? 'Вы' : lastMsg.sender) : '',
      unread: 0,
      messages
    };
  });
  res.json(result);
});

app.post('/api/chats/:chatKey/messages', auth, (req, res) => {
  const { chatKey } = req.params;
  const { sender, isMe, type, text, fileName, audioSrc, duration, time, reactions, myReaction } = req.body;

  const chat = getOne('SELECT id FROM chats WHERE user_id=? AND chat_key=?', [req.user.id, chatKey]);
  if (!chat) return res.status(404).json({ error: 'Чат не найден' });

  // Sanitize message fields
  const safeText = typeof text === 'string' ? text.slice(0, 5000) : '';
  const safeSender = typeof sender === 'string' ? sender.trim().slice(0, 50) : 'Вы';
  const safeType = ['text', 'voice', 'file', 'image'].includes(type) ? type : 'text';
  const safeFileName = typeof fileName === 'string' ? fileName.slice(0, 100) : null;
  const safeDuration = typeof duration === 'string' ? duration.slice(0, 20) : null;
  const safeTime = typeof time === 'string' ? time.slice(0, 30) : '';

  // Limit audio base64 payload to ~350KB to preserve memory
  let safeAudioSrc = null;
  if (typeof audioSrc === 'string' && audioSrc.length < 500000) {
    safeAudioSrc = audioSrc;
  }

  db.run(
    'INSERT INTO messages (chat_id, sender, is_me, type, text, file_name, audio_src, duration, time_str, reactions, my_reaction) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [chat.id, safeSender, isMe ? 1 : 0, safeType, safeText, safeFileName, safeAudioSrc, safeDuration, safeTime, JSON.stringify(reactions || {}), myReaction || null]
  );
  saveDB();

  const msg = getOne('SELECT * FROM messages WHERE chat_id=? ORDER BY id DESC LIMIT 1', [chat.id]);
  res.json({
    id: msg.id,
    sender: msg.sender,
    isMe: !!msg.is_me,
    type: msg.type,
    text: msg.text,
    fileName: msg.file_name,
    audioSrc: msg.audio_src,
    duration: msg.duration,
    time: msg.time_str,
    reactions: JSON.parse(msg.reactions || '{}'),
    myReaction: msg.my_reaction
  });
});

app.post('/api/chats', auth, (req, res) => {
  const { chatKey, name, type, avatar, statusText, isBot, online, verified } = req.body;
  if (!chatKey || !name) return res.status(400).json({ error: 'chatKey и name обязательны' });

  const safeChatKey = String(chatKey).trim().slice(0, 50);
  const safeName = String(name).trim().slice(0, 50);

  const existing = getOne('SELECT id FROM chats WHERE user_id=? AND chat_key=?', [req.user.id, safeChatKey]);
  if (existing) return res.status(409).json({ error: 'Чат уже существует' });

  db.run(
    'INSERT INTO chats (chat_key, user_id, name, type, is_bot, online, verified, avatar, status_text) VALUES (?,?,?,?,?,?,?,?,?)',
    [safeChatKey, req.user.id, safeName, type || 'dm', isBot ? 1 : 0, online ? 1 : 0, verified ? 1 : 0, normalizeAvatar(avatar, safeChatKey || safeName), statusText || '']
  );
  saveDB();
  res.json({ ok: true });
});

// ===================================================
// FRIENDS ROUTES
// ===================================================
app.get('/api/friends', auth, (req, res) => {
  const friends = getAll('SELECT * FROM friends WHERE user_id=?', [req.user.id]);
  res.json(friends.map(f => ({
    id: f.id,
    name: f.friend_name,
    handle: f.friend_handle,
    avatar: normalizeAvatar(f.friend_avatar, f.friend_name),
    statusText: f.status_text,
    tags: JSON.parse(f.tags || '[]'),
    online: !!f.online,
    verified: !!f.verified,
    chips: f.chips
  })));
});

app.post('/api/friends', auth, (req, res) => {
  const { name, handle, avatar, statusText, tags } = req.body;
  if (!handle) return res.status(400).json({ error: 'handle обязателен' });

  const cleanHandle = String(handle).trim().slice(0, 30);
  const cleanName = String(name || handle).trim().slice(0, 50);
  const safeTags = Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).slice(0, 30)) : [];

  const existing = getOne('SELECT id FROM friends WHERE user_id=? AND friend_handle=?', [req.user.id, cleanHandle]);
  if (existing) return res.status(409).json({ error: 'Уже в друзьях' });

  db.run(
    'INSERT INTO friends (user_id, friend_name, friend_handle, friend_avatar, status_text, tags) VALUES (?,?,?,?,?,?)',
    [req.user.id, cleanName, cleanHandle, avatar || 'macan', statusText || '', JSON.stringify(safeTags)]
  );
  saveDB();
  res.json({ ok: true });
});

app.delete('/api/friends/:id', auth, (req, res) => {
  const friendId = parseInt(req.params.id, 10);
  if (isNaN(friendId)) return res.status(400).json({ error: 'Некорректный ID друга' });
  db.run('DELETE FROM friends WHERE id=? AND user_id=?', [friendId, req.user.id]);
  saveDB();
  res.json({ ok: true });
});

// SEARCH USERS [SANITIZED SQL WILDCARDS]
app.get('/api/users/search', auth, (req, res) => {
  const rawQ = (req.query.q || '').trim().toLowerCase();
  if (!rawQ || rawQ.length < 2) return res.json([]);
  
  // Escape SQL LIKE wildcards and clamp query length
  const cleanQ = rawQ.replace(/[%_\\]/g, '\\$&').slice(0, 30);
  const users = getAll(
    "SELECT id, name, handle, role, rank, avatar, avatar_hat, level FROM users WHERE (LOWER(name) LIKE ? ESCAPE '\\' OR LOWER(handle) LIKE ? ESCAPE '\\') LIMIT 20",
    [`%${cleanQ}%`, `%${cleanQ}%`]
  );
  res.json(users.filter(u => u.id !== req.user.id).map(u => ({
    ...u,
    avatar: normalizeAvatar(u.avatar, u.name)
  })));
});

// ===================================================
// START SERVER
// ===================================================
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🔥 SWAG INC. Backend Server v1.0 [HARDENED]`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`💾 Database: ${DB_PATH}`);
    console.log(`🔐 JWT expires: ${JWT_EXPIRES}`);
    console.log(`🛡️ Rate limiting: Active (Memory leak protected)\n`);
  });
}

start().catch(e => { console.error('Failed to start:', e); process.exit(1); });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Saving database before exit...');
  saveDB();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Saving database before exit...');
  saveDB();
  process.exit(0);
});
