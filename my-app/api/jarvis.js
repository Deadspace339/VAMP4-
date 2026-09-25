// ===================================================
// VERCEL SERVERLESS FUNCTION: JARVIS API PROXY
// Защищает API ключ Gemini от утечки в клиентский код
// API ключ хранится ТОЛЬКО на сервере в env переменных
// ===================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.JARVIS_API_KEY; // НЕ VITE_ — серверная переменная!
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      fallback: true 
    });
  }

  try {
    const { contents, systemInstruction, tools, generationConfig } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const model = process.env.JARVIS_MODEL || 'gemini-2.5-flash';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction,
          tools: tools || undefined,
          generationConfig: {
            ...(generationConfig || {}),
            maxOutputTokens: Math.min(generationConfig?.maxOutputTokens || 200, 500) // Лимит токенов
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Jarvis Proxy] API Error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.status}`,
        fallback: true
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[Jarvis Proxy] Server error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      fallback: true
    });
  }
}
