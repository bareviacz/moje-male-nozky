-- Po označení „Odesláno“ se inzerát rovnou přepne na prodaný a zmizí z nabídky.
create or replace function public.bazar_mark_shipped(p_order_id uuid, p_tracking text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_listing uuid;
begin
  update public.bazar_orders
     set status = 'na_ceste', tracking_info = nullif(left(trim(p_tracking), 120), '')
   where id = p_order_id and seller_id = (select auth.uid())
     and status in ('ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani')
  returning listing_id into v_listing;
  if v_listing is null then raise exception 'Objednávku nelze označit jako odeslanou.'; end if;
  update public.bazar_listings set status = 'prodano' where id = v_listing;
end $$;

update public.bazar_listings l set status = 'prodano'
 where l.status = 'rezervovano'
   and exists (select 1 from public.bazar_orders o where o.listing_id = l.id and o.status in ('na_ceste', 'doruceno', 'dokonceno'));
