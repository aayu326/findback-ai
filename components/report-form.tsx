'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Lock, Loader2 } from 'lucide-react';
import { reportSchema, type ReportInput, MAX_IMAGE, IMAGE_TYPES } from '@/lib/validation/schemas';
import { CATEGORIES } from '@/lib/constants';
import { submitReport } from '@/lib/actions/reports';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';

export function ReportForm({ kind, locations }: { kind: 'lost' | 'found'; locations: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [serverErr, setServerErr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [fileErr, setFileErr] = useState('');
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  const { register, handleSubmit, formState: { errors } } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema), defaultValues: { occurred_at: now },
  });
  const isLost = kind === 'lost';

  function onFile(f?: File) {
    setFileErr('');
    if (!f) return setFile(null), setPreview('');
    if (!IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE) return setFileErr('Use a JPG/PNG/WebP under 5 MB');
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  const onSubmit = (v: ReportInput) => {
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => val != null && fd.append(k, String(val)));
    if (file) fd.append('image', file);
    setServerErr('');
    start(async () => { const r = await submitReport(kind, fd); if (r?.error) setServerErr(r.error); });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Item name" error={errors.title?.message}><Input {...register('title')} placeholder={isLost ? 'e.g. Black leather wallet' : 'e.g. Wallet found near library'} /></Field>
        <Field label="Category" error={errors.category?.message}>
          <Select {...register('category')} defaultValue=""><option value="" disabled>Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Color"><Input {...register('color')} placeholder="black" /></Field>
        <Field label="Brand"><Input {...register('brand')} placeholder="Apple, Wildcraft…" /></Field>
        <Field label="Model (optional)"><Input {...register('model')} /></Field>
        <Field label={isLost ? 'Date & time lost' : 'Date & time found'} error={errors.occurred_at?.message}><Input type="datetime-local" {...register('occurred_at')} /></Field>
        <Field label={isLost ? 'Where did you lose it?' : 'Where did you find it?'}>
          <Select {...register('location_id')} defaultValue=""><option value="">Other / not listed</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Location details"><Input {...register('location_text')} placeholder="2nd floor, near window desks" /></Field>
      </div>
      <Field label="Description" error={errors.description?.message}><Textarea {...register('description')} placeholder="Size, condition, contents visible from outside…" /></Field>
      <Field label="Distinctive features" hint="Stickers, scratches, engravings, keychains…"><Textarea {...register('distinctive_features')} /></Field>
      {!isLost && <Field label="Where is the item now?"><Input {...register('storage_note')} placeholder="Handed to security desk" /></Field>}
      <div>
        <p className="mb-1.5 text-sm font-medium">Photo</p>
        <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed p-4 hover:bg-muted/50">
          {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="preview" className="h-20 w-20 rounded-md object-cover" />
            : <span className="grid h-20 w-20 place-items-center rounded-md bg-muted"><ImagePlus className="h-6 w-6 text-muted-foreground" /></span>}
          <span className="text-sm text-muted-foreground">{file ? file.name : 'Tap to upload (JPG/PNG/WebP, max 5 MB). AI uses the photo to extract details.'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {fileErr && <p className="mt-1 text-xs text-red-600">{fileErr}</p>}
        {!isLost && <p className="mt-1 text-xs text-muted-foreground">Photos are visible to your organization&apos;s members only. Avoid showing ID numbers.</p>}
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900"><Lock className="h-4 w-4" />Private verification details</p>
        <Textarea {...register('private_details')} placeholder={isLost ? 'Things only the owner knows: contents, ID/serial/IMEI, lock-screen…' : 'Private notes for the admin to verify the owner: contents, ID name, serial…'} />
        <p className="mt-1 text-xs text-blue-900/70">Only you and organization admins can see this. It is never public and never sent to AI.</p>
      </div>
      {serverErr && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverErr}</p>}
      <Button variant="accent" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? 'Saving…' : isLost ? 'Submit lost report' : 'Submit found report'}
      </Button>
    </form>
  );
}
