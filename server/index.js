// ===================================================
// SWAG INC. VAMP 4 — REAL BACKEND SERVER
// Express + SQLite (sql.js) + JWT Auth
// ===================================================
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'swag_vamp4_atreiya_somali_secret_67';
const JWT_EXPIRES = '7d';
const FOUNDER_HANDLE = '@macansssssssssss1337';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

  saveDB();
  console.log('💾 SQLite database initialized');
}

function saveDB() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('DB save error:', e);
  }
}

// Auto-save every 30 seconds
setInterval(saveDB, 30000);

// ===================================================
// CRYPTO HELPERS
// ===================================================
function hashPwd(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}
function genSalt() {
  return crypto.randomBytes(32).toString('hex');
}
function genToken(user) {
  return jwt.sign({ id: user.id, handle: user.handle, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
    return res.status(401).json({ error: 'Токен истёк' });
  }
}

function founderOnly(req, res, next) {
  if (req.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Только для FOUNDER' });
  next();
}

// ===================================================
// HELPER: get single row
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
    { key: 'jarvis', name: '🤖 J.A.R.V.I.S.', type: 'bot', is_bot: 1, online: 1, verified: 1, avatar: 'shield', status: 'Gemini 2.5 Flash • E2EE Guard' },
    { key: 'macan', name: 'MACAN (Брат)', type: 'dm', is_bot: 0, online: 1, verified: 1, avatar: 'macan', status: 'в сети (Porsche Studio)' },
    { key: 'swag-channel', name: '🔥 SWAG INC. OFFICIAL', type: 'channel', is_bot: 0, online: 1, verified: 1, avatar: 'crown', status: '13 420 участников' },
    { key: 'dark-market', name: '💀 DEALS & AUCTIONS', type: 'channel', is_bot: 0, online: 0, verified: 0, avatar: 'radio', status: '8 910 участников' }
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

// REGISTER
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, handle, email, password, avatarHat } = req.body;
    if (!name || !handle || !password) return res.status(400).json({ error: 'Имя, никнейм и пароль обязательны!' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов!' });

    const cleanHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
    const cleanName = name.trim().toUpperCase();

    const existing = getOne('SELECT id FROM users WHERE handle=?', [cleanHandle]);
    if (existing) return res.status(409).json({ error: `Никнейм ${cleanHandle} уже занят!` });

    const salt = genSalt();
    const hash = hashPwd(password, salt);
    const isFounder = cleanHandle === FOUNDER_HANDLE;
    const role = isFounder ? 'FOUNDER' : 'CREATOR';
    const rank = isFounder ? 'SWAG GOD' : 'SOUND CREATOR';
    const level = isFounder ? 67 : 1;

    db.run(
      'INSERT INTO users (name, handle, email, password_hash, salt, role, rank, level, bio, avatar_hat, avatar, balance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [cleanName, cleanHandle, email || '', hash, salt, role, rank, level, '', avatarHat || 'crown', 'macan', isFounder ? 67000 : 812]
    );

    const user = getOne('SELECT * FROM users WHERE handle=?', [cleanHandle]);
    createDefaultChats(user.id);

    const token = genToken(user);
    const { password_hash, salt: s, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
});

// LOGIN
const loginAttempts = {};
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Введите логин и пароль!' });

    const clean = identifier.trim().toLowerCase();
    
    // Rate limiting
    const now = Date.now();
    if (!loginAttempts[clean]) loginAttempts[clean] = { count: 0, first: now };
    const rec = loginAttempts[clean];
    if (now - rec.first > 60000) { rec.count = 0; rec.first = now; }
    if (rec.count >= 5) {
      const wait = Math.ceil((60000 - (now - rec.first)) / 1000);
      return res.status(429).json({ error: `Слишком много попыток! Подождите ${wait} сек.` });
    }
    rec.count++;

    const handleClean = clean.startsWith('@') ? clean : `@${clean}`;
    const user = getOne(
      'SELECT * FROM users WHERE handle=? OR LOWER(name)=? OR LOWER(email)=?',
      [handleClean, clean, clean]
    );

    if (!user) return res.status(404).json({ error: 'Аккаунт не найден! Зарегистрируйтесь.' });

    const candidateHash = hashPwd(password, user.salt);
    if (candidateHash !== user.password_hash) {
      return res.status(401).json({ error: 'Неверный пароль!' });
    }

    delete loginAttempts[clean];
    db.run('UPDATE users SET last_login=datetime("now") WHERE id=?', [user.id]);
    saveDB();

    const token = genToken(user);
    const { password_hash, salt, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});

// CHECK SESSION
app.get('/api/auth/me', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password_hash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

// LOGOUT (client-side, just acknowledge)
app.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

// ===================================================
// USER PROFILE ROUTES
// ===================================================
app.get('/api/user/profile', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  const { password_hash, salt, ...safeUser } = user;
  res.json(safeUser);
});

app.put('/api/user/profile', auth, (req, res) => {
  const { name, bio, level, avatar_hat, avatar, rank, role } = req.body;
  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Не найден' });

  // Role protection
  let safeRole = role || user.role;
  let safeRank = rank || user.rank;
  if (user.handle !== FOUNDER_HANDLE) {
    if (safeRole === 'FOUNDER') safeRole = 'CREATOR';
    if (typeof safeRank === 'string' && (safeRank.toUpperCase().includes('GOD') || safeRank.toUpperCase().includes('FOUNDER'))) {
      safeRank = 'SWAG BOSS';
    }
  }

  db.run(
    'UPDATE users SET name=?, bio=?, level=?, avatar_hat=?, avatar=?, rank=?, role=? WHERE id=?',
    [name || user.name, bio ?? user.bio, level ?? user.level, avatar_hat || user.avatar_hat, avatar || user.avatar, safeRank, safeRole, req.user.id]
  );
  saveDB();

  const updated = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  const { password_hash, salt, ...safeUser } = updated;
  res.json(safeUser);
});

app.post('/api/user/change-password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Оба пароля обязательны' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Минимум 6 символов' });

  const user = getOne('SELECT * FROM users WHERE id=?', [req.user.id]);
  const oldHash = hashPwd(oldPassword, user.salt);
  if (oldHash !== user.password_hash) return res.status(401).json({ error: 'Неверный текущий пароль' });

  const newSalt = genSalt();
  const newHash = hashPwd(newPassword, newSalt);
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
  db.run('UPDATE users SET balance = balance + ? WHERE id=?', [amount || 0, req.user.id]);
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
  db.run('UPDATE users SET balance = balance + ? WHERE id=?', [amount || 1000, req.user.id]);
  saveDB();
  const updated = getOne('SELECT balance FROM users WHERE id=?', [req.user.id]);
  res.json({ balance: updated.balance });
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
      avatar: c.avatar,
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

  db.run(
    'INSERT INTO messages (chat_id, sender, is_me, type, text, file_name, audio_src, duration, time_str, reactions, my_reaction) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [chat.id, sender || 'Вы', isMe ? 1 : 0, type || 'text', text || '', fileName || null, audioSrc || null, duration || null, time || '', JSON.stringify(reactions || {}), myReaction || null]
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

// CREATE A NEW CHAT (e.g. when adding friend or DM)
app.post('/api/chats', auth, (req, res) => {
  const { chatKey, name, type, avatar, statusText, isBot, online, verified } = req.body;
  if (!chatKey || !name) return res.status(400).json({ error: 'chatKey и name обязательны' });

  const existing = getOne('SELECT id FROM chats WHERE user_id=? AND chat_key=?', [req.user.id, chatKey]);
  if (existing) return res.status(409).json({ error: 'Чат уже существует' });

  db.run(
    'INSERT INTO chats (chat_key, user_id, name, type, is_bot, online, verified, avatar, status_text) VALUES (?,?,?,?,?,?,?,?,?)',
    [chatKey, req.user.id, name, type || 'dm', isBot ? 1 : 0, online ? 1 : 0, verified ? 1 : 0, avatar || 'macan', statusText || '']
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
    avatar: f.friend_avatar,
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

  const existing = getOne('SELECT id FROM friends WHERE user_id=? AND friend_handle=?', [req.user.id, handle]);
  if (existing) return res.status(409).json({ error: 'Уже в друзьях' });

  db.run(
    'INSERT INTO friends (user_id, friend_name, friend_handle, friend_avatar, status_text, tags) VALUES (?,?,?,?,?,?)',
    [req.user.id, name || handle, handle, avatar || 'macan', statusText || '', JSON.stringify(tags || [])]
  );
  saveDB();
  res.json({ ok: true });
});

app.delete('/api/friends/:id', auth, (req, res) => {
  db.run('DELETE FROM friends WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  saveDB();
  res.json({ ok: true });
});

// SEARCH USERS (for adding friends)
app.get('/api/users/search', auth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q || q.length < 2) return res.json([]);
  const users = getAll(
    'SELECT id, name, handle, role, rank, avatar, avatar_hat, level FROM users WHERE LOWER(name) LIKE ? OR LOWER(handle) LIKE ? LIMIT 20',
    [`%${q}%`, `%${q}%`]
  );
  res.json(users.filter(u => u.id !== req.user.id));
});

// ===================================================
// START SERVER
// ===================================================
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🔥 SWAG INC. Backend Server v1.0`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`💾 Database: ${DB_PATH}`);
    console.log(`🔐 JWT expires: ${JWT_EXPIRES}\n`);
  });
}

start().catch(e => { console.error('Failed to start:', e); process.exit(1); });
