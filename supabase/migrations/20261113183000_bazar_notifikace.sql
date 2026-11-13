-- =====================================================================
-- Bazárek: kontakty mezi kupujícím a prodejcem + e-mailová upozornění
-- E-maily posílá databáze přes Resend (pg_net). Dokud ve Vaultu není
-- tajný klíč „resend_api_key“, nic se neposílá a nic se nerozbije.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- ---------- Kontakty po rezervaci ----------
-- Kupující uvidí e-mail a telefon prodejce, prodejce e-mail a telefon kupujícího.
create function public.bazar_get_order_contacts(p_order_id uuid)
returns table (role text, nickname text, email text, phone text)
language sql stable security definer set search_path = '' as $$
  -- pro kupujícího (a správce): prodejce
  select 'prodejce', s.nickname, u.email::text, sp.phone
  from public.bazar_orders o
  join public.bazar_sellers s on s.user_id = o.seller_id
  join auth.users u on u.id = o.seller_id
  left join public.bazar_seller_private sp on sp.user_id = o.seller_id
  where o.id = p_order_id and o.status <> 'zruseno'
    and ((select auth.uid()) = o.buyer_id or private.bazar_is_admin())
  union all
  -- pro prodejce (a správce): kupující
  select 'kupujici', s.nickname, o.buyer_email, o.buyer_phone
  from public.bazar_orders o
  join public.bazar_sellers s on s.user_id = o.buyer_id
  where o.id = p_order_id and o.status <> 'zruseno'
    and ((select auth.uid()) = o.seller_id or private.bazar_is_admin());
$$;
revoke execute on function public.bazar_get_order_contacts(uuid) from public, anon;
grant execute on function public.bazar_get_order_contacts(uuid) to authenticated;

-- ---------- Odesílání e-mailů ----------
create function private.bazar_html(t text)
returns text language sql immutable set search_path = '' as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

create function private.bazar_send_email(p_to text, p_subject text, p_html text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_key text;
begin
  if p_to is null or p_to = '' then return; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null or v_key = '' then return; end if;   -- e-maily zatím nejsou zapnuté

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'Bazárek Barevia <noreply@barevia.cz>',
      'to', jsonb_build_array(p_to),
      'subject', p_subject,
      'html',
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1D2433;max-width:560px">'
        || p_html
        || '<p style="margin-top:28px;font-size:13px;color:#5B6472">Bazárek Barevia · <a href="https://bazar.barevia.cz" style="color:#1F6F5C">bazar.barevia.cz</a><br>'
        || 'Tento e-mail vám přišel, protože používáte Bazárek Barevia.</p></div>'
    )
  );
exception when others then
  -- E-mail nesmí nikdy zablokovat objednávku ani zprávu
  raise warning 'bazar_send_email: %', sqlerrm;
end $$;

create function private.bazar_button(p_url text, p_label text)
returns text language sql immutable set search_path = '' as $$
  select '<p><a href="' || p_url || '" style="display:inline-block;background:#1F6F5C;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">'
         || private.bazar_html(p_label) || '</a></p>';
$$;

-- ---------- Nová objednávka a změny stavu ----------
create function private.bazar_order_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_seller_email text;
  v_buyer_nick text;
  v_url text := 'https://bazar.barevia.cz/bazar/objednavka/' || new.id;
  v_admin record;
