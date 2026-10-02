import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Ctx = {
  userId: string; email: string; fullName: string;
  orgId: string; orgName: string; orgType: string; joinCode: string; role: 'admin' | 'member'; isAdmin: boolean;
};

/** Current user + their organization membership (first membership; MVP = one org per user). */
export const getCtx = cache(async (): Promise<Ctx> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: m } = await supabase
    .from('organization_members').select('role, org:organizations(id,name,type,join_code)')
    .eq('user_id', user.id).order('created_at').limit(1).maybeSingle();
  const org = m?.org as unknown as { id: string; name: string; type: string; join_code: string } | null;
  if (!m || !org) redirect('/onboarding');
  const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  return {
    userId: user.id, email: user.email ?? '', fullName: p?.full_name || user.email || 'User',
    orgId: org.id, orgName: org.name, orgType: org.type, joinCode: org.join_code,
    role: m.role, isAdmin: m.role === 'admin',
  };
});
export const requireAdmin = async () => { const c = await getCtx(); if (!c.isAdmin) redirect('/dashboard'); return c; };

async function signedUrlMap(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const supabase = await createClient();
  const { data } = await supabase.storage.from('item-images').createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl]));
}
/** Map "type:id" -> signed image URL for a set of item ids (RLS decides which images are visible). */
export async function imageUrls(ids: string[]) {
  if (!ids.length) return {} as Record<string, string>;
  const supabase = await createClient();
  const { data } = await supabase.from('item_images').select('item_type,item_id,storage_path').in('item_id', ids);
  const urls = await signedUrlMap((data ?? []).map((d) => d.storage_path));
  const out: Record<string, string> = {};
  (data ?? []).forEach((d) => { const u = urls[d.storage_path]; if (u && !out[`${d.item_type}:${d.item_id}`]) out[`${d.item_type}:${d.item_id}`] = u; });
  return out;
}
