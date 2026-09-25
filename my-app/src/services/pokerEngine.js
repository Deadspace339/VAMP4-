// ===================================================
// TEXAS HOLD'EM POKER ENGINE & BOT AI (SWAG CASINO)
// Полный движок покера: колода, комбинации, ИИ ботов, чат и эмодзи
// ===================================================

export const SUITS = [
  { symbol: '♠', name: 'spades', color: '#111827' },
  { symbol: '♥', name: 'hearts', color: '#dc2626' },
  { symbol: '♦', name: 'diamonds', color: '#dc2626' },
  { symbol: '♣', name: 'clubs', color: '#111827' }
];

export const VALUES = [
  { val: 2, label: '2' },
  { val: 3, label: '3' },
  { val: 4, label: '4' },
  { val: 5, label: '5' },
  { val: 6, label: '6' },
  { val: 7, label: '7' },
  { val: 8, label: '8' },
  { val: 9, label: '9' },
  { val: 10, label: '10' },
  { val: 11, label: 'J' },
  { val: 12, label: 'Q' },
  { val: 13, label: 'K' },
  { val: 14, label: 'A' }
];

export const BOT_PLAYERS_CONFIG = [
  {
    id: 1,
    name: 'Акула Покера 🦈',
    avatar: '🦈',
    personality: 'aggressive', // Агрессивный, любит давить рейзами
    chips: 15000,
    tag: 'PRO HIGH-ROLLER'
  },
  {
    id: 2,
    name: 'Виктор 67 🕶️',
    avatar: '🕶️',
    personality: 'solid', // Осторожный, коллирует хорошие карты
    chips: 18500,
    tag: 'CYBER VETERAN'
  },
  {
    id: 3,
    name: 'Харьковский Блеф 🃏',
    avatar: '🃏',
    personality: 'bluffer', // Непредсказуемый блефует и пушит
    chips: 12000,
    tag: 'RISK TAKER'
  }
];

export const BOT_CHATTER = {
  fold: [
    'Слишком дорого... Пас ✋',
    'Карты мусор, я пас 🗑️',
    'Не мой раунд, скидываю 😮‍💨',
    'Подожду карту получше ⏳',
    'Забирайте этот банк, я мимо 👋'
  ],
  check: [
    'Чек, смотрим бесплатно 👀',
    'Чекнем стол 🤝',
    'Пока тихо, чек 🛡️',
    'Жду следующий раунд 👁️'
  ],
  call: [
    'Коллирую, посмотрим карту! 🧐',
    'Уравниваю ставку, не уйду так просто 💰',
    'Колл! Играем дальше 🎯',
    'Интересный флоп, колл 🎲',
    'Принимаю вызов! ⚡'
  ],
  raise: [
    'Повышаю! Кто со мной?! 💰',
    'Пытаетесь блефовать? Рейз! 😈',
    'Тут пахнет натсом, повышаю! 👑',
    'Цена растет, господа! 📈',
    'Проверим ваши нервы! 💥'
  ],
  allin: [
    'ВА-БАНК! Погнали! 🔥',
    'ОЛЛ-ИН! Либо всё, либо ничего! 🚀',
    'Я иду до конца! ALL-IN! 💣',
    'Время вскрывать карты! ВА-БАНК! 👑'
  ],
  win: [
    'Чистый расчет и мастерство! 🥂',
    'Банк мой! Спасибо за игру 💰',
    'Вот это комбинация! 🏆',
    'Я же говорил, не стоит спорить! 😎'
  ],
  userReactionReplies: [
    'Ха-ха, хороший смайлик! Но банк всё равно заберу я 😎',
    'Не пытайся сбить меня с толку 😉',
    'Уверен в своей руке? Посмотрим на ривере! 🧐',
    'Меньше эмодзи, больше фишек на стол! 💰',
    'Киберпанк не прощает ошибок, друг ⚡'
  ]
};

// Генерация свежей перемешанной колоды из 52 карт
export function createPokerDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const val of VALUES) {
      deck.push({
        suit: suit.symbol,
        suitName: suit.name,
        color: suit.color,
        val: val.val,
        label: val.label,
        rank: val.label,
        name: val.label,
        id: `${suit.symbol}-${val.label}`
      });
    }
  }
  // Перемешивание Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Оценка сильнейшей 5-карточной комбинации из набора до 7 карт
