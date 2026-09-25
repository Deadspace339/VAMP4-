import { useState, useRef, useEffect } from 'react';
import { db } from '../services/db';
import { soundService } from '../services/soundService';
import { createPokerDeck, evaluatePokerHand, decideBotAction, BOT_PLAYERS_CONFIG, BOT_CHATTER } from '../services/pokerEngine';
import litvinPoster from '../assets/litvin_poster.jpg';
import mrbeastPoster from '../assets/mrbeast_poster.jpg';
import ogreMagiImg from '../assets/ogre_magi.jpg';
import pozdnyakovImg from '../assets/pozdnyakov.png';
import GatesOfSwagus from '../components/casino/GatesOfSwagus';

const SLOT_SYMBOLS = ['👑', '7️⃣', '💎', '⚡', '🤖', '🔥', '💀', '🍒'];

const SYMBOL_PAYOUTS = {
  '👑': 50, // 50x
  '7️⃣': 35, // 35x
  '💎': 20, // 20x
  '⚡': 15, // 15x
  '🤖': 12, // 12x
  '🔥': 10, // 10x
  '💀': 8,  // 8x
  '🍒': 5   // 5x
};

// Сектора колеса фортуны (8 секторов ровно по 45 градусов)
const WHEEL_SECTORS = [
  { id: 0, label: '0 SWAG', value: 0, icon: '💀', color: '#161616', text: '#777777', weight: 35 },
  { id: 1, label: '+50', value: 50, icon: '⚡', color: '#2a1600', text: '#ffaa00', weight: 4 },
  { id: 2, label: '0 SWAG', value: 0, icon: '💀', color: '#111111', text: '#777777', weight: 30 },
  { id: 3, label: '+200', value: 200, icon: '🔥', color: '#3d1400', text: '#ff5500', weight: 1.5 },
  { id: 4, label: '0 SWAG', value: 0, icon: '💀', color: '#161616', text: '#777777', weight: 26 },
  { id: 5, label: '+500', value: 500, icon: '💎', color: '#002538', text: '#00e5ff', weight: 0.8 },
  { id: 6, label: '0 SWAG', value: 0, icon: '💀', color: '#111111', text: '#777777', weight: 2.5 },
  { id: 7, label: '+1000', value: 1000, icon: '👑', color: '#3d2500', text: '#ffd700', weight: 0.2 }
];

// Карточные масти и достоинства для игры в «Дурак»
const DURAK_SUITS = [
  { symbol: '♠', name: 'spades', color: '#ffffff', isRed: false },
  { symbol: '♣', name: 'clubs', color: '#00e5ff', isRed: false },
  { symbol: '♥', name: 'hearts', color: '#ff2a5f', isRed: true },
  { symbol: '♦', name: 'diamonds', color: '#ffaa00', isRed: true }
];

const DURAK_RANKS = [
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 }
];

const POKER_MULTIPLAYER_TABLES = [
  {
    id: 'table_cr7_prime',
    name: '🏆 PRIME 2008 ALL-STARS',
    description: 'Легендарный стол 2008 года: Роналдо, Арсенал и Макан',
    stakes: '50 / 100 SWAG',
    players: [
      { id: 1, name: 'CR7 2008 Prime ⚡', avatar: '🐐', personality: 'aggressive', chips: 50000, tag: 'PRIME GOAT' },
      { id: 2, name: 'Arsenal 2008 🔴', avatar: '🏆', personality: 'solid', chips: 35000, tag: 'WENGERBALL' },
      { id: 3, name: 'MACAN (Брат) 🏎️', avatar: '👑', personality: 'bluffer', chips: 40000, tag: 'DRIFT KING' }
    ]
  },
  {
    id: 'table_balenciaga_vamp',
    name: '🖤 BALENCIAGA & SOUNDCLOUD VAMP',
    description: 'High-fashion подиум и андерграундный 808 саундклауд рейдж',
    stakes: '100 / 200 SWAG',
    players: [
      { id: 1, name: 'Demna Balenciaga 🕶️', avatar: '🖤', personality: 'bluffer', chips: 67000, tag: '3XL DEFENDER' },
      { id: 2, name: 'SoundCloud Vampire ☁️', avatar: '☁️', personality: 'aggressive', chips: 28000, tag: 'PLUGGNB 808' },
      { id: 3, name: 'Виктор 67 🕶️', avatar: '🕶️', personality: 'solid', chips: 30000, tag: 'CYBER VETERAN' }
    ]
  },
  {
    id: 'table_clash_kings',
    name: '👑 CLASH ROYALE & CASINO KINGS',
    description: 'Король Клеш Рояля, Карточный Барон и ИИ Дилер',
    stakes: '250 / 500 SWAG',
    players: [
      { id: 1, name: 'Clash Royale King 👑', avatar: '👑', personality: 'aggressive', chips: 90000, tag: 'HE-HE-HE-HA' },
      { id: 2, name: 'Виктор Карточный Барон 🃏', avatar: '🃏', personality: 'solid', chips: 88888, tag: '100% WINRATE' },
      { id: 3, name: 'J.A.R.V.I.S. AI Dealer 🤖', avatar: '🤖', personality: 'bluffer', chips: 100000, tag: 'GEMINI 2.5' }
    ]
  }
];

