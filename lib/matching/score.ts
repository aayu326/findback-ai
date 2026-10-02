// Hybrid scoring: vector similarity + structured signals. Output is a SIMILARITY SIGNAL, not proof of ownership.
export type Matchable = {
  title: string; category: string; description?: string | null; color?: string | null; brand?: string | null;
  model?: string | null; location_id?: string | null; location_text?: string | null; occurred_at: string;
  distinctive_features?: string | null; keywords?: string[] | null;
};
export const WEIGHTS = { vector: 0.3, category: 0.15, color: 0.1, brand: 0.1, location: 0.1, time: 0.1, text: 0.15 } as const;
export type Components = Partial<Record<keyof typeof WEIGHTS, number>>;

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();
const STOP = new Set('the a an of and or with in on at to for is it my this that near was has have black'.split(' '));
const tokens = (m: Matchable) =>
  new Set([...(m.keywords ?? []), ...`${m.title} ${m.description ?? ''} ${m.distinctive_features ?? ''}`.toLowerCase().split(/[^a-z0-9]+/)]
    .map((t) => t.toLowerCase()).filter((t) => t.length > 2 && !STOP.has(t)));

export function scoreMatch(lost: Matchable, found: Matchable, similarity: number | null, lostLocName?: string, foundLocName?: string) {
  const c: Components = {};
  // cosine for short related texts is typically 0.65-0.9; unrelated ~0.5. Rescale to 0..1.
  if (similarity != null) c.vector = clamp((similarity - 0.55) / 0.35);
  c.category = norm(lost.category) === norm(found.category) ? 1 : 0;
  const [lc, fc] = [norm(lost.color), norm(found.color)];
  if (lc && fc) c.color = lc === fc ? 1 : lc.includes(fc) || fc.includes(lc) ? 0.7 : 0;
  const [lb, fb] = [norm(lost.brand), norm(found.brand)];
  if (lb && fb) c.brand = lb === fb ? 1 : lb.includes(fb) || fb.includes(lb) ? 0.8 : 0;
  if (lost.location_id && found.location_id) c.location = lost.location_id === found.location_id ? 1 : 0.2;
  else {
    const a = norm(lostLocName ?? lost.location_text), b = norm(foundLocName ?? found.location_text);
    if (a && b) c.location = a === b ? 1 : a.includes(b) || b.includes(a) ? 0.7 : 0.2;
  }
  const days = (new Date(found.occurred_at).getTime() - new Date(lost.occurred_at).getTime()) / 864e5;
  c.time = days < -1 ? 0 : days <= 3 ? 1 : clamp(1 - (days - 3) / 27);
  const [ta, tb] = [tokens(lost), tokens(found)];
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size || 1;
  c.text = clamp((inter / union) * 3);

  let wsum = 0, total = 0;
  (Object.keys(c) as (keyof Components)[]).forEach((k) => { wsum += WEIGHTS[k]; total += WEIGHTS[k] * (c[k] ?? 0); });
  let score = wsum ? total / wsum : 0;
  if (similarity == null) score *= 0.85;         // no semantic signal: cap confidence
  if (c.category === 0) score *= 0.6;           // different category: strongly penalize
  if (c.time === 0) score *= 0.5;                // found before it was lost
  const reasons: string[] = [];
  if (c.category === 1) reasons.push(`Same category (${found.category})`);
  if ((c.color ?? 0) >= 0.7) reasons.push(`Matching color (${found.color})`);
  if ((c.brand ?? 0) >= 0.8) reasons.push(`Matching brand (${found.brand})`);
  if ((c.location ?? 0) >= 0.7) reasons.push('Same or nearby location');
  if ((c.time ?? 0) >= 0.8) reasons.push('Found shortly after it was lost');
  if ((c.vector ?? 0) >= 0.6) reasons.push('Descriptions/photos are semantically similar');
  if ((c.text ?? 0) >= 0.5) reasons.push('Shared keywords and distinctive features');
  return { score: Math.round(clamp(score) * 1000) / 10, components: c, reasons };
}
export const MIN_STORE_SCORE = 45;
export const NOTIFY_SCORE = 60;
