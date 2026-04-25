create table if not exists public.optimization_runs (
  run_id text primary key,
  mission_id text not null,
  node_id text not null,
  user_id text not null,
  workspace_id text not null,
  input_hash text not null,
  idempotency_key text not null,
  provider_id text,
  solver_type text,
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists optimization_runs_idempotency_key_idx
  on public.optimization_runs (user_id, workspace_id, idempotency_key);

create index if not exists optimization_runs_mission_idx
  on public.optimization_runs (mission_id, node_id, created_at desc);

create index if not exists optimization_runs_workspace_idx
  on public.optimization_runs (workspace_id, user_id, created_at desc);
