-- Orders management tables
-- Includes:
-- - orders (main order records)
-- - order_items (individual items within an order)
-- - RLS policies

-- ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_date date not null,
  shop_name text not null,
  shop_url text,
  total_before_discount integer not null default 0,
  total_after_discount integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_non_negative check (
    total_before_discount >= 0 and total_after_discount >= 0
  ),
  constraint orders_total_after_lte_before check (
    total_after_discount <= total_before_discount
  )
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_order_date_idx on public.orders (order_date);
create index if not exists orders_created_at_idx on public.orders (created_at);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
on public.orders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own"
on public.orders
for delete
to authenticated
using (user_id = auth.uid());

-- ORDER_ITEMS TABLE
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_user_name text not null,
  price integer not null,
  discount integer default 0,
  final_price integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_amounts_non_negative check (
    price >= 0 and coalesce(discount, 0) >= 0 and final_price >= 0
  )
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_user_name_idx on public.order_items (item_user_name);

alter table public.order_items enable row level security;

-- RLS for order_items: users can see items in their own orders
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items
for select
to authenticated
using (
  order_id in (
    select id from public.orders where user_id = auth.uid()
  )
);

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
on public.order_items
for insert
to authenticated
with check (
  order_id in (
    select id from public.orders where user_id = auth.uid()
  )
);

drop policy if exists "order_items_update_own" on public.order_items;
create policy "order_items_update_own"
on public.order_items
for update
to authenticated
using (
  order_id in (
    select id from public.orders where user_id = auth.uid()
  )
)
with check (
  order_id in (
    select id from public.orders where user_id = auth.uid()
  )
);

drop policy if exists "order_items_delete_own" on public.order_items;
create policy "order_items_delete_own"
on public.order_items
for delete
to authenticated
using (
  order_id in (
    select id from public.orders where user_id = auth.uid()
  )
);
