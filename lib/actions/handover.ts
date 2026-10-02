'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCtx } from '@/lib/auth';
import { audit, notify } from '@/lib/notify';

// Keep the chat anonymous: block phone numbers / emails.
const CONTACT = /(\+?\d[\s\-().]*){10,}|[\w.+-]+@[\w-]+\.[\w.]+/;

async function load(id: string) {
  const ctx = await getCtx();
  const s = await createClient();   // RLS: only parties/admins can read
  const { data: h } = await s.from('handovers').select('*, found:found_items(title)').eq('id', id).maybeSingle();
  const party = h && (h.finder_id === ctx.userId || h.claimant_id === ctx.userId);
  return { ctx, s, h: party ? h : null };
}
const other = (h: { finder_id: string; claimant_id: string }, me: string) => (h.finder_id === me ? h.claimant_id : h.finder_id);
const done = (id: string) => { revalidatePath(`/handover/${id}`); revalidatePath('/handovers'); };

export async function sendMessage(id: string, body: string): Promise<{ error?: string }> {
  const { ctx, s, h } = await load(id);
  if (!h) return { error: 'Not allowed' };
  const text = body.trim();
  if (!text) return { error: 'Write a message' };
  if (CONTACT.test(text)) return { error: 'For safety, don\u2019t share phone numbers or emails here. Agree a meeting point instead.' };
  const { error } = await s.from('handover_messages').insert({ handover_id: id, sender_id: ctx.userId, body: text });
  if (error) return { error: h.status === 'COMPLETED' ? 'This handover is completed' : error.message };
  await notify(createAdminClient(), { user_id: other(h, ctx.userId), org_id: h.org_id, type: 'handover_message',
    title: `New message about "${h.found.title}"`, link: `/handover/${id}` });
  return {};
}

export async function proposeMeeting(id: string, v: { location_id: string; meet_at: string; note: string }): Promise<{ error?: string }> {
  const { ctx, h } = await load(id);
  if (!h || h.status === 'COMPLETED') return { error: 'Not allowed' };
  if (!v.location_id) return { error: 'Choose a meeting point' };
  if (!v.meet_at) return { error: 'Choose a date & time' };
  const db = createAdminClient();
  await db.from('handovers').update({
    status: 'SCHEDULED', meeting_location_id: v.location_id, meet_at: new Date(v.meet_at).toISOString(), meeting_note: v.note.trim() || null,
  }).eq('id', id);
  await notify(db, { user_id: other(h, ctx.userId), org_id: h.org_id, type: 'handover_meeting',
    title: `Meeting proposed for "${h.found.title}"`, body: 'Open the handover to see the time and place.', link: `/handover/${id}` });
  done(id); return {};
}

export async function deskFallback(id: string, note: string): Promise<{ error?: string }> {
  const { ctx, h } = await load(id);
  if (!h || h.finder_id !== ctx.userId || h.status === 'COMPLETED') return { error: 'Only the finder can do this' };
  if (note.trim().length < 3) return { error: 'Say where you left the item (e.g. Security desk)' };
  const db = createAdminClient();
  await db.from('handovers').update({ status: 'DESK', desk_note: note.trim() }).eq('id', id);
  await db.from('found_items').update({ storage_note: note.trim() }).eq('id', h.found_item_id);
  await notify(db, { user_id: h.claimant_id, org_id: h.org_id, type: 'handover_desk', title: `Your item is ready for pickup: "${h.found.title}"`,
    body: `Collect it from: ${note.trim()}. Carry your ID. Then tap "I received my item".`, link: `/handover/${id}` });
  await audit(db, h.org_id, ctx.userId, 'handover.desk_fallback', 'handover', id);
  done(id); return {};
}

export async function confirmHandover(id: string): Promise<{ error?: string }> {
  const { ctx, h } = await load(id);
  if (!h || h.status === 'COMPLETED') return { error: 'Not allowed' };
  const db = createAdminClient();
  const now = new Date().toISOString();
  const isFinder = h.finder_id === ctx.userId;
  const patch = isFinder ? { finder_confirmed_at: now } : { claimant_confirmed_at: now };
  await db.from('handovers').update(patch).eq('id', id);
  const f = isFinder ? now : h.finder_confirmed_at, c = isFinder ? h.claimant_confirmed_at : now;
  // Complete when both confirm; or when the owner confirms receipt after a desk drop-off.
  if ((f && c) || (!isFinder && h.status === 'DESK')) await complete(h);
  else await notify(db, { user_id: other(h, ctx.userId), org_id: h.org_id, type: 'handover_confirm',
    title: `${isFinder ? 'Finder says the item was handed over' : 'Owner says the item was received'}: "${h.found.title}"`,
    body: 'Please confirm on your side to close this handover.', link: `/handover/${id}` });
  done(id); return {};
}

async function complete(h: { id: string; org_id: string; claim_id: string; found_item_id: string; lost_item_id: string | null; finder_id: string; claimant_id: string; found: { title: string } }) {
  const db = createAdminClient();
  const { data: claim } = await db.from('claims').select('match_id').eq('id', h.claim_id).single();
  await db.from('handovers').update({ status: 'COMPLETED' }).eq('id', h.id);
  await db.from('claims').update({ status: 'RETURNED' }).eq('id', h.claim_id);
  await db.from('found_items').update({ status: 'returned' }).eq('id', h.found_item_id);
  if (h.lost_item_id) await db.from('lost_items').update({ status: 'returned' }).eq('id', h.lost_item_id);
  if (claim?.match_id) await db.from('matches').update({ status: 'confirmed' }).eq('id', claim.match_id);
  await notify(db, [
    { user_id: h.claimant_id, org_id: h.org_id, type: 'item_returned', title: `Item returned: "${h.found.title}"`, body: 'Handover completed. Glad you got it back!', link: '/claims' },
    { user_id: h.finder_id, org_id: h.org_id, type: 'item_returned', title: `Thank you! "${h.found.title}" was returned`, body: 'The owner confirmed receipt.', link: '/handovers' },
  ]);
  await audit(db, h.org_id, null, 'handover.completed', 'handover', h.id);
}
