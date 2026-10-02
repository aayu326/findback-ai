import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { ItemCard, Empty, type CardItem } from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { CATEGORIES } from '@/lib/constants';

export default async function FoundList({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams;
  await getCtx();
  const s = await createClient();
  let query = s.from('found_items').select('id,title,category,color,status,occurred_at,location_text,location:locations(name)').eq('status', 'open').order('created_at', { ascending: false }).limit(60);
  if (q) query = query.ilike('title', `%${q.replace(/[%,]/g, '')}%`);
  if (category) query = query.eq('category', category);
  const { data } = await query;
  const imgs = await imageUrls((data ?? []).map((i) => i.id));
  return (
    <>
      <PageHeader title="Found items" sub="Items reported found in your organization. Only limited, non-sensitive info is shown." />
      <form className="mb-5 flex flex-col gap-2 sm:flex-row"><Input name="q" defaultValue={q} placeholder="Search by name…" />
        <Select name="category" defaultValue={category ?? ''} className="sm:w-56"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select><Button>Filter</Button></form>
      <div className="grid gap-3 md:grid-cols-2">{data?.length ? (data as unknown as CardItem[]).map((i) => <ItemCard key={i.id} item={i} kind="found" img={imgs[`found:${i.id}`]} href={`/found/${i.id}`} />) : <Empty>No found items match.</Empty>}</div>
    </>
  );
}
