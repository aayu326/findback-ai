import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles, Lock, MapPin, Clock, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { dismissMatch } from '@/lib/actions/admin';
import { PageHeader } from '@/components/shell';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty } from '@/components/item-card';
import { MatchBadge, ScoreDisclaimer } from '@/components/match-badge';
import { fmtDate } from '@/lib/utils';

export default async function ItemDetail({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { kind, id } = await params; const { created } = await searchParams;
  if (kind !== 'lost' && kind !== 'found') notFound();
  const ctx = await getCtx();
  const s = await createClient();
  const { data: item } = await s.from(kind === 'lost' ? 'lost_items' : 'found_items').select('*, location:locations(name)').eq('id', id).maybeSingle();
  if (!item) notFound();
  const [{ data: priv }, imgs, { data: matches }] = await Promise.all([
    s.from('item_private_details').select('details').eq('item_type', kind).eq('item_id', id).maybeSingle(),
    imageUrls([id]),
    s.from('matches').select(kind === 'lost' ? '*, found:found_items(id,title,category,color,occurred_at,status)' : 'id,score').eq(kind === 'lost' ? 'lost_item_id' : 'found_item_id', id).neq('status', 'dismissed').order('score', { ascending: false }),
  ]);
  const img = imgs[`${kind}:${id}`];
  const ai = item.ai_analysis as { summary?: string; distinctive_features?: string[] } | null;
  const canSee = item.reporter_id === ctx.userId || ctx.isAdmin;
  return (
    <div className="mx-auto max-w-4xl">
      {created && <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Report saved. AI analysis and matching run in the background — refresh in a few seconds.</div>}
      <PageHeader title={item.title} sub={`${kind === 'lost' ? 'Lost' : 'Found'} report`} action={<StatusBadge status={item.status} />} />
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3"><CardContent className="space-y-4 p-5">
          {img && /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt={item.title} className="max-h-80 w-full rounded-md object-contain bg-muted" />}
          <div className="flex flex-wrap gap-2"><Badge tone="blue">{item.category}</Badge>{item.color && <Badge>{item.color}</Badge>}{item.brand && <Badge>{item.brand}</Badge>}{item.model && <Badge>{item.model}</Badge>}</div>
          <p className="text-sm">{item.description || <span className="text-muted-foreground">No description.</span>}</p>
          {item.distinctive_features && <p className="text-sm"><b>Distinctive:</b> {item.distinctive_features}</p>}
          <p className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[item.location?.name, item.location_text].filter(Boolean).join(' — ') || '—'}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{fmtDate(item.occurred_at)}</span></p>
          {kind === 'found' && item.storage_note && <p className="text-sm"><b>Currently:</b> {item.storage_note}</p>}
        </CardContent></Card>
        <div className="space-y-4 md:col-span-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-accent" />AI analysis</CardTitle></CardHeader><CardContent className="text-sm">
            {item.ai_status === 'pending' && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analyzing… refresh shortly.</p>}
            {(item.ai_status === 'failed' || item.ai_status === 'skipped') && <p className="flex gap-2 text-amber-700"><AlertTriangle className="h-4 w-4 shrink-0" />AI is unavailable right now. Your report is saved and matched using its details.</p>}
            {item.ai_status === 'done' && <><p>{ai?.summary}</p>{!!item.keywords?.length && <div className="mt-2 flex flex-wrap gap-1">{item.keywords.map((k: string) => <Badge key={k}>{k}</Badge>)}</div>}</>}
          </CardContent></Card>
          {canSee && priv && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Private details</CardTitle></CardHeader><CardContent className="text-sm"><p className="whitespace-pre-wrap">{priv.details}</p><p className="mt-2 text-xs text-muted-foreground">Visible only to you and admins.</p></CardContent></Card>}
        </div>
      </div>

      <h2 className="mb-3 mt-8 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent" />Potential matches</h2>
      {kind === 'lost' ? (
        matches?.length ? <div className="space-y-3">{matches.map((raw) => {
          const m = raw as unknown as { id: string; score: number; reasons: string[]; explanation: string | null; status: string; found: { id: string; title: string; category: string; color: string | null; occurred_at: string; status: string } };
          return (<Card key={m.id}><CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><MatchBadge score={m.score} /><StatusBadge status={m.status} /></div>
            <p className="font-medium">{m.found.title} <span className="text-sm font-normal text-muted-foreground">· found {fmtDate(m.found.occurred_at)}</span></p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">{m.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            {m.explanation && <p className="rounded-md bg-muted p-3 text-sm"><Sparkles className="mr-1 inline h-3 w-3 text-accent" />{m.explanation}</p>}
            <ScoreDisclaimer />
            <div className="flex gap-2"><Button asChild size="sm" variant="accent"><Link href={`/found/${m.found.id}?match=${m.id}&lost=${id}`}>View &amp; claim</Link></Button>
              <form action={dismissMatch}><input type="hidden" name="id" value={m.id} /><Button size="sm" variant="outline">Not mine</Button></form></div>
          </CardContent></Card>);
        })}</div> : <Empty>No matches yet. We&apos;ll notify you when a similar item is reported.</Empty>
      ) : <Empty>{matches?.length ?? 0} possible owner match(es). Owner details stay private — admins verify claims.</Empty>}
    </div>
  );
}
