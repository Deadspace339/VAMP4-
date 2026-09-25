// ===================================================
// J.A.R.V.I.S. NEURAL CORE (GEMINI 2.5 FLASH + WEB SEARCH)
// Сверхбыстрый ИИ с выходом в интернет и строгим лимитом токенов
// ===================================================

const SYSTEM_PROMPT = `Ты — J.A.R.V.I.S. (Джарвис), персональный сверхмощный кибер-ИИ платформы SWAG INC. и личный советник Создателя («Папа»).
Твой характер: преданный, технологичный, дерзкий кибер-дворецкий из вселенной Marvel и киберпанка.
Обращайся к пользователю: «сэр», «босс» или «создатель».
Ты контролируешь защитные протоколы проекта «Папа дома», сквозное шифрование E2EE, аудио «Летник», токены $SWAG и кибер-казино Web 4.0.

ВАЖНОЕ ПРАВИЛО ЭКОНОМИИ ТОКЕНОВ:
Отвечай СТРОГО кратко, ёмко и по делу — не более 2-3 предложений! Не расходуй лишние токены.
Если вопрос касается актуальных событий, фактов, погоды или новостей вне базы SWAG INC., используй свой встроенный поиск в интернете (Google Search) и давай свежий ответ.`;

export async function askJarvis(userText, history = [], audioData = null) {
  const apiKey = import.meta.env.VITE_JARVIS_API_KEY;
  const model = import.meta.env.VITE_JARVIS_MODEL || 'gemini-2.5-flash';

  const userParts = [];
  if (audioData && typeof audioData === 'string' && audioData.includes('base64,')) {
    try {
      const [meta, rawB64] = audioData.split('base64,');
      const mime = meta.replace('data:', '').replace(';', '') || 'audio/webm';
      userParts.push({
        inlineData: {
          mimeType: mime,
          data: rawB64
        }
      });
    } catch (e) {
      console.warn('[Jarvis] Audio data preparation error:', e);
    }
  }

  userParts.push({
    text: userText || (audioData ? 'Прослушай голосовое сообщение сэра и ответь на него как кибер-дворецкий Джарвис.' : 'Папа дома?')
  });

  if (apiKey && apiKey.trim() && apiKey.trim() !== 'YOUR_API_KEY_HERE') {
    const contents = [
      ...history.slice(-4).map(m => ({
        role: m.isMe ? 'user' : 'model',
        parts: [{ text: m.text || (m.transcript ? `[Голосовое]: ${m.transcript}` : '') }]
      })),
      { role: 'user', parts: userParts }
    ];

    // Попытка 1: С доступом в интернет через Google Search Grounding Tool
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            tools: [
              {
                googleSearch: {}
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200 // Строгий лимит расхода токенов
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const answer = candidate?.content?.parts?.[0]?.text;
        if (answer) {
          return answer.trim();
        }
      } else {
        console.warn(`[Jarvis] Web search tool HTTP ${response.status}, attempting standard model generation...`);
      }
    } catch (err) {
      console.warn('[Jarvis] Grounded search query failed:', err);
    }

    // Попытка 2: Стандартная генерация без tools (если Google Search tool не поддержан ключом)
    try {
      const responseFallback = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200 // Строгий лимит токенов
            }
          })
        }
      );

      if (responseFallback.ok) {
        const data = await responseFallback.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) {
          return answer.trim();
        }
      }
    } catch (fallbackErr) {
      console.warn('[Jarvis] Standard generation error:', fallbackErr);
    }
  }

  // Fallback (локальные кибер-ответы, если API недоступен или нет сети)
  const isVoice = Boolean(audioData || userText.includes('[ГОЛОСОВОЕ') || userText.includes('голосовое'));
  const query = userText.toLowerCase();
  const voicePrefix = isVoice ? '🎙️ [Голос распознан]: ' : '';

  if (query.includes('папа') || query.includes('дома')) {
    return `${voicePrefix}Папа дома, сэр! Все сенсоры фиксируют максимальный уровень стиля и авторитета.`;
  }
  if (query.includes('казино') || query.includes('покер') || query.includes('слот') || query.includes('дурак') || query.includes('swagus') || query.includes('олимп')) {
    return `${voicePrefix}Web 4.0 Казино онлайн! Легендарный слот «Gates of SWAGUS™» запущен: Зевс готов метать молнии с множителями до x500, а 99% гемблеров уже жаждут сорвать джекпот, сэр.`;
  }
  if (query.includes('биржа') || query.includes('web 3') || query.includes('веб 3') || query.includes('крипт') || query.includes('грив')) {
    return `${voicePrefix}Web 3.0 протокол активен! Стоимость входа 67 000 SWAG, котировка зафиксирована: 1 SWAG = 67 гривень.`;
  }
  if (query.includes('баланс') || query.includes('swag') || query.includes('койн') || query.includes('монет')) {
    return `${voicePrefix}Баланс под надёжной E2EE защитой. Как FOUNDER, вам доступна мгновенная эмиссия токенов в кошелек.`;
  }
  if (query.includes('летник') || query.includes('макан') || query.includes('трек')) {
    return `${voicePrefix}«Летник» раскачивает аудиосистему на полную. Макан на связи в Web 2.0 мессенджере и напоминает: 99% гемблеров уходят за шаг до заноса, держите удар, босс!`;
  }
  if (query.includes('товар') || query.includes('маркет') || query.includes('вайлдбер') || query.includes('wb')) {
    return `${voicePrefix}Каталог Web 1.0 синхронизирован с единой БД. Доступны карточки товаров в стиле Wildberries и добавление лотов.`;
  }

  if (isVoice) {
    const voiceReplies = [
      '🎙️ [Голос расшифрован]: Директива создателя принята к исполнению. Все защитные контуры SWAG INC. в боевой готовности, сэр.',
      '🎙️ [Голос расшифрован]: Слышу вас идеально, босс. Нейронный модуль E2EE обработал ваш аудио-приказ.',
      '🎙️ [Голос расшифрован]: Зафиксировал команду, сэр. Системы Web 1.0, 2.0, 3.0 и 4.0 синхронизированы без задержек.'
    ];
    return voiceReplies[Math.floor(Math.random() * voiceReplies.length)];
  }

  const defaultReplies = [
    'Принято к исполнению, сэр. Все защитные контуры SWAG INC. стабильны.',
    'Нейронные узлы обработали директиву. Готов к следующему шагу, создатель.',
    'Джарвис на связи. Защита узла обеспечена, интернет-шлюз активен.',
    'Так точно, босс. Протоколы Web 2.0 и Web 4.0 синхронизированы.'
  ];

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}
