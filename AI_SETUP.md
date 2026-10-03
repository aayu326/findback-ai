# AI Setup

Reclaimo works **with or without AI**. If the AI key is missing, rate-limited or the call fails, reports are still saved and matched using category / color / brand / location / time / keyword signals. AI adds: image+text analysis, embeddings (semantic similarity) and short match explanations.

## Free-tier choice (verified Oct 2026)

Default: **Google Gemini API (Google AI Studio)** — it has a no-credit-card free tier, vision input, JSON output and an embeddings model.

Things to know (verified from Google's docs and recent third-party measurements):
- Since April 2026 the free tier is **Flash / Flash-Lite models only** (Pro models are paid).
- Google no longer publishes a fixed free-tier table; **check your limits in [AI Studio](https://aistudio.google.com)**. Expect low daily request quotas — each report uses ~2 calls (analyze + embed) plus up to 3 short explain calls.
- Model names change often and older ones are closed to new signups. Pick a currently listed Flash model in AI Studio and set `AI_MODEL`. `gemini-flash-latest` is used as the default alias.
- **Free-tier content may be used by Google to improve its products.** For real deployments with personal data, use a paid/billing-enabled key. reclaimo never sends private verification details (IDs, serials, contacts) to the AI — only title, description and the photo.

## Configure

1. Create a key at https://aistudio.google.com/apikey
2. In `.env.local` (server only — never `NEXT_PUBLIC_`):
```env
AI_PROVIDER=gemini
AI_API_KEY=your-key
AI_MODEL=gemini-flash-latest        # or the Flash model shown in AI Studio
AI_EMBEDDING_MODEL=gemini-embedding-001
```
Embeddings are requested at **768 dimensions** to match `vector(768)` in the schema. If you change embedding model/dimensions, change the column size in a new migration and re-embed.

## Other providers (OpenAI-compatible)
```env
AI_PROVIDER=openai
AI_API_KEY=...
AI_MODEL=gpt-4o-mini                 # any vision-capable chat model
AI_EMBEDDING_MODEL=text-embedding-3-small   # supports dimensions=768
AI_BASE_URL=https://api.openai.com/v1       # or Groq / OpenRouter
```
Note: Groq/OpenRouter may not offer embeddings; in that case embeddings are skipped and matching falls back to structured signals. To add a new provider, implement `AIProvider` (`lib/ai/types.ts`) and register it in `lib/ai/index.ts`.

## Disable AI
`AI_PROVIDER=none` (or leave the key empty).

## How AI is used (and not used)
| Step | Where | Failure behavior |
|---|---|---|
| Analyze photo + text → category, color, brand, model, keywords, features | `lib/matching/pipeline.ts` | report saved, `ai_status=failed/skipped` |
| Embedding → `item_embeddings` (pgvector, cosine) | same | matching uses structured signals only |
| Explanation for top matches (≥60%) | same | rule-based reasons still shown |
| **Ownership decision** | **never AI** — admins approve claims | n/a |

## Scoring (`lib/matching/score.ts`)
Weights: vector 30%, category 15%, color 10%, brand 10%, location 10%, time 10%, text/keywords 15%. Missing signals are excluded and weights renormalized. Different category ×0.6; found-before-lost ×0.5. Matches ≥45% are stored, ≥60% notify the owner. The score is a similarity signal, **not proof of ownership**.
