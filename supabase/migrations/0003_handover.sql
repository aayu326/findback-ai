-- Handover: anonymous, platform-mediated pickup between finder and verified owner.
create table handovers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  claim_id uuid not null unique references claims(id) on delete cascade,
  found_item_id uuid not null references found_items(id) on delete cascade,
  lost_item_id uuid references lost_items(id) on delete set null,
  finder_id uuid not null references auth.users(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','SCHEDULED','DESK','COMPLETED')),
  meeting_location_id uuid references locations(id) on delete set null,
  meet_at timestamptz,
  meeting_note text,
  desk_note text,
  finder_confirmed_at timestamptz,
  claimant_confirmed_at timestamptz,
  deadline_at timestamptz not null default now() + interval '3 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on handovers (finder_id);
create index on handovers (claimant_id);
create index on handovers (org_id, status);
create trigger handovers_upd before update on handovers for each row execute function set_updated_at();

create table handover_messages (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references handovers(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index on handover_messages (handover_id, created_at);

alter table handovers enable row level security;
alter table handover_messages enable row level security;

-- Only the two parties (and org admins, read-only) see a handover. Writes go through server actions (service role).
create policy handovers_select on handovers for select using (
  auth.uid() in (finder_id, claimant_id) or is_org_admin(org_id));

create policy hmsg_select on handover_messages for select using (
  exists (select 1 from handovers h where h.id = handover_id
          and (auth.uid() in (h.finder_id, h.claimant_id) or is_org_admin(h.org_id))));
create policy hmsg_insert on handover_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from handovers h where h.id = handover_id
          and auth.uid() in (h.finder_id, h.claimant_id) and h.status <> 'COMPLETED'));

-- Backfill: claims already APPROVED before this migration get a handover too.
insert into handovers (org_id, claim_id, found_item_id, lost_item_id, finder_id, claimant_id)
select c.org_id, c.id, c.found_item_id, c.lost_item_id, f.reporter_id, c.claimant_id
from claims c join found_items f on f.id = c.found_item_id
where c.status = 'APPROVED' on conflict (claim_id) do nothing;
