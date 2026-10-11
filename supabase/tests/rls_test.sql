-- Checks that a farm's records are visible only to its owner.
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
grant usage on schema public, auth, extensions to authenticated;
grant all on all tables in schema public to authenticated;

set role authenticated;
set request.uid = '00000000-0000-0000-0000-000000000001';
insert into public.farms (id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Test farm');
insert into public.sites (farm_id, name, community) select id, 'Ejura site', 'Ejura' from public.farms;
insert into public.fields (site_id, name, area_hectares) select id, 'North plot', 2 from public.sites;
insert into public.crop_seasons (field_id, crop, start_date) select id, 'maize', '2026-04-01' from public.fields;
insert into public.activities (season_id, stage, type, activity_date) select id, 'land_preparation', 'ploughing', '2026-04-02' from public.crop_seasons;
insert into public.activity_costs (activity_id, category, amount_minor) select id, 'equipment', 30000 from public.activities;
insert into public.activity_costs (activity_id, category, amount_minor) select id, 'labour', 10000 from public.activities;

-- The app retries queued offline changes as upserts on id; a retry must succeed and not duplicate.
insert into public.sites (id, farm_id, name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Retry site')
  on conflict (id) do update set name = excluded.name;
insert into public.sites (id, farm_id, name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Retry site')
  on conflict (id) do update set name = excluded.name;

do $$ begin
  assert (select count(*) from public.sites where name = 'Retry site') = 1, 'a retried upsert must not duplicate';
  assert (select total_cost_minor from public.season_summaries) = 40000, 'season total should be 40000';
  assert (select cost_per_hectare_minor from public.season_summaries) = 20000, 'cost per hectare should be 20000';
end $$;

-- Mapping a field: the app upserts the whole row with the boundary as GeoJSON; PostGIS derives the shape.
insert into public.fields (id, site_id, name, area_hectares, boundary_geojson)
  select 'cccccccc-0000-0000-0000-000000000001', id, 'Mapped plot', 1.14327,
    '{"type":"Polygon","coordinates":[[[-1.6244,6.6885],[-1.6235,6.6885],[-1.6233,6.6893],[-1.6246,6.6894],[-1.6244,6.6885]]]}'
  from public.sites where name = 'Ejura site'
  on conflict (id) do update set boundary_geojson = excluded.boundary_geojson, area_hectares = excluded.area_hectares;

do $$ begin
  -- The same ring is used in packages/core geo.test.ts, so app and database agree on area.
  assert abs(extensions.st_area((select boundary from public.fields where name = 'Mapped plot')) / 10000 - 1.14327) < 0.0001,
    'PostGIS area of the mapped boundary should be 1.14327 ha';
end $$;

update public.fields set boundary_geojson = null where name = 'Mapped plot';
do $$ begin
  assert (select boundary from public.fields where name = 'Mapped plot') is null, 'clearing the GeoJSON clears the boundary';
end $$;

set request.uid = '00000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) from public.farms) = 0, 'another user must not see the farm';
  assert (select count(*) from public.sites) = 0, 'another user must not see sites';
  assert (select count(*) from public.fields) = 0, 'another user must not see fields';
  assert (select count(*) from public.activities) = 0, 'another user must not see activities';
  assert (select count(*) from public.season_summaries) = 0, 'another user must not see summaries';
end $$;

-- Another user cannot add a site to someone else's farm.
do $$ begin
  begin
    insert into public.sites (farm_id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'intruder');
    raise exception 'another user must not add a site to the farm';
  exception when insufficient_privilege then null;
  end;
end $$;
