-- Nákup bot od Barevie bez registrace: objednávka bez účtu, přístup přes tajný odkaz z e-mailu.

alter table public.bazar_orders alter column buyer_id drop not null;
alter table public.bazar_orders add column if not exists guest_token uuid unique;
alter table public.bazar_orders drop constraint if exists bazar_orders_buyer_or_guest;
alter table public.bazar_orders add constraint bazar_orders_buyer_or_guest check (buyer_id is not null or guest_token is not null);

-- Odkaz na objednávku pro kupujícího (host dostane odkaz s tokenem)
create or replace function private.bazar_buyer_url(p_order_id uuid)
returns text language sql stable security definer set search_path to '' as $$
  select 'https://bazar.barevia.cz/bazar/objednavka/' || o.id || coalesce('?t=' || o.guest_token::text, '')
  from public.bazar_orders o where o.id = p_order_id
$$;

-- Vytvoření objednávky bez účtu (jen boty, které prodává Barevia)
create or replace function public.bazar_create_guest_order(
  p_listing_ids uuid[], p_pickup_point_id text, p_pickup_point_name text,
  p_buyer_name text, p_buyer_email text, p_buyer_phone text default null, p_shipping_method text default 'postovne')
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_ids uuid[];
  v_first public.bazar_listings;
  v_l public.bazar_listings;
  v_total integer := 0;
  v_order_id uuid;
  v_token uuid := gen_random_uuid();
  v_method text := case when p_shipping_method = 'vlastni_stitek' then 'vlastni_stitek' else 'postovne' end;
  v_shipping integer := case when p_shipping_method = 'vlastni_stitek' then 0 else 89 end;
  v_email text := lower(trim(coalesce(p_buyer_email, '')));
  v_id uuid;
begin
  if length(trim(coalesce(p_buyer_name, ''))) < 2 or length(p_buyer_name) > 100 then raise exception 'Vyplňte jméno a příjmení.'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 200 then raise exception 'Zadejte platný e-mail.'; end if;
  if coalesce(length(p_pickup_point_name), 0) = 0 or length(p_pickup_point_name) > 200 then raise exception 'Vyberte výdejní místo.'; end if;
  if (select count(*) from public.bazar_orders o
       where o.buyer_id is null and lower(o.buyer_email) = v_email and o.paid_at is null and o.status = 'ceka_na_postovne') >= 2 then
    raise exception 'Na tento e-mail už čekají nezaplacené rezervace. Nejdřív je prosím zaplaťte.';
  end if;

  select array_agg(x order by ord) into v_ids
    from (select distinct on (x) x, ord from unnest(p_listing_ids) with ordinality as u(x, ord) order by x, ord) s;
  if v_ids is null or array_length(v_ids, 1) = 0 then raise exception 'Inzerát už není k dispozici.'; end if;
  if array_length(v_ids, 1) > 10 then raise exception 'Do jedné objednávky se vejde nejvýš 10 párů.'; end if;

  select * into v_first from public.bazar_listings where id = v_ids[1] for update;
  if not found or v_first.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
  if not exists (select 1 from public.bazar_sellers s where s.user_id = v_first.seller_id and s.is_barevia) then
    raise exception 'Bez registrace jde koupit jen boty od Barevie.';
  end if;
  foreach v_id in array v_ids loop
    select * into v_l from public.bazar_listings where id = v_id for update;
    if not found or v_l.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
    if v_l.seller_id <> v_first.seller_id then raise exception 'Přidat jde jen boty od stejného prodejce.'; end if;
    v_total := v_total + v_l.price_czk;
  end loop;

  insert into public.bazar_orders (listing_id, buyer_id, guest_token, seller_id, price_czk, shipping_czk, shipping_method,
    pickup_point_id, pickup_point_name, buyer_name, buyer_email, buyer_phone)
  values (v_first.id, null, v_token, v_first.seller_id, v_total, v_shipping, v_method,
    left(coalesce(nullif(p_pickup_point_id, ''), p_pickup_point_name), 100), p_pickup_point_name, trim(p_buyer_name), v_email, nullif(trim(coalesce(p_buyer_phone, '')), ''))
  returning id into v_order_id;

  foreach v_id in array v_ids loop
    insert into public.bazar_order_items (order_id, listing_id, price_czk)
      select v_order_id, l.id, l.price_czk from public.bazar_listings l where l.id = v_id;
    update public.bazar_listings set status = 'rezervovano' where id = v_id;
  end loop;
  return jsonb_build_object('id', v_order_id, 'token', v_token);
end $$;
revoke all on function public.bazar_create_guest_order(uuid[], text, text, text, text, text, text) from public;
grant execute on function public.bazar_create_guest_order(uuid[], text, text, text, text, text, text) to anon, authenticated;

