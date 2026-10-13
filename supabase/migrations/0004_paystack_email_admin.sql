-- Paystack confirmation and transactional email deduplication.
create table email_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event text not null check (event in ('paid', 'shipped')),
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  unique (order_id, event)
);
alter table email_notifications enable row level security;

create or replace function claim_order_email(p_order_id uuid, p_event text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into email_notifications (order_id, event, status) values (p_order_id, p_event, 'sending')
  on conflict (order_id, event) do update set status = 'sending'
    where email_notifications.status = 'failed'
  returning id into v_id;
  return v_id;
end $$;
revoke all on function claim_order_email(uuid, text) from public, anon, authenticated;
grant execute on function claim_order_email(uuid, text) to service_role;

alter table payments add column authorization_url text;
create unique index payments_one_initialized_per_order on payments(order_id) where status = 'initialized';

create or replace function confirm_paystack_payment(
  p_reference text,
  p_transaction_id text,
  p_raw jsonb
) returns boolean
language plpgsql security definer set search_path = public as $$
declare p payments%rowtype; o orders%rowtype;
begin
  select * into p from payments where provider = 'paystack' and reference = p_reference for update;
  if not found then return false; end if;
  if p.status = 'succeeded' then return true; end if;
  select * into o from orders where id = p.order_id for update;
  if not found or o.status <> 'pending' then return false; end if;
  update payments set status = 'succeeded', provider_transaction_id = p_transaction_id,
    raw = p_raw, verified_at = now() where id = p.id;
  update orders set status = 'paid', paid_at = now(), expires_at = null where id = o.id;
  insert into order_events (order_id, status, note) values (o.id, 'paid', 'Paystack payment confirmed.');
  return true;
end $$;
revoke all on function confirm_paystack_payment(text, text, jsonb) from public, anon, authenticated;
grant execute on function confirm_paystack_payment(text, text, jsonb) to service_role;
