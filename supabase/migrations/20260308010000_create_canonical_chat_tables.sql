-- Canonical cross-surface chat ledger for SyncScript app + Discord.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  workspace_id text not null default 'default',
  route_key text not null,
  tab text not null default 'dashboard',
  agent_id text not null default 'mission',
  source text not null default 'syncscript',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, workspace_id, route_key)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  seq bigint not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  source text not null default 'syncscript',
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (thread_id, seq)
);

create unique index if not exists chat_messages_thread_idempotency_uq
  on public.chat_messages(thread_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.chat_deliveries (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  target text not null check (target in ('syncscript', 'discord')),
  target_ref text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  last_error text,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, target, target_ref)
);

create index if not exists chat_threads_owner_workspace_idx
  on public.chat_threads(owner_user_id, workspace_id, route_key);

create index if not exists chat_messages_thread_seq_idx
  on public.chat_messages(thread_id, seq);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_deliveries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_owner_select'
  ) then
    create policy chat_threads_owner_select on public.chat_threads
      for select using (auth.uid()::text = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_owner_insert'
  ) then
    create policy chat_threads_owner_insert on public.chat_threads
      for insert with check (auth.uid()::text = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_owner_update'
  ) then
    create policy chat_threads_owner_update on public.chat_threads
      for update using (auth.uid()::text = owner_user_id)
      with check (auth.uid()::text = owner_user_id);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_owner_select'
  ) then
    create policy chat_messages_owner_select on public.chat_messages
      for select using (
        exists (
          select 1
          from public.chat_threads t
          where t.id = chat_messages.thread_id
            and t.owner_user_id = auth.uid()::text
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_owner_insert'
  ) then
    create policy chat_messages_owner_insert on public.chat_messages
      for insert with check (
        exists (
          select 1
          from public.chat_threads t
          where t.id = chat_messages.thread_id
            and t.owner_user_id = auth.uid()::text
        )
      );
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_deliveries' and policyname = 'chat_deliveries_owner_select'
  ) then
    create policy chat_deliveries_owner_select on public.chat_deliveries
      for select using (
        exists (
          select 1
          from public.chat_messages m
          join public.chat_threads t on t.id = m.thread_id
          where m.id = chat_deliveries.message_id
            and t.owner_user_id = auth.uid()::text
        )
      );
  end if;
end$$;
