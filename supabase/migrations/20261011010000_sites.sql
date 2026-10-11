-- Farms have several sites (separate pieces of land, often in different communities); fields belong to a site.

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null,
  community text,
  region text,
  location extensions.geography(Point, 4326),
  created_at timestamptz not null default now()
);

create index on public.sites (farm_id);

-- Move fields under sites. Any existing fields go into one "Main site" per farm.
alter table public.fields add column site_id uuid references public.sites (id) on delete cascade;

insert into public.sites (farm_id, name)
select distinct farm_id, 'Main site' from public.fields;

update public.fields fl set site_id = s.id
from public.sites s
where s.farm_id = fl.farm_id and s.name = 'Main site';

alter table public.fields alter column site_id set not null;
create index on public.fields (site_id);

drop policy "owners manage their fields" on public.fields;
alter table public.fields drop column farm_id;

-- Ownership checks now go farm -> site -> field; season and activity checks reuse owns_field.

create function public.owns_site(target_site uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sites st join public.farms f on f.id = st.farm_id
    where st.id = target_site and f.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_field(target_field uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.fields fl
    join public.sites st on st.id = fl.site_id
    join public.farms f on f.id = st.farm_id
    where fl.id = target_field and f.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_season(target_season uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.crop_seasons s where s.id = target_season and public.owns_field(s.field_id)
  );
$$;

create or replace function public.owns_activity(target_activity uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.activities a where a.id = target_activity and public.owns_season(a.season_id)
  );
$$;

alter table public.sites enable row level security;

create policy "owners manage their sites" on public.sites for all to authenticated
  using (public.owns_farm(farm_id)) with check (public.owns_farm(farm_id));
create policy "owners manage their fields" on public.fields for all to authenticated
  using (public.owns_site(site_id)) with check (public.owns_site(site_id));
