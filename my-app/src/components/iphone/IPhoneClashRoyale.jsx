import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../../services/soundService';
import { db } from '../../services/db';
import './iphone.css';

// Карты колоды Clash Royale
const CARDS_DECK = [
  {
    id: 'megaknight',
    name: 'Мега-Рыцарь',
    cost: 7,
    hp: 3300,
    damage: 480,
    speed: 1.2,
    range: 1.2,
    icon: '🛡️',
    type: 'troop',
    desc: 'Тяжелый прыжок и удар по площади!'
  },
  {
    id: 'hogrider',
    name: 'Всадник на кабане',
    cost: 4,
    hp: 1400,
    damage: 320,
    speed: 2.2,
    range: 1.0,
    icon: '🐗',
    type: 'troop',
    targetsOnlyTowers: true,
    desc: 'HOG RIDERRR! Мчит прямо к башне!'
  },
  {
    id: 'barrel',
    name: 'Бочка гоблинов',
    cost: 3,
    damage: 350,
    icon: '🪵',
    type: 'spell_barrel',
    desc: 'Прилетает прямо на вражескую вышку!'
  },
  {
    id: 'fireball',
    name: 'Огненный шар',
    cost: 4,
    damage: 650,
    icon: '🔥',
    type: 'spell_aoe',
    desc: 'Взрывной фаербол по башням и войску!'
  },
  {
    id: 'skeletons',
    name: 'Армия скелетов',
    cost: 3,
    hp: 150,
    damage: 120,
    speed: 1.8,
    count: 6,
    icon: '💀',
    type: 'troop_swarm',
    desc: 'Орда скелетов для остановки танков!'
  },
  {
    id: 'pekka',
    name: 'П.Е.К.К.А',
    cost: 7,
    hp: 3400,
    damage: 820,
    speed: 0.9,
    range: 1.2,
    icon: '🤖',
    type: 'troop',
    desc: 'Стальная броня и сокрушительный удар мечом!'
  }
];

const ENEMY_CARD_PRESETS = [
  { name: 'Мини ПЕККА', hp: 1100, damage: 380, speed: 1.5, icon: '🥞' },
  { name: 'Маленький Дракон', hp: 950, damage: 190, speed: 1.4, icon: '🐲' },
  { name: 'Рыцарь', hp: 1450, damage: 180, speed: 1.2, icon: '⚔️' },
  { name: 'Гоблины', hp: 200, damage: 95, speed: 2.0, icon: '👺' }
];

// GTA 5 Контакты
const GTA_CONTACTS = [
  {
    id: 'lester',
    name: 'Lester Crest',
    role: 'Организатор ограблений',
    avatar: '👓',
    perk: 'Снять 5 звезд розыска',
    cost: 1000,
    response: 'Ладно, я сниму копов с твоего хвоста. Но это стоило мне немалых услуг!'
  },
  {
    id: 'mechanic',
    name: 'Автомеханик',
    role: 'Доставка личного транспорта',
    avatar: '🔧',
    perk: 'Доставить Porsche 911 GT3 RS',
    cost: 0,
    response: "I'm on the clock! Что тебе подогнать? Тачка уже на парковке!"
  },
  {
    id: 'macan',
    name: 'MACAN (Босс)',
    role: 'Founder // SWAG GOD',
    avatar: '👑',
    perk: 'Запустить трек Летник на весь Лос-Сантос',
    cost: 0,
    response: 'Салам, родной! Starlink в Сомали работает стабильно. Летник разрывает сабы!'
  },
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S. (AI Core)',
    role: 'Защитный узел E2EE',
    avatar: '🤖',
    perk: 'Просканировать узел на угрозы',
    cost: 0,
    response: 'Сэр, все каналы связи зашифрованы по военному протоколу ATreiya Mode.'
  },
  {
    id: 'pegasus',
    name: 'Pegasus Concierge',
    role: 'Авиа-служба',
    avatar: '🚁',
    perk: 'Подать вертолет Buzzard',
    cost: 200,
    response: 'Ваш вертолет доставлен на ближайшую вертолетную площадку у Maze Bank.'
  }
];

// GTA 5 Сообщения
const INITIAL_MESSAGES = [
  {
    id: 'msg_1',
    from: 'Lester Crest',
    preview: 'Дело в Maze Bank готово...',
    text: 'Йоу, Macan! Команда в сборе, хакеры пробили шлюз хранилища Maze Bank. Заходи на биржу Web 3.0 и забирай куш.',
    time: '14:22',
    unread: true
  },
  {
    id: 'msg_2',
    from: 'Franklin Clinton',
    preview: 'Брат, подъезжай на Вайнвуд...',
    text: 'Братка, мы с Ламаром на районе гоняем на М5 под твой новый дроп «Летник». Сабвуферы плавятся!',
    time: '13:05',
    unread: false
  },
  {
    id: 'msg_3',
    from: 'Автомеханик',
    preview: 'Тачка доставлена!',
    text: 'Твой заряженный Porsche 911 GT3 RS припаркован прямо у главного входа. Ключи в замке зажигания.',
    time: '11:40',
    unread: false
  }
];

