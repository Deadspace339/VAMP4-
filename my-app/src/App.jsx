import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
// ЗАЩИТА МАРШРУТОВ
// Проверяет авторизацию, если нет — редирект на /auth
// ===================================================
const RequireAuth = ({ children, authState }) => {
  if (authState === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0a', color: '#00ff88',
        fontFamily: 'monospace', fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💀</div>
          <div>SWAG INC. LOADING...</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Проверка защищённого соединения</div>
        </div>
      </div>
    );
  }
  if (authState === 'unauthenticated') {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const AppContent = ({ authState, currentUser, onLogout }) => {
  const [balance, setBalance] = useState(() => db.getBalance());
  const [adhdMode, setAdhdMode] = useState(() => db.getAdhdMode());
  const location = useLocation();
  const navigate = useNavigate();

  // Синхронизация баланса с сервером при загрузке
  useEffect(() => {
    if (authState === 'authenticated') {
      backendService.getBalance().then(data => {
        setBalance(data.balance);
        db.setBalance(data.balance);
      }).catch(() => {});
    }
  }, [authState]);

  useEffect(() => {
    const handleAdhd = (e) => setAdhdMode(e.detail);
    window.addEventListener('swag_adhd_updated', handleAdhd);
    return () => window.removeEventListener('swag_adhd_updated', handleAdhd);
  }, []);

  // Слушаем событие истечения сессии
  useEffect(() => {
    const handleExpired = () => {
      onLogout();
      navigate('/auth');
    };
    window.addEventListener('swag_auth_expired', handleExpired);
    return () => window.removeEventListener('swag_auth_expired', handleExpired);
  }, [onLogout, navigate]);

  const isAuthPage = 
    location.pathname === '/auth' || 
    location.pathname === '/login' || 
    location.pathname === '/register';

  const isMainPage = 
    location.pathname === '/' || 
    location.pathname === '/marketplace' || 
    location.pathname === '/home';

  // Звук на главной
  useEffect(() => {
    if (!isMainPage || isAuthPage) {
      soundService.stop();
      return;
    }
    if (isMainPage) {
      soundService.playOnMainPage();
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

  // Слушаем обновления баланса
  useEffect(() => {
    const handleBalanceUpdate = (e) => setBalance(e.detail);
    window.addEventListener('swag_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('swag_balance_updated', handleBalanceUpdate);
  }, []);

  const handleUpdateBalance = async (delta) => {
    try {
      const data = await backendService.addBalance(delta);
      setBalance(data.balance);
      db.setBalance(data.balance);
    } catch {
      // Fallback to local
      const newBal = db.addBalance(delta);
      setBalance(newBal);
    }
  };

  const handleDonate = (amount = 50) => handleUpdateBalance(-amount);

  // ЗАЩИТА: Минт через сервер, только FOUNDER
  const handleMint = async (amount = 1000) => {
    try {
      const data = await backendService.mintBalance(amount);
      setBalance(data.balance);
      db.setBalance(data.balance);
    } catch (e) {
      console.warn('[Security] Mint blocked:', e.message);
    }
  };

  return (
    <div className={`app-root ${isAuthPage ? 'is-auth-mode' : ''}`}>
      <div className="grain-overlay"></div>
      <div className="scanlines"></div>
      
      {!isAuthPage && (
        <SiteHeader 
          balance={balance} 
          onMint={handleMint} 
          authState={authState}
          currentUser={currentUser}
          onLogout={onLogout}
        />
      )}
      {!isAuthPage && <AdhdSideFeeds active={adhdMode} />}
      
      <Routes>
        {/* Публичные маршруты: если уже вошел — кидаем на главную, если нет — на страницу входа */}
        <Route path="/auth" element={authState === 'authenticated' ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/login" element={authState === 'authenticated' ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/register" element={authState === 'authenticated' ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Защищённые маршруты — требуют авторизации */}
        <Route path="/" element={<RequireAuth authState={authState}><MarketplaceBody /></RequireAuth>} />
        <Route path="/home" element={<RequireAuth authState={authState}><MarketplaceBody /></RequireAuth>} />
        <Route path="/marketplace" element={<RequireAuth authState={authState}><MarketplaceBody /></RequireAuth>} />
        <Route path="/2" element={<RequireAuth authState={authState}><Web2Page balance={balance} onDonate={handleDonate} /></RequireAuth>} />
        <Route path="/messenger" element={<RequireAuth authState={authState}><Web2Page balance={balance} onDonate={handleDonate} /></RequireAuth>} />
        <Route path="/3" element={<RequireAuth authState={authState}><Web3Page /></RequireAuth>} />
        <Route path="/4" element={<RequireAuth authState={authState}><Web4Page balance={balance} onUpdateBalance={handleUpdateBalance} /></RequireAuth>} />
        <Route path="/casino" element={<RequireAuth authState={authState}><Web4Page balance={balance} onUpdateBalance={handleUpdateBalance} /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth authState={authState}><ProfilePage balance={balance} onMint={handleMint} /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAuthPage && <IPhoneClashRoyale />}

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
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [currentUser, setCurrentUser] = useState(null);

  // При загрузке приложения проверяем сессию на сервере
  useEffect(() => {
    const checkAuth = async () => {
      if (!backendService.hasToken()) {
        setAuthState('unauthenticated');
        return;
      }
      try {
        const user = await backendService.checkSession();
        if (user) {
          setCurrentUser(user);
          setAuthState('authenticated');
          // Обновляем кеш db.js
          db.updateUser({
            name: user.name,
            handle: user.handle,
            email: user.email,
            role: user.role,
            rank: user.rank,
            level: user.level,
            bio: user.bio,
            avatarHat: user.avatar_hat,
            avatar: user.avatar
          });
        } else {
          setAuthState('unauthenticated');
        }
      } catch {
        setAuthState('unauthenticated');
      }
    };
    checkAuth();
  }, []);

  // Слушаем успешный логин из AuthPage
  useEffect(() => {
    const handleLogin = (e) => {
      setCurrentUser(e.detail);
      setAuthState('authenticated');
    };
    window.addEventListener('swag_user_logged_in', handleLogin);
    return () => window.removeEventListener('swag_user_logged_in', handleLogin);
  }, []);

  const handleLogout = () => {
    backendService.logout();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  };

  return (
    <BrowserRouter>
      <AppContent 
        authState={authState} 
        currentUser={currentUser} 
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
};

export default App;