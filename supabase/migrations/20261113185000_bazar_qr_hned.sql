-- QR platba hned po rezervaci; vidí ji kupující i prodejce (prodejce kvůli kontrole platby podle VS)
create or replace function public.bazar_get_payment_details(p_order_id uuid)
returns table (bank_account text, amount_czk integer, variable_symbol text, seller_nickname text)
language sql stable security definer set search_path = '' as $$
  select sp.bank_account, o.price_czk,
         right(regexp_replace(o.id::text, '\D', '', 'g'), 10),
         s.nickname
  from public.bazar_orders o
  join public.bazar_seller_private sp on sp.user_id = o.seller_id
  join public.bazar_sellers s on s.user_id = o.seller_id
  where o.id = p_order_id
    and (select auth.uid()) in (o.buyer_id, o.seller_id)
    and o.status <> 'zruseno';
$$;
