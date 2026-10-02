'use client';
import { useState, useTransition } from 'react';
import { CheckCircle2, Circle, MapPin, Clock, HandHeart } from 'lucide-react';
import { confirmHandover, deskFallback, proposeMeeting } from '@/lib/actions/handover';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/form';
import { fmtDate } from '@/lib/utils';

type Props = {
  id: string; role: 'finder' | 'claimant' | 'admin'; status: string; locations: { id: string; name: string }[];
  meeting: { locationId: string | null; locationName?: string; meetAt: string | null; note: string | null };
  deskNote: string | null; mineConfirmed: boolean; otherConfirmed: boolean; deadlinePassed: boolean;
};
export function HandoverPanel(p: Props) {
  const [pending, start] = useTransition(); const [err, setErr] = useState('');
  const [loc, setLoc] = useState(p.meeting.locationId ?? ''); const [at, setAt] = useState(''); const [note, setNote] = useState(p.meeting.note ?? '');
  const [desk, setDesk] = useState('');
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { setErr(''); const r = await fn(); if (r.error) setErr(r.error); });
  const done = p.status === 'COMPLETED'; const party = p.role !== 'admin';
  const steps = [
    ['Claim verified by admin', true],
    ['Meeting point agreed', p.status === 'SCHEDULED' || p.status === 'DESK' || done],
    ['Both confirm handover', done],
  ] as const;
  return (
    <div className="space-y-5">
      <ol className="space-y-2">{steps.map(([t, ok]) => (<li key={t} className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}<span className={ok ? '' : 'text-muted-foreground'}>{t}</span></li>))}</ol>

      {(p.meeting.meetAt && p.status !== 'DESK') && <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /><b>{p.meeting.locationName ?? 'Meeting point'}</b></p>
        <p className="mt-1 flex items-center gap-2"><Clock className="h-4 w-4" />{fmtDate(p.meeting.meetAt)}</p>{p.meeting.note && <p className="mt-1">{p.meeting.note}</p>}</div>}
      {p.status === 'DESK' && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"><b>Item left at:</b> {p.deskNote}. The owner should collect it with ID and then confirm receipt.</div>}

      {party && !done && p.status !== 'DESK' && (<div className="space-y-2 rounded-lg border p-4">
        <p className="text-sm font-medium">{p.meeting.meetAt ? 'Change meeting' : 'Propose a meeting'} <span className="font-normal text-muted-foreground">— use a public place on campus</span></p>
        <Select value={loc} onChange={(e) => setLoc(e.target.value)}><option value="">Choose meeting point…</option>{p.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
        <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (e.g. near the main gate)" className="min-h-[56px]" />
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => proposeMeeting(p.id, { location_id: loc, meet_at: at, note }))}>Send proposal</Button></div>)}

      {party && !done && (<div className="space-y-2">
        <Button className="w-full" variant="accent" disabled={pending || p.mineConfirmed} onClick={() => run(() => confirmHandover(p.id))}>
          <HandHeart className="h-4 w-4" />{p.mineConfirmed ? 'You confirmed — waiting for the other person' : p.role === 'finder' ? 'I handed over the item' : 'I received my item'}</Button>
        {p.otherConfirmed && !p.mineConfirmed && <p className="text-xs text-amber-700">The other person already confirmed. Confirm if it is true.</p>}
      </div>)}

      {p.role === 'finder' && !done && p.status !== 'DESK' && (<div className="space-y-2 rounded-lg border border-dashed p-4">
        <p className="text-sm font-medium">Can&apos;t meet?</p>
        {p.deadlinePassed && <p className="text-xs text-amber-700">The 3-day window has passed. Please leave the item at a desk.</p>}
        <Input value={desk} onChange={(e) => setDesk(e.target.value)} placeholder="Where did you leave it? e.g. Security desk" />
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => deskFallback(p.id, desk))}>I left it at a desk</Button></div>)}
      {p.status === 'DESK' && p.role === 'claimant' && !done && null}
      {done && <p className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Handover completed. Item marked as returned.</p>}
      {err && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{err}</p>}
    </div>
  );
}
