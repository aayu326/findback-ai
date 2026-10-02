'use server';
import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getCtx } from '@/lib/auth';
import { reportSchema, IMAGE_TYPES, MAX_IMAGE } from '@/lib/validation/schemas';
import { enrichAndMatch } from '@/lib/matching/pipeline';

export async function submitReport(kind: 'lost' | 'found', fd: FormData): Promise<{ error: string }> {
  if (kind !== 'lost' && kind !== 'found') return { error: 'Invalid report type' };
  const ctx = await getCtx();
  const parsed = reportSchema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const f = parsed.data;
  const file = fd.get('image');
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile && (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE)) return { error: 'Image must be JPG/PNG/WebP under 5 MB' };

  const supabase = await createClient();
  const table = kind === 'lost' ? 'lost_items' : 'found_items';
  const row: Record<string, unknown> = {
    org_id: ctx.orgId, reporter_id: ctx.userId, title: f.title, category: f.category,
    description: f.description || null, color: f.color || null, brand: f.brand || null, model: f.model || null,
    location_id: f.location_id || null, location_text: f.location_text || null,
    occurred_at: new Date(f.occurred_at).toISOString(), distinctive_features: f.distinctive_features || null,
    ...(kind === 'found' ? { storage_note: f.storage_note || null } : {}),
  };
  const { data: item, error } = await supabase.from(table).insert(row).select('id').single();
  if (error || !item) return { error: error?.message ?? 'Could not save report' };

  if (f.private_details) {
    await supabase.from('item_private_details').insert({
      org_id: ctx.orgId, item_type: kind, item_id: item.id, owner_id: ctx.userId, details: f.private_details });
  }
  if (hasFile) {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${ctx.orgId}/${ctx.userId}/${randomUUID()}.${ext}`;
    const up = await supabase.storage.from('item-images').upload(path, file, { contentType: file.type });
    if (!up.error) {
      await supabase.from('item_images').insert({ org_id: ctx.orgId, item_type: kind, item_id: item.id, owner_id: ctx.userId, storage_path: path });
    } // upload failure never blocks the report
  }
  // AI analysis + matching runs after the response so a slow/failed AI call can't block or break saving.
  after(() => enrichAndMatch(kind, item.id));
  redirect(`/items/${kind}/${item.id}?created=1`);
}
