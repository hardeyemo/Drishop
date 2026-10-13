-- Row Level Security. The service role (server only) bypasses RLS; everything
-- reachable with the anon/authenticated keys is governed by these policies.

alter table profiles         enable row level security;
alter table categories       enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table product_images   enable row level security;
alter table reviews          enable row level security;
alter table addresses        enable row level security;
alter table wishlists        enable row level security;
alter table shipping_zones   enable row level security;
alter table discounts        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table order_events     enable row level security;
alter table payments         enable row level security;
alter table webhook_events   enable row level security;  -- no policies: service role only

-- profiles
create policy profiles_select on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- catalogue: public read of active rows, admin full access
create policy categories_read on categories for select using (is_active or is_admin());
create policy categories_admin on categories for all using (is_admin()) with check (is_admin());

create policy products_read on products for select using (is_active or is_admin());
create policy products_admin on products for all using (is_admin()) with check (is_admin());

create policy variants_read on product_variants for select using (
  is_admin() or (is_active and exists (select 1 from products p where p.id = product_id and p.is_active))
);
create policy variants_admin on product_variants for all using (is_admin()) with check (is_admin());

create policy images_read on product_images for select using (
  is_admin() or exists (select 1 from products p where p.id = product_id and p.is_active)
);
create policy images_admin on product_images for all using (is_admin()) with check (is_admin());

-- reviews: customers can post (always unapproved) and delete their own; admins moderate
create policy reviews_read on reviews for select using (is_approved or user_id = auth.uid() or is_admin());
create policy reviews_insert_own on reviews for insert with check (user_id = auth.uid() and is_approved = false);
create policy reviews_delete_own on reviews for delete using (user_id = auth.uid());
create policy reviews_admin on reviews for all using (is_admin()) with check (is_admin());

-- customer-owned data
create policy addresses_own on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_admin_read on addresses for select using (is_admin());
create policy wishlists_own on wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- shipping & discounts (discount codes are validated server-side, never listed to clients)
create policy shipping_read on shipping_zones for select using (is_active or is_admin());
create policy shipping_admin on shipping_zones for all using (is_admin()) with check (is_admin());
create policy discounts_admin on discounts for all using (is_admin()) with check (is_admin());

-- orders: customers read their own; only the server (service role) creates them.
create policy orders_read_own on orders for select using (user_id = auth.uid() or is_admin());
create policy orders_admin_update on orders for update using (is_admin()) with check (is_admin());

create policy order_items_read on order_items for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy order_events_read on order_events for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy order_events_admin_insert on order_events for insert with check (is_admin());

-- payments: read-only for the owner/admin. Only the server writes payment state.
create policy payments_read on payments for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

-- storage: public bucket for product images, admin-only writes
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Admins manage product images" on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
