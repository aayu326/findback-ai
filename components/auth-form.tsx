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
  const [googleLoading, setGoogleLoading] = useState(false);

  const schema =
    mode === 'signup'
      ? authSchema.required({ full_name: true })
      : authSchema.omit({ full_name: true });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<V>({
    resolver: zodResolver(schema) as never,
  });

  async function handleGoogleSignIn() {
    setMsg(null);
    setGoogleLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      setMsg({ t: 'err', s: error.message });
    }
  }

  async function onSubmit(v: V) {
    setMsg(null);

    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: v.email,
        password: v.password,
      });

      if (error) return setMsg({ t: 'err', s: error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          data: { full_name: v.full_name },
          emailRedirectTo: `${location.origin}/dashboard`,
        },
      });

      if (error) return setMsg({ t: 'err', s: error.message });

      if (!data.session) {
        return setMsg({
          t: 'ok',
          s: 'Check your email to confirm your account, then log in.',
        });
      }
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || isSubmitting}
        className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.27c0-.68-.06-1.34-.17-1.97H12v3.73h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.13Z"
          />
          <path
            fill="#34A853"
            d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.04H3.28v2.52A9.74 9.74 0 0 0 12 21.67Z"
          />
          <path
            fill="#FBBC05"
            d="M6.53 13.75A5.85 5.85 0 0 1 6.22 12c0-.61.11-1.2.31-1.75V7.73H3.28A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.03 4.27l3.25-2.52Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.21c1.43 0 2.72.49 3.73 1.45l2.79-2.79C16.83 3.22 14.63 2.33 12 2.33a9.74 9.74 0 0 0-8.72 5.4l3.25 2.52C7.3 7.93 9.46 6.21 12 6.21Z"
          />
        </svg>

        {googleLoading ? 'Connecting…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {mode === 'signup' && (
        <Field
          label="Full name"
          error={errors.full_name?.message}
        >
          <Input
            {...register('full_name')}
            autoComplete="name"
          />
        </Field>
      )}

      <Field label="Email" error={errors.email?.message}>
        <Input
          type="email"
          {...register('email')}
          autoComplete="email"
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <Input
          type="password"
          {...register('password')}
          autoComplete={
            mode === 'login' ? 'current-password' : 'new-password'
          }
        />
      </Field>

      {msg && (
        <p
          className={`rounded-md p-3 text-sm ${
            msg.t === 'err'
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {msg.s}
        </p>
      )}

      <Button
        className="w-full"
        variant="accent"
        disabled={isSubmitting || googleLoading}
      >
        {isSubmitting
          ? 'Please wait…'
          : mode === 'login'
            ? 'Log in'
            : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <Link className="text-accent" href="/signup">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already registered?{' '}
            <Link className="text-accent" href="/login">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}