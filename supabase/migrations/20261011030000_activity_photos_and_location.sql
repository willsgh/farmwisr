-- Photos and GPS on activities.

-- Where an activity was logged. The app sends latitude and longitude, which it can read back offline;
-- the PostGIS location column is derived from them for spatial queries.
alter table public.activities
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column location_accuracy_m real check (location_accuracy_m >= 0),
  add constraint activities_lat_lng_together check ((latitude is null) = (longitude is null));

create function public.set_activity_location() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.location := case
    when new.latitude is null then null
    else extensions.st_setsrid(extensions.st_makepoint(new.longitude, new.latitude), 4326)::extensions.geography
  end;
  return new;
end $$;

create trigger activities_set_location before insert or update on public.activities
  for each row execute function public.set_activity_location();

-- A photo's record syncs like any other row; the image itself is uploaded to Storage at
-- activity-photos/<activity id>/<photo id>.jpg once the device is online.
create table public.activity_photos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  check (storage_path like activity_id::text || '/%')
);

create index activity_photos_activity_id on public.activity_photos (activity_id);

alter table public.activity_photos enable row level security;
create policy "owners manage their activity photos" on public.activity_photos for all to authenticated
  using (public.owns_activity(activity_id)) with check (public.owns_activity(activity_id));

-- Storage: a private bucket; a user may only read and write images under their own activities.
insert into storage.buckets (id, name, public) values ('activity-photos', 'activity-photos', false)
  on conflict (id) do nothing;

create function public.owns_activity_photo(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.owns_activity(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

create policy "owners read activity photos" on storage.objects for select to authenticated
  using (bucket_id = 'activity-photos' and public.owns_activity_photo(name));
create policy "owners upload activity photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'activity-photos' and public.owns_activity_photo(name));
create policy "owners replace activity photos" on storage.objects for update to authenticated
  using (bucket_id = 'activity-photos' and public.owns_activity_photo(name));
create policy "owners delete activity photos" on storage.objects for delete to authenticated
  using (bucket_id = 'activity-photos' and public.owns_activity_photo(name));
