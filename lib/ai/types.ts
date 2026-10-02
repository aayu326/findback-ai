export const EMBEDDING_DIMS = 768;
export type ItemAnalysis = {
  category: string | null; color: string | null; brand: string | null; model: string | null;
  keywords: string[]; distinctive_features: string[]; summary: string;
};
export type AnalyzeInput = { title: string; description?: string | null; image?: { mime: string; base64: string } | null };
export interface AIProvider {
  name: string;
  analyze(input: AnalyzeInput): Promise<ItemAnalysis>;
  embed(text: string): Promise<number[]>;
  explain(a: string, b: string): Promise<string>;
}
export const ANALYZE_PROMPT = `You analyze lost-and-found item reports. Return ONLY JSON with keys:
category (one of: Wallet, Phone, Earphones, Laptop & Accessories, Bag, Bottle, ID & Cards, Keys, Clothing, Books & Stationery, Jewelry, Other),
color (main color, lowercase), brand, model, keywords (max 10 lowercase strings), distinctive_features (max 5 short strings), summary (one sentence).
Use null when unknown. Do NOT transcribe personal data such as names, ID numbers, phone numbers or serial numbers.`;
export const EXPLAIN_PROMPT = (a: string, b: string) =>
  `Two lost-and-found reports from the same organization:\nLOST: ${a}\nFOUND: ${b}\nIn at most 2 sentences, explain which attributes suggest they MIGHT be the same item and what remains uncertain. Never claim certainty or ownership.`;
export const parseJson = <T,>(t: string): T => JSON.parse(t.replace(/^```(?:json)?|```$/gim, '').trim());
export const normalize = (v: number[]) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
