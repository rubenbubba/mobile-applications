-- Vitrine database: businesses, their check results, and what the owner did about them.
-- Every table is protected by row level security: an owner only ever sees their own businesses.
-- Deleting a user (auth.users) deletes everything below through "on delete cascade" (GDPR, chapter 23).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null default '' check (char_length(category) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  website_url text not null check (website_url ~ '^https://[^/\s]+'),
  created_at timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses (owner_id);

-- One row per full check (run-check function). Raw results only; scores are calculated in the app.
create table public.check_snapshots (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  checked_at timestamptz not null default now(),
  website jsonb not null,
  seo jsonb,
  performance jsonb
);
create index check_snapshots_business_idx on public.check_snapshots (business_id, checked_at desc);

-- One row every 10 minutes per business (uptime-monitor function, started by pg_cron).
create table public.uptime_checks (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  checked_at timestamptz not null default now(),
  is_up boolean not null,
  status_code integer not null default 0,
  response_time_ms integer not null default 0
);
create index uptime_checks_business_idx on public.uptime_checks (business_id, checked_at desc);

-- Issues the owner marked as fixed, and fixes a later check confirmed.
create table public.issue_progress (
  business_id uuid not null references public.businesses (id) on delete cascade,
  issue_id text not null check (char_length(issue_id) <= 60),
  status text not null check (status in ('marked', 'verified')),
  updated_at timestamptz not null default now(),
  primary key (business_id, issue_id)
);

-- Reviews the owner has answered.
create table public.review_replies (
  business_id uuid not null references public.businesses (id) on delete cascade,
  review_id text not null check (char_length(review_id) <= 200),
  replied_at timestamptz not null default now(),
  primary key (business_id, review_id)
);

-- Daily availability for the last 30 days. security_invoker makes the caller's row level security apply.
create view public.uptime_days with (security_invoker = true) as
select
  business_id,
  date_trunc('day', checked_at) as day,
  round(100.0 * avg(case when is_up then 1 else 0 end), 2) as uptime_percent,
  count(*) as checks
from public.uptime_checks
where checked_at > now() - interval '30 days'
group by business_id, date_trunc('day', checked_at);

-- A small limit per account, so one account cannot make the server check hundreds of sites.
create function public.enforce_business_limit() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.businesses where owner_id = new.owner_id) >= 5 then
    raise exception 'You can add up to 5 businesses.';
  end if;
  return new;
end;
$$;

create trigger businesses_limit
before insert on public.businesses
for each row execute function public.enforce_business_limit();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.check_snapshots enable row level security;
alter table public.uptime_checks enable row level security;
alter table public.issue_progress enable row level security;
alter table public.review_replies enable row level security;

create policy "Owners manage their businesses" on public.businesses
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- Check results are written only by the server functions (service role), so owners can only read them.
create policy "Owners read their checks" on public.check_snapshots
for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "Owners read their uptime" on public.uptime_checks
for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "Owners manage their issue progress" on public.issue_progress
for all to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "Owners manage their review replies" on public.review_replies
for all to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

-- Only signed-in users reach the data. Visitors without an account get nothing.
revoke all on public.businesses, public.check_snapshots, public.uptime_checks, public.issue_progress,
  public.review_replies, public.uptime_days from anon;
grant select, insert, update, delete on public.businesses, public.issue_progress, public.review_replies to authenticated;
grant select on public.check_snapshots, public.uptime_checks, public.uptime_days to authenticated;

-- ---------------------------------------------------------------------------
-- Schedules (pg_cron + pg_net)
-- The project URL and the cron secret live in Supabase Vault, never in this file.
-- They are added once with: select vault.create_secret('<url>', 'project_url');
--                           select vault.create_secret('<secret>', 'cron_secret');
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Every 10 minutes: check that every business's website answers.
select cron.schedule(
  'uptime-monitor',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/uptime-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Every night: keep 90 days of uptime samples, which is all the app shows and keeps storage small.
select cron.schedule(
  'uptime-cleanup',
  '15 3 * * *',
  $$ delete from public.uptime_checks where checked_at < now() - interval '90 days' $$
);
