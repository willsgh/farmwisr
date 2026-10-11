-- Checks that a farm's records are visible only to its owner.
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
grant usage on schema public, auth, extensions to authenticated;
grant all on all tables in schema public to authenticated;

set role authenticated;
set request.uid = '00000000-0000-0000-0000-000000000001';
insert into public.farms (name) values ('Test farm');
insert into public.fields (farm_id, name, area_hectares) select id, 'North plot', 2 from public.farms;
insert into public.crop_seasons (field_id, crop, start_date) select id, 'maize', '2026-04-01' from public.fields;
insert into public.activities (season_id, stage, type, activity_date) select id, 'land_preparation', 'ploughing', '2026-04-02' from public.crop_seasons;
insert into public.activity_costs (activity_id, category, amount_minor) select id, 'equipment', 30000 from public.activities;
insert into public.activity_costs (activity_id, category, amount_minor) select id, 'labour', 10000 from public.activities;

do $$ begin
  assert (select total_cost_minor from public.season_summaries) = 40000, 'season total should be 40000';
  assert (select cost_per_hectare_minor from public.season_summaries) = 20000, 'cost per hectare should be 20000';
end $$;

set request.uid = '00000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) from public.farms) = 0, 'another user must not see the farm';
  assert (select count(*) from public.activities) = 0, 'another user must not see activities';
  assert (select count(*) from public.season_summaries) = 0, 'another user must not see summaries';
end $$;
