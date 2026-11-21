-- Výběr více bot od jednoho prodejce už při rezervaci (jedna objednávka, poštovné jednou).

-- E-mail o nové objednávce posílat až na konci transakce, kdy už jsou zapsané všechny páry.
drop trigger if exists bazar_orders_notify on public.bazar_orders;
drop trigger if exists bazar_orders_notify_insert on public.bazar_orders;
create trigger bazar_orders_notify after update on public.bazar_orders
  for each row execute function private.bazar_order_notify();
create constraint trigger bazar_orders_notify_insert after insert on public.bazar_orders
  deferrable initially deferred for each row execute function private.bazar_order_notify();

create or replace function public.bazar_create_order_multi(
  p_listing_ids uuid[], p_pickup_point_id text, p_pickup_point_name text,
  p_buyer_name text, p_buyer_email text, p_buyer_phone text default null, p_shipping_method text default 'postovne')
returns uuid language plpgsql security definer set search_path to '' as $$
declare
  v_ids uuid[];
  v_first public.bazar_listings;
  v_l public.bazar_listings;
  v_total integer := 0;
  v_order_id uuid;
  v_method text := case when p_shipping_method = 'vlastni_stitek' then 'vlastni_stitek' else 'postovne' end;
  v_shipping integer := case when p_shipping_method = 'vlastni_stitek' then 0 else 89 end;
  v_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Nejste přihlášeni.'; end if;
  if not exists (select 1 from public.bazar_sellers where user_id = (select auth.uid())) then
    raise exception 'Nejdřív si v bazaru nastavte přezdívku.';
  end if;
  -- zachovat pořadí, bez duplicit
  select array_agg(x order by ord) into v_ids
    from (select distinct on (x) x, ord from unnest(p_listing_ids) with ordinality as u(x, ord) order by x, ord) s;
  if v_ids is null or array_length(v_ids, 1) = 0 then raise exception 'Inzerát už není k dispozici.'; end if;
  if array_length(v_ids, 1) > 10 then raise exception 'Do jedné objednávky se vejde nejvýš 10 párů.'; end if;

  select * into v_first from public.bazar_listings where id = v_ids[1] for update;
  if not found or v_first.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
  if v_first.seller_id = (select auth.uid()) then raise exception 'Vlastní boty si koupit nemůžete.'; end if;

  foreach v_id in array v_ids loop
    select * into v_l from public.bazar_listings where id = v_id for update;
    if not found or v_l.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
    if v_l.seller_id <> v_first.seller_id then raise exception 'Přidat jde jen boty od stejného prodejce.'; end if;
    v_total := v_total + v_l.price_czk;
  end loop;

  insert into public.bazar_orders (listing_id, buyer_id, seller_id, price_czk, shipping_czk, shipping_method,
    pickup_point_id, pickup_point_name, buyer_name, buyer_email, buyer_phone)
  values (v_first.id, (select auth.uid()), v_first.seller_id, v_total, v_shipping, v_method,
    p_pickup_point_id, p_pickup_point_name, p_buyer_name, p_buyer_email, p_buyer_phone)
  returning id into v_order_id;

  foreach v_id in array v_ids loop
    insert into public.bazar_order_items (order_id, listing_id, price_czk)
      select v_order_id, l.id, l.price_czk from public.bazar_listings l where l.id = v_id;
    update public.bazar_listings set status = 'rezervovano' where id = v_id;
  end loop;
  return v_order_id;
end $$;
revoke all on function public.bazar_create_order_multi(uuid[], text, text, text, text, text, text) from public, anon;
grant execute on function public.bazar_create_order_multi(uuid[], text, text, text, text, text, text) to authenticated;
