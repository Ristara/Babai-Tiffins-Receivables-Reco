-- Receivables / Daily Sales app — initial schema
-- Created 2026-05-27.
--
-- Three tables, joined by foreign keys:
--   uploads          → one row per CSV file uploaded (audit trail)
--   daily_summaries  → one row per (sale_date, branch); 3 branches → 3 rows per day
--   summary_lines    → one row per (daily_summary_id, category); 9 categories
--                      → 27 rows per day (9 × 3 branches)
--
-- Phase 1: RLS is OFF. Single user, local development. Re-enable + add auth
-- policies before sharing the app with anyone else.

-- ---------- uploads -------------------------------------------------------
create table public.uploads (
  id                  uuid        primary key default gen_random_uuid(),
  filename            text        not null,
  uploaded_at         timestamptz not null default now(),
  rows_total          int         not null,
  rows_success        int         not null,
  rows_cancelled      int         not null,
  rows_unclassified   int         not null
);

-- ---------- daily_summaries ----------------------------------------------
create table public.daily_summaries (
  id            uuid          primary key default gen_random_uuid(),
  upload_id     uuid          not null references public.uploads(id) on delete cascade,
  sale_date     date          not null,
  branch        text          not null,                       -- HSR / SJP / JPN
  status        text          not null default 'parsed',      -- parsed | validated | posted
  total_amount  numeric(12,2) not null,
  total_orders  int           not null,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  unique (sale_date, branch)
);

create index daily_summaries_sale_date_idx
  on public.daily_summaries (sale_date desc);

-- ---------- summary_lines ------------------------------------------------
create table public.summary_lines (
  id                 uuid          primary key default gen_random_uuid(),
  daily_summary_id   uuid          not null references public.daily_summaries(id) on delete cascade,
  category           text          not null,                  -- Cash / PayTm / Zomato / Swiggy / Ownly / Ajantha / ODC / EnoPay / Shubha
  amount             numeric(12,2) not null default 0,
  order_count        int           not null default 0,
  zoho_invoice_id    text,                                    -- filled in Phase 2 when posted
  posted_at          timestamptz,
  unique (daily_summary_id, category)
);

-- ---------- Phase 1: disable RLS on all three tables ---------------------
alter table public.uploads          disable row level security;
alter table public.daily_summaries  disable row level security;
alter table public.summary_lines    disable row level security;
