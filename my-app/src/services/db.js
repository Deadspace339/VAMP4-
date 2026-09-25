// ===================================================
// SWAG INC. UNIFIED PERSISTENT DATABASE ENGINE
// Хранилище всех сущностей с сохранением при перезагрузке
// ===================================================

import macanImg from '../assets/macan-brat.jpg';
import crownImg from '../assets/plashka.png';
import shieldImg from '../assets/plashka2.png';
import radioImg from '../assets/plashka3.png';
import { mediaStore } from './mediaStore';

let _cachedShorts = null;
let _cachedDrafts = null;
let _hasHydratedMediaStore = false;

const STORAGE_KEYS = {
  BALANCE: 'swag_db_balance_v2',
  FIAT_UAH: 'swag_db_fiat_uah_v2',
  CHATS: 'swag_db_chats_v2',
  SHORTS: 'swag_db_shorts_v2',
  DRAFTS: 'swag_db_drafts_v2',
  USER: 'swag_db_user_v2',
  CASINO: 'swag_db_casino_v2',
  PRODUCTS: 'swag_db_products_v2',
  ORDERS: 'swag_db_orders_v2',
  WEB3_UNLOCKED: 'swag_db_web3_unlocked_v2',
  EDITS: 'swag_db_edits_v2',
  FRIENDS: 'swag_db_friends_v2',
  OPEN_ORDERS: 'swag_db_open_orders_v2',
  TRADE_HISTORY: 'swag_db_trades_v2'
};

const DEFAULT_USER = {
  name: 'MACAN',
  handle: '@macansssssssssss1337',
  role: 'FOUNDER',
  rank: 'SWAG GOD',
  level: 67,
  reputation: '100% AtreiyaMODE',
  avatarHat: 'crown' // 'crown', 'five_plus', 'odnoklassniki', 'none'
};

const DEFAULT_CHATS = [
  {
    id: 'jarvis',
    name: '🤖 J.A.R.V.I.S.',
    type: 'bot',
    isBot: true,
    online: true,
    verified: true,
    avatar: shieldImg,
    time: '01:15',
    lastMessage: 'Папа дома. Нейросеть Gemini 2.5 Flash подключена к узлу.',
    unread: 1,
    statusText: 'Gemini 2.5 Flash Online • E2EE Guard',
    messages: [
      {
        id: 1,
        sender: 'J.A.R.V.I.S.',
        isMe: false,
        type: 'text',
        text: 'Добро пожаловать в защищенный командный центр, сэр. Я подключил боевой ключ API к нейросети Gemini 2.5 Flash. Все системы под контролем.',
        time: '01:10',
        reactions: { '🦾': 1, '⚡': 2 },
        myReaction: '⚡'
      },
      {
        id: 2,
        sender: 'J.A.R.V.I.S.',
        isMe: false,
        type: 'text',
        text: 'Проект «Папа дома» развернут на полную мощность. Доступны: запись живого голоса с микрофона, предпросмотр файлов, сохранение в БД, загрузка клипов и кибер-казино Web 4.0.',
        time: '01:12',
        reactions: { '🔥': 3 },
        myReaction: null
      }
    ]
  },
  {
    id: 'macan',
    name: 'MACAN (Брат)',
    type: 'dm',
    online: true,
    verified: true,
    avatar: macanImg,
    time: '00:20',
    lastMessage: 'брат, брат брат брат?',
    unread: 2,
    statusText: 'в сети (Porsche Studio)',
    messages: [
      {
        id: 1,
        sender: 'MACAN',
        isMe: false,
        type: 'text',
        text: 'Салют, создатель! Готовим мощный релиз на маркете.',
        time: '00:18',
        reactions: { '👑': 2 },
        myReaction: null
      },
      {
        id: 2,
        sender: 'MACAN',
        isMe: false,
        type: 'voice',
        duration: '0:34',
        time: '00:19',
        reactions: { '🔥': 4, '💸': 1 },
        myReaction: '🔥'
      },
      {
        id: 3,
        sender: 'MACAN',
        isMe: false,
        type: 'text',
        text: 'брат, трек летник заценил? Врубай в шортсах справа!',
        time: '00:20',
        reactions: { '⚡': 2 },
        myReaction: null
      }
    ]
  },
  {
    id: 'swag-channel',
    name: '🔥 SWAG INC. OFFICIAL',
    type: 'channel',
    online: true,
    verified: true,
    avatar: crownImg,
    time: 'Вчера',
    lastSender: 'Admin',
    lastMessage: 'Запущен протокол Web 4.0 Казино! Испытайте удачу в слотах 777.',
    unread: 0,
    statusText: '13 420 участников • Верифицированный канал',
    messages: [
      {
        id: 1,
        sender: 'Admin',
        isMe: false,
        type: 'text',
        text: 'ВНИМАНИЕ ВСЕМ УЧАСТНИКАМ КИБЕР-СЕТИ! Запущен протокол Web 4.0 Казино! Испытайте удачу в слотах 777 и PvP дуэлях.',
        time: '18:40',
        reactions: { '🔥': 28, '🚀': 14 },
        myReaction: null
      }
    ]
  },
  {
    id: 'dark-market',
    name: '💀 DEALS & AUCTIONS',
    type: 'channel',
    online: false,
    verified: false,
    avatar: radioImg,
    time: '14:02',
    lastSender: 'CyberBroker',
    lastMessage: 'Продан лот #67: Neon Matrix Helmet за 1500 SWAG',
    unread: 0,
    statusText: '8 910 участников',
    messages: [
      {
        id: 1,
        sender: 'CyberBroker',
        isMe: false,
        type: 'text',
        text: 'Продан лот #67: Neon Matrix Helmet за 1500 SWAG. Покупатель анонимен.',
        time: '14:02',
        reactions: { '💀': 8 },
        myReaction: null
      }
    ]
  }
];

const DEFAULT_SHORTS = [
  {
    id: 'letnik-short-1',
    author: '@macan_official',
    authorName: 'MACAN',
    authorAvatar: macanImg,
    description: 'Братва, летний вайб в киберпространстве. Кто заценил новый трек «Летник»? 🏎️💨 #swag #letnik #macan #cyberpunk',
    soundTitle: 'Тёмный принц, madk1d — Летник',
    audioSrc: '/letnik.mp3',
    videoSrc: null,
    likes: 13420,
    commentsCount: 684,
    shares: 1205,
    bgGradient: 'radial-gradient(circle at center, #2e0800 0%, #0d0400 45%, #020202 100%)',
    tags: ['#swag', '#letnik', '#sound2026', '#cyber'],
    badge: 'EXCLUSIVE DROP',
    comments: [
      { id: 1, user: 'swagg_boss', text: 'Басс разрывает динамики 🔥', time: '10 мин назад' },
      { id: 2, user: 'cyber_brat', text: 'Джорвес включи на полную 🚀', time: '5 мин назад' },
      { id: 3, user: 'neon_rider', text: 'Ждем дроп мерча!', time: '1 мин назад' },
    ]
  },
  {
    id: 'lab-short-2',
    author: '@swag_inc_lab',
    authorName: 'SWAG INC. LABS',
    authorAvatar: crownImg,
    description: 'Презентация новой кибер-коллекции Web 2.0 / Web 4.0. Куртки с нано-подсветкой и встроенным cold-wallet 🦾⚡',
    soundTitle: 'SWAG INC. — Neural Pulse (Synthwave mix)',
    audioSrc: null,
    videoSrc: null,
    likes: 9812,
    commentsCount: 340,
    shares: 890,
    bgGradient: 'radial-gradient(circle at center, #1f1000 0%, #080706 50%, #000000 100%)',
    tags: ['#drip', '#cyberwear', '#techwear', '#drops'],
    badge: 'NEW COLLECTION',
    comments: [
      { id: 1, user: 'blade_runner_67', text: 'Когда предзаказ в маркете?', time: '20 мин назад' }
    ]
  },
  {
    id: 'jarvis-short-3',
    author: '@jarvis_ai_core',
    authorName: 'J.A.R.V.I.S. PROTOCOL',
    authorAvatar: shieldImg,
    description: 'Системы безопасности обновлены до протокола 4.0. Доступны слоты, покер и PvP дуэли. Папа дома. 🤖🛡️',
    soundTitle: 'AI Diagnostics — Core Overdrive (System Audio)',
    audioSrc: null,
    videoSrc: null,
    likes: 24500,
    commentsCount: 1102,
    shares: 4520,
    bgGradient: 'radial-gradient(circle at center, #001a14 0%, #000c0a 50%, #020202 100%)',
    tags: ['#jarvis', '#security', '#defense', '#casino'],
    badge: 'AI PROTOCOL',
    comments: [
      { id: 1, user: 'tony_s', text: 'Джарвис, настрой слоты на джекпот', time: '1 час назад' }
    ]
  }
];

