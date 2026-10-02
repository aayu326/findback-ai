'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCtx } from '@/lib/auth';
import { audit } from '@/lib/notify';
import { orgSchema } from '@/lib/validation/schemas';

export async function addLocation(fd: FormData) {
  const ctx = await getCtx(); if (!ctx.isAdmin) return;
  const name = String(fd.get('name') ?? '').trim(); if (!name) return;
  const supabase = await createClient();
  await supabase.from('locations').insert({ org_id: ctx.orgId, name, description: String(fd.get('description') ?? '') || null });
  revalidatePath('/admin/locations');
}
export async function deleteLocation(fd: FormData) {
  const ctx = await getCtx(); if (!ctx.isAdmin) return;
  const supabase = await createClient();
  await supabase.from('locations').delete().eq('id', String(fd.get('id'))).eq('org_id', ctx.orgId);
  revalidatePath('/admin/locations');
}
export async function setMemberRole(fd: FormData) {
  const ctx = await getCtx(); if (!ctx.isAdmin) return;
  const role = fd.get('role') === 'admin' ? 'admin' : 'member';
  const supabase = await createClient();
  await supabase.from('organization_members').update({ role }).eq('id', String(fd.get('id'))).eq('org_id', ctx.orgId);
  await audit(createAdminClient(), ctx.orgId, ctx.userId, 'member.role_changed', 'member', String(fd.get('id')), { role });
  revalidatePath('/admin/users');
}
export async function closeReport(fd: FormData) {
  const ctx = await getCtx(); if (!ctx.isAdmin) return;
  const t = fd.get('kind') === 'lost' ? 'lost_items' : 'found_items';
  const supabase = await createClient();
  await supabase.from(t).update({ status: 'closed' }).eq('id', String(fd.get('id'))).eq('org_id', ctx.orgId);
  revalidatePath('/admin/reports');
}
export async function markAllRead() {
  const ctx = await getCtx();
  const supabase = await createClient();
  await supabase.from('notifications').update({ read: true }).eq('user_id', ctx.userId).eq('read', false);
  revalidatePath('/notifications'); revalidatePath('/dashboard');
}
export async function dismissMatch(fd: FormData) {
  const supabase = await createClient();
  await supabase.from('matches').update({ status: 'dismissed' }).eq('id', String(fd.get('id')));
  revalidatePath('/items');
}

export async function createOrg(fd: FormData) {
  const p = orgSchema.safeParse({ name: fd.get('name'), type: fd.get('type') });
  if (!p.success) redirect('/onboarding?error=' + encodeURIComponent(p.error.issues[0].message));
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', { p_name: p.data.name, p_type: p.data.type });
  if (error) redirect('/onboarding?error=' + encodeURIComponent(error.message));
  redirect('/dashboard');
}
export async function joinOrg(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('join_organization', { p_code: String(fd.get('code') ?? '') });
  if (error) redirect('/onboarding?error=' + encodeURIComponent(error.message));
  redirect('/dashboard');
}
