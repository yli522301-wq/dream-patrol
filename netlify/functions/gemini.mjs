const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const normalizeHistory = (conversationHistory, userMessage) => {
  const source = Array.isArray(conversationHistory) && conversationHistory.length
    ? conversationHistory
    : [{ sender: 'user', text: userMessage }];

  return source
    .filter((message) => message && typeof message.text === 'string' && message.text.trim())
    .slice(-8)
    .map((message) => ({
      role: message.sender === 'ai' || message.sender === 'model' ? 'model' : 'user',
      parts: [{ text: message.text.trim() }],
    }));
};

const extractReply = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, {
      errorType: 'gemini_request_failed',
      message: 'Gemini 代理只接受 POST 请求。',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return json(500, {
      errorType: 'api_key_missing',
      message: 'API Key 未配置：请在 Netlify 环境变量中设置 GEMINI_API_KEY。',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, {
      errorType: 'gemini_request_failed',
      message: '请求体不是有效 JSON。',
      detail: String(error),
    });
  }

  const { userMessage, currentCompanion, conversationHistory, systemInstruction } = body;
  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return json(400, {
      errorType: 'gemini_request_failed',
      message: '缺少用户梦境文字，请传入 userMessage。',
    });
  }

  const contents = normalizeHistory(conversationHistory, userMessage);
  if (!contents.length) {
    contents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
  }

  try {
    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        contents,
        system_instruction: {
          parts: [{ text: typeof systemInstruction === 'string' ? systemInstruction : '' }],
        },
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 640,
        },
      }),
    });

    const payload = await geminiResponse.json().catch((error) => ({
      __parseError: String(error),
    }));

    if (!geminiResponse.ok) {
      return json(geminiResponse.status, {
        errorType: 'gemini_request_failed',
        message: 'Gemini 请求失败，请检查 API Key、模型权限或配额。',
        detail: payload?.error?.message || payload?.__parseError || JSON.stringify(payload),
      });
    }

    const reply = extractReply(payload);
    if (!reply) {
      return json(502, {
        errorType: 'invalid_response',
        message: '返回结构异常：Gemini 没有返回可显示的文本。',
        detail: JSON.stringify(payload),
      });
    }

    return json(200, {
      reply,
      model: GEMINI_MODEL,
      companion: currentCompanion || null,
    });
  } catch (error) {
    return json(502, {
      errorType: 'network_error',
      message: '网络错误：Netlify Function 无法连接 Gemini API。',
      detail: String(error),
    });
  }
};
