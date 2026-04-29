-- Activity spine, business plan, API tokens (PAT), social prefs, friend activity RPC
-- Spec: integrations/research/SYNCSCRIPT_ACTIVITY_AND_SOCIAL_SPINE.md

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- User activity events (append-only work signals)
-- ---------------------------------------------------------------------------
create table if not exists public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'task_completed',
    'goal_progress',
    'calendar_event_done',
    'focus_block',
    'external_ide_session',
    'generic'
  )),
  intensity integer not null default 1 check (intensity >= 0 and intensity <= 100),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public_summary')),
  created_at timestamptz not null default now()
);

create index if not exists user_activity_events_user_time_idx
  on public.user_activity_events (user_id, occurred_at desc);

alter table public.user_activity_events enable row level security;

drop policy if exists "Users read own activity events" on public.user_activity_events;
create policy "Users read own activity events"
  on public.user_activity_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own activity events" on public.user_activity_events;
create policy "Users insert own activity events"
  on public.user_activity_events for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Business plan (one document per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_business_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sections jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_business_plans enable row level security;

drop policy if exists "Users manage own business plan" on public.user_business_plans;
create policy "Users manage own business plan"
  on public.user_business_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Personal access tokens (hashed; plain shown once at creation)
-- ---------------------------------------------------------------------------
create table if not exists public.user_api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,
  scopes text[] not null default array['tasks:read']::text[],
  label text not null default 'Cursor / MCP',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create unique index if not exists user_api_tokens_hash_uidx
  on public.user_api_tokens (token_hash);

create index if not exists user_api_tokens_user_idx
  on public.user_api_tokens (user_id, created_at desc);

alter table public.user_api_tokens enable row level security;

drop policy if exists "Users read own api tokens" on public.user_api_tokens;
create policy "Users read own api tokens"
  on public.user_api_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "Users delete own api tokens" on public.user_api_tokens;
create policy "Users delete own api tokens"
  on public.user_api_tokens for delete
  using (auth.uid() = user_id);

drop policy if exists "Users insert own api tokens" on public.user_api_tokens;
create policy "Users insert own api tokens"
  on public.user_api_tokens for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Social visibility prefs (heatmap / friend feed)
-- ---------------------------------------------------------------------------
create table if not exists public.user_social_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  heatmap_visibility text not null default 'private'
    check (heatmap_visibility in ('private', 'friends', 'public_summary')),
  friend_feed_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_social_prefs enable row level security;

drop policy if exists "Users manage own social prefs" on public.user_social_prefs;
create policy "Users manage own social prefs"
  on public.user_social_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Friend activity feed (security definer — friends see opted-in visibility)
-- ---------------------------------------------------------------------------
create or replace function public.social_friend_activity_feed(p_limit integer default 40)
returns table (
  event_id uuid,
  actor_user_id uuid,
  event_type text,
  intensity integer,
  metadata jsonb,
  occurred_at timestamptz,
  visibility text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 200 then
    p_limit := 40;
  end if;

  return query
  select
    e.id,
    e.user_id,
    e.event_type,
    e.intensity,
    e.metadata,
    e.occurred_at,
    e.visibility
  from public.user_activity_events e
  where e.visibility in ('friends', 'public_summary')
    and exists (
      select 1
      from public.social_relationships r
      where r.relationship_type = 'friend'
        and r.status = 'accepted'
        and (
          (r.requester_id = v_actor and r.addressee_id = e.user_id)
          or (r.addressee_id = v_actor and r.requester_id = e.user_id)
        )
    )
    and exists (
      select 1
      from public.user_social_prefs p
      where p.user_id = e.user_id
        and p.friend_feed_opt_in is true
    )
  order by e.occurred_at desc
  limit p_limit;
end;
$$;

grant execute on function public.social_friend_activity_feed(integer) to authenticated;
