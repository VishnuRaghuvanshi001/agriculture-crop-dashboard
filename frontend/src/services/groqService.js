/**
 * Groq Cloud Inference Service for Agri-Intelligence
 * ==================================================
 * Provides high-speed LPU inference via the official Groq REST API (OpenAI-compatible).
 * Supports browser-side streaming (SSE), API key persistence in localStorage,
 * dynamic model discovery from /models endpoint, and fallback to import.meta.env.VITE_GROQ_API_KEY.
 */

const STORAGE_KEY = 'agri_groq_api_key';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';

export const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B',
    badge: 'Flagship (Recommended)',
    description: 'Flagship MoE reasoning model on Groq LPU, deep agronomic simulations (~500 tok/s)',
    speed: '~500 tokens/s',
    contextWindow: '131k'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B',
    badge: 'Ultra Fast',
    description: 'High-speed reasoning, rapid lookups & low-latency responses (~750 tok/s)',
    speed: '~750 tokens/s',
    contextWindow: '131k'
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    badge: 'Reasoning & Instruct',
    description: 'Strong mathematical and agronomic structuring',
    speed: '~400 tokens/s',
    contextWindow: '128k'
  },
  {
    id: 'minimaxai/minimax-m2.7',
    name: 'MiniMax M2.7',
    badge: 'High Throughput',
    description: 'Advanced context handling and deep synthesis',
    speed: '~350 tokens/s',
    contextWindow: '128k'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Legacy)',
    badge: 'Legacy Tier',
    description: 'Meta Llama 3.3 (where available on specific account tiers)',
    speed: '~280 tokens/s',
    contextWindow: '128k'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Legacy)',
    badge: 'Legacy Tier',
    description: 'Meta Llama 3.1 (where available on specific account tiers)',
    speed: '~750 tokens/s',
    contextWindow: '128k'
  }
];

export function getStoredApiKey() {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim().length > 0) {
      return local.trim();
    }
  }
  const envKey = import.meta.env?.VITE_GROQ_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

export function setStoredApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim().length > 0) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function clearStoredApiKey() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasApiKey() {
  return getStoredApiKey().length > 0;
}

/**
 * Dynamically queries the Groq account's active models
 *
 * @param {string} [apiKey] - Optional explicit key to check
 * @returns {Promise<Array<string>|null>} Array of active model IDs
 */
export async function fetchLiveGroqModels(apiKey = null) {
  const key = apiKey || getStoredApiKey();
  if (!key) return null;

  try {
    const response = await fetch(GROQ_MODELS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (Array.isArray(data?.data)) {
      return data.data
        .map(m => m.id)
        .filter(id => !id.toLowerCase().includes('whisper') && !id.toLowerCase().includes('safeguard'))
        .sort();
    }
  } catch (_e) {
    // Return null if request fails
  }
  return null;
}

/**
 * Execute streaming chat completion against Groq Cloud API
 */
export async function streamGroqChat({
  messages,
  model = 'openai/gpt-oss-120b',
  temperature = 0.6,
  signal,
  onChunk,
  onDone,
  onError
}) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    const err = new Error(
      'Groq API key not found. Please provide a free API key in settings or via VITE_GROQ_API_KEY.'
    );
    err.code = 'NO_API_KEY';
    if (onError) onError(err);
    throw err;
  }

  const startTime = Date.now();
  let fullText = '';
  let tokenCountApprox = 0;

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 2500,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorDetails = errJson.error.message;
        }
      } catch (_e) {
        // Fallback to status text
      }
      throw new Error(errorDetails);
    }

    if (!response.body) {
      throw new Error('Response body is empty or streaming not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6).trim();

        if (dataStr === '[DONE]') {
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            tokenCountApprox += Math.ceil(delta.length / 4);
            if (onChunk) {
              onChunk(fullText, delta);
            }
          }
        } catch (_parseErr) {
          // Ignore incomplete JSON chunks
        }
      }
    }

    const durationSec = Math.max(0.1, (Date.now() - startTime) / 1000);
    const tokensPerSec = Math.round(tokenCountApprox / durationSec);

    if (onDone) {
      onDone(fullText, {
        durationSec,
        tokenCountApprox,
        tokensPerSec,
        model
      });
    }

    return fullText;
  } catch (err) {
    if (signal?.aborted) {
      if (onDone) {
        onDone(fullText, { durationSec: (Date.now() - startTime) / 1000, cancelled: true });
      }
      return fullText;
    }
    if (onError) {
      onError(err);
    }
    throw err;
  }
}
