-- Field mapping: the app stores the boundary a farmer walked or drew as GeoJSON, which it can read
-- back offline. The PostGIS boundary column is derived from it so it can be used in spatial queries.

alter table public.fields add column boundary_geojson jsonb;

create function public.set_field_boundary() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.boundary := case
    when new.boundary_geojson is null then null
    else extensions.st_geomfromgeojson(new.boundary_geojson::text)::extensions.geography
  end;
  return new;
end $$;

create trigger fields_set_boundary before insert or update on public.fields
  for each row execute function public.set_field_boundary();
