import { getCtx, imageUrls } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell';
import { ItemCard, Empty, type CardItem } from '@/components/item-card';

export default async function MyItems() {
  const ctx = await getCtx();
  const s = await createClient();
  const sel = 'id,title,category,color,status,occurred_at,location_text,location:locations(name)';
  const [lost, found] = await Promise.all([
    s.from('lost_items').select(sel).eq('reporter_id', ctx.userId).order('created_at', { ascending: false }),
    s.from('found_items').select(sel).eq('reporter_id', ctx.userId).order('created_at', { ascending: false }),
  ]);
  const imgs = await imageUrls([...(lost.data ?? []), ...(found.data ?? [])].map((i) => i.id));
  const L = (lost.data ?? []) as unknown as CardItem[]; const F = (found.data ?? []) as unknown as CardItem[];
  return (
    <>
      <PageHeader title="My reports" sub="Lost and found reports you submitted." />
      <h2 className="mb-3 font-semibold">My Lost Items</h2>
      <div className="grid gap-3 md:grid-cols-2">{L.length ? L.map((i) => <ItemCard key={i.id} item={i} kind="lost" img={imgs[`lost:${i.id}`]} />) : <Empty>No lost reports.</Empty>}</div>
      <h2 className="mb-3 mt-8 font-semibold">My Found Items</h2>
      <div className="grid gap-3 md:grid-cols-2">{F.length ? F.map((i) => <ItemCard key={i.id} item={i} kind="found" img={imgs[`found:${i.id}`]} />) : <Empty>No found reports.</Empty>}</div>
    </>
  );
}
