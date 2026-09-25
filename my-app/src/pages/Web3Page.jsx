import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/db';
import { soundService } from '../services/soundService';

const UNLOCK_COST = 67000;
const PEG_RATE_UAH = 67; // 1 SWAG = 67 Гривень

// Торговые пары биржи в стиле Binance
const TRADING_PAIRS = {
  'SWAG/UAH': { base: 'SWAG', quote: 'UAH', price: 67.00, step: 0.1, min: 1, unit: '₴' },
  'BTC/UAH': { base: 'BTC', quote: 'UAH', price: 2680000.00, step: 100, min: 0.001, unit: '₴' },
  'TON/UAH': { base: 'TON', quote: 'UAH', price: 268.00, step: 0.5, min: 0.1, unit: '₴' },
  'SOL/UAH': { base: 'SOL', quote: 'UAH', price: 6700.00, step: 10, min: 0.01, unit: '₴' }
};

// Свечные наборы данных и временные шкалы для таймфреймов
const TIMEFRAME_DATASETS = {
  '1M': {
    name: '1 Минута (Live Scalping)',
    labels: ['16:51', '16:52', '16:53', '16:54', '16:55', '16:56', '16:57', '16:58', '16:59', '17:00', '17:01', '17:02', '17:03', '17:04', '17:05'],
    yLabels: ['67.30 ₴', '67.15 ₴', '67.00 ₴', '66.85 ₴'],
    candles: [
      { x: 55, o: 195, c: 180, h: 165, l: 210, green: true },
      { x: 98, o: 180, c: 190, h: 175, l: 200, green: false },
      { x: 141, o: 190, c: 170, h: 160, l: 195, green: true },
      { x: 184, o: 170, c: 155, h: 145, l: 180, green: true },
      { x: 227, o: 155, c: 165, h: 150, l: 175, green: false },
      { x: 270, o: 165, c: 145, h: 135, l: 170, green: true },
      { x: 313, o: 145, c: 130, h: 120, l: 155, green: true },
      { x: 356, o: 130, c: 140, h: 125, l: 150, green: false },
      { x: 399, o: 140, c: 120, h: 110, l: 145, green: true },
      { x: 442, o: 120, c: 130, h: 115, l: 135, green: false },
      { x: 485, o: 130, c: 110, h: 100, l: 135, green: true },
      { x: 528, o: 110, c: 95, h: 85, l: 120, green: true },
      { x: 571, o: 95, c: 105, h: 90, l: 115, green: false },
      { x: 614, o: 105, c: 85, h: 75, l: 110, green: true },
      { x: 657, o: 85, c: 80, h: 70, l: 95, green: true }
    ],
    linePath: 'M 55,195 L 98,185 L 141,170 L 184,155 L 227,165 L 270,145 L 313,130 L 356,140 L 399,120 L 442,130 L 485,110 L 528,95 L 571,105 L 614,85 L 657,80',
    areaPath: 'M 55,195 L 98,185 L 141,170 L 184,155 L 227,165 L 270,145 L 313,130 L 356,140 L 399,120 L 442,130 L 485,110 L 528,95 L 571,105 L 614,85 L 657,80 L 657,280 L 55,280 Z'
  },
  '5M': {
    name: '5 Минут (Day Trading)',
    labels: ['15:45', '15:55', '16:05', '16:15', '16:25', '16:35', '16:45', '16:55', '17:05'],
    yLabels: ['67.60 ₴', '67.20 ₴', '67.00 ₴', '66.40 ₴'],
    candles: [
      { x: 60, o: 215, c: 190, h: 175, l: 230, green: true },
      { x: 135, o: 190, c: 205, h: 180, l: 215, green: false },
      { x: 210, o: 205, c: 160, h: 145, l: 210, green: true },
      { x: 285, o: 160, c: 135, h: 120, l: 170, green: true },
      { x: 360, o: 135, c: 150, h: 125, l: 160, green: false },
      { x: 435, o: 150, c: 110, h: 95, l: 155, green: true },
      { x: 510, o: 110, c: 90, h: 75, l: 120, green: true },
      { x: 585, o: 90, c: 105, h: 80, l: 115, green: false },
      { x: 655, o: 105, c: 75, h: 65, l: 110, green: true }
    ],
    linePath: 'M 60,215 L 135,195 L 210,160 L 285,135 L 360,150 L 435,110 L 510,90 L 585,105 L 655,75',
    areaPath: 'M 60,215 L 135,195 L 210,160 L 285,135 L 360,150 L 435,110 L 510,90 L 585,105 L 655,75 L 655,280 L 60,280 Z'
  },
  '15M': {
    name: '15 Минут (Standart Binance)',
    labels: ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
    yLabels: ['68.50 ₴', '67.80 ₴', '67.00 ₴', '66.20 ₴'],
    candles: [
      { x: 70, o: 200, c: 170, h: 150, l: 220, green: true },
      { x: 150, o: 170, c: 185, h: 160, l: 195, green: false },
      { x: 230, o: 185, c: 140, h: 130, l: 190, green: true },
      { x: 310, o: 140, c: 110, h: 95, l: 145, green: true },
      { x: 390, o: 110, c: 130, h: 100, l: 140, green: false },
      { x: 470, o: 130, c: 90, h: 80, l: 140, green: true },
      { x: 550, o: 90, c: 75, h: 65, l: 115, green: true },
      { x: 640, o: 75, c: 55, h: 45, l: 85, green: true }
    ],
    linePath: 'M 70,200 L 150,175 L 230,140 L 310,110 L 390,130 L 470,90 L 550,75 L 640,55',
    areaPath: 'M 70,200 L 150,175 L 230,140 L 310,110 L 390,130 L 470,90 L 550,75 L 640,55 L 640,280 L 70,280 Z'
  },
  '1H': {
    name: '1 Час (Intraday Swing)',
    labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    yLabels: ['69.50 ₴', '68.20 ₴', '67.00 ₴', '65.50 ₴'],
    candles: [
      { x: 70, o: 230, c: 195, h: 170, l: 250, green: true },
      { x: 150, o: 195, c: 215, h: 185, l: 230, green: false },
      { x: 230, o: 215, c: 165, h: 150, l: 220, green: true },
      { x: 310, o: 165, c: 125, h: 110, l: 175, green: true },
      { x: 390, o: 125, c: 145, h: 115, l: 160, green: false },
      { x: 470, o: 145, c: 95, h: 80, l: 150, green: true },
      { x: 550, o: 95, c: 70, h: 55, l: 110, green: true },
      { x: 640, o: 70, c: 45, h: 35, l: 80, green: true }
    ],
    linePath: 'M 70,230 L 150,205 L 230,165 L 310,125 L 390,145 L 470,95 L 550,70 L 640,45',
    areaPath: 'M 70,230 L 150,205 L 230,165 L 310,125 L 390,145 L 470,95 L 550,70 L 640,45 L 640,280 L 70,280 Z'
  },
  '1D': {
    name: '1 День (Daily History & Macro)',
    labels: ['12 Сен', '13 Сен', '14 Сен', '15 Сен', '16 Сен', '17 Сен', '18 Сен'],
    yLabels: ['72.00 ₴', '69.50 ₴', '67.00 ₴', '63.00 ₴'],
    candles: [
      { x: 80, o: 245, c: 210, h: 190, l: 260, green: true },
      { x: 175, o: 210, c: 225, h: 195, l: 240, green: false },
      { x: 270, o: 225, c: 175, h: 160, l: 235, green: true },
      { x: 365, o: 175, c: 135, h: 120, l: 185, green: true },
      { x: 460, o: 135, c: 155, h: 125, l: 170, green: false },
      { x: 555, o: 155, c: 100, h: 85, l: 160, green: true },
      { x: 645, o: 100, c: 50, h: 40, l: 110, green: true }
    ],
    linePath: 'M 80,245 L 175,215 L 270,175 L 365,135 L 460,155 L 555,100 L 645,50',
    areaPath: 'M 80,245 L 175,215 L 270,175 L 365,135 L 460,155 L 555,100 L 645,50 L 645,280 L 80,280 Z'
  }
};

