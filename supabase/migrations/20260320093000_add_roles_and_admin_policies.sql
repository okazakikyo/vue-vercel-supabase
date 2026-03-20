-- Role-based access for user / admin / master_admin

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum ('master_admin', 'admin', 'user');
  end if;
end $$;

alter table public.profiles
add column if not exists role public.app_role not null default 'user',
add column if not exists created_by_admin_id uuid references public.profiles (id) on delete set null;

update public.profiles
set role = 'user'
where role is null;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_by_admin_id_idx on public.profiles (created_by_admin_id);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role in ('admin', 'master_admin')
  );
$$;

create or replace function public.is_master_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'master_admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.app_role;
begin
  assigned_role := case
    when (new.raw_app_meta_data ->> 'role') in ('master_admin', 'admin') then (new.raw_app_meta_data ->> 'role')::public.app_role
    else 'user'::public.app_role
  end;

  insert into public.profiles (id, username, full_name, avatar_url, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    assigned_role
  )
  on conflict (id) do update
  set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_self_or_master"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_master_admin()
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_self_or_master"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  or public.is_master_admin()
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_self_or_master"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_master_admin()
)
with check (
  (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
  or public.is_master_admin()
);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_authenticated"
on public.orders
for select
to authenticated
using (true);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_admin_only"
on public.orders
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_admin_only"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_admin_only"
on public.orders
for delete
to authenticated
using (public.is_admin());

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_authenticated"
on public.order_items
for select
to authenticated
using (true);

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_admin_only"
on public.order_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "order_items_update_own" on public.order_items;
create policy "order_items_update_admin_only"
on public.order_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_delete_own" on public.order_items;
create policy "order_items_delete_admin_only"
on public.order_items
for delete
to authenticated
using (public.is_admin());

