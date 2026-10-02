import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarCard, MonthlyChart } from '@/components/charts';
import { fmtDate } from '@/lib/utils';

const count = <K extends string>(rows: { [k in K]?: string | null }[], key: K) => {
  const m = new Map<string, number>(); rows.forEach((r) => { const k = r[key] || 'Unspecified'; m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
};
export default async function AdminHome() {
  const ctx = await requireAdmin();
  const s = await createClient();
  const [lost, found, matches, claims, activity, locs] = await Promise.all([
    s.from('lost_items').select('category,location_id,created_at').eq('org_id', ctx.orgId).limit(5000),
    s.from('found_items').select('category,location_id,created_at,status').eq('org_id', ctx.orgId).limit(5000),
    s.from('matches').select('id', { count: 'exact', head: true }).eq('org_id', ctx.orgId),
    s.from('claims').select('status').eq('org_id', ctx.orgId),
    s.from('audit_logs').select('*').eq('org_id', ctx.orgId).order('created_at', { ascending: false }).limit(10),
    s.from('locations').select('id,name').eq('org_id', ctx.orgId),
  ]);
  const L = lost.data ?? [], F = found.data ?? [];
  const returned = F.filter((f) => f.status === 'returned').length;
  const pending = (claims.data ?? []).filter((c) => c.status === 'PENDING').length;
  const locName = (id: string | null) => locs.data?.find((l) => l.id === id)?.name ?? null;
  const months: Record<string, { name: string; lost: number; found: number }> = {};
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = d.toISOString().slice(0, 7); months[k] = { name: d.toLocaleString('en', { month: 'short' }), lost: 0, found: 0 }; }
  L.forEach((r) => { const m = months[r.created_at.slice(0, 7)]; if (m) m.lost++; });
  F.forEach((r) => { const m = months[r.created_at.slice(0, 7)]; if (m) m.found++; });
  const stats = [['Lost reports', L.length], ['Found reports', F.length], ['AI matches', matches.count ?? 0], ['Returned', returned], ['Pending claims', pending]];
  return (<>
    <PageHeader title="Analytics" sub={`${ctx.orgName} · join code `} action={<code className="rounded bg-navy-900 px-3 py-1.5 text-sm text-white">{ctx.joinCode}</code>} />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{stats.map(([l, v]) => <Card key={l as string} className="p-4"><p className="text-2xl font-semibold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></Card>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Monthly reports</CardTitle></CardHeader><CardContent><MonthlyChart data={Object.values(months)} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Categories</CardTitle></CardHeader><CardContent><BarCard data={count([...L, ...F], 'category')} layout="vertical" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top locations</CardTitle></CardHeader><CardContent><BarCard data={count([...L, ...F].map((r) => ({ loc: locName(r.location_id) })), 'loc')} layout="vertical" /></CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent>
        {activity.data?.length ? <ul className="divide-y text-sm">{activity.data.map((a) => <li key={a.id} className="flex justify-between py-2"><span>{a.action}</span><span className="text-muted-foreground">{fmtDate(a.created_at)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No activity yet.</p>}
      </CardContent></Card>
    </div></>);
}