const Web3Page = () => {
  const [balance, setBalance] = useState(() => db.getBalance());
  const [fiatUah, setFiatUah] = useState(() => db.getFiatBalance());
  const [isUnlocked, setIsUnlocked] = useState(() => db.isWeb3Unlocked());
  const [user, setUser] = useState(() => db.getUser());
  const [toastMsg, setToastMsg] = useState(null);

  const isFounder = user?.role === 'FOUNDER' || user?.rank === 'SWAG GOD' || user?.handle === '@macansssssssssss1337';

  // Состояние Барабана эдитов
  const [edits, setEdits] = useState(() => db.getEdits());
  const [editsCategory, setEditsCategory] = useState('Все'); // 'Все', 'Баскетбол Куроко', 'Блю Лок', 'Суперкары'
  const [drumRotation, setDrumRotation] = useState(0);
  const [activeEditIndex, setActiveEditIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [likedEdits, setLikedEdits] = useState({});
  const [isPlayerEditing, setIsPlayerEditing] = useState(false); // Режим студии редактирования прямо в окне плеера
  const [editingEditId, setEditingEditId] = useState(null); // ID редактируемого эдита (null = новый)

  // Священная карма и обороты молитвенного барабана (Spiritual & Type Shit)
  const [karmaScore, setKarmaScore] = useState(() => {
    return parseInt(localStorage.getItem('swag_prayer_karma') || '6700', 10);
  });
  const [spinCount, setSpinCount] = useState(() => {
    return parseInt(localStorage.getItem('swag_prayer_spins') || '67', 10);
  });

  // ОТДЕЛЬНОЕ ВСплывающее ОКНО ПЛЕЕРА ЭДИТА
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState('cover'); // 'cover' (заполнение всего экрана) | 'contain' (вписать по центру)

  // Цикл воспроизведения: 20 секунд видео -> 3 секунды обложка -> заново 20 секунд видео
  const VIDEO_PHASE_DURATION = 20;
  const COVER_PHASE_DURATION = 3;
  const [playbackPhase, setPlaybackPhase] = useState('video'); // 'video' | 'cover'
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(VIDEO_PHASE_DURATION);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Звук и громкость (строго оригинальный звук видео, без песни летник)
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);

  // Режимы ввода обложки и видео (Ссылка / Свой файл)
  const [coverSourceType, setCoverSourceType] = useState('url'); // 'url' | 'file'
  const [videoSourceType, setVideoSourceType] = useState('url'); // 'url' | 'file'

  // Форма добавления и редактирования эдита
  const [newEditTitle, setNewEditTitle] = useState('');
  const [newEditAuthor, setNewEditAuthor] = useState('');
  const [newEditSound, setNewEditSound] = useState('');
  const [newEditCover, setNewEditCover] = useState('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80');
  const [newEditVideoUrl, setNewEditVideoUrl] = useState('');
  const [newEditTag, setNewEditTag] = useState('ANIME ZONE 🏀');
  const [newEditAnime, setNewEditAnime] = useState('Баскетбол Куроко');
  const [newEditNote, setNewEditNote] = useState('');

  const popupVideoRef = useRef(null);

  // Состояние Биржи (Binance Features)
  const [currentPair, setCurrentPair] = useState('SWAG/UAH');
  const [timeframe, setTimeframe] = useState('15M');
  const [chartMode, setChartMode] = useState('candles'); // 'candles' or 'line'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7d', '30d'
  const [startDate, setStartDate] = useState('2026-09-12');
  const [endDate, setEndDate] = useState('2026-09-18');

  // Торговый терминал (Limit / Market, Buy / Sell)
  const [orderType, setOrderType] = useState('LIMIT'); // 'LIMIT' or 'MARKET'
  const [tradeSide, setTradeSide] = useState('BUY'); // 'BUY' or 'SELL'
  const [orderPrice, setOrderPrice] = useState('67.00');
  const [orderAmount, setOrderAmount] = useState('100');
  const [tickerTick, setTickerTick] = useState(67.00);

  // Вкладки Binance (Open Orders, Trades, Assets)
  const [binanceTab, setBinanceTab] = useState('orders'); // 'orders', 'history', 'assets'
  const [openOrders, setOpenOrders] = useState(() => db.getOpenOrders());
  const [tradeHistory, setTradeHistory] = useState(() => db.getTradeHistory());

  const autoSpinIntervalRef = useRef(null);
  const pendingVideoBlobRef = useRef(null);
  const pendingCoverBlobRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Слушатели событий синхронизации базы данных и гидратация эдитов из IndexedDB
  useEffect(() => {
    db.hydrateEdits().then(hydrated => {
      if (Array.isArray(hydrated) && hydrated.length > 0) {
        setEdits(hydrated);
      }
    });

    const handleBalance = (e) => setBalance(e.detail);
    const handleFiat = (e) => setFiatUah(e.detail);
    const handleUnlocked = (e) => setIsUnlocked(e.detail);
    const handleEdits = (e) => {
      if (Array.isArray(e.detail)) setEdits(e.detail);
    };
    const handleOpenOrders = (e) => {
      if (Array.isArray(e.detail)) setOpenOrders(e.detail);
    };
    const handleTrades = (e) => {
      if (Array.isArray(e.detail)) setTradeHistory(e.detail);
    };
    const handleUser = (e) => {
      if (e.detail) setUser(e.detail);
    };

    window.addEventListener('swag_balance_updated', handleBalance);
    window.addEventListener('swag_fiat_uah_updated', handleFiat);
    window.addEventListener('swag_web3_unlocked', handleUnlocked);
    window.addEventListener('swag_edits_updated', handleEdits);
    window.addEventListener('swag_open_orders_updated', handleOpenOrders);
    window.addEventListener('swag_trades_updated', handleTrades);
    window.addEventListener('swag_user_updated', handleUser);

    return () => {
      window.removeEventListener('swag_balance_updated', handleBalance);
      window.removeEventListener('swag_fiat_uah_updated', handleFiat);
      window.removeEventListener('swag_web3_unlocked', handleUnlocked);
      window.removeEventListener('swag_edits_updated', handleEdits);
      window.removeEventListener('swag_open_orders_updated', handleOpenOrders);
      window.removeEventListener('swag_trades_updated', handleTrades);
      window.removeEventListener('swag_user_updated', handleUser);
    };
  }, []);

  // Живая котировка (микро-флуктуации курса)
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.14;
      setTickerTick(prev => {
        const next = parseFloat((Math.max(66.45, Math.min(67.75, prev + delta))).toFixed(2));
        if (orderType === 'MARKET') {
          setOrderPrice(String(next));
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isUnlocked, orderType]);

  // Разблокировка доступа за 67 000 $SWAG
  const handleUnlockWeb3 = () => {
    if (balance < UNLOCK_COST) {
      showToast(`❌ Недостаточно средств! Требуется ${UNLOCK_COST.toLocaleString()} $SWAG. Ваш баланс: ${balance.toLocaleString()} $SWAG`);
      return;
    }

    db.addBalance(-UNLOCK_COST);
    db.unlockWeb3();
    setIsUnlocked(true);
    showToast(`💎 ДОСТУП К КРИПТО-БИРЖЕ РАЗБЛОКИРОВАН! Списано ${UNLOCK_COST.toLocaleString()} $SWAG.`);
  };

  // КНОПКА ВОЗВРАТА К КАРТОЧКЕ ОПЛАТЫ ВХОДА (ПО ТРЕБОВАНИЮ ПОЛЬЗОВАТЕЛЯ)
  const handleLockWeb3 = () => {
    db.lockWeb3();
    setIsUnlocked(false);
    setIsAutoSpin(false);
    setShowPreviewModal(false);
    soundService.playClick && soundService.playClick();
    showToast('🔒 Доступ закрыт. Вы вернулись на карточку оплаты входа (67 000 $SWAG).');
  };

  // Быстрая эмиссия токенов для Founder (строго проверено на права роли)
  const handleFounderMint = (amount = 100000) => {
    if (!isFounder) {
      showToast('❌ Ошибка доступа: Эмиссия $SWAG разрешена только для роли FOUNDER / SWAG GOD');
      return;
    }
    db.addBalance(amount);
    showToast(`👑 FOUNDER EMISSION: +${amount.toLocaleString()} $SWAG начислено на баланс!`);
  };

  // Быстрое пополнение гривен (UAH ₴) для тестирования биржи
  const handleMintFiatUah = (amount = 50000) => {
    if (!isFounder) {
      showToast('❌ Ошибка доступа: Пополнение гривен разрешено только для роли FOUNDER / SWAG GOD');
      return;
    }
    db.addFiatBalance(amount);
    showToast(`💳 НАЧИСЛЕНИЕ ФИАТА: +${amount.toLocaleString()} ₴ на баланс для торговли!`);
  };

  // Фильтрация эдитов по хайповым жанрам (Роналдо 2008, Арсенал 2008, Баленсиаги, SoundCloud, Суперкары)
  const filteredEdits = useMemo(() => {
    if (editsCategory === 'Все') return edits;
    const cat = editsCategory.toLowerCase();

    if (cat.includes('роналдо') || cat.includes('cr7')) {
      return edits.filter(e => {
        const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
        return text.includes('роналдо') || text.includes('ronaldo') || text.includes('cr7') || text.includes('goat');
      });
    }
    if (cat.includes('арсенал') || cat.includes('arsenal')) {
      return edits.filter(e => {
        const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
        return text.includes('арсенал') || text.includes('arsenal') || text.includes('wenger') || text.includes('gunners');
      });
    }
    if (cat.includes('баленсиаг') || cat.includes('balenciaga')) {
      return edits.filter(e => {
        const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
        return text.includes('баленсиаг') || text.includes('balenciaga') || text.includes('demna') || text.includes('mud');
      });
    }
    if (cat.includes('soundcloud') || cat.includes('саундклауд') || cat.includes('саундклод')) {
      return edits.filter(e => {
        const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
        return text.includes('soundcloud') || text.includes('саундкл') || text.includes('pluggnb') || text.includes('808') || text.includes('type shit');
      });
    }
    if (cat.includes('суперкар') || cat.includes('машин') || cat.includes('дрифт')) {
      return edits.filter(e => {
        const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
        return text.includes('суперкар') || text.includes('drift') || text.includes('supercar') || text.includes('macan') || text.includes('porsche') || text.includes('дрифт') || text.includes('авто');
      });
    }
    return edits.filter(e => {
      const text = `${e.anime || ''} ${e.title || ''} ${e.tag || ''}`.toLowerCase();
      return text.includes(cat);
    });
  }, [edits, editsCategory]);

  // Динамический радиус цилиндра в зависимости от количества эдитов (строго без наложения карточек)
  const cylinderRadius = useMemo(() => {
    const n = Math.max(3, filteredEdits.length);
    return Math.max(350, Math.round(135 / Math.tan(Math.PI / n)));
  }, [filteredEdits.length]);

  // Восстановление всех дефолтных эдитов при исчезновении
  const handleRestoreDefaultEdits = () => {
    const restored = db.restoreDefaultEdits();
    setEdits(restored);
    setEditsCategory('Все');
    setActiveEditIndex(0);
    setDrumRotation(0);
    showToast('✨ Молитвенный барабан освящен: все 9 эдитов восстановлены!');
  };

  // Выбор конкретного эдита с точной центровкой барабана
  const handleSelectEdit = (idx) => {
    if (!filteredEdits.length) return;
    const stepDeg = 360 / Math.max(1, filteredEdits.length);
    setActiveEditIndex(idx);
    setDrumRotation(-idx * stepDeg);
    setPlaybackPhase('video');
    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
  };

  // Перемотка стрелкой ВПЕРЕД (Next) - строго в сторону следующего эдита
  const handleNextEdit = (e) => {
    if (e) e.stopPropagation();
    if (filteredEdits.length <= 1) return;
    const nextIdx = (activeEditIndex + 1) % filteredEdits.length;
    const stepDeg = 360 / filteredEdits.length;
    setActiveEditIndex(nextIdx);
    setDrumRotation(r => r - stepDeg);
    setPlaybackPhase('video');
    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
  };

  // Перемотка стрелкой НАЗАД (Prev) - строго в сторону предыдущего эдита
  const handlePrevEdit = (e) => {
    if (e) e.stopPropagation();
    if (filteredEdits.length <= 1) return;
    const prevIdx = (activeEditIndex - 1 + filteredEdits.length) % filteredEdits.length;
    const stepDeg = 360 / filteredEdits.length;
    setActiveEditIndex(prevIdx);
    setDrumRotation(r => r + stepDeg);
    setPlaybackPhase('video');
    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
  };

  // Крутить молитвенный барабан эдитов (Ручной спин с идеальной посадкой на выпавший эдит + начисление кармы)
  const spinDrum = () => {
    if (isSpinning || filteredEdits.length === 0) return;
    setIsSpinning(true);
    soundService.playPrayerWheelSpin && soundService.playPrayerWheelSpin();

    const newSpins = spinCount + 1;
    const newKarma = karmaScore + 67;
    setSpinCount(newSpins);
    setKarmaScore(newKarma);
    try {
      localStorage.setItem('swag_prayer_spins', newSpins.toString());
      localStorage.setItem('swag_prayer_karma', newKarma.toString());
    } catch {}

    const targetIndex = Math.floor(Math.random() * filteredEdits.length);
    const stepDeg = 360 / Math.max(1, filteredEdits.length);
    const spins = 3 + Math.floor(Math.random() * 2);

    // Вращение вперед с точным приземлением на -targetIndex * stepDeg
    const currentBase = Math.round(drumRotation / 360) * 360;
    const targetDeg = currentBase - (spins * 360) - (targetIndex * stepDeg);

    setDrumRotation(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      setActiveEditIndex(targetIndex);
      setDrumRotation(-targetIndex * stepDeg);
      const chosen = filteredEdits[targetIndex];
      showToast(`🕉️ СВЯЩЕННЫЙ ВЫБОР: «${chosen?.title || 'Свежий дроп'}»! ✨ Карма: +67 • Оборотов: ${newSpins}`);
    }, 1800);
  };

  // Мгновенное исполнение одиночного открытого ордера
  const handleExecuteSingleOrder = (order) => {
    const res = db.executeOpenOrder(order.id);
    if (res) {
      if (order.side === 'BUY') {
        showToast(`⚡ Ордер исполнен! Зачислено: +${order.amount.toLocaleString()} ${order.pair.split('/')[0]}`);
      } else {
        showToast(`💰 Ордер исполнен! Начислено: +${order.total.toLocaleString()} ₴ на фиатный баланс!`);
      }
    }
  };

  // Мгновенное исполнение ВСЕХ открытых ордеров (Забрать бабки сразу)
  const handleExecuteAllOrders = () => {
    const res = db.executeAllOpenOrders();
    if (res.count > 0) {
      showToast(`🚀 ВСЕ ОРДЕРА ИСПОЛНЕНЫ (${res.count} шт)! Начислено: +${res.uah.toLocaleString()} ₴ и +${res.swag.toLocaleString()} SWAG!`);
    } else {
      showToast('Нет открытых ордеров для исполнения.');
    }
  };

  const currentEdit = filteredEdits[activeEditIndex] || filteredEdits[0] || {};

  // ===================================================
  // ЦИКЛ ПРЕДПРОСМОТРА: 15 СЕКУНД ВИДЕО -> 3 СЕКУНДЫ ОБЛОЖКА -> ЗАНОВО
  // Воспроизводится СТРОГО ОРИГИНАЛЬНЫЙ ЗВУК ВИДЕО (без песни летник)
  // ===================================================
  useEffect(() => {
    setPlaybackPhase('video');
    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
    if (popupVideoRef.current) {
      try {
        popupVideoRef.current.currentTime = 0;
        popupVideoRef.current.muted = isMuted;
        popupVideoRef.current.volume = volume;
        if (isVideoPlaying && showPreviewModal && !isPlayerEditing) {
          popupVideoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Video reset error:', e);
      }
    }
  }, [activeEditIndex, editsCategory, showPreviewModal, isPlayerEditing]);

  // Синхронизация звука и видео при паузе / смене громкости / открытии плеера
  useEffect(() => {
    if (!showPreviewModal || isPlayerEditing) {
      if (popupVideoRef.current) popupVideoRef.current.pause();
      return;
    }

    if (isVideoPlaying && playbackPhase === 'video') {
      if (popupVideoRef.current) {
        popupVideoRef.current.muted = isMuted;
        popupVideoRef.current.volume = volume;
        popupVideoRef.current.play().catch(() => {});
      }
    } else {
      if (popupVideoRef.current) popupVideoRef.current.pause();
    }
  }, [showPreviewModal, isPlayerEditing, isVideoPlaying, playbackPhase, isMuted, volume, currentEdit?.id]);

  // Цикл воспроизведения в окне плеера (15 секунд видео -> 3 секунды обложка -> перезапуск)
  useEffect(() => {
    if (!isUnlocked || !isVideoPlaying || filteredEdits.length === 0 || !showPreviewModal || isPlayerEditing) {
      if (autoSpinIntervalRef.current) {
        clearInterval(autoSpinIntervalRef.current);
        autoSpinIntervalRef.current = null;
      }
      return;
    }

    autoSpinIntervalRef.current = setInterval(() => {
      setPhaseTimeLeft(prev => {
        if (prev <= 1) {
          if (playbackPhase === 'video') {
            // Фаза 1 (15 секунд видео) закончилась -> показываем обложку на 3 секунды
            setPlaybackPhase('cover');
            if (popupVideoRef.current) {
              try { popupVideoRef.current.pause(); } catch (e) {}
            }
            return COVER_PHASE_DURATION; // 3 секунды
          } else {
            // Фаза 2 (3 секунды обложки) закончилась -> заново 15 секунд видео!
            setPlaybackPhase('video');
            if (isAutoSpin && filteredEdits.length > 1) {
              const stepDeg = 360 / filteredEdits.length;
              setDrumRotation(r => r - stepDeg);
              setActiveEditIndex(curr => (curr + 1) % filteredEdits.length);
            }
            if (popupVideoRef.current) {
              try {
                popupVideoRef.current.currentTime = 0;
                popupVideoRef.current.muted = isMuted;
                popupVideoRef.current.volume = volume;
                popupVideoRef.current.play().catch(() => {});
              } catch (e) {}
            }
            return VIDEO_PHASE_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoSpinIntervalRef.current) {
        clearInterval(autoSpinIntervalRef.current);
        autoSpinIntervalRef.current = null;
      }
    };
  }, [isUnlocked, isVideoPlaying, filteredEdits.length, showPreviewModal, playbackPhase, isAutoSpin, isPlayerEditing, isMuted, volume]);

  // Плавное медленное автовращение барабана каждые 7 секунд при включенном режиме
  useEffect(() => {
    if (!isUnlocked || !isAutoSpin || isSpinning || filteredEdits.length <= 1 || showPreviewModal) return;
    const timer = setInterval(() => {
      const stepDeg = 360 / filteredEdits.length;
      setDrumRotation(r => r - stepDeg);
      setActiveEditIndex(curr => (curr + 1) % filteredEdits.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isUnlocked, isAutoSpin, isSpinning, filteredEdits.length, showPreviewModal]);

  // Лайк эдита
  const toggleLikeEdit = (id) => {
    setLikedEdits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Загрузка обложки из локального файла
  const handleCoverFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      showToast('⚠️ Файл обложки слишком большой (максимум 30 МБ)');
      return;
    }
    pendingCoverBlobRef.current = file;
    const blobUrl = URL.createObjectURL(file);
    setNewEditCover(blobUrl);
    showToast('✓ Обложка эдита успешно загружена из файла!');
  };

  // Загрузка видеоклипа из локального файла
  const handleVideoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      showToast('⚠️ Видеофайл слишком большой (максимум 80 МБ)');
      return;
    }
    pendingVideoBlobRef.current = file;
    const blobUrl = URL.createObjectURL(file);
    setNewEditVideoUrl(blobUrl);
    showToast('✓ Видеоклип успешно загружен из файла!');
  };

  // Открыть плеер в режиме создания нового эдита (прямо в окне плеера)
  const handleOpenAddModal = () => {
    setEditingEditId(null);
    setNewEditTitle('');
    setNewEditAuthor(db.getUser().handle || '@swag_creator');
    setNewEditSound('SoundCloud Type Beat // 808 Distorted Bass (Speed Up)');
    setNewEditCover('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80');
    setNewEditVideoUrl('https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4');
    setNewEditTag('РОНАЛДО 2008 PRIME ⚡');
    setNewEditAnime('Роналдо 2008 Prime');
    setNewEditNote('Хайповый эдит в молитвенный барабан SWAG INC.');
    setCoverSourceType('url');
    setVideoSourceType('url');
    setIsPlayerEditing(true);
    setShowPreviewModal(true);
  };

  // Открыть плеер в режиме редактирования выбранного эдита (прямо в окне плеера)
  const handleStartEdit = (editToEdit = currentEdit) => {
    if (!editToEdit || !editToEdit.id) return;
    setEditingEditId(editToEdit.id);
    setNewEditTitle(editToEdit.title || '');
    setNewEditAuthor(editToEdit.author || '');
    setNewEditSound(editToEdit.sound || '');
    setNewEditCover(editToEdit.cover || '');
    setNewEditVideoUrl(editToEdit.videoUrl || '');
    setNewEditTag(editToEdit.tag || 'ANIME ZONE 🏀');
    setNewEditAnime(editToEdit.anime || 'Баскетбол Куроко');
    setNewEditNote(editToEdit.videoNote || '');
    setCoverSourceType(editToEdit.cover && (editToEdit.cover.startsWith('data:') || editToEdit.cover.startsWith('blob:') || editToEdit.cover.startsWith('idb:')) ? 'file' : 'url');
    setVideoSourceType(editToEdit.videoUrl && (editToEdit.videoUrl.startsWith('data:') || editToEdit.videoUrl.startsWith('blob:') || editToEdit.videoUrl.startsWith('idb:')) ? 'file' : 'url');
    setIsPlayerEditing(true);
    setShowPreviewModal(true);
  };

  // Удаление любого эдита из барабана
  const handleDeleteEdit = (editToDelete = currentEdit) => {
    if (!editToDelete || !editToDelete.id) return;
    const confirmDelete = window.confirm(`Удалить эдит «${editToDelete.title}» из барабана?`);
    if (!confirmDelete) return;

    db.deleteEdit(editToDelete.id);
    setActiveEditIndex(0);
    setDrumRotation(0);
    setIsPlayerEditing(false);
    showToast(`🗑️ Эдит «${editToDelete.title}» успешно удален из барабана!`);
  };

  // Сохранение эдита (Создание или Обновление) прямо в окне плеера с гарантированной персистенцией
  const handleSaveCustomEdit = async (e) => {
    if (e) e.preventDefault();
    
    // Автоматическая подстановка качественного названия, если поле пустое
    const title = newEditTitle.trim() || `${newEditAnime.toUpperCase()} // SWAG EDIT #${Math.floor(1000 + Math.random() * 9000)}`;
    const sound = newEditSound.trim() || 'Kordhell — Live Another Day (Phonk)';
    const author = newEditAuthor.trim() || db.getUser().handle || '@swag_creator';
    const cover = newEditCover.trim() || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
    const videoUrl = newEditVideoUrl.trim() || null;
    const tag = newEditTag.trim() || 'ANIME ZONE 🏀';
    const anime = newEditAnime.trim() || 'Баскетбол Куроко';
    const videoNote = newEditNote.trim() || 'Аниме-эдит из молитвенного барабана.';

    const rawBlobs = {
      videoBlob: pendingVideoBlobRef.current,
      coverBlob: pendingCoverBlobRef.current
    };

    if (editingEditId) {
      // Обновление существующего эдита
      const updatedList = await db.updateEdit(editingEditId, {
        title,
        sound,
        author,
        cover,
        videoUrl,
        tag,
        anime,
        videoNote
      }, rawBlobs);
      if (Array.isArray(updatedList)) setEdits(updatedList);
      showToast(`💾 Эдит «${title}» успешно сохранен!`);
    } else {
      // Создание нового эдита
      const created = {
        id: `custom-edit-${Date.now()}`,
        title,
        sound,
        author,
        likes: 1,
        shares: 0,
        cover,
        videoUrl,
        tag,
        anime,
        videoNote
      };
      const updatedList = await db.addEdit(created, rawBlobs);
      if (Array.isArray(updatedList)) setEdits(updatedList);
      setEditsCategory('Все'); // Все эдиты видны сразу вместе
      setActiveEditIndex(0);
      setDrumRotation(0);
      showToast(`🚀 Эдит «${title}» сохранен в молитвенный барабан!`);
    }

    pendingVideoBlobRef.current = null;
    pendingCoverBlobRef.current = null;
    setIsPlayerEditing(false);
    setEditingEditId(null);
    setPlaybackPhase('video');
    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
    setIsVideoPlaying(true);
  };

  // Исполнение ордера на бирже (Binance Buy/Sell с гривнами UAH)
  // МГНОВЕННОЕ ИСПОЛНЕНИЕ: деньги и крипта поступают на баланс сразу!
  const handleExecuteOrder = () => {
    const amountNum = parseFloat(orderAmount);
    const priceNum = parseFloat(orderPrice) || tickerTick;

    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Укажите корректный объем заявки!');
      return;
    }

    const totalUah = Math.round(amountNum * priceNum);

    if (tradeSide === 'BUY') {
      // ПОКУПКА КРИПТЫ ЗА ГРИВНЫ
      if (fiatUah < totalUah) {
        showToast(`❌ Недостаточно гривен (UAH)! Нужно: ${totalUah.toLocaleString()} ₴. Нажмите «+50K ₴» выше!`);
        return;
      }

      // Мгновенно списываем фиат и начисляем крипту на баланс
      db.addFiatBalance(-totalUah);
      if (currentPair === 'SWAG/UAH') {
        db.addBalance(Math.round(amountNum));
      }
      db.addTrade({
        pair: currentPair,
        side: 'BUY',
        price: priceNum,
        amount: amountNum,
        total: totalUah
      });
      showToast(`⚡ Ордер мгновенно исполнен: начислено +${amountNum.toLocaleString()} ${currentPair.split('/')[0]} (Списано ${totalUah.toLocaleString()} ₴)!`);
    } else {
      // ПРОДАЖА КРИПТЫ ЗА ГРИВНЫ
      if (currentPair === 'SWAG/UAH' && balance < amountNum) {
        showToast(`❌ Недостаточно $SWAG! Ваш баланс: ${balance.toLocaleString()} $SWAG`);
        return;
      }

      // Мгновенно списываем крипту и начисляем гривны на фиатный баланс
      if (currentPair === 'SWAG/UAH') {
        db.addBalance(-Math.round(amountNum));
      }
      db.addFiatBalance(totalUah);
      db.addTrade({
        pair: currentPair,
        side: 'SELL',
        price: priceNum,
        amount: amountNum,
        total: totalUah
      });
      showToast(`💰 Ордер мгновенно исполнен: начислено +${totalUah.toLocaleString()} ₴ на фиатный баланс!`);
    }
  };

  const currentTimeframeData = TIMEFRAME_DATASETS[timeframe] || TIMEFRAME_DATASETS['15M'];

  return (
    <div className="web3-page-layout">
      {toastMsg && (
        <div className="swag-web3-toast">
          <span className="toast-spark">⚡</span>
          <span>{toastMsg}</span>
        </div>
      )}



      {/* ===================================================
          1. КАРТОЧКА ДЛЯ ПЕРЕХОДА (ЕСЛИ ДОСТУП ЕЩЕ НЕ ОПЛАЧЕН)
          =================================================== */}
      {!isUnlocked ? (
        <div className="web3-gate-container container">
          <div className="web3-access-card">
            <div className="access-card-glow"></div>
            
            <div className="access-badge">
              <span className="gate-dot blink"></span>
              <span>RESTRICTED PROTOCOL // VIP ENCRYPTED NODE</span>
            </div>

            <h1 className="access-card-title gothic-text">
              WEB 3.0 // DECENTRALIZED PROTOCOL
            </h1>
            
            <p className="access-card-desc">
              Закрытая децентрализованная крипто-биржа <strong className="highlight">SWAG EX</strong> со смарт-контрактами SwagChain, торговлей за гривны (UAH ₴), функциями Binance и интерактивной <strong className="highlight">барабанной лентой аниме-эдитов (Куроко, Блю Лок)</strong>.
            </p>

            <div className="access-price-box">
              <div className="price-tag-label">СТОИМОСТЬ РАЗБЛОКИРОВКИ ДОСТУПА:</div>
              <div className="price-tag-val">
                67 000 <span className="val-sub">$SWAG</span>
              </div>
              <div className="price-tag-rate">
                Фиксированный курс привязки: <strong>1 $SWAG = 67 Гривень (UAH ₴)</strong>
              </div>
            </div>

            <div className="access-balance-info">
              <span>Ваш текущий баланс:</span>
              <strong className={balance >= UNLOCK_COST ? 'balance-ok' : 'balance-low'}>
                {balance.toLocaleString()} $SWAG
              </strong>
            </div>

            <div className="access-actions-box">
              {balance >= UNLOCK_COST ? (
                <button 
                  className="cyber-btn unlock-btn"
                  onClick={handleUnlockWeb3}
                >
                  💎 ОПЛАТИТЬ 67 000 $SWAG И ВОЙТИ НА БИРЖУ
                </button>
              ) : (
                <div className="insufficient-funds-wrap">
                  <button 
                    className="cyber-btn unlock-btn disabled"
                    onClick={() => showToast(
                      isFounder 
                        ? `Не хватает ${(UNLOCK_COST - balance).toLocaleString()} $SWAG. Воспользуйтесь кнопкой эмиссии ниже!`
                        : `Не хватает ${(UNLOCK_COST - balance).toLocaleString()} $SWAG. Заработайте $SWAG в Казино Web 4.0 или Маркетплейсе!`
                    )}
                  >
                    🔒 НЕДОСТАТОЧНО $SWAG (ТРЕБУЕТСЯ 67 000)
                  </button>

                  {isFounder && (
                    <button 
                      className="cyber-btn mint-access-btn"
                      onClick={() => handleFounderMint(100000)}
                      title="Выпустить $SWAG в качестве Создателя / Founder"
                    >
                      👑 ЭМИССИЯ ДЛЯ FOUNDER (+100 000 $SWAG)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="access-footer-stats">
              <div>✓ SMART CONTRACT: 0x71C...B29</div>
              <div>✓ NETWORK: SWAG-CHAIN MAINNET</div>
              <div>✓ E2EE SHIELD: 100% SECURED BY J.A.R.V.I.S.</div>
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================
            2. РАЗБЛОКИРОВАННАЯ КРИПТО-БИРЖА + БАРАБАННАЯ ЛЕНТА
            =================================================== */
        <div className="web3-unlocked-container container">
          {/* Верхняя панель котировок, двойного баланса и кнопки возврата */}
          <div className="web3-ticker-bar">
            <div className="ticker-item primary-peg">
              <span className="ticker-label">КУРС ПРИВЯЗКИ $SWAG:</span>
              <span className="ticker-val highlight">1 SWAG = {tickerTick} UAH (67 гривень)</span>
              <span className="ticker-change">+67.0% 🚀</span>
            </div>

            {/* ДВОЙНОЙ БАЛАНС: $SWAG + ГРИВНЫ (UAH ₴) */}
            <div className="ticker-item">
              <span className="ticker-label">БАЛАНС $SWAG:</span>
              <span className="ticker-val balance-badge">{balance.toLocaleString()} $SWAG</span>
            </div>

            <div className="ticker-item">
              <span className="ticker-label">БАЛАНС ГРИВЕНЬ (UAH):</span>
              <span className="ticker-val uah-badge">{fiatUah.toLocaleString()} ₴</span>
            </div>

            <div className="ticker-actions-cluster">
              {isFounder && (
                <>
                  <button 
                    className="quick-mint-btn"
                    onClick={() => handleFounderMint(50000)}
                    title="Эмиссия монет для Founder"
                  >
                    +50K SWAG
                  </button>

                  <button 
                    className="quick-mint-btn uah-mint-btn"
                    onClick={() => handleMintFiatUah(10000)}
                    title="Пополнить фиатные гривны для торговли на бирже"
                  >
                    +10K ₴
                  </button>
                </>
              )}

              {/* КНОПКА ВОЗВРАТА НА КАРТОЧКУ ОПЛАТЫ ВХОДА */}
              <button 
                className="cyber-btn lock-gate-btn"
                onClick={handleLockWeb3}
                title="Вернуться назад на карточку для оплаты входа (заблокировать доступ)"
              >
                🔒 ВЕРНУТЬСЯ К ОПЛАТЕ ВХОДА
              </button>
            </div>
          </div>

          {/* ===================================================
              СЕКЦИЯ 1: ТИБЕТСКИЙ МОЛИТВЕННЫЙ БАРАБАН ЭДИТОВ (MANI WHEEL)
              СВЯЩЕННЫЙ БАРАБАН С МАНТРАМИ, НАВЕРШИЕМ И РУКОЯТЬЮ
              =================================================== */}
          <div className="web3-drum-section prayer-wheel-section">
            <div className="section-header-row">
              <div>
                <div className="drum-pill-cluster">
                  <span className="drum-pill-badge prayer-badge">🕉️ ТИБЕТСКИЙ МОЛИТВЕННЫЙ БАРАБАН</span>
                  <span className="drum-pill-sub">ОМ МАНИ ПАДМЕ ХУМ • ВРАЩЕНИЕ ПРИНОСИТ БЛАГОСЛОВЕНИЕ И СВЭГ</span>
                </div>
                <h2 className="section-main-title">МОЛИТВЕННЫЙ БАРАБАН ЭДИТОВ</h2>
              </div>

              <div className="drum-controls-row">
                {/* Категории эдитов */}
                <div className="drum-category-pills">
                  {['Все', 'Роналдо Prime 2008', 'Арсенал 2008', 'Баленсиаги', 'SoundCloud', 'Суперкары'].map(cat => (
                    <button
                      key={cat}
                      className={`drum-cat-btn ${editsCategory === cat ? 'active' : ''}`}
                      onClick={() => {
                        setEditsCategory(cat);
                        setActiveEditIndex(0);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button 
                  className={`cyber-btn drum-spin-btn prayer-spin-btn ${isSpinning ? 'spinning' : ''}`}
                  onClick={spinDrum}
                  disabled={isSpinning}
                >
                  {isSpinning ? '🕉️ БАРАБАН ВРАЩАЕТСЯ...' : '🕉️ ВРАЩАТЬ МОЛИТВЕННЫЙ БАРАБАН'}
                </button>

                {/* АВТО-ВРАЩЕНИЕ БАРАБАНА */}
                <button 
                  className={`cyber-btn auto-spin-btn ${isAutoSpin ? 'active' : ''}`}
                  onClick={() => setIsAutoSpin(prev => !prev)}
                >
                  {isAutoSpin ? '⏸ СТОП ВРАЩЕНИЕ' : '🔄 АВТО-ВРАЩЕНИЕ'}
                </button>

                {/* ВОССТАНОВИТЬ ХАЙПОВЫЕ ЭДИТЫ */}
                <button 
                  type="button"
                  className="cyber-btn restore-edits-btn"
                  onClick={handleRestoreDefaultEdits}
                  title="Восстановить дефолтные эдиты (Роналдо 2008, Арсенал 2008, Баленсиаги, SoundCloud, Суперкары)"
                >
                  🔄 ХАЙПОВЫЕ ЭДИТЫ
                </button>

                {/* КНОПКА ДОБАВИТЬ СВОЙ ЭДИТ */}
                <button 
                  className="cyber-btn add-custom-edit-btn"
                  onClick={handleOpenAddModal}
                  title="Добавить свой эдит или клип на молитвенный барабан"
                >
                  ➕ ДОБАВИТЬ ЭДИТ
                </button>
              </div>
            </div>

            {/* ДУХОВНЫЙ БАННЕР СТАТИСТИКИ КАРМЫ И ТАЙП ЩИТ */}
            <div className="prayer-spiritual-banner">
              <div className="spiritual-stat-badge">
                <span className="stat-icon">🕉️</span>
                <div className="stat-text">
                  <span className="stat-label">СВЯЩЕННАЯ КАРМА СВЭГА</span>
                  <span className="stat-value">+{karmaScore.toLocaleString()} KARMA</span>
                </div>
              </div>
              <div className="spiritual-stat-badge">
                <span className="stat-icon">☸️</span>
                <div className="stat-text">
                  <span className="stat-label">ОБОРОТОВ БАРАБАНА</span>
                  <span className="stat-value">{spinCount} МОЛИТВ</span>
                </div>
              </div>
              <div className="spiritual-stat-badge type-shit-badge">
                <span className="stat-icon">✝️</span>
                <div className="stat-text">
                  <span className="stat-label">ВАЙБ БАРАБАНА</span>
                  <span className="stat-value">TYPE SHIT // VAMP 67</span>
                </div>
              </div>
            </div>

            {/* 3D Сцена молитвенного барабана (Tibetan Mani Wheel) */}
            <div className="drum-stage-viewport prayer-wheel-viewport">
              <div className="drum-ambient-glow prayer-glow"></div>

              {/* Центральный золотой шпиндель / ось вращения (сзади карточек) */}
              <div className="prayer-wheel-axis-spindle" />

              {/* Верхний пояс священной мантры на барабане с бегущей строкой */}
              <div className="prayer-mantra-band top-mantra">
                <div className="mantra-marquee-track">
                  <span className="mantra-text">ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ • ॐ मणि पद्मे हूँ • SWAG CHAIN 67 • TYPE SHIT • ATREIYA MODE • OM MANI PADME HUM • </span>
                  <span className="mantra-text">ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ • ॐ मणि पद्मे हूँ • SWAG CHAIN 67 • TYPE SHIT • ATREIYA MODE • OM MANI PADME HUM • </span>
                </div>
              </div>

              {/* Нижний пояс мантры и лотосовых лепестков с бегущей строкой */}
              <div className="prayer-mantra-band bottom-mantra">
                <div className="mantra-marquee-track">
                  <span className="mantra-text">☸ DHARMACHAKRA 67 ☸ OM MANI PADME HUM ☸ SPIRITUAL MANI WHEEL ☸ SWAG GOD PROTOCOL ☸ </span>
                  <span className="mantra-text">☸ DHARMACHAKRA 67 ☸ OM MANI PADME HUM ☸ SPIRITUAL MANI WHEEL ☸ SWAG GOD PROTOCOL ☸ </span>
                </div>
              </div>

              {/* Подвесной маятник с золотым шариком-противовесом на цепочке (справа от барабана) */}
              <div className={`prayer-wheel-pendulum ${isSpinning ? 'swinging' : ''}`}>
                <div className="pendulum-chain" />
                <div className="pendulum-bead" title="Священный противовес молитвенного барабана" />
              </div>

              {/* Стрелки на самом барабане для быстрой перемотки */}
              <button 
                type="button" 
                className="drum-stage-arrow left" 
                onClick={handlePrevEdit} 
                title="Предыдущий эдит"
              >
                ◀
              </button>
              <button 
                type="button" 
                className="drum-stage-arrow right" 
                onClick={handleNextEdit} 
                title="Следующий эдит"
              >
                ▶
              </button>
              
              <div 
                className="drum-cylinder-reel prayer-cylinder"
                style={{
                  transform: `rotateY(${drumRotation}deg)`
                }}
              >
                {filteredEdits.map((edit, idx) => {
                  const angle = idx * (360 / Math.max(1, filteredEdits.length));
                  const isCurrent = idx === activeEditIndex;
                  return (
                    <div 
                      key={edit.id}
                      className={`drum-slot-card prayer-slot-card ${isCurrent ? 'is-selected' : ''}`}
                      style={{
                        transform: `rotateY(${angle}deg) translateZ(${cylinderRadius}px)`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEdit(idx);
                        setIsVideoPlaying(true);
                        setIsMuted(false);
                        setIsPlayerEditing(false);
                        setShowPreviewModal(true);
                        showToast(`🎬 Открыт плеер эдита: «${edit.title}»`);
                      }}
                    >
                      <div className="slot-card-image-wrap">
                        <img 
                          src={edit.cover} 
                          alt="" 
                          className="slot-card-img" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="slot-card-backdrop-overlay" />
                        
                        {isCurrent && edit.videoUrl && (
                          <video 
                            src={edit.videoUrl} 
                            className="slot-card-video" 
                            autoPlay 
                            loop 
                            muted={true} 
                            playsInline
                            preload="auto"
                            poster={edit.cover}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoadedMetadata={(e) => {
                              e.currentTarget.muted = true;
                              e.currentTarget.play().catch(() => {});
                            }}
                            onTimeUpdate={(e) => {
                              if (e.currentTarget.currentTime >= 20) {
                                e.currentTarget.currentTime = 0;
                              }
                            }}
                            onPlay={(e) => {
                              e.currentTarget.muted = true;
                            }}
                          />
                        )}

                        <div className="slot-card-top-row">
                          <span className="slot-card-tag">{edit.tag}</span>
                          <span className="slot-card-karma-badge">🕉️ 67</span>
                        </div>
                      </div>

                      <div className="slot-card-info">
                        <h4 className="slot-card-title">{edit.title}</h4>
                        <div className="slot-card-author-row">
                          <span className="slot-card-author">{edit.author}</span>
                        </div>
                        {edit.sound && <div className="slot-card-sound">🎵 {edit.sound}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Нижний резной лотосовый трон-основание и рукоять */}
              <div className="prayer-wheel-lotus-base">
                <div className="prayer-wheel-handle-crank">
                  <div className="crank-rod" />
                  <div className="crank-grip" title="Рукоять вращения молитвенного барабана" />
                </div>
              </div>
            </div>

            {/* ГОРИЗОНТАЛЬНАЯ СТРУКТУРИРОВАННАЯ ЛЕНТА ВСЕХ ЭДИТОВ (ВСЕ ВМЕСТЕ) */}
            <div className="drum-filmstrip-container">
              <div className="filmstrip-header">
                <span className="filmstrip-title">🎞️ ВСЕ ЭДИТЫ В КОЛЛЕКЦИИ ({filteredEdits.length})</span>
                <span className="filmstrip-hint">Нажмите на любой эдит, чтобы мгновенно прокрутить барабан</span>
              </div>
              <div className="drum-filmstrip-scroll">
                {filteredEdits.map((edit, idx) => {
                  const isSelected = idx === activeEditIndex;
                  return (
                    <div 
                      key={edit.id}
                      className={`filmstrip-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectEdit(idx)}
                      title={`Выбрать «${edit.title}»`}
                    >
                      <div className="filmstrip-thumb-wrap">
                        <img 
                          src={edit.cover} 
                          alt="" 
                          className="filmstrip-thumb" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <span className="filmstrip-num">#{idx + 1}</span>
                        {isSelected && <span className="filmstrip-active-tag">В ЭФИРЕ</span>}
                      </div>
                      <div className="filmstrip-item-meta">
                        <h5 className="filmstrip-item-title">{edit.title}</h5>
                        <span className="filmstrip-item-tag">{edit.tag || edit.anime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Компактная кибер-панель барабана */}
            <div className="drum-control-deck-bar">
              <div className="deck-left-summary">
                <span className="deck-active-pill">🎬 ТЕКУЩИЙ ЭДИТ НА БАРАБАНЕ:</span>
                <h3 className="deck-active-title">{currentEdit.title}</h3>
                <div className="deck-sub-row">
                  <span className="deck-author">Автор: <strong>{currentEdit.author}</strong></span>
                  <span className="deck-sep">•</span>
                  <span className="deck-sound">🎵 {currentEdit.sound}</span>
                  <span className="deck-sep">•</span>
                  {currentEdit.anime && <span className="deck-anime-pill">{currentEdit.anime}</span>}
                </div>
              </div>

              <div className="deck-right-actions">
                {/* ГЛАВНАЯ КНОПКА: ОТКРЫТЬ ОТДЕЛЬНОЕ ОКНО ПЛЕЕРА С ВКЛЮЧЕННЫМ ЗВУКОМ */}
                <button 
                  type="button"
                  className="cyber-btn deck-open-popup-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaybackPhase('video');
                    setPhaseTimeLeft(VIDEO_PHASE_DURATION);
                    setIsVideoPlaying(true);
                    setIsMuted(false); // ВКЛЮЧАЕМ ЗВУК ПРИ ПЕРЕХОДЕ
                    setIsPlayerEditing(false);
                    setShowPreviewModal(true);
                  }}
                  title="Открыть плеер эдита в отдельном всплывающем окне"
                >
                  🎬 СМОТРЕТЬ ЭДИТ В ОТДЕЛЬНОМ ОКНЕ
                </button>

                <button 
                  type="button"
                  className="cyber-btn deck-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(currentEdit);
                  }}
                  title="Редактировать эдит"
                >
                  ✏️
                </button>

                <button 
                  type="button"
                  className="cyber-btn deck-action-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEdit(currentEdit);
                  }}
                  title="Удалить эдит из барабана"
                >
                  🗑️
                </button>

                {/* Навигация */}
                <button 
                  type="button"
                  className="cyber-btn deck-nav-btn"
                  onClick={handlePrevEdit}
                  title="Предыдущий эдит"
                >
                  ⏮
                </button>

                <button 
                  type="button"
                  className="cyber-btn deck-nav-btn"
                  onClick={handleNextEdit}
                  title="Следующий эдит"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>

          {showPreviewModal && (
            <div 
              className="swag-modal-overlay player-modal-overlay" 
              onClick={() => {
                setShowPreviewModal(false);
                setIsPlayerEditing(false);
              }}
            >
              <div 
                className="swag-modal-card edit-player-modal-window" 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Шапка окна плеера / студии с вкладками переключения режимов */}
                <div className="player-window-header">
                  <div className="player-title-cluster">
                    <div className="player-mode-tabs">
                      <button 
                        type="button"
                        className={`player-tab-pill ${!isPlayerEditing ? 'active' : ''}`}
                        onClick={() => setIsPlayerEditing(false)}
                      >
                        <span className="pulse-dot-green"></span>
                        🎬 4K КИБЕР-ПЛЕЕР
                      </button>
                      <button 
                        type="button"
                        className={`player-tab-pill ${isPlayerEditing ? 'active' : ''}`}
                        onClick={() => {
                          if (!isPlayerEditing) {
                            handleStartEdit(currentEdit);
                          }
                        }}
                      >
                        ✏️ {editingEditId ? 'РЕДАКТИРОВАТЬ ЭДИТ' : 'ДОБАВИТЬ ЭДИТ'}
                      </button>
                    </div>
                    <h3 className="player-edit-title">
                      {isPlayerEditing 
                        ? (editingEditId ? `Студия: ${currentEdit.title}` : 'Студия: Новый эдит в барабан')
                        : currentEdit.title}
                    </h3>
                  </div>

                  <div className="player-header-actions">
                    {!isPlayerEditing ? (
                      <>
                        <button 
                          type="button"
                          className="cyber-btn modal-mini-btn edit-trigger-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(currentEdit);
                          }}
                          title="Редактировать эдит прямо в этом окне"
                        >
                          ✏️ ИЗМЕНИТЬ
                        </button>
                        <button 
                          type="button"
                          className="cyber-btn modal-mini-btn danger-trash-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEdit(currentEdit);
                          }}
                          title="Удалить эдит из барабана"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        className="cyber-btn modal-mini-btn view-switch-btn"
                        onClick={() => setIsPlayerEditing(false)}
                        title="Вернуться к просмотру видео"
                      >
                        ◀ К ПРОСМОТРУ
                      </button>
                    )}
                    <button 
                      type="button"
                      className="modal-close-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreviewModal(false);
                        setIsPlayerEditing(false);
                      }}
                      title="Закрыть окно"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* ===================================================
                    ЕСЛИ ВКЛЮЧЕН РЕЖИМ РЕДАКТИРОВАНИЯ — СТУДИЯ ПРЯМО В ОКНЕ ПЛЕЕРА
                    (ПОЛНОСТЬЮ ЗАМЕНЯЕТ ОТДЕЛЬНУЮ МОДАЛКУ СО СКРИНШОТА 2)
                    =================================================== */}
                {isPlayerEditing ? (
                  <div className="player-inline-studio" onClick={(e) => e.stopPropagation()}>
                    <div className="studio-intro-banner">
                      <div className="studio-badge">
                        <span className="pulse-dot-green"></span>
                        CYBER EDIT STUDIO // ВСТРОЕННЫЙ РЕДАКТОР
                      </div>
                      <p className="studio-desc">
                        {editingEditId 
                          ? 'Редактируйте параметры эдита, видео и аудио прямо в окне плеера. Сохранение сразу обновит барабан.'
                          : 'Загрузите новый аниме-эдит или клип по ссылке или файлом. Он мгновенно появится в барабане.'}
                      </p>
                    </div>

                    <form onSubmit={handleSaveCustomEdit} className="studio-form-grid">
                      <div className="form-group span-2">
                        <label>Название эдита:</label>
                        <input 
                          type="text"
                          className="cyber-input"
                          placeholder="Например: ТАЙГА КАГАМИ // 100% ZONE DUNK 🏀"
                          value={newEditTitle}
                          onChange={e => setNewEditTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-row-2 span-2">
                        <div className="form-group">
                          <label>Автор эдита:</label>
                          <input 
                            type="text"
                            className="cyber-input"
                            placeholder="@swag_creator"
                            value={newEditAuthor}
                            onChange={e => setNewEditAuthor(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Аудио-трек / Звук саундтрека:</label>
                          <input 
                            type="text"
                            className="cyber-input"
                            placeholder="Kordhell — Live Another Day (Phonk)"
                            value={newEditSound}
                            onChange={e => setNewEditSound(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-2 span-2">
                        <div className="form-group">
                          <label>Категория / Жанр:</label>
                          <select 
                            className="cyber-input"
                            value={newEditAnime}
                            onChange={e => {
                              setNewEditAnime(e.target.value);
                              if (e.target.value === 'Роналдо 2008 Prime') setNewEditTag('РОНАЛДО 2008 PRIME ⚡');
                              else if (e.target.value === 'Арсенал 2008 Prime') setNewEditTag('АРСЕНАЛ 2008 PRIME 🏆');
                              else if (e.target.value === 'Баленсиаги') setNewEditTag('БАЛЕНСИАГИ TYPE SHIT 🕶️');
                              else if (e.target.value === 'SoundCloud') setNewEditTag('SOUNDCLOUD TYPE SHIT ☁️');
                              else if (e.target.value === 'Суперкары & Дрифт') setNewEditTag('СУПЕРКАРЫ SPEED ⚡');
                              else setNewEditTag('CUSTOM HYPE 🔥');
                            }}
                          >
                            <option value="Роналдо 2008 Prime">⚡ Роналдо 2008 Prime</option>
                            <option value="Арсенал 2008 Prime">🏆 Арсенал 2008 Prime</option>
                            <option value="Баленсиаги">🕶️ Баленсиаги Type Shit</option>
                            <option value="SoundCloud">☁️ SoundCloud Type Beat</option>
                            <option value="Суперкары & Дрифт">🏎️ Суперкары & Дрифт</option>
                            <option value="Свой хайповый жанр">🔥 Свой хайповый жанр</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Бейдж / Тег:</label>
                          <input 
                            type="text"
                            className="cyber-input"
                            placeholder="ANIME ZONE 🏀"
                            value={newEditTag}
                            onChange={e => setNewEditTag(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Обложка эдита: Ссылка или Файл */}
                      <div className="form-group span-2">
                        <label>Обложка эдита (Ссылка или свой файл):</label>
                        <div className="source-toggle-row">
                          <button
                            type="button"
                            className={`source-toggle-btn ${coverSourceType === 'url' ? 'active' : ''}`}
                            onClick={() => setCoverSourceType('url')}
                          >
                            🌐 Ссылка (URL)
                          </button>
                          <button
                            type="button"
                            className={`source-toggle-btn ${coverSourceType === 'file' ? 'active' : ''}`}
                            onClick={() => setCoverSourceType('file')}
                          >
                            📁 Свой файл с устройства
                          </button>
                        </div>

                        {coverSourceType === 'url' ? (
                          <input 
                            type="url"
                            className="cyber-input"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={newEditCover}
                            onChange={e => setNewEditCover(e.target.value)}
                          />
                        ) : (
                          <div className="file-upload-box">
                            <input 
                              type="file"
                              id="inline-edit-cover-file"
                              accept="image/*"
                              className="file-hidden-input"
                              onChange={handleCoverFileChange}
                            />
                            <label htmlFor="inline-edit-cover-file" className="file-upload-label">
                              <span>📁 Выберите файл обложки</span>
                              <small>PNG, JPG, WEBP, GIF (до 20 МБ)</small>
                            </label>
                          </div>
                        )}

                        {newEditCover && (
                          <div className="image-live-preview-box">
                            <span className="preview-label">Превью обложки:</span>
                            <img src={newEditCover} alt="Превью" className="image-live-preview-thumb" />
                          </div>
                        )}
                      </div>

                      {/* Видео эдита: Ссылка или Файл */}
                      <div className="form-group span-2">
                        <label>Видео / Клип эдита (Ссылка или свой файл):</label>
                        <div className="source-toggle-row">
                          <button
                            type="button"
                            className={`source-toggle-btn ${videoSourceType === 'url' ? 'active' : ''}`}
                            onClick={() => setVideoSourceType('url')}
                          >
                            🌐 Ссылка (URL)
                          </button>
                          <button
                            type="button"
                            className={`source-toggle-btn ${videoSourceType === 'file' ? 'active' : ''}`}
                            onClick={() => setVideoSourceType('file')}
                          >
                            📁 Свой видеофайл
                          </button>
                        </div>

                        {videoSourceType === 'url' ? (
                          <input 
                            type="url"
                            className="cyber-input"
                            placeholder="https://assets.mixkit.co/videos/preview/..."
                            value={newEditVideoUrl}
                            onChange={e => setNewEditVideoUrl(e.target.value)}
                          />
                        ) : (
                          <div className="file-upload-box">
                            <input 
                              type="file"
                              id="inline-edit-video-file"
                              accept="video/mp4,video/webm,video/ogg"
                              className="file-hidden-input"
                              onChange={handleVideoFileChange}
                            />
                            <label htmlFor="inline-edit-video-file" className="file-upload-label">
                              <span>📁 Выберите видеоклип с устройства</span>
                              <small>MP4, WebM (до 80 МБ)</small>
                            </label>
                          </div>
                        )}

                        {newEditVideoUrl && (
                          <div className="video-live-preview-box">
                            <span className="preview-label">Превью видео:</span>
                            <video 
                              src={newEditVideoUrl} 
                              className="video-live-preview-thumb" 
                              controls 
                              muted 
                            />
                          </div>
                        )}
                      </div>

                      <div className="form-group span-2">
                        <label>Описание и таймкоды эдита:</label>
                        <textarea 
                          className="cyber-input custom-edit-textarea"
                          rows="2"
                          placeholder="Мощный момент из аниме / дрифта под фонк..."
                          value={newEditNote}
                          onChange={e => setNewEditNote(e.target.value)}
                        />
                      </div>

                      <div className="studio-actions-row span-2">
                        <button 
                          type="button" 
                          className="cyber-btn studio-cancel-btn"
                          onClick={() => setIsPlayerEditing(false)}
                        >
                          ✕ Отмена
                        </button>

                        {editingEditId && (
                          <button 
                            type="button"
                            className="cyber-btn studio-delete-btn danger"
                            onClick={() => handleDeleteEdit(currentEdit)}
                          >
                            🗑️ Удалить эдит
                          </button>
                        )}

                        <button 
                          type="submit"
                          className="cyber-btn studio-submit-btn"
                        >
                          {editingEditId ? '💾 СОХРАНИТЬ ИЗМЕНЕНИЯ' : '🚀 ОПУБЛИКОВАТЬ В БАРАБАН'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ===================================================
                     РЕЖИМ 4K КИБЕР-ПЛЕЕРА:
                     ЗАПОЛНЕНИЕ КАДРА (COVER) + АМБИЕНТНЫЙ НЕОНОВЫЙ ФОН + ЗВУК
                     =================================================== */
                  <>
                    {/* Индикатор фазы воспроизведения: 18с Видео -> 3с Обложка */}
                    <div className="player-phase-bar">
                      <div className="phase-badge-left">
                        {playbackPhase === 'video' ? (
                          <span className="phase-pill video-pill">
                            🎬 ВИДЕО ЭДИТА СО ЗВУКОМ • {phaseTimeLeft} сек. из {VIDEO_PHASE_DURATION} сек.
                          </span>
                        ) : (
                          <span className="phase-pill cover-pill">
                            📸 ОБЛОЖКА ЭДИТА • {phaseTimeLeft} сек. из {COVER_PHASE_DURATION} сек.
                          </span>
                        )}
                      </div>

                      <div className="phase-progress-wrap">
                        <div 
                          className={`phase-progress-bar ${playbackPhase === 'video' ? 'is-video' : 'is-cover'}`}
                          style={{
                            width: playbackPhase === 'video' 
                              ? `${((VIDEO_PHASE_DURATION - phaseTimeLeft) / VIDEO_PHASE_DURATION) * 100}%`
                              : `${((COVER_PHASE_DURATION - phaseTimeLeft) / COVER_PHASE_DURATION) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Основная медиа-сцена с амбиентным неоновым фоном и заполнением кадра (устраняет черные пустоты) */}
                    <div className="player-media-stage" onClick={(e) => e.stopPropagation()}>
                      {/* Динамический амбиентный размытый фон на основе обложки эдита */}
                      <div 
                        className="player-stage-ambient-backdrop" 
                        style={{ backgroundImage: `url(${currentEdit.cover})` }}
                      />

                      {playbackPhase === 'video' && currentEdit.videoUrl ? (
                        <video 
                          ref={popupVideoRef}
                          src={currentEdit.videoUrl}
                          className={`player-main-video ${videoFitMode === 'cover' ? 'is-cover' : 'is-contain'}`}
                          autoPlay
                          playsInline
                          muted={isMuted}
                          poster={currentEdit.cover}
                          onError={() => {
                            setPlaybackPhase('cover');
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsVideoPlaying(p => !p);
                          }}
                        />
                      ) : (
                        <div className="player-cover-display">
                          <img 
                            src={currentEdit.cover} 
                            alt="" 
                            className="player-main-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="cover-phase-overlay">
                            <span className="cover-phase-tag">📸 ОБЛОЖКА ЭДИТА (3 СЕКУНДЫ)</span>
                            <span className="cover-countdown-huge">{phaseTimeLeft}</span>
                            <span className="cover-subtext">Далее: перезапуск 15 сек. эдита со звуком</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Панель управления звуком, заполнением экрана и воспроизведением */}
                    <div className="player-controls-panel" onClick={(e) => e.stopPropagation()}>
                      <div className="controls-left-group">
                        {/* Play/Pause */}
                        <button 
                          type="button"
                          className="cyber-btn player-ctrl-btn play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsVideoPlaying(p => !p);
                          }}
                        >
                          {isVideoPlaying ? '⏸ ПАУЗА' : '▶ ИГРАТЬ'}
                        </button>

                        {/* Mute/Unmute звука со звуковой анимацией */}
                        <button 
                          type="button"
                          className={`cyber-btn player-ctrl-btn sound-btn ${!isMuted ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextMuted = !isMuted;
                            setIsMuted(nextMuted);
                            if (popupVideoRef.current) popupVideoRef.current.muted = nextMuted;
                          }}
                          title="Включить / выключить оригинальный звук эдита"
                        >
                          {!isMuted ? (
                            <span className="sound-active-wrap">
                              <span className="cyber-eq-bars">
                                <span className="eq-bar bar-1"></span>
                                <span className="eq-bar bar-2"></span>
                                <span className="eq-bar bar-3"></span>
                              </span>
                              🔊 ОРИГ. ЗВУК: ВКЛ
                            </span>
                          ) : '🔇 БЕЗ ЗВУКА'}
                        </button>

                        {/* Ползунок громкости */}
                        <div className="volume-slider-box" onClick={(e) => e.stopPropagation()}>
                          <span className="volume-icon">🔉</span>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              e.stopPropagation();
                              const v = parseFloat(e.target.value);
                              setVolume(v);
                              setIsMuted(false);
                              if (popupVideoRef.current) {
                                popupVideoRef.current.volume = v;
                                popupVideoRef.current.muted = false;
                              }
                            }}
                            className="player-volume-range"
                          />
                          <span className="volume-percent">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                        </div>

                        {/* КНОПКА ЗАПОЛНЕНИЯ КАДРА: УСТРАНЕНИЕ ПУСТОГО ПРОСТРАНСТВА (ПО ТРЕБОВАНИЮ) */}
                        <button 
                          type="button"
                          className={`cyber-btn player-ctrl-btn fit-toggle-btn ${videoFitMode === 'cover' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFitMode(m => m === 'cover' ? 'contain' : 'cover');
                          }}
                          title="Переключить режим заполнения экрана (устраняет пустое пространство)"
                        >
                          {videoFitMode === 'cover' ? '⛶ ЗАПОЛНИТЬ (100%)' : '⊡ ВПИСАТЬ КАДР'}
                        </button>
                      </div>

                      <div className="controls-right-group">
                        {/* Навигация между эдитами */}
                        <button 
                          type="button"
                          className="cyber-btn player-ctrl-btn nav-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const prevIdx = (activeEditIndex - 1 + filteredEdits.length) % filteredEdits.length;
                            const stepDeg = 360 / Math.max(1, filteredEdits.length);
                            setDrumRotation(r => r - stepDeg);
                            setActiveEditIndex(prevIdx);
                            setPlaybackPhase('video');
                            setPhaseTimeLeft(VIDEO_PHASE_DURATION);
                          }}
                          title="Предыдущий эдит"
                        >
                          ⏮ ПРЕД.
                        </button>

                        <button 
                          type="button"
                          className="cyber-btn player-ctrl-btn nav-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextIdx = (activeEditIndex + 1) % filteredEdits.length;
                            const stepDeg = 360 / Math.max(1, filteredEdits.length);
                            setDrumRotation(r => r + stepDeg);
                            setActiveEditIndex(nextIdx);
                            setPlaybackPhase('video');
                            setPhaseTimeLeft(VIDEO_PHASE_DURATION);
                          }}
                          title="Следующий эдит"
                        >
                          СЛЕД. ⏭
                        </button>

                        {/* Лайк */}
                        <button 
                          type="button"
                          className={`cyber-btn player-ctrl-btn like-btn ${likedEdits[currentEdit.id] ? 'liked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeEdit(currentEdit.id);
                          }}
                        >
                          {likedEdits[currentEdit.id] ? '❤️' : '🤍'} {((currentEdit.likes || 0) + (likedEdits[currentEdit.id] ? 1 : 0)).toLocaleString()}
                        </button>
                      </div>
                    </div>

                    {/* Мета-информация об эдите */}
                    <div className="player-meta-footer" onClick={(e) => e.stopPropagation()}>
                      <div className="meta-line">
                        <span>Автор: <strong>{currentEdit.author}</strong></span>
                        <span className="dot-sep">•</span>
                        <span>Саундтрек: <strong>{currentEdit.sound}</strong></span>
                        <span className="dot-sep">•</span>
                        <span>Тег: <strong>{currentEdit.tag}</strong></span>
                        {currentEdit.anime && (
                          <>
                            <span className="dot-sep">•</span>
                            <span>Аниме: <strong>{currentEdit.anime}</strong></span>
                          </>
                        )}
                      </div>
                      {currentEdit.videoNote && (
                        <p className="meta-note">{currentEdit.videoNote}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ===================================================
              СЕКЦИЯ 2: КРИПТО-БИРЖА SWAG EX (BINANCE FEATURES)
              ФИАТНЫЕ ГРИВНЫ (UAH), ЛИМИТНЫЕ ОРДЕРА, СТАКАН И СВЕЧИ
              =================================================== */}
          <div className="web3-exchange-section">
            {/* Панель выбора торговых пар */}
            <div className="binance-pairs-bar">
              <span className="pairs-title">ТОРГОВЫЕ ПАРЫ (BINANCE SPOT):</span>
              <div className="pairs-buttons-group">
                {Object.keys(TRADING_PAIRS).map(pair => (
                  <button
                    key={pair}
                    className={`pair-btn ${currentPair === pair ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentPair(pair);
                      const basePrice = TRADING_PAIRS[pair].price;
                      setTickerTick(basePrice);
                      setOrderPrice(String(basePrice));
                    }}
                  >
                    <strong>{pair}</strong>
                    <span className="pair-rate-mini">
                      {TRADING_PAIRS[pair].price.toLocaleString()} {TRADING_PAIRS[pair].unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="exchange-layout-grid">
              {/* Левая колонка: Интерактивный график со свечами и шкалой дат */}
              <div className="exchange-chart-column">
                <div className="chart-header-panel">
                  <div className="chart-pair-info">
                    <span className="pair-title">${currentPair}</span>
                    <span className="pair-price highlight">{tickerTick.toLocaleString()} ₴</span>
                    <span className="pair-peg-tag">ПЕГ: 1 SWAG = 67 UAH</span>
                    <span className="timeframe-label-badge">{currentTimeframeData.name}</span>
                  </div>

                  {/* ПОЧИНЕННАЯ ФИЛЬТРАЦИЯ ТАЙМФРЕЙМОВ И ДАТ */}
                  <div className="chart-timeframe-switchers">
                    {['1M', '5M', '15M', '1H', '1D'].map(tf => (
                      <button
                        key={tf}
                        className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                        onClick={() => {
                          setTimeframe(tf);
                          showToast(`📊 Выбран таймфрейм ${tf}: отображаются свечи и даты за период`);
                        }}
                      >
                        {tf}
                      </button>
                    ))}

                    <div className="chart-mode-toggle">
                      <button 
                        className={`mode-btn ${chartMode === 'candles' ? 'active' : ''}`}
                        onClick={() => setChartMode('candles')}
                      >
                        🕯 Свечи
                      </button>
                      <button 
                        className={`mode-btn ${chartMode === 'line' ? 'active' : ''}`}
                        onClick={() => setChartMode('line')}
                      >
                        📈 Линия
                      </button>
                    </div>
                  </div>
                </div>

                {/* Панель фильтрации дат */}
                <div className="chart-date-filter-bar">
                  <span className="filter-hint">ФИЛЬТР ДАТ:</span>
                  <div className="date-preset-pills">
                    {[
                      { id: 'all', label: 'За всё время' },
                      { id: 'today', label: 'Сегодня' },
                      { id: '7d', label: '7 Дней' },
                      { id: '30d', label: '30 Дней' }
                    ].map(f => (
                      <button 
                        key={f.id}
                        className={`date-pill ${dateFilter === f.id ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter(f.id);
                          showToast(`Период графика обновлен: ${f.label}`);
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="date-range-pickers">
                    <label>С: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="cyber-date-input" /></label>
                    <label>По: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="cyber-date-input" /></label>
                  </div>
                </div>

                {/* SVG График биржи */}
                <div className="chart-svg-container">
                  <svg className="exchange-chart-svg" viewBox="0 0 700 320">
                    <defs>
                      <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff5500" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ff5500" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Сетка графика */}
                    <line x1="40" y1="60" x2="680" y2="60" stroke="#1f1f1f" strokeDasharray="4" />
                    <line x1="40" y1="120" x2="680" y2="120" stroke="#1f1f1f" strokeDasharray="4" />
                    <line x1="40" y1="180" x2="680" y2="180" stroke="#1f1f1f" strokeDasharray="4" />
                    <line x1="40" y1="240" x2="680" y2="240" stroke="#1f1f1f" strokeDasharray="4" />
                    <line x1="40" y1="270" x2="680" y2="270" stroke="#333" strokeWidth="1" />

                    {/* Динамические ценовые отметки по шкале Y */}
                    <text x="5" y="64" fill="#888" fontSize="10">{currentTimeframeData.yLabels[0]}</text>
                    <text x="5" y="124" fill="#888" fontSize="10">{currentTimeframeData.yLabels[1]}</text>
                    <text x="5" y="184" fill="#ff5500" fontSize="10" fontWeight="bold">{currentTimeframeData.yLabels[2]}</text>
                    <text x="5" y="244" fill="#888" fontSize="10">{currentTimeframeData.yLabels[3]}</text>

                    {chartMode === 'candles' ? (
                      /* Отрисовка японских свечей выбранного таймфрейма */
                      <g className="candles-group">
                        {currentTimeframeData.candles.map((c, i) => {
                          const fill = c.green ? '#00ff66' : '#ff3344';
                          const top = Math.min(c.o, c.c);
                          const height = Math.max(6, Math.abs(c.o - c.c));
                          return (
                            <g key={i}>
                              {/* Фитиль */}
                              <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={fill} strokeWidth="1.5" />
                              {/* Тело */}
                              <rect x={c.x - 7} y={top} width="14" height={height} fill={fill} rx="1" />
                            </g>
                          );
                        })}

                        {/* Скользящая средняя MA(7) */}
                        <path 
                          d={currentTimeframeData.linePath} 
                          fill="none" 
                          stroke="#ffaa00" 
                          strokeWidth="2" 
                          strokeDasharray="5,2"
                        />
                      </g>
                    ) : (
                      /* Отрисовка непрерывной линии */
                      <g className="line-chart-group">
                        <path 
                          d={currentTimeframeData.areaPath} 
                          fill="url(#chartAreaGrad)" 
                        />
                        <path 
                          d={currentTimeframeData.linePath} 
                          fill="none" 
                          stroke="#ff5500" 
                          strokeWidth="3" 
                        />
                      </g>
                    )}

                    {/* Метки дат и времени по оси X */}
                    {currentTimeframeData.labels.map((lbl, idx) => {
                      const total = currentTimeframeData.labels.length;
                      const xPos = 50 + idx * ((640 - 50) / Math.max(1, total - 1));
                      return (
                        <g key={idx}>
                          <line x1={xPos} y1="268" x2={xPos} y2="274" stroke="#666" />
                          <text 
                            x={xPos} 
                            y="290" 
                            fill="#aaa" 
                            fontSize="9" 
                            textAnchor="middle"
                            fontFamily="Share Tech Mono"
                          >
                            {lbl}
                          </text>
                        </g>
                      );
                    })}

                    {/* Текущая цена пульсирующий маркер */}
                    <circle cx="640" cy="50" r="5" fill="#00ff66" />
                    <circle cx="640" cy="50" r="12" fill="#00ff66" opacity="0.3" className="blink" />
                    <line x1="40" y1="50" x2="640" y2="50" stroke="#00ff66" strokeDasharray="2" />
                  </svg>
                </div>
              </div>

              {/* Правая колонка: Торговый модуль Binance + Стакан заявок */}
              <div className="exchange-trade-column">
                <div className="swap-card-box binance-order-box">
                  {/* Переключатель режимов: LIMIT / MARKET */}
                  <div className="order-type-switchers">
                    <button 
                      className={`order-type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                      onClick={() => setOrderType('LIMIT')}
                    >
                      ЛИМИТ (LIMIT)
                    </button>
                    <button 
                      className={`order-type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                      onClick={() => {
                        setOrderType('MARKET');
                        setOrderPrice(String(tickerTick));
                      }}
                    >
                      МАРКЕТ (MARKET)
                    </button>
                  </div>

                  {/* BUY / SELL Кнопки */}
                  <div className="swap-mode-tabs binance-side-tabs">
                    <button 
                      className={`swap-tab ${tradeSide === 'BUY' ? 'active buy' : ''}`}
                      onClick={() => setTradeSide('BUY')}
                    >
                      КУПИТЬ {currentPair.split('/')[0]}
                    </button>
                    <button 
                      className={`swap-tab ${tradeSide === 'SELL' ? 'active sell' : ''}`}
                      onClick={() => setTradeSide('SELL')}
                    >
                      ПРОДАТЬ {currentPair.split('/')[0]}
                    </button>
                  </div>

                  <div className="swap-inputs-body">
                    {/* Цена ордера (для лимита) */}
                    <div className="swap-input-group">
                      <div className="swap-label-row">
                        <span>ЦЕНА ОРДЕРА ({currentPair.split('/')[1]}):</span>
                        <span className="rate-hint">Рынок: {tickerTick} ₴</span>
                      </div>
                      <div className="swap-field-row">
                        <input 
                          type="number"
                          step="0.05"
                          className={`cyber-input swap-val-input ${orderType === 'MARKET' ? 'read-only' : ''}`}
                          value={orderPrice}
                          readOnly={orderType === 'MARKET'}
                          onChange={(e) => setOrderPrice(e.target.value)}
                        />
                        <span className="currency-pill uah">UAH ₴</span>
                      </div>
                    </div>

                    {/* Количество крипты */}
                    <div className="swap-input-group">
                      <div className="swap-label-row">
                        <span>КОЛИЧЕСТВО ({currentPair.split('/')[0]}):</span>
                        <span className="balance-hint">
                          {tradeSide === 'BUY' 
                            ? `Фиат: ${fiatUah.toLocaleString()} ₴`
                            : `Доступно: ${balance.toLocaleString()} $SWAG`}
                        </span>
                      </div>
                      <div className="swap-field-row">
                        <input 
                          type="number"
                          step="1"
                          className="cyber-input swap-val-input"
                          value={orderAmount}
                          onChange={(e) => setOrderAmount(e.target.value)}
                        />
                        <span className="currency-pill">{currentPair.split('/')[0]}</span>
                      </div>
                    </div>

                    {/* Быстрый выбор процентов (25%, 50%, 75%, 100%) */}
                    <div className="quick-percent-row">
                      {[25, 50, 75, 100].map(pct => (
                        <button 
                          key={pct} 
                          type="button" 
                          className="pct-pill-btn"
                          onClick={() => {
                            if (tradeSide === 'BUY') {
                              const maxUah = fiatUah;
                              const p = parseFloat(orderPrice) || tickerTick;
                              const amt = Math.floor((maxUah * (pct / 100)) / p);
                              setOrderAmount(String(Math.max(1, amt)));
                            } else {
                              const amt = Math.floor(balance * (pct / 100));
                              setOrderAmount(String(Math.max(1, amt)));
                            }
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    {/* Итоговая сумма ордера в гривнах */}
                    <div className="order-total-summary">
                      <div className="total-row-item">
                        <span>ИТОГО К ОПЛАТЕ:</span>
                        <strong className="total-uah-val">
                          {(Math.round((parseFloat(orderAmount) || 0) * (parseFloat(orderPrice) || tickerTick))).toLocaleString()} ₴
                        </strong>
                      </div>
                      <div className="total-sub-item">
                        Комиссия сети SWAG (0.00%): <span>0.00 ₴ (FOUNDER PROMO)</span>
                      </div>
                    </div>

                    {/* Кнопка отправки ордера */}
                    <button 
                      className={`cyber-btn submit-order-btn ${tradeSide === 'BUY' ? 'btn-buy' : 'btn-sell'}`}
                      onClick={handleExecuteOrder}
                    >
                      {tradeSide === 'BUY' 
                        ? `⚡ КУПИТЬ ${currentPair.split('/')[0]} ЗА ${(Math.round((parseFloat(orderAmount) || 0) * (parseFloat(orderPrice) || tickerTick))).toLocaleString()} ₴`
                        : `🔥 ПРОДАТЬ ${currentPair.split('/')[0]} ЗА ${(Math.round((parseFloat(orderAmount) || 0) * (parseFloat(orderPrice) || tickerTick))).toLocaleString()} ₴`}
                    </button>
                  </div>
                </div>

                {/* Стакан заявок (Order Book: Asks & Bids) */}
                <div className="binance-orderbook-card">
                  <div className="orderbook-header">
                    <h4>📊 БИРЖЕВОЙ СТАКАН ({currentPair})</h4>
                    <span className="live-spread">Спред: 0.15 ₴</span>
                  </div>

                  <div className="orderbook-columns-head">
                    <span>ЦЕНА (₴)</span>
                    <span>КОЛИЧЕСТВО</span>
                    <span>ВСЕГО (₴)</span>
                  </div>

                  {/* Красная зона: Asks (Продажи) */}
                  <div className="orderbook-list asks-list">
                    {[
                      { price: (tickerTick + 0.35).toFixed(2), amount: 1540, total: Math.round(1540 * (tickerTick + 0.35)) },
                      { price: (tickerTick + 0.20).toFixed(2), amount: 4800, total: Math.round(4800 * (tickerTick + 0.20)) },
                      { price: (tickerTick + 0.08).toFixed(2), amount: 8920, total: Math.round(8920 * (tickerTick + 0.08)) }
                    ].map((row, idx) => (
                      <div key={`ask-${idx}`} className="orderbook-row ask-row" onClick={() => setOrderPrice(row.price)}>
                        <span className="ob-price text-red">{row.price}</span>
                        <span className="ob-amt">{row.amount.toLocaleString()}</span>
                        <span className="ob-total">{row.total.toLocaleString()} ₴</span>
                      </div>
                    ))}
                  </div>

                  {/* Текущая цена по центру */}
                  <div className="orderbook-mid-price">
                    <span className="mid-price-val">{tickerTick.toFixed(2)} ₴</span>
                    <span className="mid-price-status">≈ 1.00 SWAG</span>
                  </div>

                  {/* Зеленая зона: Bids (Покупки) */}
                  <div className="orderbook-list bids-list">
                    {[
                      { price: (tickerTick - 0.05).toFixed(2), amount: 11200, total: Math.round(11200 * (tickerTick - 0.05)) },
                      { price: (tickerTick - 0.18).toFixed(2), amount: 6400, total: Math.round(6400 * (tickerTick - 0.18)) },
                      { price: (tickerTick - 0.30).toFixed(2), amount: 3100, total: Math.round(3100 * (tickerTick - 0.30)) }
                    ].map((row, idx) => (
                      <div key={`bid-${idx}`} className="orderbook-row bid-row" onClick={() => setOrderPrice(row.price)}>
                        <span className="ob-price text-green">{row.price}</span>
                        <span className="ob-amt">{row.amount.toLocaleString()}</span>
                        <span className="ob-total">{row.total.toLocaleString()} ₴</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя часть Binance: Открытые ордера, История сделок, Активы */}
            <div className="binance-bottom-module">
              <div className="binance-tabs-bar">
                <button 
                  className={`binance-tab-btn ${binanceTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setBinanceTab('orders')}
                >
                  📋 ОТКРЫТЫЕ ОРДЕРА ({openOrders.length})
                </button>
                <button 
                  className={`binance-tab-btn ${binanceTab === 'history' ? 'active' : ''}`}
                  onClick={() => setBinanceTab('history')}
                >
                  📜 ИСТОРИЯ СДЕЛОК ({tradeHistory.length})
                </button>
                <button 
                  className={`binance-tab-btn ${binanceTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setBinanceTab('assets')}
                >
                  💼 БАЛАНСЫ И АКТИВЫ
                </button>
              </div>

              <div className="binance-tab-content">
                {binanceTab === 'orders' && (
                  <div className="orders-table-wrap">
                    {openOrders.length > 0 ? (
                      <>
                        <div className="orders-action-top-bar">
                          <div className="orders-summary-badge">
                            <span>⚡ Открытых заявок: <strong>{openOrders.length}</strong></span>
                            <span>• Нажмите для моментального зачисления средств на баланс</span>
                          </div>
                          <button
                            type="button"
                            className="cyber-btn execute-all-orders-btn"
                            onClick={handleExecuteAllOrders}
                            title="Исполнить все ордера разом и моментально получить все деньги на баланс"
                          >
                            ⚡ ИСПОЛНИТЬ ВСЕ ОРДЕРА (ЗАБРАТЬ ВСЕ ДЕНЬГИ)
                          </button>
                        </div>

                        <table className="binance-table">
                          <thead>
                            <tr>
                              <th>ДАТА / ВРЕМЯ</th>
                              <th>ПАРА</th>
                              <th>ТИП</th>
                              <th>СТОРОНА</th>
                              <th>ЦЕНА</th>
                              <th>КОЛИЧЕСТВО</th>
                              <th>ВСЕГО (₴)</th>
                              <th>СТАТУС</th>
                              <th>ДЕЙСТВИЕ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {openOrders.map(ord => (
                              <tr key={ord.id}>
                                <td>{ord.date}</td>
                                <td><strong>{ord.pair}</strong></td>
                                <td>{ord.type}</td>
                                <td className={ord.side === 'BUY' ? 'text-green' : 'text-red'}>{ord.side}</td>
                                <td>{ord.price} ₴</td>
                                <td>{ord.amount.toLocaleString()}</td>
                                <td>{ord.total.toLocaleString()} ₴</td>
                                <td><span className="order-status-pill">{ord.status}</span></td>
                                <td className="order-actions-cell">
                                  <button 
                                    type="button"
                                    className="execute-order-btn"
                                    onClick={() => handleExecuteSingleOrder(ord)}
                                    title="Исполнить ордер и забрать деньги"
                                  >
                                    ⚡ Исполнить
                                  </button>
                                  <button 
                                    type="button"
                                    className="cancel-order-btn"
                                    onClick={() => {
                                      db.cancelOpenOrder(ord.id);
                                      showToast(`Ордер #${ord.id} отменен, заблокированные средства возвращены!`);
                                    }}
                                  >
                                    ✕ Отменить
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <div className="binance-empty-orders">
                        <span>📭 Нет активных открытых ордеров.</span>
                      </div>
                    )}
                  </div>
                )}

                {binanceTab === 'history' && (
                  <div className="trades-table-wrap">
                    <table className="binance-table">
                      <thead>
                        <tr>
                          <th>ВРЕМЯ</th>
                          <th>ПАРА</th>
                          <th>СТОРОНА</th>
                          <th>ЦЕНА</th>
                          <th>КОЛИЧЕСТВО</th>
                          <th>СУММА</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeHistory.map(tr => (
                          <tr key={tr.id}>
                            <td>{tr.time}</td>
                            <td>{tr.pair}</td>
                            <td className={tr.side === 'BUY' ? 'text-green' : 'text-red'}>{tr.side}</td>
                            <td>{tr.price} ₴</td>
                            <td>{tr.amount.toLocaleString()}</td>
                            <td>{tr.total.toLocaleString()} ₴</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {binanceTab === 'assets' && (
                  <div className="binance-assets-grid">
                    <div className="asset-card">
                      <span className="asset-symbol">$SWAG</span>
                      <span className="asset-name">Swag Protocol Token</span>
                      <strong className="asset-val">{balance.toLocaleString()} SWAG</strong>
                      <span className="asset-fiat">≈ {(balance * 67).toLocaleString()} ₴</span>
                    </div>

                    <div className="asset-card">
                      <span className="asset-symbol uah-sym">UAH ₴</span>
                      <span className="asset-name">Фиатные гривны</span>
                      <strong className="asset-val">{fiatUah.toLocaleString()} ₴</strong>
                      <span className="asset-fiat">Доступно для торговли</span>
                    </div>

                    <div className="asset-card">
                      <span className="asset-symbol btc-sym">BTC</span>
                      <span className="asset-name">Bitcoin Mainnet</span>
                      <strong className="asset-val">0.67000 BTC</strong>
                      <span className="asset-fiat">≈ {(0.67 * 2680000).toLocaleString()} ₴</span>
                    </div>

                    <div className="asset-card">
                      <span className="asset-symbol ton-sym">TON</span>
                      <span className="asset-name">Toncoin Network</span>
                      <strong className="asset-val">670.00 TON</strong>
                      <span className="asset-fiat">≈ {(670 * 268).toLocaleString()} ₴</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Математические формулы */}
            <div className="web3-formulas-box">
              <div className="formulas-title-row">
                <span className="math-icon">∑</span>
                <h3>МАТЕМАТИЧЕСКИЕ МОДЕЛИ И СМАРТ-КОНТРАКТЫ SWAG-CHAIN</h3>
              </div>

              <div className="formulas-cards-grid">
                <div className="formula-card">
                  <div className="formula-badge">AMM LIQUIDITY INVARIANT</div>
                  <div className="formula-math-display">x · y = k</div>
                  <p className="formula-desc">
                    Константное произведение пула ликвидности SwagSwap. Гарантирует автоматическое ценообразование и стабильность при любых объемах.
                  </p>
                  <div className="formula-meta">
                    Резервы пула: <strong>10,000,000 $SWAG</strong> / <strong>670,000,000 UAH</strong>
                  </div>
                </div>

                <div className="formula-card">
                  <div className="formula-badge">BONDING CURVE EQUATION</div>
                  <div className="formula-math-display">
                    P(S) = 67 · (1 + S / 100 000)<sup>1.67</sup>
                  </div>
                  <p className="formula-desc">
                    Формула динамического ценового коридора токена $SWAG с базовой точкой 67 гривень и экспоненциальным ростом.
                  </p>
                  <div className="formula-meta">
                    Экспонента кривой: <strong>γ = 1.67</strong> | Базовый пег: <strong>67.00 ₴</strong>
                  </div>
                </div>

                <div className="formula-card">
                  <div className="formula-badge">STAKING YIELD (APY)</div>
                  <div className="formula-math-display">
                    APY = (1 + r / n)<sup>n</sup> - 1 = 67.67%
                  </div>
                  <p className="formula-desc">
                    Сложный процент при ежедневной капитализации наград за валидацию узлов сети и обеспечение E2EE защиты Джарвиса.
                  </p>
                  <div className="formula-meta">
                    Эффективная доходность: <strong>67.67% годовых</strong>
                  </div>
                </div>

                <div className="formula-card">
                  <div className="formula-badge">SLIPPAGE & GAS PROTOCOL</div>
                  <div className="formula-math-display">
                    ΔP = [Δx / (x + Δx)] · P₀
                  </div>
                  <p className="formula-desc">
                    Защита от сэндвич-атак MEV ботов. Максимальное проскальзывание ограничено до 0.67%, комиссия валидаторам 0.00067 TON.
                  </p>
                  <div className="formula-meta">
                    MEV Guard: <strong>ACTIVE</strong> | Slip Tolerance: <strong>0.67%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Web3Page;

