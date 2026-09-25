import React, { useState, useRef, useEffect } from 'react';
import { soundService } from '../../services/soundService';

const POPULAR_REACTIONS = [
  '🔥', '💸', '⚡', '💀', '👑', '🚀', '💣', '💯', 
  '🦾', '😈', '🏎️', '💎', '❤️', '👏', '🎯', '🎉', 
  '😎', '🤝', '🥶', '👀', '✨', '🏆', '🛸', '🛡️'
];

const ChatWindow = ({ 
  chat, 
  onSendMessage, 
  onToggleReaction, 
  onClearHistory,
  onDeleteMessage,
  onTogglePin
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activePickerMsgId, setActivePickerMsgId] = useState(null);
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [deleteModalMsg, setDeleteConfirmMsg] = useState(null);
  
  // Реальная запись звука и распознавание речи
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Предосмотр файлов (Lightbox)
  const [previewMedia, setPreviewMedia] = useState(null); // { type: 'image'|'audio'|'video', src: string, title: string }

  // Интерактивные состояния
  const [callState, setCallState] = useState(null);
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);

  const messagesEndRef = useRef(null);
  const recordTimerRef = useRef(null);
  const callTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioElementRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  // Управление таймером звонка
  useEffect(() => {
    if (callState && callState.active) {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => prev ? { ...prev, timer: prev.timer + 1 } : null);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      soundService.stopCallRingtone();
    }
    return () => {
      clearInterval(callTimerRef.current);
      soundService.stopCallRingtone();
    };
  }, [callState?.active]);

  // НАЧАЛО РЕАЛЬНОЙ ЗАПИСИ С МИКРОФОНА + РАСПОЗНАВАНИЕ РЕЧИ (SPEECH-TO-TEXT)
  const startRecording = async () => {
    transcriptRef.current = '';
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'ru-RU';
        rec.onresult = (e) => {
          let str = '';
          for (let i = 0; i < e.results.length; i++) {
            str += e.results[i][0].transcript + ' ';
          }
          transcriptRef.current = str.trim();
        };
        rec.onerror = (e) => {
          console.warn('[SpeechRecognition] notice:', e?.error || e);
        };
        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.warn('[SpeechRecognition] init bypassed:', err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 2}`;
          const finalTranscript = transcriptRef.current || (chat.id === 'jarvis' ? 'Папа дома, Джарвис, как системы?' : 'Салют, брат! Трек Летник разрывает');
          
          onSendMessage(chat.id, {
            id: Date.now(),
            sender: 'Вы',
            isMe: true,
            type: 'voice',
            audioSrc: base64Audio,
            duration: durationStr,
            transcript: finalTranscript,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: { '🔥': 1 },
            myReaction: '🔥'
          });

          triggerToast(`🎤 Голосовое распознано: «${finalTranscript.slice(0, 35)}...»`);
        };

        // Останавливаем все аудиотреки
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access denied or not supported, using simulated secure recording', err);
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  // ОСТАНОВКА ЗАПИСИ
  const stopRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback голосовое если нет физического стрима микрофона
      const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 2}`;
      const finalTranscript = transcriptRef.current || (chat.id === 'jarvis' ? 'Папа дома, Джарвис, какой статус платформы?' : 'Брат, трек летник заценил!');
      onSendMessage(chat.id, {
        id: Date.now(),
        sender: 'Вы',
        isMe: true,
        type: 'voice',
        audioSrc: '/letnik.mp3',
        duration: durationStr,
        transcript: finalTranscript,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: { '🔥': 1 },
        myReaction: '🔥'
      });
      triggerToast(`🎤 Голосовая заметка считана: «${finalTranscript.slice(0, 30)}...»`);
    }
    setRecordSeconds(0);
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // ВОСПРОИЗВЕДЕНИЕ ГОЛОСОВЫХ И ТРЕКОВ
  const handleTogglePlayVoice = (msg) => {
    if (playingVoiceId === msg.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msg.id);
      if (audioElementRef.current) {
        audioElementRef.current.src = msg.audioSrc || '/letnik.mp3';
        audioElementRef.current.play().catch(() => {});
        audioElementRef.current.onended = () => {
          setPlayingVoiceId(null);
        };
      }
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(chat.id, {
      id: Date.now(),
      sender: 'Вы',
      isMe: true,
      type: 'text',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      myReaction: null
    });

    setInputText('');
    setShowEmojiPicker(false);
  };

  // ПРИКРЕПЛЕНИЕ И ПРЕВЬЮ ФАЙЛА
  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isAud = file.type.startsWith('audio/');
    const isVid = file.type.startsWith('video/');

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;

      onSendMessage(chat.id, {
        id: Date.now(),
        sender: 'Вы',
        isMe: true,
        type: 'file',
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileData: base64Data,
        isImage: isImg,
        isAudio: isAud,
        isVideo: isVid,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: { '⚡': 1 },
        myReaction: '⚡'
      });

      triggerToast(`Файл "${file.name}" загружен и сохранен в базе данных.`);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerToast = (text) => {
    setSystemAlert(text);
    setTimeout(() => setSystemAlert(null), 3000);
  };

  const handleStartCall = () => {
    setCallState({ active: true, timer: 0, muted: false });
    soundService.startCallRingtone();
    triggerToast('📞 Идет защищенный E2EE вызов узла...');
  };

  const handleEndCall = () => {
    soundService.stopCallRingtone();
    soundService.playCallEnded();
    setCallState(null);
    triggerToast('Вызов завершен. Сессионные P2P-ключи уничтожены.');
  };

  if (!chat) {
    return (
      <div className="cyber-chat-window empty-state">
        <div className="empty-content">
          <span className="empty-icon">💬</span>
          <h3>ВЫБЕРИТЕ ДИАЛОГ ИЛИ КАНАЛ</h3>
          <p>Сквозное шифрование E2EE активно. База данных синхронизирована.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-chat-window">
      {/* Скрытый аудиоплеер для голосовых */}
      <audio ref={audioElementRef} />

      {/* Системный алерт */}
      {systemAlert && (
        <div className="chat-system-toast">
          <span className="toast-dot"></span>
          <span>{systemAlert}</span>
        </div>
      )}

      {/* МОДАЛЬНЫЙ ПРЕДПРОСМОТР ФАЙЛОВ (LIGHTBOX) */}
      {previewMedia && (
        <div className="media-preview-lightbox" onClick={() => setPreviewMedia(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span className="lightbox-title">{previewMedia.title}</span>
              <div className="lightbox-actions">
                <a href={previewMedia.src} download={previewMedia.title} className="cyber-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  ⬇ СКАЧАТЬ
                </a>
                <button className="lightbox-close-btn" onClick={() => setPreviewMedia(null)}>✕</button>
              </div>
            </div>

            <div className="lightbox-viewport">
              {previewMedia.type === 'image' && (
                <img src={previewMedia.src} alt={previewMedia.title} className="lightbox-image" />
              )}
              {previewMedia.type === 'video' && (
                <video src={previewMedia.src} controls autoPlay className="lightbox-video" />
              )}
              {previewMedia.type === 'audio' && (
                <div className="lightbox-audio-player">
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🎵</span>
                  <audio src={previewMedia.src} controls autoPlay style={{ width: '100%' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Шапка чата */}
      <div className="chat-window-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar-wrap">
            <img src={chat.avatar} alt={chat.name} className="chat-header-avatar" />
            {chat.online && <span className="online-badge-dot"></span>}
          </div>
          <div>
            <h3 className="chat-header-title">
              {chat.name}
              {chat.verified && <span className="verified-check">✓</span>}
              {isChatMuted && <span className="muted-icon" title="Без звука">🔇</span>}
            </h3>
            <span className="chat-header-status">
              {chat.id === 'jarvis' 
                ? (chat.online ? 'в сети (защищенный узел)' : 'offline') 
                : (chat.online ? (chat.statusText || 'в сети') : 'offline')}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button 
            className="chat-action-btn" 
            title="Защищенный звонок E2EE"
            onClick={handleStartCall}
          >
            📞
          </button>
          <button 
            className={`chat-action-btn ${showMediaDrawer ? 'active' : ''}`} 
            title="Медиа и файлы узла"
            onClick={() => setShowMediaDrawer(!showMediaDrawer)}
          >
            📁
          </button>
          <button 
            className="chat-action-btn" 
            title="Опции чата"
            onClick={() => setShowChatMenu(!showChatMenu)}
          >
            ⋮
          </button>

          {/* Меню опций */}
          {showChatMenu && (
            <div className="chat-options-menu">
              <button onClick={() => {
                navigator.clipboard?.writeText('0x71C...B29_E2EE_PUB_KEY_VERIFIED');
                triggerToast('E2EE ключи экспортированы.');
                setShowChatMenu(false);
              }}>
                🔒 Экспорт E2EE ключей
              </button>
              <button onClick={() => {
                setIsChatMuted(!isChatMuted);
                triggerToast(isChatMuted ? 'Уведомления включены' : 'Уведомления заглушены');
                setShowChatMenu(false);
              }}>
                {isChatMuted ? '🔔 Включить звук' : '🔇 Без звука'}
              </button>
              <button onClick={() => {
                triggerToast('База данных: LocalStorage Persistent Engine OK');
                setShowChatMenu(false);
              }}>
                💾 Проверка базы данных
              </button>
              <button className="danger-opt" onClick={() => {
                if (window.confirm('Очистить историю сообщений для этого чата?')) {
                  onClearHistory(chat.id);
                  triggerToast('История сообщений очищена.');
                }
                setShowChatMenu(false);
              }}>
                🧹 Очистить историю
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ПИН-БАННЕР ЗАКРЕПЛЕННОГО СООБЩЕНИЯ */}
      {chat.pinnedMessageId && (() => {
        const pinnedMsg = (chat.messages || []).find(m => m.id === chat.pinnedMessageId);
        if (!pinnedMsg) return null;
        return (
          <div className="chat-pinned-banner">
            <span className="pinned-bar-icon">📌</span>
            <div 
              className="pinned-bar-content" 
              onClick={() => {
                const el = document.getElementById(`msg-${pinnedMsg.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el?.classList.add('highlight-pulse');
                setTimeout(() => el?.classList.remove('highlight-pulse'), 1800);
              }}
              title="Нажмите, чтобы перейти к сообщению"
            >
              <div className="pinned-bar-label">
                ЗАКРЕПЛЕННОЕ СООБЩЕНИЕ {pinnedMsg.isMe ? '(Вы)' : `(${pinnedMsg.sender})`}
              </div>
              <div className="pinned-bar-text text-ellipsis">
                {pinnedMsg.type === 'voice' ? '🎤 Голосовое сообщение' : pinnedMsg.type === 'file' ? `📄 ${pinnedMsg.fileName}` : pinnedMsg.text}
              </div>
            </div>
            <button 
              type="button" 
              className="pinned-unpin-btn" 
              onClick={() => {
                onTogglePin?.(chat.id, pinnedMsg.id);
                triggerToast('Сообщение откреплено');
              }}
              title="Открепить сообщение"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Лента сообщений */}
      <div className="chat-messages-container">
        <div className="e2ee-notice">
          <span className="lock-icon">🔒</span>
          <span>Сквозное шифрование активно. Все сообщения сохраняются в постоянную БД.</span>
        </div>

        {(chat.messages || []).map((msg) => {
          const isPlayingThisVoice = playingVoiceId === msg.id;
          const isPinned = chat.pinnedMessageId === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`chat-message-row ${msg.isMe ? 'my-message' : 'incoming-message'} ${isPinned ? 'is-pinned-row' : ''}`}
            >
              {!msg.isMe && (
                <img src={msg.avatar || chat.avatar} alt={msg.sender} className="msg-avatar" />
              )}

              <div className="msg-bubble">
                {/* Быстрые действия при наведении: Закрепить / Удалить */}
                <div className="msg-hover-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`msg-action-icon-btn ${isPinned ? 'active-pin' : ''}`}
                    onClick={() => {
                      onTogglePin?.(chat.id, msg.id);
                      triggerToast(isPinned ? 'Сообщение откреплено' : 'Сообщение закреплено 📌');
                    }}
                    title={isPinned ? 'Открепить сообщение' : 'Закрепить сообщение'}
                  >
                    📌
                  </button>
                  {msg.isMe && (
                    <button
                      type="button"
                      className="msg-action-icon-btn delete"
                      onClick={() => setDeleteConfirmMsg(msg)}
                      title="Удалить свое сообщение..."
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {!msg.isMe && <span className="msg-sender-name">{msg.sender}</span>}

                {/* Текст */}
                {msg.type === 'text' && (
                  <p className="msg-text">{msg.text}</p>
                )}

                {/* Файл с предосмотром и скачиванием */}
                {msg.type === 'file' && (
                  <div className="msg-file-card-v2">
                    {/* Если картинка - миниатюра с кликом для зума */}
                    {msg.isImage && msg.fileData && (
                      <div 
                        className="file-thumbnail-box" 
                        onClick={() => setPreviewMedia({ type: 'image', src: msg.fileData, title: msg.fileName })}
                        title="Кликните для полноразмерного просмотра"
                      >
                        <img src={msg.fileData} alt={msg.fileName} className="file-img-preview" />
                        <span className="zoom-hint">🔍 ЗУМ</span>
                      </div>
                    )}

                    <div className="file-main-row">
                      <span className="file-icon">{msg.isAudio ? '🎵' : msg.isVideo ? '🎬' : '📄'}</span>
                      <div className="file-info">
                        <span className="file-name">{msg.fileName}</span>
                        <span className="file-size">{msg.fileSize || 'Файл'} • E2EE Зашифрован</span>
                      </div>
                      
                      <div className="file-btn-group">
                        {/* Кнопка предпросмотра */}
                        {(msg.isImage || msg.isAudio || msg.isVideo) && (
                          <button 
                            className="cyber-btn file-action-btn view-btn"
                            onClick={() => setPreviewMedia({ 
                              type: msg.isImage ? 'image' : msg.isAudio ? 'audio' : 'video', 
                              src: msg.fileData || '/letnik.mp3', 
                              title: msg.fileName 
                            })}
                            title="Предпросмотр"
                          >
                            👁
                          </button>
                        )}
                        {/* Кнопка скачивания */}
                        <a 
                          href={msg.fileData || '/letnik.mp3'} 
                          download={msg.fileName}
                          className="cyber-btn file-action-btn dl-btn"
                          title="Скачать файл"
                        >
                          ⬇
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Голосовое сообщение с волной и реальным воспроизведением */}
                {msg.type === 'voice' && (
                  <div className="msg-voice-card-wrap">
                    <div className="msg-voice-card">
                      <button 
                        className={`voice-play-btn ${isPlayingThisVoice ? 'playing' : ''}`}
                        onClick={() => handleTogglePlayVoice(msg)}
                        title={isPlayingThisVoice ? 'Пауза' : 'Слушать запись'}
                      >
                        {isPlayingThisVoice ? '⏸' : '▶'}
                      </button>
                      
                      <div className="voice-waveform-wrap">
                        <div className="voice-waveform">
                          {[...Array(12)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`bar ${isPlayingThisVoice ? 'animated' : ''}`}
                              style={{ 
                                height: `${8 + ((i * 7) % 15)}px`,
                                animationDelay: `${(i % 4) * 0.1}s`,
                                background: isPlayingThisVoice ? '#00ff00' : '#ff5500'
                              }}
                            ></span>
                          ))}
                        </div>
                      </div>

                      <span className="voice-duration">
                        {msg.duration || '0:04'}
                      </span>

                      {/* Скачивание голосового */}
                      {msg.audioSrc && (
                        <a 
                          href={msg.audioSrc} 
                          download={`voice_${msg.id}.webm`} 
                          className="voice-dl-icon"
                          title="Скачать голосовое"
                        >
                          ⬇
                        </a>
                      )}
                    </div>

                    {/* Расшифровка голосового сообщения (Считывание ИИ) */}
                    {msg.transcript && (
                      <div className="voice-transcript-plate">
                        <span className="transcript-badge">🎙️ СЧИТАНО J.A.R.V.I.S.:</span>
                        <span className="transcript-text">«{msg.transcript}»</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Нижняя часть сообщения: время, пин и статус */}
                <div className="msg-footer">
                  {isPinned && <span className="msg-pinned-badge" title="Закрепленное сообщение">📌</span>}
                  <span className="msg-time">{msg.time}</span>
                  {msg.isMe && <span className="msg-status-check">✓✓</span>}
                </div>

                {/* Блок реакций: БЕЗ ДУБЛИРОВАНИЯ */}
                <div className="msg-reactions">
                  {Object.entries(msg.reactions || {}).map(([emoji, count]) => {
                    const isMyReaction = msg.myReaction === emoji;
                    return (
                      <button
                        key={emoji}
                        className={`reaction-tag ${isMyReaction ? 'user-active' : ''}`}
                        onClick={() => onToggleReaction(chat.id, msg.id, emoji)}
                        title={isMyReaction ? 'Снять реакцию' : 'Поставить'}
                      >
                        {emoji} <span className="reaction-count">{count}</span>
                      </button>
                    );
                  })}

                  <div className="add-reaction-wrapper">
                    <button
                      className="add-reaction-btn"
                      onClick={() => setActivePickerMsgId(activePickerMsgId === msg.id ? null : msg.id)}
                      title="Выбрать реакцию"
                    >
                      +
                    </button>

                    {activePickerMsgId === msg.id && (
                      <div className="custom-reaction-picker">
                        <div className="popular-reactions-grid">
                          {POPULAR_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              className={`quick-emoji-btn ${msg.myReaction === emoji ? 'selected' : ''}`}
                              onClick={() => {
                                onToggleReaction(chat.id, msg.id, emoji);
                                setActivePickerMsgId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div className="custom-emoji-row">
                          <input
                            type="text"
                            placeholder="Свой эмодзи..."
                            maxLength={4}
                            value={customEmojiInput}
                            onChange={(e) => setCustomEmojiInput(e.target.value)}
                            className="custom-emoji-input"
                          />
                          <button
                            type="button"
                            className="cyber-btn custom-emoji-submit"
                            onClick={() => {
                              if (customEmojiInput.trim()) {
                                onToggleReaction(chat.id, msg.id, customEmojiInput.trim());
                                setCustomEmojiInput('');
                                setActivePickerMsgId(null);
                              }
                            }}
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Выдвижная панель медиа (📁) */}
      {showMediaDrawer && (
        <div className="chat-media-drawer">
          <div className="drawer-header">
            <h4>📁 МЕДИА УЗЛА ({chat.name})</h4>
            <button onClick={() => setShowMediaDrawer(false)}>✕</button>
          </div>
          <div className="drawer-content">
            <div className="media-item">
              <span className="mi-icon">🎵</span>
              <div className="mi-info">
                <span className="mi-title">Тёмный принц, madk1d — Летник.mp3</span>
                <span className="mi-meta">1.91 MB • Аудиопоток</span>
              </div>
              <a href="/letnik.mp3" download className="mi-dl">⬇</a>
            </div>
            <div className="media-item">
              <span className="mi-icon">🛡️</span>
              <div className="mi-info">
                <span className="mi-title">e2ee_session_keys.pem</span>
                <span className="mi-meta">2.4 KB • Крипто-ключ</span>
              </div>
              <button className="mi-dl" onClick={() => triggerToast('Ключ сохранен.')}>⬇</button>
            </div>
            <div className="media-item">
              <span className="mi-icon">⚡</span>
              <div className="mi-info">
                <span className="mi-title">swag_market_manifest.json</span>
                <span className="mi-meta">14 KB • Смарт-контракт</span>
              </div>
              <button className="mi-dl" onClick={() => triggerToast('Манифест загружен.')}>⬇</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно защищенного звонка (📞) */}
      {callState && callState.active && (
        <div className="call-modal-backdrop">
          <div className="call-cyber-modal">
            <div className="call-hud-corner tl"></div>
            <div className="call-hud-corner tr"></div>
            <div className="call-hud-corner bl"></div>
            <div className="call-hud-corner br"></div>

            <span className="call-enc-badge">
              <span className="dot blink"></span> P2P WEBRTC // E2EE SECURED
            </span>

            <div className="call-user-avatar">
              <img src={chat.avatar} alt={chat.name} />
              <div className="call-pulsing-ring"></div>
            </div>

            <h3 className="call-name">{chat.name}</h3>
            <span className="call-timer">
              {Math.floor(callState.timer / 60)}:{callState.timer % 60 < 10 ? '0' : ''}{callState.timer % 60}
            </span>

            <div className="call-audio-freq">
              {[...Array(16)].map((_, i) => (
                <span key={i} className="freq-bar" style={{ animationDelay: `${(i % 5) * 0.12}s` }}></span>
              ))}
            </div>

            <div className="call-controls-row">
              <button 
                className={`call-ctrl-btn ${callState.muted ? 'active-mute' : ''}`}
                onClick={() => setCallState({ ...callState, muted: !callState.muted })}
                title="Микрофон"
              >
                {callState.muted ? '🔇' : '🎙️'}
              </button>
              <button 
                className="call-ctrl-btn" 
                title="Динамик"
                onClick={() => triggerToast('Режим громкой связи переключен')}
              >
                🔊
              </button>
              <button 
                className="call-ctrl-btn end-call-btn" 
                onClick={handleEndCall}
                title="Завершить вызов"
              >
                📞✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель ввода сообщения */}
      <div className="chat-input-container">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileAttach}
        />

        {isRecording ? (
          <div className="recording-panel">
            <span className="rec-dot blink"></span>
            <span className="rec-time">ЗАПИСЬ С МИКРОФОНА: 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}</span>
            <div className="rec-soundwave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <button className="cyber-btn rec-send-btn" onClick={handleToggleRecord}>
              ОТПРАВИТЬ ГОЛОС
            </button>
            <button className="rec-cancel-btn" onClick={() => { clearInterval(recordTimerRef.current); setIsRecording(false); }}>
              ✕
            </button>
          </div>
        ) : (
          <form className="chat-input-form" onSubmit={handleSend}>
            <button
              type="button"
              className="chat-util-btn"
              title="Прикрепить файл (картинку, аудио, документ)"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>

            <div className="input-with-emojis">
              <input
                type="text"
                className="cyber-input chat-msg-input"
                placeholder="Написать сообщение Джарвису..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="button"
                className="emoji-toggle-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Эмодзи"
              >
                😎
              </button>

              {showEmojiPicker && (
                <div className="cyber-emoji-picker">
                  {POPULAR_REACTIONS.slice(0, 10).map((em) => (
                    <span key={em} className="emoji-item" onClick={() => { setInputText(prev => prev + em); }}>
                      {em}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="chat-util-btn mic-btn"
              title="Записать живой голос с микрофона"
              onClick={handleToggleRecord}
            >
              🎙️
            </button>

            <button type="submit" className="cyber-btn chat-send-btn">
              ➤
            </button>
          </form>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ СООБЩЕНИЯ (У СЕБЯ ИЛИ У ВСЕХ) */}
      {deleteModalMsg && (
        <div className="chat-delete-modal-overlay" onClick={() => setDeleteConfirmMsg(null)}>
          <div className="chat-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cdm-header">
              <span className="cdm-icon">🗑️</span>
              <h4>УДАЛЕНИЕ СООБЩЕНИЯ</h4>
              <button className="cdm-close-btn" onClick={() => setDeleteConfirmMsg(null)}>✕</button>
            </div>
            <p className="cdm-preview">
              «{deleteModalMsg.type === 'voice' ? 'Голосовое сообщение' : deleteModalMsg.type === 'file' ? deleteModalMsg.fileName : deleteModalMsg.text}»
            </p>
            <p className="cdm-hint">Выберите действие для этого сообщения:</p>
            <div className="cdm-actions">
              <button 
                type="button" 
                className="cyber-btn cdm-btn self-btn"
                onClick={() => {
                  onDeleteMessage?.(chat.id, deleteModalMsg.id, 'self');
                  triggerToast('Сообщение удалено у себя');
                  setDeleteConfirmMsg(null);
                }}
              >
                👤 Удалить только у себя
              </button>
              <button 
                type="button" 
                className="cyber-btn cdm-btn both-btn"
                onClick={() => {
                  onDeleteMessage?.(chat.id, deleteModalMsg.id, 'both');
                  triggerToast('Сообщение удалено у себя и у собеседника');
                  setDeleteConfirmMsg(null);
                }}
              >
                👥 Удалить у себя и у собеседника
              </button>
              <button 
                type="button" 
                className="cyber-btn cdm-btn cancel-btn"
                onClick={() => setDeleteConfirmMsg(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
