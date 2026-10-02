'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { claimSchema, type ClaimInput } from '@/lib/validation/schemas';
import { submitClaim } from '@/lib/actions/claims';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';

export function ClaimForm({ foundId, lostId, matchId }: { foundId: string; lostId?: string; matchId?: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ error?: string; ok?: boolean }>({});
  const { register, handleSubmit, formState: { errors } } = useForm<ClaimInput>({
    resolver: zodResolver(claimSchema), defaultValues: { found_item_id: foundId, lost_item_id: lostId ?? '', match_id: matchId ?? '' },
  });
  if (state.ok) return <p className="flex items-center gap-2 rounded-md bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Claim submitted. An admin will review it — you&apos;ll be notified.</p>;
  return (
    <form onSubmit={handleSubmit((v) => start(async () => setState(await submitClaim(v))))} className="space-y-4">
      <p className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Prove ownership with details only the owner would know. Answers are visible only to admins.</p>
      <Field label="Describe the item (don't copy the listing)" error={errors.describe?.message}><Textarea {...register('describe')} placeholder="Contents, marks, wear, accessories, lock-screen…" /></Field>
      <Field label="Identifiers (optional)" hint="Serial / IMEI / ID name / card last digits — shared with admins only"><Input {...register('identifiers')} /></Field>
      <Field label="When and where did you lose it?" error={errors.lost_when_where?.message}><Input {...register('lost_when_where')} /></Field>
      <Field label="Note to admin (optional)"><Textarea {...register('message')} className="min-h-[60px]" /></Field>
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button variant="accent" disabled={pending}>{pending ? 'Submitting…' : 'Submit ownership claim'}</Button>
    </form>
  );
}
