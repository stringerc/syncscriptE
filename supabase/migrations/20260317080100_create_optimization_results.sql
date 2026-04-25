create table if not exists public.optimization_results (
  result_id text primary key,
  run_id text not null references public.optimization_runs(run_id) on delete cascade,
  mission_id text not null,
  node_id text not null,
  user_id text not null,
  workspace_id text not null,
  provider_id text,
  solver_type text,
  solver_version text,
  runtime_ms integer,
  confidence numeric(5,4),
  reproducibility_token text,
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists optimization_results_repro_token_idx
  on public.optimization_results (run_id, reproducibility_token)
  where reproducibility_token is not null;

create index if not exists optimization_results_run_idx
  on public.optimization_results (run_id, created_at desc);

create index if not exists optimization_results_workspace_idx
  on public.optimization_results (workspace_id, user_id, created_at desc);
