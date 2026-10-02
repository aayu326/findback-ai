import Link from 'next/link';
import { Package, Search, Sparkles, ShieldCheck, Bell, ArrowRight } from 'lucide-react';
import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemCard, Empty, type CardItem } from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/lib/utils';

export default async function Dashboard() {
  const ctx = await getCtx();
  const s = await createClient();
  const sel = 'id,title,category,color,status,occurred_at,location_text,location:locations(name)';
  const [lost, found, matches, claims, notifs] = await Promise.all([
    s.from('lost_items').select(sel).eq('reporter_id', ctx.userId).order('created_at', { ascending: false }).limit(4),
    s.from('found_items').select(sel).eq('reporter_id', ctx.userId).order('created_at', { ascending: false }).limit(4),
    s.from('matches').select('id,score,reasons,lost:lost_items(id,title),found:found_items(id,title)').eq('lost_owner_id', ctx.userId).in('status', ['suggested', 'claimed']).order('score', { ascending: false }).limit(5),
    s.from('claims').select('id,status').eq('claimant_id', ctx.userId),
    s.from('notifications').select('*').eq('user_id', ctx.userId).order('created_at', { ascending: false }).limit(5),
  ]);
  const imgs = await imageUrls([...(lost.data ?? []), ...(found.data ?? [])].map((i) => i.id));
  const stats = [
    { l: 'My lost items', v: lost.data?.length ?? 0, i: Package, h: '/items' },
    { l: 'My found items', v: found.data?.length ?? 0, i: Search, h: '/items' },
    { l: 'Potential matches', v: matches.data?.length ?? 0, i: Sparkles, h: '/items' },
    { l: 'Claims', v: claims.data?.length ?? 0, i: ShieldCheck, h: '/claims' },
  ];
  return (
    <>
      <PageHeader title="Dashboard" sub={`${ctx.orgName} · ${ctx.orgType}`} action={
        <div className="flex gap-2"><Button asChild variant="outline"><Link href="/report/lost">Report Lost Item</Link></Button><Button asChild variant="accent"><Link href="/report/found">Report Found Item</Link></Button></div>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((x) => (<Link key={x.l} href={x.h}><Card className="p-4 transition hover:shadow-md"><x.i className="h-5 w-5 text-accent" /><p className="mt-3 text-2xl font-semibold">{x.v}</p><p className="text-xs text-muted-foreground">{x.l}</p></Card></Link>))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" />Potential matches</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {matches.data?.length ? matches.data.map((m) => {
              const lost = m.lost as unknown as { id: string; title: string } | null; const fnd = m.found as unknown as { id: string; title: string } | null;
              return (<Link key={m.id} href={`/items/lost/${lost?.id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{lost?.title} <span className="text-muted-foreground">↔</span> {fnd?.title}</p><p className="truncate text-xs text-muted-foreground">{(m.reasons as string[]).slice(0, 2).join(' · ')}</p></div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{Math.round(Number(m.score))}%</span></Link>);
            }) : <Empty>No matches yet. When someone reports a similar found item, it will appear here.</Empty>}
          </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-accent" />Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notifs.data?.length ? notifs.data.map((n) => (<Link key={n.id} href={n.link ?? '/notifications'} className="block rounded-md p-2 text-sm hover:bg-muted/50">
              <p className={n.read ? 'text-muted-foreground' : 'font-medium'}>{n.title}</p><p className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</p></Link>)) : <Empty>You&apos;re all caught up.</Empty>}
          </CardContent></Card>
      </div>
      {[['Recent lost reports', 'lost', lost.data], ['Recent found reports', 'found', found.data]].map(([t, k, rows]) => (
        <section key={k as string} className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{t as string}</h2>
          <Link href="/items" className="flex items-center gap-1 text-sm text-accent">View all <ArrowRight className="h-3 w-3" /></Link></div>
          <div className="grid gap-3 md:grid-cols-2">{(rows as unknown as CardItem[] | null)?.length ? (rows as unknown as CardItem[]).map((i) => <ItemCard key={i.id} item={i} kind={k as 'lost' | 'found'} img={imgs[`${k}:${i.id}`]} />) : <Empty>Nothing reported yet.</Empty>}</div></section>))}
    </>
  );
}
