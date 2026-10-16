// ===================================================
// SWAG INC. — CYBER IMAGE FALLBACK SYSTEM
// Все изображения гарантированно работают оффлайн и онлайн
// Векторные SVG в неоновом киберпанк-стиле с градиентами
// ===================================================

import macanImg from '../assets/macan-brat.jpg';
import crownImg from '../assets/plashka.png';
import shieldImg from '../assets/plashka2.png';
import radioImg from '../assets/plashka3.png';

export { macanImg, crownImg, shieldImg, radioImg };

// Универсальный резолвер аватарок: преобразует любые строковые ключи ('shield', 'macan', 'crown', 'radio') в валидные картинки
export function resolveAvatar(avatar, name = '') {
  if (!avatar) return macanImg;

  if (typeof avatar !== 'string') return avatar;

  const a = avatar.toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();

  if (a === 'shield' || a === 'shieldimg' || a === 'jarvis' || a.includes('plashka2') || n.includes('jarvis') || n.includes('shield') || n.includes('e2ee')) return shieldImg;
  if (a === 'crown' || a === 'crownimg' || a === 'admin' || a === 'official' || a === 'swag-channel' || a.includes('swag') || a.includes('plashka.png') || a.includes('plashka.jpg') || n.includes('official') || n.includes('admin') || n.includes('swag inc.')) return crownImg;
  if (a === 'radio' || a === 'radioimg' || a === 'market' || a === 'dark-market' || a.includes('plashka3') || n.includes('deals') || n.includes('auction') || n.includes('dark') || n.includes('cyberbroker')) return radioImg;
  if (a === 'macan' || a === 'macanimg' || a === 'default' || a.includes('macan-brat') || n.includes('macan')) return macanImg;

  // Если это уже валидный URL изображения (data URI, blob, http, https, /assets/)
  if (
    a.startsWith('data:image/') ||
    a.startsWith('blob:') ||
    a.startsWith('http://') ||
    a.startsWith('https://') ||
    a.startsWith('/assets/') ||
    a.startsWith('/src/assets/')
  ) {
    return avatar;
  }

  return macanImg;
}

// Утилита кодирования SVG в Data URI
export function makeSvgDataUri(svgString) {
  const clean = svgString.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

// Генератор неоновых кибер-постеров
export function createCyberPosterSvg({ title = 'SWAG VAMP 4', subtitle = 'EXCLUSIVE', icon = '⚡', color1 = '#ff5500', color2 = '#7900ff', tag = 'VAMP 67' }) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#140a1c"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${color2}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="cyberGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Фон -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#cyberGrid)"/>
  <circle cx="400" cy="450" r="320" fill="url(#glowGrad)"/>

  <!-- Кибер-рамка -->
  <rect x="25" y="25" width="750" height="950" rx="16" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.6"/>
  <rect x="35" y="35" width="730" height="930" rx="12" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Угловые хай-тек элементы -->
  <path d="M 25 70 L 25 25 L 70 25" fill="none" stroke="${color1}" stroke-width="4"/>
  <path d="M 775 70 L 775 25 L 730 25" fill="none" stroke="${color1}" stroke-width="4"/>
  <path d="M 25 930 L 25 975 L 70 975" fill="none" stroke="${color2}" stroke-width="4"/>
  <path d="M 775 930 L 775 975 L 730 975" fill="none" stroke="${color2}" stroke-width="4"/>

  <!-- Верхний тег -->
  <rect x="50" y="60" width="180" height="34" rx="17" fill="rgba(0,0,0,0.7)" stroke="${color1}" stroke-width="1.5"/>
  <text x="140" y="82" fill="${color1}" font-family="monospace" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">
    ${tag}
  </text>

  <!-- Иконка по центру -->
  <circle cx="400" cy="420" r="140" fill="rgba(0,0,0,0.6)" stroke="url(#accentGrad)" stroke-width="3" filter="url(#neonGlow)"/>
  <text x="400" y="470" font-size="120" text-anchor="middle" filter="url(#neonGlow)">
    ${icon}
  </text>

  <!-- Декоративные волны / линии -->
  <path d="M 100 620 Q 250 590 400 620 T 700 620" fill="none" stroke="${color1}" stroke-width="2" opacity="0.4"/>
  <path d="M 150 640 Q 250 620 400 640 T 650 640" fill="none" stroke="${color2}" stroke-width="1.5" opacity="0.4"/>

  <!-- Заголовок -->
  <text x="400" y="740" fill="#ffffff" font-family="'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" text-anchor="middle" letter-spacing="1">
    ${title.slice(0, 32)}
  </text>
  <text x="400" y="790" fill="rgba(255,255,255,0.7)" font-family="monospace" font-size="20" font-weight="600" text-anchor="middle" letter-spacing="2">
    ${subtitle.slice(0, 40)}
  </text>

  <!-- Нижний брендинг -->
  <text x="400" y="920" fill="${color1}" font-family="monospace" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="4">
    SWAG INC. // VAMP 4 OFFICIAL
  </text>
</svg>
`;
  return makeSvgDataUri(svg);
}

// Генератор аватарок
export function createCyberAvatarSvg(name = 'USER', color = '#ff5500') {
  const initial = (name.replace('@', '').trim()[0] || 'S').toUpperCase();
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="avGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111116"/>
      <stop offset="100%" stop-color="#220033"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="100" fill="url(#avGrad)"/>
  <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="4"/>
  <text x="100" y="125" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="70" font-weight="900" text-anchor="middle">
    ${initial}
  </text>
</svg>
`;
  return makeSvgDataUri(svg);
}

