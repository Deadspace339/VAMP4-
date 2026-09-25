import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import { backendService } from '../services/backendService';
import { soundService } from '../services/soundService';

import macanAvatar from '../assets/macan-brat.jpg';
import crownImg from '../assets/plashka.png';
import fivePlusImg from '../assets/five_plus.svg';
import okHatImg from '../assets/odnoklassniki_hat.svg';

const SNOW_EMOJIS = ['💀', '🥶', '💪'];

const ROLE_RANKS = {
  FOUNDER: 'SWAG GOD',
  CREATOR: 'SOUND CREATOR',
  HIGH_ROLLER: 'VIP 777 CASINO',
  SWAG_BOSS: 'CYBER BOSS'
};

const AuthPage = () => {
  const [activeMode, setActiveMode] = useState('register'); // 'register' or 'login'
  
  // Поля входа
  const [loginNick, setLoginNick] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Поля регистрации
  const [regNick, setRegNick] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  // Состояние после успешной авторизации: выбор прав, роли и шапки аватарки
  const [postAuthUser, setPostAuthUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('FOUNDER');
  const [selectedHat, setSelectedHat] = useState('crown'); // 'crown', 'five_plus', 'odnoklassniki', 'none'

  const [toastMsg, setToastMsg] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginNick.trim()) {
      showToast('Введите логин или кибер-никнейм!');
      return;
    }
    if (!loginPass.trim()) {
      showToast('Введите секретный ключ шифрования / пароль!');
      return;
    }

    try {
      const res = await backendService.login(loginNick, loginPass);
      setPostAuthUser(res.user);
      setSelectedRole(res.user.role || 'FOUNDER');
      setSelectedHat(res.user.avatarHat || 'crown');
      showToast('⚡ Успешная авторизация в защищенной сети ATreiya! Подтвердите права.');
    } catch (err) {
      showToast(`❌ Ошибка входа: ${err.message}`);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regNick.trim()) {
      showToast('Укажите желаемый кибер-никнейм!');
      return;
    }
    if (!regPass.trim() || regPass.trim().length < 6) {
      showToast('Пароль должен содержать минимум 6 символов для E2EE защиты!');
      return;
    }

    try {
      const res = await backendService.register({
        name: regNick.trim().toUpperCase(),
        handle: regNick.trim(),
        email: regEmail.trim(),
        password: regPass,
        role: 'CREATOR',
        rank: 'SOUND CREATOR',
        avatarHat: 'crown'
      });
      setPostAuthUser(res.user);
      setSelectedRole(res.user.role || 'CREATOR');
      setSelectedHat('crown');
      showToast('⚡ Узел зарегистрирован в защищённой сети! Выберите ваши права.');
    } catch (err) {
      showToast(`❌ Ошибка регистрации: ${err.message}`);
    }
  };

  // Проверяем, является ли текущий пользователь настоящим FOUNDER
  const isActualFounder = postAuthUser?.handle === '@macansssssssssss1337' || postAuthUser?.role === 'FOUNDER';

  const handleConfirmRole = () => {
    if (!postAuthUser) return;

    // ЗАЩИТА: sanitize роль — не-основатели не могут выбрать FOUNDER
    let safeRole = selectedRole;
    if (safeRole === 'FOUNDER' && !isActualFounder) {
      safeRole = 'CREATOR';
    }

    backendService.updateProfile({
      name: postAuthUser.name,
      handle: postAuthUser.handle,
      email: postAuthUser.email || undefined,
      role: safeRole,
      rank: ROLE_RANKS[safeRole] || 'SOUND CREATOR',
      avatarHat: selectedHat
    });

    // Воспроизведение трека «свэг321.mp3» после выбора роли и входа (строго 1 раз без цикла)
    soundService.playAfterAuth();

    showToast(`🔥 Роль ${safeRole} активирована! Доступ открыт.`);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <div className="swag-auth-fullscreen">
      {/* Тост уведомлений */}
      {toastMsg && (
        <div className="swag-auth-toast">
          <span className="toast-fire-icon">⚡</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================================================
          СНЕГОПАД ИЗ ЭМОДЗИ: 💀 (череп), 🥶 (холод), 💪 (бицепс)
          =================================================== */}
      <div className="swag-emoji-snow-layer">
        {[...Array(40)].map((_, i) => {
          const emoji = SNOW_EMOJIS[i % SNOW_EMOJIS.length];
          const leftPos = (i * 2.5 + (i % 7) * 4.3) % 98;
          const duration = 4.2 + (i % 6) * 1.1;
          const delay = (i % 9) * 0.6;
          const size = 1.3 + (i % 4) * 0.45;
          return (
            <span
              key={`snow-${i}`}
              className="swag-snow-emoji"
              style={{
                left: `${leftPos}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                fontSize: `${size}rem`
              }}
            >
              {emoji}
            </span>
          );
        })}
      </div>

      {/* ===================================================
          ФИРМЕННЫЙ ДИЗАЙН SWAG INC. НА ФОНЕ (ЦВЕТА ГЛАВНОЙ СТРАНИЦЫ)
          =================================================== */}
      <div className="swag-ambient-orbs">
        <div className="swag-orb orange"></div>
        <div className="swag-orb red"></div>
        <div className="swag-orb gold"></div>
      </div>

      {/* Перспективная кибер-сетка в фирменном неоново-оранжевом свечении */}
      <div className="swag-cyber-grid-floor"></div>

      {/* Парящие готические руны и свэг-символы */}
      <div className="floating-swag-runes">
        <span className="rune r1">† 𝔖𝔚𝔄𝔊 †</span>
        <span className="rune r2">⚡ 0xSWAG</span>
        <span className="rune r3">𝔙𝔄𝔐𝔓 4</span>
        <span className="rune r4">† 𝔅𝔏𝔒𝔒𝔇 †</span>
        <span className="rune r5">𝔉𝔒𝔘𝔑𝔇𝔈ℜ</span>
        <span className="rune r6">👑 SWAG GOD</span>
        <span className="rune r7">† 777 †</span>
      </div>

      {/* Падающие огненные кибер-частицы */}
      <div className="swag-particles-layer">
        {[...Array(18)].map((_, i) => (
          <span 
            key={i} 
            className="swag-particle"
            style={{
              left: `${(i * 5.5) + (i % 3) * 2}%`,
              animationDelay: `${(i % 5) * 0.7}s`,
              animationDuration: `${3.5 + (i % 4)}s`
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* ===================================================
          ЦЕНТРАЛЬНАЯ КАРТОЧКА: АВТОРИЗАЦИЯ ИЛИ ВЫБОР РОЛИ ПОСЛЕ ВХОДА
          =================================================== */}
      <div className="swag-auth-card">
        {/* Верхняя шапка карточки */}
        <div className="swag-card-header">
          <div className="swag-logo-row">
            <span className="swag-skull-icon">💀</span>
            <span className="swag-logo-text">SWAG <span className="orange-accent">INC.</span></span>
            <span className="swag-vamp-badge">VAMP 4</span>
          </div>

          <div className="swag-security-pill">
            <span className="orange-dot blink"></span>
            <span>E2EE SWAG NODE GATEWAY // LVL 67</span>
          </div>
        </div>

        {/* ЕСЛИ АВТОРИЗАЦИЯ УСПЕШНА — ОТОБРАЖАЕТСЯ ПЛАЖКА ПРАВ И РОЛИ В СИСТЕМЕ */}
        {postAuthUser ? (
          <div className="swag-post-auth-plate">
            <div className="post-auth-banner">
              <span className="status-indicator-dot blink"></span>
              <span>АВТОРИЗАЦИЯ ПРОЙДЕНА // ВЕРИФИЦИРОВАН: {postAuthUser.name}</span>
            </div>

            <h3 className="post-auth-title">
              👑 ПРАВА И РОЛЬ В СИСТЕМЕ
            </h3>

            <p className="post-auth-subtitle">
              Узел успешно верифицирован. Выберите уровень доступа и полномочия вашей учетной записи:
            </p>

            <div className="swag-input-group role-selector-group">
              <label>ПРАВА И РОЛЬ В СИСТЕМЕ</label>
              <div className="swag-input-wrapper role-select-wrapper">
                <span className="input-glyph">👑</span>
                <select 
                  className="swag-cyber-input select role-dropdown" 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {isActualFounder && <option value="FOUNDER">👑 FOUNDER (Создатель платформы • Эмиссия монет)</option>}
                  <option value="CREATOR">🎵 CREATOR (Автор музыки и клипов Shorts)</option>
                  <option value="HIGH_ROLLER">🎰 HIGH ROLLER (VIP Игрок Казино 777)</option>
                  <option value="SWAG_BOSS">⚡ SWAG BOSS (Авторитетный узел • Web 3.0 Доступ)</option>
                </select>
              </div>
            </div>

            {/* Карточка преимуществ выбранной роли */}
            <div className="role-perks-box">
              {selectedRole === 'FOUNDER' && (
                <div className="perk-content">
                  <div className="perk-header">👑 СТАТУС: FOUNDER (SWAG GOD)</div>
                  <ul className="perk-list">
                    <li>⚡ Неограниченная эмиссия $SWAG токенов в кошелек</li>
                    <li>🛒 Добавление и редактирование любых товаров на Web 1.0</li>
                    <li>🔒 Полный криптографический доступ к Web 2.0, 3.0 и 4.0</li>
                    <li>🤖 Персональный советник J.A.R.V.I.S. со сквозным E2EE шифрованием</li>
                  </ul>
                </div>
              )}
              {selectedRole === 'CREATOR' && (
                <div className="perk-content">
                  <div className="perk-header">🎵 СТАТУС: CREATOR (SOUND CREATOR)</div>
                  <ul className="perk-list">
                    <li>🎬 Публикация и продвижение видеоклипов в ленте Shorts</li>
                    <li>🎙️ Запись и эксклюзивное сведение треков в студии VAMP 4</li>
                    <li>💸 Прямые донаты в $SWAG от зрителей и подписчиков</li>
                  </ul>
                </div>
              )}
              {selectedRole === 'HIGH_ROLLER' && (
                <div className="perk-content">
                  <div className="perk-header">🎰 СТАТУС: HIGH ROLLER (VIP 777)</div>
                  <ul className="perk-list">
                    <li>💎 Доступ к приватным столам Web 4.0 Казино</li>
                    <li>🔥 Повышенный кэшбэк на ставки в Слотах 777 и игре «Дурак»</li>
                  </ul>
                </div>
              )}
              {selectedRole === 'SWAG_BOSS' && (
                <div className="perk-content">
                  <div className="perk-header">⚡ СТАТУС: SWAG BOSS (CYBER BOSS)</div>
                  <ul className="perk-list">
                    <li>📈 Прямой доступ к крипто-бирже Web 3.0 и закрытым ордерам</li>
                    <li>⭐ Золотой бейдж авторитета во всех каналах мессенджера</li>
                  </ul>
                </div>
              )}
            </div>

            {/* ИНТЕРАКТИВНЫЙ ВЫБОР ШАПКИ АВАТАРКИ: КОРОНА, 5+, ОДНОКЛАССНИКИ */}
            <div className="auth-avatar-hat-section">
              <label className="auth-hat-section-label">👑 ШАПКА АВАТАРКИ ПРОФИЛЯ</label>
              
              <div className="auth-avatar-interactive-preview">
                <div className="auth-avatar-frame-box">
                  <img src={macanAvatar} alt="Avatar" className="auth-avatar-img-circle" />
                  {selectedHat === 'crown' && (
                    <img src={crownImg} alt="Crown" className="auth-avatar-hat-img hat-crown" />
                  )}
                  {selectedHat === 'five_plus' && (
                    <img src={fivePlusImg} alt="5+" className="auth-avatar-hat-img hat-five-plus" />
                  )}
                  {selectedHat === 'odnoklassniki' && (
                    <img src={okHatImg} alt="Одноклассники" className="auth-avatar-hat-img hat-odnoklassniki" />
                  )}
                  <span className="auth-preview-online-dot"></span>
                </div>
                <div className="auth-hat-preview-text">
                  <div className="preview-hat-title">
                    {selectedHat === 'crown' && '👑 Корона Создателя (как у профиля)'}
                    {selectedHat === 'five_plus' && '⭐ Знак «5 с плюсом» (ОК стиль)'}
                    {selectedHat === 'odnoklassniki' && '🟠 Шапка «Одноклассники» (Фирменная)'}
                    {selectedHat === 'none' && '🚫 Без шапки (Оригинал)'}
                  </div>
                  <div className="preview-hat-desc">
                    Отображается на вашей аватарке в профиле, видеоклипах и мессенджере
                  </div>
                </div>
              </div>

              <div className="auth-hats-picker-grid">
                <button
                  type="button"
                  className={`auth-hat-btn-card ${selectedHat === 'crown' ? 'active' : ''}`}
                  onClick={() => setSelectedHat('crown')}
                >
                  <img src={crownImg} alt="Корона" className="hat-btn-icon" />
                  <span className="hat-btn-name">👑 Корона</span>
                </button>

                <button
                  type="button"
                  className={`auth-hat-btn-card ${selectedHat === 'five_plus' ? 'active' : ''}`}
                  onClick={() => setSelectedHat('five_plus')}
                >
                  <img src={fivePlusImg} alt="5+" className="hat-btn-icon" />
                  <span className="hat-btn-name">⭐ 5 с плюсом</span>
                </button>

                <button
                  type="button"
                  className={`auth-hat-btn-card ${selectedHat === 'odnoklassniki' ? 'active' : ''}`}
                  onClick={() => setSelectedHat('odnoklassniki')}
                >
                  <img src={okHatImg} alt="ОК" className="hat-btn-icon" />
                  <span className="hat-btn-name">🟠 Одноклассники</span>
                </button>

                <button
                  type="button"
                  className={`auth-hat-btn-card ${selectedHat === 'none' ? 'active' : ''}`}
                  onClick={() => setSelectedHat('none')}
                >
                  <span className="hat-btn-icon-none">🚫</span>
                  <span className="hat-btn-name">Без шапки</span>
                </button>
              </div>
            </div>

            <button 
              type="button" 
              className="swag-submit-btn confirm-role-btn"
              onClick={handleConfirmRole}
            >
              🔥 ПОДТВЕРДИТЬ ПРАВА И ВОЙТИ В СЕТЬ →
            </button>
          </div>
        ) : (
          <>
            {/* Переключатель табов: РЕГИСТРАЦИЯ / ВХОД */}
            <div className="swag-mode-switcher">
              <button
                type="button"
                className={`swag-switch-btn ${activeMode === 'register' ? 'active' : ''}`}
                onClick={() => setActiveMode('register')}
              >
                👑 РЕГИСТРАЦИЯ
              </button>
              <button
                type="button"
                className={`swag-switch-btn ${activeMode === 'login' ? 'active' : ''}`}
                onClick={() => setActiveMode('login')}
              >
                🔐 ВХОД
              </button>
            </div>

            {/* ФОРМА: РЕГИСТРАЦИЯ (БЕЗ РОЛИ, РОЛЬ ПОЯВИТСЯ ПОСЛЕ ВХОДА) */}
            {activeMode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="swag-form">
                <div className="swag-input-group">
                  <label>КИБЕР-НИКНЕЙМ / ПОЗЫВНОЙ</label>
                  <div className="swag-input-wrapper">
                    <span className="input-glyph">👤</span>
                    <input 
                      type="text" 
                      className="swag-cyber-input" 
                      placeholder="Например: MACAN"
                      value={regNick}
                      onChange={(e) => setRegNick(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="swag-input-group">
                  <label>PGP EMAIL / КАНАЛ СВЯЗИ</label>
                  <div className="swag-input-wrapper">
                    <span className="input-glyph">📡</span>
                    <input 
                      type="email" 
                      className="swag-cyber-input" 
                      placeholder="boss@swag.inc"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="swag-input-group">
                  <label>СЕКРЕТНЫЙ КЛЮЧ / ПАРОЛЬ</label>
                  <div className="swag-input-wrapper">
                    <span className="input-glyph">🔒</span>
                    <input 
                      type="password" 
                      className="swag-cyber-input" 
                      placeholder="••••••••••••••••"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="swag-submit-btn register">
                  🔥 ИНИЦИАЛИЗИРОВАТЬ НОВЫЙ УЗЕЛ
                </button>

                <div className="swag-footer-link-row">
                  <span>Уже есть зарегистрированный узел?</span>
                  <button 
                    type="button" 
                    className="swag-link-action"
                    onClick={() => setActiveMode('login')}
                  >
                    Войти в сеть →
                  </button>
                </div>
              </form>
            ) : (
              /* ФОРМА: ВХОД */
              <form onSubmit={handleLoginSubmit} className="swag-form">
                <div className="swag-input-group">
                  <label>КИБЕР-НИКНЕЙМ / ЛОГИН</label>
                  <div className="swag-input-wrapper">
                    <span className="input-glyph">👤</span>
                    <input 
                      type="text" 
                      className="swag-cyber-input" 
                      placeholder="MACAN"
                      value={loginNick}
                      onChange={(e) => setLoginNick(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="swag-input-group">
                  <label>СЕКРЕТНЫЙ КЛЮЧ ШИФРОВАНИЯ</label>
                  <div className="swag-input-wrapper">
                    <span className="input-glyph">🔒</span>
                    <input 
                      type="password" 
                      className="swag-cyber-input" 
                      placeholder="••••••••••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="swag-submit-btn login">
                  ⚡ ВОЙТИ В КИБЕР-СЕТЬ SWAG INC.
                </button>

                <div className="swag-footer-link-row">
                  <span>Впервые в SWAG INC.?</span>
                  <button 
                    type="button" 
                    className="swag-link-action"
                    onClick={() => setActiveMode('register')}
                  >
                    Создать профиль →
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Кнопка возврата на главную страницу */}
        <div className="swag-return-row">
          <Link to="/" className="swag-return-btn">
            ← ВЕРНУТЬСЯ НА ГЛАВНУЮ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
