import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { mediaStore } from '../services/mediaStore';
import { soundService } from '../services/soundService';
import { backendService } from '../services/backendService';
import macanImg from '../assets/macan-brat.jpg';
import crownImg from '../assets/plashka.png';
import shieldImg from '../assets/plashka2.png';
import fivePlusImg from '../assets/five_plus.svg';
import okHatImg from '../assets/odnoklassniki_hat.svg';

const ProfilePage = ({ balance, onMint }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'my-shorts';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [myShorts, setMyShorts] = useState(() => db.getMyShorts());
  const [drafts, setDrafts] = useState(() => db.getDrafts());
  const [allShorts, setAllShorts] = useState(() => db.getShorts());
  const [user, setUser] = useState(() => db.getUser());

  // Студия загрузки (Creator Studio)
  const [studioTitle, setStudioTitle] = useState('');
  const [studioDesc, setStudioDesc] = useState('');
  const [studioSound, setStudioSound] = useState('');
  const [studioTags, setStudioTags] = useState('#swag #vamp4 #macan');
  const [studioMedia, setStudioMedia] = useState(null);
  const [studioRawBlob, setStudioRawBlob] = useState(null);
  const [studioMediaType, setStudioMediaType] = useState('video'); // 'video' or 'audio'
  const [studioCover, setStudioCover] = useState(null);
  const [studioCoverBlob, setStudioCoverBlob] = useState(null);
  const [studioFitMode, setStudioFitMode] = useState('contain'); // 'contain' or 'cover'
  const [studioIsPlaying, setStudioIsPlaying] = useState(true);
  const studioVideoRef = useRef(null);
  const studioAudioRef = useRef(null);

  // VIP Плеер «Летник» (Founder / Swag God Exclusive)
  const [letnikPlaying, setLetnikPlaying] = useState(() => soundService.isLetnikPlaying());
  const [letnikProgress, setLetnikProgress] = useState(0);
  const [letnikCurrentTime, setLetnikCurrentTime] = useState('0:00');
  const [letnikDuration, setLetnikDuration] = useState('2:45');
  const [letnikVolume, setLetnikVolume] = useState(0.85);
  const [letnikSpeed, setLetnikSpeed] = useState(1.0);
  const [letnikBassBoost, setLetnikBassBoost] = useState(false);
  const [letnikLoop, setLetnikLoop] = useState(false);

  // Редактирование профиля и Back-end безопасность
  const [editName, setEditName] = useState(user.name || 'MACAN');
  const [editHandle, setEditHandle] = useState(user.handle || '@macansssssssssss1337');
  const [editRole, setEditRole] = useState(user.role || 'FOUNDER');
  const [editRank, setEditRank] = useState(user.rank || 'SWAG GOD');
  const [editLevel, setEditLevel] = useState(user.level || 67);
  const [editBio, setEditBio] = useState(user.bio || 'Папа дома. Главный создатель узла VAMP4 в Сомали с пиратами. Вайбкодим b2b 67 ai pro soundcloud startup для плесени.');
  const [editAvatarHat, setEditAvatarHat] = useState(user.avatarHat || 'crown');
  const [editAvatarPreview, setEditAvatarPreview] = useState(user.avatar || macanImg);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registeredAccounts, setRegisteredAccounts] = useState(() => backendService.getAccounts());

  // Модалка предпросмотра клипа
  const [previewClip, setPreviewClip] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [modalIsPlaying, setModalIsPlaying] = useState(true);
  const [modalAudioProgress, setModalAudioProgress] = useState(0);
  const [modalAudioTime, setModalAudioTime] = useState('0:00 / 0:00');

  const previewVideoRef = useRef(null);
  const previewAudioRef = useRef(null);
  const modalAudioRef = useRef(null);

  const isFounder = user?.role === 'FOUNDER' || user?.rank === 'SWAG GOD' || user?.handle === '@macansssssssssss1337';

  useEffect(() => {
    if (previewClip) {
      setModalIsPlaying(true);
      setModalAudioProgress(0);
      setModalAudioTime('0:00 / 0:00');
    }
  }, [previewClip]);

  const handleModalAudioTimeUpdate = () => {
    if (modalAudioRef.current) {
      const cur = modalAudioRef.current.currentTime || 0;
      const dur = modalAudioRef.current.duration || 1;
      setModalAudioProgress((cur / dur) * 100);
      const m = Math.floor(cur / 60);
      const s = Math.floor(cur % 60).toString().padStart(2, '0');
      const dm = Math.floor(dur / 60) || 0;
      const ds = Math.floor(dur % 60).toString().padStart(2, '0');
      setModalAudioTime(`${m}:${s} / ${dm}:${ds}`);
    }
  };

  const handleModalSeek = (e) => {
    if (modalAudioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const dur = modalAudioRef.current.duration || 1;
      modalAudioRef.current.currentTime = pos * dur;
    }
  };

  const toggleModalAudio = () => {
    if (modalAudioRef.current) {
      if (modalIsPlaying) {
        modalAudioRef.current.pause();
        setModalIsPlaying(false);
      } else {
        modalAudioRef.current.play().catch(() => {});
        setModalIsPlaying(true);
      }
    }
  };

  // Синхронизация таба с URL параметром
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Подписка на обновления базы данных
  useEffect(() => {
    const handleShortsUpdate = (e) => {
      setAllShorts(e.detail);
      setMyShorts(db.getMyShorts());
    };
    const handleDraftsUpdate = (e) => {
      setDrafts(e.detail);
    };

    window.addEventListener('swag_shorts_updated', handleShortsUpdate);
    window.addEventListener('swag_drafts_updated', handleDraftsUpdate);

    return () => {
      window.removeEventListener('swag_shorts_updated', handleShortsUpdate);
      window.removeEventListener('swag_drafts_updated', handleDraftsUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Обработка выбора файла (видео, картинка или аудио) - МГНОВЕННО БЕЗ ЗАВИСАНИЙ
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    setStudioMediaType(isVideo ? 'video' : isImage ? 'image' : 'audio');
    setStudioRawBlob(file);

    // Instant ObjectURL - 0 мс лагов, 0 зависаний потока браузера!
    const objectUrl = URL.createObjectURL(file);
    setStudioMedia(objectUrl);
    setStudioIsPlaying(true);

    if (!studioTitle) {
      setStudioTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (!studioSound) {
      setStudioSound(isVideo ? 'Оригинальный звук клипа' : isImage ? 'Фоновый кибер-звук' : file.name);
    }
    showToast(`⚡ Файл «${file.name}» загружен в студию без зависаний!`);
  };

  // Выбор отдельной обложки (постера) для шортса
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioCoverBlob(file);
    const objUrl = URL.createObjectURL(file);
    setStudioCover(objUrl);
    showToast(`🖼️ Обложка «${file.name}» выбрана для клипа!`);
  };

  // Переключение воспроизведения/паузы в превью
  const toggleStudioPlay = (e) => {
    e?.stopPropagation();
    setStudioIsPlaying(prev => {
      const nextState = !prev;
      if (studioVideoRef.current) {
        if (nextState) studioVideoRef.current.play().catch(() => {});
        else studioVideoRef.current.pause();
      }
      if (studioAudioRef.current) {
        if (nextState) studioAudioRef.current.play().catch(() => {});
        else studioAudioRef.current.pause();
      }
      return nextState;
    });
  };

  // Быстрые пресеты для тестирования в 1 клик
  const applyPreset = (presetType) => {
    setStudioRawBlob(null);
    setStudioIsPlaying(true);
    if (presetType === 'letnik') {
      setStudioTitle('Тёмный принц, madk1d — Летник (Night Drift Demo)');
      setStudioDesc('Эксклюзивный дроп под сканлайны VAMP4. Басс на максимум! #letnik #vamp4 #drift');
      setStudioSound('Тёмный принц, madk1d — Летник');
      setStudioTags('#letnik #vamp4 #bass #drift');
      setStudioMediaType('audio');
      setStudioMedia('/letnik.mp3');
      showToast('🎵 Пресет «Летник» загружен в плеер!');
    } else if (presetType === 'cyber') {
      setStudioTitle('Porsche 911 Cyber Turbo // MACAN VAMP4 Mode');
      setStudioDesc('Ночной заезд по Неоновой Москве. 1000 л.с. и swag звук #porsche #macan #vamp');
      setStudioSound('MACAN — Ночной Заезд (Original Audio)');
      setStudioTags('#macan #porsche #turbo #vamp4');
      setStudioMediaType('audio');
      setStudioMedia('/letnik.mp3');
      showToast('🚗 Пресет «Porsche Cyber» загружен!');
    }
  };

  // Сохранить как ЧЕРНОВИК
  const handleSaveDraft = async (e) => {
    e?.preventDefault();
    if (!studioTitle.trim()) {
      alert('Укажите название черновика!');
      return;
    }

    const draftId = `draft-${Date.now()}`;
    if (studioRawBlob || studioCoverBlob) {
      await mediaStore.set('draft_media_' + draftId, {
        videoBlob: studioMediaType === 'video' ? studioRawBlob : null,
        audioBlob: studioMediaType === 'audio' ? studioRawBlob : null,
        coverBlob: studioCoverBlob || null,
        videoSrc: studioMediaType === 'video' ? studioMedia : null,
        poster: studioCover || null
      });
    }

    const formattedTags = studioTags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const newDraft = {
      id: draftId,
      title: studioTitle.trim(),
      description: studioDesc.trim() || 'Черновик шортса',
      soundTitle: studioSound.trim() || 'Оригинальный звук',
      tags: formattedTags,
      videoSrc: studioMediaType === 'video' ? studioMedia : null,
      imageSrc: studioMediaType === 'image' ? studioMedia : null,
      audioSrc: studioMediaType === 'audio' ? studioMedia : null,
      poster: studioCover || null,
      coverImage: studioCover || null,
      fitMode: studioFitMode,
      createdAt: new Date().toLocaleDateString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    db.addDraft(newDraft);
    showToast('📝 Клип успешно сохранен в ЧЕРНОВИКИ!');
    switchTab('drafts');
  };

  // Опубликовать НАПРЯМУЮ В ОБЩУЮ ЛЕНТУ
  const handlePublishToFeed = async (e) => {
    e?.preventDefault();
    if (!studioTitle.trim()) {
      alert('Пожалуйста, укажите название клипа!');
      return;
    }

    const clipId = `clip-${Date.now()}`;
    const rawBlobs = {
      videoBlob: studioMediaType === 'video' ? studioRawBlob : null,
      audioBlob: studioMediaType === 'audio' ? studioRawBlob : null,
      coverBlob: studioCoverBlob || null,
      poster: studioCover || null,
      videoSrc: studioMediaType === 'video' ? studioMedia : null,
      audioSrc: studioMediaType === 'audio' ? studioMedia : null
    };

    if (studioRawBlob || studioCoverBlob) {
      await mediaStore.set('media_' + clipId, rawBlobs);
    }

    const formattedTags = studioTags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const currentUser = user || db.getUser();
    const newClip = {
      id: clipId,
      author: currentUser?.handle || '@macan',
      authorName: currentUser?.name || 'SWAG CREATOR',
      authorAvatar: '/src/assets/macan-brat.jpg',
      description: studioDesc.trim() || studioTitle.trim(),
      soundTitle: studioSound.trim() || 'Оригинальный звук',
      videoSrc: studioMediaType === 'video' ? studioMedia : null,
      imageSrc: studioMediaType === 'image' ? studioMedia : null,
      audioSrc: studioMediaType === 'audio' ? studioMedia : '/letnik.mp3',
      poster: studioCover || null,
      coverImage: studioCover || null,
      fitMode: studioFitMode,
      likes: 12,
      commentsCount: 2,
      shares: 5,
      bgGradient: 'radial-gradient(circle at center, #2b0d00 0%, #0d0400 50%, #000000 100%)',
      tags: formattedTags,
      badge: 'CREATOR DROP',
      isMy: true,
      comments: [
        { id: 1, user: 'J.A.R.V.I.S.', text: 'Клип верифицирован и занесен в блокчейн VAMP4.', time: 'только что' }
      ]
    };

    await db.addShort(newClip, rawBlobs);
    showToast('🚀 ДРОП ОПУБЛИКОВАН В ОБЩЕЙ ЛЕНТЕ SHORTS!');
    
    // Сброс формы
    setStudioTitle('');
    setStudioDesc('');
    setStudioMedia(null);
    setStudioRawBlob(null);
    setStudioCover(null);
    setStudioCoverBlob(null);

    switchTab('my-shorts');
  };

  // Опубликовать черновик в общую ленту
  const handlePublishExistingDraft = (draftId) => {
    db.publishDraft(draftId);
    showToast('🚀 Черновик успешно опубликован в общую ленту!');
    switchTab('my-shorts');
  };

  // Удалить черновик
  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Точно удалить этот черновик?')) {
      db.deleteDraft(draftId);
      showToast('🗑️ Черновик удален');
    }
  };

  // Удалить клип из общей ленты
  const handleDeleteShort = (shortId) => {
    if (window.confirm('Удалить этот клип из общей ленты Shorts?')) {
      db.deleteShort(shortId);
      showToast('🗑️ Клип удален из ленты');
    }
  };

  // Загрузить данные черновика в студию для редактирования
  const handleEditDraftInStudio = (draft) => {
    setStudioTitle(draft.title || '');
    setStudioDesc(draft.description || '');
    setStudioSound(draft.soundTitle || '');
    setStudioTags((draft.tags || []).join(' '));
    if (draft.videoSrc) {
      setStudioMedia(draft.videoSrc);
      setStudioMediaType('video');
    } else if (draft.audioSrc) {
      setStudioMedia(draft.audioSrc);
      setStudioMediaType('audio');
    }
    setStudioFitMode(draft.fitMode || 'contain');
    switchTab('upload');
    showToast('✏️ Черновик загружен в Студию!');
  };

  // Подписка на плеер трека «Летник»
  useEffect(() => {
    const audio = soundService.getLetnikAudio();
    if (!audio) return;

    const handleTime = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 1;
      setLetnikProgress((cur / dur) * 100);
      const m = Math.floor(cur / 60);
      const s = Math.floor(cur % 60).toString().padStart(2, '0');
      const dm = Math.floor(dur / 60) || 0;
      const ds = Math.floor(dur % 60).toString().padStart(2, '0');
      setLetnikCurrentTime(`${m}:${s}`);
      if (dur > 1) {
        setLetnikDuration(`${dm}:${ds}`);
      }
    };

    const handlePlay = () => setLetnikPlaying(true);
    const handlePause = () => setLetnikPlaying(false);
    const handleEnded = () => setLetnikPlaying(false);

    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    const handleCustomPlayback = (e) => {
      setLetnikPlaying(!!e.detail?.isPlaying);
    };
    window.addEventListener('swag_letnik_playback_change', handleCustomPlayback);

    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('swag_letnik_playback_change', handleCustomPlayback);
    };
  }, []);

  // Управление треком «Летник»
  const toggleLetnik = () => {
    if (letnikPlaying) {
      soundService.pauseLetnik();
    } else {
      soundService.playLetnik({
        volume: letnikVolume,
        speed: letnikSpeed,
        bassBoost: letnikBassBoost,
        loop: letnikLoop
      });
    }
  };

  const handleLetnikSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const audio = soundService.getLetnikAudio();
    if (audio && audio.duration) {
      audio.currentTime = pos * audio.duration;
    }
  };

  const toggleLetnikBassBoost = () => {
    const nextState = !letnikBassBoost;
    setLetnikBassBoost(nextState);
    soundService.applyLetnikBassBoost(nextState);
    showToast(nextState ? '🔥 1000% BASS BOOST АКТИВИРОВАН! СОМАЛИЙСКИЙ 808 В ДЕЛЕ!' : '🔈 Bass Boost выключен');
  };

  const toggleLetnikLoop = () => {
    const nextLoop = !letnikLoop;
    setLetnikLoop(nextLoop);
    soundService.setLetnikLoop(nextLoop);
    showToast(nextLoop ? '🔁 Бесконечный луп трека «Летник» включен' : '⏹ Луп выключен');
  };

  const setLetnikSpeedRate = (rate) => {
    setLetnikSpeed(rate);
    soundService.setLetnikSpeed(rate);
    showToast(`⚡ Скорость трека: ${rate}x`);
  };

  const handleLetnikVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setLetnikVolume(val);
    soundService.setLetnikVolume(val);
  };

  // Редактирование профиля
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objUrl = URL.createObjectURL(file);
    setEditAvatarPreview(objUrl);
    showToast(`🖼️ Новая аватарка «${file.name}» выбрана!`);
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    if (!editName.trim()) {
      showToast('❌ Укажите имя профиля!');
      return;
    }
    const cleanHandle = editHandle.startsWith('@') ? editHandle : `@${editHandle}`;
    
    // Защита от несанкционированного присвоения роли Создателя
    let safeRole = editRole;
    let safeRank = editRank;
    if (!isFounder) {
      if (safeRole === 'FOUNDER') safeRole = 'CREATOR';
      if (typeof safeRank === 'string' && (safeRank.toUpperCase().includes('GOD') || safeRank.toUpperCase().includes('FOUNDER'))) {
        safeRank = 'SWAG BOSS';
      }
    }

    const updated = backendService.updateProfile({
      name: editName.trim().toUpperCase(),
      handle: cleanHandle,
      role: safeRole,
      rank: safeRank,
      level: Number(editLevel) || 67,
      bio: editBio.trim(),
      avatarHat: editAvatarHat,
      avatar: editAvatarPreview
    });
    setUser(updated);
    setRegisteredAccounts(backendService.getAccounts());
    showToast('💾 Профиль успешно сохранен и синхронизирован с E2EE базой!');
  };

  const handlePasswordUpdate = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('❌ Новый пароль должен быть не короче 6 символов!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('❌ Пароли не совпадают!');
      return;
    }
    try {
      await backendService.changePassword(oldPassword, newPassword);
      showToast('🔒 Пароль успешно обновлен в E2EE базе (SHA-256 + Salt)!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setRegisteredAccounts(backendService.getAccounts());
    } catch (err) {
      showToast(`❌ Ошибка смены пароля: ${err.message}`);
    }
  };

  return (
    <div className="profile-page-wrapper">
      {/* Тост уведомлений */}
      {toastMessage && (
        <div className="vamp-toast-banner">
          <span className="toast-icon">⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРЕДПРОСМОТРА КЛИПА */}
      {previewClip && (
        <div className="clip-modal-backdrop" onClick={() => setPreviewClip(null)}>
          <div className="clip-modal-phone-frame" onClick={(e) => e.stopPropagation()}>
            <button className="clip-modal-close-btn" onClick={() => setPreviewClip(null)}>✕</button>
            
            <div className="clip-modal-player-box">
              {previewClip.videoSrc ? (
                <div className="video-player-stack">
                  <video 
                    src={previewClip.videoSrc} 
                    className="modal-ambient-blur" 
                    autoPlay 
                    loop 
                    muted 
                  />
                  <video 
                    src={previewClip.videoSrc} 
                    className={`modal-main-video ${previewClip.fitMode === 'cover' ? 'is-cover' : 'is-contain'}`} 
                    controls 
                    autoPlay 
                    loop 
                  />
                </div>
              ) : (
                <div className="audio-player-stack">
                  <div className="audio-neon-pulse">
                    <div className="audio-disc-ambient">
                      <div className={`audio-vinyl-plate ${modalIsPlaying ? 'spinning' : ''}`}>
                        <span className="vinyl-groove">💿</span>
                      </div>
                    </div>
                    <span className="audio-name-tag">{previewClip.soundTitle || 'Оригинальный звук'}</span>
                    
                    {/* Кастомный кибер-контроллер вместо дефолтного белого HTML5 плеера */}
                    {previewClip.audioSrc && (
                      <div className="cyber-modal-audio-controls">
                        <audio 
                          ref={modalAudioRef} 
                          src={previewClip.audioSrc} 
                          autoPlay 
                          loop 
                          onTimeUpdate={handleModalAudioTimeUpdate}
                        />
                        <div className="cma-buttons-row">
                          <button 
                            type="button" 
                            className="cma-play-btn"
                            onClick={toggleModalAudio}
                          >
                            {modalIsPlaying ? '⏸ ПАУЗА' : '▶ ВОСПРОИЗВЕДЕНИЕ'}
                          </button>
                          <span className="cma-time-tag">{modalAudioTime}</span>
                        </div>

                        <div className="cma-progress-track" onClick={handleModalSeek} title="Кликните для перемотки">
                          <div className="cma-progress-bar" style={{ width: `${modalAudioProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="clip-modal-hud">
                <div className="clip-modal-author">
                  <span className="cm-handle">{previewClip.author}</span>
                  <p className="cm-title">{previewClip.description || previewClip.title}</p>
                </div>
                <div className="clip-modal-badge">
                  <span>🔥 {previewClip.likes || 0}</span>
                  <span>💬 {previewClip.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container profile-page-container">
        {/* ===================================================
            ATREIYA SOMALI PIRATE / INTERPOL EVASION HUD BANNER
            =================================================== */}
        <div className="somali-pirate-telemetry-strip">
          <div className="spts-badge-cluster">
            <span className="spts-skull">🏴‍☠️</span>
            <span className="spts-mode-tag blink">ATREIYA MODE: АКТИВЕН</span>
            <span className="spts-b2b-tag">B2B 67 AI PRO SOUNDCLOUD // СТАРТАП ДЛЯ ПЛЕСЕНИ</span>
          </div>
          <div className="spts-stats-cluster">
            <span className="spts-stat-item green" title="Интерпол не видит координаты пиратского бункера">
              🛡️ ИНТЕРПОЛ: РОЗЫСК ОБОЙДЁН (100% STEALTH)
            </span>
            <span className="spts-stat-item gold" title="Аденский залив, автономный узел">
              📡 NODE: STARLINK-SOMALIA-67
            </span>
            <span className="spts-stat-item cyan" title="Хеширование паролей SHA-256 + Salt">
              🔒 BACK-END: E2EE HARDENED
            </span>
          </div>
        </div>

        {/* ===================================================
            ШАПКА ПРОФИЛЯ В СТИЛЕ TIKTOK (SWAG / VAMP EDITION)
            =================================================== */}
        <div className="tiktok-profile-card">
          <div className="tiktok-card-glow-bg"></div>

          {/* Аватарка с выбранной шапкой (Корона, 5+, Одноклассники) */}
          <div className="tiktok-avatar-column">
            <div className="tiktok-avatar-frame">
              <img src={user.avatar || macanImg} alt="Avatar" className="tiktok-avatar-img" />
              {(!user.avatarHat || user.avatarHat === 'crown') && (
                <img src={crownImg} alt="Корона" className="tiktok-avatar-crown" title="Корона Создателя" />
              )}
              {user.avatarHat === 'five_plus' && (
                <img src={fivePlusImg} alt="5+" className="tiktok-avatar-crown hat-five-plus" title="Оценка 5 с плюсом" />
              )}
              {user.avatarHat === 'odnoklassniki' && (
                <img src={okHatImg} alt="Одноклассники" className="tiktok-avatar-crown hat-odnoklassniki" title="Шапка Одноклассники" />
              )}
              <span className="tiktok-live-pulse-dot" title="В сети (Создатель онлайн)"></span>
            </div>

            {/* Быстрый выбор шапки профиля */}
            <div className="profile-hat-selector-row" title="Сменить шапку аватарки">
              <button 
                type="button" 
                className={`hat-mini-btn ${(!user.avatarHat || user.avatarHat === 'crown') ? 'active' : ''}`}
                onClick={() => {
                  const updated = db.updateUser({ avatarHat: 'crown' });
                  setUser(updated);
                  setEditAvatarHat('crown');
                  showToast('👑 Шапка: Корона Создателя');
                }}
                title="Корона"
              >
                👑
              </button>
              <button 
                type="button" 
                className={`hat-mini-btn ${user.avatarHat === 'five_plus' ? 'active' : ''}`}
                onClick={() => {
                  const updated = db.updateUser({ avatarHat: 'five_plus' });
                  setUser(updated);
                  setEditAvatarHat('five_plus');
                  showToast('⭐ Шапка: 5 с плюсом (ОК)');
                }}
                title="5 с плюсом"
              >
                ⭐ 5+
              </button>
              <button 
                type="button" 
                className={`hat-mini-btn ${user.avatarHat === 'odnoklassniki' ? 'active' : ''}`}
                onClick={() => {
                  const updated = db.updateUser({ avatarHat: 'odnoklassniki' });
                  setUser(updated);
                  setEditAvatarHat('odnoklassniki');
                  showToast('🟠 Шапка: Одноклассники');
                }}
                title="Одноклассники"
              >
                🟠 ОК
              </button>
            </div>
          </div>

          {/* Данные создателя: Имя, Ник, Бейджи, Статистика */}
          <div className="tiktok-info-column">
            <div className="tiktok-name-line">
              <h1 className="tiktok-nickname">{user.name}</h1>
              <span className="tiktok-verified-badge" title="Верифицированный профиль Создателя">✓</span>
              <span className="tiktok-role-pill gold">
                👑 {user.role} // {user.rank}
              </span>
              <span className="tiktok-lvl-pill">LVL {user.level}</span>
            </div>

            <div className="tiktok-handle-row">
              <span className="tiktok-handle">{user.handle}</span>
              <span className="tiktok-platform-badge">💀 VAMP4 NODE #001</span>
              <span className="tiktok-platform-badge pirate">🏴‍☠️ ATREIYA SOMALI PRO</span>
            </div>

            {/* Статистика в стиле TikTok: Подписки, Подписчики, Лайки, Баланс */}
            <div className="tiktok-stats-row">
              <div className="stat-box">
                <span className="stat-num">13</span>
                <span className="stat-lbl">Подписки</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">248.5K</span>
                <span className="stat-lbl">Подписчики</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">1.8M</span>
                <span className="stat-lbl">Лайки</span>
              </div>
              <div className="stat-box highlight-stat">
                <span className="stat-num gold-num">{balance.toLocaleString()}</span>
                <span className="stat-lbl">SWAG Баланс</span>
              </div>
            </div>

            {/* Описание био */}
            <p className="tiktok-bio-text">
              {user.bio || 'Папа дома. Главный создатель узла VAMP4 в Сомали с пиратами. Вайбкодим b2b 67 ai pro soundcloud startup для плесени.'}
            </p>

            {/* Кнопки быстрых действий */}
            <div className="tiktok-actions-row">
              <button 
                className="tiktok-action-btn primary"
                onClick={() => switchTab('upload')}
              >
                <span className="btn-ico">📤</span> СТУДИЯ КЛИПОВ
              </button>

              {isFounder && (
                <button 
                  className="tiktok-action-btn gold"
                  onClick={() => onMint(1000)}
                  title="Эмиссия монет для Создателя"
                >
                  <span className="btn-ico">👑</span> +1,000 SWAG
                </button>
              )}

              {isFounder && (
                <button 
                  className="tiktok-action-btn vip-letnik-action-btn"
                  onClick={() => switchTab('letnik-vip')}
                  title="Открыть эксклюзивный плеер трека «Летник»"
                >
                  <span className="btn-ico">🎧</span> ТРЕК ЛЕТНИК (VIP)
                </button>
              )}

              <button 
                className="tiktok-action-btn secondary edit-profile-action-btn"
                onClick={() => switchTab('edit-profile')}
                title="Редактировать профиль, имя, роль, шапку и пароль"
              >
                <span className="btn-ico">⚙️</span> РЕДАКТИРОВАТЬ
              </button>

              <Link to="/2" className="tiktok-action-btn secondary">
                <span className="btn-ico">💬</span> МЕССЕНДЖЕР & SHORTS
              </Link>

              <Link to="/4" className="tiktok-action-btn secondary">
                <span className="btn-ico">🎰</span> КАЗИНО 777
              </Link>
            </div>
          </div>
        </div>

        {/* ===================================================
            ВКЛАДКИ НАВИГАЦИИ TIKTOK (ТАБЫ)
            =================================================== */}
        <div className="tiktok-nav-tabs">
          <button 
            className={`tiktok-tab-item ${activeTab === 'my-shorts' ? 'active' : ''}`}
            onClick={() => switchTab('my-shorts')}
          >
            <span className="tab-icon">🎬</span>
            <span className="tab-title">МОИ КЛИПЫ</span>
            <span className="tab-counter">{myShorts.length}</span>
          </button>

          <button 
            className={`tiktok-tab-item ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => switchTab('drafts')}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-title">ЧЕРНОВИКИ</span>
            <span className="tab-counter draft-counter">{drafts.length}</span>
          </button>

          <button 
            className={`tiktok-tab-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => switchTab('upload')}
          >
            <span className="tab-icon">📤</span>
            <span className="tab-title">СТУДИЯ ЗАГРУЗКИ</span>
            <span className="tab-badge-new">NEW</span>
          </button>

          <button 
            className={`tiktok-tab-item ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => switchTab('liked')}
          >
            <span className="tab-icon">❤️</span>
            <span className="tab-title">ПОНРАВИЛОСЬ</span>
            <span className="tab-counter">{allShorts.length}</span>
          </button>

          {isFounder && (
            <button 
              className={`tiktok-tab-item tab-letnik-vip ${activeTab === 'letnik-vip' ? 'active' : ''}`}
              onClick={() => switchTab('letnik-vip')}
            >
              <span className="tab-icon">🎧</span>
              <span className="tab-title">VIP ЛЕТНИК</span>
              <span className="tab-badge-vip">FOUNDER ONLY</span>
            </button>
          )}

          <button 
            className={`tiktok-tab-item tab-edit-profile ${activeTab === 'edit-profile' ? 'active' : ''}`}
            onClick={() => switchTab('edit-profile')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-title">НАСТРОЙКИ & E2EE</span>
            <span className="tab-badge-edit">67</span>
          </button>
        </div>

        {/* ===================================================
            ТАБ 1: МОИ ОПУБЛИКОВАННЫЕ КЛИПЫ В ОБЩЕЙ ЛЕНТЕ
            =================================================== */}
        {activeTab === 'my-shorts' && (
          <div className="tiktok-tab-content">
            <div className="tab-header-row">
              <h2 className="tab-heading">🎬 ОПУБЛИКОВАННЫЕ КЛИПЫ В ЛЕНТЕ VAMP4</h2>
              <button className="cyber-btn" onClick={() => switchTab('upload')}>
                ➕ ЗАГРУЗИТЬ НОВЫЙ ДРОП
              </button>
            </div>

            {myShorts.length === 0 ? (
              <div className="empty-tab-state">
                <span className="empty-ico">🎬</span>
                <h3>У вас пока нет опубликованных клипов</h3>
                <p>Перейдите во вкладку «Студия загрузки» или опубликуйте один из черновиков, чтобы ваш клип появился в общей ленте Shorts!</p>
                <button className="cyber-btn" onClick={() => switchTab('upload')}>
                  ОТКРЫТЬ СТУДИЮ ЗАГРУЗКИ
                </button>
              </div>
            ) : (
              <div className="tiktok-shorts-grid">
                {myShorts.map((short) => (
                  <div key={short.id} className="tiktok-grid-card">
                    {/* 9:16 верстка превью */}
                    <div className="grid-media-box" onClick={() => setPreviewClip(short)}>
                      {short.videoSrc ? (
                        <div className="video-thumb-container">
                          <video src={short.videoSrc} className="grid-video-bg" muted />
                          <div className="grid-video-overlay">
                            <span className="grid-play-icon">▶</span>
                          </div>
                        </div>
                      ) : (
                        <div className="audio-thumb-container">
                          <span className="audio-disc-icon">💿</span>
                          <span className="audio-title-mini">{short.soundTitle || 'Звук клипа'}</span>
                          <div className="grid-video-overlay">
                            <span className="grid-play-icon">▶</span>
                          </div>
                        </div>
                      )}

                      {/* Метки просмотров и лайков */}
                      <div className="grid-bottom-stats">
                        <span className="gbs-item">▶ {(short.shares * 142 + 250).toLocaleString()}</span>
                        <span className="gbs-item">🔥 {(short.likes || 1).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Описание и кнопка удаления */}
                    <div className="grid-info-row">
                      <p className="grid-clip-desc" title={short.description}>
                        {short.description || 'Клип пользователя'}
                      </p>
                      <div className="grid-card-actions">
                        <button 
                          className="grid-card-action-btn view"
                          onClick={() => setPreviewClip(short)}
                          title="Посмотреть в полный рост"
                        >
                          👁️
                        </button>
                        <button 
                          className="grid-card-action-btn delete"
                          onClick={() => handleDeleteShort(short.id)}
                          title="Удалить из общей ленты"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            ТАБ 2: ЧЕРНОВИКИ ДЛЯ ШОРТСОВ (DRAFTS SHELF)
            =================================================== */}
        {activeTab === 'drafts' && (
          <div className="tiktok-tab-content">
            <div className="tab-header-row">
              <div>
                <h2 className="tab-heading">📝 НЕОПУБЛИКОВАННЫЕ ЧЕРНОВИКИ ({drafts.length})</h2>
                <span className="tab-subtext">Здесь хранятся ваши заготовки клипов. Опубликуйте их в общую ленту в 1 клик.</span>
              </div>
              <button className="cyber-btn" onClick={() => switchTab('upload')}>
                ➕ СОЗДАТЬ ЧЕРНОВИК
              </button>
            </div>

            {drafts.length === 0 ? (
              <div className="empty-tab-state">
                <span className="empty-ico">📝</span>
                <h3>Черновиков пока нет</h3>
                <p>Загрузите видео или аудио в Студии и нажмите «Сохранить как черновик», чтобы отредактировать позже.</p>
                <button className="cyber-btn" onClick={() => switchTab('upload')}>
                  СОЗДАТЬ ПЕРВЫЙ ЧЕРНОВИК
                </button>
              </div>
            ) : (
              <div className="drafts-cards-grid">
                {drafts.map((draft) => (
                  <div key={draft.id} className="draft-cyber-card">
                    <div className="draft-media-preview" onClick={() => setPreviewClip(draft)}>
                      {draft.videoSrc ? (
                        <video src={draft.videoSrc} className="draft-video-thumb" muted />
                      ) : (
                        <div className="draft-audio-thumb">
                          <span style={{ fontSize: '2rem' }}>🎵</span>
                          <span className="draft-sound-name">{draft.soundTitle}</span>
                        </div>
                      )}
                      <span className="draft-badge-tag">DRAFT</span>
                    </div>

                    <div className="draft-body">
                      <div className="draft-title-row">
                        <h4 className="draft-title">{draft.title}</h4>
                        <span className="draft-time">{draft.createdAt}</span>
                      </div>
                      <p className="draft-desc">{draft.description || 'Без описания'}</p>
                      
                      <div className="draft-sound-pill">
                        <span className="dsp-icon">🎶</span>
                        <span className="dsp-name">{draft.soundTitle || 'Оригинальный звук'}</span>
                      </div>

                      <div className="draft-action-buttons">
                        <button 
                          className="draft-publish-btn"
                          onClick={() => handlePublishExistingDraft(draft.id)}
                          title="Опубликовать в общую ленту Shorts"
                        >
                          🚀 ОПУБЛИКОВАТЬ В ЛЕНТУ
                        </button>
                        <button 
                          className="draft-edit-btn"
                          onClick={() => handleEditDraftInStudio(draft)}
                          title="Редактировать в студии"
                        >
                          ✏️
                        </button>
                        <button 
                          className="draft-del-btn"
                          onClick={() => handleDeleteDraft(draft.id)}
                          title="Удалить черновик"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            ТАБ 3: КИБЕР-СТУДИЯ ЗАГРУЗКИ (CREATOR STUDIO)
            =================================================== */}
        {activeTab === 'upload' && (
          <div className="tiktok-tab-content">
            <div className="tab-header-row">
              <h2 className="tab-heading">📤 КИБЕР-СТУДИЯ СОЗДАНИЯ И ЗАГРУЗКИ КЛИПОВ</h2>
              <div className="quick-presets-group">
                <span className="presets-label">БЫСТРЫЕ ПРЕСЕТЫ:</span>
                <button className="preset-chip" onClick={() => applyPreset('letnik')}>
                  🎵 Дроп «Летник»
                </button>
                <button className="preset-chip" onClick={() => applyPreset('cyber')}>
                  🏎️ Porsche Turbo
                </button>
              </div>
            </div>

            <div className="creator-studio-layout">
              {/* Левая колонка: Вертикальный Live Phone Mockup (Формат 9:16) */}
              <div className="studio-preview-column">
                <div className="studio-phone-mockup">
                  <div className="mockup-notch"></div>
                  <div className="mockup-hud-corners">
                    <span className="m-corner tl"></span>
                    <span className="m-corner tr"></span>
                    <span className="m-corner bl"></span>
                    <span className="m-corner br"></span>
                  </div>

                  {/* Вьюпорт плеера с возможностью клика для паузы/возобновления */}
                  <div 
                    className="mockup-viewport" 
                    onClick={toggleStudioPlay}
                    title={studioIsPlaying ? 'Кликните, чтобы поставить на паузу' : 'Кликните, чтобы запустить'}
                    style={{ cursor: 'pointer' }}
                  >
                    {studioMediaType === 'video' && studioMedia ? (
                      <div className="mockup-video-wrapper">
                        {/* Фоновое размытое видео для адаптации любого формата */}
                        <video 
                          src={studioMedia} 
                          poster={studioCover}
                          className="mockup-ambient-bg" 
                          loop 
                          muted 
                          autoPlay 
                        />
                        {/* Главное видео */}
                        <video 
                          ref={studioVideoRef}
                          src={studioMedia} 
                          poster={studioCover}
                          className={`mockup-foreground-video ${studioFitMode === 'cover' ? 'mode-cover' : 'mode-contain'}`} 
                          loop 
                          autoPlay 
                          controls={false}
                        />
                      </div>
                    ) : (
                      <div className="mockup-audio-wrapper">
                        <div className="mockup-audio-circle">
                          <span className="mac-icon">🎵</span>
                          <div className="mockup-eq-bars">
                            {[...Array(12)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`meq-bar ${!studioIsPlaying ? 'paused' : ''}`} 
                                style={{ animationDelay: `${i * 0.1}s` }}
                              ></span>
                            ))}
                          </div>
                        </div>
                        {studioMedia && (
                          <audio ref={studioAudioRef} src={studioMedia} autoPlay style={{ display: 'none' }} />
                        )}
                      </div>
                    )}

                    {/* Оверлей паузы клипа при нажатии */}
                    {!studioIsPlaying && (
                      <div className="studio-pause-overlay">
                        <div className="pause-pill-center">
                          <span className="pp-icon">⏸</span>
                          <span className="pp-text">ПАУЗА (КЛИК ДЛЯ ПЛЕЯ)</span>
                        </div>
                      </div>
                    )}

                    {/* HUD оверлей клипа */}
                    <div className="mockup-overlay-hud">
                      <div className="mockup-top-pill">
                        <span className="mtp-dot"></span> VAMP4 SHORTS LIVE
                      </div>

                      <div className="mockup-bottom-meta">
                        <div className="mockup-author-row">
                          <img src={macanImg} alt="Macan" className="mockup-author-pic" />
                          <span className="mockup-author-name">{user?.handle || '@macan'}</span>
                          <span className="mockup-follow-pill">FOLLOW</span>
                        </div>
                        <p className="mockup-desc-text">
                          {studioDesc || studioTitle || 'Ваш заголовок клипа... #swag #vamp4'}
                        </p>
                        <div className="mockup-sound-pill">
                          <span className="msp-icon">🎵</span>
                          <span className="msp-title">{studioSound || 'Оригинальный кибер-звук'}</span>
                        </div>
                      </div>

                      {/* Боковая рейка действий */}
                      <div className="mockup-right-rail">
                        <div className="m-rail-item">
                          <span>🔥</span>
                          <small>1.4K</small>
                        </div>
                        <div className="m-rail-item">
                          <span>💬</span>
                          <small>128</small>
                        </div>
                        <div className="m-rail-item">
                          <span>💸</span>
                          <small>ДОНАТ</small>
                        </div>
                        <div className={`m-rail-item vinyl-spin ${!studioIsPlaying ? 'paused' : ''}`}>
                          <span>💿</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aspect-ratio-controls">
                  <span className="arc-label">УПРАВЛЕНИЕ ПЛЕЕРОМ И 9:16:</span>
                  <div className="arc-buttons">
                    <button 
                      type="button" 
                      className={`arc-btn pause-toggle ${!studioIsPlaying ? 'active' : ''}`}
                      onClick={toggleStudioPlay}
                    >
                      {studioIsPlaying ? '⏸ ПАУЗА В ПРЕВЬЮ' : '▶ ВОСПРОИЗВЕДЕНИЕ'}
                    </button>
                    <button 
                      type="button"
                      className={`arc-btn ${studioFitMode === 'contain' ? 'active' : ''}`}
                      onClick={() => setStudioFitMode('contain')}
                    >
                      📺 9:16 + GLOW
                    </button>
                    <button 
                      type="button"
                      className={`arc-btn ${studioFitMode === 'cover' ? 'active' : ''}`}
                      onClick={() => setStudioFitMode('cover')}
                    >
                      🔍 9:16 COVER
                    </button>
                  </div>
                </div>
              </div>

              {/* Правая колонка: Форма загрузки, названия и публикации */}
              <div className="studio-form-column">
                <div className="studio-dropzone-panel">
                  <input 
                    type="file" 
                    id="studio-file-input" 
                    accept="video/*,audio/*" 
                    onChange={handleFileSelect} 
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="studio-file-input" className="studio-dropzone-label">
                    {studioMedia ? (
                      <div className="dropzone-success-box">
                        <span className="dz-success-ico">✅</span>
                        <span className="dz-success-title">
                          {studioMediaType === 'video' ? '🎬 Видеофайл успешно выбран' : '🎵 Аудиофайл успешно выбран'}
                        </span>
                        <span className="dz-change-text">Нажмите, чтобы заменить файл с диска</span>
                      </div>
                    ) : (
                      <div className="dropzone-prompt-box">
                        <span className="dz-upload-icon">📤</span>
                        <span className="dz-prompt-title">ПЕРЕТАЩИТЕ ВИДЕО (MP4, WEBM) ИЛИ ТРЕК (MP3, WAV)</span>
                        <span className="dz-prompt-sub">Или кликните здесь для выбора с вашего компьютера</span>
                        <div className="dz-badge-row">
                          <span className="dz-pill">9:16 ВЕРТИКАЛКА</span>
                          <span className="dz-pill">HD / 4K ПОДДЕРЖКА</span>
                          <span className="dz-pill">INDEXEDDB SAFE</span>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* ВЫБОР ОБЛОЖКИ (ПОСТЕРА) ДЛЯ ШОРТСА */}
                <div className="studio-cover-uploader-card">
                  <input 
                    type="file" 
                    id="studio-cover-input" 
                    accept="image/*" 
                    onChange={handleCoverSelect} 
                    style={{ display: 'none' }}
                  />
                  <div className="cover-uploader-flex">
                    <label htmlFor="studio-cover-input" className="cyber-btn cover-choose-btn">
                      🖼️ {studioCover ? 'ИЗМЕНИТЬ ОБЛОЖКУ' : 'ВЫБРАТЬ ОБЛОЖКУ ДЛЯ ШОРТСА'}
                    </label>
                    {studioCover ? (
                      <div className="cover-active-preview">
                        <img src={studioCover} alt="Обложка шортса" className="cover-mini-pic" />
                        <span className="cover-set-label">✓ Обложка установлена</span>
                        <button 
                          type="button" 
                          className="cover-clear-btn"
                          onClick={() => { setStudioCover(null); setStudioCoverBlob(null); }}
                          title="Удалить обложку"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="cover-optional-note">PNG, JPG, WebP для превью шортса</span>
                    )}
                  </div>
                </div>

                <form onSubmit={handlePublishToFeed} className="studio-meta-form">
                  <div className="form-group">
                    <label>НАЗВАНИЕ КЛИПА / ТРЕКА</label>
                    <input 
                      type="text" 
                      className="cyber-input" 
                      placeholder="Например: Ночной заезд под басс Летника"
                      value={studioTitle}
                      onChange={(e) => setStudioTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>ОПИСАНИЕ И ТЕГИ</label>
                    <textarea 
                      className="cyber-input" 
                      rows={3}
                      placeholder="Расскажите о клипе... #swag #vamp4 #drift #music"
                      value={studioDesc}
                      onChange={(e) => setStudioDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>ЗВУКОВАЯ ДОРОЖКА</label>
                    <input 
                      type="text" 
                      className="cyber-input" 
                      placeholder="Тёмный принц, madk1d — Летник"
                      value={studioSound}
                      onChange={(e) => setStudioSound(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>ХЭШТЕГИ ДЛЯ РЕКОМЕНДАЦИЙ</label>
                    <input 
                      type="text" 
                      className="cyber-input" 
                      placeholder="#swag #vamp4 #letnik #shorts"
                      value={studioTags}
                      onChange={(e) => setStudioTags(e.target.value)}
                    />
                  </div>

                  {/* Кнопки: Сохранить в черновики ИЛИ опубликовать в общую ленту */}
                  <div className="studio-buttons-row">
                    <button 
                      type="button" 
                      className="cyber-btn draft-btn"
                      onClick={handleSaveDraft}
                    >
                      📝 СОХРАНИТЬ КАК ЧЕРНОВИК
                    </button>

                    <button 
                      type="submit" 
                      className="cyber-btn publish-btn"
                    >
                      🚀 ОПУБЛИКОВАТЬ В ОБЩУЮ ЛЕНТУ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            ТАБ 4: ПОНРАВИЛОСЬ (ИЗБРАННОЕ ИЗ ОБЩЕЙ ЛЕНТЫ)
            =================================================== */}
        {activeTab === 'liked' && (
          <div className="tiktok-tab-content">
            <div className="tab-header-row">
              <h2 className="tab-heading">❤️ ПОНРАВИВШИЕСЯ КЛИПЫ ИЗ ЛЕНТЫ VAMP4</h2>
            </div>

            <div className="tiktok-shorts-grid">
              {allShorts.map((short) => (
                <div key={short.id} className="tiktok-grid-card">
                  <div className="grid-media-box" onClick={() => setPreviewClip(short)}>
                    {short.videoSrc ? (
                      <video src={short.videoSrc} className="grid-video-bg" muted />
                    ) : (
                      <div className="audio-thumb-container">
                        <span className="audio-disc-icon">💿</span>
                        <span className="audio-title-mini">{short.soundTitle || 'Трек'}</span>
                      </div>
                    )}
                    <div className="grid-bottom-stats">
                      <span className="gbs-item">🔥 {(short.likes || 1).toLocaleString()}</span>
                      <span className="gbs-item">💬 {short.commentsCount || 0}</span>
                    </div>
                  </div>
                  <div className="grid-info-row">
                    <p className="grid-clip-desc">{short.description || short.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================
            ТАБ 5: VIP ЛЕТНИК (FOUNDER / SWAG GOD EXCLUSIVE)
            =================================================== */}
        {activeTab === 'letnik-vip' && isFounder && (
          <div className="tiktok-tab-content letnik-vip-container">
            {/* Верхний баннер */}
            <div className="letnik-vip-header-banner">
              <div className="lvh-left">
                <span className="lvh-badge">👑 FOUNDER / SWAG GOD EXCLUSIVE</span>
                <h2 className="lvh-title">🎧 B2B SIX SEVEN AI PRO SOUNDCLOUD // СТУДИЯ «ЛЕТНИК»</h2>
                <p className="lvh-desc">
                  Пиратский звук прямиком из Сомали. Разработка стартапа для плесени и ночного дрифта на скорости 250 км/ч. Никакой Интерпол не перехватит этот 808 басс.
                </p>
              </div>
              <div className="lvh-right">
                <span className="lvh-telemetry-pill">
                  <span className="pill-dot blink"></span>
                  LOSSLESS FLAC 1337 KBPS
                </span>
                <span className="lvh-telemetry-pill gold">
                  ⚡ B2B AI PRO ENGINE v67.0
                </span>
              </div>
            </div>

            <div className="letnik-player-grid">
              {/* Левая колонка: Аудио-вертушка и SoundCloud контроллер */}
              <div className="letnik-turntable-card">
                <div className="vinyl-turntable-deck">
                  <div className="vinyl-turntable-plate-wrap">
                    <div className={`vinyl-3d-disc ${letnikPlaying ? 'spinning' : ''}`}>
                      <div className="vinyl-ridges"></div>
                      <div className="vinyl-center-art">
                        <img src={user.avatar || macanImg} alt="Macan" className="vinyl-art-pic" />
                        <div className="vinyl-spindle-hole"></div>
                      </div>
                    </div>
                    <div className={`turntable-tonearm ${letnikPlaying ? 'on-record' : ''}`}>
                      <div className="tonearm-head"></div>
                    </div>
                  </div>

                  <div className="turntable-info-box">
                    <div className="ti-tags">
                      <span className="ti-tag">🔥 VIP DROP</span>
                      <span className="ti-tag orange">ТЁМНЫЙ ПРИНЦ x MADK1D</span>
                      <span className="ti-tag red">B2B SOUNDCLOUD PRO</span>
                    </div>
                    <h3 className="ti-title">Тёмный принц, madk1d — Летник</h3>
                    <p className="ti-sub">Somali Pirate High-Roller Bassline • Starlink Gulf of Aden Mix</p>
                  </div>
                </div>

                {/* SoundCloud Waveform Equalizer (36 анимированных баров) */}
                <div className="soundcloud-waveform-wrap" onClick={handleLetnikSeek} title="Кликните в любое место для перемотки">
                  <div className="soundcloud-bars-flex">
                    {[...Array(36)].map((_, i) => {
                      const baseHeights = [25, 40, 60, 85, 100, 75, 45, 90, 95, 70, 50, 80, 100, 65, 35, 90, 80, 60, 45, 75, 95, 85, 60, 40, 70, 90, 100, 80, 55, 35, 65, 85, 95, 70, 45, 30];
                      const h = baseHeights[i % baseHeights.length];
                      const barProgress = (i / 36) * 100;
                      const isPlayed = barProgress <= letnikProgress;
                      return (
                        <div 
                          key={i} 
                          className={`sc-bar ${isPlayed ? 'played' : ''} ${letnikPlaying ? 'bouncing' : ''}`}
                          style={{
                            height: `${h}%`,
                            animationDelay: `${(i % 6) * 0.12}s`,
                            animationDuration: letnikSpeed === 2 ? '0.2s' : letnikSpeed === 1.5 ? '0.3s' : '0.5s'
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Ползунок прогресса */}
                  <div className="sc-progress-cursor" style={{ left: `${letnikProgress}%` }}>
                    <span className="sc-time-tooltip">{letnikCurrentTime}</span>
                  </div>
                </div>

                {/* Таймкоды и полоса */}
                <div className="letnik-time-row">
                  <span className="time-curr">{letnikCurrentTime}</span>
                  <span className="time-track-name">«ЛЕТНИК» (VAMP4 / STARLINK DIRECT)</span>
                  <span className="time-dur">{letnikDuration}</span>
                </div>

                {/* Кнопки управления */}
                <div className="letnik-controls-cluster">
                  <div className="lcc-main-buttons">
                    <button 
                      type="button" 
                      className={`letnik-play-btn ${letnikPlaying ? 'is-playing' : ''}`}
                      onClick={toggleLetnik}
                      title={letnikPlaying ? 'Поставить на паузу' : 'Воспроизвести Летник'}
                    >
                      {letnikPlaying ? '⏸ ПАУЗА' : '▶ ИГРАТЬ ЛЕТНИК'}
                    </button>

                    <button 
                      type="button" 
                      className={`letnik-bass-btn ${letnikBassBoost ? 'active' : ''}`}
                      onClick={toggleLetnikBassBoost}
                      title="Экстремальный 808 басс"
                    >
                      🔥 1000% BASS BOOST
                    </button>

                    <button 
                      type="button" 
                      className={`letnik-loop-btn ${letnikLoop ? 'active' : ''}`}
                      onClick={toggleLetnikLoop}
                      title="Зациклить воспроизведение"
                    >
                      🔁 {letnikLoop ? 'ЛУП ВКЛ' : 'БЕЗ ЛУПА'}
                    </button>
                  </div>

                  {/* Скорость и громкость */}
                  <div className="letnik-sliders-row">
                    <div className="lsr-speed-group">
                      <span className="lsr-label">СКОРОСТЬ:</span>
                      <div className="speed-pills">
                        {[0.8, 1.0, 1.25, 1.5, 2.0].map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            className={`speed-pill ${letnikSpeed === s ? 'active' : ''}`}
                            onClick={() => setLetnikSpeedRate(s)}
                          >
                            {s === 2.0 ? '2.0x 🏎️' : `${s}x`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="lsr-volume-group">
                      <span className="lsr-label">ГРОМКОСТЬ: {Math.round(letnikVolume * 100)}%</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={letnikVolume}
                        onChange={handleLetnikVolumeChange}
                        className="letnik-volume-slider"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка: Пиратский хаб Сомали & B2B Soundcloud AI Pro */}
              <div className="letnik-pirate-hub-card">
                <div className="pirate-hub-header">
                  <div className="phh-title-row">
                    <span className="phh-skull">🏴‍☠️</span>
                    <div>
                      <h3 className="phh-title">СОМАЛИЙСКИЙ ШТАБ ВАЙБКОДИНГА</h3>
                      <p className="phh-sub">B2B SIX SEVEN AI PRO SOUNDCLOUD ДЛЯ ПЛЕСЕНИ</p>
                    </div>
                  </div>
                  <span className="phh-status-badge">ONLINE • OFF-GRID</span>
                </div>

                <div className="pirate-telemetry-grid">
                  <div className="pt-cell">
                    <span className="ptc-lbl">СТАТУС ИНТЕРПОЛА</span>
                    <span className="ptc-val green">РОЗЫСК УСПЕШНО ОБОЙДЁН (100%)</span>
                  </div>
                  <div className="pt-cell">
                    <span className="ptc-lbl">ЛОКАЦИЯ ВАЙБКОДЕРОВ</span>
                    <span className="ptc-val gold">СОМАЛИ (АДЕНСКИЙ ЗАЛИВ, БУНКЕР 67)</span>
                  </div>
                  <div className="pt-cell">
                    <span className="ptc-lbl">ЦЕЛЕВАЯ АУДИТОРИЯ СТАРТАПА</span>
                    <span className="ptc-val orange">ПЛЕСЕНЬ & HIGH-ROLLER VAMP4</span>
                  </div>
                  <div className="pt-cell">
                    <span className="ptc-lbl">КРИПТО-КЛЮЧ FOUNDER</span>
                    <span className="ptc-val purple">0x67...ATREIYA_VIP_MASTER</span>
                  </div>
                </div>

                {/* Быстрые действия для пиратского стартапа */}
                <div className="pirate-startup-actions">
                  <h4 className="psa-title">⚡ КОМАНДЫ B2B 67 AI PRO SOUNDCLOUD:</h4>
                  
                  <button 
                    type="button" 
                    className="psa-btn drop-release"
                    onClick={() => {
                      soundService.playCasinoJackpot();
                      showToast('🚀 ДРОП ДЛЯ ПЛЕСЕНИ ВЫГРУЖЕН В B2B SOUNDCLOUD! 1,000,000 СТРИМОВ ЗА СЕКУНДУ!');
                    }}
                  >
                    🔥 ДРОПНУТЬ РЕЛИЗ ДЛЯ ПЛЕСЕНИ
                  </button>

                  <button 
                    type="button" 
                    className="psa-btn evict-interpol"
                    onClick={() => {
                      soundService.playGunshot();
                      showToast('🏴‍☠️ СЛЕД ДЛЯ ИНТЕРПОЛА ЗАМЕТЁН! IP ПЕРЕНЕСЕН В СЕРВЕРНУЮ В МОГАДИШО!');
                    }}
                  >
                    🛡️ ЗАПУТАТЬ ИНТЕРПОЛ (СМЕНИТЬ IP СОМАЛИ)
                  </button>

                  <button 
                    type="button" 
                    className="psa-btn boost-808"
                    onClick={() => {
                      toggleLetnikBassBoost();
                    }}
                  >
                    💣 ПИРАТСКИЙ 808 БУСТ (ДИНАМИКИ В ХЛАМ)
                  </button>
                </div>

                {/* Лог безопасности узла */}
                <div className="pirate-terminal-box">
                  <div className="ptb-head">
                    <span>TERMINAL: SOMALI_STARLINK_v67.log</span>
                    <span className="blink-green">● LIVE</span>
                  </div>
                  <div className="ptb-body">
                    <p className="ptb-line success">[OK] Connected to Somali Pirate Mesh Node #001</p>
                    <p className="ptb-line warn">[ALERT] Interpol query blocked by ATreiya Firewall (SHA-256 PBKDF2)</p>
                    <p className="ptb-line info">[B2B] Audio stream «Летник» routed to SoundCloud B2B AI Pro</p>
                    <p className="ptb-line gold">[FOUNDER] Access granted for {user.name} ({user.rank})</p>
                    <p className="ptb-line success">[SWAG] Startup for pleseni operating at 67.0 PFLOPS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            ТАБ 6: РЕДАКТИРОВАНИЕ ПРОФИЛЯ & БЕЗОПАСНОСТЬ
            =================================================== */}
        {activeTab === 'edit-profile' && (
          <div className="tiktok-tab-content edit-profile-container">
            <div className="tab-header-row">
              <div>
                <h2 className="tab-heading">⚙️ НАСТРОЙКИ ПРОФИЛЯ & БЕЗОПАСНОСТЬ</h2>
                <p className="tab-subheading">
                  Управление вашим кибер-узлом, правами роли, шапкой аватарки и E2EE паролем в базе ATreiya.
                </p>
              </div>
              <button 
                type="button" 
                className="cyber-btn"
                onClick={handleSaveProfile}
              >
                💾 СОХРАНИТЬ ПРОФИЛЬ
              </button>
            </div>

            <div className="profile-edit-grid">
              {/* Левая колонка: Основные данные профиля */}
              <div className="edit-card main-info-card">
                <h3 className="edit-card-title">👤 ОСНОВНЫЕ ДАННЫЕ УЧЕТНОЙ ЗАПИСИ</h3>
                
                <form onSubmit={handleSaveProfile} className="edit-form-stack">
                  <div className="form-group">
                    <label>ИМЯ / ПОЗЫВНОЙ</label>
                    <input 
                      type="text" 
                      className="cyber-input" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="MACAN"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>КИБЕР-ХЭНДЛ (@HANDLE)</label>
                    <input 
                      type="text" 
                      className="cyber-input" 
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value)}
                      placeholder="@macansssssssssss1337"
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>ПРАВА И РОЛЬ В СИСТЕМЕ</label>
                      <select 
                        className="cyber-input select" 
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      >
                        {isFounder && <option value="FOUNDER">👑 FOUNDER (Создатель)</option>}
                        <option value="CREATOR">🎵 CREATOR (Автор контента)</option>
                        <option value="HIGH_ROLLER">🎰 HIGH_ROLLER (VIP Игрок)</option>
                        <option value="SWAG_BOSS">⚡ SWAG_BOSS (Кибер-Босс)</option>
                      </select>
                      {!isFounder && (
                        <small style={{ color: '#ff9900', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                          🔒 Роль FOUNDER закреплена за Создателем
                        </small>
                      )}
                    </div>

                    <div className="form-group">
                      <label>РАНГ / ТИТУЛ</label>
                      <input 
                        type="text" 
                        className="cyber-input" 
                        value={editRank}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!isFounder && (val.toUpperCase().includes('GOD') || val.toUpperCase().includes('FOUNDER'))) {
                            return;
                          }
                          setEditRank(val);
                        }}
                        placeholder={isFounder ? "SWAG GOD" : "SWAG BOSS"}
                        disabled={!isFounder}
                        title={!isFounder ? "Ранг SWAG GOD доступен только для роли Создателя" : ""}
                      />
                      {!isFounder && (
                        <small style={{ color: '#888', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                          Титул защищен протоколом ATreiya
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>УРОВЕНЬ ДОСТУПА (LVL)</label>
                    <input 
                      type="number" 
                      className="cyber-input" 
                      value={editLevel}
                      onChange={(e) => setEditLevel(Number(e.target.value))}
                      placeholder="67"
                    />
                  </div>

                  <div className="form-group">
                    <label>БИО / МАНИФЕСТ СОЗДАТЕЛЯ</label>
                    <textarea 
                      className="cyber-input" 
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Папа дома. Вайбкодим в Сомали с пиратами b2b six seven ai pro soundcloud startup для плесени..."
                    />
                  </div>

                  <button type="submit" className="cyber-btn save-btn">
                    💾 СОХРАНИТЬ ДАННЫЕ ПРОФИЛЯ
                  </button>
                </form>
              </div>

              {/* Правая колонка: Аватарка, Шапка и Смена пароля */}
              <div className="edit-card avatar-security-card">
                <h3 className="edit-card-title">🖼️ АВАТАРКА И ШАПКА ПРОФИЛЯ</h3>

                <div className="edit-avatar-preview-box">
                  <div className="eap-frame">
                    <img src={editAvatarPreview || macanImg} alt="Avatar" className="eap-img" />
                    {editAvatarHat === 'crown' && (
                      <img src={crownImg} alt="Корона" className="eap-hat hat-crown" />
                    )}
                    {editAvatarHat === 'five_plus' && (
                      <img src={fivePlusImg} alt="5+" className="eap-hat hat-five-plus" />
                    )}
                    {editAvatarHat === 'odnoklassniki' && (
                      <img src={okHatImg} alt="ОК" className="eap-hat hat-odnoklassniki" />
                    )}
                  </div>
                  <div className="eap-info">
                    <span className="eap-nickname">{editName || 'USER'}</span>
                    <span className="eap-role-tag">{editRole} // {editRank}</span>
                    <div className="eap-uploader-row">
                      <input 
                        type="file" 
                        id="edit-avatar-upload" 
                        accept="image/*" 
                        onChange={handleAvatarFileSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="edit-avatar-upload" className="cyber-btn mini-btn">
                        📁 ЗАГРУЗИТЬ ФОТО
                      </label>
                      <button 
                        type="button" 
                        className="cyber-btn mini-btn reset-btn"
                        onClick={() => {
                          setEditAvatarPreview(macanImg);
                          showToast('🔄 Установлена дефолтная аватарка MACAN');
                        }}
                      >
                        СБРОС К MACAN
                      </button>
                    </div>
                  </div>
                </div>

                {/* Выбор шапки аватарки */}
                <div className="edit-hats-selector">
                  <label className="ehs-label">ВЫБЕРИТЕ ШАПКУ АВАТАРКИ:</label>
                  <div className="ehs-grid">
                    <button 
                      type="button" 
                      className={`ehs-card ${editAvatarHat === 'crown' ? 'active' : ''}`}
                      onClick={() => {
                        setEditAvatarHat('crown');
                        showToast('👑 Выбрана Корона Создателя');
                      }}
                    >
                      <img src={crownImg} alt="Корона" className="ehs-icon" />
                      <span>👑 Корона</span>
                    </button>

                    <button 
                      type="button" 
                      className={`ehs-card ${editAvatarHat === 'five_plus' ? 'active' : ''}`}
                      onClick={() => {
                        setEditAvatarHat('five_plus');
                        showToast('⭐ Выбран знак 5 с плюсом');
                      }}
                    >
                      <img src={fivePlusImg} alt="5+" className="ehs-icon" />
                      <span>⭐ 5+</span>
                    </button>

                    <button 
                      type="button" 
                      className={`ehs-card ${editAvatarHat === 'odnoklassniki' ? 'active' : ''}`}
                      onClick={() => {
                        setEditAvatarHat('odnoklassniki');
                        showToast('🟠 Выбрана шапка Одноклассники');
                      }}
                    >
                      <img src={okHatImg} alt="ОК" className="ehs-icon" />
                      <span>🟠 ОК</span>
                    </button>

                    <button 
                      type="button" 
                      className={`ehs-card ${editAvatarHat === 'none' ? 'active' : ''}`}
                      onClick={() => {
                        setEditAvatarHat('none');
                        showToast('🚫 Без шапки');
                      }}
                    >
                      <span className="ehs-icon-none">🚫</span>
                      <span>Без шапки</span>
                    </button>
                  </div>
                </div>

                {/* Смена пароля в E2EE бекенде */}
                <div className="edit-security-box">
                  <div className="esb-head">
                    <span className="esb-title">🔒 БЕЗОПАСНОСТЬ: СМЕНА ПАРОЛЯ АККАУНТА (E2EE)</span>
                    <span className="esb-badge">SHA-256 + SALT</span>
                  </div>
                  <p className="esb-desc">
                    Все пароли хранятся в защищенной базе «swag_db_accounts_v2» в захешированном виде. 
                    Дефолтный мастер-ключ Создателя: <code>67</code>.
                  </p>

                  <form onSubmit={handlePasswordUpdate} className="esb-form">
                    <div className="form-group">
                      <label>ТЕКУЩИЙ ПАРОЛЬ (ИЛИ «67»)</label>
                      <input 
                        type="password" 
                        className="cyber-input" 
                        placeholder="Текущий пароль"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>НОВЫЙ ПАРОЛЬ</label>
                        <input 
                          type="password" 
                          className="cyber-input" 
                          placeholder="Новый пароль"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>ПОВТОРИТЕ ПАРОЛЬ</label>
                        <input 
                          type="password" 
                          className="cyber-input" 
                          placeholder="Повтор пароля"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="cyber-btn password-btn">
                      🔑 ОБНОВИТЬ ПАРОЛЬ В БАЗЕ E2EE
                    </button>
                  </form>
                </div>

                {/* Инспектор защищенной базы данных (Somali Database Accounts) */}
                <div className="edit-accounts-inspector">
                  <div className="eai-head">
                    <span>🛡️ ЗАЩИЩЕННАЯ БАЗА УЗЛОВ (SWAG_DB_ACCOUNTS_V2)</span>
                    <span>{registeredAccounts.length} АКК.</span>
                  </div>
                  <div className="eai-list">
                    {registeredAccounts.map((acc, idx) => (
                      <div key={acc.id || idx} className="eai-row">
                        <div className="eai-left">
                          <span className="eai-nick">{acc.name}</span>
                          <span className="eai-handle">{acc.handle}</span>
                        </div>
                        <div className="eai-center">
                          <span className="eai-role">{acc.role}</span>
                          <span className="eai-node">{acc.somaliNode || 'STARLINK-ADEN-67'}</span>
                        </div>
                        <div className="eai-right">
                          <span className="eai-hash-badge" title={acc.passwordHash}>
                            HASH: {acc.passwordHash ? acc.passwordHash.slice(0, 8) + '...' : 'SECURE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
