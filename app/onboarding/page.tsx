import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createOrg, joinOrg } from '@/lib/actions/admin';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ORG_TYPES } from '@/lib/constants';

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { count } = await supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  if (count) redirect('/dashboard');
  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <div className="mx-auto max-w-3xl pt-10">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <h1 className="text-center text-2xl font-semibold">Set up your organization</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">Join an existing one with a code, or create one and become its admin.</p>
        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Join with a code</CardTitle></CardHeader><CardContent>
            <form action={joinOrg} className="space-y-4"><Field label="Join code" hint="Try DEMO2026 for the demo college"><Input name="code" required placeholder="DEMO2026" className="uppercase" /></Field>
              <Button className="w-full" variant="accent">Join organization</Button></form></CardContent></Card>
          <Card><CardHeader><CardTitle>Create organization</CardTitle></CardHeader><CardContent>
            <form action={createOrg} className="space-y-4"><Field label="Name"><Input name="name" required minLength={2} /></Field>
              <Field label="Type"><Select name="type" defaultValue="college">{ORG_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}</Select></Field>
              <Button className="w-full">Create as admin</Button></form></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
