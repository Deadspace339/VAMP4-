// ===================================================
// VERCEL SERVERLESS FUNCTION: JARVIS API PROXY [HARDENED]
// Защищает API ключ Gemini от утечки в клиентский код
// API ключ хранится ТОЛЬКО на сервере в env переменных
// ===================================================

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://localhost:4173')
  .split(',')
  .map(o => o.trim());

// Simple in-memory rate limiter per IP for serverless cold instances
const jarvisHits = new Map();

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app');

  if (origin && isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting (max 15 requests per minute per IP)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = jarvisHits.get(clientIp) || { count: 0, start: now };
  if (now - rec.start > 60000) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count++;
  jarvisHits.set(clientIp, rec);

  // Clean old entries to avoid memory leak
  if (jarvisHits.size > 1000) {
    for (const [ip, item] of jarvisHits.entries()) {
      if (now - item.start > 60000) jarvisHits.delete(ip);
    }
  }

  if (rec.count > 15) {
    return res.status(429).json({ 
      error: 'Слишком много запросов к ИИ. Подождите минуту.', 
      fallback: true 
    });
  }

  const apiKey = process.env.JARVIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured on server',
      fallback: true 
    });
  }

  try {
    const { contents, systemInstruction, tools, generationConfig } = req.body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Protection: limit history length and total payload
    const safeContents = contents.slice(-6); // Max 6 recent dialog turns
    const totalChars = JSON.stringify(safeContents).length;
    if (totalChars > 15000) {
      return res.status(413).json({ error: 'Превышен лимит размера запроса', fallback: true });
    }

    const model = process.env.JARVIS_MODEL || 'gemini-2.5-flash';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: safeContents,
          systemInstruction,
          tools: tools || undefined,
          generationConfig: {
            ...(generationConfig || {}),
            maxOutputTokens: Math.min(Math.max(10, generationConfig?.maxOutputTokens || 200), 300)
          }
        })
      }
    );

    if (!response.ok) {
      console.error('[Jarvis Proxy] Upstream API Error code:', response.status);
      return res.status(response.status).json({ 
        error: 'Сервис ИИ временно недоступен',
        fallback: true
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[Jarvis Proxy] Server error:', err.message);
    return res.status(500).json({ 
      error: 'Внутренняя ошибка прокси',
      fallback: true
    });
  }
}
