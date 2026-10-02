import type { SupabaseClient } from '@supabase/supabase-js';
type N = { user_id: string; org_id: string; type: string; title: string; body?: string; link?: string };
/** Service-role only: users cannot insert notifications for others via RLS. */
export const notify = async (db: SupabaseClient, rows: N | N[]) => {
  const list = Array.isArray(rows) ? rows : [rows];
  if (list.length) await db.from('notifications').insert(list);
};
export const audit = (db: SupabaseClient, org_id: string, actor_id: string | null, action: string, entity_type?: string, entity_id?: string, metadata: object = {}) =>
  db.from('audit_logs').insert({ org_id, actor_id, action, entity_type, entity_id, metadata });
