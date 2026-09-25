import React, { useState, useEffect, useRef } from 'react';
import './GatesOfSwagus.css';
import { db } from '../../services/db';
import { soundService } from '../../services/soundService';
import zeusImg from '../../assets/zeus_swagus.jpg';
import olympusBg from '../../assets/olympus_bg.jpg';
import gamblerMeme from '../../assets/gambler_meme.png';

// Symbols definition for Gates of SWAGUS™
const REGULAR_SYMBOLS = [
  { id: 'crown', name: 'Корона Олимпа', icon: '👑', color: '#ffd700', pay: { 8: 10, 10: 25, 12: 50 }, weight: 4 },
  { id: 'hourglass', name: 'Песочные часы', icon: '⏳', color: '#ffb300', pay: { 8: 2.5, 10: 10, 12: 25 }, weight: 6 },
  { id: 'ring', name: 'Кольцо Власти', icon: '💍', color: '#ff44aa', pay: { 8: 2, 10: 5, 12: 15 }, weight: 8 },
  { id: 'chalice', name: 'Кубок Зевса', icon: '🏆', color: '#ffcc00', pay: { 8: 1.5, 10: 2, 12: 12 }, weight: 10 },
  { id: 'red_gem', name: 'Рубин', icon: '🔴', color: '#ff2255', pay: { 8: 1, 10: 1.5, 12: 10 }, weight: 14 },
  { id: 'purple_gem', name: 'Аметист', icon: '🟣', color: '#aa33ff', pay: { 8: 0.8, 10: 1.2, 12: 8 }, weight: 16 },
  { id: 'yellow_gem', name: 'Топаз', icon: '🟡', color: '#ffdd00', pay: { 8: 0.5, 10: 1, 12: 5 }, weight: 18 },
  { id: 'green_gem', name: 'Изумруд', icon: '🟢', color: '#00dd66', pay: { 8: 0.4, 10: 0.9, 12: 4 }, weight: 20 },
  { id: 'blue_gem', name: 'Сапфир', icon: '🔵', color: '#00aaff', pay: { 8: 0.25, 10: 0.75, 12: 2 }, weight: 22 }
];

const MULTIPLIER_VALUES = [
  { val: 2, color: 'green', weight: 40 },
  { val: 3, color: 'green', weight: 25 },
  { val: 4, color: 'green', weight: 15 },
  { val: 5, color: 'green', weight: 10 },
  { val: 10, color: 'blue', weight: 8 },
  { val: 15, color: 'blue', weight: 5 },
  { val: 25, color: 'purple', weight: 3 },
  { val: 50, color: 'purple', weight: 1.5 },
  { val: 100, color: 'red', weight: 0.8 },
  { val: 250, color: 'red', weight: 0.3 },
  { val: 500, color: 'red', weight: 0.1 }
];

const MACAN_MOTIVATIONS = [
  'Брат, 99% уходят за шаг до заноса. Жми кнопку, Зевс уже заряжает х500! ⚡',
  'Не тильтуй, родной! Я вчера на последнем спине словил 4 скаттера. Верим в Олимп! 👑',
  'Кто понял жизнь, тот не спешит. Но если дают шанс — надо крутить на максимуме 🤝',
  'М5 ждет в гараже, пока слоты дают по красоте. Бас «Летника» на полную и вперед! 🏎️',
  'Своих не бросаем, даже если сегодня барабаны крутят туго. Скоро плюнет занос всей жизни 🐺',
  'Шахтер бросил кирку в сантиметре от алмазов! Мы не такие, братка. Терпение!'
];

const ZEUS_TAUNTS = [
  'ПОЧУВСТВУЙ СИЛУ СВЭГА!',
  'МОЛНИЯ ОЛИМПА НЕСЁТ x500!',
  'ТОЛЬКО СМЕЛЫМ ПОКОРЯЕТСЯ СВЭГУС!',
  'БОНУСКА БЛИЗКО, СМЕРТНЫЙ!',
  'МОЙ ГРОМ СОТРЯСАЕТ БАРАБАНЫ!',
  'ЛАЗЕРЫ ИЗ ГЛАЗ ЗАРЯЖЕНЫ!',
  'СЛОУ-МОУ СИЛА ОЛИМПА АКТИВИРОВАНА!'
];

// Helper to pick random item by weight
function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let rnd = Math.random() * total;
  for (const item of items) {
    if (rnd < item.weight) return item;
    rnd -= item.weight;
  }
  return items[0];
}

