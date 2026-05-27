-- Receivables — daily sales schema
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.
--
-- TODO (phase 2): enable RLS and add per-user policies once auth is wired in.
-- For now the anon key has full access; the app is single-tenant.

create extension if not exists "pgcrypto";

-- One row per CSV file uploaded.
create table if not exists public.uploads (
    id              uuid primary key default gen_random_uuid(),
    filename        text not null,
    file_date       date not null,
    uploaded_at     timestamptz not null default now(),
    row_count       integer not null default 0,
    success_count   integer not null default 0,
    cancelled_count integer not null default 0,
    total_amount    numeric(14, 2) not null default 0
);

-- One row per (business_date, branch). Status moves parsed -> validated -> posted.
create table if not exists public.daily_summaries (
    id              uuid primary key default gen_random_uuid(),
    upload_id       uuid not null references public.uploads(id) on delete cascade,
    business_date   date not null,
    branch          text not null,
    status          text not null default 'parsed'
                    check (status in ('parsed', 'validated', 'posted')),
    order_count     integer not null default 0,
    total_amount    numeric(14, 2) not null default 0,
    validated_at    timestamptz,
    posted_at       timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (business_date, branch)
);

-- One row per (daily_summary, category). 9 expected categories per summary.
create table if not exists public.summary_lines (
    id                  uuid primary key default gen_random_uuid(),
    summary_id          uuid not null references public.daily_summaries(id) on delete cascade,
    category            text not null
                        check (category in (
                            'Cash', 'PayTm', 'Zomato', 'Swiggy', 'Ownly',
                            'Ajantha', 'ODC', 'EnoPay', 'Shubha'
                        )),
    order_count         integer not null default 0,
    total_amount        numeric(14, 2) not null default 0,
    zoho_invoice_id     text,
    posted_at           timestamptz,
    unique (summary_id, category)
);

create index if not exists idx_daily_summaries_date
    on public.daily_summaries (business_date desc);

create index if not exists idx_summary_lines_summary
    on public.summary_lines (summary_id);

-- Touch updated_at on every update to daily_summaries.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists trg_daily_summaries_updated_at on public.daily_summaries;
create trigger trg_daily_summaries_updated_at
    before update on public.daily_summaries
    for each row execute function public.set_updated_at();

-- Phase-1 access: open to anon key. Lock down when auth lands.
alter table public.uploads          disable row level security;
alter table public.daily_summaries  disable row level security;
alter table public.summary_lines    disable row level security;
