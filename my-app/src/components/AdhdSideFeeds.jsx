import React, { useState, useRef, useEffect } from 'react';
import './AdhdSideFeeds.css';

const ADHD_CONFIG = {
  left: [
    {
      id: 'soap',
      tag: '🧼 РЕЖЕМ МЫЛО ТИКТОК',
      videos: [
        { id: 'WZGvRIH4NyY', title: 'TikTok ASMR Soap Cutting (1 Hour Compilation)' },
        { id: 'AfyBiOgDzSs', title: 'Soap Cutting TikTok Compilation #1' },
        { id: 'VkDfPym56bE', title: 'Satisfying Soap Cutting TikTok ASMR' }
      ]
    },
    {
      id: 'subway',
      tag: '🏃 SUBWAY SURFERS',
      videos: [
        { id: 'zZ7AimPACzc', title: 'Subway Surfers 1 Hour Gameplay (No Commentary)' }
      ]
    }
  ],
  right: [
    {
      id: 'carpet',
      tag: '🧹 МОЙКА КОВРА ASMR',
      videos: [
        { id: 'C_eippl1OUQ', title: 'Mountain Rug Deep Clean ASMR' },
        { id: 'pZboictyoPA', title: 'Cream Rug Extreme Clean ASMR' },
        { id: 'cZ-CLEIJWFs', title: 'Extreme Carpet Cleaning (60s ASMR)' }
      ]
    },
    {
      id: 'familyguy',
      tag: '📺 ГРИФФИНЫ 1 ЭПИЗОД',
      videos: [
        { id: 'LP57N6Vi8RQ', title: 'Гриффины: 1 Сезон 1 Серия (Family Guy S1E1 Full)' },
        { id: 'm-yrOmLXio4', title: 'Family Guy Funny Moments S1E1' },
        { id: 'kE7sjoQtmmQ', title: 'Family Guy 33 Min Funny Moments Compilation' }
      ]
    }
  ]
};

function AdhdVideoCard({ item }) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef(null);
  const currentVideo = item.videos[videoIndex] || item.videos[0];

  const handleNextVideo = (e) => {
    e.stopPropagation();
    setVideoIndex((prev) => (prev + 1) % item.videos.length);
  };

  const sendIframeCommand = (func, args = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (e) {
      // ignore cross-origin access errors
    }
  };

  // Автоматический запуск воспроизведения без ручного нажатия
  const autoStartPlayback = () => {
    // 1. Обязательно глушим звук (браузеры 100% разрешают автоплей только с mute)
    sendIframeCommand('mute');
    // 2. Командуем запуск воспроизведения
    sendIframeCommand('playVideo');
  };

  // Пульсирующий запуск при монтировании и при переключении клипа
  useEffect(() => {
    const t0 = setTimeout(autoStartPlayback, 200);
    const t1 = setTimeout(autoStartPlayback, 600);
    const t2 = setTimeout(autoStartPlayback, 1200);
    const t3 = setTimeout(autoStartPlayback, 2200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [currentVideo.id]);

  // Слушаем сообщения от плеера: если он на паузе, заставляем продолжать играть
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          // Если плеер стал на паузу (2) или завершился (0), немедленно возобновляем
          if (data.info.playerState === 2 || data.info.playerState === 0) {
            sendIframeCommand('playVideo');
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      sendIframeCommand('mute');
    } else {
      sendIframeCommand('unMute');
      sendIframeCommand('setVolume', [100]);
      sendIframeCommand('playVideo');
    }
  };

  // controls=0 убирает кнопки и экран ожидания, гарантируя моментальный автостарт
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const embedSrc = `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${currentVideo.id}&enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3&modestbranding=1&origin=${encodeURIComponent(origin)}`;

  return (
    <div className="adhd-video-card">
      <div className="adhd-card-hud-bar">
        <div className="adhd-hud-left">
          <span className="adhd-card-tag" title={currentVideo.title}>{item.tag}</span>
        </div>
        <div className="adhd-hud-actions">
          {item.videos.length > 1 && (
            <button
              className="adhd-hud-btn"
              onClick={handleNextVideo}
              title="Переключить следующее видео"
              aria-label="Next video"
            >
              🔀 <span className="adhd-counter">{videoIndex + 1}/{item.videos.length}</span>
            </button>
          )}
          <button
            className={`adhd-hud-btn sound-toggle-btn ${!isMuted ? 'active' : ''}`}
            onClick={toggleSound}
            title={isMuted ? "Включить звук (по умолчанию автоплей без звука)" : "Выключить звук"}
            aria-label="Toggle sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="adhd-hud-btn icon-only"
            title="Открыть на YouTube"
            aria-label="Open on YouTube"
          >
            ↗
          </a>
          <span className="adhd-live-dot" title="Прямой эфир // Автоплей активен"></span>
        </div>
      </div>
      <div className="adhd-video-viewport">
        <iframe
          ref={iframeRef}
          key={`${item.id}-${currentVideo.id}`}
          src={embedSrc}
          title={currentVideo.title}
          className="adhd-iframe"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; web-share"
          allowFullScreen
          onLoad={() => {
            autoStartPlayback();
            setTimeout(autoStartPlayback, 300);
            setTimeout(autoStartPlayback, 800);
          }}
        />
      </div>
    </div>
  );
}

export default function AdhdSideFeeds({ active }) {
  if (!active) return null;

  return (
    <div className="adhd-global-wrapper" aria-label="СДВГ Режим">
      {/* ЛЕВАЯ КОЛОНКА (2 ВИДЕО: РЕЖЕМ МЫЛО ТИКТОК + САБВЕЙ СЕРФЕРС) */}
      <aside className="adhd-side-dock left-dock">
        <div className="adhd-dock-header">
          <span className="adhd-dock-title">🧠 СДВГ DOCK L</span>
          <span className="adhd-dock-status blink">AUTO LIVE</span>
        </div>

        {ADHD_CONFIG.left.map((item) => (
          <AdhdVideoCard key={item.id} item={item} />
        ))}
      </aside>

      {/* ПРАВАЯ КОЛОНКА (2 ВИДЕО: МОЙКА КОВРА + ГРИФФИНЫ 1 ЭПИЗОД) */}
      <aside className="adhd-side-dock right-dock">
        <div className="adhd-dock-header">
          <span className="adhd-dock-title">🧠 СДВГ DOCK R</span>
          <span className="adhd-dock-status blink">AUTO LIVE</span>
        </div>

        {ADHD_CONFIG.right.map((item) => (
          <AdhdVideoCard key={item.id} item={item} />
        ))}
      </aside>
    </div>
  );
}
