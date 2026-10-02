'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCtx } from '@/lib/auth';
import { claimSchema, type ClaimInput } from '@/lib/validation/schemas';
import { audit, notify } from '@/lib/notify';

export async function submitClaim(input: ClaimInput): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getCtx();
  const p = claimSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const supabase = await createClient();
  const { data: found } = await supabase.from('found_items').select('id,title,status,reporter_id').eq('id', d.found_item_id).maybeSingle();
  if (!found || found.status !== 'open') return { error: 'This item is no longer available to claim' };
  if (found.reporter_id === ctx.userId) return { error: 'You cannot claim an item you reported as found' };
  const { count } = await supabase.from('claims').select('id', { count: 'exact', head: true })
    .eq('found_item_id', d.found_item_id).eq('claimant_id', ctx.userId).in('status', ['PENDING', 'APPROVED']);
  if (count) return { error: 'You already have an active claim for this item' };

  const { data: claim, error } = await supabase.from('claims').insert({
    org_id: ctx.orgId, found_item_id: d.found_item_id, lost_item_id: d.lost_item_id || null, match_id: d.match_id || null,
    claimant_id: ctx.userId, message: d.message || null,
    answers: { describe: d.describe, identifiers: d.identifiers || null, lost_when_where: d.lost_when_where },
  }).select('id').single();
  if (error || !claim) return { error: error?.message ?? 'Could not submit claim' };

  const db = createAdminClient();
  if (d.match_id) await db.from('matches').update({ status: 'claimed' }).eq('id', d.match_id);
  const { data: admins } = await db.from('organization_members').select('user_id').eq('org_id', ctx.orgId).eq('role', 'admin');
  await notify(db, (admins ?? []).map((a) => ({
    user_id: a.user_id, org_id: ctx.orgId, type: 'claim_submitted', title: `New claim for "${found.title}"`,
    body: `${ctx.fullName} submitted an ownership claim awaiting review.`, link: '/admin/claims' })));
  await audit(db, ctx.orgId, ctx.userId, 'claim.submitted', 'claim', claim.id);
  revalidatePath('/claims');
  return { ok: true };
}

export async function reviewClaim(claimId: string, decision: 'APPROVED' | 'REJECTED' | 'RETURNED', note: string) {
  const ctx = await getCtx();
  if (!ctx.isAdmin) return { error: 'Admins only' };
  const supabase = await createClient();   // RLS: only org admins can update claims
  const { data: claim } = await supabase.from('claims').select('*, found:found_items(title,reporter_id)').eq('id', claimId).maybeSingle();
  if (!claim) return { error: 'Claim not found' };
  const ok = (decision === 'RETURNED' && claim.status === 'APPROVED') || (decision !== 'RETURNED' && claim.status === 'PENDING');
  if (!ok) return { error: `Cannot move a ${claim.status} claim to ${decision}` };
  if (decision === 'REJECTED' && !note.trim()) return { error: 'Add a short reason for the claimant' };

  const { error } = await supabase.from('claims').update({
    status: decision, admin_note: note || null, reviewed_by: ctx.userId, reviewed_at: new Date().toISOString() }).eq('id', claimId);
  if (error) return { error: error.message };

  const db = createAdminClient();
  const title = (claim.found as { title: string }).title;
  const finder = (claim.found as { reporter_id: string }).reporter_id;
  let hid: string | undefined;
  if (decision === 'APPROVED') {
    await db.from('found_items').update({ status: 'matched' }).eq('id', claim.found_item_id);
    // Open an anonymous handover between finder and verified owner
    const { data: h } = await db.from('handovers').upsert({
      org_id: ctx.orgId, claim_id: claimId, found_item_id: claim.found_item_id, lost_item_id: claim.lost_item_id,
      finder_id: finder, claimant_id: claim.claimant_id }, { onConflict: 'claim_id' }).select('id').single();
    hid = h?.id;
  }
  if (decision === 'REJECTED') {
    await db.from('found_items').update({ status: 'open' }).eq('id', claim.found_item_id);
    if (claim.match_id) await db.from('matches').update({ status: 'suggested' }).eq('id', claim.match_id);
  }
  if (decision === 'RETURNED') {
    await db.from('found_items').update({ status: 'returned' }).eq('id', claim.found_item_id);
    if (claim.lost_item_id) await db.from('lost_items').update({ status: 'returned' }).eq('id', claim.lost_item_id);
    if (claim.match_id) await db.from('matches').update({ status: 'confirmed' }).eq('id', claim.match_id);
    await db.from('handovers').update({ status: 'COMPLETED' }).eq('claim_id', claimId);
  }
  const msg = {
    APPROVED: ['claim_approved', `Claim approved: "${title}"`, 'An admin verified your claim. Open the handover to arrange a safe pickup with the finder (chat is anonymous).'],
    REJECTED: ['claim_rejected', `Claim not approved: "${title}"`, note],
    RETURNED: ['item_returned', `Item returned: "${title}"`, 'The item has been marked as returned to its owner.'],
  }[decision];
  const rows = [{ user_id: claim.claimant_id, org_id: ctx.orgId, type: msg[0], title: msg[1], body: msg[2], link: hid ? `/handover/${hid}` : '/claims' }];
  if (decision === 'APPROVED' && hid) rows.push({ user_id: finder, org_id: ctx.orgId, type: 'handover_started', title: `Owner verified for "${title}"`, body: 'Open the handover to agree a meeting point. Chat is anonymous.', link: `/handover/${hid}` });
  if (decision === 'RETURNED') rows.push({ user_id: finder, org_id: ctx.orgId, type: 'item_returned', title: `Thank you! "${title}" was returned`, body: 'The item you found has been returned to its owner.', link: '/items' });
  await notify(db, rows);
  await audit(db, ctx.orgId, ctx.userId, `claim.${decision.toLowerCase()}`, 'claim', claimId, { note });
  revalidatePath('/admin/claims'); revalidatePath('/claims');
  return { ok: true };
}
