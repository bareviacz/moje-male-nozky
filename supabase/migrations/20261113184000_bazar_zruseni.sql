alter table public.bazar_orders add column cancelled_by uuid references public.bazar_sellers (user_id) on delete set null,
  add column cancel_reason text check (char_length(cancel_reason) <= 500);

drop function public.bazar_cancel_order(uuid);
create function public.bazar_cancel_order(p_order_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.bazar_orders;
begin
  select * into v_order from public.bazar_orders where id = p_order_id for update;
  if not found or (select auth.uid()) not in (v_order.buyer_id, v_order.seller_id) then
    raise exception 'Objednávka nenalezena.';
  end if;
  if v_order.status not in ('ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani') then
    raise exception 'Odeslanou objednávku už zrušit nejde, napište prosím Barevii.';
  end if;
  update public.bazar_orders
     set status = 'zruseno', cancelled_by = (select auth.uid()), cancel_reason = nullif(left(trim(p_reason), 500), '')
   where id = p_order_id;
  update public.bazar_listings set status = 'aktivni' where id = v_order.listing_id and status = 'rezervovano';
end $$;
revoke execute on function public.bazar_cancel_order(uuid, text) from public, anon;
grant execute on function public.bazar_cancel_order(uuid, text) to authenticated;

-- E-mail při zrušení: druhé straně a správcům
create function private.bazar_order_cancel_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_by text;
  v_other uuid;
  v_other_email text;
  v_msg text;
  v_admin record;
begin
  if new.status <> 'zruseno' or old.status = 'zruseno' then return new; end if;
  select l.title into v_title from public.bazar_listings l where l.id = new.listing_id;
  select s.nickname into v_by from public.bazar_sellers s where s.user_id = new.cancelled_by;
  v_other := case when new.cancelled_by = new.buyer_id then new.seller_id else new.buyer_id end;
  v_other_email := case when v_other = new.buyer_id then new.buyer_email
                        else (select u.email from auth.users u where u.id = v_other) end;
  v_msg := '<p>Rezervace bot <strong>' || private.bazar_html(v_title) || '</strong> byla zrušena'
        || coalesce(' (zrušil/a ' || private.bazar_html(v_by) || ')', '') || '.</p>'
        || coalesce('<p>Důvod: ' || private.bazar_html(new.cancel_reason) || '</p>', '')
        || case when old.status <> 'ceka_na_postovne'
                then '<p>Pokud už odešla platba za boty, vraťte si ji prosím navzájem. Poštovné vrátí Barevia.</p>' else '' end;
  if new.cancelled_by is not null then
    perform private.bazar_send_email(v_other_email, 'Rezervace zrušena: ' || v_title,
      v_msg || case when v_other = new.seller_id
                    then '<p>Boty jsou zpátky v nabídce.</p>' || private.bazar_button('https://bazar.barevia.cz/bazar/moje', 'Moje prodeje')
                    else private.bazar_button('https://bazar.barevia.cz/bazar', 'Prohlédnout další boty') end);
  end if;
  for v_admin in select u.email from public.bazar_sellers s join auth.users u on u.id = s.user_id where s.is_admin loop
    perform private.bazar_send_email(v_admin.email, 'Bazar: zrušená objednávka – ' || v_title,
      v_msg || case when old.status <> 'ceka_na_postovne' then '<p><strong>Poštovné už bylo zaplacené – vraťte ho kupujícímu.</strong></p>' else '' end);
  end loop;
  return new;
end $$;
revoke execute on function private.bazar_order_cancel_notify() from public, anon, authenticated;

create trigger bazar_orders_cancel_notify
  after update of status on public.bazar_orders
  for each row execute function private.bazar_order_cancel_notify();
