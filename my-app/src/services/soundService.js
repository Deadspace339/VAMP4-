// ===================================================
// SWAG INC. AUDIO ENGINE
// Воспроизведение трека «свэг321.mp3»
// СТРОГО БЕЗ ЦИКЛА (loop = false, только 1 раз)
// ===================================================

let _themeAudio = null;
const AUDIO_FILE_PRIMARY = encodeURI('/свэг321.mp3');
const AUDIO_FILE_FALLBACK = '/swag321.mp3';

let _letnikAudio = null;
let _letnikAudioCtx = null;
let _letnikSourceNode = null;
let _letnikBassNode = null;
const LETNIK_PRIMARY = encodeURI('/letnik.mp3');
const LETNIK_FALLBACK = encodeURI('/летник.mp3');

export const soundService = {
  /**
   * Получить Audio элемент для трека «Летник» (Founder VIP Studio)
   */
  getLetnikAudio() {
    if (typeof window === 'undefined') return null;

    if (!_letnikAudio) {
      _letnikAudio = new Audio(LETNIK_PRIMARY);
      _letnikAudio.loop = false;
      _letnikAudio.volume = 0.85;

      _letnikAudio.addEventListener('error', () => {
        if (!_letnikAudio.src.includes('летник.mp3')) {
          console.log('[SoundService] Switching to fallback Letnik audio source');
          _letnikAudio.src = LETNIK_FALLBACK;
          _letnikAudio.load();
        }
      });

      _letnikAudio.addEventListener('play', () => {
        window.dispatchEvent(new CustomEvent('swag_letnik_playback_change', { detail: { isPlaying: true } }));
      });
      _letnikAudio.addEventListener('pause', () => {
        window.dispatchEvent(new CustomEvent('swag_letnik_playback_change', { detail: { isPlaying: false } }));
      });
      _letnikAudio.addEventListener('ended', () => {
        window.dispatchEvent(new CustomEvent('swag_letnik_playback_change', { detail: { isPlaying: false } }));
      });
    }

    return _letnikAudio;
  },

  /**
   * Воспроизведение трека «Летник» (Founder Exclusive)
   */
  playLetnik(options = {}) {
    if (typeof window === 'undefined') return;
    const audio = this.getLetnikAudio();
    if (!audio) return;

    if (options.loop !== undefined) audio.loop = options.loop;
    if (options.volume !== undefined) audio.volume = options.volume;
    if (options.speed !== undefined) audio.playbackRate = options.speed;

    if (options.bassBoost) {
      this.applyLetnikBassBoost(true);
    }

    const p = audio.play();
    if (p !== undefined) {
      p.catch(err => console.log('[SoundService] Letnik play waiting for user gesture:', err));
    }
    window.dispatchEvent(new CustomEvent('swag_letnik_playback_change', { detail: { isPlaying: true } }));
  },

  pauseLetnik() {
    if (_letnikAudio) {
      _letnikAudio.pause();
      window.dispatchEvent(new CustomEvent('swag_letnik_playback_change', { detail: { isPlaying: false } }));
    }
  },

  toggleLetnik() {
    if (this.isLetnikPlaying()) {
      this.pauseLetnik();
    } else {
      this.playLetnik();
    }
  },

  seekLetnik(timeSeconds) {
    if (_letnikAudio && Number.isFinite(timeSeconds)) {
      _letnikAudio.currentTime = Math.max(0, Math.min(timeSeconds, _letnikAudio.duration || 1000));
    }
  },

  setLetnikVolume(vol) {
    if (_letnikAudio) {
      _letnikAudio.volume = Math.max(0, Math.min(1, vol));
    }
  },

  setLetnikSpeed(rate) {
    if (_letnikAudio) {
      _letnikAudio.playbackRate = rate;
    }
  },

  setLetnikLoop(loop) {
    if (_letnikAudio) {
      _letnikAudio.loop = !!loop;
    }
  },

  isLetnikPlaying() {
    return !!(_letnikAudio && !_letnikAudio.paused && !_letnikAudio.ended && _letnikAudio.currentTime > 0);
  },

  applyLetnikBassBoost(enable) {
    try {
      if (!_letnikAudioCtx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && _letnikAudio) {
          _letnikAudioCtx = new AudioCtx();
          _letnikSourceNode = _letnikAudioCtx.createMediaElementSource(_letnikAudio);
          _letnikBassNode = _letnikAudioCtx.createBiquadFilter();
          _letnikBassNode.type = 'lowshelf';
          _letnikBassNode.frequency.value = 160;
          _letnikBassNode.gain.value = enable ? 14 : 0;
          _letnikSourceNode.connect(_letnikBassNode);
          _letnikBassNode.connect(_letnikAudioCtx.destination);
        }
      } else if (_letnikBassNode) {
        _letnikBassNode.gain.value = enable ? 14 : 0;
      }
    } catch (e) {
      console.warn('[SoundService] Bass boost effect:', e);
    }
  },

  /**
   * Получить или создать Audio элемент для трека «свэг321.mp3»
   */
  getAudio() {
    if (typeof window === 'undefined') return null;

    if (!_themeAudio) {
      _themeAudio = new Audio(AUDIO_FILE_PRIMARY);
      _themeAudio.loop = false; // СТРОГО БЕЗ ЦИКЛА: 1 раз
      _themeAudio.volume = 0.65;

      // Если возникнет ошибка кодировки имени файла в браузере, переключаемся на fallback
      _themeAudio.addEventListener('error', () => {
        if (!_themeAudio.src.includes('swag321.mp3')) {
          console.log('[SoundService] Switching to fallback audio source');
          _themeAudio.src = AUDIO_FILE_FALLBACK;
          _themeAudio.load();
        }
      });
    }

    return _themeAudio;
  },

  /**
   * Запуск трека свэг321 один раз (loop = false)
   * СТРОГО ТОЛЬКО НА СТРАНИЦЕ WEB 1.0 (Маркетплейс)
   * @param {boolean} forceRestart - если true, сбрасывает на 0 и перезапускает
   */
  playSwagAudioOnce(forceRestart = false) {
    if (typeof window === 'undefined') return;

    // ПРОВЕРКА: свэг321 играет СТРОГО на странице Web 1.0 и нигде больше!
    const currentPath = window.location.pathname;
    const isWeb1 = currentPath === '/' || currentPath === '/marketplace' || currentPath === '/home';
    if (!isWeb1) {
      this.stop();
      return;
    }

    const audio = this.getAudio();
    if (!audio) return;

    audio.loop = false; // Гарантия: строго без зацикливания

    // Если аудио уже играет и не требуется принудительный рестарт — не прерываем
    if (this.isPlaying() && !forceRestart) {
      return;
    }

    if (forceRestart) {
      audio.currentTime = 0;
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log('[SoundService] Playback waiting for user gesture:', err?.message || err);
      });
    }
  },

  /**
   * Воспроизведение после авторизации (только если перешли на Web 1.0)
   */
  playAfterAuth() {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/' || p === '/marketplace' || p === '/home') {
        this.playSwagAudioOnce(true);
      }
    }
  },

  /**
   * Воспроизведение при переходе на главную страницу (1 раз, без цикла)
   */
  playOnMainPage() {
    // Если трек уже играет (например, только что запустился после авторизации/регистрации),
    // не прерываем его, пусть доигрывает свой 1 раз
    if (this.isPlaying()) {
      return;
    }
    this.playSwagAudioOnce(false);
  },

  // Алиас для обратной совместимости
  playLetnikOnce(force = false) {
    this.playSwagAudioOnce(force);
  },

  stop() {
    if (_themeAudio) {
      _themeAudio.pause();
      _themeAudio.currentTime = 0;
    }
  },

  pause() {
    if (_themeAudio) {
      _themeAudio.pause();
    }
  },

  resume() {
    if (_themeAudio) {
      _themeAudio.loop = false;
      _themeAudio.play().catch(() => {});
    }
  },

  isPlaying() {
    return !!(_themeAudio && !_themeAudio.paused && !_themeAudio.ended && _themeAudio.currentTime > 0);
  },

  /**
   * Воспроизведение звука МУЛЬТИКАСТА Огр Мага (каскадный перезвон колоколов)
   * @param {number} multiplier - кратность мультикаста (2, 3 или 4)
   */
  playMulticast(multiplier = 2) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const count = Math.min(notes.length, multiplier + 1);
      
      notes.slice(0, count).forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.13);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + idx * 0.13 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.13 + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.13);
        osc.stop(ctx.currentTime + idx * 0.13 + 0.65);
      });
    } catch (e) {
      console.warn('[SoundService] WebAudio multicast error:', e);
    }
  },

  /**
   * Воспроизведение звука аплодисментов/хлопков Огр Мага
   */
  playClap() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime + i * 0.14);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.14 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.14);
        osc.stop(ctx.currentTime + i * 0.14 + 0.1);
      }
    } catch {}
  },

  // ===================================================
  // GATES OF SWAGUS™ AUDIO ENGINE (WEB AUDIO SYNTHESIZER)
  // ===================================================

  /** Звук вращения и падения барабанов */
  playSwagusSpin() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } catch {}
  },

  /** Звук выпадения Scatter (Зевс) с нарастанием напряжения */
  playScatterHit(count = 1) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const baseFreqs = [440, 554.37, 659.25, 880, 1108.73];
      const freq = baseFreqs[Math.min(count - 1, baseFreqs.length - 1)];

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.35);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 0.52);
      osc2.stop(ctx.currentTime + 0.52);
    } catch {}
  },

  /** Гром и молния Зевса (бросок множителя) */
  playZeusThunder() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Низкочастотный саб-удар грома
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.6);
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start();
      subOsc.stop(ctx.currentTime + 0.72);

      // Электрический треск разряда молнии
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
    } catch {}
  },

  /** Звук взрыва и исчезновения выигрышных символов (Tumble) */
  playTumbleExplosion() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = [520, 780, 1040];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(f * 0.5, ctx.currentTime + idx * 0.04 + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 0.2);
      });
    } catch {}
  },

  /** Звук выпадения или активации множителя (2x - 500x) */
  playMultiplierOrb() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch {}
  },

  /** Звук подсчета монет при выигрыше */
  playCoinCount() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  },

  /** Победная фанфара (BIG WIN, MEGA WIN, SENSATIONAL, MAX WIN) */
  playBigWinFanfare(tier = 'big') {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const chords = [
        [523.25, 659.25, 783.99],       // C
        [587.33, 739.99, 880.00],       // D
        [659.25, 830.61, 987.77],       // E
        [783.99, 987.77, 1174.66, 1567.98] // G + high octave
      ];

      chords.forEach((chord, chordIdx) => {
        const time = ctx.currentTime + chordIdx * 0.18;
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.45);
        });
      });
    } catch {}
  },

  /** Запуск бонусной игры 15 Free Spins */
  playFreeSpinsTrigger() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [440, 554, 659, 880, 1108, 1318, 1760];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.75);
      });
    } catch {}
  },

  /** Звук выстрела из AWP (при выигрыше) — реальный аудиофайл */
  playAwpShot() {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio('/awp_shot.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const fallback = new Audio('/Awp.mp3');
          fallback.volume = 1.0;
          fallback.play().catch(() => {});
        });
      }
    } catch (e) {
      console.warn('[SoundService] playAwpShot error:', e);
    }
  },

  /** Звук проигрыша: реальный аудиофайл «aw dang it.mp3» */
  playAwDangIt() {
    if (typeof window === 'undefined') return;
    try {
      if (this._voiceAudio) {
        this._voiceAudio.pause();
        this._voiceAudio.currentTime = 0;
      }
      this._voiceAudio = new Audio('/aw_dang_it.mp3');
      this._voiceAudio.volume = 0.95;
      this._voiceAudio.play().catch(e => console.log('[SoundService] Aw dang it playback:', e));
    } catch (e) {
      console.warn('[SoundService] playAwDangIt error:', e);
    }
  },

  /** Алиас для обратной совместимости */
  playLetsGoGamblingLoss() {
    this.playAwDangIt();
  },

  /** Звук джекпота в казино — реальный аудиофайл */
  playCasinoJackpot() {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio('/casino_jackpot.mp3');
      audio.volume = 0.85;
      audio.play().catch(e => console.log('[SoundService] Jackpot playback:', e));
    } catch (e) {
      console.warn('[SoundService] playCasinoJackpot error:', e);
    }
  },

  /** Мем-озвучка старта вращения: реальный аудиофайл «start gambling.mp3» */
  playStartGambling() {
    if (typeof window === 'undefined') return;
    try {
      if (this._voiceAudio) {
        this._voiceAudio.pause();
        this._voiceAudio.currentTime = 0;
      }
      this._voiceAudio = new Audio('/start_gambling.mp3');
      this._voiceAudio.volume = 0.95;
      this._voiceAudio.play().catch(e => console.log('[SoundService] Start gambling playback:', e));
    } catch (e) {
      console.warn('[SoundService] playStartGambling error:', e);
    }
  },

  /** Алиас для обратной совместимости */
  playLetsGoGamblingStart() {
    this.playStartGambling();
  },

  /** Тибетский молитвенный барабан: поющий колокол и гармонический резонанс мантры (432 Гц) */
  playPrayerWheelSpin() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Гармоники поющей чаши (Singing bowl / Prayer wheel gong)
      const harmonics = [216, 432, 864, 1296, 1728];
      harmonics.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);

        const amp = 0.22 / (idx + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + idx * 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.0 + idx * 0.2);
      });

      // Металлический перезвон колокольчиков навершия
      for (let i = 0; i < 3; i++) {
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(2400 + i * 400, now + i * 0.12);
        bellGain.gain.setValueAtTime(0.08, now + i * 0.12);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);

        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);
        bellOsc.start(now + i * 0.12);
        bellOsc.stop(now + i * 0.12 + 0.4);
      }
    } catch (e) {
      console.warn('[SoundService] playPrayerWheelSpin error:', e);
    }
  },

  // ===================================================
  // ЗВУКОВОЙ ДВИЖОК ТЕЛЕФОННОГО ЗВОНКА (МЕССЕНДЖЕР E2EE)
  // ===================================================
  _ringtoneTimer: null,
  _ringtoneCtx: null,

  /**
   * Начать реальный телефонный гудок / звонок (Dual-Tone 440Hz + 480Hz)
   */
  startCallRingtone() {
    if (typeof window === 'undefined') return;
    this.stopCallRingtone();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this._ringtoneCtx = new AudioCtx();

      const playPulse = () => {
        if (!this._ringtoneCtx) return;
        try {
          const now = this._ringtoneCtx.currentTime;
          // Стандартный телефонный гудок вызова: 440 Гц + 480 Гц
          const osc1 = this._ringtoneCtx.createOscillator();
          const osc2 = this._ringtoneCtx.createOscillator();
          const gain = this._ringtoneCtx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
          gain.gain.setValueAtTime(0.18, now + 1.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this._ringtoneCtx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.55);
          osc2.stop(now + 1.55);
        } catch (e) {
          console.warn('[SoundService] Ringtone pulse error:', e);
        }
      };

      playPulse();
      // Звонит 1.5 сек, пауза 2 сек -> общий цикл 3.5 сек
      this._ringtoneTimer = setInterval(playPulse, 3500);
    } catch (e) {
      console.warn('[SoundService] startCallRingtone error:', e);
    }
  },

  /**
   * Остановить звонок
   */
  stopCallRingtone() {
    if (this._ringtoneTimer) {
      clearInterval(this._ringtoneTimer);
      this._ringtoneTimer = null;
    }
    if (this._ringtoneCtx) {
      try {
        this._ringtoneCtx.close();
      } catch {}
      this._ringtoneCtx = null;
    }
  },

  /**
   * Звук сброса звонка / занято (3 коротких гудка)
   */
  playCallEnded() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now + i * 0.4);

        gain.gain.setValueAtTime(0.15, now + i * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.4 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.4);
        osc.stop(now + i * 0.4 + 0.3);
      }
    } catch {}
  },

  // ===================================================
  // ЗВУКОВОЙ ДВИЖОК CLASH ROYALE (ДЛЯ IPHONE 6)
  // ===================================================
  /** Высадка карты (Свист воздуха и удар) */
  playClashCardDeploy() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Свист
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  },

  /** Легендарный смех Короля: «HE-HE-HE-HA!» */
  playClashHeheheha() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Четыре ноты: ХЕ (523), ХЕ (587), ХЕ (659), ХААА! (784 -> 392)
      const freqs = [523, 587, 659, 784];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 3 ? 'sawtooth' : 'triangle';
        const startT = now + idx * 0.16;
        const dur = idx === 3 ? 0.45 : 0.12;

        osc.frequency.setValueAtTime(freq, startT);
        if (idx === 3) {
          osc.frequency.exponentialRampToValueAtTime(440, startT + dur);
        }

        gain.gain.setValueAtTime(0.25, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startT);
        osc.stop(startT + dur + 0.05);
      });
    } catch {}
  },

  /** Удар башни / фаербол */
  playClashTowerHit() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch {}
  },

  /** Заполнение шкалы эликсира (Пузырьки) */
  playClashElixirFull() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [880, 1100, 1320].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch {}
  },

  /** Звук быстрого сохранения GTA 5 */
  playGtaSave() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch {}
  },

  /** Щелчок затвора камеры Snapmatic */
  playCameraShutter() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  },

  /** Звук набора номера / гудка */
  playPhoneDial() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [697, 1209].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      });
    } catch {}
  },

  /** Двойной телефонный гудок вызова */
  playPhoneRing() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [440, 480].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.15);
      });
    } catch {}
  },

  /** Сброс звонка / занято */
  playPhoneHangup() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [0, 0.15, 0.3].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now + offset);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    } catch {}
  },

  /** Сигнал доставки авто от механика */
  playGtaCarBeep() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [0, 0.14].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, now + offset);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {}
  }
};


