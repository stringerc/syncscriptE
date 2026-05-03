-- Server-backed queue for suggested-but-not-committed items (Cursor MCP / dashboard parity).
-- Edge uses service role; RLS still mirrors other user-owned productivity tables.

create table if not exists public.user_capture_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('task_draft', 'calendar_hold_draft', 'generic')),
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'cursor',
  status text not null default 'pending' check (status in ('pending', 'committed', 'dismissed')),
  commit_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_capture_inbox_user_status_idx
  on public.user_capture_inbox (user_id, status, created_at desc);

alter table public.user_capture_inbox enable row level security;

drop policy if exists "Users read own capture inbox" on public.user_capture_inbox;
create policy "Users read own capture inbox"
  on public.user_capture_inbox for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own capture inbox" on public.user_capture_inbox;
create policy "Users insert own capture inbox"
  on public.user_capture_inbox for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own capture inbox" on public.user_capture_inbox;
create policy "Users update own capture inbox"
  on public.user_capture_inbox for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
