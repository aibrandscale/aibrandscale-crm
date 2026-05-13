-- ─────────────────────────────────────────────────────────────
-- AI Brand Scale CRM — schema
-- Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────── PROFILES ──────────────
-- One row per auth user. Created automatically when a Supabase Auth user is created.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'admin' check (role in ('admin','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile when a new auth user appears.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ────────────── EVENTS ──────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  date timestamptz not null,
  status text not null default 'upcoming' check (status in ('draft','upcoming','live','past')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists events_slug_idx on public.events (lower(slug));
create index if not exists events_active_idx on public.events (is_active) where is_active = true;
create index if not exists events_date_idx on public.events (date desc);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Ensure only one active event at a time.
create or replace function public.enforce_single_active_event()
returns trigger language plpgsql as $$
begin
  if new.is_active then
    update public.events set is_active = false where id <> new.id and is_active = true;
  end if;
  return new;
end;
$$;
drop trigger if exists events_single_active on public.events;
create trigger events_single_active
after insert or update of is_active on public.events
for each row when (new.is_active is true)
execute function public.enforce_single_active_event();

-- ────────────── LEADS ──────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  source text not null default 'Webhook',
  status text not null default 'new' check (status in ('new','contacted','follow_up','qualified','unqualified')),
  note text,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_event_idx on public.leads (event_id);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- ────────────── CALLS ──────────────
-- Future: booked Zoom calls
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  lead_name text not null,
  email text not null,
  phone text,
  host_id uuid references public.profiles (id) on delete set null,
  host_name text,
  start_at timestamptz not null,
  duration_min integer not null default 30,
  meeting_url text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','no_show','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists calls_start_idx on public.calls (start_at);
create index if not exists calls_status_idx on public.calls (status);

drop trigger if exists calls_updated_at on public.calls;
create trigger calls_updated_at
before update on public.calls
for each row execute function public.set_updated_at();

-- ────────────── ROW LEVEL SECURITY ──────────────
-- All tables locked down. Writes go through the service role from server-side
-- code (route handlers / server actions). Authenticated users can read everything.

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;

-- Read access for any authenticated user. Service role bypasses RLS implicitly.
drop policy if exists "authenticated read profiles" on public.profiles;
create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "user can update own profile" on public.profiles;
create policy "user can update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "authenticated read events" on public.events;
create policy "authenticated read events" on public.events for select to authenticated using (true);

drop policy if exists "authenticated read leads" on public.leads;
create policy "authenticated read leads" on public.leads for select to authenticated using (true);

drop policy if exists "authenticated read calls" on public.calls;
create policy "authenticated read calls" on public.calls for select to authenticated using (true);

-- Seed the "default" event so new leads have somewhere to land before any custom event exists.
insert into public.events (slug, name, description, date, status, is_active)
values ('default', 'Без event', 'Лийдове, които идват без зададено event.', now(), 'draft', true)
on conflict do nothing;