export function evaluatePokerHand(cards) {
  if (!cards || cards.length === 0) {
    return { rank: 0, score: 0, name: 'Нет карт', desc: '' };
  }

  // Сортировка по убыванию номинала
  const sorted = [...cards].sort((a, b) => b.val - a.val);

  // Группировка по номиналам
  const countsByVal = {};
  for (const c of sorted) {
    countsByVal[c.val] = (countsByVal[c.val] || 0) + 1;
  }

  // Группировка по мастям
  const cardsBySuit = {};
  for (const c of sorted) {
    if (!cardsBySuit[c.suit]) cardsBySuit[c.suit] = [];
    cardsBySuit[c.suit].push(c);
  }

  // Проверка на Флеш
  let flushCards = null;
  for (const s in cardsBySuit) {
    if (cardsBySuit[s].length >= 5) {
      flushCards = cardsBySuit[s];
      break;
    }
  }

  // Проверка Стрита
  function findStraight(arr) {
    const uniqueVals = Array.from(new Set(arr.map(c => c.val))).sort((a, b) => b - a);
    // Добавляем туз в конец как 1, если есть Туз (14)
    if (uniqueVals.includes(14)) uniqueVals.push(1);

    for (let i = 0; i <= uniqueVals.length - 5; i++) {
      let isStr = true;
      for (let k = 0; k < 4; k++) {
        if (uniqueVals[i + k] - uniqueVals[i + k + 1] !== 1) {
          isStr = false;
          break;
        }
      }
      if (isStr) {
        return uniqueVals[i]; // Старшая карта стрита
      }
    }
    return null;
  }

  // 1. Стрит-Флеш и Роял-Флеш
  if (flushCards) {
    const straightFlushHigh = findStraight(flushCards);
    if (straightFlushHigh) {
      if (straightFlushHigh === 14) {
        return {
          rank: 10,
          score: 10000000,
          name: '👑 РОЯЛ-ФЛЕШ (ROYAL FLUSH)',
          desc: 'Туз, Король, Дама, Валет, Десятка одной масти'
        };
      }
      return {
        rank: 9,
        score: 9000000 + straightFlushHigh,
        name: `⚡ СТРИТ-ФЛЕШ (до ${getLabel(straightFlushHigh)})`,
        desc: `Пять одномастных карт подряд до ${getLabel(straightFlushHigh)}`
      };
    }
  }

  // 2. Каре (Four of a kind)
  const fourVal = Object.keys(countsByVal).find(v => countsByVal[v] === 4);
  if (fourVal) {
    const kicker = sorted.find(c => c.val !== Number(fourVal))?.val || 0;
    return {
      rank: 8,
      score: 8000000 + Number(fourVal) * 100 + kicker,
      name: `💥 КАРЕ (Четыре ${getLabel(Number(fourVal))})`,
      desc: `Четыре карты номинала ${getLabel(Number(fourVal))}`
    };
  }

  // 3. Фулл-Хаус (Full House)
  const threeVal = Object.keys(countsByVal).filter(v => countsByVal[v] >= 3).sort((a, b) => Number(b) - Number(a));
  if (threeVal.length > 0) {
    const primaryThree = Number(threeVal[0]);
    // Ищем пару среди остальных
    const pairVal = Object.keys(countsByVal)
      .filter(v => Number(v) !== primaryThree && countsByVal[v] >= 2)
      .sort((a, b) => Number(b) - Number(a))[0] || (threeVal.length > 1 ? Number(threeVal[1]) : null);

    if (pairVal) {
      return {
        rank: 7,
        score: 7000000 + primaryThree * 100 + pairVal,
        name: `🏰 ФУЛЛ-ХАУС (${getLabel(primaryThree)} и ${getLabel(pairVal)})`,
        desc: `Три ${getLabel(primaryThree)} и две ${getLabel(pairVal)}`
      };
    }
  }

  // 4. Флеш (Flush)
  if (flushCards) {
    const top5 = flushCards.slice(0, 5);
    const scoreVal = top5.reduce((acc, c, idx) => acc + c.val * Math.pow(15, 4 - idx), 0);
    return {
      rank: 6,
      score: 6000000 + scoreVal,
      name: `🌊 ФЛЕШ (${top5[0].suit} Старший ${getLabel(top5[0].val)})`,
      desc: `Пять карт масти ${top5[0].suit}`
    };
  }

  // 5. Стрит (Straight)
  const straightHigh = findStraight(sorted);
  if (straightHigh) {
    return {
      rank: 5,
      score: 5000000 + straightHigh,
      name: `🏹 СТРИТ (до ${getLabel(straightHigh)})`,
      desc: `Пять последовательных карт до ${getLabel(straightHigh)}`
    };
  }

  // 6. Тройка / Сет (Three of a Kind)
  if (threeVal.length > 0) {
    const val = Number(threeVal[0]);
    return {
      rank: 4,
      score: 4000000 + val * 100,
      name: `☘️ СЕТ / ТРОЙКА (${getLabel(val)})`,
      desc: `Три карты номинала ${getLabel(val)}`
    };
  }

  // 7. Две пары (Two Pair)
  const pairs = Object.keys(countsByVal).filter(v => countsByVal[v] >= 2).sort((a, b) => Number(b) - Number(a));
  if (pairs.length >= 2) {
    const p1 = Number(pairs[0]);
    const p2 = Number(pairs[1]);
    const kicker = sorted.find(c => c.val !== p1 && c.val !== p2)?.val || 0;
    return {
      rank: 3,
      score: 3000000 + p1 * 1000 + p2 * 50 + kicker,
      name: `✌️ ДВЕ ПАРЫ (${getLabel(p1)} и ${getLabel(p2)})`,
      desc: `Пара ${getLabel(p1)} и пара ${getLabel(p2)}`
    };
  }

  // 8. Одна пара (One Pair)
  if (pairs.length === 1) {
    const p = Number(pairs[0]);
    return {
      rank: 2,
      score: 2000000 + p * 100,
      name: `🔹 ПАРА (${getLabel(p)})`,
      desc: `Пара ${getLabel(p)}`
    };
  }

  // 9. Старшая карта (High Card)
  const highVal = sorted[0]?.val || 2;
  return {
    rank: 1,
    score: 1000000 + highVal,
    name: `🔸 СТАРШАЯ КАРТА (${getLabel(highVal)})`,
    desc: `Старшая карта ${getLabel(highVal)}`
  };
}