const DEFAULT_PVP_DUELS = [
  {
    id: 'duel-1',
    opponent: '@macan_brat',
    opponentName: 'MACAN',
    avatar: macanImg,
    bet: 100,
    winRate: '78%',
    wins: 42,
    status: 'READY'
  },
  {
    id: 'duel-2',
    opponent: '@cyber_broker',
    opponentName: 'CyberBroker',
    avatar: radioImg,
    bet: 250,
    winRate: '64%',
    wins: 19,
    status: 'READY'
  },
  {
    id: 'duel-3',
    opponent: '@swagg_king',
    opponentName: 'NeonKing',
    avatar: crownImg,
    bet: 500,
    winRate: '85%',
    wins: 87,
    status: 'HIGH_ROLLER'
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Cyber-Oversize Худи «VAMP 4 / MACAN EDITION»',
    price: 6700,
    oldPrice: 12000,
    category: 'Одежда',
    tag: 'SALE -44%',
    rating: 4.9,
    reviewsCount: 1842,
    seller: 'SWAG INC. OFFICIAL STORE ✓',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    description: 'Лимитированный худи оверсайз из плотного хлопкового футера (480 г/м²) с рефлективным принтом VAMP 4 и готической вышивкой. Защита от влаги, скрытый карман для аппаратного крипто-кошелька Ledger, кастомные металлические люверсы с гравировкой SWAG INC.',
    characteristics: {
      'Артикул WB': 'SWAG-67-001',
      'Состав': 'Хлопок 85%, Полиэстер 15%',
      'Плотность': '480 г/м² (Ultra Heavyweight)',
      'Покрой': 'Oversize Cyber Streetwear',
      'Цвет': 'Глубокий обсидиан / Неоновый оранж',
      'Страна производства': 'Россия, Porsche Studio Lab',
      'Комплектация': 'Худи, фирменный зип-пакет, NFC-чип подлинности',
      'Шифрование бирки': 'E2EE Shield SHA-256'
    },
    stock: 24,
    delivery: 'Завтра в пункт выдачи SWAG POINT (Бесплатно)'
  },
  {
    id: 'prod-2',
    title: 'Кроссовки «NEO SWAG RUNNER 67»',
    price: 12500,
    oldPrice: 21000,
    category: 'Обувь',
    tag: 'HIT',
    rating: 5.0,
    reviewsCount: 940,
    seller: 'SWAG INC. FOOTWEAR',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
    description: 'Футуристичные кроссовки на амортизирующей воздушной капсуле с адаптивной шнуровкой и карбоновыми вставками. Протектор из износостойкой резины CyberGrip. Подходят для ночного дрифта и городских спринтов.',
    characteristics: {
      'Артикул WB': 'SWAG-67-002',
      'Материал верха': 'Дышащая сетка Mesh-X, натуральная замша, карбон',
      'Подошва': 'Амортизирующая EVA + Air Sole капсула',
      'Сезон': 'Всесезонные / Городской дрифт',
      'Размерная сетка': '39-46 EUR',
      'Вес полупары': '380 г',
      'Особенности': 'Светоотражающие полосы 3M Scotchlite'
    },
    stock: 15,
    delivery: 'Послезавтра курьером до двери'
  },
  {
    id: 'prod-3',
    title: 'Портативная акустика «LETNIK BOOMBOX 1000W»',
    price: 8900,
    oldPrice: 15500,
    category: 'Аудио & Бас',
    tag: 'TOP WB',
    rating: 4.9,
    reviewsCount: 3105,
    seller: 'MACAN AUDIO LABS',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    description: 'Мощнейшая портативная акустика со встроенным двойным сабвуфером, откалиброванная специально под низкие частоты треков «Летник» и русского кибер-рэпа. RGB подсветка в такт баса, влагозащита IPX7, 24 часа автономной работы.',
    characteristics: {
      'Артикул WB': 'SWAG-67-003',
      'Пиковая мощность': '1000W Peak / 120W RMS High-Fidelity',
      'Частотный диапазон': '25 Гц — 22 000 Гц (Глубокий вибро-басс)',
      'Интерфейсы': 'Bluetooth 5.4 Low Latency, AUX, Type-C, TF',
      'Аккумулятор': '18 000 мАч (функция PowerBank для смартфона)',
      'Влагозащита': 'IPX7 (не боится пролитых напитков и дождя)'
    },
    stock: 42,
    delivery: 'Завтра в пункт выдачи'
  },
  {
    id: 'prod-4',
    title: 'Золотая цепь «SWAG GOD 777 PENDANT»',
    price: 67000,
    oldPrice: 99000,
    category: 'Аксессуары',
    tag: 'VIP 👑',
    rating: 5.0,
    reviewsCount: 67,
    seller: 'SWAG JEWELRY ATELIER',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    description: 'Массивная цепь плетения Cuban Link из белого и желтого золота с кулоном-черепом SWAG GOD. Инкрустация муассанитами VVS1, проходящими алмазный тестер. Лазерная гравировка серийного номера в блокчейне.',
    characteristics: {
      'Артикул WB': 'SWAG-67-004',
      'Металл': 'Ювелирный сплав, позолота 24K / белое золото 750',
      'Вставка': 'Муассаниты D-Color VVS1 (алмазный блеск)',
      'Длина цепи': '55 см',
      'Ширина звена': '14 мм',
      'Вес изделия': '185 г',
      'Сертификат': 'NFT-сертификат подлинности в SwagChain'
    },
    stock: 5,
    delivery: 'Спецдоставка с бронированным сопровождением'
  },
  {
    id: 'prod-5',
    title: 'Кибер-очки «MATRIX VAMP 2026 HUD»',
    price: 4200,
    oldPrice: 7000,
    category: 'Аксессуары',
    tag: 'NEW',
    rating: 4.8,
    reviewsCount: 528,
    seller: 'SWAG TECH OPTICS',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    description: 'Очки с поляризацией и темными линзами UV400 в угловатой оправе из авиационного алюминия. Эффект скрытия лица от камер видеонаблюдения, антибликовое покрытие и неоновый отблеск.',
    characteristics: {
      'Артикул WB': 'SWAG-67-005',
      'Материал оправы': 'Анодированный авиационный алюминий T6',
      'Линзы': 'Поляризационные 9-слойные TAC UV400',
      'Форма': 'Cyberpunk Angular Blade',
      'Комплектация': 'Очки, кожаный футляр, чистящая салфетка'
    },
    stock: 89,
    delivery: 'Завтра в пункт выдачи'
  },
  {
    id: 'prod-6',
    title: 'Кожаный бомбер «PORSCHE STUDIO ATREIYA»',
    price: 18900,
    oldPrice: 32000,
    category: 'Одежда',
    tag: 'SALE -40%',
    rating: 4.9,
    reviewsCount: 420,
    seller: 'PORSCHE STUDIO APPAREL',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    description: 'Утепленный кожаный бомбер с нашивками Porsche Club и шелковой подкладкой с принтом звуковой волны трека Летник. Воротник стойка, надежные металлические молнии YKK Vislon.',
    characteristics: {
      'Артикул WB': 'SWAG-67-006',
      'Материал': 'Премиальная эко-кожа Nappa с водоотталкивающей пропиткой',
      'Утеплитель': 'Thinsulate 150 (до -15°C)',
      'Подкладка': '100% шелковистая вискоза с эксклюзивным артом',
      'Страна': 'Германия / Россия',
      'Карманы': '2 внешних на молнии, 2 внутренних потайных'
    },
    stock: 11,
    delivery: 'Завтра в пункт выдачи'
  },
  {
    id: 'prod-7',
    title: 'Энергетический кибер-тоник «SWAG OVERCHARGE 67» (24 шт.)',
    price: 670,
    oldPrice: 1200,
    category: 'Аудио & Бас',
    tag: 'BOOST ⚡',
    rating: 4.9,
    reviewsCount: 5410,
    seller: 'SWAG NUTRITION',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&auto=format&fit=crop&q=80',
    description: 'Пак из 24 банок кибер-энергетика со вкусом темной маракуйи и цитрусового электричества. Содержит таурин, витамины группы B и натуральный кофеин для ночных сессий в коде и каток в казино.',
    characteristics: {
      'Артикул WB': 'SWAG-67-007',
      'Объем': '24 банки по 500 мл',
      'Вкус': 'Electric Dark Passion Fruit',
      'Сахар': '0% (Zero Sugar, натуральный подсластитель)',
      'Срок годности': '18 месяцев'
    },
    stock: 140,
    delivery: 'Сегодня при заказе до 18:00'
  },
  {
    id: 'prod-8',
    title: 'Кастомная клавиатура «NEON MATRIX TKL 67»',
    price: 4900,
    oldPrice: 8500,
    category: 'Аксессуары',
    tag: 'HIT',
    rating: 5.0,
    reviewsCount: 777,
    seller: 'SWAG TECH PERIPHERALS',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    description: 'Механическая клавиатура формата 80% (TKL) на смазанных линейных свитчах Gateron Yellow Pro. Алюминиевый корпус, двойная шумоизоляция Poron, RGB подсветка и поддержка QMK/VIA.',
    characteristics: {
      'Артикул WB': 'SWAG-67-008',
      'Тип свитчей': 'Линейные смазанные Gateron Yellow Pro',
      'Конструкция': 'Gasket Mount с поликарбонатным плейтом',
      'Кейкапы': 'PBT Cherry Profile двойного литья',
      'Подключение': 'Type-C съемный кабель в оплетке / 2.4 GHz'
    },
    stock: 30,
    delivery: 'Завтра в пункт выдачи'
  }
];

