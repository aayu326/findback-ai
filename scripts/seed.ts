/* Seeds demo users, reports and runs REAL AI enrichment + matching.  Run: npm run seed */
import { createAdminClient } from '../lib/supabase/admin';
import { enrichAndMatch } from '../lib/matching/pipeline';

const ORG = '11111111-1111-1111-1111-111111111111';
const db = createAdminClient();
const PASSWORD = 'Demo@12345';

async function user(email: string, name: string, role: 'admin' | 'member') {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  let u = list?.users.find((x) => x.email === email);
  if (!u) {
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
    if (error) throw error; u = data.user;
  }
  await db.from('profiles').upsert({ id: u.id, full_name: name });
  await db.from('organization_members').upsert({ org_id: ORG, user_id: u.id, role }, { onConflict: 'org_id,user_id' });
  return u.id;
}
const ago = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

async function main() {
  const { data: org } = await db.from('organizations').select('id').eq('id', ORG).maybeSingle();
  if (!org) throw new Error('Run supabase/seed.sql first (demo organization + locations).');
  const { data: locs } = await db.from('locations').select('id,name').eq('org_id', ORG);
  const L = (n: string) => locs?.find((l) => l.name === n)?.id;
  const admin = await user('admin@findback.demo', 'Dr. Meera Iyer (Admin)', 'admin');
  const arjun = await user('arjun@findback.demo', 'Arjun Mehta', 'member');
  const sara = await user('sara@findback.demo', 'Sara Khan', 'member');
  const ravi = await user('ravi@findback.demo', 'Ravi Patel', 'member');
  void admin;

  await db.from('lost_items').delete().eq('org_id', ORG); await db.from('found_items').delete().eq('org_id', ORG);
  const base = { org_id: ORG };
  const lost = [
    { reporter_id: arjun, title: 'Black leather wallet', category: 'Wallet', color: 'black', brand: 'Tommy Hilfiger', description: 'Bi-fold black leather wallet with a worn corner, contains cards and some cash.', location_id: L('Central Library'), location_text: '2nd floor reading hall', occurred_at: ago(30), distinctive_features: 'Small scratch near the logo', priv: 'Contains student ID of Arjun Mehta, SBI debit card ending 4421.' },
    { reporter_id: sara, title: 'Apple AirPods Pro case', category: 'Earphones', color: 'white', brand: 'Apple', model: 'AirPods Pro 2', description: 'White AirPods Pro charging case with a pink silicone cover.', location_id: L('Cafeteria'), occurred_at: ago(52), distinctive_features: 'Pink cover, tiny crack on lid', priv: 'Serial ends with Q7XK. Engraved "S.K." on case.' },
    { reporter_id: ravi, title: 'Blue water bottle', category: 'Bottle', color: 'blue', brand: 'Milton', description: 'Blue steel insulated bottle, 1 litre, dented at the bottom.', location_id: L('Sports Complex'), occurred_at: ago(20), distinctive_features: 'Dent at base, football sticker', priv: 'Name "RAVI" written in marker under the lid.' },
    { reporter_id: arjun, title: 'Laptop charger', category: 'Laptop & Accessories', color: 'white', brand: 'Dell', description: '65W Dell laptop charger with USB-C tip.', location_id: L('Engineering Block'), occurred_at: ago(70), distinctive_features: 'Cable wrapped with red tape', priv: '' },
    { reporter_id: sara, title: 'Student ID card', category: 'ID & Cards', color: 'white', description: 'Northfield University student ID in a clear holder.', location_id: L('Hostel A'), occurred_at: ago(10), distinctive_features: 'Green lanyard', priv: 'Roll no. NU2023CS117, name Sara Khan.' },
  ];
  const found = [
    { reporter_id: ravi, title: 'Wallet found near library desks', category: 'Wallet', color: 'black', brand: 'Tommy Hilfiger', description: 'Black leather bi-fold wallet found on a study desk. Slightly worn on one corner.', location_id: L('Central Library'), location_text: 'Reading hall, 2nd floor', occurred_at: ago(26), storage_note: 'Handed to library help desk', priv: 'Has a student ID card and an SBI debit card inside; name begins with "Arj".' },
    { reporter_id: arjun, title: 'AirPods case with pink cover', category: 'Earphones', color: 'white', brand: 'Apple', description: 'White earbuds case with a pink silicone cover, small crack on the lid.', location_id: L('Cafeteria'), occurred_at: ago(48), storage_note: 'Cafeteria counter', priv: 'Initials engraved on the back.' },
    { reporter_id: sara, title: 'Insulated bottle, blue', category: 'Bottle', color: 'blue', brand: 'Milton', description: 'Blue steel water bottle with a football sticker, dented base.', location_id: L('Sports Complex'), occurred_at: ago(18), storage_note: 'Security desk', priv: 'Name written under the lid.' },
    { reporter_id: ravi, title: 'Black backpack', category: 'Bag', color: 'black', brand: 'Wildcraft', description: 'Black 30L backpack with a keychain, contains notebooks.', location_id: L('Engineering Block'), occurred_at: ago(40), storage_note: 'Department office', priv: 'Contains a physics notebook with a name on first page.' },
    { reporter_id: arjun, title: 'University ID on green lanyard', category: 'ID & Cards', color: 'white', description: 'Student ID card found in the hostel corridor.', location_id: L('Hostel A'), occurred_at: ago(8), storage_note: 'Hostel warden office', priv: 'Roll number visible on the card.' },
  ];
  const ids: ['lost' | 'found', string][] = [];
  for (const [kind, rows] of [['lost', lost], ['found', found]] as const) {
    for (const r of rows) {
      const { priv, ...row } = r as typeof r & { priv: string };
      const { data, error } = await db.from(kind === 'lost' ? 'lost_items' : 'found_items').insert({ ...base, ...row }).select('id').single();
      if (error) throw error;
      if (priv) await db.from('item_private_details').insert({ org_id: ORG, item_type: kind, item_id: data.id, owner_id: row.reporter_id, details: priv });
      ids.push([kind, data.id]);
    }
  }
  for (const [k, id] of ids) { await enrichAndMatch(k, id); console.log('processed', k, id); }
  console.log('\nDemo ready. Logins (password', PASSWORD + '):\n  admin@findback.demo\n  arjun@findback.demo\n  sara@findback.demo\n  ravi@findback.demo\nOrg join code: DEMO2026');
}
main().catch((e) => { console.error(e); process.exit(1); });