function getLabel(val) {
  if (val === 14) return 'Туз';
  if (val === 13) return 'Король';
  if (val === 12) return 'Дама';
  if (val === 11) return 'Валет';
  return String(val);
}

// Принятие решения ботом на основе силы руки, стадии игры и личности
export function decideBotAction(bot, communityCards, currentTableBet, playerBet, pot, minRaise) {
  const allCards = [...bot.holeCards, ...communityCards];
  const evalResult = evaluatePokerHand(allCards);
  const toCall = Math.max(0, currentTableBet - playerBet);

  // Случайный фактор блефа
  const bluffFactor = Math.random();

  // Если ставить не нужно (toCall === 0)
  if (toCall === 0) {
    if (evalResult.rank >= 4 || (bot.personality === 'aggressive' && bluffFactor < 0.45) || (bot.personality === 'bluffer' && bluffFactor < 0.6)) {
      const raiseAmt = Math.min(bot.chips, Math.max(minRaise, Math.round(pot * 0.5)));
      return {
        type: raiseAmt >= bot.chips ? 'ALL_IN' : 'RAISE',
        amount: raiseAmt,
        text: getRandomChat(raiseAmt >= bot.chips ? 'allin' : 'raise'),
        emoji: raiseAmt >= bot.chips ? '🔥' : '😈'
      };
    }
    return {
      type: 'CHECK',
      amount: 0,
      text: getRandomChat('check'),
      emoji: '👀'
    };
  }

  // Если нужно уравнивать ставку (toCall > 0)
  // При сильной руке (Сет, Стрит, Флеш, Фулл-Хаус и выше)
  if (evalResult.rank >= 4) {
    if (evalResult.rank >= 6 || (bot.personality === 'aggressive' && bluffFactor < 0.5)) {
      const raiseAmt = Math.min(bot.chips, toCall + Math.max(minRaise, Math.round(pot * 0.6)));
      return {
        type: raiseAmt >= bot.chips ? 'ALL_IN' : 'RAISE',
        amount: raiseAmt,
        text: getRandomChat(raiseAmt >= bot.chips ? 'allin' : 'raise'),
        emoji: '🔥'
      };
    }
    return {
      type: 'CALL',
      amount: Math.min(bot.chips, toCall),
      text: getRandomChat('call'),
      emoji: '🧐'
    };
  }

  // Средняя рука (Пара, Две пары)
  if (evalResult.rank >= 2) {
    if (toCall <= bot.chips * 0.35 || bot.personality === 'solid') {
      return {
        type: 'CALL',
        amount: Math.min(bot.chips, toCall),
        text: getRandomChat('call'),
        emoji: '🤝'
      };
    }
  }

  // Блеф для Харьковский Блеф
  if (bot.personality === 'bluffer' && bluffFactor < 0.35 && toCall <= bot.chips * 0.5) {
    const raiseAmt = Math.min(bot.chips, toCall + minRaise);
    return {
      type: raiseAmt >= bot.chips ? 'ALL_IN' : 'RAISE',
      amount: raiseAmt,
      text: 'Думал я скину? Не угадал! 🃏',
      emoji: '😈'
    };
  }

  // Если ставка слишком высока для слабой руки — сброс (Fold)
  if (toCall > bot.chips * 0.25 && evalResult.rank <= 1) {
    return {
      type: 'FOLD',
      amount: 0,
      text: getRandomChat('fold'),
      emoji: '😮‍💨'
    };
  }

  // Иначе просто коллируем небольшую ставку
  return {
    type: 'CALL',
    amount: Math.min(bot.chips, toCall),
    text: getRandomChat('call'),
    emoji: '👀'
  };
}

function getRandomChat(type) {
  const list = BOT_CHATTER[type] || BOT_CHATTER.check;
  return list[Math.floor(Math.random() * list.length)];
}