// Generate a realistic 6x5 grid (6 columns, 5 rows)
// Realistic casino mechanics: ~22% hit frequency on normal spins, ~45% during Free Spins
function generateSlotGrid(isWinningSpin = false, forceScatterBonus = false) {
  const grid = Array.from({ length: 6 }, () => []);

  if (forceScatterBonus) {
    const scatterPositions = new Set();
    while (scatterPositions.size < 4) {
      const c = Math.floor(Math.random() * 6);
      const r = Math.floor(Math.random() * 5);
      scatterPositions.add(`${c}_${r}`);
    }

    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 5; r++) {
        if (scatterPositions.has(`${c}_${r}`)) {
          grid[c].push({
            type: 'scatter',
            id: 'scatter_' + Math.random().toString(36).substr(2, 9),
            name: 'SCATTER ZEUS',
            icon: '⚡',
            color: '#00ffff'
          });
        } else {
          const sym = pickWeighted(REGULAR_SYMBOLS);
          grid[c].push({
            type: 'regular',
            id: sym.id + '_' + Math.random().toString(36).substr(2, 9),
            symbolId: sym.id,
            name: sym.name,
            icon: sym.icon,
            color: sym.color,
            pay: sym.pay
          });
        }
      }
    }
    return grid;
  }

  if (isWinningSpin) {
    // Pick 1 winning symbol to form a winning cluster of 8 to 11 symbols
    const winSym = REGULAR_SYMBOLS[Math.floor(Math.random() * REGULAR_SYMBOLS.length)];
    const winCount = 8 + Math.floor(Math.random() * 4); // 8, 9, 10, or 11 symbols
    const chosenPositions = new Set();
    while (chosenPositions.size < winCount) {
      const c = Math.floor(Math.random() * 6);
      const r = Math.floor(Math.random() * 5);
      chosenPositions.add(`${c}_${r}`);
    }

    // 40% chance for a multiplier orb on winning spins
    const hasMultiplier = Math.random() < 0.40;
    let multPos = null;
    if (hasMultiplier) {
      const c = Math.floor(Math.random() * 6);
      const r = Math.floor(Math.random() * 5);
      if (!chosenPositions.has(`${c}_${r}`)) {
        multPos = `${c}_${r}`;
      }
    }

    // Small chance for 1-2 scatters
    const scatterPos = Math.random() < 0.25 ? `${Math.floor(Math.random() * 6)}_${Math.floor(Math.random() * 5)}` : null;

    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 5; r++) {
        const key = `${c}_${r}`;
        if (chosenPositions.has(key)) {
          grid[c].push({
            type: 'regular',
            id: winSym.id + '_' + Math.random().toString(36).substr(2, 9),
            symbolId: winSym.id,
            name: winSym.name,
            icon: winSym.icon,
            color: winSym.color,
            pay: winSym.pay
          });
        } else if (multPos === key) {
          const orb = pickWeighted(MULTIPLIER_VALUES);
          grid[c].push({
            type: 'multiplier',
            id: 'mult_' + Math.random().toString(36).substr(2, 9),
            val: orb.val,
            color: orb.color,
            name: `${orb.val}x Multiplier`
          });
        } else if (scatterPos === key && !chosenPositions.has(key)) {
          grid[c].push({
            type: 'scatter',
            id: 'scatter_' + Math.random().toString(36).substr(2, 9),
            name: 'SCATTER ZEUS',
            icon: '⚡',
            color: '#00ffff'
          });
        } else {
          // Choose other symbols, keeping counts <= 6
          const otherSymbols = REGULAR_SYMBOLS.filter(s => s.id !== winSym.id);
          const sym = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
          grid[c].push({
            type: 'regular',
            id: sym.id + '_' + Math.random().toString(36).substr(2, 9),
            symbolId: sym.id,
            name: sym.name,
            icon: sym.icon,
            color: sym.color,
            pay: sym.pay
          });
        }
      }
    }
    return grid;
  }

  // Dead spin (authentic real-slot loss): distribute symbols so no symbol exceeds 6 occurrences
  const pool = [];
  // 0 to 2 scatters for tension
  const scatterCount = Math.random() < 0.2 ? (Math.random() < 0.25 ? 2 : 1) : 0;
  for (let i = 0; i < scatterCount; i++) {
    pool.push({
      type: 'scatter',
      id: 'scatter_' + Math.random().toString(36).substr(2, 9),
      name: 'SCATTER ZEUS',
      icon: '⚡',
      color: '#00ffff'
    });
  }

  const counts = {};
  while (pool.length < 30) {
    const sym = pickWeighted(REGULAR_SYMBOLS);
    if ((counts[sym.id] || 0) < 6) {
      counts[sym.id] = (counts[sym.id] || 0) + 1;
      pool.push({
        type: 'regular',
        id: sym.id + '_' + Math.random().toString(36).substr(2, 9),
        symbolId: sym.id,
        name: sym.name,
        icon: sym.icon,
        color: sym.color,
        pay: sym.pay
      });
    }
  }

  // Shuffle pool into 6 columns x 5 rows
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let idx = 0;
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < 5; r++) {
      grid[c].push(pool[idx++]);
    }
  }

  return grid;
}

// Single cell generator for cascading drops
function generateSingleCell(forceMultiplier = false) {
  if (forceMultiplier) {
    const orb = pickWeighted(MULTIPLIER_VALUES);
    return {
      type: 'multiplier',
      id: 'mult_' + Math.random().toString(36).substr(2, 9),
      val: orb.val,
      color: orb.color,
      name: `${orb.val}x Multiplier`
    };
  }

  if (Math.random() < 0.02) {
    return {
      type: 'scatter',
      id: 'scatter_' + Math.random().toString(36).substr(2, 9),
      name: 'SCATTER ZEUS',
      icon: '⚡',
      color: '#00ffff'
    };
  }

  if (Math.random() < 0.02) {
    const orb = pickWeighted(MULTIPLIER_VALUES);
    return {
      type: 'multiplier',
      id: 'mult_' + Math.random().toString(36).substr(2, 9),
      val: orb.val,
      color: orb.color,
      name: `${orb.val}x Multiplier`
    };
  }

  const sym = pickWeighted(REGULAR_SYMBOLS);
  return {
    type: 'regular',
    id: sym.id + '_' + Math.random().toString(36).substr(2, 9),
    symbolId: sym.id,
    name: sym.name,
    icon: sym.icon,
    color: sym.color,
    pay: sym.pay
  };
}