begin
  select l.title into v_title from public.bazar_listings l where l.id = new.listing_id;
  select u.email into v_seller_email from auth.users u where u.id = new.seller_id;
  select s.nickname into v_buyer_nick from public.bazar_sellers s where s.user_id = new.buyer_id;

  if tg_op = 'INSERT' then
    -- Prodejci: prodáno + kontakt na kupujícího
    perform private.bazar_send_email(
      v_seller_email,
      'Prodáno: ' || v_title,
      '<h2 style="margin:0 0 12px">Vaše boty si někdo rezervoval 🎉</h2>'
      || '<p><strong>' || private.bazar_html(v_title) || '</strong> za ' || new.price_czk || ' Kč.</p>'
      || '<p>Kupující: <strong>' || private.bazar_html(new.buyer_name) || '</strong> (' || private.bazar_html(v_buyer_nick) || ')<br>'
      || 'E-mail: <a href="mailto:' || private.bazar_html(new.buyer_email) || '">' || private.bazar_html(new.buyer_email) || '</a>'
      || coalesce('<br>Telefon: ' || private.bazar_html(new.buyer_phone), '')
      || '<br>Doručení: ' || private.bazar_html(new.pickup_point_name) || '</p>'
      || '<p>Kupující teď platí poštovné a pak vám pošle ' || new.price_czk || ' Kč na účet. Boty zatím neposílejte – '
      || 'až bude vše zaplacené, uvidíte u objednávky podací kód do Z-BOXu.</p>'
      || private.bazar_button(v_url, 'Otevřít objednávku')
    );
    -- Kupujícímu: potvrzení rezervace
    perform private.bazar_send_email(
      new.buyer_email,
      'Rezervace: ' || v_title,
      '<h2 style="margin:0 0 12px">Boty máte rezervované</h2>'
      || '<p><strong>' || private.bazar_html(v_title) || '</strong> za ' || new.price_czk || ' Kč + poštovné ' || new.shipping_czk || ' Kč.</p>'
      || '<p>Doručení: ' || private.bazar_html(new.pickup_point_name) || '</p>'
      || '<p>Teď je potřeba zaplatit poštovné. Jakmile dorazí, uvidíte u objednávky QR kód pro platbu prodejci.</p>'
      || private.bazar_button(v_url, 'Otevřít objednávku')
    );
    -- Správcům Barevie
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
    if new.status = 'postovne_zaplaceno' then
      perform private.bazar_send_email(
        new.buyer_email,
        'Zaplaťte boty prodejci: ' || v_title,
        '<p>Poštovné je zaplacené, díky! Teď pošlete <strong>' || new.price_czk || ' Kč</strong> prodejci – QR kód pro platbu najdete u objednávky.</p>'
        || private.bazar_button(v_url, 'Zobrazit QR platbu')
      );
    elsif new.status = 'k_odeslani' then
      perform private.bazar_send_email(
        v_seller_email,
        'Pošlete boty: ' || v_title,
        '<p>Poštovné je zaplacené a kupující vám posílá ' || new.price_czk || ' Kč. Jakmile vám platba dorazí, pošlete boty.</p>'
        || coalesce('<p>Podací kód Zásilkovny: <strong style="font-size:20px;letter-spacing:2px">' || private.bazar_html(new.submission_code) || '</strong>'
           || coalesce('<br>Na balík napište velkým písmem: <strong>' || private.bazar_html(new.packeta_barcode) || '</strong>', '') || '</p>', '')
        || '<p>U libovolného Z-BOXu zvolte Odeslat zásilku, zadejte kód a balík vložte. Nic se netiskne.</p>'
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

create trigger bazar_orders_notify
  after insert or update on public.bazar_orders
  for each row execute function private.bazar_order_notify();

-- ---------- Nová zpráva ----------
create function private.bazar_message_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_to text;
  v_from text;
  v_title text;
  v_order uuid;
  v_url text;
begin
  select u.email into v_to from auth.users u where u.id = new.recipient_id;
  select s.nickname into v_from from public.bazar_sellers s where s.user_id = new.sender_id;
  select l.title into v_title from public.bazar_listings l where l.id = new.listing_id;
  select o.id into v_order from public.bazar_orders o
   where o.listing_id = new.listing_id and o.status <> 'zruseno'
     and new.sender_id in (o.buyer_id, o.seller_id) and new.recipient_id in (o.buyer_id, o.seller_id)
   limit 1;
  v_url := case when v_order is not null
                then 'https://bazar.barevia.cz/bazar/objednavka/' || v_order
                else 'https://bazar.barevia.cz/bazar/moje#zpravy' end;

  perform private.bazar_send_email(
    v_to,
    'Nová zpráva od ' || coalesce(v_from, 'uživatele') || ': ' || v_title,
    '<p><strong>' || private.bazar_html(v_from) || '</strong> vám napsal/a k inzerátu <strong>' || private.bazar_html(v_title) || '</strong>:</p>'
    || '<blockquote style="margin:0;padding:12px 16px;background:#F4F1EA;border-radius:12px;white-space:pre-line">'
    || private.bazar_html(left(new.body, 1000)) || '</blockquote>'
    || private.bazar_button(v_url, 'Odpovědět')
  );
  return new;
end $$;

create trigger bazar_messages_notify
  after insert on public.bazar_messages
  for each row execute function private.bazar_message_notify();

revoke execute on function private.bazar_send_email(text, text, text) from public, anon, authenticated;
revoke execute on function private.bazar_order_notify() from public, anon, authenticated;
revoke execute on function private.bazar_message_notify() from public, anon, authenticated;
