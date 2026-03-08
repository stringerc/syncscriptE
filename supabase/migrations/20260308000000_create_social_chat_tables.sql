-- Social relationships + 1:1 messaging (Phase B messaging core)
-- Implements:
-- - invite/accept/decline/cancel/block/unblock/revoke lifecycle
-- - chat only for accepted relationships

create extension if not exists pgcrypto;

create table if not exists public.social_relationships (
  id uuid primary key default gen_random_uuid(),
  relationship_type text not null check (relationship_type in ('friend', 'teammate', 'collaborative')),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined', 'cancelled', 'revoked', 'blocked')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists social_relationships_unique_direction
  on public.social_relationships (relationship_type, requester_id, addressee_id);

create index if not exists social_relationships_lookup_actor
  on public.social_relationships (requester_id, addressee_id, relationship_type, status);

create table if not exists public.social_messages (
  id uuid primary key default gen_random_uuid(),
  relationship_type text not null check (relationship_type in ('friend', 'teammate', 'collaborative')),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists social_messages_pair_idx
  on public.social_messages (relationship_type, created_at desc, sender_id, recipient_id);

alter table public.social_relationships enable row level security;
alter table public.social_messages enable row level security;

create policy if not exists "Participants can read relationships"
  on public.social_relationships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy if not exists "Participants can read messages"
  on public.social_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy if not exists "Sender can insert messages"
  on public.social_messages for insert
  with check (auth.uid() = sender_id);

create or replace function public.set_social_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_relationships_set_updated_at on public.social_relationships;
create trigger social_relationships_set_updated_at
before update on public.social_relationships
for each row execute function public.set_social_updated_at();

create or replace function public.social_invite(
  p_relationship_type text,
  p_target_email text
)
returns table (
  relationship_id uuid,
  relationship_type text,
  status text,
  direction text,
  partner_user_id uuid,
  partner_email text,
  partner_name text,
  partner_avatar text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_partner auth.users%rowtype;
  v_existing public.social_relationships%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;
  if p_relationship_type not in ('friend', 'teammate', 'collaborative') then
    raise exception 'Invalid relationship type';
  end if;
  if coalesce(trim(p_target_email), '') = '' then
    raise exception 'Target email required';
  end if;

  select *
  into v_partner
  from auth.users u
  where lower(u.email) = lower(trim(p_target_email))
  limit 1;

  if v_partner.id is null then
    raise exception 'User not found for email';
  end if;
  if v_partner.id = v_actor then
    raise exception 'Cannot invite yourself';
  end if;

  -- If reverse pending exists, auto-accept into connected relationship.
  select *
  into v_existing
  from public.social_relationships r
  where r.relationship_type = p_relationship_type
    and r.requester_id = v_partner.id
    and r.addressee_id = v_actor
  order by r.created_at desc
  limit 1;

  if v_existing.id is not null and v_existing.status = 'pending' then
    update public.social_relationships
    set status = 'accepted', accepted_at = now()
    where id = v_existing.id;
  else
    -- Upsert forward invite
    insert into public.social_relationships (
      relationship_type, requester_id, addressee_id, status
    )
    values (
      p_relationship_type, v_actor, v_partner.id, 'pending'
    )
    on conflict (relationship_type, requester_id, addressee_id)
    do update set
      status = case
        when public.social_relationships.status in ('declined', 'cancelled', 'revoked') then 'pending'
        else public.social_relationships.status
      end,
      accepted_at = case
        when public.social_relationships.status in ('declined', 'cancelled', 'revoked') then null
        else public.social_relationships.accepted_at
      end,
      updated_at = now();
  end if;

  return query
  select
    r.id as relationship_id,
    r.relationship_type,
    r.status,
    case when r.requester_id = v_actor then 'outbound' else 'inbound' end as direction,
    case when r.requester_id = v_actor then r.addressee_id else r.requester_id end as partner_user_id,
    case when r.requester_id = v_actor then p.email else req.email end as partner_email,
    coalesce(
      case when r.requester_id = v_actor then p.raw_user_meta_data->>'name' else req.raw_user_meta_data->>'name' end,
      split_part(case when r.requester_id = v_actor then p.email else req.email end, '@', 1)
    ) as partner_name,
    coalesce(
      case when r.requester_id = v_actor then p.raw_user_meta_data->>'avatar_url' else req.raw_user_meta_data->>'avatar_url' end,
      ''
    ) as partner_avatar,
    r.updated_at
  from public.social_relationships r
  join auth.users req on req.id = r.requester_id
  join auth.users p on p.id = r.addressee_id
  where r.relationship_type = p_relationship_type
    and (r.requester_id = v_actor or r.addressee_id = v_actor)
    and (
      (r.requester_id = v_actor and r.addressee_id = v_partner.id) or
      (r.requester_id = v_partner.id and r.addressee_id = v_actor)
    )
  order by r.updated_at desc
  limit 1;
end;
$$;

create or replace function public.social_list_relationships(
  p_relationship_type text
)
returns table (
  relationship_id uuid,
  relationship_type text,
  status text,
  direction text,
  partner_user_id uuid,
  partner_email text,
  partner_name text,
  partner_avatar text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    r.id as relationship_id,
    r.relationship_type,
    r.status,
    case when r.requester_id = auth.uid() then 'outbound' else 'inbound' end as direction,
    case when r.requester_id = auth.uid() then r.addressee_id else r.requester_id end as partner_user_id,
    case when r.requester_id = auth.uid() then p.email else req.email end as partner_email,
    coalesce(
      case when r.requester_id = auth.uid() then p.raw_user_meta_data->>'name' else req.raw_user_meta_data->>'name' end,
      split_part(case when r.requester_id = auth.uid() then p.email else req.email end, '@', 1)
    ) as partner_name,
    coalesce(
      case when r.requester_id = auth.uid() then p.raw_user_meta_data->>'avatar_url' else req.raw_user_meta_data->>'avatar_url' end,
      ''
    ) as partner_avatar,
    r.updated_at
  from public.social_relationships r
  join auth.users req on req.id = r.requester_id
  join auth.users p on p.id = r.addressee_id
  where auth.uid() is not null
    and r.relationship_type = p_relationship_type
    and (r.requester_id = auth.uid() or r.addressee_id = auth.uid())
    and r.status not in ('cancelled', 'declined', 'revoked')
  order by r.updated_at desc;
$$;

create or replace function public.social_relationship_action(
  p_relationship_id uuid,
  p_action text
)
returns table (
  relationship_id uuid,
  relationship_type text,
  status text,
  direction text,
  partner_user_id uuid,
  partner_email text,
  partner_name text,
  partner_avatar text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_rel public.social_relationships%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_rel from public.social_relationships where id = p_relationship_id;
  if v_rel.id is null then
    raise exception 'Relationship not found';
  end if;
  if v_rel.requester_id <> v_actor and v_rel.addressee_id <> v_actor then
    raise exception 'Not authorized for relationship';
  end if;

  if p_action = 'accept' then
    if v_rel.addressee_id <> v_actor or v_rel.status <> 'pending' then
      raise exception 'Cannot accept this relationship';
    end if;
    update public.social_relationships set status = 'accepted', accepted_at = now() where id = v_rel.id;
  elsif p_action = 'decline' then
    if v_rel.addressee_id <> v_actor or v_rel.status <> 'pending' then
      raise exception 'Cannot decline this relationship';
    end if;
    update public.social_relationships set status = 'declined' where id = v_rel.id;
  elsif p_action = 'cancel' then
    if v_rel.requester_id <> v_actor or v_rel.status <> 'pending' then
      raise exception 'Cannot cancel this relationship';
    end if;
    update public.social_relationships set status = 'cancelled' where id = v_rel.id;
  elsif p_action = 'revoke' then
    if v_rel.status <> 'accepted' then
      raise exception 'Cannot revoke this relationship';
    end if;
    update public.social_relationships set status = 'revoked' where id = v_rel.id;
  elsif p_action = 'block' then
    update public.social_relationships set status = 'blocked' where id = v_rel.id;
  elsif p_action = 'unblock' then
    if v_rel.status <> 'blocked' then
      raise exception 'Cannot unblock this relationship';
    end if;
    update public.social_relationships set status = 'revoked' where id = v_rel.id;
  else
    raise exception 'Unsupported relationship action';
  end if;

  return query
  select * from public.social_list_relationships(v_rel.relationship_type)
  where relationship_id = v_rel.id
  limit 1;
end;
$$;

create or replace function public.social_send_message(
  p_relationship_type text,
  p_partner_user_id uuid,
  p_body text
)
returns table (
  message_id uuid,
  relationship_type text,
  sender_id uuid,
  recipient_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_rel public.social_relationships%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(trim(p_body), '') = '' then
    raise exception 'Message body required';
  end if;

  select *
  into v_rel
  from public.social_relationships r
  where r.relationship_type = p_relationship_type
    and r.status = 'accepted'
    and (
      (r.requester_id = v_actor and r.addressee_id = p_partner_user_id) or
      (r.requester_id = p_partner_user_id and r.addressee_id = v_actor)
    )
  order by r.updated_at desc
  limit 1;

  if v_rel.id is null then
    raise exception 'No accepted relationship for messaging';
  end if;

  return query
  insert into public.social_messages (
    relationship_type, sender_id, recipient_id, body
  )
  values (
    p_relationship_type, v_actor, p_partner_user_id, trim(p_body)
  )
  returning id, relationship_type, sender_id, recipient_id, body, created_at;
end;
$$;

create or replace function public.social_list_messages(
  p_relationship_type text,
  p_partner_user_id uuid,
  p_limit int default 100
)
returns table (
  message_id uuid,
  relationship_type text,
  sender_id uuid,
  recipient_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_rel public.social_relationships%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_rel
  from public.social_relationships r
  where r.relationship_type = p_relationship_type
    and r.status = 'accepted'
    and (
      (r.requester_id = v_actor and r.addressee_id = p_partner_user_id) or
      (r.requester_id = p_partner_user_id and r.addressee_id = v_actor)
    )
  order by r.updated_at desc
  limit 1;

  if v_rel.id is null then
    return;
  end if;

  return query
  select
    m.id as message_id,
    m.relationship_type,
    m.sender_id,
    m.recipient_id,
    m.body,
    m.created_at
  from public.social_messages m
  where m.relationship_type = p_relationship_type
    and (
      (m.sender_id = v_actor and m.recipient_id = p_partner_user_id) or
      (m.sender_id = p_partner_user_id and m.recipient_id = v_actor)
    )
  order by m.created_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

grant execute on function public.social_invite(text, text) to authenticated;
grant execute on function public.social_list_relationships(text) to authenticated;
grant execute on function public.social_relationship_action(uuid, text) to authenticated;
grant execute on function public.social_send_message(text, uuid, text) to authenticated;
grant execute on function public.social_list_messages(text, uuid, int) to authenticated;
