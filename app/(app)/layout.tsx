import { getCtx } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';

export const dynamic = 'force-dynamic';
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const supabase = await createClient();
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', ctx.userId).eq('read', false);
  return <Shell ctx={ctx} unread={count ?? 0}>{children}</Shell>;
}
