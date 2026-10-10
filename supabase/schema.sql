-- Run this once in your Supabase project's SQL editor.
-- It creates the two tables QuickPoll needs.

create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz default now()
);

create table options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  votes integer not null default 0,
  created_at timestamptz default now()
);

alter table polls enable row level security;
alter table options enable row level security;

-- Demo-open policies (anyone can read and vote). Tighten these for production.
create policy "public read/write polls" on polls for all using (true) with check (true);
create policy "public read/write options" on options for all using (true) with check (true);