// ===================================================
// ДЕФОЛТНЫЕ ЭДИТЫ ДЛЯ БАРАБАННОЙ ЛЕНТЫ WEB 3.0
// ВКЛЮЧАЕТ АНИМЕ: БАСКЕТБОЛ КУРОКО И БЛЮ ЛОК
// ===================================================
export const DEFAULT_EDITS = [
  // ⚡ РОНАЛДО 2008 PRIME
  {
    id: 'edit-ronaldo-2008',
    title: 'CRISTIANO RONALDO // 2008 PRIME UNITED 🐐',
    sound: 'SoundCloud Type Beat // CR7 2008 Prime Anthem (Speed Boost)',
    audioSrc: '/свэг321.mp3',
    author: '@cr7_prime2008',
    likes: 777000,
    shares: 200800,
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4',
    tag: 'РОНАЛДО 2008 PRIME ⚡',
    anime: 'Роналдо 2008 Prime',
    videoNote: 'Золотой Мяч 2008, Манчестер Юнайтед, штрафные с наклболом против Портсмута, финты step-over и невероятная скорость.'
  },
  // 🔴 АРСЕНАЛ 2008 PRIME
  {
    id: 'edit-arsenal-2008',
    title: 'АРСЕНАЛ 2008 PRIME // WENGERBALL TIKI-TAKA 🔴',
    sound: 'SoundCloud Trap Remix // Emirates Magic 2008',
    audioSrc: '/темный принц.mp3',
    author: '@arsenal_prime_gunners',
    likes: 450000,
    shares: 89000,
    cover: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    tag: 'АРСЕНАЛ 2008 PRIME 🏆',
    anime: 'Арсенал 2008 Prime',
    videoNote: 'Венгерболл в прайме: Сеск Фабрегас, Робин ван Перси, Адебайор, игра в одно касание и легендарный стиль Лондона.'
  },
  // 🖤 БАЛЕНСИАГИ
  {
    id: 'edit-balenciaga-mud',
    title: 'BALENCIAGA MUD SHOW // DEMNA PRIME RUNWAY 🖤',
    sound: 'BFRND — Balenciaga Mud Runway (Cyber Bass Heavy)',
    audioSrc: '/свэг321.mp3',
    author: '@demna_balenciaga',
    likes: 320000,
    shares: 67000,
    cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    tag: 'БАЛЕНСИАГИ TYPE SHIT 🕶️',
    anime: 'Баленсиаги',
    videoNote: 'Грязевой подиум Balenciaga Summer 23: оверсайз бомберы, Defender sneakers, 3XL, готический high-fashion флекс.'
  },
  // ☁️ SOUNDCLOUD TYPE SHIT
  {
    id: 'edit-soundcloud-vamp',
    title: 'SOUNDCLOUD TYPE SHIT // 2026 PLUGGNB DRIFT ☁️',
    sound: 'Yeat x Carti Type Beat // 808 Distorted BassBoost 1337%',
    audioSrc: '/letnik.mp3',
    author: '@soundcloud_pluggnb',
    likes: 580000,
    shares: 142000,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    tag: 'SOUNDCLOUD TYPE SHIT ☁️',
    anime: 'SoundCloud',
    videoNote: 'Грязные 808-е, автотюн, рейдж-синт лиды, андерграунд саундклауд вайб для ночных заездов.'
  },
  // 🏎️ СУПЕРКАРЫ / MACAN
  {
    id: 'edit-macan-gt3rs',
    title: 'MACAN // PORSCHE 911 GT3 RS NIGHT RUN 🏎️',
    sound: 'SWAG DRIFT BEAT // BASS BOOSTED 1000%',
    audioSrc: '/letnik.mp3',
    author: '@macan_official',
    likes: 674200,
    shares: 124000,
    cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    tag: 'СУПЕРКАРЫ SPEED ⚡',
    anime: 'Суперкары',
    videoNote: 'Ночной выезд по Садовому Кольцу, атмосферный Flat-6 рев, антикрыло GT3 RS и саундтрек Летник.'
  }
];

