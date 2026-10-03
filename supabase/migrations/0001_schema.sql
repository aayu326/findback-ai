-- Reclaimo core schema
create extension if not exists vector;
create extension if not exists pgcrypto;

create type org_role as enum ('admin', 'member');
create type item_status as enum ('open', 'matched', 'returned', 'closed');
create type claim_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED');
create type match_status as enum ('suggested', 'dismissed', 'claimed', 'confirmed');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,                       -- private: visible only to owner and org admins
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'college' check (type in ('college','corporate','hostel','hospital','mall','other')),
  join_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on organization_members (user_id);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table lost_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  color text,
  brand text,
  model text,
  location_id uuid references locations(id) on delete set null,
  location_text text,
  occurred_at timestamptz not null,
  distinctive_features text,
  keywords text[] not null default '{}',
  ai_analysis jsonb,
  ai_status text not null default 'pending' check (ai_status in ('pending','done','failed','skipped')),
  status item_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on lost_items (org_id, status, created_at desc);
create index on lost_items (reporter_id);
create trigger lost_items_upd before update on lost_items for each row execute function set_updated_at();

create table found_items (like lost_items including defaults including constraints);
alter table found_items add primary key (id);
alter table found_items add foreign key (org_id) references organizations(id) on delete cascade;
alter table found_items add foreign key (reporter_id) references auth.users(id) on delete cascade;
alter table found_items add foreign key (location_id) references locations(id) on delete set null;
alter table found_items add column storage_note text;  -- e.g. "Handed to security desk"
create index on found_items (org_id, status, created_at desc);
create index on found_items (reporter_id);
create trigger found_items_upd before update on found_items for each row execute function set_updated_at();

-- Sensitive identifiers (IDs, IMEI/serial, wallet contents...). Never public, never sent to AI.
create table item_private_details (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  item_type text not null check (item_type in ('lost','found')),
  item_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  details text not null,
  created_at timestamptz not null default now(),
  unique (item_type, item_id)
);

create table item_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  item_type text not null check (item_type in ('lost','found')),
  item_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create index on item_images (item_type, item_id);

create table item_embeddings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  item_type text not null check (item_type in ('lost','found')),
  item_id uuid not null,
  embedding vector(768) not null,
  model text,
  created_at timestamptz not null default now(),
  unique (item_type, item_id)
);
create index on item_embeddings using hnsw (embedding vector_cosine_ops);
create index on item_embeddings (org_id, item_type);

create table matches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  lost_item_id uuid not null references lost_items(id) on delete cascade,
  found_item_id uuid not null references found_items(id) on delete cascade,
  lost_owner_id uuid not null references auth.users(id) on delete cascade,
  found_owner_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2) not null,            -- 0-100 similarity signal, NOT proof of ownership
  vector_score numeric(5,4),
  components jsonb not null default '{}',
  reasons text[] not null default '{}',
  explanation text,
  status match_status not null default 'suggested',
  created_at timestamptz not null default now(),
  unique (lost_item_id, found_item_id)
);
create index on matches (org_id, score desc);
create index on matches (lost_owner_id);
create index on matches (found_owner_id);

create table claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  found_item_id uuid not null references found_items(id) on delete cascade,
  lost_item_id uuid references lost_items(id) on delete set null,
  match_id uuid references matches(id) on delete set null,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}',     -- private verification answers
  message text,
  status claim_status not null default 'PENDING',
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on claims (org_id, status, created_at desc);
create index on claims (claimant_id);
create index on claims (found_item_id);
create trigger claims_upd before update on claims for each row execute function set_updated_at();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, read, created_at desc);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on audit_logs (org_id, created_at desc);

-- New auth user -> profile
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Similar-item candidates by cosine similarity (server/service role only)
create or replace function match_candidates(p_type text, p_item uuid, p_limit int default 100)
returns table (candidate_id uuid, similarity float) language sql stable as $$
  with src as (select embedding, org_id from item_embeddings where item_type = p_type and item_id = p_item)
  select e.item_id, 1 - (e.embedding <=> src.embedding)
  from item_embeddings e, src
  where e.org_id = src.org_id and e.item_type = case p_type when 'lost' then 'found' else 'lost' end
  order by e.embedding <=> src.embedding limit p_limit
$$;
revoke execute on function match_candidates(text, uuid, int) from public, anon, authenticated;
grant execute on function match_candidates(text, uuid, int) to service_role;
