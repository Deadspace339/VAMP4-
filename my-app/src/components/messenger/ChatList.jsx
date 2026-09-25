import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { backendService } from '../../services/backendService';

const HYPE_TAGS = [
  '#Все',
  '#Роналдо2008',
  '#Арсенал2008',
  '#Баленсиаги',
  '#SoundCloud',
  '#КлешРояль',
  '#ДуракМастер'
];

const ChatList = ({ chats, activeChatId, onSelectChat }) => {
  const [filter, setFilter] = useState('all'); // all, channels, dms, bots
  const [search, setSearch] = useState('');

  // Состояние модалки хайпового поиска друзей
  const [showHypeFriendsModal, setShowHypeFriendsModal] = useState(false);
  const [friends, setFriends] = useState(() => db.getFriends());
  const [hypeQuery, setHypeQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('#Все');
  const [customHandle, setCustomHandle] = useState('');
  const [hypeSuccessToast, setHypeSuccessToast] = useState(null);

  useEffect(() => {
    const handleFriendsUpdate = (e) => {
      if (e.detail) setFriends(e.detail);
      else setFriends(db.getFriends());
    };
    window.addEventListener('swag_friends_updated', handleFriendsUpdate);
    return () => window.removeEventListener('swag_friends_updated', handleFriendsUpdate);
  }, []);

  const showToast = (msg) => {
    setHypeSuccessToast(msg);
    setTimeout(() => setHypeSuccessToast(null), 3000);
  };

  // Добавление в друзья
  const handleAddFriend = (user) => {
    const updated = db.addFriend(user);
    setFriends(updated);
    showToast(`✓ ${user.name} добавлен в друзья! Диалог открыт в списке.`);
  };

  // Удаление из друзей
  const handleRemoveFriend = (friendId) => {
    const updated = db.removeFriend(friendId);
    setFriends(updated);
    showToast('Удален из списка друзей.');
  };

  // Мгновенно написать пользователю (добавляет в друзья если нужно и открывает чат)
  const handleMessageUser = (user) => {
    const cleanHandle = user.handle.startsWith('@') ? user.handle : `@${user.handle}`;
    const friendsList = db.getFriends();
    
    // Если еще не в друзьях — добавляем
    if (!friendsList.some(f => f.handle.toLowerCase() === cleanHandle.toLowerCase() || f.id === user.id)) {
      const updatedFriends = db.addFriend(user);
      setFriends(updatedFriends);
    }

    // Открываем чат
    onSelectChat(user.id);
    if (showHypeFriendsModal) setShowHypeFriendsModal(false);
    showToast(`💬 Открыт диалог с ${user.name}! Напишите сообщение ниже.`);
  };

  // Добавление произвольного пользователя по хэндлу
  const handleAddCustomUser = (e) => {
    if (e) e.preventDefault();
    if (!customHandle.trim()) return;
    const clean = customHandle.trim().replace(/^@+/, '');
    const handleWithAt = `@${clean}`;
    const newUser = {
      id: `custom_${clean.toLowerCase()}`,
      name: clean.toUpperCase(),
      handle: handleWithAt,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
      statusText: 'В сети • Добавлен вручную через поиск SWAG',
      tags: ['#custom', '#hype'],
      online: true,
      verified: true
    };
    handleAddFriend(newUser);
    handleMessageUser(newUser);
    setCustomHandle('');
  };

  // Быстрый старт диалога из поисковой строки
  const handleQuickChatFromSearch = (rawQuery) => {
    const clean = rawQuery.trim().replace(/^@+/, '');
    if (!clean) return;
    const handleWithAt = `@${clean}`;
    const newUser = {
      id: `custom_${clean.toLowerCase()}`,
      name: clean.toUpperCase(),
      handle: handleWithAt,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
      statusText: 'В сети • Добавлен через глобальный поиск SWAG',
      tags: ['#swag', '#friend'],
      online: true,
      verified: true
    };
    handleAddFriend(newUser);
    handleMessageUser(newUser);
    setSearch('');
  };

  // Получение всех известных пользователей сети (Пресеты + Зарегистрированные аккаунты)
  const allNetworkUsers = useMemo(() => {
    const list = [...db.getHypeUsers()];
    try {
      const currentUser = db.getUser();
      const accounts = backendService.getAccounts() || [];
      const registered = accounts
        .filter(a => a.handle.toLowerCase() !== currentUser?.handle?.toLowerCase())
        .map(a => ({
          id: a.id,
          name: a.name,
          handle: a.handle,
          avatar: a.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
          statusText: a.bio || 'Участник защищенной E2EE сети SWAG INC.',
          tags: ['#swag', `#${(a.role || 'user').toLowerCase()}`],
          online: true,
          verified: a.role === 'FOUNDER' || a.rank === 'SWAG GOD'
        }));

      const handles = new Set(list.map(u => u.handle.toLowerCase()));
      for (const reg of registered) {
        if (!handles.has(reg.handle.toLowerCase())) {
          list.push(reg);
          handles.add(reg.handle.toLowerCase());
        }
      }
    } catch {}
    return list;
  }, [friends]);

  // Фильтрация существующих чатов
  const filteredChats = chats.filter(chat => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'channels' ? chat.type === 'channel' :
      filter === 'dms' ? chat.type === 'dm' :
      filter === 'bots' ? chat.type === 'bot' : true;
    
    const query = search.trim().toLowerCase();
    if (!query) return matchesFilter;

    const matchesSearch = 
      chat.name.toLowerCase().includes(query) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query)) ||
      (chat.statusText && chat.statusText.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  // Пользователи из глобальной сети, подходящие под поисковый запрос в строке поиска
  const matchingNetworkUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return allNetworkUsers.filter(u => {
      const q = query.replace(/^@/, '');
      return (
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.statusText.toLowerCase().includes(q) ||
        (u.tags && u.tags.some(t => t.toLowerCase().includes(q)))
      );
    });
  }, [search, allNetworkUsers]);

  // Фильтрация пользователей для модального окна хайпового поиска
  const filteredHypeUsers = allNetworkUsers.filter(u => {
    const query = hypeQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      u.name.toLowerCase().includes(query) || 
      u.handle.toLowerCase().includes(query) || 
      u.statusText.toLowerCase().includes(query) ||
      (u.tags && u.tags.some(t => t.toLowerCase().includes(query)));

    if (!matchesQuery) return false;

    if (selectedTag === '#Все') return true;
    const tagClean = selectedTag.toLowerCase().replace('#', '');
    return u.tags && u.tags.some(t => t.toLowerCase().includes(tagClean));
  });

  return (
    <div className="cyber-chat-list">
      {/* КНОПКА ХАЙПОВОГО ПОИСКА ДРУЗЕЙ */}
      <div className="hype-search-bar-wrap">
        <button
          type="button"
          className="hype-search-trigger-btn"
          onClick={() => setShowHypeFriendsModal(true)}
        >
          <span className="sparkle-anim">✨</span>
          <span>ХАЙПОВЫЙ ПОИСК ДРУЗЕЙ</span>
          <span className="badge-pulse">VAMP 4</span>
        </button>
      </div>

      {/* Поиск и фильтры чатов */}
      <div className="chat-list-header">
        <div className="chat-search-box enhanced-cyber-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="cyber-search-input"
            placeholder="ПОИСК ЧАТОВ, ДРУЗЕЙ, ТЕГОВ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Быстрые теги фильтрации прямо под поиском */}
        <div className="chat-quick-tag-pills">
          {HYPE_TAGS.slice(0, 5).map(tag => (
            <span 
              key={tag} 
              className={`quick-tag-chip ${search.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSearch(tag === '#Все' ? '' : tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="chat-filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            ВСЕ
          </button>
          <button
            className={`filter-tab ${filter === 'channels' ? 'active' : ''}`}
            onClick={() => setFilter('channels')}
          >
            КАНАЛЫ
          </button>
          <button
            className={`filter-tab ${filter === 'dms' ? 'active' : ''}`}
            onClick={() => setFilter('dms')}
          >
            ПРИВАТ
          </button>
          <button
            className={`filter-tab ${filter === 'bots' ? 'active' : ''}`}
            onClick={() => setFilter('bots')}
          >
            БОТЫ
          </button>
        </div>
      </div>

      {/* Список элементов чатов и результатов глобального поиска */}
      <div className="chat-items-scroll">
        {/* ЕСЛИ ПОЛЬЗОВАТЕЛЬ ВВЕЛ ПОИСКОВЫЙ ЗАПРОС — ПОКАЗЫВАЕМ ПОЛЬЗОВАТЕЛЕЙ СЕТИ SWAG */}
        {search.trim().length > 0 && (
          <div className="global-search-results-section">
            <div className="global-search-section-header">
              <span className="gsh-badge">🌐 СЕТЬ SWAG</span>
              <span className="gsh-title">НАЙДЕННЫЕ ПОЛЬЗОВАТЕЛИ ({matchingNetworkUsers.length})</span>
            </div>

            {matchingNetworkUsers.map((user) => {
              const isAlreadyFriend = friends.some(f => f.handle.toLowerCase() === user.handle.toLowerCase() || f.id === user.id);
              return (
                <div key={user.id} className="chat-network-user-card">
                  <div className="cnuc-avatar-box">
                    <img src={user.avatar} alt={user.name} className="cnuc-avatar" />
                    {user.online && <span className="online-badge-dot"></span>}
                  </div>

                  <div className="cnuc-info">
                    <div className="cnuc-name-row">
                      <span className="cnuc-name">{user.name}</span>
                      {user.verified && <span className="verified-check" title="Верифицирован">✓</span>}
                      <span className="cnuc-handle">{user.handle}</span>
                    </div>
                    <p className="cnuc-status text-ellipsis">{user.statusText}</p>
                  </div>

                  <div className="cnuc-actions">
                    {!isAlreadyFriend ? (
                      <button
                        type="button"
                        className="cyber-btn cnuc-add-btn"
                        onClick={() => handleAddFriend(user)}
                        title="Добавить в друзья"
                      >
                        ➕
                      </button>
                    ) : (
                      <span className="cnuc-friend-pill" title="Уже в друзьях">✓ ДРУГ</span>
                    )}

                    <button
                      type="button"
                      className="cyber-btn cnuc-chat-btn"
                      onClick={() => handleMessageUser(user)}
                      title="Написать сообщение"
                    >
                      💬 НАПИСАТЬ
                    </button>
                  </div>
                </div>
              );
            })}

            {matchingNetworkUsers.length === 0 && (
              <div className="quick-add-search-prompt">
                <p>Пользователь «{search}» не найден в списке контактов.</p>
                <button
                  type="button"
                  className="cyber-btn quick-add-prompt-btn"
                  onClick={() => handleQuickChatFromSearch(search)}
                >
                  ➕ НАЧАТЬ ДИАЛОГ С @{search.trim().replace(/^@/, '')}
                </button>
              </div>
            )}

            <div className="global-search-divider">
              <span>📁 ЧАТЫ И КАНАЛЫ ({filteredChats.length})</span>
            </div>
          </div>
        )}

        {/* СПИСОК ЧАТОВ */}
        {filteredChats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <div
              key={chat.id}
              className={`chat-item ${isActive ? 'active' : ''} ${chat.unread ? 'has-unread' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-item-avatar-wrapper">
                <img src={chat.avatar} alt={chat.name} className="chat-item-avatar" />
                {chat.online && <span className="online-badge-dot"></span>}
                {chat.isBot && <span className="bot-tag">AI</span>}
              </div>

              <div className="chat-item-info">
                <div className="chat-item-top">
                  <span className="chat-item-name">
                    {chat.name}
                    {chat.verified && <span className="verified-check" title="Верифицирован">✓</span>}
                  </span>
                  <span className="chat-item-time">{chat.time}</span>
                </div>

                <div className="chat-item-bottom">
                  <p className="chat-item-lastmsg text-ellipsis">
                    {chat.isTyping ? (
                      <span className="typing-indicator">печатает...</span>
                    ) : (
                      <>
                        {chat.lastSender && chat.lastMessage && chat.lastMessage !== 'История очищена' && (
                          <span className="last-sender">{chat.lastSender}: </span>
                        )}
                        {chat.lastMessage && chat.lastMessage !== 'История очищена' ? chat.lastMessage : ''}
                      </>
                    )}
                  </p>
                  {chat.unread > 0 && (
                    <span className="unread-counter">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredChats.length === 0 && matchingNetworkUsers.length === 0 && (
          <div className="no-chats-found">
            <span className="no-chats-icon">⚡</span>
            <p>НИЧЕГО НЕ НАЙДЕНО</p>
            <small>Попробуйте другой поисковый запрос или добавьте друга по @хэндлу</small>
            {search.trim().length > 0 && (
              <button 
                type="button" 
                className="cyber-btn mini-btn" 
                style={{ marginTop: '12px' }}
                onClick={() => handleQuickChatFromSearch(search)}
              >
                ➕ НАПИСАТЬ @{search.trim().replace(/^@/, '')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          МОДАЛЬНОЕ ОКНО: ХАЙПОВЫЙ ПОИСК ДРУЗЕЙ (VAMP 4 NETWORK)
          =================================================== */}
      {showHypeFriendsModal && (
        <div className="swag-modal-overlay hype-friends-modal-overlay" onClick={() => setShowHypeFriendsModal(false)}>
          <div className="swag-modal-card hype-friends-card" onClick={(e) => e.stopPropagation()}>
            <div className="hype-modal-header">
              <div className="hype-header-title">
                <span className="hype-icon-glow">✨</span>
                <div>
                  <h3>ХАЙПОВЫЙ ПОИСК ДРУЗЕЙ</h3>
                  <span className="hype-header-sub">VAMP 4 E2EE SOCIAL GRAPH • ДОБАВЛЯЙ В ДРУЗЬЯ И ПИШИ В ЧАТ</span>
                </div>
              </div>
              <button className="modal-close-icon" onClick={() => setShowHypeFriendsModal(false)}>✕</button>
            </div>

            {hypeSuccessToast && (
              <div className="hype-toast-banner">
                {hypeSuccessToast}
              </div>
            )}

            {/* Быстрые хайповые теги */}
            <div className="hype-tag-pills-row">
              {HYPE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`hype-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Строка поиска */}
            <div className="hype-search-input-wrap">
              <span className="hype-search-icon">🔍</span>
              <input
                type="text"
                className="cyber-input hype-main-search"
                placeholder="Поиск игроков по нику, хэндлу, тегам (#ronaldo, #arsenal, #balenciaga)..."
                value={hypeQuery}
                onChange={(e) => setHypeQuery(e.target.value)}
              />
              {hypeQuery && (
                <button className="clear-search-btn" onClick={() => setHypeQuery('')}>✕</button>
              )}
            </div>

            {/* Форма добавления по кастомному хэндлу */}
            <form onSubmit={handleAddCustomUser} className="hype-custom-add-bar">
              <input
                type="text"
                className="cyber-input custom-handle-input"
                placeholder="Добавить свой @handle друга..."
                value={customHandle}
                onChange={(e) => setCustomHandle(e.target.value)}
              />
              <button type="submit" className="cyber-btn custom-add-submit-btn">
                ➕ ДОБАВИТЬ И НАПИСАТЬ
              </button>
            </form>

            {/* Сетка хайповых карточек друзей */}
            <div className="hype-users-scroll-list">
              {filteredHypeUsers.map((user) => {
                const isAlreadyFriend = friends.some(f => f.handle.toLowerCase() === user.handle.toLowerCase() || f.id === user.id);
                return (
                  <div key={user.id} className="hype-user-card">
                    <div className="huc-avatar-wrap">
                      <img src={user.avatar} alt={user.name} className="huc-avatar" />
                      {user.online && <span className="online-badge-dot"></span>}
                    </div>

                    <div className="huc-details">
                      <div className="huc-name-row">
                        <span className="huc-name">{user.name}</span>
                        {user.verified && <span className="verified-check">✓</span>}
                        <span className="huc-handle">{user.handle}</span>
                      </div>
                      <p className="huc-status">{user.statusText}</p>
                      
                      <div className="huc-tags-list">
                        {(user.tags || []).map(t => (
                          <span key={t} className="huc-tag-chip" onClick={() => setSelectedTag(t)}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="huc-actions">
                      <div className="huc-action-buttons-group">
                        {isAlreadyFriend ? (
                          <span className="huc-added-status">✓ В ДРУЗЬЯХ</span>
                        ) : (
                          <button
                            type="button"
                            className="cyber-btn huc-add-btn"
                            onClick={() => handleAddFriend(user)}
                            title="Добавить в друзья"
                          >
                            ➕ В ДРУЗЬЯ
                          </button>
                        )}

                        <button
                          type="button"
                          className="cyber-btn huc-chat-btn"
                          onClick={() => handleMessageUser(user)}
                          title="Открыть диалог и написать"
                        >
                          💬 НАПИСАТЬ
                        </button>

                        {isAlreadyFriend && (
                          <button
                            type="button"
                            className="huc-remove-btn"
                            onClick={() => handleRemoveFriend(user.id)}
                            title="Удалить из друзей"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredHypeUsers.length === 0 && (
                <div className="no-hype-results">
                  <span>⚡</span>
                  <p>По запросу «{hypeQuery}» игроков не найдено.</p>
                  <p className="sub">Введите @handle выше, чтобы добавить любого друга вручную и сразу начать диалог!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