-- Detail objednávky pro hosta (jen se správným tokenem)
create or replace function public.bazar_guest_order(p_order_id uuid, p_token uuid)
returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'id', o.id, 'status', o.status, 'created_at', o.created_at, 'price_czk', o.price_czk, 'shipping_czk', o.shipping_czk,
    'shipping_method', o.shipping_method, 'pickup_point_name', o.pickup_point_name, 'buyer_name', o.buyer_name,
    'tracking_info', o.tracking_info, 'paid_at', o.paid_at, 'paid_amount', o.paid_amount, 'cancel_reason', o.cancel_reason,
    'seller_nickname', s.nickname, 'seller_email', u.email, 'seller_phone', sp.phone,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('listing_id', l.id, 'brand', l.brand, 'model', l.model, 'size_eu', l.size_eu, 'price_czk', i.price_czk,
        'photo', (select p.storage_path from public.bazar_listing_photos p where p.listing_id = l.id order by (p.kind = 'celek') desc, p.position limit 1))
        order by i.created_at)
      from public.bazar_order_items i join public.bazar_listings l on l.id = i.listing_id where i.order_id = o.id), '[]'::jsonb),
    'payment', case when o.status <> 'zruseno' and o.paid_at is null then jsonb_build_object(
      'bank_account', sp.bank_account, 'amount_czk', o.price_czk + o.shipping_czk,
      'variable_symbol', right(regexp_replace(o.id::text, '\D', '', 'g'), 10)) end)
  from public.bazar_orders o
  join public.bazar_sellers s on s.user_id = o.seller_id
  join auth.users u on u.id = o.seller_id
  left join public.bazar_seller_private sp on sp.user_id = o.seller_id
  where o.id = p_order_id and o.buyer_id is null and o.guest_token = p_token
$$;
revoke all on function public.bazar_guest_order(uuid, uuid) from public;
grant execute on function public.bazar_guest_order(uuid, uuid) to anon, authenticated;

-- Kontakty: kupující bez účtu nemá přezdívku
create or replace function public.bazar_get_order_contacts(p_order_id uuid)
returns table(role text, nickname text, email text, phone text)
language sql stable security definer set search_path to '' as $$
  select 'prodejce', s.nickname, u.email::text, sp.phone
  from public.bazar_orders o
  join public.bazar_sellers s on s.user_id = o.seller_id
  join auth.users u on u.id = o.seller_id
  left join public.bazar_seller_private sp on sp.user_id = o.seller_id
  where o.id = p_order_id and o.status <> 'zruseno'
    and ((select auth.uid()) = o.buyer_id or private.bazar_is_admin())
  union all
  select 'kupujici', coalesce(s.nickname, 'nákup bez registrace'), o.buyer_email, o.buyer_phone
  from public.bazar_orders o
  left join public.bazar_sellers s on s.user_id = o.buyer_id
  where o.id = p_order_id and o.status <> 'zruseno'
    and ((select auth.uid()) = o.seller_id or private.bazar_is_admin());
$$;

-- E-maily: odkazy pro kupujícího s tokenem, zrušení pro hosta
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('private.bazar_order_notify()'::regprocedure);
  v_def := replace(v_def, 'private.bazar_button(v_url, ''Zobrazit QR platbu'')', 'private.bazar_button(private.bazar_buyer_url(new.id), ''Zobrazit QR platbu'')');
  v_def := replace(v_def, 'potvrďte prosím převzetí v objednávce a ohodnoťte prodejce.</p>''
        || private.bazar_button(v_url, ''Otevřít objednávku'')',
                          'potvrďte prosím převzetí v objednávce a ohodnoťte prodejce.</p>''
        || private.bazar_button(private.bazar_buyer_url(new.id), ''Otevřít objednávku'')');
  execute v_def;

  v_def := pg_get_functiondef('private.bazar_order_cancel_notify()'::regprocedure);
  v_def := replace(v_def,
    'v_other_email := case when v_other = new.buyer_id then new.buyer_email
                        else (select u.email from auth.users u where u.id = v_other) end;',
    'v_other_email := case when new.cancelled_by is not distinct from new.seller_id then new.buyer_email
                        else (select u.email from auth.users u where u.id = new.seller_id) end;');
  v_def := replace(v_def, 'case when v_other = new.seller_id', 'case when new.cancelled_by is distinct from new.seller_id');
  execute v_def;

  v_def := pg_get_functiondef('public.bazar_fio_ingest(jsonb)'::regprocedure);
  v_def := replace(v_def, 'private.bazar_button(v_url, ''Zobrazit objednávku'')', 'private.bazar_button(private.bazar_buyer_url(v_order.id), ''Zobrazit objednávku'')');
  execute v_def;
end $$;

-- Nezaplacené rezervace bez registrace se po 3 dnech samy zruší
select cron.unschedule(jobid) from cron.job where jobname = 'bazar-guest-expire';
select cron.schedule('bazar-guest-expire', '17 * * * *', $cron$
  update public.bazar_orders
     set status = 'zruseno', cancelled_by = seller_id,
         cancel_reason = 'Rezervace nebyla do 3 dnů zaplacena. Pokud jste už platili, napište nám prosím.'
   where buyer_id is null and paid_at is null and status = 'ceka_na_postovne' and created_at < now() - interval '3 days'
$cron$);
