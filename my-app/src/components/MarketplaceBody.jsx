import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import ProductCard from './ProductCard';

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аудио & Бас', 'Аксессуары'];

const PRESET_IMAGES = [
  { name: 'Худи VAMP', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80' },
  { name: 'Кроссовки Run', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80' },
  { name: 'Акустика Letnik', url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80' },
  { name: 'Золотая цепь 777', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80' },
  { name: 'Кибер-очки', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80' },
  { name: 'Бомбер Porsche', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80' }
];

const PRODUCT_REVIEWS_MAP = {
  'prod-1': [
    {
      id: 101,
      author: 'Артём М. (Porsche Driver)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '17 сентября 2026',
      text: 'Плотность футера 480 г/м² просто космос! Худи держит форму, капюшон глубокий. Рефлектив горит ярко, под трек Летник вайб нереальный. Доставили за день в ПВЗ.',
      verified: true
    },
    {
      id: 102,
      author: 'Кирилл В. (Streetwear Critic)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '12 сентября 2026',
      text: 'Швы ровные, скрытый карман под Ledger кошелек продуман гениально. Стирается без катышков, оверсайз честный.',
      verified: true
    },
    {
      id: 103,
      author: 'Денис С.',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '5 сентября 2026',
      text: 'Тяжелый премиальный хлопок, металлические люверсы с гравировкой. Стоит каждого $SWAG.',
      verified: true
    }
  ],
  'prod-2': [
    {
      id: 201,
      author: 'Сергей Л. (CyberRunner)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '16 сентября 2026',
      text: 'Карбоновая вставка в подошве реально дает отскок при беге! Амортизация Air Sole мягкая, ноги не устают после 10 км.',
      verified: true
    },
    {
      id: 202,
      author: 'Никита Б.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '11 сентября 2026',
      text: 'Светоотражатели 3M Scotchlite в темноте светят как стробоскопы. Размер подошел идеально.',
      verified: true
    }
  ],
  'prod-3': [
    {
      id: 301,
      author: 'Влад DJ (Bass Producer)',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '15 сентября 2026',
      text: 'Бас на 25 Гц сотрясает стены! Сабвуфер отрабатывает низкие частоты фонка и трека Летник на 100%. Батарея держит сутки.',
      verified: true
    },
    {
      id: 302,
      author: 'Егор К.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '8 сентября 2026',
      text: 'Влагозащита проверена под ливнем на крыше — звук чистый, никакой хрипоты.',
      verified: true
    }
  ],
  'prod-4': [
    {
      id: 401,
      author: 'Марк (VIP Swag Lord)',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '14 сентября 2026',
      text: 'Вес 185 грамм, кулон массивный, муассаниты сияют ослепительно. Проверили алмазным тестером — оригинал!',
      verified: true
    },
    {
      id: 402,
      author: 'Руслан Т.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '9 сентября 2026',
      text: 'NFT-сертификат сразу появился в блокчейне SwagChain. Замок крепкий, гравировка четкая.',
      verified: true
    }
  ],
  'prod-5': [
    {
      id: 501,
      author: 'Тимур Р. (Night Hunter)',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '16 сентября 2026',
      text: 'Поляризация 9-слойная, за рулем ночью и на солнце блики фар гасит идеально. Оправа из алюминия легкая.',
      verified: true
    },
    {
      id: 502,
      author: 'Олег М.',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      rating: 4,
      date: '10 сентября 2026',
      text: 'Смотрятся очень агрессивно и стильно. В комплекте кожаный кейс и салфетка.',
      verified: true
    }
  ],
  'prod-6': [
    {
      id: 601,
      author: 'Григорий (911 Driver)',
      avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '18 сентября 2026',
      text: 'Кожа Nappa мягчайшая, шелковая подкладка с звуковой волной трека Летник — детализация космос. Греет до -15°C.',
      verified: true
    },
    {
      id: 602,
      author: 'Павел В.',
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '13 сентября 2026',
      text: 'Молнии YKK Vislon ходят как по маслу. Лучшая куртка в моем гардеробе.',
      verified: true
    }
  ],
  'prod-7': [
    {
      id: 701,
      author: 'Илья Dev (Night Hacker)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '17 сентября 2026',
      text: 'Вкус темной маракуйи топчик, не приторный (0 сахара!). Держит заряд на 6 часов ночного кодинга без тремора.',
      verified: true
    },
    {
      id: 702,
      author: 'Александр С.',
      avatar: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '11 сентября 2026',
      text: 'Приехал целый ящик 24 банки, все целые. Охлажденным пить одно удовольствие.',
      verified: true
    }
  ],
  'prod-8': [
    {
      id: 801,
      author: 'Роман (Custom Keebs)',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '15 сентября 2026',
      text: 'Свитчи Gateron Yellow Pro смазаны с завода идеально — звук глубокий и сочный (thock), стабы не гремят. Poron шумка топ.',
      verified: true
    },
    {
      id: 802,
      author: 'Дмитрий Ю.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '7 сентября 2026',
      text: 'Кейкапы PBT толстые, подсветка яркая, кабель Type-C в качественной оплетке. Печатать сплошной кайф.',
      verified: true
    }
  ]
};

const getProductReviews = (product) => {
  if (!product) return [];
  if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    return product.reviews;
  }
  if (PRODUCT_REVIEWS_MAP[product.id]) {
    return PRODUCT_REVIEWS_MAP[product.id];
  }
  return [
    {
      id: 991,
      author: 'Максим (Swag Buyer)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: 'Вчера',
      text: `Товар «${product.title}» превзошел ожидания. Качество от ${product.seller || 'SWAG INC.'} на высоте!`,
      verified: true
    },
    {
      id: 992,
      author: 'Антон К.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      date: '3 дня назад',
      text: 'Быстрая доставка в пункт выдачи SWAG POINT, упаковано надежно.',
      verified: true
    }
  ];
};

const MarketplaceBody = () => {
  const [products, setProducts] = useState(() => db.getProducts());
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  
  // Модальные окна
  const [selectedProduct, setSelectedProduct] = useState(null); // Детальная страница как на Wildberries
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'desc', 'reviews'
  
  // Корзина товаров и история заказов
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(() => db.getOrders());
  const [marketToast, setMarketToast] = useState(null);

  // Поля формы добавления товара
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOldPrice, setNewOldPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Одежда');
  const [newImage, setNewImage] = useState(PRESET_IMAGES[0].url);
  const [imageSourceType, setImageSourceType] = useState('preset'); // 'preset', 'url', 'file'
  const [newDesc, setNewDesc] = useState('');
  const [newMaterial, setNewMaterial] = useState('100% Премиальный хлопок / Carbon');
  const [newVendorCode, setNewVendorCode] = useState(`SWAG-WB-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('⚠️ Файл слишком большой (макс 15 МБ)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setNewImage(uploadEvent.target.result);
      showToast('✓ Файл изображения успешно загружен!');
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg) => {
    setMarketToast(msg);
    setTimeout(() => setMarketToast(null), 3500);
  };

  // Слушаем обновления товаров и заказов из БД
  useEffect(() => {
    const handleUpdated = (e) => {
      if (Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };
    const handleOrders = (e) => {
      if (Array.isArray(e.detail)) {
        setOrders(e.detail);
      }
    };

    window.addEventListener('swag_products_updated', handleUpdated);
    window.addEventListener('swag_orders_updated', handleOrders);

    return () => {
      window.removeEventListener('swag_products_updated', handleUpdated);
      window.removeEventListener('swag_orders_updated', handleOrders);
    };
  }, []);

  // Фильтрация и сортировка
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'Все' || p.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || 
      p.title?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.characteristics?.['Артикул WB']?.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.reviewsCount || 0) - (a.reviewsCount || 0);
  });

  // Добавление в корзину
  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, count: item.count + 1 } : item);
      }
      return [...prev, { product, count: 1 }];
    });
    showToast(`🛒 «${product.title.slice(0, 25)}...» добавлен в корзину!`);
  };

  // Прямая покупка товара за $SWAG
  const handleInstantBuy = (product) => {
    const balance = db.getBalance();
    if (balance < product.price) {
      showToast(`❌ Недостаточно средств! Нужно: ${product.price.toLocaleString()} $SWAG. Ваш баланс: ${balance.toLocaleString()} $SWAG`);
      return;
    }

    db.addBalance(-product.price);
    const newOrder = db.createOrder({
      totalSwag: product.price,
      totalUah: product.price * 67,
      paymentMethod: 'SWAG COINS',
      items: [
        {
          id: product.id,
          title: product.title,
          price: product.price,
          count: 1,
          image: product.image,
          vendorCode: product.characteristics?.['Артикул WB'] || 'SWAG-WB-67'
        }
      ]
    });
    showToast(`🎉 Заказ #${newOrder.id} оплачен в $SWAG! Пин-код получения: ${newOrder.pickupCode}.`);
  };

  // Создание нового товара
  const handleCreateProduct = (e) => {
    e.preventDefault();
    const priceNum = parseInt(newPrice, 10);
    if (!newTitle.trim() || isNaN(priceNum) || priceNum <= 0) {
      showToast('Укажите корректное название и цену в $SWAG!');
      return;
    }

    const oldPriceNum = parseInt(newOldPrice, 10) || Math.round(priceNum * 1.5);
    const newProd = {
      id: `custom-prod-${Date.now()}`,
      title: newTitle.trim(),
      price: priceNum,
      oldPrice: oldPriceNum,
      category: newCategory,
      tag: 'NEW DROP 🔥',
      rating: 5.0,
      reviewsCount: 1,
      image: newImage.trim() || PRESET_IMAGES[0].url,
      description: newDesc.trim() || 'Эксклюзивный дроп от участника платформы SWAG INC. Премиальное качество материалов и заводская гарантия.',
      characteristics: {
        'Артикул WB': newVendorCode.trim(),
        'Состав': newMaterial.trim(),
        'Категория': newCategory,
        'Страна производства': 'Россия, Custom Lab',
        'Комплектация': 'Товар, защитная брендированная упаковка'
      },
      stock: 50,
      delivery: 'Завтра в пункт выдачи SWAG POINT'
    };

    db.addProduct(newProd);
    setShowAddModal(false);
    showToast(`⚡ Товар «${newTitle.slice(0, 25)}» успешно добавлен в маркетплейс!`);

    // Очистка формы
    setNewTitle('');
    setNewPrice('');
    setNewOldPrice('');
    setNewDesc('');
  };

  const totalCartCost = cart.reduce((sum, item) => sum + (item.product.price * item.count), 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.count, 0);

  const handleCheckoutCart = () => {
    if (cart.length === 0) return;
    const balance = db.getBalance();
    if (balance < totalCartCost) {
      showToast(`❌ Недостаточно средств! Требуется ${totalCartCost.toLocaleString()} $SWAG. У вас ${balance.toLocaleString()} $SWAG`);
      return;
    }

    db.addBalance(-totalCartCost);
    const newOrder = db.createOrder({
      totalSwag: totalCartCost,
      totalUah: totalCartCost * 67,
      paymentMethod: 'SWAG COINS',
      items: cart.map(item => ({
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        count: item.count,
        image: item.product.image,
        vendorCode: item.product.characteristics?.['Артикул WB'] || 'SWAG-WB-67'
      }))
    });
    setCart([]);
    setShowCartModal(false);
    showToast(`🎉 Заказ #${newOrder.id} на ${totalCartCost.toLocaleString()} $SWAG оплачен! Пин-код выдачи: ${newOrder.pickupCode}`);
  };

  return (
    <section className="market-section">
      {marketToast && (
        <div className="swag-market-toast">
          <span className="toast-icon">⚡</span>
          <span>{marketToast}</span>
        </div>
      )}

      <div className="container">
        {/* ===================================================
            ОБНОВЛЕННАЯ ШАПКА ВИТРИНЫ WEB 1.0 (БЕЗ СЛОВ ЛЕВО И ПРАВО)
            СЛЕВА: КАТЕГОРИИ И ФИЛЬТРЫ
            ПО ЦЕНТРУ: АКТИВНЫЙ ПОИСК И СОРТИРОВКА
            СПРАВА: КНОПКА «ДОБАВИТЬ ТОВАР» И КОРЗИНА
            =================================================== */}
        <div className="market-toolbar-header">
          {/* СЛЕВА: Категории и переключатели */}
          <div className="toolbar-left-controls">
            <span className="market-badge-label">
              🛒 КАТАЛОГ WB:
            </span>
            <div className="category-pills-row">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'Все' ? '🔥 Все товары' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* ПО ЦЕНТРУ: Поиск и сортировка */}
          <div className="toolbar-center-search">
            <div className="cyber-search-wrapper">
              <span className="search-glyph">🔍</span>
              <input 
                className="cyber-input market-search-input" 
                placeholder="Поиск по названию, категории или артикулу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="search-clear-btn" 
                  onClick={() => setSearchQuery('')}
                  title="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </div>

            <select 
              className="market-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Сортировка товаров"
            >
              <option value="popular">По популярности</option>
              <option value="rating">По рейтингу ★</option>
              <option value="price_asc">Сначала дешевле ↑</option>
              <option value="price_desc">Сначала дороже ↓</option>
            </select>
          </div>

          {/* СПРАВА: Добавить товар, Мои заказы и Корзина */}
          <div className="toolbar-right-actions">
            <button 
              className="cyber-btn add-product-btn"
              onClick={() => setShowAddModal(true)}
              title="Добавить новый товар в базу данных маркетплейса"
            >
              <span className="btn-icon">➕</span>
              <span>ДОБАВИТЬ ТОВАР</span>
            </button>

            <button 
              className="cyber-btn my-orders-btn"
              onClick={() => setShowOrdersModal(true)}
              title="Посмотреть историю и трекинг моих заказов WB"
            >
              <span className="btn-icon">📦</span>
              <span>МОИ ЗАКАЗЫ</span>
              {orders.length > 0 && (
                <span className="orders-counter-badge">{orders.length}</span>
              )}
            </button>

            <button 
              className="cyber-btn market-cart-btn"
              onClick={() => setShowCartModal(true)}
              title="Открыть корзину покупок"
            >
              <span className="btn-icon">🛒</span>
              <span>КОРЗИНА</span>
              {totalCartCount > 0 && (
                <span className="cart-counter-badge">{totalCartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Индикатор результатов поиска */}
        <div className="market-results-status">
          <span>Найдено товаров: <strong className="highlight">{filteredProducts.length}</strong></span>
          {searchQuery && <span> по запросу «{searchQuery}»</span>}
          {selectedCategory !== 'Все' && <span> в категории <strong className="highlight">{selectedCategory}</strong></span>}
        </div>

        {/* Сетка карточек товаров */}
        <div className="market-container">
          {filteredProducts.length > 0 ? (
            <ul className="market-list">
              {filteredProducts.map((prod) => (
                <li key={prod.id}>
                  <ProductCard 
                    product={prod} 
                    onClick={(p) => {
                      setSelectedProduct(p);
                      setActiveTab('specs');
                    }}
                    onBuy={(p) => handleAddToCart(p)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="market-empty-state">
              <span className="empty-icon">📦</span>
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить категорию или поисковый запрос.</p>
              <button 
                className="cyber-btn"
                onClick={() => { setSelectedCategory('Все'); setSearchQuery(''); }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          ДЕТАЛЬНАЯ СТРАНИЦА ТОВАРА КАК НА WILDBERRIES (MODAL VIEW)
          =================================================== */}
      {selectedProduct && (
        <div className="wb-product-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="wb-product-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="wb-modal-close-btn"
              onClick={() => setSelectedProduct(null)}
              title="Закрыть"
            >
              ✕
            </button>

            {/* Хлебные крошки Wildberries */}
            <div className="wb-breadcrumbs">
              <span>Главная</span> / <span>Маркетплейс Web 1.0</span> / <span>{selectedProduct.category}</span> / <span className="current">{selectedProduct.title}</span>
            </div>

            <div className="wb-product-grid">
              {/* Левая колонка: Фотография товара */}
              <div className="wb-gallery-column">
                <div className="wb-main-image-box">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.title} 
                    className="wb-main-photo" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PRESET_IMAGES[0].url;
                    }}
                  />
                  <div className="wb-photo-badges">
                    {selectedProduct.tag && (
                      <span className="wb-tag-badge">{selectedProduct.tag}</span>
                    )}
                    <span className="wb-verified-orig">✓ ОРИГИНАЛ</span>
                  </div>
                </div>
              </div>

              {/* Правая колонка: Инфо, Цены, WB Рейтинг, Доставка, Кнопки */}
              <div className="wb-info-column">
                <div className="wb-brand-line">
                  <span className="wb-seller-name">{selectedProduct.seller || 'SWAG INC. OFFICIAL'}</span>
                  <span className="wb-verified-check">✓ Проверенный поставщик</span>
                </div>

                <h1 className="wb-product-title">{selectedProduct.title}</h1>

                {/* Рейтинг со звёздами и количество заказов */}
                <div className="wb-rating-block">
                  <div className="wb-stars">★ {selectedProduct.rating || 5.0}</div>
                  <span className="wb-review-link">
                    {selectedProduct.reviewsCount || 1} отзывов покупателей
                  </span>
                  <span className="wb-dot-sep">•</span>
                  <span className="wb-sales-count">Купили более 2 500 раз</span>
                </div>

                {/* Блок цены с картой SWAG Pay / Wildberries */}
                <div className="wb-price-container">
                  <div className="wb-main-price-row">
                    <span className="wb-current-price">
                      {selectedProduct.price.toLocaleString()} <span className="swag-cur">$SWAG</span>
                    </span>
                    {selectedProduct.oldPrice && (
                      <span className="wb-old-price">
                        {selectedProduct.oldPrice.toLocaleString()} $SWAG
                      </span>
                    )}
                    {selectedProduct.oldPrice && (
                      <span className="wb-discount-badge">
                        -{Math.round((1 - selectedProduct.price / selectedProduct.oldPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="wb-swagpay-line">
                    <span className="swagpay-pill">⚡ SWAG PAY</span>
                    <span>Курс: 1 SWAG = 67 ₴ (~ {(selectedProduct.price * 67).toLocaleString()} ₴)</span>
                  </div>
                </div>

                {/* Информация о доставке и складе */}
                <div className="wb-delivery-card">
                  <div className="delivery-row">
                    <span className="delivery-icon">🚚</span>
                    <div>
                      <strong>Пункт выдачи SWAG POINT</strong>
                      <div className="delivery-sub">Доставка завтра, бесплатно. Примерка и возврат.</div>
                    </div>
                  </div>
                  <div className="delivery-row">
                    <span className="delivery-icon">📦</span>
                    <div>
                      <span>В наличии на складе: <strong>{selectedProduct.stock || 45} шт.</strong></span>
                    </div>
                  </div>
                </div>

                {/* Кнопки покупки */}
                <div className="wb-actions-row">
                  <button 
                    className="cyber-btn wb-add-cart-btn"
                    onClick={() => handleAddToCart(selectedProduct)}
                  >
                    🛒 ДОБАВИТЬ В КОРЗИНУ
                  </button>
                  <button 
                    className="cyber-btn wb-instant-buy-btn"
                    onClick={() => handleInstantBuy(selectedProduct)}
                  >
                    ⚡ КУПИТЬ В 1 КЛИК
                  </button>
                </div>

                {/* Переключатель табов: Характеристики / Описание / Отзывы */}
                <div className="wb-tabs-bar">
                  <button 
                    className={`wb-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('specs')}
                  >
                    📋 ХАРАКТЕРИСТИКИ
                  </button>
                  <button 
                    className={`wb-tab-btn ${activeTab === 'desc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('desc')}
                  >
                    📝 ОПИСАНИЕ
                  </button>
                  <button 
                    className={`wb-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    ⭐ ОТЗЫВЫ ({selectedProduct.reviewsCount || 1})
                  </button>
                </div>

                {/* Контент таба 1: Таблица характеристик (Wildberries Specs) */}
                {activeTab === 'specs' && (
                  <div className="wb-tab-content specs-content">
                    <h4 className="specs-heading">Основные характеристики товара:</h4>
                    <table className="wb-specs-table">
                      <tbody>
                        {Object.entries(selectedProduct.characteristics || {}).map(([key, val]) => (
                          <tr key={key}>
                            <td className="spec-key">{key}</td>
                            <td className="spec-val">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Контент таба 2: Описание товара */}
                {activeTab === 'desc' && (
                  <div className="wb-tab-content desc-content">
                    <h4 className="specs-heading">Описание и особенности:</h4>
                    <p className="wb-desc-text">
                      {selectedProduct.description || 'Оригинальный брендированный товар из лимитированной коллекции SWAG INC. Прошел сертификацию и строгий контроль качества.'}
                    </p>
                    <div className="wb-desc-points">
                      <div>✓ Эксклюзивный дизайн в стилистике киберпанка и уличной моды</div>
                      <div>✓ Повышенная износостойкость материалов</div>
                      <div>✓ Официальная гарантия производителя и обмен без лишних вопросов</div>
                    </div>
                  </div>
                )}

                {/* Контент таба 3: Отзывы покупателей */}
                {activeTab === 'reviews' && (
                  <div className="wb-tab-content reviews-content">
                    <h4 className="specs-heading">Отзывы реальных покупателей:</h4>
                    <div className="wb-reviews-list">
                      {getProductReviews(selectedProduct).map(rev => (
                        <div key={rev.id} className="wb-review-card">
                          <div className="review-top-row">
                            <img src={rev.avatar} alt={rev.author} className="review-avatar" />
                            <div>
                              <div className="review-author">{rev.author}</div>
                              <div className="review-meta">
                                <span className="review-stars">{'★'.repeat(rev.rating)}</span>
                                <span className="review-date">{rev.date}</span>
                                {rev.verified && <span className="verified-pill">✓ Товар куплен на WB</span>}
                              </div>
                            </div>
                          </div>
                          <p className="review-text">{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          МОДАЛЬНОЕ ОКНО «ДОБАВИТЬ ТОВАР» В ОБЩУЮ БАЗУ ДАННЫХ
          =================================================== */}
      {showAddModal && (
        <div className="wb-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="wb-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <div className="header-title-box">
                <span className="modal-icon">➕</span>
                <h3>ДОБАВИТЬ ТОВАР В МАРКЕТПЛЕЙС</h3>
              </div>
              <button 
                className="wb-close-icon"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="wb-add-form">
              <div className="form-row">
                <div className="input-field flex-2">
                  <label>НАЗВАНИЕ ТОВАРА</label>
                  <input 
                    type="text"
                    className="cyber-input"
                    placeholder="Например: Худи Cyber Oversize 67"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-field flex-1">
                  <label>КАТЕГОРИЯ</label>
                  <select 
                    className="cyber-input select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Одежда">Одежда</option>
                    <option value="Обувь">Обувь</option>
                    <option value="Аудио & Бас">Аудио & Бас</option>
                    <option value="Аксессуары">Аксессуары</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-field flex-1">
                  <label>ЦЕНА В $SWAG</label>
                  <input 
                    type="number"
                    min="1"
                    className="cyber-input"
                    placeholder="6700"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                  {newPrice && (
                    <span className="price-calc-hint">
                      ≈ {(parseInt(newPrice, 10) * 67).toLocaleString()} ₴
                    </span>
                  )}
                </div>

                <div className="input-field flex-1">
                  <label>СТАРАЯ ЦЕНА (ДЛЯ СКИДКИ)</label>
                  <input 
                    type="number"
                    min="1"
                    className="cyber-input"
                    placeholder="12000"
                    value={newOldPrice}
                    onChange={(e) => setNewOldPrice(e.target.value)}
                  />
                </div>

                <div className="input-field flex-1">
                  <label>АРТИКУЛ WB</label>
                  <input 
                    type="text"
                    className="cyber-input"
                    value={newVendorCode}
                    onChange={(e) => setNewVendorCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Выбор пресета фото, ссылки или загрузки своего файла */}
              <div className="input-field">
                <label>ИЗОБРАЖЕНИЕ ТОВАРА (ССЫЛКА ИЛИ СВОЙ ФАЙЛ)</label>
                <div className="source-toggle-row">
                  <button
                    type="button"
                    className={`source-toggle-btn ${imageSourceType === 'preset' ? 'active' : ''}`}
                    onClick={() => setImageSourceType('preset')}
                  >
                    🖼️ Шаблоны
                  </button>
                  <button
                    type="button"
                    className={`source-toggle-btn ${imageSourceType === 'url' ? 'active' : ''}`}
                    onClick={() => setImageSourceType('url')}
                  >
                    🌐 Ссылка (URL)
                  </button>
                  <button
                    type="button"
                    className={`source-toggle-btn ${imageSourceType === 'file' ? 'active' : ''}`}
                    onClick={() => setImageSourceType('file')}
                  >
                    📁 Свой файл
                  </button>
                </div>

                {imageSourceType === 'preset' && (
                  <div className="preset-images-row">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`preset-img-btn ${newImage === preset.url ? 'active' : ''}`}
                        onClick={() => setNewImage(preset.url)}
                      >
                        <img src={preset.url} alt={preset.name} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {imageSourceType === 'url' && (
                  <input 
                    type="url"
                    className="cyber-input image-url-input"
                    placeholder="https://images.unsplash.com/... (прямая ссылка на картинку)"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                  />
                )}

                {imageSourceType === 'file' && (
                  <div className="file-upload-box">
                    <input 
                      type="file"
                      id="product-file-input"
                      accept="image/*"
                      className="file-hidden-input"
                      onChange={handleImageFileChange}
                    />
                    <label htmlFor="product-file-input" className="file-upload-label">
                      <span>📁 Нажмите, чтобы выбрать картинку с диска</span>
                      <small>Поддерживаются PNG, JPG, WEBP, GIF</small>
                    </label>
                  </div>
                )}

                {newImage && (
                  <div className="image-live-preview-box">
                    <span className="preview-label">Предпросмотр обложки:</span>
                    <img src={newImage} alt="Превью товара" className="image-live-preview-thumb" />
                  </div>
                )}
              </div>

              <div className="input-field">
                <label>СОСТАВ / МАТЕРИАЛ ХАРАКТЕРИСТИКИ</label>
                <input 
                  type="text"
                  className="cyber-input"
                  placeholder="Хлопок 85%, Полиэстер 15%"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                />
              </div>

              <div className="input-field">
                <label>ОПИСАНИЕ ТОВАРА</label>
                <textarea 
                  className="cyber-input textarea"
                  rows="3"
                  placeholder="Подробное описание характеристик, посадки, вайба и преимуществ товара..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button 
                  type="button" 
                  className="cyber-btn cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  ОТМЕНА
                </button>
                <button 
                  type="submit" 
                  className="cyber-btn submit-add-btn"
                >
                  🔥 ОПУБЛИКОВАТЬ В МАРКЕТПЛЕЙС
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          МОДАЛЬНОЕ ОКНО КОРЗИНЫ
          =================================================== */}
      {showCartModal && (
        <div className="wb-modal-backdrop" onClick={() => setShowCartModal(false)}>
          <div className="wb-cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-modal-header">
              <div className="cart-title-row">
                <span>🛒</span>
                <h3>КОРЗИНА ПОКУПОК</h3>
                <span className="cart-count-badge">({totalCartCount} шт.)</span>
              </div>
              <button 
                className="wb-close-icon"
                onClick={() => setShowCartModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="cart-modal-body">
              {cart.length > 0 ? (
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.product.id} className="cart-item-card">
                      <img src={item.product.image} alt={item.product.title} className="cart-item-img" />
                      <div className="cart-item-info">
                        <h4>{item.product.title}</h4>
                        <div className="cart-item-seller">{item.product.seller}</div>
                        <div className="cart-item-price">
                          {(item.product.price * item.count).toLocaleString()} $SWAG
                          <span className="cart-sub-price"> (~ {((item.product.price * item.count) * 67).toLocaleString()} ₴)</span>
                        </div>
                      </div>
                      <div className="cart-item-qty">
                        <button 
                          className="qty-btn"
                          onClick={() => {
                            setCart(prev => prev.map(i => {
                              if (i.product.id === item.product.id) {
                                return { ...i, count: Math.max(1, i.count - 1) };
                              }
                              return i;
                            }));
                          }}
                        >
                          -
                        </button>
                        <span className="qty-num">{item.count}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => {
                            setCart(prev => prev.map(i => {
                              if (i.product.id === item.product.id) {
                                return { ...i, count: i.count + 1 };
                              }
                              return i;
                            }));
                          }}
                        >
                          +
                        </button>
                        <button 
                          className="remove-item-btn"
                          onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                          title="Удалить из корзины"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cart-empty-state">
                  <span>🛒</span>
                  <p>Ваша корзина пуста. Добавьте понравившиеся товары из каталога!</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-modal-footer">
                <div className="cart-total-row">
                  <span>ИТОГО К ОПЛАТЕ:</span>
                  <div className="total-digits">
                    <span className="swag-sum">{totalCartCost.toLocaleString()} $SWAG</span>
                    <span className="uah-sum">≈ {(totalCartCost * 67).toLocaleString()} ₴</span>
                  </div>
                </div>
                <button 
                  className="cyber-btn checkout-btn"
                  onClick={handleCheckoutCart}
                >
                  ⚡ ОФОРМИТЬ ЗАКАЗ И ОПЛАТИТЬ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ===================================================
          МОДАЛЬНОЕ ОКНО «МОИ ЗАКАЗЫ» (WILDBERRIES STYLE TRACKING)
          =================================================== */}
      {showOrdersModal && (
        <div className="wb-modal-backdrop" onClick={() => setShowOrdersModal(false)}>
          <div className="wb-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="orders-modal-header">
              <div className="orders-title-cluster">
                <span className="orders-box-icon">📦</span>
                <h3 className="orders-main-title gothic-text">МОИ ЗАКАЗЫ (WB TRACKING)</h3>
                <span className="orders-count-badge">Всего: {orders.length}</span>
              </div>
              <button 
                className="wb-close-icon"
                onClick={() => setShowOrdersModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="orders-modal-body">
              {orders.length > 0 ? (
                <div className="orders-cards-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-history-card">
                      <div className="order-top-meta">
                        <div className="order-id-group">
                          <span className="order-id-label">ЗАКАЗ:</span>
                          <strong className="order-id-val">{order.id}</strong>
                          <span className="order-date-val">от {order.date}</span>
                        </div>
                        <span className={`order-status-badge ${order.statusCode || 'packed'}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Трекер статуса доставки */}
                      <div className="order-tracking-stepper">
                        <div className="step-node active">
                          <span className="step-dot"></span>
                          <span className="step-label">Оформлен</span>
                        </div>
                        <div className={`step-line ${order.statusCode !== 'cancelled' ? 'active' : ''}`}></div>
                        <div className={`step-node ${order.statusCode === 'shipping' || order.statusCode === 'ready' ? 'active' : ''}`}>
                          <span className="step-dot"></span>
                          <span className="step-label">В пути в ПВЗ</span>
                        </div>
                        <div className={`step-line ${order.statusCode === 'ready' ? 'active' : ''}`}></div>
                        <div className={`step-node ${order.statusCode === 'ready' ? 'active' : ''}`}>
                          <span className="step-dot"></span>
                          <span className="step-label">В пункте выдачи</span>
                        </div>
                      </div>

                      {/* Состав заказа */}
                      <div className="order-items-scroll">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="order-item-snippet">
                            <img src={item.image} alt={item.title} className="order-item-thumb" />
                            <div className="order-item-details">
                              <h5>{item.title}</h5>
                              <span className="order-item-sub">
                                {item.count} шт. × {item.price?.toLocaleString()} $SWAG ({item.vendorCode})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Информация о пункте выдачи и коде получения */}
                      <div className="order-pickup-banner">
                        <div className="pickup-left">
                          <div className="pickup-point-title">🏢 Пункт выдачи SWAG POINT:</div>
                          <div className="pickup-point-addr">{order.pickupPoint}</div>
                          <div className="pickup-payment-type">Оплата: <strong>{order.paymentMethod || 'SWAG COINS'}</strong></div>
                        </div>
                        <div className="pickup-code-box">
                          <span className="code-label">КОД ПОЛУЧЕНИЯ:</span>
                          <span className="code-digits">{order.pickupCode}</span>
                          <span className="barcode-mock">||| | |||| | |||</span>
                        </div>
                      </div>

                      <div className="order-bottom-actions">
                        <div className="order-total-sum">
                          Сумма: <strong>{order.totalSwag?.toLocaleString()} $SWAG</strong>
                          <span className="order-uah-equiv"> (~ {(order.totalUah || (order.totalSwag * 67))?.toLocaleString()} ₴)</span>
                        </div>

                        <div className="order-btn-group">
                          {order.statusCode !== 'cancelled' && (
                            <button 
                              className="cancel-wb-order-btn"
                              onClick={() => {
                                db.cancelOrder(order.id);
                                showToast(`Заказ ${order.id} отменен! ${order.totalSwag.toLocaleString()} $SWAG возвращены на баланс.`);
                              }}
                            >
                              ✕ Отменить заказ (Вернуть $SWAG)
                            </button>
                          )}
                          <button 
                            className="repeat-wb-order-btn"
                            onClick={() => {
                              if (order.items && order.items.length > 0) {
                                order.items.forEach(it => {
                                  const prod = db.getProductById(it.id) || { id: it.id, title: it.title, price: it.price, image: it.image };
                                  handleAddToCart(prod);
                                });
                                setShowOrdersModal(false);
                                setShowCartModal(true);
                              }
                            }}
                          >
                            🔄 Повторить заказ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="orders-empty-state">
                  <span>📦</span>
                  <p>У вас пока нет оформленных заказов. Сделайте заказ за $SWAG на маркетплейсе!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MarketplaceBody;