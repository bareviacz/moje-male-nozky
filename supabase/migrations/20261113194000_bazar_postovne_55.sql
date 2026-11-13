-- =====================================================================
-- Bazárek: poštovné 55 Kč se přičítá k ceně bot.
-- Kupující platí prodejci jedním QR kódem (cena + poštovné), prodejce z toho
-- zaplatí odeslání přes aplikaci dopravce.
-- =====================================================================

create or replace function public.bazar_create_order(
  p_listing_id uuid, p_pickup_point_id text, p_pickup_point_name text,
  p_buyer_name text, p_buyer_email text, p_buyer_phone text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_listing public.bazar_listings;
  v_order_id uuid;
  v_shipping constant integer := 55;   -- poštovné v Kč, přičítá se k ceně bot (platí prodejci)
begin
  if (select auth.uid()) is null then raise exception 'Nejste přihlášeni.'; end if;
  if not exists (select 1 from public.bazar_sellers where user_id = (select auth.uid())) then
    raise exception 'Nejdřív si v bazaru nastavte přezdívku.';
  end if;
  select * into v_listing from public.bazar_listings where id = p_listing_id for update;
  if not found or v_listing.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
  if v_listing.seller_id = (select auth.uid()) then raise exception 'Vlastní boty si koupit nemůžete.'; end if;

  insert into public.bazar_orders (listing_id, buyer_id, seller_id, price_czk, shipping_czk,
    pickup_point_id, pickup_point_name, buyer_name, buyer_email, buyer_phone)
  values (v_listing.id, (select auth.uid()), v_listing.seller_id, v_listing.price_czk, v_shipping,
    p_pickup_point_id, p_pickup_point_name, p_buyer_name, p_buyer_email, p_buyer_phone)
  returning id into v_order_id;

  update public.bazar_listings set status = 'rezervovano' where id = v_listing.id;
  return v_order_id;
end $$;


create or replace function public.bazar_get_payment_details(p_order_id uuid)
returns table (bank_account text, amount_czk integer, variable_symbol text, seller_nickname text)
language sql stable security definer set search_path = '' as $$
  select sp.bank_account, o.price_czk + o.shipping_czk,
         right(regexp_replace(o.id::text, '\D', '', 'g'), 10),
         s.nickname
  from public.bazar_orders o
  join public.bazar_seller_private sp on sp.user_id = o.seller_id
  join public.bazar_sellers s on s.user_id = o.seller_id
  where o.id = p_order_id
    and (select auth.uid()) in (o.buyer_id, o.seller_id)
    and o.status <> 'zruseno';
$$;

create or replace function private.bazar_order_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_seller_email text;
  v_buyer_nick text;
  v_seller_nick text;
  v_url text := 'https://bazar.barevia.cz/bazar/objednavka/' || new.id;
  v_admin record;
begin
  select l.title into v_title from public.bazar_listings l where l.id = new.listing_id;
  select u.email into v_seller_email from auth.users u where u.id = new.seller_id;
  select s.nickname into v_buyer_nick from public.bazar_sellers s where s.user_id = new.buyer_id;
  select s.nickname into v_seller_nick from public.bazar_sellers s where s.user_id = new.seller_id;

  if tg_op = 'INSERT' then
    perform private.bazar_send_email(
      v_seller_email,
      'Prodáno: ' || v_title,
      '<h2 style="margin:0 0 12px">Vaše boty si někdo rezervoval 🎉</h2>'
      || '<p><strong>' || private.bazar_html(v_title) || '</strong> za ' || new.price_czk || ' Kč.</p>'
      || '<p>Kupující: <strong>' || private.bazar_html(new.buyer_name) || '</strong> (' || private.bazar_html(v_buyer_nick) || ')<br>'
      || 'E-mail: <a href="mailto:' || private.bazar_html(new.buyer_email) || '">' || private.bazar_html(new.buyer_email) || '</a>'
      || coalesce('<br>Telefon: ' || private.bazar_html(new.buyer_phone), '')
      || '<br>Doručení: ' || private.bazar_html(new.pickup_point_name) || '</p>'
      || '<p>Kupující vám pošle ' || (new.price_czk + new.shipping_czk) || ' Kč QR platbou na účet ('
      || new.price_czk || ' Kč za boty + ' || new.shipping_czk || ' Kč na poštovné). Až platba dorazí, pošlete boty na vybrané '
      || 'výdejní místo a v objednávce klikněte na „Odesláno“.</p>'
      || private.bazar_button(v_url, 'Otevřít objednávku')
    );
    perform private.bazar_send_email(
      new.buyer_email,
      'Rezervace: ' || v_title,
      '<h2 style="margin:0 0 12px">Boty máte rezervované</h2>'
      || '<p><strong>' || private.bazar_html(v_title) || '</strong> od prodejce ' || private.bazar_html(v_seller_nick) || ': '
      || new.price_czk || ' Kč + poštovné ' || new.shipping_czk || ' Kč = <strong>' || (new.price_czk + new.shipping_czk) || ' Kč</strong>.</p>'
      || '<p>Doručení: ' || private.bazar_html(new.pickup_point_name) || '</p>'
      || '<p>Zaplaťte prodejci QR kódem u objednávky. Prodejce pak boty pošle a dá vám vědět.</p>'
      || private.bazar_button(v_url, 'Zobrazit QR platbu')
    );
    for v_admin in
      select u.email from public.bazar_sellers s join auth.users u on u.id = s.user_id where s.is_admin
    loop
      perform private.bazar_send_email(
        v_admin.email,
        'Bazar: nová objednávka – ' || v_title,
        '<p>Nová rezervace v bazaru: <strong>' || private.bazar_html(v_title) || '</strong> za ' || new.price_czk || ' Kč.</p>'
        || '<p>Kupující: ' || private.bazar_html(new.buyer_name) || ', ' || private.bazar_html(new.buyer_email)
        || coalesce(', ' || private.bazar_html(new.buyer_phone), '') || '<br>Doručení: ' || private.bazar_html(new.pickup_point_name) || '</p>'
        || private.bazar_button('https://bazar.barevia.cz/bazar/admin', 'Otevřít správu bazaru')
      );
    end loop;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'na_ceste' then
      perform private.bazar_send_email(
        new.buyer_email,
        'Boty jsou na cestě: ' || v_title,
        '<p>Prodejce ' || private.bazar_html(v_seller_nick) || ' vám poslal/a boty <strong>' || private.bazar_html(v_title) || '</strong>.</p>'
        || coalesce('<p>Číslo zásilky: <strong>' || private.bazar_html(new.tracking_info) || '</strong></p>', '')
        || '<p>Až si je vyzvednete, potvrďte prosím převzetí v objednávce a ohodnoťte prodejce.</p>'
        || private.bazar_button(v_url, 'Otevřít objednávku')
      );
    elsif new.status = 'k_odeslani' then
      perform private.bazar_send_email(
        v_seller_email,
        'Pošlete boty: ' || v_title,
        '<p>Můžete poslat boty. Jakmile vám dorazí platba ' || (new.price_czk + new.shipping_czk) || ' Kč, balík odešlete.</p>'
        || coalesce('<p>Podací kód: <strong style="font-size:20px;letter-spacing:2px">' || private.bazar_html(new.submission_code) || '</strong>'
           || coalesce('<br>Na balík napište velkým písmem: <strong>' || private.bazar_html(new.packeta_barcode) || '</strong>', '') || '</p>', '')
        || private.bazar_button(v_url, 'Otevřít objednávku')
      );
    elsif new.status = 'dokonceno' then
      perform private.bazar_send_email(
        v_seller_email,
        'Hotovo: ' || v_title,
        '<p>Kupující potvrdil/a, že boty dorazily v pořádku. Děkujeme, že jim dáváte druhý život!</p>'
        || private.bazar_button('https://bazar.barevia.cz/bazar/prodat', 'Prodat další boty')
      );
    end if;
  end if;
  return new;
end $$;
