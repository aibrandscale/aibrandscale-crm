-- ─────────────────────────────────────────────────────────────
-- Booking flow — cal.com-style public scheduling
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

-- ────────────── BOOKING PROFILE ──────────────
-- One row per CRM user. Holds the public booking URL handle and intro copy.
create table if not exists public.booking_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  handle text not null,                             -- public slug, e.g. /book/<handle>
  title text not null default 'Запази си час',
  description text,
  default_duration_min integer not null default 30,
  timezone text not null default 'Europe/Sofia',
  min_notice_min integer not null default 60,       -- minimum hours before slot
  max_advance_days integer not null default 30,     -- how far ahead bookings can be made
  buffer_min integer not null default 0,            -- buffer between consecutive calls
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists booking_profiles_handle_idx on public.booking_profiles (lower(handle));

drop trigger if exists booking_profiles_updated_at on public.booking_profiles;
create trigger booking_profiles_updated_at
before update on public.booking_profiles
for each row execute function public.set_updated_at();

-- ────────────── AVAILABILITY ──────────────
-- One row per weekday with one window. Multiple rows per weekday allowed (e.g. 9-12 + 14-18).
create table if not exists public.booking_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),   -- 0=Sunday … 6=Saturday
  start_minute smallint not null check (start_minute between 0 and 1439),  -- minutes since midnight, host's TZ
  end_minute smallint not null check (end_minute between 1 and 1440),
  created_at timestamptz not null default now(),
  check (end_minute > start_minute)
);
create index if not exists booking_availability_user_idx on public.booking_availability (user_id, weekday);

-- ────────────── BOOKINGS ──────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  -- guest details (captured during booking)
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  guest_note text,
  -- scheduling
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_min integer not null,
  timezone text not null,                            -- guest's chosen TZ
  -- meeting links / external
  meeting_url text,
  google_event_id text,
  -- lifecycle
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  cancellation_reason text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);
create index if not exists bookings_host_start_idx on public.bookings (host_id, start_at desc);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_email_idx on public.bookings (lower(guest_email));

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Prevent double-booking the same host slot (overlapping confirmed bookings).
create extension if not exists btree_gist;
alter table public.bookings
  drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    host_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status = 'confirmed');

-- ────────────── GOOGLE TOKENS ──────────────
create table if not exists public.google_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  google_email text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists google_tokens_updated_at on public.google_tokens;
create trigger google_tokens_updated_at
before update on public.google_tokens
for each row execute function public.set_updated_at();

-- ────────────── RLS ──────────────
alter table public.booking_profiles enable row level security;
alter table public.booking_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.google_tokens enable row level security;

-- Public read of booking_profiles (so the /book/<handle> page can be SSR'd).
drop policy if exists "anyone read booking_profiles" on public.booking_profiles;
create policy "anyone read booking_profiles" on public.booking_profiles for select using (true);

-- Public read of availability — needed to compute open slots on /book/<handle>.
drop policy if exists "anyone read booking_availability" on public.booking_availability;
create policy "anyone read booking_availability" on public.booking_availability for select using (true);

-- Bookings: only authenticated team members can read.
drop policy if exists "authenticated read bookings" on public.bookings;
create policy "authenticated read bookings" on public.bookings for select to authenticated using (true);

-- Google tokens: a user can read their own row only.
drop policy if exists "user reads own google_tokens" on public.google_tokens;
create policy "user reads own google_tokens" on public.google_tokens for select to authenticated using (auth.uid() = user_id);

-- All writes happen through the service role from server-side code.
