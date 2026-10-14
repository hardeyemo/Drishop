-- Drishop schema. All money is stored as integer kobo (NGN * 100).
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- enums ----------
create type user_role      as enum ('customer', 'admin');
create type order_status   as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_status as enum ('initialized', 'succeeded', 'failed', 'abandoned');
create type discount_type  as enum ('percentage', 'fixed');

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  role       user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Signed-in customers can edit their profile but never their own role.
-- (auth.uid() is null for the SQL editor and the service role, so those can promote admins.)
create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on profiles
  for each row execute function prevent_role_escalation();

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- catalogue ----------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index categories_parent_idx on categories(parent_id);

create table products (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references categories(id) on delete restrict,
  name            text not null,
  slug            text not null unique,
  brand           text,
  description     text,
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  -- Denormalised from variants by trigger so listing, filtering and sorting stay fast.
  min_price_kobo  int  not null default 0 check (min_price_kobo >= 0),
  compare_at_kobo int  check (compare_at_kobo is null or compare_at_kobo > 0),
  total_stock     int  not null default 0 check (total_stock >= 0),
  -- Denormalised from approved reviews / paid orders.
  rating_avg      numeric(3,2) not null default 0,
  rating_count    int  not null default 0,
  units_sold      int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_idx  on products(category_id) where is_active;
create index products_price_idx     on products(min_price_kobo) where is_active;
create index products_created_idx   on products(created_at desc) where is_active;
create index products_sold_idx      on products(units_sold desc) where is_active;
create index products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index products_brand_trgm_idx on products using gin (brand gin_trgm_ops);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

create table product_variants (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references products(id) on delete cascade,
  sku                  text not null unique,
  name                 text not null default 'Default',
  options              jsonb not null default '{}'::jsonb,   -- e.g. {"storage":"128GB"}
  price_kobo           int  not null check (price_kobo >= 0),
  compare_at_price_kobo int check (compare_at_price_kobo is null or compare_at_price_kobo > price_kobo),
  stock_quantity       int  not null default 0 check (stock_quantity >= 0),  -- DB refuses negative stock
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index variants_product_idx on product_variants(product_id);
create trigger variants_updated before update on product_variants
  for each row execute function set_updated_at();

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text,
  sort_order int  not null default 0
);
create index product_images_product_idx on product_images(product_id, sort_order);

create or replace function refresh_product_aggregates(p_product_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select price_kobo, compare_at_price_kobo into v
  from product_variants
  where product_id = p_product_id and is_active
  order by price_kobo asc, created_at asc limit 1;

  update products set
    min_price_kobo  = coalesce(v.price_kobo, 0),
    compare_at_kobo = v.compare_at_price_kobo,
    total_stock     = coalesce((select sum(stock_quantity) from product_variants
                                where product_id = p_product_id and is_active), 0)
  where id = p_product_id;
end $$;

create or replace function trg_variants_refresh() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then perform refresh_product_aggregates(new.product_id); end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.product_id <> new.product_id) then
    perform refresh_product_aggregates(old.product_id);
  end if;
  return null;
end $$;
create trigger variants_refresh after insert or update or delete on product_variants
  for each row execute function trg_variants_refresh();

-- ---------- reviews ----------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on reviews(product_id) where is_approved;

create or replace function trg_reviews_refresh() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update products p set
    rating_avg   = coalesce((select round(avg(rating)::numeric, 2) from reviews where product_id = pid and is_approved), 0),
    rating_count = (select count(*) from reviews where product_id = pid and is_approved)
  where p.id = pid;
  return null;
end $$;
create trigger reviews_refresh after insert or update or delete on reviews
  for each row execute function trg_reviews_refresh();

-- ---------- customer data ----------
create table addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  label          text,
  recipient_name text not null,
  phone          text not null,
  line1          text not null,
  line2          text,
  city           text not null,
  state          text not null,
  country        text not null default 'NG',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index addresses_user_idx on addresses(user_id);
create unique index addresses_one_default_idx on addresses(user_id) where is_default;

create table wishlists (
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- shipping & discounts ----------
create table shipping_zones (
  id        uuid primary key default gen_random_uuid(),
  state     text not null unique,
  fee_kobo  int  not null check (fee_kobo >= 0),
  is_active boolean not null default true
);

create table discounts (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code = upper(code)),
  type           discount_type not null,
  value          int  not null check (value > 0),          -- percent (1-100) or kobo
  min_order_kobo int  not null default 0,
  max_uses       int,
  used_count     int  not null default 0,
  starts_at      timestamptz,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  check (type <> 'percentage' or value <= 100)
);

-- ---------- orders & payments ----------
create sequence order_number_seq start 1001;

create table orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('SHP-' || lpad(nextval('order_number_seq')::text, 6, '0')),
  user_id          uuid references profiles(id) on delete set null,
  email            text not null,
  status           order_status not null default 'pending',
  subtotal_kobo    int not null check (subtotal_kobo >= 0),
  discount_kobo    int not null default 0 check (discount_kobo >= 0),
  shipping_kobo    int not null default 0 check (shipping_kobo >= 0),
  total_kobo       int not null check (total_kobo >= 0),
  currency         text not null default 'NGN',
  discount_id      uuid references discounts(id) on delete set null,
  shipping_address jsonb not null,
  notes            text,
  carrier          text,
  tracking_number  text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- The database itself rejects an order whose total does not add up.
  check (total_kobo = subtotal_kobo - discount_kobo + shipping_kobo)
);
create index orders_user_idx   on orders(user_id, created_at desc);
create index orders_status_idx on orders(status, created_at desc);
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  variant_id       uuid references product_variants(id) on delete set null,
  product_name     text not null,      -- snapshots: survive later edits/deletes
  variant_name     text,
  sku              text,
  unit_price_kobo  int  not null check (unit_price_kobo >= 0),
  quantity         int  not null check (quantity > 0),
  line_total_kobo  int  not null check (line_total_kobo = unit_price_kobo * quantity)
);
create index order_items_order_idx on order_items(order_id);

create table order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     order_status not null,
  note       text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events(order_id, created_at);

create table payments (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references orders(id) on delete restrict,
  provider                text not null,                 -- 'paystack' | 'flutterwave' | ...
  reference               text not null unique,          -- one reference can never be processed twice
  amount_kobo             int  not null check (amount_kobo >= 0),
  currency                text not null default 'NGN',
  status                  payment_status not null default 'initialized',
  provider_transaction_id text,
  raw                     jsonb,
  created_at              timestamptz not null default now(),
  verified_at             timestamptz
);
create index payments_order_idx on payments(order_id);
create unique index payments_provider_txn_idx on payments(provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- Idempotency log for signed webhooks: a replayed event hits the unique key.
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  event_type   text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)
);
