-- FarmWisr Milestone 1 ("Field log"): farms, fields, plantations, crop seasons and activities.
-- Money is stored in minor units (pesewas for GHS). Areas are stored in hectares.

create extension if not exists postgis with schema extensions;

create type public.area_unit as enum ('acre', 'hectare');
create type public.season_stage as enum (
  'land_preparation', 'planting', 'crop_care', 'crop_protection', 'harvest', 'post_harvest'
);
create type public.cost_category as enum ('inputs', 'labour', 'equipment', 'other');

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  country_code char(2) not null default 'GH',
  currency char(3) not null default 'GHS',
  area_unit public.area_unit not null default 'acre',
  created_at timestamptz not null default now()
);

create table public.fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null,
  area_hectares numeric(12, 4) check (area_hectares >= 0),
  boundary extensions.geography(Polygon, 4326),
  soil_type text,
  tenure text check (tenure in ('owned', 'leased', 'family', 'other')),
  created_at timestamptz not null default now()
);

-- Tree crops (cocoa, oil palm, cashew...) live for decades; each year is a crop season linked here.
create table public.plantations (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  crop text not null,
  variety text,
  planting_year smallint check (planting_year between 1900 and 2200),
  tree_count integer check (tree_count >= 0),
  spacing_m numeric(5, 2),
  created_at timestamptz not null default now()
);

create table public.crop_seasons (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  plantation_id uuid references public.plantations (id) on delete set null,
  crop text not null,
  variety text,
  start_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  target_yield numeric(12, 2),
  target_yield_unit text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.crop_seasons (id) on delete cascade,
  stage public.season_stage not null,
  type text not null,
  activity_date date not null,
  notes text,
  harvest_quantity numeric(12, 2) check (harvest_quantity is null or harvest_quantity >= 0),
  harvest_unit text,
  location extensions.geography(Point, 4326),
  recorded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage = 'harvest' or harvest_quantity is null)
);

create table public.activity_costs (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  category public.cost_category not null,
  description text,
  amount_minor bigint not null check (amount_minor >= 0)
);

create index on public.farms (owner_id);
create index on public.fields (farm_id);
create index on public.plantations (field_id);
create index on public.crop_seasons (field_id);
create index on public.activities (season_id, activity_date);
create index on public.activity_costs (activity_id);

-- Row-level security: a farm and everything under it belongs to the farm's owner.
-- Farm teams with roles come in a later milestone.

create function public.owns_farm(target_farm uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.farms f where f.id = target_farm and f.owner_id = auth.uid());
$$;

create function public.owns_field(target_field uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.fields fl join public.farms f on f.id = fl.farm_id
    where fl.id = target_field and f.owner_id = auth.uid()
  );
$$;

create function public.owns_season(target_season uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.crop_seasons s
    join public.fields fl on fl.id = s.field_id
    join public.farms f on f.id = fl.farm_id
    where s.id = target_season and f.owner_id = auth.uid()
  );
$$;

create function public.owns_activity(target_activity uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.activities a
    join public.crop_seasons s on s.id = a.season_id
    join public.fields fl on fl.id = s.field_id
    join public.farms f on f.id = fl.farm_id
    where a.id = target_activity and f.owner_id = auth.uid()
  );
$$;

alter table public.farms enable row level security;
alter table public.fields enable row level security;
alter table public.plantations enable row level security;
alter table public.crop_seasons enable row level security;
alter table public.activities enable row level security;
alter table public.activity_costs enable row level security;

create policy "owners manage their farms" on public.farms for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage their fields" on public.fields for all to authenticated
  using (public.owns_farm(farm_id)) with check (public.owns_farm(farm_id));
create policy "owners manage their plantations" on public.plantations for all to authenticated
  using (public.owns_field(field_id)) with check (public.owns_field(field_id));
create policy "owners manage their seasons" on public.crop_seasons for all to authenticated
  using (public.owns_field(field_id)) with check (public.owns_field(field_id));
create policy "owners manage their activities" on public.activities for all to authenticated
  using (public.owns_season(season_id)) with check (public.owns_season(season_id));
create policy "owners manage their activity costs" on public.activity_costs for all to authenticated
  using (public.owns_activity(activity_id)) with check (public.owns_activity(activity_id));

-- Cost and harvest totals per season, for the season summary screen.
create view public.season_summaries with (security_invoker = true) as
select
  s.id as season_id,
  s.field_id,
  count(distinct a.id) as activity_count,
  coalesce(sum(c.amount_minor), 0) as total_cost_minor,
  case when fl.area_hectares > 0
    then round(coalesce(sum(c.amount_minor), 0) / fl.area_hectares)
  end as cost_per_hectare_minor
from public.crop_seasons s
join public.fields fl on fl.id = s.field_id
left join public.activities a on a.season_id = s.id
left join public.activity_costs c on c.activity_id = a.id
group by s.id, s.field_id, fl.area_hectares;
