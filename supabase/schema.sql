-- ============================================================================
--  Global Suntech — lead capture schema for Supabase
--
--  Apply this once per project: Supabase Dashboard → SQL Editor → paste → Run.
--  It is idempotent, so re-running it is safe.
--
--  Security model
--  ──────────────
--  Every table has Row Level Security ENABLED with NO policies. That denies
--  the `anon` and `authenticated` keys all access, while the `service_role`
--  key — used only by the Next.js server (see src/lib/supabase/server.ts) —
--  bypasses RLS and keeps working. Customer enquiries are therefore never
--  readable from a browser, even with the public anon key in hand.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('new', 'in_progress', 'resolved');
  end if;
end $$;

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
--  leads — one row per customer enquiry submitted from a landing page
-- ============================================================================
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  -- customer-facing reference, e.g. TF-482913, unique so it can be quoted back
  ref            text        not null unique,
  -- which landing page the enquiry came from; matches SITE_SLUGS in src/lib/sites.ts
  site           text        not null,
  form_id        text,
  status         public.lead_status not null default 'new',

  name           text        not null,
  email          text        not null,
  phone          text,
  company        text,
  country        text,
  city           text,
  location       text,
  -- the page-specific "what do you need" answer: division, product, project type
  enquiry_type   text,
  system_type    text,
  quantity       text,
  message        text,

  -- any extra key/value answers we did not canonicalise, kept verbatim
  details        jsonb       not null default '{}'::jsonb,

  -- provenance, for recognising spam and understanding traffic sources
  source_path    text,
  referrer       text,
  user_agent     text,
  -- sha256 of the client IP; the address itself is never stored
  ip_hash        text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Only slugs the app knows about may be written. Keep in sync with SITE_SLUGS.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_site_known'
  ) then
    alter table public.leads
      add constraint leads_site_known check (
        site in (
          'landing',
          'traffic-solutions',
          'solar-solutions',
          'led-lighting',
          'engineering-consulting'
        )
      );
  end if;
end $$;

create index if not exists leads_site_created_idx   on public.leads (site, created_at desc);
create index if not exists leads_status_created_idx on public.leads (status, created_at desc);
create index if not exists leads_created_idx        on public.leads (created_at desc);
create index if not exists leads_email_idx          on public.leads (lower(email));

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  newsletter_subscribers — footer signups, one row per address per page
-- ============================================================================
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text        not null,
  site        text        not null,
  source_path text,
  created_at  timestamptz not null default now(),
  constraint newsletter_subscribers_email_site_key unique (site, email)
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

-- ============================================================================
--  site_settings — per-landing-page switches the admin portal controls
-- ============================================================================
create table if not exists public.site_settings (
  site            text primary key,
  -- false = the public API rejects new enquiries for this page ("closed")
  accepting_leads boolean     not null default true,
  note            text,
  updated_at      timestamptz not null default now()
);

-- Make sure every known page has a row, so the admin has something to toggle.
insert into public.site_settings (site) values
  ('landing'),
  ('traffic-solutions'),
  ('solar-solutions'),
  ('led-lighting'),
  ('engineering-consulting')
on conflict (site) do nothing;

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  lead_stats — one round trip for the admin dashboard counters
-- ============================================================================
create or replace function public.lead_stats(p_site text default null)
returns table (
  total       bigint,
  new         bigint,
  in_progress bigint,
  resolved    bigint,
  today       bigint,
  last_lead   timestamptz
)
language sql
stable
as $$
  select
    count(*)::bigint,
    count(*) filter (where status = 'new')::bigint,
    count(*) filter (where status = 'in_progress')::bigint,
    count(*) filter (where status = 'resolved')::bigint,
    count(*) filter (where created_at >= date_trunc('day', now()))::bigint,
    max(created_at)
  from public.leads
  where p_site is null or site = p_site;
$$;

-- ============================================================================
--  Lock the tables down
-- ============================================================================
alter table public.leads                  enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings          enable row level security;

-- RLS with no policies already denies anon/authenticated. Revoking the grants
-- as well means the denial shows up as a permission error rather than an empty
-- result set, which is easier to debug.
revoke all on public.leads                  from anon, authenticated;
revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.site_settings          from anon, authenticated;