// Пресеты для эдитов барабана (все 9 эдитов!)
export const CYBER_EDIT_POSTERS = {
  'edit-ronaldo-2008': createCyberPosterSvg({
    title: 'CRISTIANO RONALDO',
    subtitle: '2008 PRIME UNITED GOAT',
    icon: '🐐',
    color1: '#ffd700',
    color2: '#ff0033',
    tag: 'RONALDO 2008'
  }),
  'edit-arsenal-2008': createCyberPosterSvg({
    title: 'ARSENAL 2008 PRIME',
    subtitle: 'WENGERBALL TIKI-TAKA',
    icon: '🔴',
    color1: '#ff2244',
    color2: '#ffffff',
    tag: 'GUNNERS 2008'
  }),
  'edit-balenciaga-mud': createCyberPosterSvg({
    title: 'BALENCIAGA MUD SHOW',
    subtitle: 'DEMNA PRIME RUNWAY',
    icon: '🕶️',
    color1: '#aaaaaa',
    color2: '#444444',
    tag: 'BALENCIAGA'
  }),
  'edit-soundcloud-vamp': createCyberPosterSvg({
    title: 'SOUNDCLOUD TYPE SHIT',
    subtitle: '2026 PLUGGNB DRIFT',
    icon: '☁️',
    color1: '#ff5500',
    color2: '#cc00ff',
    tag: 'SOUNDCLOUD'
  }),
  'edit-macan-gt3rs': createCyberPosterSvg({
    title: 'MACAN // PORSCHE GT3 RS',
    subtitle: 'NIGHT RUN FLAT-6',
    icon: '🏎️',
    color1: '#00ff88',
    color2: '#0088ff',
    tag: 'SUPERCAR'
  }),
  'edit-ronaldo-freekick': createCyberPosterSvg({
    title: 'KNUCKLEBALL 2008',
    subtitle: 'CR7 VS PORTSMOUTH',
    icon: '⚡',
    color1: '#ffd700',
    color2: '#ff3300',
    tag: 'BALLON D\'OR'
  }),
  'edit-arsenal-henry': createCyberPosterSvg({
    title: 'THIERRY HENRY 14',
    subtitle: 'KING OF HIGHBURY',
    icon: '👑',
    color1: '#ff3355',
    color2: '#ffd700',
    tag: 'LEGEND'
  }),
  'edit-carti-vamp': createCyberPosterSvg({
    title: 'PLAYBOI CARTI // VAMP 4',
    subtitle: 'RAGE 808 ANTHEM',
    icon: '🦇',
    color1: '#9900ff',
    color2: '#ff0055',
    tag: 'VAMP 4'
  }),
  'edit-porsche-turbo': createCyberPosterSvg({
    title: '911 TURBO S MIDNIGHT',
    subtitle: 'MOSCOW DRIFT RUN',
    icon: '🏁',
    color1: '#00e5ff',
    color2: '#0055ff',
    tag: 'DRIFT'
  })
};

