-- Více bot v jedné objednávce: kupující k rezervaci přidá další boty od stejného prodejce,
-- platí jednou (boty + poštovné jednou) a dostane jeden balík.

create table if not exists public.bazar_order_items (
  order_id uuid not null references public.bazar_orders(id) on delete cascade,
  listing_id uuid not null references public.bazar_listings(id) on delete restrict,
  price_czk integer not null check (price_czk >= 0),
  created_at timestamptz not null default now(),
  primary key (order_id, listing_id)
);
create index if not exists bazar_order_items_listing_idx on public.bazar_order_items(listing_id);

alter table public.bazar_order_items enable row level security;

drop policy if exists "bazar_order_items_select" on public.bazar_order_items;
create policy "bazar_order_items_select" on public.bazar_order_items
  for select to authenticated
  using (exists (
    select 1 from public.bazar_orders o
    where o.id = order_id
      and ((select auth.uid()) in (o.buyer_id, o.seller_id)
           or exists (select 1 from public.bazar_sellers s where s.user_id = (select auth.uid()) and s.is_admin))
  ));

grant select on public.bazar_order_items to authenticated;

-- Stávající objednávky = jedna položka
insert into public.bazar_order_items (order_id, listing_id, price_czk, created_at)
select o.id, o.listing_id, o.price_czk, o.created_at from public.bazar_orders o
on conflict do nothing;

-- Název objednávky do e-mailů: "první boty + 2 další"
create or replace function private.bazar_order_title(p_order_id uuid, p_listing_id uuid)
returns text language sql stable security definer set search_path to '' as $$
  select l.title || case when n.cnt > 1 then ' + ' || (n.cnt - 1) || case when n.cnt - 1 = 1 then ' další pár' when n.cnt - 1 < 5 then ' další páry' else ' dalších párů' end else '' end
  from public.bazar_listings l
  cross join (select count(*) cnt from public.bazar_order_items i where i.order_id = p_order_id) n
  where l.id = p_listing_id;
$$;

-- Nová objednávka zapíše i položku
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.bazar_create_order(uuid,text,text,text,text,text,text)'::regprocedure);
  if position('bazar_order_items' in v_def) = 0 then
    v_def := replace(v_def,
      'update public.bazar_listings set status = ''rezervovano'' where id = v_listing.id;',
      'insert into public.bazar_order_items (order_id, listing_id, price_czk) values (v_order_id, v_listing.id, v_listing.price_czk);
  update public.bazar_listings set status = ''rezervovano'' where id = v_listing.id;');
    execute v_def;
  end if;
end $$;

-- E-maily: titulek se všemi páry
do $$
declare v_fn text; v_def text;
begin
  foreach v_fn in array array['private.bazar_order_notify()', 'private.bazar_order_cancel_notify()', 'private.bazar_label_notify()'] loop
    v_def := pg_get_functiondef(v_fn::regprocedure);
    v_def := replace(v_def,
      'select l.title into v_title from public.bazar_listings l where l.id = new.listing_id;',
      'v_title := private.bazar_order_title(new.id, new.listing_id);');
    execute v_def;
  end loop;
end $$;

-- Stav všech bot v objednávce se řídí stavem objednávky (zrušení, odeslání, dokončení i ruční změna ve správě)
create or replace function private.bazar_order_items_sync()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'zruseno' then
    update public.bazar_listings l set status = 'aktivni'
      from public.bazar_order_items i
     where i.order_id = new.id and l.id = i.listing_id and l.status = 'rezervovano';
  elsif new.status in ('na_ceste', 'doruceno', 'dokonceno') then
    update public.bazar_listings l set status = 'prodano'
      from public.bazar_order_items i
     where i.order_id = new.id and l.id = i.listing_id and l.status <> 'prodano';
  end if;
  return new;
end $$;

drop trigger if exists bazar_orders_items_sync on public.bazar_orders;
create trigger bazar_orders_items_sync after update of status on public.bazar_orders
  for each row execute function private.bazar_order_items_sync();

-- Přidat další boty k rezervaci (jen kupující, jen dokud není zaplaceno, jen od stejného prodejce)
create or replace function public.bazar_add_to_order(p_order_id uuid, p_listing_id uuid)
returns void language plpgsql security definer set search_path to '' as $$
declare
  v_order public.bazar_orders;
  v_listing public.bazar_listings;
  v_seller_email text;
  v_total integer;
begin
  select * into v_order from public.bazar_orders where id = p_order_id for update;
  if not found or v_order.buyer_id is distinct from (select auth.uid()) then raise exception 'Objednávka nenalezena.'; end if;
  if v_order.status <> 'ceka_na_postovne' then raise exception 'K zaplacené objednávce už nejde nic přidat.'; end if;

  select * into v_listing from public.bazar_listings where id = p_listing_id for update;
  if not found or v_listing.status <> 'aktivni' then raise exception 'Inzerát už není k dispozici.'; end if;
  if v_listing.seller_id <> v_order.seller_id then raise exception 'Přidat jde jen boty od stejného prodejce.'; end if;
  if (select count(*) from public.bazar_order_items where order_id = p_order_id) >= 10 then
    raise exception 'Do jedné objednávky se vejde nejvýš 10 párů.';
  end if;

  insert into public.bazar_order_items (order_id, listing_id, price_czk) values (p_order_id, v_listing.id, v_listing.price_czk);
  update public.bazar_listings set status = 'rezervovano' where id = v_listing.id;
  update public.bazar_orders set price_czk = price_czk + v_listing.price_czk where id = p_order_id
    returning price_czk + shipping_czk into v_total;

  select u.email into v_seller_email from auth.users u where u.id = v_order.seller_id;
  perform private.bazar_send_email(v_seller_email, 'Kupující přidal/a další boty: ' || v_listing.title,
    '<p>Kupující ' || private.bazar_html(v_order.buyer_name) || ' si k rezervaci přidal/a další boty: <strong>'
    || private.bazar_html(v_listing.title) || '</strong> za ' || v_listing.price_czk || ' Kč.</p>'
    || '<p>Všechno pošlete v jednom balíku. Celkem vám kupující zaplatí <strong>' || v_total || ' Kč</strong>'
    || case when v_order.shipping_czk > 0 then ' (poštovné jen jednou).' else '.' end || '</p>'
    || private.bazar_button('https://bazar.barevia.cz/bazar/objednavka/' || p_order_id, 'Otevřít objednávku'));
end $$;

revoke all on function public.bazar_add_to_order(uuid, uuid) from public, anon;
grant execute on function public.bazar_add_to_order(uuid, uuid) to authenticated;
revoke all on function private.bazar_order_title(uuid, uuid) from public, anon, authenticated;
