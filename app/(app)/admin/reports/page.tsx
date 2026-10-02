import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { closeReport } from '@/lib/actions/admin';
import { PageHeader } from '@/components/shell';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDay } from '@/lib/utils';

export default async function AdminReports() {
  const ctx = await requireAdmin();
  const s = await createClient();
  const [l, f] = await Promise.all([
    s.from('lost_items').select('id,title,category,status,created_at').eq('org_id', ctx.orgId).order('created_at', { ascending: false }).limit(100),
    s.from('found_items').select('id,title,category,status,created_at').eq('org_id', ctx.orgId).order('created_at', { ascending: false }).limit(100),
  ]);
  const rows = [...(l.data ?? []).map((r) => ({ ...r, kind: 'lost' })), ...(f.data ?? []).map((r) => ({ ...r, kind: 'found' }))].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (<>
    <PageHeader title="All reports" />
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm">
      <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Item</th><th>Type</th><th>Category</th><th>Status</th><th>Date</th><th /></tr></thead>
      <tbody className="divide-y">{rows.map((r) => (<tr key={r.kind + r.id}>
        <td className="p-3"><Link className="font-medium hover:text-accent" href={`/items/${r.kind}/${r.id}`}>{r.title}</Link></td>
        <td className="capitalize">{r.kind}</td><td>{r.category}</td><td><StatusBadge status={r.status} /></td><td>{fmtDay(r.created_at)}</td>
        <td className="pr-3 text-right">{r.status === 'open' && <form action={closeReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="kind" value={r.kind} /><Button size="sm" variant="outline">Close</Button></form>}</td></tr>))}</tbody></table></div></>);
}
