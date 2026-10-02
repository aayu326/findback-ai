import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { ClaimActions } from '@/components/claim-actions';
import { Empty } from '@/components/item-card';
import { fmtDate } from '@/lib/utils';

export default async function AdminClaims() {
  const ctx = await requireAdmin();
  const s = await createClient();
  const { data: claims } = await s.from('claims').select('*, found:found_items(id,title,category,color,reporter_id)').eq('org_id', ctx.orgId).order('created_at', { ascending: false });
  const ids = (claims ?? []).map((c) => c.found_item_id);
  const lostIds = (claims ?? []).map((c) => c.lost_item_id).filter(Boolean);
  const [{ data: fp }, { data: lp }, { data: matches }, { data: profs }] = await Promise.all([
    s.from('item_private_details').select('item_id,details').eq('item_type', 'found').in('item_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    s.from('item_private_details').select('item_id,details').eq('item_type', 'lost').in('item_id', lostIds.length ? lostIds : ['00000000-0000-0000-0000-000000000000']),
    s.from('matches').select('id,score').in('id', (claims ?? []).map((c) => c.match_id).filter(Boolean).concat(['00000000-0000-0000-0000-000000000000'])),
    s.from('profiles').select('id,full_name,phone').in('id', (claims ?? []).map((c) => c.claimant_id).concat(['00000000-0000-0000-0000-000000000000'])),
  ]);
  const order = { PENDING: 0, APPROVED: 1, REJECTED: 2, RETURNED: 3 } as Record<string, number>;
  const sorted = [...(claims ?? [])].sort((a, b) => order[a.status] - order[b.status]);
  return (<>
    <PageHeader title="Claims" sub="Review evidence yourself. AI match scores are hints, never proof of ownership." />
    <div className="space-y-4">{sorted.length ? sorted.map((c) => {
      const f = c.found as { id: string; title: string; category: string }; const p = profs?.find((x) => x.id === c.claimant_id);
      const a = c.answers as { describe?: string; identifiers?: string; lost_when_where?: string };
      const m = matches?.find((x) => x.id === c.match_id);
      return (<Card key={c.id}><CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><Link href={`/found/${f.id}`} className="font-semibold hover:text-accent">{f.title}</Link>
          <p className="text-xs text-muted-foreground">by {p?.full_name || 'Unknown'}{p?.phone ? ` · ${p.phone}` : ''} · {fmtDate(c.created_at)}{m ? ` · AI score ${Math.round(Number(m.score))}% (hint only)` : ''}</p></div><StatusBadge status={c.status} /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-muted p-3 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Claimant says</p>
            <p><b>Description:</b> {a.describe}</p>{a.identifiers && <p><b>Identifiers:</b> {a.identifiers}</p>}<p><b>Lost:</b> {a.lost_when_where}</p>{c.message && <p><b>Note:</b> {c.message}</p>}</div>
          <div className="rounded-md bg-blue-50 p-3 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-blue-800">Finder&apos;s private details</p>
            <p className="whitespace-pre-wrap">{fp?.find((x) => x.item_id === c.found_item_id)?.details ?? '— none provided —'}</p>
            {c.lost_item_id && <p className="mt-2 border-t border-blue-200 pt-2"><b>Owner&apos;s lost report details:</b> {lp?.find((x) => x.item_id === c.lost_item_id)?.details ?? '—'}</p>}</div>
        </div>
        {c.admin_note && <p className="text-sm text-muted-foreground">Admin note: {c.admin_note}</p>}
        <ClaimActions claimId={c.id} status={c.status} />
      </CardContent></Card>); }) : <Empty>No claims yet.</Empty>}</div></>);
}
