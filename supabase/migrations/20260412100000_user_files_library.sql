-- Unified user file library: canonical blobs + polymorphic links (tasks, events, invoices, etc.)
-- Storage path convention: user-library/{owner_user_id}/{file_id}/{sanitized_filename}

create table if not exists public.user_files (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  storage_bucket text not null default 'user-library',
  storage_path text not null,
  provider text not null default 'supabase',
  sha256 text,
  size_bytes bigint not null check (size_bytes >= 0),
  mime_type text,
  original_filename text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index if not exists user_files_owner_created_idx
  on public.user_files (owner_user_id, created_at desc);

create index if not exists user_files_owner_sha_idx
  on public.user_files (owner_user_id, sha256)
  where sha256 is not null;

create table if not exists public.file_entity_links (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.user_files(id) on delete cascade,
  owner_user_id uuid not null,
  entity_type text not null
    check (entity_type in ('task', 'calendar_event', 'milestone', 'step', 'invoice', 'goal', 'library')),
  entity_id text not null,
  role text,
  created_at timestamptz not null default now(),
  unique (file_id, entity_type, entity_id)
);

create index if not exists file_entity_links_owner_idx
  on public.file_entity_links (owner_user_id, entity_type, entity_id);

create index if not exists file_entity_links_file_idx
  on public.file_entity_links (file_id);

-- Optional: future semantic search (pgvector) — add column when extension enabled
-- alter table public.user_files add column embedding vector(1536);

alter table public.user_files enable row level security;
alter table public.file_entity_links enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_files' and policyname = 'user_files_select_own'
  ) then
    create policy user_files_select_own on public.user_files
      for select using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_files' and policyname = 'user_files_insert_own'
  ) then
    create policy user_files_insert_own on public.user_files
      for insert with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_files' and policyname = 'user_files_update_own'
  ) then
    create policy user_files_update_own on public.user_files
      for update using (auth.uid() = owner_user_id)
      with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_files' and policyname = 'user_files_delete_own'
  ) then
    create policy user_files_delete_own on public.user_files
      for delete using (auth.uid() = owner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'file_entity_links' and policyname = 'file_entity_links_select_own'
  ) then
    create policy file_entity_links_select_own on public.file_entity_links
      for select using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'file_entity_links' and policyname = 'file_entity_links_insert_own'
  ) then
    create policy file_entity_links_insert_own on public.file_entity_links
      for insert with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'file_entity_links' and policyname = 'file_entity_links_delete_own'
  ) then
    create policy file_entity_links_delete_own on public.file_entity_links
      for delete using (auth.uid() = owner_user_id);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('user-library', 'user-library', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Authenticated users may read/write objects under their user id prefix
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_library_select_own'
  ) then
    create policy user_library_select_own on storage.objects
      for select to authenticated
      using (
        bucket_id = 'user-library'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_library_insert_own'
  ) then
    create policy user_library_insert_own on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'user-library'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_library_update_own'
  ) then
    create policy user_library_update_own on storage.objects
      for update to authenticated
      using (
        bucket_id = 'user-library'
        and split_part(name, '/', 1) = auth.uid()::text
      )
      with check (
        bucket_id = 'user-library'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'user_library_delete_own'
  ) then
    create policy user_library_delete_own on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'user-library'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;
