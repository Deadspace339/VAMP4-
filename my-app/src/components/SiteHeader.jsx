import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import q from '../assets/macan-brat.jpg';
import crown from '../assets/plashka.png';

const SiteHeader = ({ balance, onMint }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [mintToast, setMintToast] = useState(null);

    const user = db.getUser();
    const isFounder = user?.role === 'FOUNDER' || user?.rank === 'SWAG GOD' || user?.handle === '@macansssssssssss1337';

    const isWeb1 = currentPath === '/' || currentPath === '/marketplace' || currentPath === '/home';
    const isWeb2 = currentPath === '/2' || currentPath === '/messenger';
    const isWeb3 = currentPath === '/3';
    const isWeb4 = currentPath === '/4' || currentPath === '/casino';
    const isAuth = currentPath === '/auth' || currentPath === '/login';

    const [adhdMode, setAdhdMode] = useState(() => db.getAdhdMode());

    React.useEffect(() => {
        const handleAdhd = (e) => setAdhdMode(e.detail);
        window.addEventListener('swag_adhd_updated', handleAdhd);
        return () => window.removeEventListener('swag_adhd_updated', handleAdhd);
    }, []);

    const handleToggleAdhd = () => {
        const next = !adhdMode;
        setAdhdMode(next);
        db.setAdhdMode(next);
    };

    const handleQuickMint = (amount = 1000) => {
        onMint(amount);
        setMintToast(`👑 FOUNDER MINT: +${amount.toLocaleString()} $SWAG ВЫПУЩЕНО В КОШЕЛЕК!`);
        setTimeout(() => setMintToast(null), 3000);
    };

    return (
        <>
            {mintToast && (
                <div className="founder-mint-toast">
                    <span className="toast-gold-star">⭐</span>
                    <span>{mintToast}</span>
                </div>
            )}

            <header className="site-header">
                <div className="container header-container">
                    {/* Левая колонка: Логотип SWAG INC. с плажкой VAMP 4 */}
                    <div className="header-left">
                        <Link to="/" className="logo-brand">
                            <span className="logo-icon">💀</span>
                            <span className="logo-text">SWAG <span className="logo-accent">INC.</span></span>
                            <span className="logo-vamp-plate">VAMP 4</span>
                        </Link>
                    </div>                        
                    
                    {/* Центральная колонка: Навигация Web 1.0 / 2.0 / 3.0 / 4.0 */}
                    <nav className="header-nav">
                        <Link 
                            to="/marketplace" 
                            className={`nav-link ${isWeb1 ? 'active' : ''}`}
                        >
                            <span className="nav-icon">🛒</span> WEB 1.0
                        </Link>                  
                        <Link 
                            to="/2" 
                            className={`nav-link ${isWeb2 ? 'active' : ''}`}
                        >
                            <span className="nav-icon">💬</span> WEB 2.0
                            <span className="hot-pill">HOT</span>
                        </Link>                                                    
                        <Link 
                            to="/3" 
                            className={`nav-link ${isWeb3 ? 'active' : ''}`}
                        >
                            <span className="nav-icon">⛓️</span> WEB 3.0
                        </Link>
                        <Link 
                            to="/4" 
                            className={`nav-link casino-link ${isWeb4 ? 'active' : ''}`}
                        >
                            <span className="nav-icon">🎰</span> WEB 4.0
                            <span className="casino-pill">777</span>
                        </Link>                                                  
                    </nav> 

                    {/* Правая колонка: Кнопка СДВГ + Профиль + Вход */}
                    <div className="header-right">
                        {/* КНОПКА ВКЛЮЧЕНИЯ/ВЫКЛЮЧЕНИЯ СДВГ РЕЖИМА (МЕСТО ИЗ КАРТИНКИ 2) */}
                        <button 
                            className={`adhd-header-toggle-btn ${adhdMode ? 'is-active' : ''}`}
                            onClick={handleToggleAdhd}
                            title={adhdMode ? 'Выключить режим СДВГ' : 'Включить режим СДВГ (видео по бокам)'}
                        >
                            <span className="adhd-brain-emoji">🧠</span>
                            <span className="adhd-toggle-text">СДВГ РЕЖИМ</span>
                            <span className={`adhd-status-badge ${adhdMode ? 'on' : 'off'}`}>
                                {adhdMode ? 'ON' : 'OFF'}
                            </span>
                        </button>

                        {/* Ссылка на профиль (отдельная страница) */}
                        <Link to="/profile" style={{ textDecoration: 'none' }}>
                            <div 
                                className="hype-user-card"
                                title="Открыть профиль Создателя, черновики и студию Shorts"
                            >
                                {/* Аватарка с короной */}
                                <div className="hype-avatar-box">
                                    <img src={q} alt="Macan" className="hype-avatar-img" />
                                    <img src={crown} alt="Crown" className="hype-avatar-crown" />
                                    <span className="online-ping-dot"></span>
                                </div>

                                {/* Имя и Ранг / Роль */}
                                <div className="hype-user-info">
                                    <div className="user-name-row">
                                        <span className="user-name-title">{user.name}</span>
                                        <span className="user-verified-badge" title="Верифицированный создатель">✓</span>
                                    </div>
                                    <div className="user-rank-badge">
                                        <span className="rank-icon">👑</span>
                                        <span className="rank-text">{user.rank}</span>
                                        <span className="rank-lvl">LVL {user.level}</span>
                                    </div>
                                </div>

                                {/* Баланс кошелька */}
                                <div className="hype-wallet-pill">
                                    <span className="wallet-micro-label">SWAG WALLET</span>
                                    <div className="wallet-value-row">
                                        <span className="wallet-neon-num">{balance.toLocaleString()}</span>
                                        <span className="wallet-cur">SWAG</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Кнопка Авторизации и Регистрации — ДО КОНЦА ВПРАВО */}
                        <Link 
                            to="/auth" 
                            className={`cyber-auth-btn ${isAuth ? 'active' : ''}`}
                            title="Вход и Регистрация узла"
                        >
                            <span className="cab-icon">🔐</span>
                            <span className="cab-text">ВХОД / РЕГИСТРАЦИЯ</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Всплывающее хайповое модальное окно профиля */}
            {showProfileModal && (
                <div className="profile-modal-backdrop" onClick={() => setShowProfileModal(false)}>
                    <div className="profile-cyber-dossier" onClick={(e) => e.stopPropagation()}>
                        <div className="dossier-header">
                            <div className="dossier-badge">CONFIDENTIAL PROFILE // NODE ID: #001</div>
                            <button className="dossier-close-btn" onClick={() => setShowProfileModal(false)}>✕</button>
                        </div>

                        <div className="dossier-body">
                            <div className="dossier-avatar-wrap">
                                <img src={q} alt="Avatar" className="dossier-img" />
                                <img src={crown} alt="Crown" className="dossier-crown" />
                            </div>

                            <h3 className="dossier-name">{user.name} (БОСС)</h3>
                            <span className="dossier-handle">{user.handle}</span>

                            <div className="dossier-roles-grid">
                                <div className="role-tag-box gold">
                                    <span className="rt-icon">👑</span>
                                    <div>
                                        <div className="rt-title">РАНГ: {user.rank}</div>
                                        <div className="rt-sub">Высший уровень доступа</div>
                                    </div>
                                </div>
                                <div className="role-tag-box orange">
                                    <span className="rt-icon">⚡</span>
                                    <div>
                                        <div className="rt-title">РОЛЬ: {user.role}</div>
                                        <div className="rt-sub">Создатель платформы • Неограниченная эмиссия</div>
                                    </div>
                                </div>
                                <div className="role-tag-box green">
                                    <span className="rt-icon">🛡️</span>
                                    <div>
                                        <div className="rt-title">ЗАЩИТА: E2EE DUAL-KEY</div>
                                        <div className="rt-sub">Крипто-шлюз активен • Gemini 2.5 AI Core</div>
                                    </div>
                                </div>
                            </div>

                            {/* ПАНЕЛЬ ЭМИССИИ МОНЕТ ДЛЯ FOUNDER */}
                            {isFounder && (
                                <div className="founder-mint-console">
                                    <div className="fmc-header">
                                        <span className="fmc-title">👑 FOUNDER MINT CONSOLE</span>
                                        <span className="fmc-badge">UNLIMITED</span>
                                    </div>
                                    <p className="fmc-desc">Прямая генерация токенов $SWAG в защищенный кошелек Создателя:</p>
                                    <div className="fmc-buttons-grid">
                                        <button className="cyber-btn mint-btn" onClick={() => handleQuickMint(500)}>+500</button>
                                        <button className="cyber-btn mint-btn" onClick={() => handleQuickMint(5000)}>+5 000</button>
                                        <button className="cyber-btn mint-btn" onClick={() => handleQuickMint(50000)}>+50 000</button>
                                        <button className="cyber-btn mint-btn jackpot" onClick={() => handleQuickMint(1000000)}>+1 000 000</button>
                                    </div>
                                </div>
                            )}

                            <div className="dossier-stats-row">
                                <div className="dossier-stat">
                                    <span className="ds-label">БАЛАНС</span>
                                    <span className="ds-val green">{balance.toLocaleString()} SWAG</span>
                                </div>
                                <div className="dossier-stat">
                                    <span className="ds-label">РЕПУТАЦИЯ</span>
                                    <span className="ds-val orange">{user.reputation}</span>
                                </div>
                                <div className="dossier-stat">
                                    <span className="ds-label">СТАТУС</span>
                                    <span className="ds-val">ПАПА ДОМА</span>
                                </div>
                            </div>

                            <button 
                                className="cyber-btn full-width" 
                                style={{ marginTop: '20px' }}
                                onClick={() => {
                                    setShowProfileModal(false);
                                }}
                            >
                                ЗАКРЫТЬ ДОСЬЕ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SiteHeader;