export const DEFAULT_HYPE_USERS = [
  {
    id: 'friend_cr7',
    name: 'Cristiano Ronaldo 2008',
    handle: '@cr7_prime2008',
    avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    statusText: 'Prime 2008 United Goat • Ballon d\'Or',
    tags: ['#ronaldo2008', '#cr7prime', '#manutd', '#goat'],
    online: true,
    verified: true,
    chips: 50000
  },
  {
    id: 'friend_arsenal',
    name: 'Arsenal 2008 Prime',
    handle: '@arsenal_prime',
    avatar: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
    statusText: 'Wengerball Tiki-Taka • Cesc & RVP 2008',
    tags: ['#arsenal2008', '#wengerball', '#prime', '#london'],
    online: true,
    verified: true,
    chips: 35000
  },
  {
    id: 'friend_demna',
    name: 'Demna Balenciaga',
    handle: '@demna_mud',
    avatar: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    statusText: 'Balenciaga Mud Runway • 3XL Defender',
    tags: ['#balenciaga', '#demna', '#typeshit', '#fashion'],
    online: true,
    verified: true,
    chips: 67000
  },
  {
    id: 'friend_soundcloud',
    name: 'SoundCloud Vampire',
    handle: '@soundcloud_pluggnb',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    statusText: '808 Bass Boosted • Pluggnb Drift Type Beat',
    tags: ['#soundcloud', '#pluggnb', '#typeshit', '#rage808'],
    online: true,
    verified: true,
    chips: 28000
  },
  {
    id: 'friend_clashking',
    name: 'Clash Royale King',
    handle: '@clash_king_67',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    statusText: 'HE-HE-HE-HA! 9000 Кубков • Mega Knight 15 lvl',
    tags: ['#clashroyale', '#heheheha', '#megaknight', '#iphone6'],
    online: true,
    verified: true,
    chips: 40000
  },
  {
    id: 'friend_durakpro',
    name: 'Виктор Карточный Барон',
    handle: '@durak_pro_2008',
    avatar: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    statusText: 'Легенда Дурака и Покера • 100% Winrate',
    tags: ['#durakmaster', '#покер', '#allin', '#cards'],
    online: true,
    verified: true,
    chips: 88888
  }
];

// ===================================================
// ДЕФОЛТНЫЕ ЗАКАЗЫ МАРКЕТПЛЕЙСА (WILDBERRIES STYLE)
// ===================================================
export const DEFAULT_ORDERS = [
  {
    id: 'WB-SWAG-67-1042',
    date: '18 сентября 2026, 14:20',
    timestamp: Date.now() - 7200000,
    status: 'В пути в пункт выдачи 🚚',
    statusCode: 'shipping',
    pickupPoint: 'SWAG POINT №67 // Садовая, д. 4',
    pickupCode: '6742',
    totalSwag: 14990,
    totalUah: 1004330,
    paymentMethod: 'SWAG COINS',
    items: [
      {
        id: 'p1',
        title: 'Оверсайз худи «VAMP 4 ATREIYA» Dark Edition',
        price: 14990,
        count: 1,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        vendorCode: 'SWAG-WB-6701'
      }
    ]
  },
  {
    id: 'WB-SWAG-67-0988',
    date: '16 сентября 2026, 11:05',
    timestamp: Date.now() - 172800000,
    status: 'Готов к выдаче в ПВЗ 🏢',
    statusCode: 'ready',
    pickupPoint: 'SWAG POINT №13 // Тверская, 12',
    pickupCode: '1337',
    totalSwag: 34990,
    totalUah: 2344330,
    paymentMethod: 'SWAG COINS',
    items: [
      {
        id: 'p2',
        title: 'Кроссовки «MACAN RUNNER 2026» Carbon Sole',
        price: 34990,
        count: 1,
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
        vendorCode: 'SWAG-WB-6702'
      }
    ]
  }
];

// ===================================================
// ДЕФОЛТНЫЕ ОРДЕРА И СДЕЛКИ ДЛЯ БИРЖИ (BINANCE STYLE)
// ===================================================
export const DEFAULT_OPEN_ORDERS = [
  {
    id: 'ord-6701',
    pair: 'SWAG/UAH',
    type: 'LIMIT',
    side: 'BUY',
    price: 66.50,
    amount: 1500,
    total: 99750,
    filled: '0%',
    status: 'OPEN',
    date: '18.09 16:40'
  },
  {
    id: 'ord-6702',
    pair: 'SWAG/UAH',
    type: 'LIMIT',
    side: 'SELL',
    price: 67.80,
    amount: 3000,
    total: 203400,
    filled: '0%',
    status: 'OPEN',
    date: '18.09 16:45'
  }
];

export const DEFAULT_TRADE_HISTORY = [
  {
    id: 'tr-1',
    pair: 'SWAG/UAH',
    side: 'BUY',
    price: 67.00,
    amount: 500,
    total: 33500,
    time: '16:48:12'
  },
  {
    id: 'tr-2',
    pair: 'SWAG/UAH',
    side: 'SELL',
    price: 67.15,
    amount: 1200,
    total: 80580,
    time: '16:49:05'
  },
  {
    id: 'tr-3',
    pair: 'SWAG/UAH',
    side: 'BUY',
    price: 66.90,
    amount: 2500,
    total: 167250,
    time: '16:51:22'
  }
];

// ----------------------------------------------------
// DATABASE API METHODS
// ----------------------------------------------------

