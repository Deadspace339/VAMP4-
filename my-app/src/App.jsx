import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { db } from './services/db';
import { backendService } from './services/backendService';
import { soundService } from './services/soundService';
import SiteHeader from './components/SiteHeader';
import AdhdSideFeeds from './components/AdhdSideFeeds';
import MarketplaceBody from './components/MarketplaceBody';
import Web2Page from './pages/Web2Page';
import Web3Page from './pages/Web3Page';
import Web4Page from './pages/Web4Page';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import IPhoneClashRoyale from './components/iphone/IPhoneClashRoyale';

// ===================================================
// ЗАЩИТА МАРШРУТОВ: RequireAuth
// Перенаправляет на /auth если пользователь не авторизован
// ===================================================
const RequireAuth = ({ children }) => {
  const hasSession = backendService.isSessionValid();
  if (!hasSession) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const AppContent = () => {
  const [balance, setBalance] = useState(() => db.getBalance());
  const [adhdMode, setAdhdMode] = useState(() => db.getAdhdMode());
  const location = useLocation();

  useEffect(() => {
    const handleAdhd = (e) => setAdhdMode(e.detail);
    window.addEventListener('swag_adhd_updated', handleAdhd);
    return () => window.removeEventListener('swag_adhd_updated', handleAdhd);
  }, []);

  // Проверяем, открыта ли страница авторизации/регистрации (скрываем все внешние панели)
  const isAuthPage = 
    location.pathname === '/auth' || 
    location.pathname === '/login' || 
    location.pathname === '/register';

  // Главная страница SWAG INC.
  const isMainPage = 
    location.pathname === '/' || 
    location.pathname === '/marketplace' || 
    location.pathname === '/home';

  // Воспроизведение трека «свэг321.mp3» ТОЛЬКО на странице Web 1.0 (главная/маркетплейс)
  useEffect(() => {
    // На любых других страницах (Web 2.0, Web 3.0, Web 4.0, Profile, Auth) трек СТРОГО выключаем
    if (!isMainPage || isAuthPage) {
      soundService.stop();
      return;
    }

    if (isMainPage) {
      soundService.playOnMainPage();

      // Если в браузере автоплей требует первого клика/действия пользователя
      const handleFirstAction = () => {
        soundService.playOnMainPage();
        window.removeEventListener('pointerdown', handleFirstAction);
        window.removeEventListener('keydown', handleFirstAction);
      };

      window.addEventListener('pointerdown', handleFirstAction, { once: true });
      window.addEventListener('keydown', handleFirstAction, { once: true });

      return () => {
        window.removeEventListener('pointerdown', handleFirstAction);
        window.removeEventListener('keydown', handleFirstAction);
      };
    }
  }, [location.pathname, isMainPage, isAuthPage]);

  // Слушаем обновления баланса из любых компонентов
  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      setBalance(e.detail);
    };
    window.addEventListener('swag_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('swag_balance_updated', handleBalanceUpdate);
  }, []);

  const handleUpdateBalance = (delta) => {
    const newBal = db.addBalance(delta);
    setBalance(newBal);
  };

  const handleDonate = (amount = 50) => {
    handleUpdateBalance(-amount);
  };

  // ЗАЩИТА: Минт доступен только для FOUNDER
  const handleMint = (amount = 1000) => {
    const user = db.getUser();
    const isFounder = user?.role === 'FOUNDER' || user?.rank === 'SWAG GOD' || user?.handle === '@macansssssssssss1337';
    if (!isFounder) {
      console.warn('[Security] Mint attempt blocked: user is not FOUNDER');
      return;
    }
    handleUpdateBalance(amount);
  };

  return (
    <div className={`app-root ${isAuthPage ? 'is-auth-mode' : ''}`}>
      <div className="grain-overlay"></div>
      <div className="scanlines"></div>
      
      {/* Шапка скрывается на странице регистрации/входа */}
      {!isAuthPage && <SiteHeader balance={balance} onMint={handleMint} />}

      {/* ГЛОБАЛЬНЫЙ СДВГ РЕЖИМ (4 ЗАЦИКЛЕННЫХ ВИДЕО ПО БОКАМ ПОВЕРХ ВСЕХ СТРАНИЦ) */}
      {!isAuthPage && <AdhdSideFeeds active={adhdMode} />}
      
      <Routes>
        <Route path="/" element={<MarketplaceBody />} />
        <Route path="/home" element={<MarketplaceBody />} />
        <Route path="/marketplace" element={<MarketplaceBody />} />
        <Route path="/2" element={<Web2Page balance={balance} onDonate={handleDonate} />} />
        <Route path="/messenger" element={<Web2Page balance={balance} onDonate={handleDonate} />} />
        {/* ЗАЩИЩЁННЫЕ МАРШРУТЫ — требуют авторизации */}
        <Route path="/3" element={<RequireAuth><Web3Page /></RequireAuth>} />
        <Route path="/4" element={<RequireAuth><Web4Page balance={balance} onUpdateBalance={handleUpdateBalance} /></RequireAuth>} />
        <Route path="/casino" element={<RequireAuth><Web4Page balance={balance} onUpdateBalance={handleUpdateBalance} /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage balance={balance} onMint={handleMint} /></RequireAuth>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* МИНИ ТЕЛЕФОН IPHONE 6 С НАСТОЯЩИМ CLASH ROYALE */}
      {!isAuthPage && <IPhoneClashRoyale />}

      {/* Футер скрывается на странице регистрации/входа */}
      {!isAuthPage && (
        <footer className="site-footer">
          <div className="container">
            <div className="footer-brand">
              <h2>SWAG INC. <span className="logo-vamp-plate">VAMP 4</span></h2>
            </div>
            <p>© 2026 SWAG INC. ALL SYSTEMS SECURED. POWERED BY J.A.R.V.I.S. feat Eyeracle(Энвелоуп Кодер)</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;