// Works with OpenAI and OpenAI-compatible APIs (Groq, OpenRouter, ...). Set AI_BASE_URL.
import { ANALYZE_PROMPT, EXPLAIN_PROMPT, EMBEDDING_DIMS, normalize, parseJson, type AIProvider, type ItemAnalysis } from './types';

export function openaiProvider(key: string, model: string, embModel: string, base = 'https://api.openai.com/v1'): AIProvider {
  const call = async (path: string, body: unknown) => {
    const r = await fetch(`${base}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body), signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  };
  const chat = async (content: unknown, json: boolean) => {
    const d = await call('chat/completions', {
      model, temperature: 0.2, messages: [{ role: 'user', content }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return d.choices?.[0]?.message?.content ?? '';
  };
  return {
    name: 'openai',
    async analyze({ title, description, image }) {
      const content: unknown[] = [{ type: 'text', text: `${ANALYZE_PROMPT}\n\nTitle: ${title}\nDescription: ${description ?? ''}` }];
      if (image) content.push({ type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } });
      return parseJson<ItemAnalysis>(await chat(content, true));
    },
    async embed(text) {
      const d = await call('embeddings', { model: embModel, input: text, dimensions: EMBEDDING_DIMS });
      return normalize(d.data[0].embedding as number[]);
    },
    explain: async (a, b) => (await chat(EXPLAIN_PROMPT(a, b), false)).trim(),
  };
}
