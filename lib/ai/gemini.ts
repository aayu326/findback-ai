import { ANALYZE_PROMPT, EXPLAIN_PROMPT, EMBEDDING_DIMS, normalize, parseJson, type AIProvider, type ItemAnalysis } from './types';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function geminiProvider(key: string, model: string, embModel: string): AIProvider {
  const call = async (path: string, body: unknown) => {
    const r = await fetch(`${BASE}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body), signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  };
  const gen = async (parts: unknown[], json: boolean) => {
    const d = await call(`models/${model}:generateContent`, {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, ...(json ? { responseMimeType: 'application/json' } : {}) },
    });
    return (d.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  };
  return {
    name: 'gemini',
    async analyze({ title, description, image }) {
      const parts: unknown[] = [{ text: `${ANALYZE_PROMPT}\n\nTitle: ${title}\nDescription: ${description ?? ''}` }];
      if (image) parts.push({ inline_data: { mime_type: image.mime, data: image.base64 } });
      return parseJson<ItemAnalysis>(await gen(parts, true));
    },
    async embed(text) {
      const d = await call(`models/${embModel}:embedContent`, {
        content: { parts: [{ text }] }, taskType: 'SEMANTIC_SIMILARITY', outputDimensionality: EMBEDDING_DIMS,
      });
      return normalize(d.embedding.values as number[]);
    },
    explain: async (a, b) => (await gen([{ text: EXPLAIN_PROMPT(a, b) }], false)).trim(),
  };
}
