'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reviewClaim } from '@/lib/actions/claims';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form';

export function ClaimActions({ claimId, status }: { claimId: string; status: string }) {
  const [note, setNote] = useState(''); const [err, setErr] = useState(''); const [pending, start] = useTransition(); const router = useRouter();
  const act = (d: 'APPROVED' | 'REJECTED' | 'RETURNED') => start(async () => { const r = await reviewClaim(claimId, d, note); if (r?.error) setErr(r.error); else router.refresh(); });
  if (status === 'REJECTED' || status === 'RETURNED') return null;
  return (<div className="space-y-2 border-t pt-3">
    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to claimant (required when rejecting)" className="min-h-[56px]" />
    {err && <p className="text-xs text-red-600">{err}</p>}
    <div className="flex flex-wrap gap-2">
      {status === 'PENDING' && <><Button size="sm" variant="accent" disabled={pending} onClick={() => act('APPROVED')}>Approve ownership</Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={() => act('REJECTED')}>Reject</Button></>}
      {status === 'APPROVED' && <Button size="sm" disabled={pending} onClick={() => act('RETURNED')}>Mark as returned</Button>}
    </div></div>);
}