// GTA 5 Автопарк
const GARAGE_VEHICLES = [
  { id: 'porsche', name: 'Porsche 911 GT3 RS', type: 'Суперкар', speed: '340 км/ч', plate: 'SWAG 67', icon: '🏎️' },
  { id: 'bmw', name: 'BMW M5 CS (F90)', type: 'Седан Stage 3', speed: '325 км/ч', plate: 'VAMP 001', icon: '🚗' },
  { id: 'oppressor', name: 'Pegassi Oppressor Mk II', type: 'Ховербайк', speed: '210 км/ч', plate: 'GODMODE', icon: '🛸' },
  { id: 'chiron', name: 'Truffade Nero Custom', type: 'Гиперкар', speed: '420 км/ч', plate: 'MACAN 67', icon: '🏁' }
];

export const IPhoneClashRoyale = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState('home'); // 'home', 'clash', 'messages', 'contacts', 'browser', 'camera', 'radio', 'garage', 'save', 'settings'
  const [phoneTime, setPhoneTime] = useState('16:20');
  
  // GTA V Настройки обоев
  const [wallpaper, setWallpaper] = useState('dark'); // 'dark', 'sunset', 'matrix', 'somali'
  const [saveBanner, setSaveBanner] = useState(null);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [cameraFilter, setCameraFilter] = useState('normal');
  const [photoSavedNotice, setPhotoSavedNotice] = useState(false);

  // GTA V Звонки
  const [activeCall, setActiveCall] = useState(null); // { contact, timer, status: 'calling'|'talking' }
  const [callTimer, setCallTimer] = useState(0);

  // GTA V Сообщения
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // GTA V Радио
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState('SWAG VAMP 4 FM («Летник»)');

  // Баланс пользователя
  const [balance, setBalance] = useState(() => db.getBalance());

  // ==========================================
  // CLASH ROYALE GAME STATE
  // ==========================================
  const [gameTime, setGameTime] = useState(180);
  const [gameActive, setGameActive] = useState(true);
  const [elixir, setElixir] = useState(5);
  const [selectedCard, setSelectedCard] = useState(null);

  const [blueKingHp, setBlueKingHp] = useState(4000);
  const [blueLeftHp, setBlueLeftHp] = useState(2534);
  const [blueRightHp, setBlueRightHp] = useState(2534);
  const [redKingHp, setRedKingHp] = useState(4000);
  const [redLeftHp, setRedLeftHp] = useState(2534);
  const [redRightHp, setRedRightHp] = useState(2534);

  const [blueCrowns, setBlueCrowns] = useState(0);
  const [redCrowns, setRedCrowns] = useState(0);
  const [units, setUnits] = useState([]);
  const [kingEmoteActive, setKingEmoteActive] = useState(false);
  const [battleNotice, setBattleNotice] = useState('БИТВА CLASH ROYALE! ВЫБЕРИТЕ КАРТУ И ТАПНИТЕ ПО МОСТУ');

  const gameLoopRef = useRef(null);
  const elixirTimerRef = useRef(null);

  // Часы в статус-баре
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Баланс слушатель
  useEffect(() => {
    const handleBalance = (e) => setBalance(e.detail);
    window.addEventListener('swag_balance_updated', handleBalance);
    return () => window.removeEventListener('swag_balance_updated', handleBalance);
  }, []);

  // Таймер звонка
  useEffect(() => {
    let callInterval;
    if (activeCall && activeCall.status === 'talking') {
      callInterval = setInterval(() => {
        setCallTimer(c => c + 1);
      }, 1000);
    }
    return () => clearInterval(callInterval);
  }, [activeCall]);

  // Восстановление эликсира Clash Royale
  useEffect(() => {
    if (!isOpen || currentApp !== 'clash' || !gameActive) return;
    elixirTimerRef.current = setInterval(() => {
      setElixir(prev => (prev < 10 ? prev + 1 : 10));
    }, gameTime <= 60 ? 1000 : 1600);

    return () => clearInterval(elixirTimerRef.current);
  }, [isOpen, currentApp, gameActive, gameTime]);

  // Таймер матча Clash Royale
  useEffect(() => {
    if (!isOpen || currentApp !== 'clash' || !gameActive) return;
    const timer = setInterval(() => {
      setGameTime(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, currentApp, gameActive]);

  // Игровой цикл Clash Royale
  useEffect(() => {
    if (!isOpen || currentApp !== 'clash' || !gameActive) return;

    gameLoopRef.current = setInterval(() => {
      setUnits(prevUnits => {
        let updated = prevUnits.map(unit => {
          let nextProgress = unit.progress + (unit.side === 'blue' ? unit.speed : -unit.speed);
          
          if (unit.side === 'blue' && nextProgress >= 88) {
            damageEnemyTower(unit.lane, unit.damage);
            soundService.playClashTowerHit && soundService.playClashTowerHit();
            return { ...unit, progress: 88, hp: unit.hp - 180 };
          } else if (unit.side === 'red' && nextProgress <= 12) {
            damagePlayerTower(unit.lane, unit.damage);
            soundService.playClashTowerHit && soundService.playClashTowerHit();
            return { ...unit, progress: 12, hp: unit.hp - 180 };
          }

          return { ...unit, progress: nextProgress };
        });

        return updated.filter(u => u.hp > 0 && u.progress >= 0 && u.progress <= 100);
      });

      if (Math.random() < 0.22) {
        spawnEnemyTroop();
      }
    }, 400);

    return () => clearInterval(gameLoopRef.current);
  }, [isOpen, currentApp, gameActive]);

  const damageEnemyTower = (lane, dmg) => {
    if (lane === 'left') {
      setRedLeftHp(prev => {
        const next = Math.max(0, prev - dmg);
        if (next === 0 && prev > 0) {
          setBlueCrowns(c => c + 1);
          setBattleNotice('💥 ЛЕВАЯ ВЫШКА СНЕСЕНА! +1 КОРОНА');
        }
        return next;
      });
    } else {
      setRedRightHp(prev => {
        const next = Math.max(0, prev - dmg);
        if (next === 0 && prev > 0) {
          setBlueCrowns(c => c + 1);
          setBattleNotice('💥 ПРАВАЯ ВЫШКА СНЕСЕНА! +1 КОРОНА');
        }
        return next;
      });
    }
  };

  const damagePlayerTower = (lane, dmg) => {
    if (lane === 'left') {
      setBlueLeftHp(prev => {
        const next = Math.max(0, prev - dmg);
        if (next === 0 && prev > 0) {
          setRedCrowns(c => c + 1);
          setBattleNotice('⚠️ НАША ЛЕВАЯ ВЫШКА ПОТЕРЯНА!');
        }
        return next;
      });
    } else {
      setBlueRightHp(prev => {
        const next = Math.max(0, prev - dmg);
        if (next === 0 && prev > 0) {
          setRedCrowns(c => c + 1);
          setBattleNotice('⚠️ НАША ПРАВАЯ ВЫШКА ПОТЕРЯНА!');
        }
        return next;
      });
    }
  };

  const spawnEnemyTroop = () => {
    const preset = ENEMY_CARD_PRESETS[Math.floor(Math.random() * ENEMY_CARD_PRESETS.length)];
    const lane = Math.random() > 0.5 ? 'left' : 'right';
    const newUnit = {
      id: `red_${Date.now()}_${Math.random()}`,
      side: 'red',
      name: preset.name,
      icon: preset.icon,
      hp: preset.hp,
      maxHp: preset.hp,
      damage: preset.damage,
      lane: lane,
      progress: 88,
      speed: preset.speed * 2.2
    };
    setUnits(prev => [...prev, newUnit]);
  };

  const handleDeployCard = (lane) => {
    if (!selectedCard) {
      setBattleNotice('👉 Сначала выберите карту из колоды внизу!');
      return;
    }
    if (elixir < selectedCard.cost) {
      setBattleNotice(`💧 Не хватает эликсира! Нужно ${selectedCard.cost}`);
      return;
    }

    setElixir(e => e - selectedCard.cost);
    soundService.playClashCardPlace && soundService.playClashCardPlace();

    if (selectedCard.type === 'spell_aoe') {
      damageEnemyTower(lane, selectedCard.damage);
      setBattleNotice(`🔥 Фаербол поразил вышку! -${selectedCard.damage} HP`);
      setSelectedCard(null);
      return;
    }

    if (selectedCard.type === 'spell_barrel') {
      damageEnemyTower(lane, selectedCard.damage);
      setBattleNotice(`🪵 Бочка гоблинов ударила по вышке! -${selectedCard.damage} HP`);
      setSelectedCard(null);
      return;
    }

    const count = selectedCard.count || 1;
    const newTroops = [];
    for (let i = 0; i < count; i++) {
      newTroops.push({
        id: `blue_${Date.now()}_${i}`,
        side: 'blue',
        name: selectedCard.name,
        icon: selectedCard.icon,
        hp: selectedCard.hp,
        maxHp: selectedCard.hp,
        damage: selectedCard.damage,
        lane: lane,
        progress: 12 + i * 2,
        speed: selectedCard.speed * 2.5
      });
    }

    setUnits(prev => [...prev, ...newTroops]);
    setBattleNotice(`⚔️ ${selectedCard.name} высажен на ${lane === 'left' ? 'левый' : 'правый'} мост!`);
    setSelectedCard(null);
  };

  const triggerHeheheha = () => {
    setKingEmoteActive(true);
    soundService.playKingHeheheha && soundService.playKingHeheheha();
    setTimeout(() => setKingEmoteActive(false), 2400);
  };

  const handleRestartMatch = () => {
    setBlueKingHp(4000);
    setBlueLeftHp(2534);
    setBlueRightHp(2534);
    setRedKingHp(4000);
    setRedLeftHp(2534);
    setRedRightHp(2534);
    setBlueCrowns(0);
    setRedCrowns(0);
    setUnits([]);
    setElixir(5);
    setGameTime(180);
    setGameActive(true);
    setBattleNotice('🔄 Матч перезапущен! Вперед за кубками!');
  };

  // ==========================================
  // GTA V PHONE ACTIONS
  // ==========================================
  const handleOpenApp = (appId) => {
    soundService.playClick && soundService.playClick();
    setCurrentApp(appId);
  };

  // Физическая кнопка HOME (внизу телефона)
  const handleHomeButtonClick = () => {
    soundService.playClick && soundService.playClick();
    if (activeCall) {
      handleEndCall();
    }
    if (currentApp !== 'home') {
      setCurrentApp('home');
    } else {
      setIsOpen(false);
    }
  };

  // GTA V Quick Save
  const handleQuickSave = () => {
    soundService.playGtaSave && soundService.playGtaSave();
    setSaveBanner('БЫСТРОЕ СОХРАНЕНИЕ ВЫПОЛНЕНО: СЛОТ #67 (SWAG GOD)');
    setTimeout(() => setSaveBanner(null), 3500);
  };

  // GTA V Snapmatic Camera
  const handleTakePhoto = () => {
    soundService.playCameraShutter && soundService.playCameraShutter();
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
    setPhotoSavedNotice(true);
    setTimeout(() => setPhotoSavedNotice(false), 2500);
  };

  // GTA V Звонок контакту
  const handleStartCall = (contact) => {
    soundService.playPhoneDial && soundService.playPhoneDial();
    setActiveCall({ contact, status: 'calling' });
    setCallTimer(0);

    setTimeout(() => {
      soundService.playPhoneRing && soundService.playPhoneRing();
    }, 400);

    setTimeout(() => {
      setActiveCall({ contact, status: 'talking' });
    }, 2200);
  };

  const handleEndCall = () => {
    soundService.playPhoneHangup && soundService.playPhoneHangup();
    setActiveCall(null);
    setCallTimer(0);
  };

  // GTA V Вызов машины
  const handleRequestVehicle = (vehicle) => {
    soundService.playGtaCarBeep && soundService.playGtaCarBeep();
    setSaveBanner(`🚗 АВТОМЕХАНИК: ${vehicle.name} [${vehicle.plate}] доставлен к вам!`);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  // Переключение трека радио
  const handleToggleRadio = () => {
    const next = !radioPlaying;
    setRadioPlaying(next);
    if (next) {
      soundService.playLetnik && soundService.playLetnik({ loop: true });
    } else {
      soundService.stopLetnik && soundService.stopLetnik();
    }
  };

  return (
    <>
      {/* ПЛАВАЮЩИЙ GTA 5 IFRUIT ТРИГГЕР В ПРАВОМ НИЖНЕМ УГЛУ */}
      <button 
        type="button" 
        className={`gta-phone-trigger-fab ${isOpen ? 'active' : ''}`}
        onClick={() => {
          soundService.playClick && soundService.playClick();
          setIsOpen(!isOpen);
        }}
        title="iFruit 67 Smartphone (GTA V Edition)"
      >
        <div className="phone-fab-icon">📱</div>
        <div className="phone-fab-labels">
          <span className="fab-brand">iFruit 67</span>
          <span className="fab-sub">GTA V OS</span>
        </div>
        <span className="fab-ping-glow"></span>
      </button>

      {/* КОРПУС СМАРТФОНА IFRUIT (APPLE IPHONE 6 STYLE) */}
      {isOpen && (
        <div className="iphone-modal-wrapper">
          <div className={`iphone-chassis iphone-6 gta-ifruit-chassis theme-${wallpaper}`}>
            {/* ВЕРХНЯЯ АНТЕННАЯ ПОЛОСКА */}
            <div className="antenna-stripe top"></div>

            {/* ВЕРХНЯЯ АКУСТИЧЕСКАЯ РЕШЕТКА, ДАТЧИК И СЕЛФИ-КАМЕРА */}
            <div className="iphone-top-sensors">
              <div className="front-camera-lens"></div>
              <div className="earpiece-speaker"></div>
            </div>

            {/* ЭКРАН СМАРТФОНА IFRUIT */}
            <div className="iphone-retina-screen gta-screen-content">
              {/* GTA V БАННЕР БЫСТРОГО СОХРАНЕНИЯ / УВЕДОМЛЕНИЙ */}
              {saveBanner && (
                <div className="gta-save-toast-banner">
                  <span className="gta-save-star">★</span>
                  <span>{saveBanner}</span>
                </div>
              )}

              {/* СТАТУС-БАР ТЕЛЕФОНА (GTA V IFRUIT STYLE) */}
              <div className="gta-status-bar">
                <div className="status-left">
                  <span className="carrier-text">EYEFIND 4G</span>
                  <span className="signal-bars">●●●●○</span>
                </div>
                <div className="status-center">
                  <span className="time-display">{phoneTime}</span>
                </div>
                <div className="status-right">
                  <span className="battery-level">100%</span>
                  <div className="battery-icon"><div className="bat-level"></div></div>
                </div>
              </div>

              {/* ЭКРАН АКТИВНОГО ЗВОНКА (ЕСЛИ ИДЕТ ВЫЗОВ) */}
              {activeCall ? (
                <div className="gta-call-screen">
                  <div className="call-avatar-circle">
                    <span className="call-avatar-emoji">{activeCall.contact.avatar}</span>
                  </div>
                  <h3 className="call-contact-name">{activeCall.contact.name}</h3>
                  <span className="call-contact-role">{activeCall.contact.role}</span>
                  
                  <div className="call-status-badge">
                    {activeCall.status === 'calling' ? (
                      <span className="calling-dots">ВЫЗОВ...</span>
                    ) : (
                      <span className="talking-timer">
                        00:{callTimer.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {activeCall.status === 'talking' && (
                    <div className="call-dialog-bubble">
                      "{activeCall.contact.response}"
                    </div>
                  )}

                  <div className="call-actions-row">
                    <button 
                      type="button" 
                      className="call-hangup-btn"
                      onClick={handleEndCall}
                      title="Завершить вызов"
                    >
                      🛑 СБРОС
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ===================================================
                      1. ДОМАШНИЙ ЭКРАН IFRUIT: СЕТКА 3x3 ИКОНОК
                      =================================================== */}
                  {currentApp === 'home' && (
                    <div className="gta-home-grid-layout">
                      <div className="gta-home-header-widget">
                        <div className="ifruit-logo-tag">iFruit OS // VAMP 4</div>
                        <div className="maze-balance-micro">
                          <span>MAZE BANK:</span>
                          <span className="maze-amt">{balance.toLocaleString()} $SWAG</span>
                        </div>
                      </div>

                      <div className="gta-apps-3x3-grid">
                        {/* 1. CLASH ROYALE */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('clash')}>
                          <div className="app-icon-box cr-app-box">
                            <span className="app-emoji">⚔️</span>
                            <span className="app-badge-pill">PvP</span>
                          </div>
                          <span className="app-label">Clash Royale</span>
                        </div>

                        {/* 2. СООБЩЕНИЯ */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('messages')}>
                          <div className="app-icon-box sms-app-box">
                            <span className="app-emoji">💬</span>
                            <span className="app-counter-dot">1</span>
                          </div>
                          <span className="app-label">Сообщения</span>
                        </div>

                        {/* 3. КОНТАКТЫ */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('contacts')}>
                          <div className="app-icon-box contacts-app-box">
                            <span className="app-emoji">📞</span>
                          </div>
                          <span className="app-label">Контакты</span>
                        </div>

                        {/* 4. БРАУЗЕР (MAZE BANK / EYEFIND) */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('browser')}>
                          <div className="app-icon-box web-app-box">
                            <span className="app-emoji">🌐</span>
                          </div>
                          <span className="app-label">Интернет</span>
                        </div>

                        {/* 5. SNAPMATIC КАМЕРА */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('camera')}>
                          <div className="app-icon-box camera-app-box">
                            <span className="app-emoji">📷</span>
                          </div>
                          <span className="app-label">Snapmatic</span>
                        </div>

                        {/* 6. РАДИО ЛОС-САНТОС */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('radio')}>
                          <div className="app-icon-box radio-app-box">
                            <span className="app-emoji">🎵</span>
                          </div>
                          <span className="app-label">Радио</span>
                        </div>

                        {/* 7. ГАРАЖ И МЕХАНИК */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('garage')}>
                          <div className="app-icon-box garage-app-box">
                            <span className="app-emoji">🏎️</span>
                          </div>
                          <span className="app-label">Гараж</span>
                        </div>

                        {/* 8. БЫСТРОЕ СОХРАНЕНИЕ */}
                        <div className="gta-app-icon-slot" onClick={handleQuickSave}>
                          <div className="app-icon-box save-app-box">
                            <span className="app-emoji">💾</span>
                          </div>
                          <span className="app-label">Сохранение</span>
                        </div>

                        {/* 9. НАСТРОЙКИ */}
                        <div className="gta-app-icon-slot" onClick={() => handleOpenApp('settings')}>
                          <div className="app-icon-box settings-app-box">
                            <span className="app-emoji">⚙️</span>
                          </div>
                          <span className="app-label">Настройки</span>
                        </div>
                      </div>

                      {/* НИЖНИЙ ДОК БЫСТРОГО ДОСТУПА */}
                      <div className="gta-bottom-dock">
                        <button type="button" className="dock-btn" onClick={() => handleOpenApp('clash')} title="Clash Royale">⚔️</button>
                        <button type="button" className="dock-btn" onClick={() => handleOpenApp('messages')} title="Сообщения">💬</button>
                        <button type="button" className="dock-btn" onClick={() => handleOpenApp('contacts')} title="Контакты">📞</button>
                        <button type="button" className="dock-btn" onClick={() => handleOpenApp('browser')} title="Maze Bank">🌐</button>
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      2. ПРИЛОЖЕНИЕ: CLASH ROYALE (ПОЛНАЯ ИГРА)
                      =================================================== */}
                  {currentApp === 'clash' && (
                    <div className="clash-royale-mini-engine">
                      {/* Верхний бар арены */}
                      <div className="cr-top-header">
                        <button 
                          type="button" 
                          className="cr-back-home-btn"
                          onClick={() => setCurrentApp('home')}
                          title="Вернуться на рабочий стол iFruit"
                        >
                          ◀ HOME
                        </button>
                        <div className="cr-crown-score">
                          <span className="blue-crown">👑 {blueCrowns}</span>
                          <span className="match-timer">⏱️ {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</span>
                          <span className="red-crown">{redCrowns} 👑</span>
                        </div>
                      </div>

                      {/* Боевое уведомление */}
                      <div className="cr-battle-ticker">
                        <span>{battleNotice}</span>
                      </div>

                      {/* Арена Clash Royale */}
                      <div className="cr-arena-field">
                        {kingEmoteActive && (
                          <div className="cr-heheheha-popup">
                            <span className="king-face">😂</span>
                            <span className="king-shout">HE-HE-HE-HA!</span>
                          </div>
                        )}

                        {/* Вражеские башни */}
                        <div className="cr-side red-side">
                          <div className="towers-row">
                            <div className="cr-tower princess left" onClick={() => damageEnemyTower('left', 200)}>
                              <div className="tower-hp-bar">
                                <div className="hp-fill" style={{ width: `${(redLeftHp / 2534) * 100}%` }}></div>
                                <span className="hp-text">{redLeftHp}</span>
                              </div>
                              <span className="tower-icon">{redLeftHp > 0 ? '🏰' : '💥'}</span>
                            </div>

                            <div className="cr-tower king">
                              <div className="tower-hp-bar king-hp">
                                <div className="hp-fill" style={{ width: `${(redKingHp / 4000) * 100}%` }}></div>
                                <span className="hp-text">{redKingHp}</span>
                              </div>
                              <span className="tower-icon red-king-icon">👑🏰</span>
                            </div>

                            <div className="cr-tower princess right" onClick={() => damageEnemyTower('right', 200)}>
                              <div className="tower-hp-bar">
                                <div className="hp-fill" style={{ width: `${(redRightHp / 2534) * 100}%` }}></div>
                                <span className="hp-text">{redRightHp}</span>
                              </div>
                              <span className="tower-icon">{redRightHp > 0 ? '🏰' : '💥'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Река и два моста */}
                        <div className="cr-river-barrier">
                          <div className="cr-bridge left-bridge" onClick={() => handleDeployCard('left')} title="Высадить на левый мост">
                            <span className="bridge-tag">МОСТ Л</span>
                          </div>
                          <div className="cr-river-water"><span>🌊 🌊 🌊</span></div>
                          <div className="cr-bridge right-bridge" onClick={() => handleDeployCard('right')} title="Высадить на правый мост">
                            <span className="bridge-tag">МОСТ П</span>
                          </div>
                        </div>

                        {/* Свои башни */}
                        <div className="cr-side blue-side">
                          <div className="towers-row">
                            <div className="cr-tower princess left blue-t">
                              <div className="tower-hp-bar">
                                <div className="hp-fill blue" style={{ width: `${(blueLeftHp / 2534) * 100}%` }}></div>
                                <span className="hp-text">{blueLeftHp}</span>
                              </div>
                              <span className="tower-icon">{blueLeftHp > 0 ? '🏰' : '💥'}</span>
                            </div>

                            <div className="cr-tower king blue-t">
                              <div className="tower-hp-bar king-hp">
                                <div className="hp-fill blue" style={{ width: `${(blueKingHp / 4000) * 100}%` }}></div>
                                <span className="hp-text">{blueKingHp}</span>
                              </div>
                              <span className="tower-icon blue-king-icon">👑🏰</span>
                            </div>

                            <div className="cr-tower princess right blue-t">
                              <div className="tower-hp-bar">
                                <div className="hp-fill blue" style={{ width: `${(blueRightHp / 2534) * 100}%` }}></div>
                                <span className="hp-text">{blueRightHp}</span>
                              </div>
                              <span className="tower-icon">{blueRightHp > 0 ? '🏰' : '💥'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Юниты */}
                        <div className="cr-units-overlay">
                          {units.map((u) => (
                            <div 
                              key={u.id}
                              className={`cr-unit-token ${u.side} ${u.lane}`}
                              style={{
                                top: `${100 - u.progress}%`,
                                left: u.lane === 'left' ? '24%' : '76%'
                              }}
                            >
                              <div className="unit-mini-hp">
                                <div className="unit-hp-fill" style={{ width: `${(u.hp / u.maxHp) * 100}%` }}></div>
                              </div>
                              <span className="unit-ico">{u.icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Эликсир */}
                      <div className="cr-elixir-bar-wrap">
                        <div className="cr-elixir-meter">
                          <div className="elixir-fill" style={{ width: `${(elixir / 10) * 100}%` }}></div>
                          <div className="elixir-ticks">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <span key={n} className={`tick ${elixir >= n ? 'charged' : ''}`}></span>
                            ))}
                          </div>
                        </div>
                        <div className="elixir-counter">
                          <span className="elixir-drop">💧</span>
                          <span className="elixir-val">{elixir}</span>
                          <span className="elixir-max">/10</span>
                        </div>
                      </div>

                      {/* Док карт */}
                      <div className="cr-cards-dock">
                        <button type="button" className="cr-king-laugh-btn" onClick={triggerHeheheha} title="HE-HE-HE-HA!">
                          👑😂
                        </button>

                        <div className="cr-deck-slots">
                          {CARDS_DECK.map(card => {
                            const isSelected = selectedCard?.id === card.id;
                            const canAfford = elixir >= card.cost;
                            return (
                              <div
                                key={card.id}
                                className={`cr-card-slot ${isSelected ? 'selected' : ''} ${canAfford ? 'affordable' : 'unaffordable'}`}
                                onClick={() => setSelectedCard(card)}
                              >
                                <span className="cr-card-cost">{card.cost}</span>
                                <span className="cr-card-icon">{card.icon}</span>
                                <span className="cr-card-name">{card.name}</span>
                              </div>
                            );
                          })}
                        </div>

                        <button type="button" className="cr-rematch-btn" onClick={handleRestartMatch} title="Реванш">
                          🔄
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      3. ПРИЛОЖЕНИЕ: СООБЩЕНИЯ (GTA V SMS)
                      =================================================== */}
                  {currentApp === 'messages' && (
                    <div className="gta-app-inner-view">
                      <div className="gta-app-header">
                        <button className="gta-back-arrow" onClick={() => setSelectedMessage(null) || setCurrentApp('home')}>◀ НАЗАД</button>
                        <h4>СООБЩЕНИЯ</h4>
                        <span className="gta-hdr-icon">💬</span>
                      </div>

                      {selectedMessage ? (
                        <div className="gta-sms-thread-view">
                          <div className="sms-thread-sender">
                            <strong>{selectedMessage.from}</strong>
                            <span className="sms-thread-time">{selectedMessage.time}</span>
                          </div>
                          <div className="sms-thread-bubble incoming">
                            {selectedMessage.text}
                          </div>

                          <div className="sms-quick-reply-box">
                            <span className="quick-reply-label">Быстрый ответ:</span>
                            <button 
                              type="button" 
                              className="gta-reply-btn"
                              onClick={() => {
                                soundService.playClick && soundService.playClick();
                                setSaveBanner('Ответ отправлен!');
                                setTimeout(() => setSaveBanner(null), 2000);
                              }}
                            >
                              «Понял, двигаюсь на точку. VAMP 4 на связи 🤝»
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="gta-messages-list">
                          {messages.map(msg => (
                            <div 
                              key={msg.id} 
                              className="gta-message-item"
                              onClick={() => setSelectedMessage(msg)}
                            >
                              <div className="msg-sender-row">
                                <span className="msg-sender-name">{msg.from}</span>
                                <span className="msg-time">{msg.time}</span>
                              </div>
                              <p className="msg-preview-text">{msg.preview}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===================================================
                      4. ПРИЛОЖЕНИЕ: КОНТАКТЫ (GTA V PHONEBOOK)
                      =================================================== */}
                  {currentApp === 'contacts' && (
                    <div className="gta-app-inner-view">
                      <div className="gta-app-header">
                        <button className="gta-back-arrow" onClick={() => setCurrentApp('home')}>◀ НАЗАД</button>
                        <h4>КОНТАКТЫ</h4>
                        <span className="gta-hdr-icon">📞</span>
                      </div>

                      <div className="gta-contacts-list">
                        {GTA_CONTACTS.map(c => (
                          <div key={c.id} className="gta-contact-item" onClick={() => handleStartCall(c)}>
                            <div className="contact-avatar-box">
                              <span>{c.avatar}</span>
                            </div>
                            <div className="contact-info-col">
                              <span className="contact-name-txt">{c.name}</span>
                              <span className="contact-role-txt">{c.role}</span>
                            </div>
                            <button type="button" className="contact-call-icon-btn">📞</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      5. ПРИЛОЖЕНИЕ: ИНТЕРНЕТ / MAZE BANK
                      =================================================== */}
                  {currentApp === 'browser' && (
                    <div className="gta-app-inner-view browser-app">
                      <div className="gta-app-header browser-header">
                        <button className="gta-back-arrow" onClick={() => setCurrentApp('home')}>◀</button>
                        <div className="browser-url-bar">www.mazebank.com</div>
                        <span>🔒</span>
                      </div>

                      <div className="maze-bank-portal">
                        <div className="maze-bank-hero">
                          <h2>MAZE BANK</h2>
                          <span className="maze-slogan">LEADER IN HIGH-ROLLER SWAG FINANCES</span>
                        </div>

                        <div className="maze-account-box">
                          <div className="maze-acc-label">ТЕКУЩИЙ БАЛАНС СЧЕТА:</div>
                          <div className="maze-acc-balance">{balance.toLocaleString()} $SWAG</div>
                        </div>

                        <div className="maze-recent-log">
                          <h5>НЕДАВНИЕ ТРАНЗАКЦИИ:</h5>
                          <div className="maze-tx-row"><span>Вход в Web 3.0</span><span className="tx-red">-67,000 $SWAG</span></div>
                          <div className="maze-tx-row"><span>Дроп с Gates of SWAGUS</span><span className="tx-green">+150,000 $SWAG</span></div>
                          <div className="maze-tx-row"><span>Доставка Porsche GT3</span><span className="tx-gray">0 $SWAG</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      6. ПРИЛОЖЕНИЕ: SNAPMATIC КАМЕРА
                      =================================================== */}
                  {currentApp === 'camera' && (
                    <div className={`gta-snapmatic-view filter-${cameraFilter}`}>
                      {cameraFlash && <div className="camera-flash-overlay"></div>}
                      
                      <div className="snapmatic-top-bar">
                        <button className="snapmatic-exit-btn" onClick={() => setCurrentApp('home')}>✕</button>
                        <span className="snapmatic-logo">SNAPMATIC</span>
                        <button 
                          className="snapmatic-filter-toggle"
                          onClick={() => {
                            const filters = ['normal', 'gold', 'noir', 'vamp'];
                            const nextIdx = (filters.indexOf(cameraFilter) + 1) % filters.length;
                            setCameraFilter(filters[nextIdx]);
                          }}
                        >
                          ФИЛЬТР: {cameraFilter.toUpperCase()}
                        </button>
                      </div>

                      <div className="snapmatic-viewfinder-grid">
                        <div className="grid-center-crosshair">+</div>
                        {photoSavedNotice && (
                          <div className="photo-saved-badge">✓ ФОТО СОХРАНЕНО В ГАЛЕРЕЮ</div>
                        )}
                      </div>

                      <div className="snapmatic-bottom-bar">
                        <button 
                          type="button" 
                          className="snapmatic-shutter-btn"
                          onClick={handleTakePhoto}
                          title="Сделать фото"
                        >
                          <div className="shutter-inner-dot"></div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      7. ПРИЛОЖЕНИЕ: РАДИО ЛОС-САНТОС
                      =================================================== */}
                  {currentApp === 'radio' && (
                    <div className="gta-app-inner-view radio-app">
                      <div className="gta-app-header">
                        <button className="gta-back-arrow" onClick={() => setCurrentApp('home')}>◀ НАЗАД</button>
                        <h4>РАДИОСТАНЦИИ</h4>
                        <span className="gta-hdr-icon">📻</span>
                      </div>

                      <div className="gta-radio-player-card">
                        <div className="radio-wheel-art">
                          <span className="radio-wheel-emoji">💽</span>
                        </div>
                        <h3 className="current-station-title">{currentStation}</h3>
                        <span className="track-title-now">Тёмный принц, madk1d — Летник (Exclusive)</span>

                        <div className="radio-controls-dock">
                          <button 
                            type="button" 
                            className="radio-play-btn"
                            onClick={handleToggleRadio}
                          >
                            {radioPlaying ? '⏸️ ПАУЗА' : '▶️ ВКЛЮЧИТЬ ЭФИР'}
                          </button>
                        </div>

                        <div className="radio-stations-picker">
                          <button className="station-chip active" onClick={() => setCurrentStation('SWAG VAMP 4 FM')}>SWAG VAMP 4</button>
                          <button className="station-chip" onClick={() => setCurrentStation('Radio Los Santos')}>Radio Los Santos</button>
                          <button className="station-chip" onClick={() => setCurrentStation('West Coast Classics')}>West Coast Classics</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      8. ПРИЛОЖЕНИЕ: ГАРАЖ И АВТОМЕХАНИК
                      =================================================== */}
                  {currentApp === 'garage' && (
                    <div className="gta-app-inner-view">
                      <div className="gta-app-header">
                        <button className="gta-back-arrow" onClick={() => setCurrentApp('home')}>◀ НАЗАД</button>
                        <h4>АВТОПАРК</h4>
                        <span className="gta-hdr-icon">🏎️</span>
                      </div>

                      <div className="gta-garage-list">
                        {GARAGE_VEHICLES.map(v => (
                          <div key={v.id} className="gta-vehicle-card">
                            <span className="veh-icon">{v.icon}</span>
                            <div className="veh-info">
                              <span className="veh-name">{v.name}</span>
                              <span className="veh-details">{v.type} • {v.speed} • {v.plate}</span>
                            </div>
                            <button 
                              type="button" 
                              className="veh-order-btn"
                              onClick={() => handleRequestVehicle(v)}
                            >
                              ВЫЗВАТЬ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ===================================================
                      9. ПРИЛОЖЕНИЕ: НАСТРОЙКИ IFRUIT
                      =================================================== */}
                  {currentApp === 'settings' && (
                    <div className="gta-app-inner-view">
                      <div className="gta-app-header">
                        <button className="gta-back-arrow" onClick={() => setCurrentApp('home')}>◀ НАЗАД</button>
                        <h4>НАСТРОЙКИ</h4>
                        <span className="gta-hdr-icon">⚙️</span>
                      </div>

                      <div className="gta-settings-list">
                        <div className="settings-section">
                          <label>ОБОИ РАБОЧЕГО СТОЛА:</label>
                          <div className="wallpaper-choices">
                            <button className={`wp-btn ${wallpaper === 'dark' ? 'active' : ''}`} onClick={() => setWallpaper('dark')}>iFruit Dark</button>
                            <button className={`wp-btn ${wallpaper === 'sunset' ? 'active' : ''}`} onClick={() => setWallpaper('sunset')}>Los Santos Sunset</button>
                            <button className={`wp-btn ${wallpaper === 'matrix' ? 'active' : ''}`} onClick={() => setWallpaper('matrix')}>Cyber Matrix</button>
                            <button className={`wp-btn ${wallpaper === 'somali' ? 'active' : ''}`} onClick={() => setWallpaper('somali')}>Somali Starlink</button>
                          </div>
                        </div>

                        <div className="settings-section">
                          <label>УСТРОЙСТВО:</label>
                          <div className="device-spec-box">
                            <div>МОДЕЛЬ: iFruit 67 Plus (Gold Edition)</div>
                            <div>СЕТЬ: STARLINK PIRATE NODE #001</div>
                            <div>ЗАЩИТА: ATREIYA MODE 100% E2EE</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* НИЖНЯЯ АНТЕННАЯ ПОЛОСКА */}
            <div className="antenna-stripe bottom"></div>

            {/* КРУГЛАЯ ФИЗИЧЕСКАЯ КНОПКА HOME С КОЛЬЦОМ TOUCH ID */}
            <div 
              className="iphone-home-button" 
              onClick={handleHomeButtonClick} 
              title={currentApp === 'home' ? 'Кнопка Home (Свернуть телефон)' : 'Кнопка Home (Вернуться на рабочий стол)'}
            >
              <div className="touch-id-ring"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IPhoneClashRoyale;