// Пресеты для товаров маркетплейса
export const CYBER_PRODUCT_POSTERS = {
  'prod-1': createCyberPosterSvg({
    title: 'VAMP 4 ATREIYA HOODIE',
    subtitle: 'DARK EDITION 480G/M²',
    icon: '👕',
    color1: '#ff5500',
    color2: '#ff0033',
    tag: 'TOP SELLER'
  }),
  'prod-2': createCyberPosterSvg({
    title: 'MACAN RUNNER 2026',
    subtitle: 'CARBON SOLE AIR',
    icon: '👟',
    color1: '#00e5ff',
    color2: '#0055ff',
    tag: 'FOOTWEAR'
  }),
  'prod-3': createCyberPosterSvg({
    title: 'LETNIK BOOMBOX 1000W',
    subtitle: 'DEEP BASS SUBWOOFER',
    icon: '🔊',
    color1: '#ffd700',
    color2: '#ff6600',
    tag: 'AUDIO 1000W'
  }),
  'prod-4': createCyberPosterSvg({
    title: 'SWAG GOD 777 PENDANT',
    subtitle: 'VVS1 CUBAN LINK 24K',
    icon: '👑',
    color1: '#ffd700',
    color2: '#ffffff',
    tag: 'VIP GOLD'
  }),
  'prod-5': createCyberPosterSvg({
    title: 'MATRIX VAMP 2026 HUD',
    subtitle: 'POLARIZED UV400',
    icon: '🕶️',
    color1: '#00ff88',
    color2: '#00e5ff',
    tag: 'OPTICS'
  }),
  'prod-6': createCyberPosterSvg({
    title: 'PORSCHE STUDIO ATREIYA',
    subtitle: 'NAPPA LEATHER BOMBER',
    icon: '🧥',
    color1: '#ff8800',
    color2: '#8800ff',
    tag: 'LEATHER'
  }),
  'prod-7': createCyberPosterSvg({
    title: 'SWAG OVERCHARGE 67',
    subtitle: '24X ENERGY DRINK PACK',
    icon: '⚡',
    color1: '#ff0055',
    color2: '#ffff00',
    tag: 'BOOST'
  }),
  'prod-8': createCyberPosterSvg({
    title: 'NEON MATRIX TKL 67',
    subtitle: 'GASKET MOUNT GATERON',
    icon: '⌨️',
    color1: '#aa00ff',
    color2: '#00e5ff',
    tag: 'KEYBOARD'
  })
};

// Функция надежного фоллбека для изображений
export function handleImageError(e, type = 'edit', title = 'SWAG VAMP 4') {
  const target = e.currentTarget || e.target;
  if (!target) return;
  target.onerror = null; // Предотвратить зацикливание

  // Проверяем наличие пресета по типу или заголовку
  if (type === 'edit') {
    const matchedKey = Object.keys(CYBER_EDIT_POSTERS).find(k => title.toLowerCase().includes(k.replace('edit-', '').replace('-', ' ')));
    if (matchedKey) {
      target.src = CYBER_EDIT_POSTERS[matchedKey];
      return;
    }
    target.src = createCyberPosterSvg({
      title: title || 'SWAG EDIT',
      subtitle: 'TIBETAN PRAYER WHEEL',
      icon: '🕉️',
      color1: '#ffd700',
      color2: '#ff5500',
      tag: 'EDIT'
    });
    return;
  }

  if (type === 'product') {
    const matchedKey = Object.keys(CYBER_PRODUCT_POSTERS).find(k => title.toLowerCase().includes(k));
    if (matchedKey) {
      target.src = CYBER_PRODUCT_POSTERS[matchedKey];
      return;
    }
    target.src = createCyberPosterSvg({
      title: title || 'SWAG PRODUCT',
      subtitle: 'SWAG INC. WB STORE',
      icon: '📦',
      color1: '#ff5500',
      color2: '#00e5ff',
      tag: 'WB 67'
    });
    return;
  }

  if (type === 'avatar') {
    const n = (title || '').toLowerCase();
    if (n.includes('jarvis') || n.includes('shield')) {
      target.src = shieldImg;
      return;
    }
    if (n.includes('official') || n.includes('admin') || n.includes('swag inc.')) {
      target.src = crownImg;
      return;
    }
    if (n.includes('deals') || n.includes('auction') || n.includes('dark') || n.includes('radio')) {
      target.src = radioImg;
      return;
    }
    target.src = macanImg;
    return;
  }

  // Общий фоллбек
  target.src = createCyberPosterSvg({
    title: title || 'SWAG INC.',
    subtitle: 'VAMP 4 PROTOCOL',
    icon: '💀',
    color1: '#ff5500',
    color2: '#7900ff',
    tag: 'SWAG'
  });
}
