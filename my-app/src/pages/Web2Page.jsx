import { useState } from 'react';
import ChatList from '../components/messenger/ChatList';
import ChatWindow from '../components/messenger/ChatWindow';
import ShortsFeed from '../components/messenger/ShortsFeed';
import { askJarvis } from '../services/jarvisService';
import { db } from '../services/db';

const Web2Page = ({ onDonate }) => {
  const [viewMode, setViewMode] = useState('messenger'); // 'messenger', 'split', 'shorts'
  const [chats, setChats] = useState(() => db.getChats());
  const [activeChatId, setActiveChatId] = useState('jarvis');

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    const updated = chats.map(c => c.id === id ? { ...c, unread: 0 } : c);
    setChats(updated);
    db.saveChats(updated);
  };

  // Отправка сообщения с вызовом нейросети Джарвиса и записью в БД
  const handleSendMessage = async (chatId, newMsg) => {
    const updatedChats = db.addMessage(chatId, newMsg);
    setChats(updatedChats);

    // Вызов Gemini 2.5 Flash для чата с Джарвисом (с поддержкой распознавания голосовых)
    if (chatId === 'jarvis') {
      const chatObj = updatedChats.find(c => c.id === 'jarvis');
      const isVoice = newMsg.type === 'voice';
      const promptText = isVoice
        ? `[ГОЛОСОВОЕ СООБЩЕНИЕ]: ${newMsg.transcript || 'Создатель отправил голосовое сообщение'}`
        : (newMsg.text || '');

      const responseText = await askJarvis(
        promptText,
        chatObj?.messages || [],
        isVoice ? newMsg.audioSrc : null
      );

      setTimeout(() => {
        const replyMsg = {
          id: Date.now() + 1,
          sender: 'J.A.R.V.I.S.',
          isMe: false,
          type: 'text',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: { '⚡': 1 },
          myReaction: null
        };

        const savedWithJarvis = db.addMessage('jarvis', replyMsg);
        setChats(savedWithJarvis);
      }, 700);
    } else if (chatId === 'macan') {
      setTimeout(() => {
        const textLower = ((newMsg?.text || newMsg?.transcript || '')).toLowerCase();
        let reply = '';

        if (textLower.includes('слот') || textLower.includes('казин') || textLower.includes('swagus') || textLower.includes('олимп') || textLower.includes('крут') || textLower.includes('гембл')) {
          const slotReplies = [
            'Брат, Gates of SWAGUS кормит тех, кто верит до конца! Зевс видит смелых. Помни: 99% уходят за шаг до заноса всей жизни 💎⚡',
            'Главное в слотах — хладнокровно ловить 4 скаттера. На бонуске х5000 заберем и сразу М5 забираем из салона! 🏎️💨',
            'Если Зевс метнул фиолетовый множитель х500 — это наш день, родной. Сверху бас «Летника» и поехали по ночной Москве 🤝',
            'Брат, я вчера в Gates of SWAGUS на последнем фриспине поймал ретриггер +5. Никогда не сдавайся, слышишь? Двигайся только вперед!'
          ];
          reply = slotReplies[Math.floor(Math.random() * slotReplies.length)];
        } else if (textLower.includes('слил') || textLower.includes('проиграл') || textLower.includes('минус') || textLower.includes('груст') || textLower.includes('деньг')) {
          const comfortReplies = [
            'Держи удар, брат. Падения делают нас только крепче. Деньги — пыль, мы их еще сотни раз поднимем. Главное духом не падать 🐺',
            'Посмотри на шахтера с того мема: он бросил кирку в одном шаге от тонны алмазов! Мы не такие. Переведи дух, мы заберем свое 🤝',
            'Жизнь проверяет на прочность, родной. Кто не падал — тот не поднимался на Олимп. Обнял по-братски!'
          ];
          reply = comfortReplies[Math.floor(Math.random() * comfortReplies.length)];
        } else if (textLower.includes('машин') || textLower.includes('бмв') || textLower.includes('bmw') || textLower.includes('м5') || textLower.includes('гонк') || textLower.includes('скорост')) {
          const carReplies = [
            'Черная М5, stage 3, прямая трасса в ночь. Летит по МКАДу, пока слоты крутятся на телефоне. Свобода внутри нас, брат 🏎️🔥',
            'Шашки по ночной Москве под сочный саб. Дорога не прощает ошибок, но и трусов не любит. Газ в пол!',
            'Брат, тачка — это железо, главное — кто за рулем и кто сидит рядом справа. Пацанам салам 🤝'
          ];
          reply = carReplies[Math.floor(Math.random() * carReplies.length)];
        } else if (textLower.includes('трек') || textLower.includes('летник') || textLower.includes('музык') || textLower.includes('бас') || textLower.includes('песн')) {
          const musicReplies = [
            '«Летник» — это от души для всех наших. Сейчас сижу на студии, сводим новый дроп. Бас будет бетон дробить! 🎙️🔥',
            'Музыка лечит то, о чем словами не скажешь. Слушай в хороших наушниках или в тачке с сабом — прочувствуешь каждую строчку 🎶',
            'Скоро выкатим в маркет SWAG INC. эксклюзивные ремиксы. Звук чистейший, как слеза!'
          ];
          reply = musicReplies[Math.floor(Math.random() * musicReplies.length)];
        } else if (textLower.includes('брат') || textLower.includes('родной') || textLower.includes('друг') || textLower.includes('салам')) {
          const broReplies = [
            'Салам, родной! Братское сердце не купить ни за какие деньги. Кто с нами с самого низа — с теми мы и на вершине Олимпа 🤝👑',
            'Обнял по-братски! Время расставит всё по местам. Верные останутся, лишние отсеются. Всегда на связи!',
            'Брат за брата — такое воспитание. Если что нужно — сразу маякуй, порешаем любые вопросы 🐺'
          ];
          reply = broReplies[Math.floor(Math.random() * broReplies.length)];
        } else {
          const generalReplies = [
            'На связи, брат! Всё четко, делаем красиво 🤝',
            'Летник на репите, слоты заряжены, жизнь идет своим чередом 🔥',
            'Кто понял жизнь, тот не спешит. Но если дают шанс — надо забирать на максимуме ⚡',
            'Мы не выбираем времена, мы выбираем, как в них жить. Делай по совести и держи слово 🐺',
            'Москва не верит слезам, она верит тем, кто прет до конца. Жми газ, братка!',
            'Всё будет, но не сразу. Главное не сбиваться со своего пути 🏎️💨'
          ];
          reply = generalReplies[Math.floor(Math.random() * generalReplies.length)];
        }

        const reactionIcons = ['🔥', '🤝', '⚡', '👑', '💎'];
        const chosenReaction = reactionIcons[Math.floor(Math.random() * reactionIcons.length)];

        const replyMsg = {
          id: Date.now() + 2,
          sender: 'MACAN',
          isMe: false,
          type: 'text',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: { [chosenReaction]: 1 },
          myReaction: null
        };

        const savedWithMacan = db.addMessage('macan', replyMsg);
        setChats(savedWithMacan);
      }, 1100);
    }
  };

  // Реакции с защитой от дублирования через БД
  const handleToggleReaction = (chatId, messageId, emoji) => {
    const updated = db.toggleReaction(chatId, messageId, emoji);
    setChats(updated);
  };

  const handleClearHistory = (chatId) => {
    const updated = db.clearChat(chatId);
    setChats(updated);
  };

  const handleDeleteMessage = (chatId, messageId, mode) => {
    const updated = db.deleteMessage(chatId, messageId, mode);
    setChats(updated);
  };

  const handleTogglePin = (chatId, messageId) => {
    const updated = db.togglePinMessage(chatId, messageId);
    setChats(updated);
  };

  return (
    <div className="web2-page-layout">
      {/* Верхняя панель управления режимами */}
      <div className="web2-control-bar container">
        <div className="web2-status-tag">
          <span className="dot blink"></span>
          <span className="status-label">PROTOCOL:</span>
          <span className="highlight">WEB 2.0 PERSISTENT HUB</span>
          <span className="pipe">|</span>
          <span className="crypto-enc">DATABASE: LOCAL-SYNC ACTIVE</span>
        </div>

        <div className="web2-mode-switchers">
          <button
            className={`mode-btn ${viewMode === 'messenger' ? 'active' : ''}`}
            onClick={() => setViewMode('messenger')}
            title="Только мессенджер"
          >
            💬 МЕССЕНДЖЕР
          </button>
          <button
            className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Отобразить мессенджер и клипы вместе"
          >
            ⚡ СПЛИТ (DUAL)
          </button>
          <button
            className={`mode-btn ${viewMode === 'shorts' ? 'active' : ''}`}
            onClick={() => setViewMode('shorts')}
            title="Только Shorts клипы"
          >
            🎬 SWAG SHORTS
          </button>
        </div>
      </div>

      {/* Основная рабочая область */}
      <div className="web2-main-grid container">
        {/* Блок Мессенджера */}
        {(viewMode === 'split' || viewMode === 'messenger') && (
          <div className={`web2-messenger-module ${viewMode === 'split' ? 'is-split' : 'is-full'}`}>
            <ChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
            />
            <ChatWindow
              chat={activeChat}
              onSendMessage={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              onClearHistory={handleClearHistory}
              onDeleteMessage={handleDeleteMessage}
              onTogglePin={handleTogglePin}
            />
          </div>
        )}

        {/* Блок Shorts Клипов */}
        {(viewMode === 'split' || viewMode === 'shorts') && (
          <div className={`web2-shorts-module ${viewMode === 'split' ? 'is-split' : 'is-full'}`}>
            <ShortsFeed onDonate={onDonate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Web2Page;
