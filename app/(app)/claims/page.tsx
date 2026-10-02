import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Empty } from '@/components/item-card';
import { fmtDate } from '@/lib/utils';

export default async function MyClaims() {
  const ctx = await getCtx();
  const s = await createClient();
  const { data } = await s.from('claims').select('id,status,admin_note,created_at,found:found_items(id,title)').eq('claimant_id', ctx.userId).order('created_at', { ascending: false });
  const { data: hs } = await s.from('handovers').select('id,claim_id').eq('claimant_id', ctx.userId);
  return (<>
    <PageHeader title="My claims" sub="Ownership claims you submitted. Every claim is verified by an admin." />
    <div className="space-y-3">{data?.length ? data.map((c) => { const f = c.found as unknown as { id: string; title: string };
      return (<Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div>
        <Link href={`/found/${f.id}`} className="font-medium hover:text-accent">{f.title}</Link><p className="text-xs text-muted-foreground">Submitted {fmtDate(c.created_at)}</p>
        {c.admin_note && <p className="mt-1 text-sm text-muted-foreground">Admin note: {c.admin_note}</p>}
        {hs?.find((h) => h.claim_id === c.id) && <Link href={`/handover/${hs.find((h) => h.claim_id === c.id)!.id}`} className="mt-1 inline-block text-sm font-medium text-accent">Arrange pickup →</Link>}</div><StatusBadge status={c.status} /></Card>); }) : <Empty>No claims yet.</Empty>}</div>
  </>);
}
