import { notFound } from 'next/navigation';
import { MapPin, Clock, Lock } from 'lucide-react';
import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimForm } from '@/components/claim-form';
import { MatchBadge, ScoreDisclaimer } from '@/components/match-badge';
import { fmtDate } from '@/lib/utils';

export default async function FoundDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ match?: string; lost?: string }> }) {
  const { id } = await params; const { match, lost } = await searchParams;
  const ctx = await getCtx();
  const s = await createClient();
  const { data: item } = await s.from('found_items').select('id,title,category,color,brand,description,occurred_at,status,reporter_id,location_text,storage_note,location:locations(name)').eq('id', id).maybeSingle();
  if (!item) notFound();
  const [imgs, { data: m }, { data: myClaim }, { data: priv }] = await Promise.all([
    imageUrls([id]),
    match ? s.from('matches').select('score').eq('id', match).maybeSingle() : Promise.resolve({ data: null }),
    s.from('claims').select('status,admin_note').eq('found_item_id', id).eq('claimant_id', ctx.userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    s.from('item_private_details').select('details').eq('item_type', 'found').eq('item_id', id).maybeSingle(),
  ]);
  const img = imgs[`found:${id}`];
  const loc = item.location as unknown as { name: string } | null;
  const mine = item.reporter_id === ctx.userId;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={item.title} sub="Found item — limited public details" action={<StatusBadge status={item.status} />} />
      {m && <div className="mb-4 space-y-1"><MatchBadge score={Number(m.score)} /><ScoreDisclaimer /></div>}
      <Card><CardContent className="space-y-4 p-5">
        {img && /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt={item.title} className="max-h-80 w-full rounded-md bg-muted object-contain" />}
        <div className="flex flex-wrap gap-2"><Badge tone="blue">{item.category}</Badge>{item.color && <Badge>{item.color}</Badge>}{item.brand && <Badge>{item.brand}</Badge>}</div>
        <p className="text-sm">{item.description}</p>
        <p className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[loc?.name, item.location_text].filter(Boolean).join(' — ') || '—'}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" />Found {fmtDate(item.occurred_at)}</span></p>
        {item.storage_note && <p className="text-sm"><b>Currently:</b> {item.storage_note}</p>}
      </CardContent></Card>
      {(mine || ctx.isAdmin) && priv && <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Private verification details</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{priv.details}</CardContent></Card>}
      <Card className="mt-6"><CardHeader><CardTitle>Is this yours?</CardTitle></CardHeader><CardContent>
        {mine ? <p className="text-sm text-muted-foreground">You reported this item, so you can&apos;t claim it.</p>
          : myClaim ? <p className="text-sm">Your claim status: <StatusBadge status={myClaim.status} />{myClaim.admin_note && <span className="ml-2 text-muted-foreground">“{myClaim.admin_note}”</span>}</p>
          : item.status !== 'open' ? <p className="text-sm text-muted-foreground">This item is no longer available.</p>
          : <ClaimForm foundId={id} lostId={lost} matchId={match} />}
      </CardContent></Card>
    </div>
  );
}
