import Link from 'next/link';
import { CheckCheck } from 'lucide-react';
import { getCtx } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { markAllRead } from '@/lib/actions/admin';
import { PageHeader } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/item-card';
import { fmtDate } from '@/lib/utils';

export default async function Notifications() {
  const ctx = await getCtx();
  const s = await createClient();
  const { data } = await s.from('notifications').select('*').eq('user_id', ctx.userId).order('created_at', { ascending: false }).limit(100);
  return (<>
    <PageHeader title="Notifications" action={<form action={markAllRead}><Button variant="outline" size="sm"><CheckCheck className="h-4 w-4" />Mark all read</Button></form>} />
    <div className="space-y-2">{data?.length ? data.map((n) => (
      <Link key={n.id} href={n.link ?? '#'} className={`block rounded-lg border bg-white p-4 hover:shadow-sm ${n.read ? '' : 'border-accent/40 bg-blue-50/40'}`}>
        <p className="text-sm font-medium">{n.title}</p>{n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}<p className="mt-1 text-xs text-muted-foreground">{fmtDate(n.created_at)}</p></Link>)) : <Empty>No notifications.</Empty>}</div>
  </>);
}