export const db = {
  // БАЛАНС
  getBalance() {
    const val = localStorage.getItem(STORAGE_KEYS.BALANCE);
    if (val === null) {
      localStorage.setItem(STORAGE_KEYS.BALANCE, '812');
      return 812;
    }
    return parseInt(val, 10) || 0;
  },

  setBalance(amount) {
    const validAmount = Math.max(0, parseInt(amount, 10) || 0);
    localStorage.setItem(STORAGE_KEYS.BALANCE, validAmount.toString());
    window.dispatchEvent(new CustomEvent('swag_balance_updated', { detail: validAmount }));
    return validAmount;
  },

  addBalance(delta) {
    const current = this.getBalance();
    const updated = Math.max(0, current + (parseInt(delta, 10) || 0));
    return this.setBalance(updated);
  },

  // ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  },

  updateUser(userData) {
    const current = this.getUser();
    const updated = { ...current, ...userData };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('swag_user_updated', { detail: updated }));
    return updated;
  },

  // РЕФЕРАЛЬНЫЕ ФРИСПИНЫ GATES OF SWAGUS
  getReferralFreeSpins() {
    try {
      const data = localStorage.getItem('swag_referral_free_spins');
      return data !== null ? parseInt(data, 10) : 5; // 5 приветственных фриспинов
    } catch {
      return 5;
    }
  },

  setReferralFreeSpins(count) {
    const val = Math.max(0, parseInt(count, 10) || 0);
    localStorage.setItem('swag_referral_free_spins', val.toString());
    window.dispatchEvent(new CustomEvent('swag_referral_spins_updated', { detail: val }));
    return val;
  },

  addReferralFreeSpins(delta = 5) {
    const cur = this.getReferralFreeSpins();
    return this.setReferralFreeSpins(cur + delta);
  },

  // ЧАТЫ И СООБЩЕНИЯ
  getChats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      const parsed = data ? JSON.parse(data) : DEFAULT_CHATS;
      // Санитизация: убираем старую строку «История очищена» и восстанавливаем чистый вид
      return parsed.map(c => {
        if (c.lastMessage === 'История очищена') {
          return { ...c, lastMessage: '', lastSender: '' };
        }
        return c;
      });
    } catch {
      return DEFAULT_CHATS;
    }
  },

  saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (e) {
      console.warn('DB Storage limit reached for chats, clearing temporary cache', e);
    }
  },

  addMessage(chatId, message) {
    const chats = this.getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...(c.messages || []), message],
          lastMessage: message.type === 'voice' ? '🎤 Голосовое сообщение' :
            message.type === 'file' ? `📄 ${message.fileName}` : message.text,
          lastSender: message.isMe ? 'Вы' : message.sender,
          time: message.time,
          unread: 0
        };
      }
      return c;
    });
    this.saveChats(updatedChats);
    return updatedChats;
  },

  toggleReaction(chatId, messageId, emoji) {
    const chats = this.getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        const updatedMessages = (c.messages || []).map(m => {
          if (m.id === messageId) {
            const currentReactions = { ...(m.reactions || {}) };
            const myCurrent = m.myReaction;

            if (myCurrent === emoji) {
              if (currentReactions[emoji] > 1) {
                currentReactions[emoji] -= 1;
              } else {
                delete currentReactions[emoji];
              }
              return { ...m, reactions: currentReactions, myReaction: null };
            }

            if (myCurrent && myCurrent !== emoji) {
              if (currentReactions[myCurrent] > 1) {
                currentReactions[myCurrent] -= 1;
              } else {
                delete currentReactions[myCurrent];
              }
              currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
              return { ...m, reactions: currentReactions, myReaction: emoji };
            }

            currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
            return { ...m, reactions: currentReactions, myReaction: emoji };
          }
          return m;
        });
        return { ...c, messages: updatedMessages };
      }
      return c;
    });
    this.saveChats(updatedChats);
    return updatedChats;
  },

  deleteMessage(chatId, messageId, mode = 'both') {
    const chats = this.getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        const remaining = (c.messages || []).filter(m => m.id !== messageId);
        const last = remaining[remaining.length - 1];
        return {
          ...c,
          messages: remaining,
          pinnedMessageId: c.pinnedMessageId === messageId ? null : c.pinnedMessageId,
          lastMessage: last ? (last.type === 'voice' ? '🎤 Голосовое сообщение' : last.type === 'file' ? `📄 ${last.fileName}` : last.text) : '',
          lastSender: last ? (last.isMe ? 'Вы' : last.sender) : ''
        };
      }
      return c;
    });
    this.saveChats(updatedChats);
    return updatedChats;
  },

  togglePinMessage(chatId, messageId) {
    const chats = this.getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        const isAlreadyPinned = c.pinnedMessageId === messageId;
        return {
          ...c,
          pinnedMessageId: isAlreadyPinned ? null : messageId
        };
      }
      return c;
    });
    this.saveChats(updatedChats);
    return updatedChats;
  },

  clearChat(chatId) {
    const chats = this.getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return { ...c, messages: [], lastMessage: '', lastSender: '', pinnedMessageId: null };
      }
      return c;
    });
    this.saveChats(updatedChats);
    return updatedChats;
  },

  // SHORTS
  getShorts() {
    if (_cachedShorts) return _cachedShorts;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHORTS);
      _cachedShorts = data ? JSON.parse(data) : DEFAULT_SHORTS;
      // Гарантируем наличие трека letnik.mp3 для первого шортса
      const letnikShort = _cachedShorts.find(s => s.id === 'letnik-short-1');
      if (letnikShort && !letnikShort.audioSrc) {
        letnikShort.audioSrc = '/letnik.mp3';
      }
    } catch {
      _cachedShorts = DEFAULT_SHORTS;
    }
    // Асинхронно гидрируем медиафайлы из IndexedDB при первом чтении
    if (!_hasHydratedMediaStore && typeof window !== 'undefined') {
      _hasHydratedMediaStore = true;
      this.hydrateAllMedia();
    }
    return _cachedShorts;
  },

  async hydrateAllMedia() {
    try {
      let changed = false;
      const shorts = this.getShorts();
      for (const s of shorts) {
        const needsHydration = !s.videoSrc || s.videoSrc.startsWith('idb://') || s.videoSrc.startsWith('blob:');
        if (needsHydration || s.audioSrc?.startsWith('idb://') || s.poster?.startsWith('idb://') || s.poster?.startsWith('blob:')) {
          const media = await mediaStore.get('media_' + s.id);
          if (media) {
            if (media.videoBlob) {
              s.videoSrc = URL.createObjectURL(media.videoBlob);
              changed = true;
            } else if (media.videoSrc && !media.videoSrc.startsWith('idb://') && !media.videoSrc.startsWith('blob:')) {
              s.videoSrc = media.videoSrc;
              changed = true;
            }
            if (media.coverBlob) {
              s.poster = URL.createObjectURL(media.coverBlob);
              s.coverImage = s.poster;
              s.imageSrc = s.poster;
              changed = true;
            } else if (media.poster && !media.poster.startsWith('idb://') && !media.poster.startsWith('blob:')) {
              s.poster = media.poster;
              s.coverImage = s.poster;
              changed = true;
            }
            if (media.audioBlob) {
              s.audioSrc = URL.createObjectURL(media.audioBlob);
              changed = true;
            } else if (media.audioSrc && !media.audioSrc.startsWith('idb://') && !media.audioSrc.startsWith('blob:')) {
              s.audioSrc = media.audioSrc;
              changed = true;
            }
          }
        }
      }
      const drafts = this.getDrafts();
      for (const d of drafts) {
        const needsHydration = !d.videoSrc || d.videoSrc.startsWith('idb://') || d.videoSrc.startsWith('blob:');
        if (needsHydration || d.audioSrc?.startsWith('idb://') || d.poster?.startsWith('idb://') || d.poster?.startsWith('blob:')) {
          const media = await mediaStore.get('draft_media_' + d.id);
          if (media) {
            if (media.videoBlob) {
              d.videoSrc = URL.createObjectURL(media.videoBlob);
              changed = true;
            } else if (media.videoSrc && !media.videoSrc.startsWith('idb://') && !media.videoSrc.startsWith('blob:')) {
              d.videoSrc = media.videoSrc;
              changed = true;
            }
            if (media.coverBlob) {
              d.poster = URL.createObjectURL(media.coverBlob);
              d.coverImage = d.poster;
              changed = true;
            }
            if (media.audioBlob) {
              d.audioSrc = URL.createObjectURL(media.audioBlob);
              changed = true;
            } else if (media.audioSrc && !media.audioSrc.startsWith('idb://') && !media.audioSrc.startsWith('blob:')) {
              d.audioSrc = media.audioSrc;
              changed = true;
            }
          }
        }
      }
      if (changed) {
        window.dispatchEvent(new CustomEvent('swag_shorts_updated', { detail: _cachedShorts }));
        window.dispatchEvent(new CustomEvent('swag_drafts_updated', { detail: _cachedDrafts }));
      }
    } catch (e) {
      console.warn('Hydration error', e);
    }
  },

  saveShorts(shorts) {
    _cachedShorts = shorts;
    // Strip heavy media URLs/data before saving to localStorage to prevent quota crashes
    const lightweight = shorts.map(s => {
      const isHeavyVideo = s.videoSrc && (s.videoSrc.length > 500 || s.videoSrc.startsWith('blob:'));
      const isHeavyAudio = s.audioSrc && (s.audioSrc.length > 500 || s.audioSrc.startsWith('blob:'));
      const isHeavyPoster = s.poster && (s.poster.length > 500 || s.poster.startsWith('blob:'));
      return {
        ...s,
        videoSrc: isHeavyVideo ? 'idb://' + s.id : s.videoSrc,
        audioSrc: isHeavyAudio ? 'idb://' + s.id : s.audioSrc,
        poster: isHeavyPoster ? 'idb://' + s.id : s.poster,
        coverImage: isHeavyPoster ? 'idb://' + s.id : s.coverImage
      };
    });
    try {
      localStorage.setItem(STORAGE_KEYS.SHORTS, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('Cannot persist shorts to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_shorts_updated', { detail: shorts }));
  },

  async addShort(newShort, rawBlobs = null) {
    const user = this.getUser();
    const preparedShort = {
      ...newShort,
      isMy: true,
      author: newShort.author || user.handle,
      authorName: newShort.authorName || user.name,
      authorAvatar: newShort.authorAvatar || '/src/assets/macan-brat.jpg'
    };

    // Надежное сохранение тяжелого медиа в IndexedDB без затирания блобов
    try {
      const existingMedia = (await mediaStore.get('media_' + preparedShort.id)) || {};
      const payload = {
        ...existingMedia,
        videoBlob: rawBlobs?.videoBlob || existingMedia.videoBlob || null,
        audioBlob: rawBlobs?.audioBlob || existingMedia.audioBlob || null,
        coverBlob: rawBlobs?.coverBlob || existingMedia.coverBlob || null,
        videoSrc: preparedShort.videoSrc || existingMedia.videoSrc || null,
        audioSrc: preparedShort.audioSrc || existingMedia.audioSrc || null,
        poster: preparedShort.poster || existingMedia.poster || null
      };
      await mediaStore.set('media_' + preparedShort.id, payload);
    } catch (err) {
      console.warn('Failed to save to mediaStore:', err);
    }

    const current = this.getShorts();
    const updated = [preparedShort, ...current.filter(s => s.id !== preparedShort.id)];
    this.saveShorts(updated);
    return updated;
  },

  deleteShort(shortId) {
    const shorts = this.getShorts().filter(s => s.id !== shortId);
    mediaStore.remove('media_' + shortId);
    this.saveShorts(shorts);
    return shorts;
  },

  getMyShorts() {
    const shorts = this.getShorts();
    const user = this.getUser();
    return shorts.filter(s => s.isMy || s.author === user.handle || s.author === '@macan_official' || s.author === '@macansssssssssss1337');
  },

  // ЧЕРНОВИКИ (DRAFTS)
  getDrafts() {
    if (_cachedDrafts) return _cachedDrafts;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      _cachedDrafts = data ? JSON.parse(data) : [
        {
          id: 'draft-sample-1',
          title: 'Летник Ночной Дрифт (В разработке)',
          description: 'Тестовый клип под басс трека Летник с наложением сканлайнов #draft #drift',
          soundTitle: 'Тёмный принц, madk1d — Летник',
          createdAt: 'Сегодня в 01:20',
          audioSrc: '/letnik.mp3'
        }
      ];
    } catch {
      _cachedDrafts = [];
    }
    return _cachedDrafts;
  },

  saveDrafts(drafts) {
    _cachedDrafts = drafts;
    const lightweight = drafts.map(d => {
      const isHeavyVideo = d.videoSrc && (d.videoSrc.length > 500 || d.videoSrc.startsWith('blob:'));
      const isHeavyAudio = d.audioSrc && (d.audioSrc.length > 500 || d.audioSrc.startsWith('blob:'));
      if (isHeavyVideo || isHeavyAudio) {
        return {
          ...d,
          videoSrc: isHeavyVideo ? 'idb://' + d.id : d.videoSrc,
          audioSrc: isHeavyAudio ? 'idb://' + d.id : d.audioSrc
        };
      }
      return d;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('Cannot persist drafts to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_drafts_updated', { detail: drafts }));
  },

  addDraft(draft) {
    const prepared = {
      ...draft,
      id: draft.id || `draft-${Date.now()}`,
      createdAt: draft.createdAt || new Date().toLocaleDateString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    if (prepared.videoSrc || prepared.audioSrc) {
      mediaStore.set('draft_media_' + prepared.id, {
        videoSrc: prepared.videoSrc,
        audioSrc: prepared.audioSrc
      });
    }
    const current = this.getDrafts();
    const updated = [prepared, ...current.filter(d => d.id !== prepared.id)];
    this.saveDrafts(updated);
    return updated;
  },

  deleteDraft(draftId) {
    const drafts = this.getDrafts().filter(d => d.id !== draftId);
    mediaStore.remove('draft_media_' + draftId);
    this.saveDrafts(drafts);
    return drafts;
  },

  publishDraft(draftId) {
    const drafts = this.getDrafts();
    const targetDraft = drafts.find(d => d.id === draftId);
    if (!targetDraft) return;

    // Удаляем из черновиков
    this.deleteDraft(draftId);

    // Добавляем в опубликованные шортсы
    const user = this.getUser();
    const newShort = {
      id: `user-clip-${Date.now()}`,
      author: user.handle,
      authorName: user.name,
      authorAvatar: '/src/assets/macan-brat.jpg',
      description: targetDraft.description || targetDraft.title || 'Мой опубликованный клип!',
      soundTitle: targetDraft.soundTitle || 'Оригинальный звук',
      audioSrc: targetDraft.audioSrc || null,
      videoSrc: targetDraft.videoSrc || null,
      likes: 1,
      commentsCount: 0,
      shares: 0,
      bgGradient: 'radial-gradient(circle at center, #261100 0%, #0a0400 60%, #000000 100%)',
      tags: targetDraft.tags || ['#swag', '#vamp4', '#shorts'],
      badge: 'USER DROP',
      isMy: true,
      comments: []
    };

    return this.addShort(newShort);
  },

  // КАЗИНО И СТАТИСТИКА
  getCasinoStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASINO);
      return data ? JSON.parse(data) : {
        totalSpins: 0,
        totalWins: 0,
        jackpotsWon: 0,
        pvpWins: 0,
        pvpLosses: 0,
        duels: DEFAULT_PVP_DUELS
      };
    } catch {
      return { totalSpins: 0, totalWins: 0, jackpotsWon: 0, pvpWins: 0, pvpLosses: 0, duels: DEFAULT_PVP_DUELS };
    }
  },

  saveCasinoStats(stats) {
    localStorage.setItem(STORAGE_KEYS.CASINO, JSON.stringify(stats));
  },

  // ТОВАРЫ МАРКЕТПЛЕЙСА (WEB 1.0)
  getProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProducts(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Cannot persist products:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_products_updated', { detail: products }));
    return products;
  },

  addProduct(newProd) {
    const current = this.getProducts();
    const user = this.getUser();
    const prepared = {
      ...newProd,
      id: newProd.id || `prod-${Date.now()}`,
      rating: newProd.rating || 5.0,
      reviewsCount: newProd.reviewsCount || 1,
      tag: newProd.tag || 'NEW DROP 🔥',
      seller: newProd.seller || `${user.name} OFFICIAL`,
      stock: newProd.stock || 67,
      delivery: newProd.delivery || 'Завтра в пункт выдачи SWAG POINT',
      createdAt: Date.now()
    };
    const updated = [prepared, ...current];
    this.saveProducts(updated);
    return updated;
  },

  deleteProduct(productId) {
    const current = this.getProducts();
    const updated = current.filter(p => p.id !== productId);
    this.saveProducts(updated);
    return updated;
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => String(p.id) === String(id)) || null;
  },

  // WEB 3.0 РАЗБЛОКИРОВКА КРИПТО-БИРЖИ
  isWeb3Unlocked() {
    try {
      return localStorage.getItem(STORAGE_KEYS.WEB3_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  },

  unlockWeb3() {
    try {
      localStorage.setItem(STORAGE_KEYS.WEB3_UNLOCKED, 'true');
    } catch (e) {
      console.warn('Cannot unlock web3:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_web3_unlocked', { detail: true }));
    return true;
  },

  lockWeb3() {
    try {
      localStorage.setItem(STORAGE_KEYS.WEB3_UNLOCKED, 'false');
    } catch (e) {
      console.warn('Cannot lock web3:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_web3_unlocked', { detail: false }));
    return false;
  },

  // ФИАТНЫЙ БАЛАНС В ГРИВНАХ (UAH ₴)
  getFiatBalance() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.FIAT_UAH);
      if (val !== null) return parseInt(val, 10);
      localStorage.setItem(STORAGE_KEYS.FIAT_UAH, '67000');
      return 67000;
    } catch {
      return 67000;
    }
  },

  setFiatBalance(amount) {
    const val = Math.max(0, Math.round(amount));
    try {
      localStorage.setItem(STORAGE_KEYS.FIAT_UAH, String(val));
    } catch (e) {
      console.warn('Cannot persist fiat balance:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_fiat_uah_updated', { detail: val }));
    return val;
  },

  addFiatBalance(delta) {
    const current = this.getFiatBalance();
    return this.setFiatBalance(current + delta);
  },

  // БАРАБАННАЯ ЛЕНТА ЭДИТОВ (WEB 3.0) — НАДЕЖНОЕ ХРАНЕНИЕ В INDEXEDDB + LOCALSTORAGE
  getEdits() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EDITS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Очищаем старые ненужные аниме-эдиты
          const filtered = parsed.filter(e => 
            !['edit-kuroko-1', 'edit-akashi-2', 'edit-aomine-3', 'edit-isagi-4', 'edit-bachira-5', 'edit-nagi-6', 'edit-tokyo-9', 'edit-macan-7', 'edit-porsche-8'].includes(e.id)
          );
          const existingIds = new Set(filtered.map(e => e.id));
          const missingDefaults = DEFAULT_EDITS.filter(d => !existingIds.has(d.id));
          const merged = [...filtered, ...missingDefaults];
          try { localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(merged)); } catch {}
          return merged;
        }
      }
      localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(DEFAULT_EDITS));
      return DEFAULT_EDITS;
    } catch {
      return DEFAULT_EDITS;
    }
  },

  // ===================================================
  // СИСТЕМА ДРУЗЕЙ И ХАЙПОВОГО ПОИСКА
  // ===================================================
  getFriends() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(DEFAULT_HYPE_USERS.slice(0, 3)));
      return DEFAULT_HYPE_USERS.slice(0, 3);
    } catch {
      return DEFAULT_HYPE_USERS.slice(0, 3);
    }
  },

  saveFriends(friends) {
    try {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    } catch (e) {
      console.warn('Cannot persist friends:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_friends_updated', { detail: friends }));
    return friends;
  },

  addFriend(user) {
    const friends = this.getFriends();
    const cleanHandle = user.handle.startsWith('@') ? user.handle : `@${user.handle}`;
    if (friends.some(f => f.handle.toLowerCase() === cleanHandle.toLowerCase() || f.id === user.id)) {
      return friends; // Уже в друзьях
    }
    const newFriend = {
      id: user.id || `friend_${Date.now()}`,
      name: user.name || cleanHandle,
      handle: cleanHandle,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
      statusText: user.statusText || 'В сети • Добавлен через хайповый поиск',
      tags: user.tags || ['#swagfriend'],
      online: true,
      verified: !!user.verified,
      chips: user.chips || 25000
    };
    const updated = [newFriend, ...friends];
    this.saveFriends(updated);

    // Автоматически создаем чат с этим другом если его еще нет
    const chats = this.getChats();
    if (!chats.some(c => c.id === newFriend.id || c.name.toLowerCase() === newFriend.name.toLowerCase())) {
      const newChat = {
        id: newFriend.id,
        name: newFriend.name,
        type: 'dm',
        online: true,
        verified: newFriend.verified,
        avatar: newFriend.avatar,
        time: 'Сейчас',
        lastMessage: 'Салют! Добавились через хайповый поиск SWAG. Го в дурака или покер?',
        unread: 1,
        statusText: newFriend.statusText,
        messages: [
          {
            id: 1,
            sender: newFriend.name,
            isMe: false,
            type: 'text',
            text: `Салют! Добавились через хайповый поиск SWAG. Го в дурака или покер? 🔥`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: { '🔥': 2 },
            myReaction: null
          }
        ]
      };
      this.saveChats([newChat, ...chats]);
    }

    return updated;
  },

  removeFriend(friendId) {
    const friends = this.getFriends();
    const updated = friends.filter(f => f.id !== friendId && f.handle !== friendId);
    this.saveFriends(updated);
    return updated;
  },

  isFriend(handleOrId) {
    const friends = this.getFriends();
    const clean = String(handleOrId).toLowerCase();
    return friends.some(f => f.id === clean || f.handle.toLowerCase() === clean || f.handle.toLowerCase() === `@${clean}`);
  },

  getHypeUsers() {
    return DEFAULT_HYPE_USERS;
  },

  restoreDefaultEdits() {
    try {
      localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(DEFAULT_EDITS));
      mediaStore.set('swag_edits_vault', DEFAULT_EDITS);
    } catch {}
    window.dispatchEvent(new CustomEvent('swag_edits_updated', { detail: DEFAULT_EDITS }));
    return DEFAULT_EDITS;
  },

  async hydrateEdits() {
    try {
      const current = this.getEdits();
      let hasChanges = false;
      const hydrated = await Promise.all(current.map(async (e) => {
        const needsMedia = (e.videoUrl && (e.videoUrl.startsWith('idb://') || e.videoUrl.startsWith('blob:'))) ||
                           (e.cover && (e.cover.startsWith('idb://') || e.cover.startsWith('blob:')));
        if (needsMedia) {
          const media = await mediaStore.get('media_edit_' + e.id);
          if (media) {
            hasChanges = true;
            return {
              ...e,
              videoUrl: media.videoBlob ? URL.createObjectURL(media.videoBlob) : (e.videoUrl?.startsWith('idb://') ? null : e.videoUrl),
              cover: media.coverBlob ? URL.createObjectURL(media.coverBlob) : (e.cover?.startsWith('idb://') ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80' : e.cover)
            };
          }
        }
        return e;
      }));
      if (hasChanges) {
        window.dispatchEvent(new CustomEvent('swag_edits_updated', { detail: hydrated }));
        return hydrated;
      }
    } catch (err) {
      console.warn('Cannot hydrate edits from mediaStore:', err);
    }
    return this.getEdits();
  },

  saveEdits(edits) {
    // Избегаем QuotaExceededError: очищаем тяжелые base64-строки перед записью в localStorage
    const lightweight = edits.map(e => {
      const isHeavyVideo = e.videoUrl && (e.videoUrl.length > 500 || e.videoUrl.startsWith('data:') || e.videoUrl.startsWith('blob:'));
      const isHeavyCover = e.cover && (e.cover.length > 500 || e.cover.startsWith('data:') || e.cover.startsWith('blob:'));
      return {
        ...e,
        videoUrl: isHeavyVideo ? 'idb://media_edit_' + e.id : e.videoUrl,
        cover: isHeavyCover ? 'idb://media_edit_' + e.id : e.cover
      };
    });

    try {
      localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('Cannot persist edits to localStorage:', e);
    }

    // Сохраняем полный список в MediaStore IndexedDB
    try {
      mediaStore.set('swag_edits_vault', lightweight);
    } catch {}

    window.dispatchEvent(new CustomEvent('swag_edits_updated', { detail: edits }));
    return edits;
  },

  async addEdit(newEdit, rawBlobs = null) {
    const current = this.getEdits();
    const editId = newEdit.id || `edit-custom-${Date.now()}`;
    const prepared = {
      id: editId,
      title: newEdit.title || 'Пользовательский эдит',
      sound: newEdit.sound || 'SWAG SOUND 67',
      author: newEdit.author || '@swag_creator',
      likes: newEdit.likes || 1,
      shares: 0,
      cover: newEdit.cover || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
      videoUrl: newEdit.videoUrl || null,
      tag: newEdit.tag || 'CUSTOM EDIT 🔥',
      anime: newEdit.anime || 'Custom Drop',
      videoNote: newEdit.videoNote || 'Пользовательский дроп в молитвенный барабан SWAG INC.',
      createdAt: Date.now()
    };

    // Если переданы блобы или есть тяжелые медиа, пишем в IndexedDB
    if (rawBlobs && (rawBlobs.videoBlob || rawBlobs.coverBlob)) {
      try {
        await mediaStore.set('media_edit_' + editId, {
          videoBlob: rawBlobs.videoBlob,
          coverBlob: rawBlobs.coverBlob
        });
      } catch (err) {
        console.warn('Cannot store edit media blobs:', err);
      }
    }

    const updated = [prepared, ...current];
    this.saveEdits(updated);
    return updated;
  },

  async updateEdit(editId, updatedData, rawBlobs = null) {
    if (rawBlobs && (rawBlobs.videoBlob || rawBlobs.coverBlob)) {
      try {
        const existing = (await mediaStore.get('media_edit_' + editId)) || {};
        await mediaStore.set('media_edit_' + editId, {
          videoBlob: rawBlobs.videoBlob || existing.videoBlob,
          coverBlob: rawBlobs.coverBlob || existing.coverBlob
        });
      } catch (err) {
        console.warn('Cannot update edit media blobs:', err);
      }
    }
    const current = this.getEdits();
    const updated = current.map(e => e.id === editId ? { ...e, ...updatedData } : e);
    this.saveEdits(updated);
    return updated;
  },

  deleteEdit(editId) {
    const current = this.getEdits();
    const updated = current.filter(e => e.id !== editId);
    try {
      mediaStore.remove('media_edit_' + editId);
    } catch {}
    this.saveEdits(updated);
    return updated;
  },

  // ЗАКАЗЫ МАРКЕТПЛЕЙСА (WEB 1.0 WILDBERRIES STYLE)
  getOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    } catch {
      return DEFAULT_ORDERS;
    }
  },

  saveOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Cannot persist orders:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_orders_updated', { detail: orders }));
    return orders;
  },

  createOrder(orderData) {
    const current = this.getOrders();
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const pin = Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: `WB-SWAG-67-${codeNum}`,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'Собран на складе SWAG-WB 📦',
      statusCode: 'packed',
      pickupPoint: orderData.pickupPoint || 'SWAG POINT №67 // Садовая, д. 4',
      pickupCode: String(pin),
      totalSwag: orderData.totalSwag || 0,
      totalUah: orderData.totalUah || ((orderData.totalSwag || 0) * 67),
      paymentMethod: orderData.paymentMethod || 'SWAG COINS',
      items: orderData.items || []
    };
    const updated = [newOrder, ...current];
    this.saveOrders(updated);
    return newOrder;
  },

  cancelOrder(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    // Возврат $SWAG на баланс при отмене
    if (order.totalSwag > 0 && order.statusCode !== 'cancelled') {
      this.addBalance(order.totalSwag);
    }
    const updated = orders.map(o => o.id === orderId ? {
      ...o,
      status: 'Отменен (Средства возвращены) ❌',
      statusCode: 'cancelled'
    } : o);
    this.saveOrders(updated);
    return true;
  },

  // БИНАНС: ОТКРЫТЫЕ ОРДЕРА И ИСТОРИЯ СДЕЛОК
  getOpenOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OPEN_ORDERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.OPEN_ORDERS, JSON.stringify(DEFAULT_OPEN_ORDERS));
      return DEFAULT_OPEN_ORDERS;
    } catch {
      return DEFAULT_OPEN_ORDERS;
    }
  },

  saveOpenOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.OPEN_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Cannot persist open orders:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_open_orders_updated', { detail: orders }));
    return orders;
  },

  addOpenOrder(order) {
    const current = this.getOpenOrders();
    const prepared = {
      ...order,
      id: order.id || `ord-${Date.now()}`,
      status: 'OPEN',
      filled: '0%',
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [prepared, ...current];
    this.saveOpenOrders(updated);
    return updated;
  },

  cancelOpenOrder(orderId) {
    const orders = this.getOpenOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    // Возврат заблокированных средств
    if (order.side === 'BUY') {
      // Возврат гривень (UAH)
      this.addFiatBalance(order.total);
    } else {
      // Возврат $SWAG
      this.addBalance(order.amount);
    }

    const updated = orders.filter(o => o.id !== orderId);
    this.saveOpenOrders(updated);
    return true;
  },

  // Мгновенное исполнение одного открытого ордера
  executeOpenOrder(orderId) {
    const orders = this.getOpenOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    // При исполнении ордера средства моментально поступают на баланс
    if (order.side === 'BUY') {
      // Покупка: покупатель получает токен $SWAG
      this.addBalance(Math.round(order.amount));
    } else {
      // Продажа: продавец получает фиатные гривны (UAH ₴)
      this.addFiatBalance(Math.round(order.total));
    }

    // Фиксируем сделку в истории
    this.addTrade({
      id: `trd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pair: order.pair,
      side: order.side,
      price: order.price,
      amount: order.amount,
      total: order.total,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });

    const updated = orders.filter(o => o.id !== orderId);
    this.saveOpenOrders(updated);
    return order;
  },

  // Мгновенное исполнение ВСЕХ открытых ордеров разом (забрать все деньги)
  executeAllOpenOrders() {
    const orders = this.getOpenOrders();
    if (orders.length === 0) return { count: 0, uah: 0, swag: 0 };

    let totalUah = 0;
    let totalSwag = 0;
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    orders.forEach(order => {
      if (order.side === 'BUY') {
        totalSwag += Math.round(order.amount);
      } else {
        totalUah += Math.round(order.total);
      }

      this.addTrade({
        id: `trd-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        pair: order.pair,
        side: order.side,
        price: order.price,
        amount: order.amount,
        total: order.total,
        time: nowTime
      });
    });

    if (totalSwag > 0) this.addBalance(totalSwag);
    if (totalUah > 0) this.addFiatBalance(totalUah);

    this.saveOpenOrders([]);
    return { count: orders.length, uah: totalUah, swag: totalSwag };
  },

  getTradeHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(DEFAULT_TRADE_HISTORY));
      return DEFAULT_TRADE_HISTORY;
    } catch {
      return DEFAULT_TRADE_HISTORY;
    }
  },

  addTrade(trade) {
    const current = this.getTradeHistory();
    const prepared = {
      ...trade,
      id: `tr-${Date.now()}`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    const updated = [prepared, ...current.slice(0, 49)];
    try {
      localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Cannot persist trade history:', e);
    }
    window.dispatchEvent(new CustomEvent('swag_trades_updated', { detail: updated }));
    return updated;
  },

  getAdhdMode() {
    try {
      return localStorage.getItem('swag_adhd_mode') === 'true';
    } catch {
      return false;
    }
  },

  setAdhdMode(enabled) {
    try {
      localStorage.setItem('swag_adhd_mode', enabled ? 'true' : 'false');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swag_adhd_updated', { detail: enabled }));
    }
    return enabled;
  }
};