const INITIAL_PVP_PLAYERS = [
  { id: 1, name: 'MACAN (Брат)', handle: '@macan_brat', defaultBet: 100, wins: 48, avatar: '/src/assets/macan-brat.jpg', status: 'ONLINE' },
  { id: 2, name: 'Cristiano Ronaldo 2008', handle: '@cr7_prime2008', defaultBet: 500, wins: 777, avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80', status: 'BALLON D\'OR 2008' },
  { id: 3, name: 'Arsenal 2008 Prime', handle: '@arsenal_prime', defaultBet: 300, wins: 208, avatar: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80', status: 'WENGERBALL' },
  { id: 4, name: 'Demna Balenciaga', handle: '@demna_mud', defaultBet: 670, wins: 333, avatar: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80', status: '3XL MUD SHOW' },
  { id: 5, name: 'SoundCloud Vampire', handle: '@soundcloud_pluggnb', defaultBet: 420, wins: 180, avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', status: '808 BASS GOD' },
  { id: 6, name: 'Clash Royale King', handle: '@clash_king_67', defaultBet: 1000, wins: 999, avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80', status: 'HE-HE-HE-HA!' },
  { id: 7, name: 'Виктор Карточный Барон', handle: '@durak_pro_2008', defaultBet: 1500, wins: 1337, avatar: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80', status: 'ДУРАК MASTER' },
  { id: 8, name: 'CyberBroker_67', handle: '@broker_dark', defaultBet: 250, wins: 22, avatar: '/src/assets/plashka3.png', status: 'READY' },
  { id: 9, name: 'NeonSamurai', handle: '@katana_swag', defaultBet: 500, wins: 89, avatar: '/src/assets/plashka.png', status: 'HIGH_ROLLER' },
  { id: 10, name: 'J.A.R.V.I.S. AI Dealer', handle: '@jarvis_dealer', defaultBet: 1000, wins: 154, avatar: '/src/assets/plashka2.png', status: 'BOT_BOSS' }
];

// Генерация и перемешивание колоды из 36 карт (Фишер — Йетс)
const generateShuffledDeck = () => {
  const deck = [];
  let id = 1;
  for (const suit of DURAK_SUITS) {
    for (const rank of DURAK_RANKS) {
      deck.push({
        id: id++,
        suit: suit.symbol,
        suitName: suit.name,
        color: suit.color,
        isRed: suit.isRed,
        rank: rank.rank,
        value: rank.value
      });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const Web4Page = ({ balance, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState('slots'); // 'slots', 'pvp', 'blackjack', 'wheel', 'founder'
  const user = db.getUser();
  const isFounder = user?.role === 'FOUNDER' || user?.rank === 'SWAG GOD' || user?.handle === '@macansssssssssss1337';

  // --------------------------------------------------
  // 1. СЛОТЫ 777 (ШАНС ВЫИГРЫША 2-3%)
  // --------------------------------------------------
  const [slotBet, setSlotBet] = useState(50);
  const [reels, setReels] = useState(['7️⃣', '👑', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotWinAmount, setSlotWinAmount] = useState(null);
  const [jackpotPool, setJackpotPool] = useState(284755);
  const [isLeverPulled, setIsLeverPulled] = useState(false);

  // --------------------------------------------------
  // ТЕХАССКИЙ ПОКЕР (TEXAS HOLD'EM) СО СМАЙЛИКАМИ И ЧАТОМ
  // --------------------------------------------------
  const [selectedPokerTable, setSelectedPokerTable] = useState(POKER_MULTIPLAYER_TABLES[0]);
  const [pokerGame, setPokerGame] = useState(null);
  const [pokerRaiseAmount, setPokerRaiseAmount] = useState(200);
  const [pokerReactions, setPokerReactions] = useState({
    0: { text: null, emoji: null },
    1: { text: null, emoji: null },
    2: { text: null, emoji: null },
    3: { text: null, emoji: null }
  });
  const [customPokerMessage, setCustomPokerMessage] = useState('');
  const pokerTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pokerTimerRef.current) clearTimeout(pokerTimerRef.current);
    };
  }, []);

  const triggerPlayerReaction = (playerIdx, text, emoji) => {
    setPokerReactions(prev => ({
      ...prev,
      [playerIdx]: { text, emoji }
    }));
    setTimeout(() => {
      setPokerReactions(prev => ({
        ...prev,
        [playerIdx]: { text: null, emoji: null }
      }));
    }, 3500);
  };

  const sendUserEmoji = (emoji) => {
    triggerPlayerReaction(0, null, emoji);
    soundService.playClick && soundService.playClick();
    if (Math.random() < 0.45 && pokerGame && pokerGame.stage !== 'idle') {
      setTimeout(() => {
        const randomBot = 1 + Math.floor(Math.random() * 3);
        const reply = BOT_CHATTER.userReactionReplies[Math.floor(Math.random() * BOT_CHATTER.userReactionReplies.length)];
        triggerPlayerReaction(randomBot, reply, '😎');
      }, 900);
    }
  };

  const sendUserMessage = (text) => {
    if (!text || !text.trim()) return;
    triggerPlayerReaction(0, text.trim(), null);
    setCustomPokerMessage('');
    soundService.playClick && soundService.playClick();
    if (Math.random() < 0.5 && pokerGame && pokerGame.stage !== 'idle') {
      setTimeout(() => {
        const randomBot = 1 + Math.floor(Math.random() * 3);
        const reply = BOT_CHATTER.userReactionReplies[Math.floor(Math.random() * BOT_CHATTER.userReactionReplies.length)];
        triggerPlayerReaction(randomBot, reply, '👀');
      }, 1100);
    }
  };

  // Старт новой раздачи в покер
  const startPokerHand = (dealerIdx = 0) => {
    const minBuyIn = 100;
    if (balance < minBuyIn) {
      alert(`Недостаточно SWAG для бай-ина! Нужно минимум ${minBuyIn} SWAG.`);
      return;
    }

    const deck = createPokerDeck();
    const sb = 50;
    const bb = 100;

    const opponentConfigs = selectedPokerTable.players;
    const players = [
      {
        id: 0,
        name: user.handle || '@swag_king',
        avatar: '👑',
        isUser: true,
        chips: Math.max(balance, 1000),
        holeCards: [deck.pop(), deck.pop()],
        currentBet: 0,
        folded: false,
        isAllIn: false
      },
      ...opponentConfigs.map((botCfg) => ({
        id: botCfg.id,
        name: botCfg.name,
        avatar: botCfg.avatar,
        personality: botCfg.personality,
        isUser: false,
        chips: botCfg.chips,
        holeCards: [deck.pop(), deck.pop()],
        currentBet: 0,
        folded: false,
        isAllIn: false
      }))
    ];

    const sbIndex = (dealerIdx + 1) % 4;
    const bbIndex = (dealerIdx + 2) % 4;

    players[sbIndex].chips -= sb;
    players[sbIndex].currentBet = sb;
    if (players[sbIndex].isUser) onUpdateBalance(-sb);

    players[bbIndex].chips -= bb;
    players[bbIndex].currentBet = bb;
    if (players[bbIndex].isUser) onUpdateBalance(-bb);

    const firstToAct = (dealerIdx + 3) % 4;

    const initialTable = {
      deck,
      communityCards: [],
      pot: sb + bb,
      currentBet: bb,
      minRaise: bb,
      dealerIndex: dealerIdx,
      activePlayer: firstToAct,
      stage: 'preflop',
      players,
      lastAction: 'Раздача карт. Блайнды поставлены.',
      winnerInfo: null,
      handResolved: false
    };

    setPokerGame(initialTable);
    setPokerRaiseAmount(bb * 2);

    if (!players[firstToAct].isUser) {
      scheduleBotTurn(initialTable, firstToAct);
    }
  };

  const scheduleBotTurn = (tableState, botIdx) => {
    if (pokerTimerRef.current) clearTimeout(pokerTimerRef.current);
    pokerTimerRef.current = setTimeout(() => {
      processBotTurn(tableState, botIdx);
    }, 900 + Math.random() * 400);
  };

  const processBotTurn = (tableState, botIdx) => {
    const current = { ...tableState };
    const bot = current.players[botIdx];
    if (!bot || bot.folded || bot.isAllIn) {
      advanceTurn(current, botIdx);
      return;
    }

    const decision = decideBotAction(
      bot,
      current.communityCards,
      current.currentBet,
      bot.currentBet,
      current.pot,
      current.minRaise
    );

    if (decision.text || decision.emoji) {
      triggerPlayerReaction(botIdx, decision.text, decision.emoji);
    }

    applyAction(current, botIdx, decision.type, decision.amount);
  };

  const applyAction = (table, playerIdx, actionType, amount = 0) => {
    const player = table.players[playerIdx];

    if (actionType === 'FOLD') {
      player.folded = true;
      table.lastAction = `${player.name} сбросил карты (Fold).`;
    } else if (actionType === 'CHECK') {
      table.lastAction = `${player.name} объявил Чек.`;
    } else if (actionType === 'CALL') {
      const needed = Math.min(player.chips, table.currentBet - player.currentBet);
      player.chips -= needed;
      player.currentBet += needed;
      table.pot += needed;
      if (player.isUser) onUpdateBalance(-needed);
      if (player.chips === 0) player.isAllIn = true;
      table.lastAction = `${player.name} уравнял ${needed} SWAG (Call).`;
    } else if (actionType === 'RAISE') {
      const raiseTotal = Math.min(player.chips + player.currentBet, amount);
      const toAdd = raiseTotal - player.currentBet;
      player.chips -= toAdd;
      player.currentBet = raiseTotal;
      table.pot += toAdd;
      if (player.isUser) onUpdateBalance(-toAdd);
      if (player.chips === 0) player.isAllIn = true;
      table.currentBet = raiseTotal;
      table.minRaise = Math.max(table.minRaise, raiseTotal * 0.5);
      table.lastAction = `${player.name} повысил до ${raiseTotal} SWAG (Raise)!`;
    } else if (actionType === 'ALL_IN') {
      const allInAmt = player.chips;
      player.chips = 0;
      player.currentBet += allInAmt;
      table.pot += allInAmt;
      player.isAllIn = true;
      if (player.isUser) onUpdateBalance(-allInAmt);
      if (player.currentBet > table.currentBet) {
        table.currentBet = player.currentBet;
      }
      table.lastAction = `🔥 ${player.name} пошел ВА-БАНК (${allInAmt} SWAG)!`;
    }

    const activeNonFolded = table.players.filter(p => !p.folded);
    if (activeNonFolded.length === 1) {
      concludeHandByFold(table, activeNonFolded[0]);
      return;
    }

    advanceTurn(table, playerIdx);
  };

  const advanceTurn = (table, currentIdx) => {
    const activeContenders = table.players.filter(p => !p.folded && !p.isAllIn);
    const allBetsEqual = activeContenders.every(p => p.currentBet === table.currentBet);

    if (activeContenders.length <= 1 && allBetsEqual) {
      advanceStage(table);
      return;
    }

    let nextIdx = (currentIdx + 1) % 4;
    let found = false;
    for (let i = 0; i < 4; i++) {
      const p = table.players[nextIdx];
      if (!p.folded && !p.isAllIn) {
        found = true;
        break;
      }
      nextIdx = (nextIdx + 1) % 4;
    }

    if (!found || allBetsEqual) {
      advanceStage(table);
    } else {
      table.activePlayer = nextIdx;
      setPokerGame({ ...table });
      if (!table.players[nextIdx].isUser) {
        scheduleBotTurn(table, nextIdx);
      }
    }
  };

  const advanceStage = (table) => {
    table.players.forEach(p => { p.currentBet = 0; });
    table.currentBet = 0;
    const deck = table.deck;

    if (table.stage === 'preflop') {
      table.stage = 'flop';
      table.communityCards = [deck.pop(), deck.pop(), deck.pop()];
      table.lastAction = 'Флоп сдан: на стол вышли 3 карты.';
    } else if (table.stage === 'flop') {
      table.stage = 'turn';
      table.communityCards.push(deck.pop());
      table.lastAction = 'Терн сдан: 4-я карта на столе.';
    } else if (table.stage === 'turn') {
      table.stage = 'river';
      table.communityCards.push(deck.pop());
      table.lastAction = 'Ривер сдан: все 5 карт на столе!';
    } else if (table.stage === 'river') {
      resolveShowdown(table);
      return;
    }

    let nextIdx = (table.dealerIndex + 1) % 4;
    while (table.players[nextIdx].folded || table.players[nextIdx].isAllIn) {
      nextIdx = (nextIdx + 1) % 4;
    }
    table.activePlayer = nextIdx;

    setPokerGame({ ...table });

    if (!table.players[nextIdx].isUser) {
      scheduleBotTurn(table, nextIdx);
    }
  };

  const resolveShowdown = (table) => {
    table.stage = 'showdown';
    table.handResolved = true;

    const contenders = table.players.filter(p => !p.folded);
    const evaluations = contenders.map(p => {
      const evalRes = evaluatePokerHand([...p.holeCards, ...table.communityCards]);
      return { player: p, ...evalRes };
    });

    evaluations.sort((a, b) => b.score - a.score);
    const best = evaluations[0];
    const isUserWinner = best.player.isUser;

    table.winnerInfo = {
      winnerName: best.player.name,
      handName: best.name,
      handDesc: best.desc,
      potWon: table.pot,
      isUserWon: isUserWinner
    };

    table.lastAction = `🏆 Победитель: ${best.player.name} с комбинацией ${best.name}!`;

    if (isUserWinner) {
      onUpdateBalance(table.pot);
      triggerPlayerReaction(0, 'Я победил! Натс! 👑', '🥂');
    } else {
      triggerPlayerReaction(best.player.id, 'Банк мой! Спасибо за игру 💰', '😎');
    }

    setPokerGame({ ...table });
  };

  const concludeHandByFold = (table, winner) => {
    table.stage = 'showdown';
    table.handResolved = true;
    table.winnerInfo = {
      winnerName: winner.name,
      handName: 'Победа по фолду соперников',
      handDesc: 'Все остальные игроки сбросили карты',
      potWon: table.pot,
      isUserWon: winner.isUser
    };
    table.lastAction = `🏆 ${winner.name} забирает банк ${table.pot} SWAG без вскрытия!`;

    if (winner.isUser) {
      onUpdateBalance(table.pot);
      triggerPlayerReaction(0, 'Забрал банк на классе! 💪', '🤑');
    } else {
      triggerPlayerReaction(winner.id, 'Легкий банк, без сопротивления 🥱', '💰');
    }

    setPokerGame({ ...table });
  };

  const handlePullLever = () => {
    if (isSpinning || isLeverPulled) return;
    setIsLeverPulled(true);
    soundService.playSpin && soundService.playSpin();
    spinSlots();
    setTimeout(() => {
      setIsLeverPulled(false);
    }, 600);
  };

  const spinSlots = () => {
    if (balance < slotBet) {
      alert('Недостаточно $SWAG! Пополните баланс кнопкой FOUNDER MINT или выберите меньшую ставку.');
      return;
    }

    setIsSpinning(true);
    setSlotWinAmount(null);
    onUpdateBalance(-slotBet);
    setJackpotPool(prev => prev + Math.floor(slotBet * 0.1));

    // Анимация вращения барабанов
    let spinsCount = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
      spinsCount++;

      if (spinsCount > 15) {
        clearInterval(interval);
        finalizeSlotSpin();
      }
    }, 90);
  };

  const finalizeSlotSpin = () => {
    // ХАЙ-РОЛЛЕР КАЗИНО: Шанс на победу минимальный ~2.5% (97.5% проигрыш / близкий промах)
    const winRoll = Math.random();
    let finalReels;
    let winAmount = 0;
    let winType = '';

    if (winRoll < 0.003) {
      // 0.3% шанс: 👑 МЕГА ДЖЕКПОТ!
      finalReels = ['👑', '👑', '👑'];
      winAmount = slotBet * 50;
      winType = '👑 МЕГА ДЖЕКПОТ!';
    } else if (winRoll < 0.01) {
      // 0.7% шанс: 777
      finalReels = ['7️⃣', '7️⃣', '7️⃣'];
      winAmount = slotBet * 35;
      winType = '7️⃣7️⃣7️⃣ СВЭГ ВЫИГРЫШ!';
    } else if (winRoll < 0.025) {
      // 1.5% шанс: 3 одинаковых символа (💎, ⚡, 🔥)
      const sym = ['💎', '⚡', '🔥'][Math.floor(Math.random() * 3)];
      finalReels = [sym, sym, sym];
      winAmount = slotBet * (SYMBOL_PAYOUTS[sym] || 15);
      winType = '🎆 ТРИ В РЯД!';
    } else {
      // 97.5% Проигрыш / Near-miss (два символа совпали, создавая напряжение)
      const s1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      const nearMiss = Math.random() > 0.4;
      if (nearMiss) {
        const diffSym = SLOT_SYMBOLS.filter(s => s !== s1)[Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))];
        finalReels = [s1, s1, diffSym];
      } else {
        finalReels = [
          s1,
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          '💀'
        ];
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          finalReels[2] = '💀';
        }
      }
    }

    setReels(finalReels);
    setIsSpinning(false);

    if (winAmount > 0) {
      onUpdateBalance(winAmount);
      setSlotWinAmount({ amount: winAmount, type: winType });
    }
  };

  // --------------------------------------------------
  // 2. PvP ДУЭЛИ: КАРТОЧНАЯ ИГРА «ДУРАК» СО СТАВКАМИ И ALL-IN
  // --------------------------------------------------
  const [pvpList, setPvpList] = useState(() => {
    const friends = db.getFriends();
    const existingHandles = new Set(INITIAL_PVP_PLAYERS.map(p => p.handle.toLowerCase()));
    const friendsAsPlayers = friends
      .filter(f => !existingHandles.has(f.handle.toLowerCase()))
      .map(f => ({
        id: f.id,
        name: f.name,
        handle: f.handle,
        defaultBet: 200,
        wins: Math.floor(10 + Math.random() * 50),
        avatar: f.avatar,
        status: 'ДРУГ ИЗ СЕТИ'
      }));
    return [...INITIAL_PVP_PLAYERS, ...friendsAsPlayers];
  });
  const [selectedOpponent, setSelectedOpponent] = useState(INITIAL_PVP_PLAYERS[0]);
  const [durakBet, setDurakBet] = useState(100);
  const [durakGame, setDurakGame] = useState(null); 
  // durakGame: { deck, trumpCard, playerHand, botHand, table: [{ attack, defense }], turn: 'player'|'bot', status: 'playing'|'won'|'lost'|'push', pot, message }

  const handleSetAllIn = () => {
    if (balance <= 0) {
      alert('У вас 0 SWAG! Пополните баланс в FOUNDER MINT.');
      return;
    }
    setDurakBet(balance);
  };

  // Запуск кибер-дуэли в Дурака
  const startDurakDuel = (opp = selectedOpponent, customBet = durakBet) => {
    if (balance < customBet) {
      alert(`Недостаточно SWAG! Ваш баланс: ${balance} SWAG, ставка: ${customBet} SWAG.`);
      return;
    }

    onUpdateBalance(-customBet);
    const pot = customBet * 2;
    const fullDeck = generateShuffledDeck();

    // Козырная карта кладется лицом вверх внизу колоды
    const trumpCard = fullDeck[0]; // последняя карта колоды (вскрытый козырь)
    const activeDeck = fullDeck.slice(1);

    // Раздача по 6 карт
    const playerHand = activeDeck.splice(activeDeck.length - 6, 6);
    const botHand = activeDeck.splice(activeDeck.length - 6, 6);

    // Проверка наименьшего козыря для определения первого хода
    const pTrumps = playerHand.filter(c => c.suit === trumpCard.suit);
    const bTrumps = botHand.filter(c => c.suit === trumpCard.suit);

    let firstTurn = 'player';
    if (pTrumps.length > 0 && bTrumps.length > 0) {
      const minP = Math.min(...pTrumps.map(c => c.value));
      const minB = Math.min(...bTrumps.map(c => c.value));
      firstTurn = minP <= minB ? 'player' : 'bot';
    } else if (bTrumps.length > 0) {
      firstTurn = 'bot';
    }

    const initialGame = {
      opponent: opp,
      pot,
      bet: customBet,
      deck: [...activeDeck, trumpCard], // козырь в конце
      trumpCard,
      playerHand,
      botHand,
      table: [],
      turn: firstTurn,
      status: 'playing',
      message: firstTurn === 'player' ? 'Ваш ход! Атакуйте противника.' : 'Ход противника! Приготовьтесь защищаться.'
    };

    setDurakGame(initialGame);

    // Если первый ход бота — он сразу атакует
    if (firstTurn === 'bot') {
      setTimeout(() => {
        botAttackTurn(initialGame);
      }, 900);
    }
  };

  // Проверка: может ли карта defCard побить attCard
  const canBeatCard = (attCard, defCard, trumpSuit) => {
    if (defCard.suit === attCard.suit) {
      return defCard.value > attCard.value;
    }
    if (defCard.suit === trumpSuit && attCard.suit !== trumpSuit) {
      return true;
    }
    return false;
  };

  // Игрок атакует выбранной картой
  const handlePlayerAttack = (card) => {
    if (!durakGame || durakGame.status !== 'playing' || durakGame.turn !== 'player') return;

    // Правило подкидывания: первая карта любая, последующие должны совпадать по рангу с картами на столе
    if (durakGame.table.length > 0) {
      const existingRanks = durakGame.table.flatMap(pair => [pair.attack.rank, pair.defense?.rank].filter(Boolean));
      if (!existingRanks.includes(card.rank)) {
        alert('Подкидывать можно только карты того же достоинства, что уже есть на столе!');
        return;
      }
    }

    // Проверяем лимит карт (не более 6 атак и не более чем карт у бота)
    const uncovered = durakGame.table.some(p => p.defense === null);
    if (uncovered) {
      alert('Сначала дождитесь защиты противника на предыдущую карту!');
      return;
    }

    const newPlayerHand = durakGame.playerHand.filter(c => c.id !== card.id);
    const newTable = [...durakGame.table, { attack: card, defense: null }];

    const updatedGame = {
      ...durakGame,
      playerHand: newPlayerHand,
      table: newTable,
      message: 'Противник думает над защитой...'
    };
    setDurakGame(updatedGame);

    // Бот защищается с задержкой
    setTimeout(() => {
      botDefendTurn(updatedGame, card);
    }, 700);
  };

  // Бот пытается побить атакующую карту игрока
  const botDefendTurn = (gameState, attackCard) => {
    const { botHand, trumpCard, table } = gameState;
    const trumpSuit = trumpCard.suit;

    // Находим все валидные карты защиты
    const validCards = botHand.filter(c => canBeatCard(attackCard, c, trumpSuit));

    if (validCards.length > 0) {
      // Бот выбирает наименьшую валидную карту
      // Сначала не-козыри
      const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);
      let chosenCard;
      if (nonTrumps.length > 0) {
        nonTrumps.sort((a, b) => a.value - b.value);
        chosenCard = nonTrumps[0];
      } else {
        validCards.sort((a, b) => a.value - b.value);
        chosenCard = validCards[0];
      }

      const newBotHand = botHand.filter(c => c.id !== chosenCard.id);
      const newTable = table.map(pair => pair.attack.id === attackCard.id ? { ...pair, defense: chosenCard } : pair);

      setDurakGame({
        ...gameState,
        botHand: newBotHand,
        table: newTable,
        message: `Противник отбился картой ${chosenCard.rank}${chosenCard.suit}! Подкиньте ещё или нажмите «БИТО».`
      });
    } else {
      // Бот не может побить и забирает все карты со стола
      const allTableCards = table.flatMap(p => [p.attack, p.defense].filter(Boolean));
      const newBotHand = [...botHand, ...allTableCards];

      setDurakGame({
        ...gameState,
        botHand: newBotHand,
        table: [],
        message: 'Противник не смог отбиться и ЗАБРАЛ карты! Вы продолжаете атаковать.'
      });

      // Добор карт игроком из колоды
      replenishHands(gameState.playerHand, newBotHand, gameState.deck, trumpCard, 'player');
    }
  };

  // Игрок защищается от атакующей карты бота
  const handlePlayerDefend = (card) => {
    if (!durakGame || durakGame.status !== 'playing' || durakGame.turn !== 'bot') return;

    // Ищем непокрытую карту на столе
    const targetPairIndex = durakGame.table.findIndex(p => p.defense === null);
    if (targetPairIndex === -1) return;

    const attackCard = durakGame.table[targetPairIndex].attack;
    if (!canBeatCard(attackCard, card, durakGame.trumpCard.suit)) {
      alert(`Эта карта не может побить ${attackCard.rank}${attackCard.suit}! Нужна карта той же масти выше или козырь.`);
      return;
    }

    const newPlayerHand = durakGame.playerHand.filter(c => c.id !== card.id);
    const newTable = [...durakGame.table];
    newTable[targetPairIndex] = { ...newTable[targetPairIndex], defense: card };

    const updatedGame = {
      ...durakGame,
      playerHand: newPlayerHand,
      table: newTable,
      message: 'Вы отбились! Противник решает, подкидывать ли ещё...'
    };
    setDurakGame(updatedGame);

    // Бот решает: подкинуть или объявить БИТО
    setTimeout(() => {
      botFollowUpAttack(updatedGame);
    }, 800);
  };

  // Бот решает, подкинуть ли карту или завершить раунд (БИТО)
  const botFollowUpAttack = (gameState) => {
    const { botHand, table, trumpCard, playerHand } = gameState;
    if (playerHand.length === 0 || botHand.length === 0) {
      finishRoundBito(gameState);
      return;
    }

    const existingRanks = table.flatMap(p => [p.attack.rank, p.defense?.rank].filter(Boolean));
    const matchingCards = botHand.filter(c => existingRanks.includes(c.rank) && c.suit !== trumpCard.suit);

    if (matchingCards.length > 0 && table.length < 5) {
      // Бот подкидывает карту
      const cardToThrow = matchingCards[0];
      const newBotHand = botHand.filter(c => c.id !== cardToThrow.id);
      const newTable = [...table, { attack: cardToThrow, defense: null }];

      setDurakGame({
        ...gameState,
        botHand: newBotHand,
        table: newTable,
        message: `Противник подкинул ${cardToThrow.rank}${cardToThrow.suit}! Защищайтесь или возьмите карты.`
      });
    } else {
      // Бот объявляет БИТО!
      finishRoundBito(gameState);
    }
  };

  // Завершение раунда (БИТО)
  const finishRoundBito = (gameState = durakGame) => {
    if (!gameState) return;

    // Проверяем, все ли карты на столе покрыты
    const hasUncovered = gameState.table.some(p => p.defense === null);
    if (hasUncovered && gameState.turn === 'player') {
      alert('Нельзя объявить БИТО, пока противник не отбился от последней карты!');
      return;
    }

    const nextTurn = gameState.turn === 'player' ? 'bot' : 'player';
    replenishHands(gameState.playerHand, gameState.botHand, gameState.deck, gameState.trumpCard, nextTurn);
  };

  // Игрок решает ВЗЯТЬ карты (когда не может отбиться)
  const handlePlayerTakeCards = () => {
    if (!durakGame || durakGame.turn !== 'bot') return;

    const allCards = durakGame.table.flatMap(p => [p.attack, p.defense].filter(Boolean));
    const newPlayerHand = [...durakGame.playerHand, ...allCards];

    // Бот добирает карты и продолжает атаковать
    replenishHands(newPlayerHand, durakGame.botHand, durakGame.deck, durakGame.trumpCard, 'bot');
  };

  // Добор карт из колоды до 6 штук
  const replenishHands = (pHand, bHand, deck, trumpCard, nextTurn) => {
    let currentDeck = [...deck];
    let newPlayerHand = [...pHand];
    let newBotHand = [...bHand];

    // Сначала добирает атакующий, затем защищающийся
    if (nextTurn === 'bot') {
      // Бот добирает
      while (newBotHand.length < 6 && currentDeck.length > 0) {
        newBotHand.push(currentDeck.shift());
      }
      // Игрок добирает
      while (newPlayerHand.length < 6 && currentDeck.length > 0) {
        newPlayerHand.push(currentDeck.shift());
      }
    } else {
      // Игрок добирает
      while (newPlayerHand.length < 6 && currentDeck.length > 0) {
        newPlayerHand.push(currentDeck.shift());
      }
      // Бот добирает
      while (newBotHand.length < 6 && currentDeck.length > 0) {
        newBotHand.push(currentDeck.shift());
      }
    }

    // Проверка окончания игры (колода пуста и у кого-то закончились карты)
    if (currentDeck.length === 0) {
      if (newPlayerHand.length === 0 && newBotHand.length === 0) {
        onUpdateBalance(durakGame.bet); // возврат
        setDurakGame(prev => ({ ...prev, status: 'push', table: [], message: '🤝 НИЧЬЯ! Оба игрока вышли одновременно. Ставка возвращена.' }));
        return;
      }
      if (newPlayerHand.length === 0) {
        onUpdateBalance(durakGame.pot);
        setDurakGame(prev => ({ ...prev, status: 'won', table: [], message: `🎉 ПОБЕДА! ПРОТИВНИК — ДУРАК! Вы забрали куш +${durakGame.pot} $SWAG!` }));
        return;
      }
      if (newBotHand.length === 0) {
        setDurakGame(prev => ({ ...prev, status: 'lost', table: [], message: '💀 ВЫ ОСТАЛИСЬ В ДУРАКАХ! Ставка утрачена.' }));
        return;
      }
    }

    const updated = {
      ...durakGame,
      playerHand: newPlayerHand,
      botHand: newBotHand,
      deck: currentDeck,
      table: [],
      turn: nextTurn,
      message: nextTurn === 'player' ? 'Ваш ход! Атакуйте противника.' : 'Ход противника! Защищайтесь.'
    };
    setDurakGame(updated);

    // Если ход бота — он делает атаку
    if (nextTurn === 'bot') {
      setTimeout(() => {
        botAttackTurn(updated);
      }, 900);
    }
  };

  // Атака бота
  const botAttackTurn = (gameState) => {
    const { botHand, trumpCard, status } = gameState;
    if (status !== 'playing' || botHand.length === 0) return;

    // Бот атакует наименьшей не-козырной картой
    const trumpSuit = trumpCard.suit;
    const nonTrumps = botHand.filter(c => c.suit !== trumpSuit);
    let attackCard;
    if (nonTrumps.length > 0) {
      nonTrumps.sort((a, b) => a.value - b.value);
      attackCard = nonTrumps[0];
    } else {
      const sorted = [...botHand].sort((a, b) => a.value - b.value);
      attackCard = sorted[0];
    }

    const newBotHand = botHand.filter(c => c.id !== attackCard.id);
    const newTable = [{ attack: attackCard, defense: null }];

    setDurakGame({
      ...gameState,
      botHand: newBotHand,
      table: newTable,
      message: `Противник атаковал картой ${attackCard.rank}${attackCard.suit}! Побейте её или нажмите «ВЗЯТЬ».`
    });
  };

  // --------------------------------------------------
  // 3. BLACKJACK 21 С ДЖАРВИСОМ
  // --------------------------------------------------
  const [bjBet, setBjBet] = useState(50);
  const [bjGame, setBjGame] = useState(null);

  const startBlackjack = () => {
    if (balance < bjBet) {
      alert('Недостаточно SWAG!');
      return;
    }
    onUpdateBalance(-bjBet);

    const p1 = Math.floor(Math.random() * 10) + 2;
    const p2 = Math.floor(Math.random() * 10) + 2;
    const d1 = Math.floor(Math.random() * 10) + 2;
    const d2 = Math.floor(Math.random() * 10) + 2;

    const initial = {
      playerCards: [p1, p2],
      dealerCards: [d1, d2],
      dealerRevealed: false,
      status: 'playing'
    };

    const pSum = p1 + p2;
    if (pSum === 21) {
      const win = Math.floor(bjBet * 2.5);
      onUpdateBalance(win);
      initial.status = 'won';
      initial.dealerRevealed = true;
    }

    setBjGame(initial);
  };

  const bjHit = () => {
    if (!bjGame || bjGame.status !== 'playing') return;
    const nextCard = Math.floor(Math.random() * 10) + 2;
    const newCards = [...bjGame.playerCards, nextCard];
    const sum = newCards.reduce((a, b) => a + b, 0);

    if (sum > 21) {
      setBjGame({ ...bjGame, playerCards: newCards, status: 'lost', dealerRevealed: true });
    } else {
      setBjGame({ ...bjGame, playerCards: newCards });
    }
  };

  const bjStand = () => {
    if (!bjGame || bjGame.status !== 'playing') return;
    const pSum = bjGame.playerCards.reduce((a, b) => a + b, 0);
    let dCards = [...bjGame.dealerCards];
    let dSum = dCards.reduce((a, b) => a + b, 0);

    while (dSum < 17) {
      const c = Math.floor(Math.random() * 10) + 2;
      dCards.push(c);
      dSum += c;
    }

    let result = 'lost';
    if (dSum > 21 || pSum > dSum) {
      result = 'won';
      onUpdateBalance(bjBet * 2);
    } else if (pSum === dSum) {
      result = 'push';
      onUpdateBalance(bjBet);
    }

    setBjGame({ ...bjGame, dealerCards: dCards, dealerRevealed: true, status: result });
  };

  // --------------------------------------------------
  // 4. КОЛЕСО ФОРТУНЫ (SVG С ТОЧНЫМ ПОПАДАНИЕМ В СТРЕЛКУ) + ОГР МАГ МУЛЬТИКАСТ
  // --------------------------------------------------
  const [wheelDegree, setWheelDegree] = useState(0);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [wheelPrize, setWheelPrize] = useState(null);
  const [ogreClap, setOgreClap] = useState(false);
  const [multicastInfo, setMulticastInfo] = useState(null);

  const spinWheel = () => {
    if (balance < 100) {
      alert('Вращение колеса стоит 100 SWAG!');
      return;
    }
    onUpdateBalance(-100);
    setIsWheelSpinning(true);
    setWheelPrize(null);

    // Вероятностный выбор сектора (шанс выигрыша ~2.5% на крупные призы)
    const rand = Math.random() * 100;
    let accumulated = 0;
    let targetIndex = 0;

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
      accumulated += WHEEL_SECTORS[i].weight;
      if (rand <= accumulated) {
        targetIndex = i;
        break;
      }
    }

    const selectedSector = WHEEL_SECTORS[targetIndex];

    // МАТЕМАТИЧЕСКИЙ РАСЧЁТ УГЛА:
    // Стрелка находится на 12 часах (0 градусов).
    // Сектор targetIndex имеет центр под углом: targetIndex * 45 + 22.5 градусов.
    // При вращении по часовой стрелке на угол R, под 12 часов встанет сектор,
    // для которого: (360 - (targetIndex * 45 + 22.5)) градусов!
    const sectorCenterAngle = targetIndex * 45 + 22.5;
    const targetAlignment = (360 - sectorCenterAngle + 360) % 360;

    const fullSpins = 6 * 360; // 6 полных оборотов
    const currentBase = Math.floor(wheelDegree / 360) * 360;
    const finalRotation = currentBase + fullSpins + targetAlignment;

    setWheelDegree(finalRotation);

    setTimeout(() => {
      setIsWheelSpinning(false);
      if (selectedSector.value > 0) {
        // ОГР МАГ И МУЛЬТИКАСТ (DOTA 2 STYLE)
        const randMult = Math.random();
        let mult = 1;
        if (randMult < 0.40) mult = 2;
        else if (randMult < 0.70) mult = 3;
        else if (randMult < 0.90) mult = 4;

        const totalWon = selectedSector.value * mult;
        onUpdateBalance(totalWon);

        if (mult > 1) {
          setOgreClap(true);
          setMulticastInfo({ multiplier: mult, totalWon, base: selectedSector.value });
          soundService.playClap && soundService.playClap();
          setTimeout(() => {
            soundService.playMulticast && soundService.playMulticast(mult);
          }, 350);
          setWheelPrize(`🔥 МУЛЬТИКАСТ ${mult}X! Огр Маг хлопает! +${totalWon} $SWAG!`);
          setTimeout(() => {
            setOgreClap(false);
            setMulticastInfo(null);
          }, 5000);
        } else {
          setWheelPrize(`🎉 ПОБЕДА! СЕКТОР ${selectedSector.label} (+${selectedSector.value} $SWAG)!`);
        }
      } else {
        setWheelPrize('💀 СЕКТОР 0 SWAG! Огр Маг зевнул, крутите снова.');
      }
    }, 4100);
  };

  return (
    <div className="web4-page-layout container">
      {/* ВЕРХНИЙ БАННЕР КАЗИНО (ИСПРАВЛЕН КОНТРАСТ И ОТСТУП) */}
      <div className="casino-hero-banner">
        <div className="casino-hero-left">
          <span className="hero-cyber-badge">
            <span className="dot blink"></span> WEB 4.0 CYBER GAMBLING & DURAK PVP
          </span>
          <h1 className="hero-title">
            SWAG <span className="highlight">HIGH-ROLLER</span> CASINO
          </h1>
          <p className="hero-sub">
            Зарабатывай $SWAG в слотах 777, побеждай живых игроков в карточной кибер-битве «Дурак» и срывай джекпот!
          </p>
        </div>

        {/* СЧЕТЧИК ДЖЕКПОТА */}
        <div className="jackpot-counter-box">
          <span className="jackpot-label">👑 MEGA JACKPOT POOL</span>
          <div className="jackpot-digits">
            <span className="jackpot-sym">⚡</span>
            <span className="jackpot-val">{jackpotPool.toLocaleString()}</span>
            <span className="jackpot-cur">SWAG</span>
          </div>
        </div>
      </div>

      {/* НАВИГАЦИЯ ПО ИГРАМ КАЗИНО */}
      <div className="casino-nav-tabs">
        <button 
          className={`c-tab ${activeTab === 'slots' ? 'active' : ''}`} 
          onClick={() => setActiveTab('slots')}
        >
          ⚡ GATES OF SWAGUS™
        </button>
        <button 
          className={`c-tab ${activeTab === 'poker' ? 'active' : ''}`} 
          onClick={() => setActiveTab('poker')}
        >
          ♠️ ТЕХАССКИЙ ПОКЕР
        </button>
        <button 
          className={`c-tab ${activeTab === 'pvp' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pvp')}
        >
          🃏 КАРТОЧНЫЙ ДУРАК (PvP)
        </button>
        <button 
          className={`c-tab ${activeTab === 'blackjack' ? 'active' : ''}`} 
          onClick={() => setActiveTab('blackjack')}
        >
          ♠️ 21 С ПОЗДНЯКОВЫМ
        </button>
        <button 
          className={`c-tab ${activeTab === 'wheel' ? 'active' : ''}`} 
          onClick={() => setActiveTab('wheel')}
        >
          🎡 КОЛЕСО ФОРТУНЫ
        </button>
        {isFounder && (
          <button 
            className={`c-tab founder-tab ${activeTab === 'founder' ? 'active' : ''}`} 
            onClick={() => setActiveTab('founder')}
          >
            👑 FOUNDER MINT
          </button>
        )}
      </div>

      {/* 1. GATES OF SWAGUS™ (PREMIUM OLYMPUS CASINO) */}
      {activeTab === 'slots' && (
        <GatesOfSwagus balance={balance} onUpdateBalance={onUpdateBalance} />
      )}

      {/* ТЕХАССКИЙ ПОКЕР (TEXAS HOLD'EM ARENA) */}
      {activeTab === 'poker' && (
        <div className="poker-arena-wrapper">
          {/* СЕЛЕКТОР МУЛЬТИПЛЕЕРНЫХ СТОЛОВ ПОКЕРА */}
          <div className="poker-tables-selector-bar">
            <span className="pts-label">🌐 СЕТЕВЫЕ СТОЛЫ ПОКЕРА (ONLINE P2P):</span>
            <div className="pts-tabs-row">
              {POKER_MULTIPLAYER_TABLES.map(tbl => (
                <button
                  key={tbl.id}
                  className={`pts-tab-btn ${selectedPokerTable.id === tbl.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPokerTable(tbl);
                    if (pokerGame && (pokerGame.stage === 'idle' || pokerGame.handResolved)) {
                      setPokerGame(null);
                    }
                  }}
                >
                  <span className="pts-tab-name">{tbl.name}</span>
                  <small className="pts-tab-stakes">({tbl.stakes})</small>
                </button>
              ))}
            </div>
          </div>

          {/* ВЕРХНИЙ ХУД ПОКЕРНОГО СТОЛА */}
          <div className="poker-top-hud">
            <div className="poker-hud-title-cluster">
              <span className="poker-hud-badge">♠️ TEXAS HOLD'EM NO-LIMIT</span>
              <span className="poker-hud-stage-pill">
                {pokerGame ? (
                  pokerGame.stage === 'preflop' ? 'ПРЕФЛОП' :
                  pokerGame.stage === 'flop' ? 'ФЛОП (3 карты)' :
                  pokerGame.stage === 'turn' ? 'ТЕРН (4 карты)' :
                  pokerGame.stage === 'river' ? 'РИВЕР (5 карт)' : 'ВСКРЫТИЕ (ШОУДАУН)'
                ) : 'ОЖИДАНИЕ СТАРТА'}
              </span>
            </div>

            <div className="poker-hud-stats">
              <div className="poker-stat-item">
                <span>ОБЩИЙ БАНК:</span>
                <span className="poker-stat-val gold">⚡ {pokerGame ? pokerGame.pot.toLocaleString() : 0} SWAG</span>
              </div>
              <div className="poker-stat-item">
                <span>ТЕКУЩАЯ СТАВКА:</span>
                <span className="poker-stat-val">{pokerGame ? pokerGame.currentBet.toLocaleString() : 0} SWAG</span>
              </div>
              {(!pokerGame || pokerGame.handResolved) && (
                <button 
                  className="cyber-btn"
                  style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#ffaa00', color: '#000' }}
                  onClick={() => startPokerHand(pokerGame ? (pokerGame.dealerIndex + 1) % 4 : 0)}
                >
                  ♠️ {pokerGame ? 'НОВАЯ РАЗДАЧА' : 'РАЗДАТЬ КАРТЫ'}
                </button>
              )}
            </div>
          </div>

          {/* СТОЛ С ЗЕЛЕНЫМ СУКНОМ И ИГРОКАМИ */}
          <div className="poker-table-felt">
            {/* ЦЕНТР СТОЛА: БАНК И ОБЩИЕ КАРТЫ */}
            <div className="poker-center-stage">
              <div className="poker-pot-badge">
                <span className="pot-chip-icon">🪙</span>
                <span className="pot-amount">{pokerGame ? pokerGame.pot.toLocaleString() : 0} SWAG</span>
              </div>

              <div className="poker-community-cards">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const card = pokerGame?.communityCards[slotIdx];
                  if (card) {
                    return (
                      <div key={slotIdx} className="poker-card" style={{ color: card.color }}>
                        <div className="card-corner">
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                        <div className="card-center-suit">{card.suit}</div>
                        <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={slotIdx} className="community-card-slot">
                      <span style={{ color: '#444', fontSize: '1.2rem' }}>♠</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* МЕСТО 1: ПОЛЬЗОВАТЕЛЬ (НИЗ) */}
            {pokerGame && (
              <div className={`poker-seat seat-user ${pokerGame.activePlayer === 0 ? 'active-turn' : ''} ${pokerGame.players[0].folded ? 'folded' : ''}`}>
                {pokerReactions[0].emoji && <div className="poker-emoji-bubble">{pokerReactions[0].emoji}</div>}
                {pokerReactions[0].text && <div className="poker-speech-bubble">{pokerReactions[0].text}</div>}
                
                <div className="seat-cards-row">
                  {pokerGame.players[0].holeCards.map((card, cIdx) => (
                    <div key={cIdx} className="poker-card" style={{ color: card.color }}>
                      <div className="card-corner">
                        <span className="card-val">{card.rank || card.label}</span>
                        <span className="card-suit-sm">{card.suit}</span>
                      </div>
                      <div className="card-center-suit">{card.suit}</div>
                      <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                        <span className="card-val">{card.rank || card.label}</span>
                        <span className="card-suit-sm">{card.suit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="seat-player-box">
                  <span className="seat-avatar">{pokerGame.players[0].avatar}</span>
                  <div className="seat-meta">
                    <span className="seat-name">{pokerGame.players[0].name} (ВЫ)</span>
                    <span className="seat-chips">{pokerGame.players[0].chips.toLocaleString()} SWAG</span>
                  </div>
                  {pokerGame.dealerIndex === 0 && <span className="dealer-button" title="Дилер">D</span>}
                  {pokerGame.players[0].currentBet > 0 && (
                    <span className="seat-bet-pill">{pokerGame.players[0].currentBet} SWAG</span>
                  )}
                </div>
              </div>
            )}

            {/* МЕСТО 2: БОТ СВЕРХУ (MACAN БРАТ) */}
            {pokerGame && (
              <div className={`poker-seat seat-top ${pokerGame.activePlayer === 1 ? 'active-turn' : ''} ${pokerGame.players[1].folded ? 'folded' : ''}`}>
                {pokerReactions[1].emoji && <div className="poker-emoji-bubble">{pokerReactions[1].emoji}</div>}
                {pokerReactions[1].text && <div className="poker-speech-bubble">{pokerReactions[1].text}</div>}

                <div className="seat-player-box">
                  <span className="seat-avatar">{pokerGame.players[1].avatar}</span>
                  <div className="seat-meta">
                    <span className="seat-name">{pokerGame.players[1].name}</span>
                    <span className="seat-chips">{pokerGame.players[1].chips.toLocaleString()} SWAG</span>
                  </div>
                  {pokerGame.dealerIndex === 1 && <span className="dealer-button" title="Дилер">D</span>}
                  {pokerGame.players[1].currentBet > 0 && (
                    <span className="seat-bet-pill">{pokerGame.players[1].currentBet} SWAG</span>
                  )}
                </div>

                <div className="seat-cards-row">
                  {pokerGame.players[1].holeCards.map((card, cIdx) => (
                    pokerGame.stage === 'showdown' && !pokerGame.players[1].folded ? (
                      <div key={cIdx} className="poker-card" style={{ color: card.color }}>
                        <div className="card-corner">
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                        <div className="card-center-suit">{card.suit}</div>
                        <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={cIdx} className="poker-card back">
                        <div className="card-back-pattern">♠</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* МЕСТО 3: БОТ СЛЕВА (CyberBroker_67) */}
            {pokerGame && (
              <div className={`poker-seat seat-left ${pokerGame.activePlayer === 2 ? 'active-turn' : ''} ${pokerGame.players[2].folded ? 'folded' : ''}`}>
                {pokerReactions[2].emoji && <div className="poker-emoji-bubble">{pokerReactions[2].emoji}</div>}
                {pokerReactions[2].text && <div className="poker-speech-bubble">{pokerReactions[2].text}</div>}

                <div className="seat-player-box">
                  <span className="seat-avatar">{pokerGame.players[2].avatar}</span>
                  <div className="seat-meta">
                    <span className="seat-name">{pokerGame.players[2].name}</span>
                    <span className="seat-chips">{pokerGame.players[2].chips.toLocaleString()} SWAG</span>
                  </div>
                  {pokerGame.dealerIndex === 2 && <span className="dealer-button" title="Дилер">D</span>}
                  {pokerGame.players[2].currentBet > 0 && (
                    <span className="seat-bet-pill">{pokerGame.players[2].currentBet} SWAG</span>
                  )}
                </div>

                <div className="seat-cards-row">
                  {pokerGame.players[2].holeCards.map((card, cIdx) => (
                    pokerGame.stage === 'showdown' && !pokerGame.players[2].folded ? (
                      <div key={cIdx} className="poker-card" style={{ color: card.color }}>
                        <div className="card-corner">
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                        <div className="card-center-suit">{card.suit}</div>
                        <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={cIdx} className="poker-card back">
                        <div className="card-back-pattern">♠</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* МЕСТО 4: БОТ СПРАВА (J.A.R.V.I.S. AI Dealer) */}
            {pokerGame && (
              <div className={`poker-seat seat-right ${pokerGame.activePlayer === 3 ? 'active-turn' : ''} ${pokerGame.players[3].folded ? 'folded' : ''}`}>
                {pokerReactions[3].emoji && <div className="poker-emoji-bubble">{pokerReactions[3].emoji}</div>}
                {pokerReactions[3].text && <div className="poker-speech-bubble">{pokerReactions[3].text}</div>}

                <div className="seat-player-box">
                  <span className="seat-avatar">{pokerGame.players[3].avatar}</span>
                  <div className="seat-meta">
                    <span className="seat-name">{pokerGame.players[3].name}</span>
                    <span className="seat-chips">{pokerGame.players[3].chips.toLocaleString()} SWAG</span>
                  </div>
                  {pokerGame.dealerIndex === 3 && <span className="dealer-button" title="Дилер">D</span>}
                  {pokerGame.players[3].currentBet > 0 && (
                    <span className="seat-bet-pill">{pokerGame.players[3].currentBet} SWAG</span>
                  )}
                </div>

                <div className="seat-cards-row">
                  {pokerGame.players[3].holeCards.map((card, cIdx) => (
                    pokerGame.stage === 'showdown' && !pokerGame.players[3].folded ? (
                      <div key={cIdx} className="poker-card" style={{ color: card.color }}>
                        <div className="card-corner">
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                        <div className="card-center-suit">{card.suit}</div>
                        <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                          <span className="card-val">{card.rank || card.label}</span>
                          <span className="card-suit-sm">{card.suit}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={cIdx} className="poker-card back">
                        <div className="card-back-pattern">♠</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* БАННЕР ШОУДАУНА ПРИ ЗАВЕРШЕНИИ */}
            {pokerGame && pokerGame.winnerInfo && (
              <div className="poker-showdown-banner">
                <div className="showdown-title">
                  {pokerGame.winnerInfo.isUserWon ? '👑 ПОБЕДА! ВЫ ЗАБРАЛИ БАНК!' : `🏆 ${pokerGame.winnerInfo.winnerName} ВЫИГРАЛ РАЗДАЧУ!`}
                </div>
                <div className="showdown-hand">{pokerGame.winnerInfo.handName} ({pokerGame.winnerInfo.handDesc})</div>
                <div className="showdown-win-pot">+{pokerGame.winnerInfo.potWon.toLocaleString()} $SWAG</div>
                <button 
                  className="poker-next-hand-btn" 
                  onClick={() => startPokerHand((pokerGame.dealerIndex + 1) % 4)}
                >
                  СЛЕДУЮЩАЯ РАЗДАЧА 🔄
                </button>
              </div>
            )}
          </div>

          {/* ПАНЕЛЬ ДЕЙСТВИЙ (DOCK) */}
          <div className="poker-controls-dock">
            {(!pokerGame || pokerGame.handResolved) ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <button 
                  className="cyber-btn"
                  style={{ padding: '12px 32px', fontSize: '1rem', background: 'linear-gradient(135deg, #ffaa00, #ff5500)', color: '#000', fontWeight: 900 }}
                  onClick={() => startPokerHand(pokerGame ? (pokerGame.dealerIndex + 1) % 4 : 0)}
                >
                  ♠️ {pokerGame ? 'НАЧАТЬ СЛЕДУЮЩУЮ РАЗДАЧУ' : 'СЕСТЬ ЗА СТОЛ И СДАТЬ КАРТЫ (Блайнды: 50 / 100 SWAG)'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa', fontSize: '0.78rem' }}>
                  <span>📢 СТАТУС: <strong style={{ color: '#ffaa00' }}>{pokerGame.lastAction}</strong></span>
                  {pokerGame.activePlayer !== 0 && (
                    <span style={{ color: '#00ff66', animation: 'pulse 1s infinite' }}>
                      ⏳ Думает {pokerGame.players[pokerGame.activePlayer]?.name}...
                    </span>
                  )}
                </div>

                {pokerGame.activePlayer === 0 && !pokerGame.players[0].folded && (
                  <>
                    <div className="poker-actions-row">
                      <button 
                        className="poker-act-btn fold"
                        onClick={() => applyAction(pokerGame, 0, 'FOLD')}
                      >
                        СБРОС (FOLD)
                      </button>

                      {pokerGame.currentBet <= pokerGame.players[0].currentBet ? (
                        <button 
                          className="poker-act-btn check"
                          onClick={() => applyAction(pokerGame, 0, 'CHECK')}
                        >
                          ЧЕК (CHECK)
                        </button>
                      ) : (
                        <button 
                          className="poker-act-btn call"
                          onClick={() => applyAction(pokerGame, 0, 'CALL')}
                        >
                          КОЛЛ ({Math.min(pokerGame.players[0].chips, pokerGame.currentBet - pokerGame.players[0].currentBet)} SWAG)
                        </button>
                      )}

                      <button 
                        className="poker-act-btn raise"
                        onClick={() => applyAction(pokerGame, 0, 'RAISE', pokerRaiseAmount)}
                      >
                        РЕЙЗ ({pokerRaiseAmount} SWAG)
                      </button>

                      <button 
                        className="poker-act-btn allin"
                        onClick={() => applyAction(pokerGame, 0, 'ALL_IN')}
                      >
                        🔥 ВСЕ-В-БАНК ({pokerGame.players[0].chips} SWAG)
                      </button>
                    </div>

                    <div className="poker-raise-slider-row">
                      <span style={{ fontSize: '0.75rem', color: '#ffaa00', fontWeight: 800 }}>РЕЙЗ:</span>
                      <input 
                        type="range"
                        className="poker-raise-slider"
                        min={pokerGame.currentBet + 100}
                        max={pokerGame.players[0].chips + pokerGame.players[0].currentBet}
                        step={50}
                        value={pokerRaiseAmount}
                        onChange={(e) => setPokerRaiseAmount(Number(e.target.value))}
                      />
                      <div className="poker-quick-bets">
                        <button 
                          className="quick-bet-btn"
                          onClick={() => setPokerRaiseAmount(Math.min(pokerGame.players[0].chips, pokerGame.pot * 0.5))}
                        >
                          1/2 POT
                        </button>
                        <button 
                          className="quick-bet-btn"
                          onClick={() => setPokerRaiseAmount(Math.min(pokerGame.players[0].chips, pokerGame.pot))}
                        >
                          POT
                        </button>
                        <button 
                          className="quick-bet-btn"
                          onClick={() => setPokerRaiseAmount(pokerGame.players[0].chips + pokerGame.players[0].currentBet)}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ПАНЕЛЬ ЭМОДЗИ И СООБЩЕНИЙ ЧАТА */}
          <div className="poker-social-dock">
            <div className="poker-social-header">
              <span className="social-title">💬 ЭМОДЗИ И РЕАКЦИИ ЗА СТОЛОМ</span>
              <span className="social-subtitle">Нажмите на эмодзи или фразу, чтобы показать ее всем игрокам!</span>
            </div>

            <div className="poker-emojis-row">
              {['😎', '🔥', '👑', '💰', '🥂', '😱', '👀', '🤡', '💀', '💸', '🚀', '🤐'].map((emo) => (
                <button 
                  key={emo} 
                  className="poker-emoji-btn"
                  onClick={() => sendUserEmoji(emo)}
                  title={`Отправить эмодзи ${emo}`}
                >
                  {emo}
                </button>
              ))}
            </div>

            <div className="poker-quick-phrases-row">
              {[
                'У меня натс! 👑',
                'Чек в темноте 😎',
                'Вы блефуете! 👀',
                'Понеслась! 🚀',
                'Брат, скидывай 🔥',
                'Легкие бабки 💰'
              ].map((phrase) => (
                <button 
                  key={phrase} 
                  className="poker-phrase-btn"
                  onClick={() => sendUserMessage(phrase)}
                >
                  {phrase}
                </button>
              ))}
            </div>

            <div className="poker-chat-input-row">
              <input 
                type="text" 
                className="poker-chat-input"
                placeholder="Напишите сообщение игрокам за столом..."
                value={customPokerMessage}
                onChange={(e) => setCustomPokerMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendUserMessage(customPokerMessage);
                }}
              />
              <button 
                className="poker-chat-send-btn"
                onClick={() => sendUserMessage(customPokerMessage)}
              >
                ОТПРАВИТЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PvP КАРТОЧНАЯ ИГРА «ДУРАК» СО СТАВКАМИ И ALL-IN */}
      {activeTab === 'pvp' && (
        <div className="durak-arena-wrapper">
          {/* ЕСЛИ ИГРА В ПРОЦЕССЕ — ИГРОВОЙ СТОЛ */}
          {durakGame ? (
            <div className="durak-table-card">
              {/* Верхняя панель стола */}
              <div className="dt-header-row">
                <div className="dt-opp-meta">
                  <img src={durakGame.opponent.avatar} alt="Opponent" className="dt-avatar" />
                  <div>
                    <span className="dt-opp-name">{durakGame.opponent.name}</span>
                    <span className="dt-opp-badge">ПРОТИВНИК ({durakGame.botHand.length} карт)</span>
                  </div>
                </div>

                <div className="dt-pot-badge">
                  <span className="pot-label">БАНК БИТВЫ:</span>
                  <span className="pot-amount">⚡ {durakGame.pot.toLocaleString()} SWAG</span>
                  {durakGame.bet === balance && <span className="allin-tag">🔥 ALL-IN!</span>}
                </div>

                {/* Колода и открытый козырь */}
                <div className="dt-deck-box">
                  <div className="deck-stack">
                    <span className="deck-count">{durakGame.deck.length} карт</span>
                  </div>
                  <div className="trump-card-display" style={{ color: durakGame.trumpCard.color }}>
                    <span className="t-rank">{durakGame.trumpCard.rank}</span>
                    <span className="t-suit">{durakGame.trumpCard.suit}</span>
                    <small className="t-badge">КОЗЫРЬ</small>
                  </div>
                </div>
              </div>

              {/* Рука противника (рубашкой вверх) */}
              <div className="dt-bot-hand">
                {durakGame.botHand.map((_, i) => (
                  <div key={i} className="cyber-card-back" style={{ transform: `rotate(${(i - durakGame.botHand.length / 2) * 4}deg)` }}>
                    <span className="ccb-pattern">💀</span>
                  </div>
                ))}
              </div>

              {/* Поле стола: пары атака / защита */}
              <div className="dt-battlefield">
                {durakGame.table.length === 0 ? (
                  <div className="empty-field-placeholder">
                    <span>ИГРОВОЙ СТОЛ ПУСТ</span>
                    <small>{durakGame.message}</small>
                  </div>
                ) : (
                  <div className="card-pairs-row">
                    {durakGame.table.map((pair, idx) => (
                      <div key={idx} className="card-pair-slot">
                        {/* Атакующая карта */}
                        <div className={`cyber-playing-card on-table ${pair.attack.suit === durakGame.trumpCard.suit ? 'is-trump' : ''}`} style={{ color: pair.attack.color }}>
                          <span className="cpc-rank top">{pair.attack.rank}</span>
                          <span className="cpc-suit">{pair.attack.suit}</span>
                          <span className="cpc-rank btm">{pair.attack.rank}</span>
                        </div>

                        {/* Защитная карта (если отбита) */}
                        {pair.defense ? (
                          <div className={`cyber-playing-card on-table defender ${pair.defense.suit === durakGame.trumpCard.suit ? 'is-trump' : ''}`} style={{ color: pair.defense.color }}>
                            <span className="cpc-rank top">{pair.defense.rank}</span>
                            <span className="cpc-suit">{pair.defense.suit}</span>
                            <span className="cpc-rank btm">{pair.defense.rank}</span>
                          </div>
                        ) : (
                          <div className="card-defense-placeholder">
                            <span>🛡️ ЖДЁТ</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Статус-бар хода */}
              <div className={`dt-status-banner ${durakGame.turn === 'player' ? 'my-turn' : 'opp-turn'}`}>
                <span className="status-ico">{durakGame.turn === 'player' ? '⚡' : '🛡️'}</span>
                <span className="status-txt">{durakGame.message}</span>
              </div>

              {/* Кнопки действий игрока */}
              <div className="dt-actions-bar">
                {durakGame.turn === 'player' ? (
                  <button 
                    className="cyber-btn bito-btn"
                    onClick={() => finishRoundBito()}
                    disabled={durakGame.table.length === 0 || durakGame.table.some(p => p.defense === null)}
                  >
                    ✓ БИТО (ЗАВЕРШИТЬ ХОД)
                  </button>
                ) : (
                  <button 
                    className="cyber-btn take-btn"
                    onClick={handlePlayerTakeCards}
                    disabled={durakGame.table.length === 0}
                  >
                    🛡️ ВЗЯТЬ КАРТЫ СО СТОЛА
                  </button>
                )}

                {durakGame.status !== 'playing' && (
                  <button className="cyber-btn rematch-btn" onClick={() => setDurakGame(null)}>
                    НОВАЯ ИГРА В ДУРАКА
                  </button>
                )}

                <button className="cyber-btn surrender-btn" onClick={() => {
                  if (window.confirm('Сдаться и признать поражение?')) {
                    setDurakGame(null);
                  }
                }}>
                  🏳️ ВЫЙТИ ИЗ СТОЛА
                </button>
              </div>

              {/* Рука игрока (кликабельные карты) */}
              <div className="dt-player-hand-container">
                <span className="hand-owner-title">ВАША РУКА ({durakGame.playerHand.length} карт) // КЛИКАЙТЕ ДЛЯ ХОДА:</span>
                <div className="dt-player-hand">
                  {durakGame.playerHand.map((card) => {
                    const isTrump = card.suit === durakGame.trumpCard.suit;
                    return (
                      <div
                        key={card.id}
                        className={`cyber-playing-card in-hand ${isTrump ? 'is-trump' : ''}`}
                        style={{ color: card.color }}
                        onClick={() => {
                          if (durakGame.turn === 'player') {
                            handlePlayerAttack(card);
                          } else {
                            handlePlayerDefend(card);
                          }
                        }}
                      >
                        <span className="cpc-rank top">{card.rank}</span>
                        <span className="cpc-suit">{card.suit}</span>
                        {isTrump && <span className="trump-star">★ КОЗЫРЬ</span>}
                        <span className="cpc-rank btm">{card.rank}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ЛОББИ ВЫБОРА ОППОНЕНТА И СТАВОК */
            <div className="durak-lobby-card">
              <div className="lobby-header">
                <h3>⚔️ ЛОББИ КИБЕР-ДУРАКА (PvP ДУЭЛИ)</h3>
                <p>Выберите оппонента и сделайте ставку в $SWAG (вплоть до ва-банка ALL-IN):</p>
              </div>

              {/* Панель выбора ставки и кнопки ALL-IN */}
              <div className="wager-control-box">
                <span className="wc-label">ВЫБОР СТАВКИ:</span>
                <div className="wc-presets">
                  {[50, 100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      className={`wc-chip ${durakBet === amt ? 'active' : ''}`}
                      onClick={() => setDurakBet(amt)}
                    >
                      {amt} SWAG
                    </button>
                  ))}
                  <button 
                    className={`wc-chip allin-chip ${durakBet === balance && balance > 0 ? 'active' : ''}`}
                    onClick={handleSetAllIn}
                  >
                    ⚡ ALL-IN ({balance.toLocaleString()} SWAG)!
                  </button>
                </div>
              </div>

              {/* Сетка игроков */}
              <div className="pvp-players-grid">
                {pvpList.map(player => (
                  <div 
                    key={player.id} 
                    className={`pvp-player-card ${selectedOpponent.id === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOpponent(player)}
                  >
                    <div className="pvp-card-top">
                      <div className="pvp-avatar-wrap">
                        <img src={player.avatar} alt={player.name} className="pvp-avatar" />
                        <span className="online-ping-dot"></span>
                      </div>

                      <div className="pvp-info">
                        <h4 className="pvp-name">{player.name}</h4>
                        <span className="pvp-handle">{player.handle}</span>
                        <div className="pvp-stats">
                          <span>Побед: {player.wins}</span>
                        </div>
                      </div>

                      <div className="pvp-wager-box">
                        <span className="wager-label">КУШ В ИГРЕ</span>
                        <span className="wager-val">{durakBet * 2} SWAG</span>
                      </div>
                    </div>

                    <button 
                      className="cyber-btn pvp-fight-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOpponent(player);
                        startDurakDuel(player, durakBet);
                      }}
                    >
                      ⚔️ СЫГРАТЬ В ДУРАКА
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BLACKJACK 21 С ВЛАДИСЛАВОМ ПОЗДНЯКОВЫМ */}
      {activeTab === 'blackjack' && (
        <div className="blackjack-arena-card">
          <div className="bj-header">
            <h3>♠️ BLACKJACK С ВЛАДИСЛАВОМ ПОЗДНЯКОВЫМ</h3>
            <span className="bj-rules">Наберите больше очков, чем шеф Поздняков, но не более 21. Выигрыш 2X (Блэкджек 2.5X)</span>
          </div>

          {!bjGame ? (
            <div className="bj-start-panel">
              <div className="pozdnyakov-dealer-profile">
                <div className="pozdnyakov-avatar-wrap">
                  <img src={pozdnyakovImg} alt="Владислав Поздняков" className="pozdnyakov-avatar-img" />
                  <span className="pozdnyakov-chef-badge">ШЕФ-ДИЛЕР 👨‍🍳</span>
                </div>
                <div className="pozdnyakov-bio">
                  <div className="pozdnyakov-bio-title">ВЛАДИСЛАВ ПОЗДНЯКОВ</div>
                  <div className="pozdnyakov-speech">
                    «Раздаю карты прямо в колпаке и фартуке. На сушке с пельменями шутки плохи, а в блэкджеке — тем более! Ставь $SWAG, если готов к прожарке!»
                  </div>
                </div>
              </div>

              <div className="bet-selector" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                <span className="bet-label">СТАВКА:</span>
                {[25, 50, 100, 250, 500].map(amt => (
                  <button 
                    key={amt} 
                    className={`bet-btn ${bjBet === amt ? 'selected' : ''}`}
                    onClick={() => setBjBet(amt)}
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <button className="cyber-btn start-deal-btn" onClick={startBlackjack}>
                РАЗДАТЬ КАРТЫ
              </button>
            </div>
          ) : (
            <div className="bj-table">
              {/* Карты Дилера */}
              <div className="bj-hand dealer-hand">
                <div className="bj-dealer-row">
                  <img src={pozdnyakovImg} alt="Шеф Поздняков" className="bj-dealer-tiny-img" />
                  <span className="hand-title">
                    👨‍🍳 ДИЛЕР ВЛАДИСЛАВ ПОЗДНЯКОВ {bjGame.dealerRevealed ? `(СУММА: ${bjGame.dealerCards.reduce((a,b)=>a+b, 0)})` : ''}:
                  </span>
                </div>
                <div className="cards-row">
                  {bjGame.dealerCards.map((card, i) => (
                    <div key={i} className="playing-card">
                      {!bjGame.dealerRevealed && i === 1 ? '❓' : card}
                    </div>
                  ))}
                </div>
              </div>

              {/* Статус игры */}
              <div className="bj-status-row">
                {bjGame.status === 'won' && (
                  <div className="bj-alert win">
                    🎉 ПОБЕДА! ВЫ ОБОГРАЛИ ШЕФА ПОЗДНЯКОВА (+{Math.floor(bjBet * 2)} SWAG)
                    <div className="pozdnyakov-quote-mini">Поздняков: «Ладно, сегодня забирай. Но в следующий раз фартук с тебя сниму!»</div>
                  </div>
                )}
                {bjGame.status === 'lost' && (
                  <div className="bj-alert lose">
                    💀 ПЕРЕБОР / ПОРАЖЕНИЕ! ШЕФ ПОЗДНЯКОВ ЗАБРАЛ СТАВКУ
                    <div className="pozdnyakov-quote-mini">Поздняков: «Слабоват для моей кухни! Иди тренируйся на пельменях.»</div>
                  </div>
                )}
                {bjGame.status === 'push' && (
                  <div className="bj-alert push">
                    🤝 НИЧЬЯ (ВОЗВРАТ СТАВКИ {bjBet} SWAG)
                    <div className="pozdnyakov-quote-mini">Поздняков: «Ровно по очкам. Разошлись миром, как пацаны.»</div>
                  </div>
                )}
              </div>

              {/* Карты Игрока */}
              <div className="bj-hand player-hand">
                <span className="hand-title">ВАШИ КАРТЫ (СУММА: {bjGame.playerCards.reduce((a,b)=>a+b, 0)}):</span>
                <div className="cards-row">
                  {bjGame.playerCards.map((card, i) => (
                    <div key={i} className="playing-card player">
                      {card}
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопки управления */}
              <div className="bj-actions-row">
                {bjGame.status === 'playing' ? (
                  <>
                    <button className="cyber-btn bj-btn" onClick={bjHit}>
                      + ЕЩЕ КАРТУ (HIT)
                    </button>
                    <button className="cyber-btn bj-btn stand" onClick={bjStand}>
                      ✓ ХВАТИТ (STAND)
                    </button>
                  </>
                ) : (
                  <button className="cyber-btn start-deal-btn" onClick={startBlackjack}>
                    СЛЕДУЮЩАЯ РАЗДАЧА
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. КОЛЕСО ФОРТУНЫ (SVG С ТОЧНОЙ СТРЕЛКОЙ) */}
      {activeTab === 'wheel' && (
        <div className="wheel-arena-card">
          <h3>🎡 КИБЕР-КОЛЕСО ФОРТУНЫ</h3>
          <p>Стоимость вращения: 100 $SWAG. Выигрыши до 2500 $SWAG!</p>

          <div className="wheel-container">
            {/* Неоновая стрелка строго на 12 часах */}
            <div className="wheel-pointer-arrow">▼</div>

            {/* Вращающееся SVG колесо */}
            <div 
              className="svg-wheel-rotator"
              style={{
                transform: `rotate(${wheelDegree}deg)`,
                transition: isWheelSpinning ? 'transform 4s cubic-bezier(0.12, 0.95, 0.2, 1)' : 'none'
              }}
            >
              <svg viewBox="0 0 300 300" className="wheel-svg">
                <circle cx="150" cy="150" r="148" fill="#050505" stroke="#ff7700" strokeWidth="4" />
                
                {WHEEL_SECTORS.map((sector, i) => {
                  const startAngle = i * 45;
                  const endAngle = (i + 1) * 45;
                  const midAngle = startAngle + 22.5;

                  // Вычисление координат дуги (0 градусов = 12 часов)
                  const startRad = (startAngle - 90) * Math.PI / 180;
                  const endRad = (endAngle - 90) * Math.PI / 180;
                  const midRad = (midAngle - 90) * Math.PI / 180;

                  const r = 145;
                  const x1 = 150 + r * Math.cos(startRad);
                  const y1 = 150 + r * Math.sin(startRad);
                  const x2 = 150 + r * Math.cos(endRad);
                  const y2 = 150 + r * Math.sin(endRad);

                  // Координаты текста внутри сектора
                  const textR = 98;
                  const tx = 150 + textR * Math.cos(midRad);
                  const ty = 150 + textR * Math.sin(midRad);

                  return (
                    <g key={sector.id}>
                      <path
                        d={`M 150 150 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                        fill={sector.color}
                        stroke="#221505"
                        strokeWidth="1.5"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill={sector.text}
                        fontSize="11"
                        fontWeight="900"
                        fontFamily="'Share Tech Mono', monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                      >
                        {sector.icon} {sector.label}
                      </text>
                    </g>
                  );
                })}

                {/* Центральная заглушка с логотипом SWAG */}
                <circle cx="150" cy="150" r="34" fill="#080808" stroke="#ffd700" strokeWidth="3" />
                <circle cx="150" cy="150" r="30" fill="#140a00" />
                <text
                  x="150"
                  y="154"
                  fill="#ffd700"
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="'Share Tech Mono', monospace"
                  textAnchor="middle"
                >
                  SWAG
                </text>
              </svg>
            </div>
          </div>

          {wheelPrize && (
            <div className="wheel-prize-announcement">
              {wheelPrize}
            </div>
          )}

          {/* АНИМАЦИЯ ОГР МАГА И МУЛЬТИКАСТ */}
          {ogreClap && (
            <div className="ogre-magi-celebration-overlay">
              <div className="ogre-magi-character-box">
                <img src={ogreMagiImg} alt="Огр Маг Хлопает" className="ogre-magi-img" />
                <div className="ogre-speech-bubble">
                  ДВЕ ГОЛОВЫ ЛУЧШЕ ОДНОЙ! ХЛОП-ХЛОП! 👏💥
                </div>
              </div>

              {multicastInfo && (
                <div className="multicast-drop-banner">
                  <div className="multicast-banner-title">
                    🔥 МУЛЬТИКАСТ x{multicastInfo.multiplier}! 🔥
                  </div>
                  <div className="multicast-banner-sub">
                    +{multicastInfo.totalWon} $SWAG (x{multicastInfo.multiplier} МНОЖИТЕЛЬ ОТ ОГР МАГА!)
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            className={`cyber-btn spin-wheel-btn ${isWheelSpinning ? 'disabled' : ''}`}
            onClick={spinWheel}
            disabled={isWheelSpinning}
          >
            {isWheelSpinning ? 'КОЛЕСО ВРАЩАЕТСЯ...' : '🎡 КРУТИТЬ КОЛЕСО (100 SWAG)'}
          </button>
        </div>
      )}

      {/* 5. ПАНЕЛЬ FOUNDER MINT */}
      {activeTab === 'founder' && isFounder && (
        <div className="founder-terminal-card">
          <div className="ft-badge">👑 FOUNDER EXCLUSIVE PROTOCOL // GODMODE</div>
          <h2>ГЕНЕРАТОР МОНЕТ $SWAG</h2>
          <p>Вы обладаете наивысшим рангом <b>SWAG GOD</b>. Данная панель позволяет выпускать токены в единую базу данных платформы:</p>

          <div className="founder-mint-grid">
            <div className="mint-box">
              <span className="mb-title">СТАРТОВЫЙ ДРОП</span>
              <span className="mb-amount">+500 SWAG</span>
              <button className="cyber-btn" onClick={() => onUpdateBalance(500)}>ВЫПУСТИТЬ</button>
            </div>
            <div className="mint-box">
              <span className="mb-title">HIGH-ROLLER СТЕК</span>
              <span className="mb-amount">+5 000 SWAG</span>
              <button className="cyber-btn" onClick={() => onUpdateBalance(5000)}>ВЫПУСТИТЬ</button>
            </div>
            <div className="mint-box">
              <span className="mb-title">КИБЕР-ОЛИГАРХ</span>
              <span className="mb-amount">+50 000 SWAG</span>
              <button className="cyber-btn" onClick={() => onUpdateBalance(50000)}>ВЫПУСТИТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Web4Page;
