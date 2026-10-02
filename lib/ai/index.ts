// Provider-agnostic AI facade. Every call is best-effort: failures return null and NEVER break the app.
import { geminiProvider } from './gemini';
import { openaiProvider } from './openai';
import type { AIProvider, AnalyzeInput, ItemAnalysis } from './types';
export type { ItemAnalysis } from './types';

let cached: AIProvider | null | undefined;
export function getAI(): AIProvider | null {
  if (cached !== undefined) return cached;
  const p = (process.env.AI_PROVIDER ?? 'none').toLowerCase();
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-flash-latest';
  const emb = process.env.AI_EMBEDDING_MODEL || 'gemini-embedding-001';
  if (!key || p === 'none') return (cached = null);
  if (p === 'gemini') return (cached = geminiProvider(key, model, emb));
  if (p === 'openai') return (cached = openaiProvider(key, model, emb, process.env.AI_BASE_URL || undefined));
  console.warn(`[ai] unknown AI_PROVIDER "${p}" – AI disabled`);
  return (cached = null);
}

async function safe<T>(label: string, fn: (ai: AIProvider) => Promise<T>): Promise<T | null> {
  const ai = getAI();
  if (!ai) return null;
  try { return await fn(ai); } catch (e) { console.warn(`[ai] ${label} failed:`, (e as Error).message); return null; }
}
export const aiEnabled = () => getAI() !== null;
export const safeAnalyze = (i: AnalyzeInput) => safe<ItemAnalysis>('analyze', (ai) => ai.analyze(i));
export const safeEmbed = (t: string) => safe<number[]>('embed', (ai) => ai.embed(t));
export const safeExplain = (a: string, b: string) => safe<string>('explain', (ai) => ai.explain(a, b));
export const embeddingModelName = () => process.env.AI_EMBEDDING_MODEL || 'gemini-embedding-001';
