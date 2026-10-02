-- Row Level Security. Membership helpers are SECURITY DEFINER to avoid policy recursion.
create or replace function is_org_member(o uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where org_id = o and user_id = auth.uid()) $$;
create or replace function is_org_admin(o uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where org_id = o and user_id = auth.uid() and role = 'admin') $$;

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table locations enable row level security;
alter table lost_items enable row level security;
alter table found_items enable row level security;
alter table item_private_details enable row level security;
alter table item_images enable row level security;
alter table item_embeddings enable row level security;   -- no policies: service role only
alter table matches enable row level security;
alter table claims enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- profiles: own row, or admins of an org the person belongs to (needed to contact claimants)
create policy profiles_select on profiles for select using (
  id = auth.uid() or exists (
    select 1 from organization_members a join organization_members m on m.org_id = a.org_id
    where a.user_id = auth.uid() and a.role = 'admin' and m.user_id = profiles.id));
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy org_select on organizations for select using (is_org_member(id));
create policy org_update on organizations for update using (is_org_admin(id));

create policy members_select on organization_members for select using (is_org_member(org_id));
create policy members_update on organization_members for update using (is_org_admin(org_id) and user_id <> auth.uid());
create policy members_delete on organization_members for delete using (is_org_admin(org_id) or user_id = auth.uid());

create policy loc_select on locations for select using (is_org_member(org_id));
create policy loc_admin on locations for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

-- Lost reports are private to the reporter + org admins
create policy lost_select on lost_items for select using (reporter_id = auth.uid() or is_org_admin(org_id));
create policy lost_insert on lost_items for insert with check (reporter_id = auth.uid() and is_org_member(org_id));
create policy lost_update on lost_items for update using (reporter_id = auth.uid() or is_org_admin(org_id));
create policy lost_delete on lost_items for delete using (reporter_id = auth.uid() or is_org_admin(org_id));

-- Found reports: limited, non-sensitive fields visible to org members (sensitive data lives in item_private_details)
create policy found_select on found_items for select using (is_org_member(org_id));
create policy found_insert on found_items for insert with check (reporter_id = auth.uid() and is_org_member(org_id));
create policy found_update on found_items for update using (reporter_id = auth.uid() or is_org_admin(org_id));
create policy found_delete on found_items for delete using (reporter_id = auth.uid() or is_org_admin(org_id));

create policy priv_select on item_private_details for select using (owner_id = auth.uid() or is_org_admin(org_id));
create policy priv_insert on item_private_details for insert with check (owner_id = auth.uid() and is_org_member(org_id));
create policy priv_update on item_private_details for update using (owner_id = auth.uid());

create policy img_select on item_images for select using (
  owner_id = auth.uid() or is_org_admin(org_id) or (item_type = 'found' and is_org_member(org_id)));
create policy img_insert on item_images for insert with check (owner_id = auth.uid() and is_org_member(org_id));
create policy img_delete on item_images for delete using (owner_id = auth.uid() or is_org_admin(org_id));

create policy matches_select on matches for select using (
  auth.uid() in (lost_owner_id, found_owner_id) or is_org_admin(org_id));
create policy matches_update on matches for update using (lost_owner_id = auth.uid() or is_org_admin(org_id));

-- Claims: claimant + admins only. Only admins can change status; AI never touches this table.
create policy claims_select on claims for select using (claimant_id = auth.uid() or is_org_admin(org_id));
create policy claims_insert on claims for insert with check (
  claimant_id = auth.uid() and is_org_member(org_id) and status = 'PENDING');
create policy claims_update on claims for update using (is_org_admin(org_id));

create policy notif_select on notifications for select using (user_id = auth.uid());
create policy notif_update on notifications for update using (user_id = auth.uid());

create policy audit_select on audit_logs for select using (is_org_admin(org_id));

-- Onboarding RPCs
create or replace function create_organization(p_name text, p_type text) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations (name, type, created_by) values (trim(p_name), p_type, auth.uid()) returning id into oid;
  insert into organization_members (org_id, user_id, role) values (oid, auth.uid(), 'admin');
  insert into audit_logs (org_id, actor_id, action, entity_type, entity_id) values (oid, auth.uid(), 'organization.created', 'organization', oid);
  return oid;
end $$;

create or replace function join_organization(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into oid from organizations where join_code = upper(trim(p_code));
  if oid is null then raise exception 'Invalid join code'; end if;
  insert into organization_members (org_id, user_id) values (oid, auth.uid()) on conflict do nothing;
  insert into audit_logs (org_id, actor_id, action, entity_type, entity_id) values (oid, auth.uid(), 'member.joined', 'organization', oid);
  return oid;
end $$;
grant execute on function create_organization(text, text), join_organization(text) to authenticated;

-- Storage: private bucket, path = {org_id}/{user_id}/{file}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "item images upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'item-images' and (storage.foldername(name))[2] = auth.uid()::text
  and is_org_member(((storage.foldername(name))[1])::uuid));
create policy "item images read" on storage.objects for select to authenticated using (
  bucket_id = 'item-images' and exists (select 1 from item_images i where i.storage_path = name));
create policy "item images delete" on storage.objects for delete to authenticated using (
  bucket_id = 'item-images' and (storage.foldername(name))[2] = auth.uid()::text);
