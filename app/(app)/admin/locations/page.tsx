import { Trash2 } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { addLocation, deleteLocation } from '@/lib/actions/admin';
import { PageHeader } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Card } from '@/components/ui/card';

export default async function AdminLocations() {
  const ctx = await requireAdmin();
  const s = await createClient();
  const { data } = await s.from('locations').select('*').eq('org_id', ctx.orgId).order('name');
  return (<>
    <PageHeader title="Locations" sub="Places members can pick when reporting items." />
    <form action={addLocation} className="mb-5 flex flex-col gap-2 sm:flex-row"><Input name="name" required placeholder="Location name" /><Input name="description" placeholder="Description (optional)" /><Button variant="accent">Add</Button></form>
    <div className="grid gap-3 md:grid-cols-2">{data?.map((l) => (<Card key={l.id} className="flex items-center justify-between p-4"><div><p className="font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.description}</p></div>
      <form action={deleteLocation}><input type="hidden" name="id" value={l.id} /><Button size="sm" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></form></Card>))}</div></>);
}