export default function GatesOfSwagus({ balance, onUpdateBalance }) {
  // Game setup
  const [grid, setGrid] = useState(() => generateSlotGrid(false));
  const [bet, setBet] = useState(50);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(0);

  // Referral Free Spins state (stored and loaded via db.js)
  const [referralFreeSpins, setReferralFreeSpins] = useState(() => db.getReferralFreeSpins());
  const [refLinkCopied, setRefLinkCopied] = useState(false);

  // Zeus animations & states: Lasers & Slow-Mo
  const [zeusState, setZeusState] = useState('idle'); // 'idle', 'charging', 'striking'
  const [zeusQuote, setZeusQuote] = useState('СМЕРТНЫЙ, КРУТИ ОЛИМП!');
  const [thunderActive, setThunderActive] = useState(false);
  const [screenShaking, setScreenShaking] = useState(false);
  const [zeusLasersActive, setZeusLasersActive] = useState(false);
  const [isZeusSlowMo, setIsZeusSlowMo] = useState(false);

  // Tumbles & Multipliers
  const [winningCells, setWinningCells] = useState(new Set());
  const [disintegratingCells, setDisintegratingCells] = useState(new Set());
  const [currentRoundWin, setCurrentRoundWin] = useState(0);
  const [roundMultipliers, setRoundMultipliers] = useState([]);
  const [totalAccumulatedWin, setTotalAccumulatedWin] = useState(0);

  // Free Spins Bonus Mode
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [isFreeSpinsActive, setIsFreeSpinsActive] = useState(false);
  const [globalMultiplier, setGlobalMultiplier] = useState(0);
  const [totalBonusWon, setTotalBonusWon] = useState(0);
  const [bonusFinishedModal, setBonusFinishedModal] = useState(null);

  // Win Celebrations
  const [regularWinToast, setRegularWinToast] = useState(null);
  const [bigWinModal, setBigWinModal] = useState(null);

  // Gambler features & Macan wisdom
  const [macanTip, setMacanTip] = useState(MACAN_MOTIVATIONS[0]);
  const [showMacanBubble, setShowMacanBubble] = useState(false);

  // Session Stats
  const [sessionStats, setSessionStats] = useState({
    spins: 0,
    scattersHit: 0,
    bonusesTriggered: 0,
    maxWin: 0
  });

  const currentUser = db.getUser();
  const referralLink = `${window.location.origin}/?ref=${currentUser?.handle?.replace('@', '') || 'swagus_god'}`;

  // Sync referral free spins from db events
  useEffect(() => {
    const handleSpinsUpdated = (e) => {
      if (typeof e.detail === 'number') {
        setReferralFreeSpins(e.detail);
      }
    };
    window.addEventListener('swag_referral_spins_updated', handleSpinsUpdated);
    return () => window.removeEventListener('swag_referral_spins_updated', handleSpinsUpdated);
  }, []);

  // Auto-play hook
  useEffect(() => {
    if (autoPlayCount > 0 && !isSpinning && !bigWinModal && !bonusFinishedModal) {
      const timer = setTimeout(() => {
        handleSpin(false);
        setAutoPlayCount(prev => prev - 1);
      }, isTurbo ? 250 : 800);
      return () => clearTimeout(timer);
    }
  }, [autoPlayCount, isSpinning, bigWinModal, bonusFinishedModal]);

  // Free Spins auto-continue in bonus mode
  useEffect(() => {
    if (isFreeSpinsActive && freeSpinsLeft > 0 && !isSpinning && !bigWinModal) {
      const timer = setTimeout(() => {
        executeSpinLogic({ inBonusMode: true });
      }, isTurbo ? 350 : 1000);
      return () => clearTimeout(timer);
    } else if (isFreeSpinsActive && freeSpinsLeft === 0 && !isSpinning) {
      // Bonus mode concluded
      setTimeout(() => {
        soundService.playCasinoJackpot && soundService.playCasinoJackpot();
        setBonusFinishedModal({
          totalWon: totalBonusWon,
          multiplier: globalMultiplier
        });
        setIsFreeSpinsActive(false);
      }, 700);
    }
  }, [isFreeSpinsActive, freeSpinsLeft, isSpinning, bigWinModal]);

  // Trigger Zeus lightning strike with Eye Lasers
  const triggerZeusStrike = () => {
    setZeusState('charging');
    setZeusQuote(ZEUS_TAUNTS[Math.floor(Math.random() * ZEUS_TAUNTS.length)]);
    setZeusLasersActive(true);

    setTimeout(() => {
      setZeusState('striking');
      setThunderActive(true);
      setScreenShaking(true);
      soundService.playZeusThunder && soundService.playZeusThunder();

      setTimeout(() => {
        setThunderActive(false);
        setScreenShaking(false);
        setZeusState('idle');
      }, 500);

      setTimeout(() => {
        setZeusLasersActive(false);
      }, 700);
    }, 400);
  };

  // Main spin handler: for coins OR for 1 referral free spin
  const handleSpin = (useReferralFreeSpin = false) => {
    if (isSpinning) return;

    if (useReferralFreeSpin) {
      if (referralFreeSpins <= 0) {
        setRegularWinToast({
          amount: 0,
          title: 'НЕТ ФРИСПИНОВ! Пригласи друга по рефералке (+5 FS)!'
        });
        setTimeout(() => setRegularWinToast(null), 3000);
        return;
      }
      // Deduct 1 referral spin
      db.addReferralFreeSpins(-1);
      setReferralFreeSpins(prev => Math.max(0, prev - 1));
    } else if (!isFreeSpinsActive) {
      // Play for real SWAG coins
      if (balance < bet) {
        alert(`Недостаточно SWAG для ставки! Требуется: ${bet} SWAG.`);
        setAutoPlayCount(0);
        return;
      }
      onUpdateBalance(-bet);
    }

    // Play "start gambling" sound
    soundService.playStartGambling && soundService.playStartGambling();

    executeSpinLogic({ inBonusMode: isFreeSpinsActive });
  };

  // Claim referral bonus (+5 Free Spins)
  const handleInviteFriend = () => {
    const newTotal = db.addReferralFreeSpins(5);
    setReferralFreeSpins(newTotal);
    soundService.playClick && soundService.playClick();
    setRegularWinToast({
      amount: 0,
      title: '🎁 +5 ФРИСПИНОВ НАЧИСЛЕНО ЗА РЕФЕРАЛА!'
    });
    setTimeout(() => setRegularWinToast(null), 3500);
  };

  // Copy referral link
  const handleCopyReferralLink = () => {
    try {
      navigator.clipboard.writeText(referralLink);
      setRefLinkCopied(true);
      soundService.playClick && soundService.playClick();
      setTimeout(() => setRefLinkCopied(false), 2500);
    } catch {
      setRefLinkCopied(true);
      setTimeout(() => setRefLinkCopied(false), 2500);
    }
  };

  // Core spin and cascade engine
  const executeSpinLogic = async ({ inBonusMode = false, guaranteedBonusHit = false }) => {
    setIsSpinning(true);
    setWinningCells(new Set());
    setDisintegratingCells(new Set());
    setCurrentRoundWin(0);
    setRoundMultipliers([]);
    setRegularWinToast(null);

    soundService.playSwagusSpin && soundService.playSwagusSpin();

    if (inBonusMode) {
      setFreeSpinsLeft(prev => Math.max(0, prev - 1));
    }

    setSessionStats(prev => ({ ...prev, spins: prev.spins + 1 }));

    // Authentic casino spin delay: allows "start gambling" voice to be clearly heard
    // without other sounds clashing, while drums spin with tension!
    await new Promise(res => setTimeout(res, isTurbo ? 450 : 1300));

    // Authentic casino win frequency: ~22% on regular spins, ~45% in Free Spins bonus
    const isWinningSpin = inBonusMode ? (Math.random() < 0.45) : (Math.random() < 0.22);

    // Chance for Zeus eye lasers and lightning strike
    const zeusStrikeChance = inBonusMode ? 0.35 : (isWinningSpin ? 0.30 : 0.05);
    let willStrike = Math.random() < zeusStrikeChance;

    if (willStrike) {
      triggerZeusStrike();
    }

    // Generate grid: guaranteed dead spin if not winning spin
    const newGrid = generateSlotGrid(isWinningSpin, guaranteedBonusHit);

    // Count scatters
    let scatterCount = 0;
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 5; r++) {
        if (newGrid[c][r].type === 'scatter') scatterCount++;
      }
    }

    // Zeus strike adds multiplier orbs
    if (willStrike && isWinningSpin) {
      const randC = Math.floor(Math.random() * 6);
      const randR = Math.floor(Math.random() * 5);
      const orb = pickWeighted(MULTIPLIER_VALUES);
      newGrid[randC][randR] = {
        type: 'multiplier',
        id: 'zeus_mult_' + Math.random().toString(36).substr(2, 9),
        val: orb.val,
        color: orb.color,
        name: `${orb.val}x Multiplier`
      };
    }

    // Scatter suspense & sounds
    if (scatterCount > 0) {
      setSessionStats(prev => ({ ...prev, scattersHit: prev.scattersHit + scatterCount }));
      soundService.playScatterHit && soundService.playScatterHit(Math.min(scatterCount, 4));

      if (scatterCount >= 3) {
        // Slow-Mo suspense when 3+ scatters land!
        setIsZeusSlowMo(true);
        setTimeout(() => setIsZeusSlowMo(false), 3000);
      }
    }

    setGrid(newGrid);

    // Reel fall delay
    await new Promise(res => setTimeout(res, isTurbo ? 150 : 350));

    // Handle Scatter wins and Free Spins trigger
    let scatterWinAmount = 0;
    if (scatterCount >= 4) {
      if (scatterCount === 4) scatterWinAmount = bet * 3;
      else if (scatterCount === 5) scatterWinAmount = bet * 5;
      else if (scatterCount >= 6) scatterWinAmount = bet * 100;

      if (!inBonusMode) {
        // Trigger 15 Free Spins!
        setTimeout(() => {
          soundService.playFreeSpinsTrigger && soundService.playFreeSpinsTrigger();
          soundService.playCasinoJackpot && soundService.playCasinoJackpot();
          setIsFreeSpinsActive(true);
          setFreeSpinsLeft(15);
          setGlobalMultiplier(0);
          setTotalBonusWon(0);
          setSessionStats(prev => ({ ...prev, bonusesTriggered: prev.bonusesTriggered + 1 }));
        }, 1200);
      } else {
        // Retrigger +5 Free Spins in bonus!
        setFreeSpinsLeft(prev => prev + 5);
        soundService.playScatterHit && soundService.playScatterHit(4);
      }
    }

    // Cascading Tumble loop
    let workingGrid = newGrid.map(col => [...col]);
    let roundTotalWin = scatterWinAmount;
    let tumblesCount = 0;
    let accumulatedRoundMultipliers = [];

    while (true) {
      // 1. Count regular symbols on the 6x5 grid (Pay Anywhere)
      const symbolCounts = {};
      const symbolPositions = {};

      for (let c = 0; c < 6; c++) {
        for (let r = 0; r < 5; r++) {
          const cell = workingGrid[c][r];
          if (cell.type === 'regular') {
            symbolCounts[cell.symbolId] = (symbolCounts[cell.symbolId] || 0) + 1;
            if (!symbolPositions[cell.symbolId]) symbolPositions[cell.symbolId] = [];
            symbolPositions[cell.symbolId].push({ c, r, cell });
          } else if (cell.type === 'multiplier') {
            if (!accumulatedRoundMultipliers.some(m => m.id === cell.id)) {
              accumulatedRoundMultipliers.push(cell);
            }
          }
        }
      }

      // 2. Identify winning clusters (8 or more matching symbols)
      const winningKeys = Object.keys(symbolCounts).filter(symId => symbolCounts[symId] >= 8);

      if (winningKeys.length === 0) {
        // No more winning clusters in this cascade
        break;
      }

      tumblesCount++;

      // 3. Mark winning cells for highlight and explosion
      const winCellSet = new Set();
      let stepWin = 0;

      winningKeys.forEach(symId => {
        const count = symbolCounts[symId];
        const symDef = REGULAR_SYMBOLS.find(s => s.id === symId);
        if (!symDef) return;

        let multiplierScale = symDef.pay[8];
        if (count >= 12) multiplierScale = symDef.pay[12];
        else if (count >= 10) multiplierScale = symDef.pay[10];

        stepWin += bet * multiplierScale;

        symbolPositions[symId].forEach(pos => {
          winCellSet.add(`${pos.c}_${pos.r}`);
        });
      });

      roundTotalWin += stepWin;
      setCurrentRoundWin(roundTotalWin);
      setWinningCells(new Set(winCellSet));

      // Play AWP Gunshot sound on win!
      soundService.playAwpShot && soundService.playAwpShot();

      // Highlight delay
      await new Promise(res => setTimeout(res, isTurbo ? 180 : 400));

      // Disintegration animation
      setDisintegratingCells(new Set(winCellSet));
      await new Promise(res => setTimeout(res, isTurbo ? 120 : 250));

      // 4. Drop surviving cells down and fill top with new cells
      const updatedGrid = [];
      for (let c = 0; c < 6; c++) {
        const remainingInCol = [];
        for (let r = 0; r < 5; r++) {
          if (!winCellSet.has(`${c}_${r}`)) {
            remainingInCol.push(workingGrid[c][r]);
          }
        }

        const needed = 5 - remainingInCol.length;
        const newDropped = [];
        for (let i = 0; i < needed; i++) {
          newDropped.push(generateSingleCell(false));
        }

        updatedGrid.push([...newDropped, ...remainingInCol]);
      }

      workingGrid = updatedGrid;
      setGrid(workingGrid);
      setWinningCells(new Set());
      setDisintegratingCells(new Set());

      // Small delay between cascades
      await new Promise(res => setTimeout(res, isTurbo ? 150 : 300));
    }

    // 5. Final Multiplier calculation
    let finalRoundMultiplierSum = accumulatedRoundMultipliers.reduce((sum, m) => sum + m.val, 0);
    setRoundMultipliers(accumulatedRoundMultipliers);

    let finalWinForThisRound = roundTotalWin;

    if (roundTotalWin > 0 && finalRoundMultiplierSum > 0) {
      soundService.playMultiplierOrb && soundService.playMultiplierOrb();
      finalWinForThisRound = roundTotalWin * finalRoundMultiplierSum;

      if (inBonusMode) {
        setGlobalMultiplier(prev => prev + finalRoundMultiplierSum);
      }
    } else if (inBonusMode && roundTotalWin > 0 && globalMultiplier > 0) {
      finalWinForThisRound = roundTotalWin * Math.max(1, globalMultiplier);
    }

    // 6. Balance Payout & Sound Effects
    if (finalWinForThisRound > 0) {
      onUpdateBalance(finalWinForThisRound);
      setTotalAccumulatedWin(prev => prev + finalWinForThisRound);

      if (inBonusMode) {
        setTotalBonusWon(prev => prev + finalWinForThisRound);
      }

      setSessionStats(prev => ({
        ...prev,
        maxWin: Math.max(prev.maxWin, finalWinForThisRound)
      }));

      soundService.playCoinCount && soundService.playCoinCount();

      // Win Tier Evaluation
      const winMultiplier = finalWinForThisRound / bet;

      if (winMultiplier >= 20) {
        // CASINO JACKPOT SOUND EFFECT on any big win!
        soundService.playCasinoJackpot && soundService.playCasinoJackpot();
      }

      if (winMultiplier >= 500) {
        setBigWinModal({
          tier: 'max',
          title: '⚡ GATES OF SWAGUS MAX WIN! ⚡',
          amount: finalWinForThisRound,
          label: `${winMultiplier.toFixed(0)}X JACKPOT! ЗЕВС В ШОКЕ!`
        });
      } else if (winMultiplier >= 100) {
        setBigWinModal({
          tier: 'sensational',
          title: '🔥 SENSATIONAL WIN! 🔥',
          amount: finalWinForThisRound,
          label: `${winMultiplier.toFixed(0)}X СЕНСАЦИОННЫЙ ЗАНОС!`
        });
      } else if (winMultiplier >= 50) {
        setBigWinModal({
          tier: 'mega',
          title: '👑 MEGA WIN! 👑',
          amount: finalWinForThisRound,
          label: `${winMultiplier.toFixed(0)}X МЕГА ЗАНОС ОЛИМПА!`
        });
      } else if (winMultiplier >= 20) {
        setBigWinModal({
          tier: 'big',
          title: '✨ BIG WIN! ✨',
          amount: finalWinForThisRound,
          label: `${winMultiplier.toFixed(0)}X КРУПНЫЙ КУШ!`
        });
      } else {
        setRegularWinToast({
          amount: finalWinForThisRound,
          title: tumblesCount > 1 ? `ЛАВИНА (${tumblesCount} КАСКАДА)!` : 'ВЫИГРЫШ!'
        });
        setTimeout(() => setRegularWinToast(null), 3000);
      }
    } else {
      // LOSS on spin: Small breathing pause then Play "aw dang it.mp3"
      await new Promise(res => setTimeout(res, 200));
      soundService.playAwDangIt && soundService.playAwDangIt();
    }

    setIsSpinning(false);
  };

  const handleAskMacan = () => {
    const quote = MACAN_MOTIVATIONS[Math.floor(Math.random() * MACAN_MOTIVATIONS.length)];
    setMacanTip(quote);
    setShowMacanBubble(true);
    soundService.playClick && soundService.playClick();
    setTimeout(() => setShowMacanBubble(false), 5000);
  };

  return (
    <div className={`gates-swagus-root ${isFreeSpinsActive ? 'free-spins-active' : ''} ${screenShaking ? 'screen-shake' : ''}`}>
      {/* Dynamic Olympus Background */}
      <div 
        className="gates-swagus-backdrop"
        style={{ backgroundImage: `url(${olympusBg})` }}
      />
      <div className="gates-swagus-overlay" />

      {/* Screen-wide thunder flash */}
      {thunderActive && <div className="thunder-flash" />}

      {/* Screen-wide Zeus Laser Stage Overlay */}
      {zeusLasersActive && (
        <div className="zeus-laser-stage-overlay">
          <div className="zeus-laser-beam beam-left-eye" />
          <div className="zeus-laser-beam beam-right-eye" />
          <div className="zeus-laser-impact-spot" />
        </div>
      )}

      {/* Win toast */}
      {regularWinToast && (
        <div className="regular-win-toast">
          <span className="toast-icon">⚡</span>
          <div>
            <div className="toast-win-title">{regularWinToast.title}</div>
            {regularWinToast.amount > 0 && (
              <div className="toast-win-sum">+{regularWinToast.amount.toLocaleString()} SWAG!</div>
            )}
          </div>
        </div>
      )}

      {/* Grand Big Win Modal */}
      {bigWinModal && (
        <div className="big-win-modal-backdrop" onClick={() => setBigWinModal(null)}>
          <div className="big-win-modal-card" onClick={e => e.stopPropagation()}>
            <div className="big-win-banner-title">{bigWinModal.title}</div>
            <div className="big-win-tier-text">{bigWinModal.label}</div>
            <div className="big-win-amount-counter">
              +{bigWinModal.amount.toLocaleString()} SWAG
            </div>
            <button className="big-win-collect-btn" onClick={() => setBigWinModal(null)}>
              ЗАБРАТЬ ЗОЛОТО ОЛИМПА
            </button>
          </div>
        </div>
      )}

      {/* Bonus Concluded Modal */}
      {bonusFinishedModal && (
        <div className="big-win-modal-backdrop" onClick={() => setBonusFinishedModal(null)}>
          <div className="big-win-modal-card" onClick={e => e.stopPropagation()}>
            <div className="big-win-banner-title">⚡ БОНУСКА ЗАВЕРШЕНА! ⚡</div>
            <div className="big-win-tier-text">
              15 FREE SPINS • ИТОГОВЫЙ МНОЖИТЕЛЬ: {bonusFinishedModal.multiplier}x
            </div>
            <div className="big-win-amount-counter" style={{ color: '#00ffcc' }}>
              +{bonusFinishedModal.totalWon.toLocaleString()} SWAG
            </div>
            <button className="big-win-collect-btn" onClick={() => setBonusFinishedModal(null)}>
              ПРОДОЛЖИТЬ ИГРУ
            </button>
          </div>
        </div>
      )}

      <div className="gates-content-layer">
        {/* Header bar */}
        <div className="gates-header-bar">
          {/* Free spins status badge */}
          {isFreeSpinsActive ? (
            <div className="free-spins-indicator-badge">
              <span className="fs-flame">🔥</span>
              <span className="fs-text">FREE SPINS: {freeSpinsLeft}</span>
              <span className="fs-global-multiplier-pill">МНОЖИТЕЛЬ: {globalMultiplier}x</span>
            </div>
          ) : (
            <div className="gates-hud-balance">
              <span className="hud-bal-label">ТЕКУЩИЙ БАЛАНС:</span>
              <span className="hud-bal-val">💎 {balance.toLocaleString()} SWAG</span>
            </div>
          )}

          {/* Logo & Subtitle */}
          <div className="gates-title-cluster">
            <div className="gates-main-logo">
              <span className="gates-logo-bolt">⚡</span>
              <span className="gates-title-text">GATES of SWAGUS</span>
              <span className="gates-trademark">™</span>
              <span className="gates-logo-bolt">⚡</span>
            </div>
            <div className="gates-subtitle-pay">
              Хайповая бурмалда / Рай гемблеров / Жесткий хасл бабок
            </div>
          </div>

          <div className="gates-hud-balance">
            <span className="hud-bal-label">СТАВКА:</span>
            <span className="hud-bal-val" style={{ color: '#ffd700' }}>
              {bet} SWAG
            </span>
          </div>
        </div>

        {/* Main 3-column Stage */}
        <div className="gates-main-stage">
          {/* Left panel: Referral Free Spins Hub, Gambler Meme & Macan */}
          <div className="gates-left-sidebar">
            {/* Referral Free Spins Card */}
            <div className="referral-fs-hub-card">
              <div className="referral-fs-header">
                <span className="ref-fs-icon">🎁</span>
                <span className="ref-fs-title">РЕФЕРАЛЬНЫЕ ФРИСПИНЫ</span>
              </div>

              <div className="ref-spins-balance-row">
                <span className="ref-spins-label">ОСТАЛОСЬ:</span>
                <span className="ref-spins-value">{referralFreeSpins} FS</span>
              </div>

              <button 
                className="use-free-spin-btn"
                onClick={() => handleSpin(true)}
                disabled={isSpinning || referralFreeSpins <= 0}
                title="Использовать 1 фриспин вместо списания SWAG коинов"
              >
                <span>⚡</span> КРУТИТЬ ЗА 1 ФРИСПИН
              </button>

              <div className="ref-invite-divider" />

              <div className="ref-link-box">
                <div className="ref-link-desc">Твоя рефералка для пополнения:</div>
                <div className="ref-input-group">
                  <input 
                    type="text" 
                    readOnly 
                    value={referralLink} 
                    className="ref-url-field" 
                  />
                  <button 
                    className="ref-copy-btn"
                    onClick={handleCopyReferralLink}
                  >
                    {refLinkCopied ? '✓' : 'Копия'}
                  </button>
                </div>
              </div>

              <button 
                className="invite-friend-action-btn"
                onClick={handleInviteFriend}
              >
                <span>🤝</span> Пригласить кента (+5 FS)
              </button>

              <div className="ref-rules-badge">
                🔒 Фриспины нельзя купить — только заработать через рефералку!
              </div>

              {/* Zeus Slow-Mo Toggle */}
              <button 
                className={`zeus-slowmo-toggle-btn ${isZeusSlowMo ? 'active' : ''}`}
                onClick={() => setIsZeusSlowMo(prev => !prev)}
                title="Переключить слоу-моу режим Зевса"
              >
                <span>⏳</span> СЛОУ-МОУ ЗЕВСА: {isZeusSlowMo ? 'ВКЛ' : 'ВЫКЛ'}
              </button>
            </div>

            {/* 99% of Gamblers Miner Meme Card */}
            <div className="gambler-meme-card">
              <div className="meme-header">
                <span>⛏️</span>
                <span>УГОЛОК ГЕМБЛЕРА 99%</span>
              </div>

              <div className="meme-img-container" title="99% гемблеров уходят за шаг до заноса!">
                <img 
                  src={gamblerMeme} 
                  alt="99% of gamblers quit right before they hit big" 
                  className="gambler-meme-img"
                />
              </div>

              <div className="meme-caption">
                «99% гемблеров бросают кирку прямо перед стеной алмазов. Не будь среди них!»
              </div>

              <div className="luck-meter-box">
                <div className="luck-meter-label">
                  <span>ШАНС НА ЗАНОС СЕЙЧАС:</span>
                  <span className="luck-meter-val">99.8%</span>
                </div>
                <div className="luck-bar-track">
                  <div className="luck-bar-fill"></div>
                </div>
              </div>

              <button className="macan-wisdom-btn" onClick={handleAskMacan}>
                <span>🤝</span> Спросить совет у Макана
              </button>

              {showMacanBubble && (
                <div className="macan-live-bubble">
                  {macanTip}
                </div>
              )}
            </div>
          </div>

          {/* Center: 6x5 Golden Cascading Grid */}
          <div className="gates-grid-wrapper">
            {/* Ornate Greek corners */}
            <div className="grid-corner-decor tl" />
            <div className="grid-corner-decor tr" />
            <div className="grid-corner-decor bl" />
            <div className="grid-corner-decor br" />

            {/* Tumble stats & multiplier sum bar */}
            <div className="tumble-stats-banner">
              <div className="tumble-win-counter">
                <span>ТЕКУЩИЙ ВЫИГРЫШ СПИНА:</span>
                <span className="tumble-win-val">
                  {currentRoundWin > 0 ? `+${currentRoundWin.toLocaleString()} SWAG` : '0 SWAG'}
                </span>
              </div>

              {roundMultipliers.length > 0 && (
                <div className="tumble-multipliers-display">
                  <span>МНОЖИТЕЛИ:</span>
                  {roundMultipliers.map((m, idx) => (
                    <span key={idx} className="multiplier-orb-badge">
                      {m.val}x
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 6 Columns x 5 Rows Grid */}
            <div className="slots-6x5-grid">
              {grid.map((col, colIdx) => (
                <div key={colIdx} className="grid-column">
                  {col.map((cell, rowIdx) => {
                    const cellKey = `${colIdx}_${rowIdx}`;
                    const isWinning = winningCells.has(cellKey);
                    const isDisintegrating = disintegratingCells.has(cellKey);

                    return (
                      <div
                        key={cell.id}
                        className={`symbol-cell ${isWinning ? 'winning' : ''} ${isDisintegrating ? 'disintegrating' : ''} ${cell.type === 'scatter' ? 'scatter-cell' : ''} ${cell.type === 'multiplier' ? 'multiplier-cell' : ''}`}
                      >
                        <div className="symbol-icon-wrapper">
                          {cell.type === 'multiplier' ? (
                            <div className={`multiplier-orb-sphere ${cell.color}`}>
                              <span className="orb-wings">⚡</span>
                              <span>{cell.val}X</span>
                            </div>
                          ) : (
                            <>
                              <span className="symbol-graphic">{cell.icon}</span>
                              {cell.type === 'scatter' && (
                                <span className="scatter-badge-label">SCATTER</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar: Zeus Swagus Character, Eye Lasers, & Session Stats */}
          <div className="gates-zeus-sidebar">
            <div className={`zeus-character-card ${zeusState} ${isZeusSlowMo ? 'slow-mo' : ''} ${zeusLasersActive ? 'laser-firing' : ''}`}>
              <div className="zeus-speech-bubble">
                {zeusQuote}
              </div>

              <div className="zeus-avatar-frame">
                <img src={zeusImg} alt="Zeus God of SWAGUS" className="zeus-img-media" />
                
                {/* Laser eye flares */}
                <div className={`zeus-eye-flare eye-left ${zeusLasersActive ? 'active' : ''}`} />
                <div className={`zeus-eye-flare eye-right ${zeusLasersActive ? 'active' : ''}`} />
                
                <div className="zeus-aura-ring" />
              </div>

              <div className="zeus-title-tag">
                <span>⚡</span>
                <span>ZEUS SWAGUS GOD</span>
                <span>⚡</span>
              </div>

              {isZeusSlowMo && (
                <div className="zeus-slowmo-indicator">
                  ⏳ ЗЕВС В СЛОУ-МОУ
                </div>
              )}

              {zeusLasersActive && (
                <div className="zeus-strike-indicator">
                  🔴 ЛАЗЕРЫ ИЗ ГЛАЗ ЗЕВCА!
                </div>
              )}
            </div>

            {/* Session Stats Card */}
            <div className="zeus-stats-card">
              <div className="stat-row-item">
                <span className="stat-k">Спинов за сессию:</span>
                <span className="stat-v cyan">{sessionStats.spins}</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-k">Скаттеров выпало:</span>
                <span className="stat-v gold">{sessionStats.scattersHit}</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-k">Бонусок поймано:</span>
                <span className="stat-v">{sessionStats.bonusesTriggered}</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-k">Максимальный занос:</span>
                <span className="stat-v gold">
                  {sessionStats.maxWin > 0 ? `${sessionStats.maxWin.toLocaleString()} SWAG` : '0'}
                </span>
              </div>
            </div>

            {/* YouTube Intro Music Panel */}
            <div className="zeus-youtube-panel">
              <div className="youtube-panel-header">
                <span className="yt-icon">🔥</span>
                <span className="yt-title">Самые крутецкие песни для интро!</span>
              </div>
              <div className="youtube-iframe-wrapper">
                <iframe
                  src="https://www.youtube.com/embed/L4FHnzid-VM?list=RDGMEMQ1dJ7wXfLlqCjwV0xfSNbA"
                  title="Самые крутецкие песни для интро!"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="youtube-iframe"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls Dock */}
        <div className="gates-controls-dock">
          {/* Bet Selector */}
          <div className="bet-management-cluster">
            <div className="bet-label-stack">
              <span className="bet-caption">СТАВКА ЗА SWAG</span>
              <span className="bet-total-amt">{bet} SWAG</span>
            </div>
            <div className="bet-buttons-row">
              {[10, 25, 50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  className={`quick-bet-btn ${bet === amt ? 'active' : ''}`}
                  onClick={() => !isSpinning && setBet(amt)}
                  disabled={isSpinning}
                >
                  {amt}
                </button>
              ))}
              <button 
                className="quick-bet-btn max-btn"
                onClick={() => !isSpinning && setBet(Math.min(balance, 1000) || 500)}
                disabled={isSpinning}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Center Spin Cluster: Coin Bet + Free Spin Button */}
          <div className="center-spin-cluster">
            <button 
              className={`gates-spin-button ${isSpinning ? 'spinning-active' : ''}`}
              onClick={() => handleSpin(false)}
              disabled={isSpinning}
              title={`Крутить Gates of SWAGUS™ за ${bet} SWAG!`}
            >
              <span>{isSpinning ? '⚡' : '🔄'}</span>
              <span className="spin-btn-label">КРУТИТЬ ({bet} SWAG)</span>
            </button>

            {referralFreeSpins > 0 && (
              <button 
                className="quick-free-spin-btn"
                onClick={() => handleSpin(true)}
                disabled={isSpinning}
                title="Сделать бесплатный спин за реферальные очки"
              >
                🎁 ФРИСПИН ({referralFreeSpins})
              </button>
            )}
          </div>

          {/* Secondary Controls (Turbo, Autoplay) */}
          <div className="extra-controls-cluster">
            <button 
              className={`toggle-switch-btn ${isTurbo ? 'active' : ''}`}
              onClick={() => setIsTurbo(!isTurbo)}
            >
              <span>⚡</span> {isTurbo ? 'ТУРБО: ВКЛ' : 'ТУРБО: ВЫКЛ'}
            </button>

            <button 
              className={`toggle-switch-btn ${autoPlayCount > 0 ? 'active' : ''}`}
              onClick={() => {
                if (autoPlayCount > 0) setAutoPlayCount(0);
                else setAutoPlayCount(25);
              }}
            >
              <span>🔁</span> {autoPlayCount > 0 ? `АВТО: ${autoPlayCount}` : 'АВТО (25)'}
            </button>
          </div>
        </div>

        {/* Quick Paytable Drawer */}
        <div className="paytable-drawer">
          <div className="pay-card-pill">
            <span className="pay-sym">👑</span>
            <span>Корона: 12+ = </span>
            <span className="pay-val">50X</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">⏳</span>
            <span>Часы: 12+ = </span>
            <span className="pay-val">25X</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">💍</span>
            <span>Кольцо: 12+ = </span>
            <span className="pay-val">15X</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">🏆</span>
            <span>Кубок: 12+ = </span>
            <span className="pay-val">12X</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">🔴</span>
            <span>Рубин: 12+ = </span>
            <span className="pay-val">10X</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">⚡</span>
            <span>4 Скаттера: </span>
            <span className="pay-val">15 FREE SPINS</span>
          </div>
          <div className="pay-card-pill">
            <span className="pay-sym">🔮</span>
            <span>Множители: </span>
            <span className="pay-val">2X - 500X</span>
          </div>
        </div>
      </div>
    </div>
  );
}
