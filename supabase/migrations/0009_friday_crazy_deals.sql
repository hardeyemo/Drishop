-- Optional, admin-configured variant prices for the recurring Friday offer.
-- NULL means the variant is not part of the promotion.
alter table product_variants
  add column friday_deal_price_kobo int,
  add constraint product_variants_friday_deal_price_check
    check (friday_deal_price_kobo is null or (friday_deal_price_kobo >= 0 and friday_deal_price_kobo < price_kobo));

-- Replace the checkout RPC so both quotes and real orders use configured Friday
-- prices only during 01:00–02:00 in Africa/Lagos. All other checkout logic is
-- retained from 0007_first_order_free_delivery.sql.
create or replace function create_order(
  p_user_id uuid,
  p_email text,
  p_items jsonb,
  p_address jsonb,
  p_discount_code text,
  p_notes text,
  p_free_shipping_threshold_kobo int,
  p_reservation_minutes int default 30,
  p_dry_run boolean default false,
  p_idempotency_key text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record; v record; d record; o record;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_shipping int;
  v_total bigint;
  v_state text := nullif(trim(coalesce(p_address->>'state', '')), '');
  v_order_id uuid;
  v_order_number text;
  v_discount_id uuid;
  v_first_order_free_delivery boolean := false;
  v_has_successful_order boolean := false;
  v_reserved_order_number text;
  v_wat_now timestamp;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'CART_TOO_LARGE'; end if;

  if not p_dry_run then
    perform pg_advisory_xact_lock(hashtextextended('first-order-delivery:' || p_user_id::text, 0));
    if p_idempotency_key is not null then
      select id, order_number into o from orders
      where user_id = p_user_id and idempotency_key = p_idempotency_key;
      if found then return jsonb_build_object('order_id', o.id, 'order_number', o.order_number, 'existing', true); end if;
    end if;
  end if;

  if not p_dry_run then
    if coalesce(p_address->>'recipient_name', '') = '' or coalesce(p_address->>'phone', '') = ''
       or coalesce(p_address->>'line1', '') = '' or coalesce(p_address->>'city', '') = '' or v_state is null then
      raise exception 'INVALID_ADDRESS';
    end if;
  end if;

  select exists (
    select 1 from orders where user_id = p_user_id
      and (paid_at is not null or status in ('paid', 'processing', 'shipped', 'delivered', 'refunded'))
  ) into v_has_successful_order;

  if not v_has_successful_order then
    select order_number into v_reserved_order_number from orders
    where user_id = p_user_id and status = 'pending'
      and (expires_at is null or expires_at > now())
    order by created_at limit 1;
    if found then raise exception 'FIRST_ORDER_OFFER_RESERVED' using detail = v_reserved_order_number; end if;
    v_first_order_free_delivery := true;
  end if;

  -- Use wall-clock time after acquiring any customer lock. now() is fixed at
  -- transaction start and could otherwise misprice a checkout waiting at 1AM/2AM.
  v_wat_now := timezone('Africa/Lagos', clock_timestamp());

  for r in
    select (i->>'variant_id')::uuid as variant_id, sum((i->>'quantity')::int)::int as qty
    from jsonb_array_elements(p_items) i group by 1 order by 1
  loop
    if r.qty < 1 or r.qty > 10 then raise exception 'INVALID_QUANTITY' using detail = r.variant_id::text; end if;

    select pv.id, pv.sku, pv.name as variant_name,
           case when pv.friday_deal_price_kobo is not null
                     and extract(isodow from v_wat_now) = 5
                     and v_wat_now::time >= time '01:00'
                     and v_wat_now::time < time '02:00'
                then pv.friday_deal_price_kobo else pv.price_kobo end as price_kobo,
           pv.stock_quantity, pv.is_active as variant_active,
           p.id as product_id, p.name as product_name, p.slug, p.is_active as product_active
    into v
    from product_variants pv join products p on p.id = pv.product_id
    where pv.id = r.variant_id for update of pv;

    if not found or not v.variant_active or not v.product_active then
      raise exception 'ITEM_UNAVAILABLE' using detail = r.variant_id::text;
    end if;
    if v.stock_quantity < r.qty then raise exception 'OUT_OF_STOCK' using detail = r.variant_id::text; end if;

    if not p_dry_run then update product_variants set stock_quantity = stock_quantity - r.qty where id = v.id; end if;
    v_subtotal := v_subtotal + v.price_kobo::bigint * r.qty;
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v.id, 'product_id', v.product_id, 'slug', v.slug,
      'product_name', v.product_name, 'variant_name', nullif(v.variant_name, 'Default'),
      'sku', v.sku, 'unit_price_kobo', v.price_kobo, 'quantity', r.qty,
      'line_total_kobo', v.price_kobo::bigint * r.qty, 'stock', v.stock_quantity
    );
  end loop;

  if v_subtotal > 2000000000 then raise exception 'CART_TOO_LARGE'; end if;

  if nullif(trim(coalesce(p_discount_code, '')), '') is not null then
    if p_dry_run then select * into d from discounts where code = upper(trim(p_discount_code));
    else select * into d from discounts where code = upper(trim(p_discount_code)) for update; end if;
    if not found or not d.is_active or (d.starts_at is not null and d.starts_at > now())
       or (d.expires_at is not null and d.expires_at <= now()) then
      raise exception 'INVALID_DISCOUNT' using detail = 'unavailable';
    end if;
    if d.max_uses is not null and d.used_count >= d.max_uses then raise exception 'INVALID_DISCOUNT' using detail = 'used_up'; end if;
    if v_subtotal < d.min_order_kobo then raise exception 'INVALID_DISCOUNT' using detail = 'min_order:' || d.min_order_kobo; end if;
    v_discount := case d.type when 'percentage' then floor(v_subtotal * d.value / 100.0) else least(d.value::bigint, v_subtotal) end;
    v_discount_id := d.id;
  end if;

  if v_state is null then v_shipping := null;
  else
    select fee_kobo into v_shipping from shipping_zones where lower(state) = lower(v_state) and is_active;
    if not found then raise exception 'SHIPPING_UNAVAILABLE' using detail = v_state; end if;
    if v_subtotal - v_discount >= p_free_shipping_threshold_kobo or v_first_order_free_delivery then v_shipping := 0; end if;
  end if;

  v_total := v_subtotal - v_discount + coalesce(v_shipping, 0);
  if p_dry_run then
    return jsonb_build_object('lines', v_lines, 'subtotal_kobo', v_subtotal, 'discount_kobo', v_discount,
      'shipping_kobo', v_shipping, 'total_kobo', v_total,
      'first_order_free_delivery', v_first_order_free_delivery);
  end if;

  insert into orders (user_id, email, subtotal_kobo, discount_kobo, shipping_kobo, total_kobo, discount_id,
                      shipping_address, notes, expires_at, idempotency_key, first_order_free_delivery)
  values (p_user_id, lower(p_email), v_subtotal, v_discount, v_shipping, v_total, v_discount_id,
          p_address, left(p_notes, 500), now() + make_interval(mins => p_reservation_minutes), p_idempotency_key,
          v_first_order_free_delivery)
  returning id, order_number into v_order_id, v_order_number;

  insert into order_items (order_id, variant_id, product_name, variant_name, sku, unit_price_kobo, quantity, line_total_kobo)
  select v_order_id, (l->>'variant_id')::uuid, l->>'product_name', l->>'variant_name', l->>'sku',
         (l->>'unit_price_kobo')::int, (l->>'quantity')::int, (l->>'line_total_kobo')::int
  from jsonb_array_elements(v_lines) l;
  insert into order_events (order_id, status, note) values (v_order_id, 'pending', 'Order placed. Awaiting payment.');
  if v_discount_id is not null then update discounts set used_count = used_count + 1 where id = v_discount_id; end if;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'existing', false,
    'subtotal_kobo', v_subtotal, 'discount_kobo', v_discount, 'shipping_kobo', v_shipping,
    'total_kobo', v_total, 'first_order_free_delivery', v_first_order_free_delivery);
end;
$$;

revoke all on function create_order(uuid, text, jsonb, jsonb, text, text, int, int, boolean, text) from public, anon, authenticated;
grant execute on function create_order(uuid, text, jsonb, jsonb, text, text, int, int, boolean, text) to service_role;
