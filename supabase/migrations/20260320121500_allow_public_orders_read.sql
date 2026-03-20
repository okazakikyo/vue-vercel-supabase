drop policy if exists "orders_select_authenticated" on public.orders;
create policy "orders_select_public"
on public.orders
for select
to anon, authenticated
using (true);

drop policy if exists "order_items_select_authenticated" on public.order_items;
create policy "order_items_select_public"
on public.order_items
for select
to anon, authenticated
using (true);
