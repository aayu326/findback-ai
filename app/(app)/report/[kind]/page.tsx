import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ReportForm } from '@/components/report-form';
import { PageHeader } from '@/components/shell';
import { Card, CardContent } from '@/components/ui/card';

export default async function ReportPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== 'lost' && kind !== 'found') notFound();
  await getCtx();
  const supabase = await createClient();
  const { data: locations } = await supabase.from('locations').select('id,name').order('name');
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={kind === 'lost' ? 'Report a lost item' : 'Report a found item'}
        sub={kind === 'lost' ? 'The more detail you add, the better the AI can find it.' : 'Thanks for helping! Share what you found — owners must verify before pickup.'} />
      <Card><CardContent className="p-5 md:p-6"><ReportForm kind={kind} locations={locations ?? []} /></CardContent></Card>
    </div>
  );
}
