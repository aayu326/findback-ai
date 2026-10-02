import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Empty } from '@/components/item-card';
import { fmtDate } from '@/lib/utils';

export default async function Handovers() {
  const ctx = await getCtx();
  const s = await createClient();
  const { data } = await s.from('handovers').select('id,status,meet_at,finder_id,claimant_id,created_at,found:found_items(title)').order('created_at', { ascending: false });
  const mine = (data ?? []).filter((h) => ctx.isAdmin || h.finder_id === ctx.userId || h.claimant_id === ctx.userId);
  return (<>
    <PageHeader title="Handovers" sub="Arrange safe, anonymous pickup after a claim is approved." />
    <div className="space-y-3">{mine.length ? mine.map((h) => (
      <Link key={h.id} href={`/handover/${h.id}`}><Card className="flex items-center justify-between gap-3 p-4 transition hover:shadow-md"><div>
        <p className="font-medium">{(h.found as unknown as { title: string }).title}</p>
        <p className="text-xs text-muted-foreground">{h.finder_id === ctx.userId ? 'You are the finder' : h.claimant_id === ctx.userId ? 'You are the owner' : 'Admin view'}{h.meet_at ? ` · meeting ${fmtDate(h.meet_at)}` : ''}</p></div>
        <Badge tone={h.status === 'COMPLETED' ? 'green' : 'blue'}>{h.status}</Badge></Card></Link>)) : <Empty>No handovers yet. They start when an admin approves a claim.</Empty>}</div></>);
}
