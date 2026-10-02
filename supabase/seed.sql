-- Demo organization + locations (users & reports are created by `npm run seed`)
insert into organizations (id, name, type, join_code)
values ('11111111-1111-1111-1111-111111111111', 'Northfield University', 'college', 'DEMO2026')
on conflict (id) do nothing;
insert into locations (org_id, name, description) values
 ('11111111-1111-1111-1111-111111111111', 'Central Library', 'Main reading hall & stacks'),
 ('11111111-1111-1111-1111-111111111111', 'Cafeteria', 'Student cafeteria'),
 ('11111111-1111-1111-1111-111111111111', 'Engineering Block', 'Labs & lecture halls'),
 ('11111111-1111-1111-1111-111111111111', 'Hostel A', 'Boys hostel'),
 ('11111111-1111-1111-1111-111111111111', 'Sports Complex', 'Gym & grounds')
on conflict do nothing;
