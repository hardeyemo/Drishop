-- Optional persisted carts. The current storefront still stores carts in localStorage.
-- Apply after 0001_schema.sql and 0002_rls.sql.
-- This migration creates only the missing cart tables. If both already exist, it
-- leaves them untouched; if only one exists, it stops for a manual schema review.
do $migration$
begin
  if to_regclass('public.carts') is not null and to_regclass('public.cart_items') is not null then
    raise notice 'Both public.carts and public.cart_items already exist; no changes made.';
    return;
  end if;

  if to_regclass('public.carts') is not null or to_regclass('public.cart_items') is not null then
    raise exception 'A partial cart schema exists. Inspect public.carts and public.cart_items before applying this migration.';
  end if;

  create table public.carts (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null unique references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.cart_items (
    id         uuid primary key default gen_random_uuid(),
    cart_id    uuid not null references public.carts(id) on delete cascade,
    variant_id uuid not null references public.product_variants(id) on delete cascade,
    quantity   integer not null check (quantity between 1 and 10),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cart_items_cart_variant_unique unique (cart_id, variant_id)
  );

  -- carts.user_id is unique, so its constraint already provides the lookup index.
  create index cart_items_cart_idx on public.cart_items(cart_id);
  create index cart_items_variant_idx on public.cart_items(variant_id);

  create trigger carts_updated
    before update on public.carts
    for each row execute function public.set_updated_at();
  create trigger cart_items_updated
    before update on public.cart_items
    for each row execute function public.set_updated_at();

  alter table public.carts enable row level security;
  alter table public.cart_items enable row level security;

  create policy carts_select_own on public.carts
    for select to authenticated
    using (user_id = (select auth.uid()));
  create policy carts_insert_own on public.carts
    for insert to authenticated
    with check (user_id = (select auth.uid()));
  create policy carts_update_own on public.carts
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
  create policy carts_delete_own on public.carts
    for delete to authenticated
    using (user_id = (select auth.uid()));

  create policy cart_items_select_own on public.cart_items
    for select to authenticated
    using (exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    ));
  create policy cart_items_insert_own on public.cart_items
    for insert to authenticated
    with check (exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    ));
  create policy cart_items_update_own on public.cart_items
    for update to authenticated
    using (exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    ))
    with check (exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    ));
  create policy cart_items_delete_own on public.cart_items
    for delete to authenticated
    using (exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    ));

  revoke all on public.carts, public.cart_items from public, anon;
  grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
  grant all on public.carts, public.cart_items to service_role;
end
$migration$;
