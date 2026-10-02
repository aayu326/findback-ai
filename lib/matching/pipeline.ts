// Enrich a report with AI (best-effort) and run hybrid matching. Server only (service role).
import { createAdminClient } from '@/lib/supabase/admin';
import { embeddingModelName, safeAnalyze, safeEmbed, safeExplain } from '@/lib/ai';
import { notify } from '@/lib/notify';
import { MIN_STORE_SCORE, NOTIFY_SCORE, scoreMatch, type Matchable } from './score';

type Kind = 'lost' | 'found';
const table = (k: Kind) => (k === 'lost' ? 'lost_items' : 'found_items');
const describe = (m: Matchable) =>
  [m.title, m.category, m.color, m.brand, m.model, m.description, m.distinctive_features, (m.keywords ?? []).join(' ')].filter(Boolean).join('. ');

export async function enrichAndMatch(kind: Kind, id: string) {
  const db = createAdminClient();
  try {
    const { data: item } = await db.from(table(kind)).select('*').eq('id', id).single();
    if (!item) return;

    // 1) Analyze image + text (never fails the report). Private details are never sent to the AI.
    let image: { mime: string; base64: string } | null = null;
    const { data: img } = await db.from('item_images').select('storage_path').eq('item_type', kind).eq('item_id', id).limit(1).maybeSingle();
    if (img) {
      const { data: blob } = await db.storage.from('item-images').download(img.storage_path);
      if (blob) image = { mime: blob.type || 'image/jpeg', base64: Buffer.from(await blob.arrayBuffer()).toString('base64') };
    }
    const a = await safeAnalyze({ title: item.title, description: item.description, image });
    const upd: Record<string, unknown> = { ai_status: a ? 'done' : process.env.AI_API_KEY ? 'failed' : 'skipped' };
    if (a) {
      upd.ai_analysis = a;
      upd.keywords = (a.keywords ?? []).slice(0, 10);
      if (!item.color && a.color) upd.color = a.color;
      if (!item.brand && a.brand) upd.brand = a.brand;
      if (!item.model && a.model) upd.model = a.model;
    }
    await db.from(table(kind)).update(upd).eq('id', id);
    const merged = { ...item, ...upd } as Matchable & { id: string; org_id: string; reporter_id: string };

    // 2) Embedding
    const vec = await safeEmbed(describe(merged) + (a?.summary ? `. ${a.summary}` : ''));
    if (vec) {
      await db.from('item_embeddings').upsert(
        { org_id: item.org_id, item_type: kind, item_id: id, embedding: JSON.stringify(vec), model: embeddingModelName() },
        { onConflict: 'item_type,item_id' });
    }

    // 3) Candidates: all open opposite-type items in the org (so matching works even without embeddings)
    const other: Kind = kind === 'lost' ? 'found' : 'lost';
    const { data: cands } = await db.from(table(other)).select('*').eq('org_id', item.org_id).eq('status', 'open').limit(300);
    if (!cands?.length) return;
    const sims = new Map<string, number>();
    if (vec) {
      const { data } = await db.rpc('match_candidates', { p_type: kind, p_item: id, p_limit: 300 });
      (data ?? []).forEach((r: { candidate_id: string; similarity: number }) => sims.set(r.candidate_id, r.similarity));
    }
    const { data: locs } = await db.from('locations').select('id,name').eq('org_id', item.org_id);
    const locName = (lid?: string | null) => locs?.find((l) => l.id === lid)?.name;

    const scored = cands.map((c) => {
      const [lost, found] = kind === 'lost' ? [merged, c] : [c, merged];
      const s = scoreMatch(lost, found, sims.get(c.id) ?? null, locName(lost.location_id), locName(found.location_id));
      return { c, lost, found, ...s };
    }).filter((x) => x.score >= MIN_STORE_SCORE).sort((x, y) => y.score - x.score).slice(0, 10);

    for (const [i, x] of scored.entries()) {
      const explanation = i < 3 && x.score >= NOTIFY_SCORE ? await safeExplain(describe(x.lost), describe(x.found)) : null;
      const row = {
        org_id: item.org_id, lost_item_id: x.lost.id, found_item_id: x.found.id,
        lost_owner_id: x.lost.reporter_id, found_owner_id: x.found.reporter_id,
        score: x.score, vector_score: sims.get(x.c.id) ?? null, components: x.components, reasons: x.reasons,
        ...(explanation ? { explanation } : {}),
      };
      const { data: existing } = await db.from('matches').select('id').eq('lost_item_id', x.lost.id).eq('found_item_id', x.found.id).maybeSingle();
      if (existing) { await db.from('matches').update(row).eq('id', existing.id); continue; }
      await db.from('matches').insert(row);
      if (x.score >= NOTIFY_SCORE) {
        await notify(db, {
          user_id: x.lost.reporter_id, org_id: item.org_id, type: 'potential_match',
          title: `Potential match for "${x.lost.title}"`,
          body: `${Math.round(x.score)}% AI match score — a similarity signal, not proof of ownership.`,
          link: `/items/lost/${x.lost.id}`,
        });
      }
    }
  } catch (e) {
    console.error('[pipeline] failed (report is still saved):', e);
  }
}
