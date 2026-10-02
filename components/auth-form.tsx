'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';

type V = z.infer<typeof authSchema>;
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/dashboard';
  const [msg, setMsg] = useState<{ t: 'err' | 'ok'; s: string } | null>(null);
  const schema = mode === 'signup' ? authSchema.required({ full_name: true }) : authSchema.omit({ full_name: true });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<V>({ resolver: zodResolver(schema) as never });

  async function onSubmit(v: V) {
    setMsg(null);
    const supabase = createClient();
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) return setMsg({ t: 'err', s: error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: v.email, password: v.password,
        options: { data: { full_name: v.full_name }, emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) return setMsg({ t: 'err', s: error.message });
      if (!data.session) return setMsg({ t: 'ok', s: 'Check your email to confirm your account, then log in.' });
    }
    router.push(next); router.refresh();
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mode === 'signup' && <Field label="Full name" error={errors.full_name?.message}><Input {...register('full_name')} autoComplete="name" /></Field>}
      <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} autoComplete="email" /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" {...register('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
      {msg && <p className={`rounded-md p-3 text-sm ${msg.t === 'err' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg.s}</p>}
      <Button className="w-full" variant="accent" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? <>New here? <Link className="text-accent" href="/signup">Create an account</Link></> : <>Already registered? <Link className="text-accent" href="/login">Log in</Link></>}
      </p>
    </form>
  );
}
