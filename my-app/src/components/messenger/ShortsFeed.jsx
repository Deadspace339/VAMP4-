import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { mediaStore } from '../../services/mediaStore';

const ShortsFeed = ({ onDonate }) => {
  const navigate = useNavigate();
  const [shortsList, setShortsList] = useState(() => db.getShorts());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [fitMode, setFitMode] = useState('contain'); // 'contain' (with ambient glow) or 'cover'
  const [likedMap, setLikedMap] = useState({});
  const [likesCountMap, setLikesCountMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [donationToast, setDonationToast] = useState(null);

  // Реальное время и перемотка
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Свайп мышкой (зажатие и перетаскивание)
  const [dragTranslateY, setDragTranslateY] = useState(0);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const dragDeltaY = useRef(0);
  const dragStartTime = useRef(0);
  const isDragging = useRef(false);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const shortCardRef = useRef(null);
  const progressTrackRef = useRef(null);

  const currentShort = shortsList[currentIndex] || shortsList[0] || {};

  // Динамически разрешенные медиа-ресурсы (восстановление видео и обложки из IndexedDB)
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState(currentShort?.videoSrc);
  const [resolvedPosterSrc, setResolvedPosterSrc] = useState(currentShort?.poster || currentShort?.coverImage);

  useEffect(() => {
    let active = true;
    const loadFreshMedia = async () => {
      let vSrc = currentShort?.videoSrc;
      let pSrc = currentShort?.poster || currentShort?.coverImage;

      // Если URL видео idb:// или blob: (потенциально устаревший сессионный URL) или отсутствует
      if (!vSrc || vSrc.startsWith('idb://') || vSrc.startsWith('blob:')) {
        try {
          const media = await mediaStore.get('media_' + currentShort?.id);
          if (active && media) {
            if (media.videoBlob) {
              vSrc = URL.createObjectURL(media.videoBlob);
            } else if (media.videoSrc && !media.videoSrc.startsWith('idb://')) {
              vSrc = media.videoSrc;
            }
            if (media.coverBlob) {
              pSrc = URL.createObjectURL(media.coverBlob);
            } else if (media.poster && !media.poster.startsWith('idb://')) {
              pSrc = media.poster;
            }
          }
        } catch (err) {
          console.warn('[ShortsFeed] MediaStore hydration warning:', err);
        }
      }

      if (active) {
        setResolvedVideoSrc(vSrc || currentShort?.videoSrc);
        setResolvedPosterSrc(pSrc || currentShort?.poster || currentShort?.coverImage);
      }
    };

    loadFreshMedia();
    return () => { active = false; };
  }, [currentShort?.id, currentShort?.videoSrc, currentShort?.poster]);

  // Проверка: автор клипа — текущий пользователь (Вы)
  const currentUser = db.getUser();
  const isMyClip = Boolean(
    currentShort?.isMy ||
    (currentUser?.handle && currentShort?.author?.toLowerCase() === currentUser?.handle?.toLowerCase()) ||
    (currentUser?.name && currentShort?.authorName?.toLowerCase() === currentUser?.name?.toLowerCase()) ||
    currentShort?.author === '@macan_official' ||
    (currentShort?.author && currentShort.author.toLowerCase().includes('macan'))
  );

  // Определение типа визуального контента (видео или картинка)
  const hasVideo = Boolean(currentShort?.videoSrc);
  const hasImage = Boolean(
    currentShort?.imageSrc || 
    currentShort?.poster || 
    (currentShort?.audioSrc && (
      currentShort.audioSrc.startsWith('data:image/') || 
      currentShort.audioSrc.includes('image') ||
      currentShort.audioSrc.endsWith('.jpg') ||
      currentShort.audioSrc.endsWith('.png') ||
      currentShort.audioSrc.endsWith('.webp')
    ))
  );
  const imageSource = currentShort?.imageSrc || currentShort?.poster || (hasImage ? currentShort.audioSrc : null);

  // Подписка на глобальные обновления базы шортсов (из профиля или студии)
  useEffect(() => {
    const handleUpdated = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setShortsList(e.detail);
      }
    };
    window.addEventListener('swag_shorts_updated', handleUpdated);
    return () => window.removeEventListener('swag_shorts_updated', handleUpdated);
  }, []);

  // Синхронизация лайков
  useEffect(() => {
    const initialLikes = {};
    shortsList.forEach(s => {
      initialLikes[s.id] = s.likes || 0;
    });
    setLikesCountMap(prev => ({ ...initialLikes, ...prev }));
  }, [shortsList]);

  const handleVideoError = async () => {
    console.warn('[ShortsFeed] Video playback failed or format error, attempting IndexedDB rescue for', currentShort?.id);
    try {
      const media = await mediaStore.get('media_' + currentShort?.id);
      if (media?.videoBlob) {
        const freshUrl = URL.createObjectURL(media.videoBlob);
        setResolvedVideoSrc(freshUrl);
      }
    } catch (err) {
      console.warn('[ShortsFeed] Media rescue failed:', err);
    }
  };

  // Управление воспроизведением при смене индекса клипа
  useEffect(() => {
    setCurrentTime(0);
    setProgress(0);
    setDuration(0);

    // Запуск видео с защитой от блокировки автоплея без звука
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('[ShortsFeed] Unmuted autoplay blocked by browser, falling back to muted play:', err?.message || err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }

    // Запуск аудио: ТОЛЬКО если клип без собственного видео (изображение или визуализатор),
    // чтобы не накладывать песню поверх оригинального звука видеоклипа
    const effectiveAudio = !hasVideo 
      ? (currentShort?.audioSrc || (currentShort?.id === 'letnik-short-1' ? '/letnik.mp3' : null))
      : null;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      if (isPlaying && effectiveAudio) {
        audioRef.current.play().catch((err) => {
          console.log('[ShortsFeed] Audio playback error:', err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentIndex, currentShort?.id, resolvedVideoSrc, hasVideo]);

  // Синхронизация воспроизведения / паузы
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    const effectiveAudio = !hasVideo 
      ? (currentShort?.audioSrc || (currentShort?.id === 'letnik-short-1' ? '/letnik.mp3' : null))
      : null;

    if (audioRef.current) {
      if (isPlaying && effectiveAudio) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, hasVideo]);

  // Синхронизация громкости и Mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Обработка реального времени воспроизведения (video)
  const handleVideoTimeUpdate = () => {
    if (isScrubbing) return;
    if (videoRef.current) {
      const cur = videoRef.current.currentTime || 0;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      if (dur > 0) {
        setDuration(dur);
        setProgress((cur / dur) * 100);
      }
    }
  };

  // Обработка реального времени воспроизведения (audio)
  const handleAudioTimeUpdate = () => {
    if (isScrubbing) return;
    if (!videoRef.current && audioRef.current) {
      const cur = audioRef.current.currentTime || 0;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      if (dur > 0) {
        setDuration(dur);
        setProgress((cur / dur) * 100);
      }
    }
  };

  const handleMetadataLoaded = (e) => {
    const dur = e.target.duration;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setDuration(dur);
    }
  };

  // Перемотка (Seek) клипа по позиции клика/перетаскивания
  const seekToClientX = (clientX) => {
    if (!progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const effectiveDuration = duration > 0 ? duration : (currentShort?.duration || 15);
    const targetTime = ratio * effectiveDuration;

    setCurrentTime(targetTime);
    setProgress(ratio * 100);

    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = targetTime;
    }
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleProgressPointerDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    seekToClientX(e.clientX);

    const onPointerMove = (moveEv) => {
      seekToClientX(moveEv.clientX);
    };

    const onPointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Форматирование времени в секундах (минуты:секунды)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleNext = () => {
    if (currentIndex < shortsList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(shortsList.length - 1);
    }
  };

  // Глобальное снятие зажатия ползунка звука
  useEffect(() => {
    if (isDraggingVolume) {
      const handleGlobalMouseUp = () => {
        setIsDraggingVolume(false);
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchend', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('touchend', handleGlobalMouseUp);
      };
    }
  }, [isDraggingVolume]);

  // Управление громкостью
  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted(prev => {
      const next = !prev;
      if (!next && volume === 0) {
        setVolume(0.8);
      }
      return next;
    });
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  // Жесты свайпа: зажатие мышки (pointer drag)
  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, textarea, a, .short-progress-track, .volume-control-wrap, .volume-slider-track-wrap, .shorts-comments-overlay, .shorts-comments-drawer, .short-actions-rail')) {
      return;
    }
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    dragDeltaY.current = 0;
    dragStartTime.current = Date.now();
    isDragging.current = true;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaY = e.clientY - dragStartY.current;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      dragDeltaY.current = deltaY;
      setDragTranslateY(deltaY * 0.35); // Физический визуальный отклик на перетаскивание
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = dragDeltaY.current;
    const deltaTime = Date.now() - dragStartTime.current;
    setDragTranslateY(0);

    // Свайп вверх -> следующий ролик
    if (deltaY < -45) {
      handleNext();
    }
    // Свайп вниз -> предыдущий ролик
    else if (deltaY > 45) {
      handlePrev();
    }
    // Простой клик без смещения -> переключение паузы/воспроизведения
    else if (Math.abs(deltaY) < 8 && deltaTime < 350) {
      togglePlay();
    }
    dragDeltaY.current = 0;
  };

  const toggleLike = () => {
    const isLiked = likedMap[currentShort.id];
    setLikedMap(prev => ({ ...prev, [currentShort.id]: !isLiked }));
    setLikesCountMap(prev => ({
      ...prev,
      [currentShort.id]: isLiked ? Math.max(0, (prev[currentShort.id] || 1) - 1) : (prev[currentShort.id] || 0) + 1
    }));
  };

  const toggleFollow = () => {
    setFollowingMap(prev => ({
      ...prev,
      [currentShort.author]: !prev[currentShort.author]
    }));
  };

  const handleDonateClick = () => {
    if (onDonate) {
      onDonate(50);
    }
    setDonationToast('💸 50 $SWAG ПЕРЕВЕДЕНО АВТОРУ!');
    setTimeout(() => {
      setDonationToast(null);
    }, 2500);
  };

  // Добавление комментария
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const added = {
      id: Date.now(),
      user: `${currentUser?.name || 'MACAN'} (БОСС)`,
      text: newComment.trim(),
      time: 'только что'
    };

    const updatedShorts = shortsList.map(s => {
      if (s.id === currentShort.id) {
        return {
          ...s,
          comments: [added, ...(s.comments || [])],
          commentsCount: (s.commentsCount || 0) + 1
        };
      }
      return s;
    });

    setShortsList(updatedShorts);
    db.saveShorts(updatedShorts);
    setNewComment('');
  };

  return (
    <div className="shorts-feed-container">
      {/* Аудиоплеер для звуковых дорожек: активен ТОЛЬКО при отсутствии видео */}
      <audio 
        ref={audioRef} 
        src={!hasVideo ? (currentShort?.audioSrc || (currentShort?.id === 'letnik-short-1' ? '/letnik.mp3' : undefined)) : undefined}
        loop 
        muted={isMuted} 
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
      />

      {donationToast && (
        <div className="swag-donation-toast">
          <span className="toast-icon">💸</span>
          <span>{donationToast}</span>
        </div>
      )}

      {/* КАРТОЧКА SHORTS СТРОГО В 9:16 ФОРМАТЕ С ПОДДЕРЖКОЙ СВАЙПА */}
      <div
        ref={shortCardRef}
        className={`cyber-short-card ${isDragging.current ? 'is-dragging' : ''}`}
        style={{ 
          background: currentShort?.bgGradient || '#050505',
          transform: dragTranslateY ? `translateY(${dragTranslateY}px)` : 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="short-scanlines"></div>
        <div className="short-hud-frame">
          <div className="hud-corner top-left"></div>
          <div className="hud-corner top-right"></div>
          <div className="hud-corner bottom-left"></div>
          <div className="hud-corner bottom-right"></div>
        </div>

        {/* 1. ЕСЛИ ВИДЕО: ВЬЮПОРТ БЕЗ ЛИШНИХ ПАНЕЛЕЙ НА КАРТИНКЕ */}
        {hasVideo ? (
          <div className="short-video-viewport">
            {/* Фоновое размытое видео для сохранения пропорций 9:16 */}
            <video 
              key={`ambient-${currentShort.id}-${resolvedVideoSrc}`}
              src={resolvedVideoSrc || currentShort.videoSrc}
              poster={resolvedPosterSrc}
              className="short-video-ambient-bg"
              loop
              muted
              autoPlay
              playsInline
            />
            {/* Основное видео по центру */}
            <video 
              key={`main-${currentShort.id}-${resolvedVideoSrc}`}
              ref={videoRef}
              src={resolvedVideoSrc || currentShort.videoSrc}
              poster={resolvedPosterSrc}
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              onError={handleVideoError}
              className={`short-bg-video ${fitMode === 'cover' ? 'mode-cover' : 'mode-contain'}`}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleMetadataLoaded}
              onEnded={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
              }}
            />
          </div>
        ) : hasImage ? (
          /* 2. ЕСЛИ КАРТИНКА: ЧИСТАЯ КАРТИНКА БЕЗ ПАНЕЛЕЙ И БЕЗ ВИЗУАЛИЗАТОРОВ СВЕРХУ */
          <div className="short-video-viewport">
            <img 
              src={imageSource} 
              alt={currentShort?.description || 'Short'} 
              className="short-video-ambient-bg"
            />
            <img 
              src={imageSource} 
              alt={currentShort?.description || 'Short'} 
              className={`short-bg-video ${fitMode === 'cover' ? 'mode-cover' : 'mode-contain'}`}
            />
          </div>
        ) : (
          /* 3. ИНАЧЕ ТОЛЬКО ЧИСТЫЙ АУДИО-ВИЗУАЛИЗАТОР */
          <div className="short-visual-viewport">
            <div className={`cyber-audio-visualizer ${isPlaying ? 'active' : ''}`}>
              <div className="wave-circle c1"></div>
              <div className="wave-circle c2"></div>
              <div className="wave-circle c3"></div>
              <div className="equalizer-bars">
                {[...Array(16)].map((_, i) => (
                  <span
                    key={i}
                    className="eq-bar"
                    style={{ animationDelay: `${(i % 5) * 0.15}s` }}
                  ></span>
                ))}
              </div>
              <div className="visualizer-glitch-badge">
                {currentShort?.badge || 'SWAG DROP'}
              </div>
            </div>
          </div>
        )}

        {/* ВЕРХНЯЯ ПАНЕЛЬ: БЕЙДЖ, КНОПКА ЗАГРУЗКИ, КНОПКА ГРОМКОСТИ И FIT */}
        <div className="short-top-bar" onClick={(e) => e.stopPropagation()}>
          <span className="short-live-badge">
            <span className="rec-dot blink"></span> 💀 VAMP4 SHORTS
          </span>
          <div className="top-bar-controls">
            {/* Переключатель адаптации разрешения (Fit/Crop) */}
            {(hasVideo || hasImage) && (
              <button
                className="fit-toggle-btn"
                onClick={() => setFitMode(prev => (prev === 'contain' ? 'cover' : 'contain'))}
                title={fitMode === 'contain' ? 'Переключить в полный масштаб (Cover)' : 'Переключить в 9:16 Fit'}
              >
                {fitMode === 'contain' ? '📺 9:16' : '🔍 CROP'}
              </button>
            )}

            {/* КНОПКА ГРОМКОСТИ С ПЛАВНЫМ ГОРИЗОНТАЛЬНЫМ ПОЛЗУНКОМ */}
            <div 
              className={`volume-control-wrap ${isVolumeHovered || isDraggingVolume ? 'is-expanded' : ''}`}
              onMouseEnter={() => setIsVolumeHovered(true)}
              onMouseLeave={() => {
                if (!isDraggingVolume) setIsVolumeHovered(false);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`sound-toggle-btn ${isMuted || volume === 0 ? 'muted' : 'active'}`}
                onClick={toggleMute}
                title={isMuted ? 'Включить звук' : `Громкость: ${Math.round(volume * 100)}% (Кликните для Mute)`}
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>

              <div 
                className="volume-slider-track-wrap"
                onMouseDown={() => setIsDraggingVolume(true)}
                onTouchStart={() => setIsDraggingVolume(true)}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onInput={handleVolumeChange}
                  className="volume-slider-input"
                  title={`Громкость: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
                <span className="volume-percent-badge">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
              </div>
            </div>

            {/* Полный экран */}
            <button
              className="fullscreen-toggle-btn"
              onClick={() => {
                if (!document.fullscreenElement) {
                  shortCardRef.current?.requestFullscreen?.().catch(() => {});
                } else {
                  document.exitFullscreen?.().catch(() => {});
                }
              }}
              title="Развернуть на весь экран"
            >
              ⛶
            </button>
          </div>
        </div>

        {/* НИЖНЯЯ ПАНЕЛЬ ДЕТАЛЕЙ КЛИПА (АВТОР, ОПИСАНИЕ, ТРЕК) */}
        <div className="short-bottom-details">
          <div className="short-author-row">
            <img
              src={currentShort?.authorAvatar || '/src/assets/macan-brat.jpg'}
              alt={currentShort?.authorName}
              className="short-author-avatar"
            />
            <div className="short-author-names">
              <span className="short-author-handle">
                {currentShort?.author}
                {isMyClip && <span className="short-author-you-badge">ВЫ</span>}
              </span>
              <span className="short-author-title">
                {currentShort?.authorName} {isMyClip && '(Вы)'}
              </span>
            </div>

            {/* ЕСЛИ АВТОР НЕ Я — ПОКАЗЫВАЕМ КНОПКУ ПОДПИСАТЬСЯ */}
            {!isMyClip ? (
              <button 
                className={`short-follow-btn cyber-btn ${followingMap[currentShort?.author] ? 'is-following' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow();
                }}
              >
                {followingMap[currentShort?.author] ? '✓ FOLLOWING' : '+ FOLLOW'}
              </button>
            ) : (
              <span className="short-my-creator-pill">АВТОР КЛИПА</span>
            )}
          </div>

          <p className="short-desc-text">
            {currentShort?.description}
          </p>

          {/* Хэштеги клипа на видео */}
          {Array.isArray(currentShort?.tags) && currentShort.tags.length > 0 && (
            <div className="short-tags-row">
              {currentShort.tags.map((tag, idx) => {
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                return (
                  <span key={idx} className="short-hashtag-badge">
                    {formattedTag}
                  </span>
                );
              })}
            </div>
          )}

          <div className="short-sound-ticker" onClick={togglePlay} style={{ cursor: 'pointer' }}>
            <span className="note-icon">🎵</span>
            <div className="marquee-text">
              <span>{currentShort?.soundTitle || 'Оригинальный кибер-звук'}</span>
            </div>
          </div>
        </div>

        {/* БОКОВАЯ РЕЙКА ВЗАИМОДЕЙСТВИЙ (TIKTOK STYLE) */}
        <div className="short-actions-rail" onClick={(e) => e.stopPropagation()}>
          {/* Лайк */}
          <button
            className={`action-rail-btn ${likedMap[currentShort?.id] ? 'liked' : ''}`}
            onClick={toggleLike}
            title={likedMap[currentShort?.id] ? 'Убрать лайк' : 'Поставить огонь'}
          >
            <span className="rail-icon">🔥</span>
            <span className="rail-label">
              {(likesCountMap[currentShort?.id] || currentShort?.likes || 0).toLocaleString()}
            </span>
          </button>

          {/* Комментарии */}
          <button
            className={`action-rail-btn ${showComments ? 'active-comm' : ''}`}
            onClick={() => setShowComments(!showComments)}
            title="Комментарии"
          >
            <span className="rail-icon">💬</span>
            <span className="rail-label">
              {(currentShort?.comments?.length || currentShort?.commentsCount || 0)}
            </span>
          </button>

          {/* Донат */}
          <button
            className="action-rail-btn donate-btn"
            onClick={handleDonateClick}
            title="Задонатить 50 SWAG автору"
          >
            <span className="rail-icon">💸</span>
            <span className="rail-label">ДОНАТ</span>
          </button>

          {/* Поделиться */}
          <button
            className="action-rail-btn"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Ссылка на клип скопирована в буфер!');
            }}
            title="Скопировать ссылку"
          >
            <span className="rail-icon">↗️</span>
            <span className="rail-label">ШАР</span>
          </button>

          {/* Винил */}
          <div 
            className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`} 
            onClick={togglePlay}
            style={{ cursor: 'pointer' }}
            title="Клик для паузы/проигрывания"
          >
            <div className="disc-inner">💿</div>
          </div>

          {/* Стрелки переключения клипов */}
          <div 
            className="short-nav-arrows"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              className="arrow-btn" 
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }} 
              title="Предыдущий клип"
            >
              ▲
            </button>
            <button 
              type="button"
              className="arrow-btn" 
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }} 
              title="Следующий клип"
            >
              ▼
            </button>
          </div>
        </div>

        {/* ИНТЕРАКТИВНАЯ ПОЛОСА ПРОГРЕССА С ПЕРЕМОТКОЙ И РЕАЛЬНЫМ ВРЕМЕНЕМ */}
        <div 
          ref={progressTrackRef}
          className={`short-progress-track ${isScrubbing ? 'is-scrubbing' : ''}`}
          onPointerDown={handleProgressPointerDown}
          title="Нажмите или потяните мышкой для перемотки клипа"
        >
          <div className="short-progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}>
            <span className="short-scrub-thumb"></span>
          </div>
          <div className="short-time-display">
            <span className="time-current">{formatTime(currentTime)}</span>
            <span className="time-divider">/</span>
            <span className="time-duration">{formatTime(duration || 15)}</span>
          </div>
        </div>
      </div>

      {/* ПАНЕЛЬ КОММЕНТАРИЕВ */}
      {showComments && (
        <div className="shorts-comments-overlay" onClick={() => setShowComments(false)}>
          <div className="shorts-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="comments-drawer-header">
              <h4>КОММЕНТАРИИ ({currentShort?.comments?.length || 0})</h4>
              <button 
                type="button"
                className="close-drawer-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="comments-drawer-list">
              {(currentShort?.comments || []).length === 0 ? (
                <div className="no-comments-prompt">Пока нет комментариев. Напишите первым!</div>
              ) : (
                (currentShort?.comments || []).map((comm) => (
                  <div key={comm.id} className="comment-bubble">
                    <div className="comm-top">
                      <span className="comm-user">@{comm.user}</span>
                      <span className="comm-time">{comm.time}</span>
                    </div>
                    <p className="comm-body">{comm.text}</p>
                  </div>
                ))
              )}
            </div>

            <form className="comment-input-row" onSubmit={handleAddComment}>
              <input
                type="text"
                className="cyber-input"
                placeholder="Оставить кибер-коммент..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="cyber-btn comment-send-btn">
                ОТПРАВИТЬ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortsFeed;

