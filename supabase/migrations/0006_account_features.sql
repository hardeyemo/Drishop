-- Account notifications and privacy-preserving account deletion.

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 160),
  body       text check (body is null or char_length(body) <= 2000),
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where read_at is null;
alter table notifications enable row level security;
create policy notifications_read_own on notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_own on notifications
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy notifications_delete_own on notifications
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on notifications from public, anon;
grant select, update, delete on notifications to authenticated;
grant all on notifications to service_role;

create or replace function notify_customer_of_order_status()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  if new.user_id is null or (tg_op = 'UPDATE' and new.status is not distinct from old.status) then
    return new;
  end if;

  v_title := case new.status
    when 'pending' then 'Order received'
    when 'paid' then 'Payment confirmed'
    when 'processing' then 'Order processing'
    when 'shipped' then 'Order shipped'
    when 'delivered' then 'Order delivered'
    when 'cancelled' then 'Order cancelled'
    when 'refunded' then 'Order refunded'
  end;

  insert into notifications(user_id, title, body, href)
  values (new.user_id, v_title, 'Order ' || new.order_number || ' is now ' || new.status::text || '.',
          '/account/orders/' || new.order_number);
  return new;
end;
$$;
revoke all on function notify_customer_of_order_status() from public, anon, authenticated;
create trigger orders_notify_status_change
  after insert or update on orders
  for each row execute function notify_customer_of_order_status();

-- Keep order and payment facts for accounting and dispute history, but remove
-- direct customer and delivery details before their profile is cascade-deleted.
create or replace function anonymize_customer_orders_before_profile_delete()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_order_ids uuid[];
  v_references text[];
begin
  select coalesce(array_agg(id), '{}'::uuid[]) into v_order_ids
  from orders where user_id = old.id;

  select coalesce(array_agg(reference), '{}'::text[]) into v_references
  from payments where order_id = any(v_order_ids);

  update orders
  set user_id = null,
      email = 'deleted+' || id::text || '@redacted.invalid',
      shipping_address = jsonb_build_object(
        'recipient_name', 'Account deleted',
        'phone', '',
        'line1', '',
        'line2', '',
        'city', '',
        'state', '',
        'country', coalesce(shipping_address->'country', '"NG"'::jsonb)
      ),
      notes = null
  where id = any(v_order_ids);

  update payments p
  set raw = case when p.raw is null then null
                 else p.raw - 'customer' - 'authorization' - 'metadata' end
  where p.order_id = any(v_order_ids);

  update webhook_events w
  set payload = jsonb_set(
    w.payload,
    '{data}',
    (w.payload->'data') - 'customer' - 'authorization' - 'metadata',
    true
  )
  where w.provider = 'paystack'
    and w.payload ? 'data'
    and w.payload->'data'->>'reference' in (
      select unnest(v_references)
    );

  return old;
end;
$$;
revoke all on function anonymize_customer_orders_before_profile_delete() from public, anon, authenticated;
create trigger profiles_anonymize_orders_before_delete
  before delete on profiles
  for each row execute function anonymize_customer_orders_before_profile_delete();
