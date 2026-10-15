-- Enforce the minimum against merchandise subtotal, before delivery and discounts.
-- The trigger protects every order insertion path, including direct service-role calls.
create or replace function enforce_minimum_cart_subtotal()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.subtotal_kobo < 1000000 then
    raise exception 'MINIMUM_CART_SUBTOTAL';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_minimum_cart_subtotal on orders;
create trigger orders_minimum_cart_subtotal
before insert on orders
for each row execute function enforce_minimum_cart_subtotal();
