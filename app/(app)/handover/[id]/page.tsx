import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HandoverPanel } from '@/components/handover-panel';
import { HandoverChat } from '@/components/handover-chat';

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const s = await createClient();
  const { data: h } = await s.from('handovers').select('*, found:found_items(title,category,color)').eq('id', id).maybeSingle();
  if (!h) notFound();
  const role = h.finder_id === ctx.userId ? 'finder' : h.claimant_id === ctx.userId ? 'claimant' : 'admin';
  const [{ data: locations }, imgs] = await Promise.all([s.from('locations').select('id,name').order('name'), imageUrls([h.found_item_id])]);
  const img = imgs[`found:${h.found_item_id}`];
  const f = h.found as { title: string; category: string; color: string | null };
  const mineConfirmed = role === 'finder' ? !!h.finder_confirmed_at : !!h.claimant_confirmed_at;
  const otherConfirmed = role === 'finder' ? !!h.claimant_confirmed_at : !!h.finder_confirmed_at;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Handover: ${f.title}`} sub={role === 'admin' ? 'Viewing as admin' : `You are the ${role === 'finder' ? 'finder' : 'verified owner'}. The other person stays anonymous.`} action={<Badge tone={h.status === 'COMPLETED' ? 'green' : 'blue'}>{h.status}</Badge>} />
      <div className="mb-5 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Meet only in public places. Phone numbers and emails are never shared here. The owner must carry an ID when collecting the item.</div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardContent className="space-y-4 p-5">
          {img && /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt={f.title} className="max-h-48 w-full rounded-md bg-muted object-contain" />}
          <div className="flex gap-2"><Badge tone="blue">{f.category}</Badge>{f.color && <Badge>{f.color}</Badge>}</div>
          <HandoverPanel id={id} role={role} status={h.status} locations={locations ?? []}
            meeting={{ locationId: h.meeting_location_id, locationName: locations?.find((l) => l.id === h.meeting_location_id)?.name, meetAt: h.meet_at, note: h.meeting_note }}
            deskNote={h.desk_note} mineConfirmed={mineConfirmed} otherConfirmed={otherConfirmed} deadlinePassed={new Date(h.deadline_at) < new Date()} />
        </CardContent></Card>
        <div><h2 className="mb-2 font-semibold">Anonymous chat</h2>
          <HandoverChat handoverId={id} me={ctx.userId} finderId={h.finder_id} locked={role === 'admin' || h.status === 'COMPLETED'} /></div>
      </div>
    </div>
  );
}
