import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { setMemberRole } from '@/lib/actions/admin';
import { PageHeader } from '@/components/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDay } from '@/lib/utils';

export default async function AdminUsers() {
  const ctx = await requireAdmin();
  const s = await createClient();
  const { data: members } = await s.from('organization_members').select('id,user_id,role,created_at').eq('org_id', ctx.orgId).order('created_at');
  const { data: profiles } = await s.from('profiles').select('id,full_name,phone').in('id', (members ?? []).map((m) => m.user_id));
  return (<>
    <PageHeader title="Members" sub={`Share join code ${ctx.joinCode} to add people.`} />
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm">
      <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Name</th><th>Role</th><th>Joined</th><th /></tr></thead>
      <tbody className="divide-y">{members?.map((m) => (<tr key={m.id}><td className="p-3 font-medium">{profiles?.find((p) => p.id === m.user_id)?.full_name || 'Unnamed'}</td>
        <td><Badge tone={m.role === 'admin' ? 'navy' : 'gray'}>{m.role}</Badge></td><td>{fmtDay(m.created_at)}</td>
        <td className="pr-3 text-right">{m.user_id !== ctx.userId && <form action={setMemberRole}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="role" value={m.role === 'admin' ? 'member' : 'admin'} />
          <Button size="sm" variant="outline">{m.role === 'admin' ? 'Make member' : 'Make admin'}</Button></form>}</td></tr>))}</tbody></table></div></>);
}
