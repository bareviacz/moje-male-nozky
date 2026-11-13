-- =====================================================================
-- Barevia Bazárek (bazar.barevia.cz) v projektu „Barevia Moje nožky“
-- Jen přidává nové tabulky s předponou bazar_, stávající data nemění.
-- Model: kupující platí cenu bot přímo prodávajícímu (QR platba),
-- poštovné platí Barevii (Comgate), zásilku zakládá bazar u Zásilkovny.
-- =====================================================================

create type public.bazar_width     as enum ('uzka', 'normalni', 'siroka');
create type public.bazar_gender    as enum ('unisex', 'holka', 'kluk');
create type public.bazar_condition as enum ('jako_nove', 'lehce_nosene', 'nosene', 'hodne_nosene');
create type public.bazar_listing_status as enum ('koncept', 'aktivni', 'rezervovano', 'prodano', 'skryto');
create type public.bazar_photo_kind as enum ('celek', 'podrazka', 'stelka', 'detail');
create type public.bazar_order_status as enum (
  'ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani', 'na_ceste', 'doruceno', 'dokonceno', 'zruseno'
);

-- ---------- Veřejný profil v bazaru (jméno z Moje malé nožky zůstává soukromé) ----------
create table public.bazar_sellers (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 2 and 40),
  city        text check (char_length(city) <= 60),
  is_barevia  boolean not null default false,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.bazar_sellers is 'Veřejná přezdívka a město v bazaru. is_barevia/is_admin nastavuje jen Barevia.';

create table public.bazar_seller_private (
  user_id       uuid primary key references public.bazar_sellers (user_id) on delete cascade,
  bank_account  text not null check (char_length(bank_account) between 6 and 40),
  phone         text check (char_length(phone) <= 20),
  updated_at    timestamptz not null default now()
);
comment on table public.bazar_seller_private is 'Číslo účtu pro QR platbu. Kupující ho dostane jen přes bazar_get_payment_details po zaplacení poštovného.';

create function private.bazar_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select s.is_admin from public.bazar_sellers s where s.user_id = (select auth.uid())), false);
$$;

-- ---------- Inzeráty ----------
create table public.bazar_listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references public.bazar_sellers (user_id) on delete cascade,
  source_shoe_id   uuid references public.shoes (id) on delete set null,   -- bota z evidence Moje malé nožky
  title            text not null check (char_length(title) between 3 and 90),
  brand            text not null check (char_length(brand) between 1 and 40),
  model            text check (char_length(model) <= 60),
  size_eu          numeric(3,1) not null check (size_eu between 15 and 42),
  inner_length_mm  smallint not null check (inner_length_mm between 90 and 300),
  inner_width_mm   smallint check (inner_width_mm between 30 and 120),
  width            public.bazar_width not null default 'normalni',
  category         text not null references public.shoe_categories (code),
  gender           public.bazar_gender not null default 'unisex',
  condition        public.bazar_condition not null,
  description      text check (char_length(description) <= 2000),
  price_czk        integer not null check (price_czk between 1 and 20000),
  status           public.bazar_listing_status not null default 'koncept',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index bazar_listings_active_idx on public.bazar_listings (status, created_at desc);
create index bazar_listings_length_idx on public.bazar_listings (inner_length_mm) where status = 'aktivni';
create index bazar_listings_seller_idx on public.bazar_listings (seller_id);
create index bazar_listings_category_idx on public.bazar_listings (category);
create unique index bazar_listings_one_per_shoe on public.bazar_listings (source_shoe_id)
  where source_shoe_id is not null and status <> 'skryto';

create table public.bazar_listing_photos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.bazar_listings (id) on delete cascade,
  storage_path  text not null,   -- v bucketu bazar-photos: <user_id>/<listing_id>/<soubor>
  kind          public.bazar_photo_kind not null default 'detail',
  position      smallint not null default 0,
  created_at    timestamptz not null default now()
);
create index bazar_listing_photos_listing_idx on public.bazar_listing_photos (listing_id, position);

-- Kontroly inzerátu: fotka podrážky před zveřejněním; bota z evidence musí patřit mému dítěti
create function private.bazar_check_listing()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.source_shoe_id is not null
     and (tg_op = 'INSERT' or new.source_shoe_id is distinct from old.source_shoe_id) then
    if not exists (
      select 1 from public.shoes s
      join public.child_guardians g on g.child_id = s.child_id
      where s.id = new.source_shoe_id and g.user_id = new.seller_id and g.role in ('owner', 'editor')
    ) then
      raise exception 'Tuhle botu z evidence nemůžete prodat.';
    end if;
  end if;
  if new.status = 'aktivni' and (tg_op = 'INSERT' or old.status is distinct from 'aktivni') then
    if not exists (select 1 from public.bazar_listing_photos p where p.listing_id = new.id and p.kind = 'podrazka') then
      raise exception 'Inzerát musí mít fotku podrážky.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger bazar_listings_check
  before insert or update on public.bazar_listings
  for each row execute function private.bazar_check_listing();

create trigger bazar_sellers_set_updated_at
  before update on public.bazar_sellers
  for each row execute function private.set_updated_at();

-- ---------- Oblíbené, zprávy ----------
create table public.bazar_favorites (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.bazar_listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.bazar_messages (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.bazar_listings (id) on delete cascade,
  sender_id     uuid not null references public.bazar_sellers (user_id) on delete cascade,
  recipient_id  uuid not null references public.bazar_sellers (user_id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 2000),
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index bazar_messages_thread_idx on public.bazar_messages (listing_id, created_at);
create index bazar_messages_recipient_idx on public.bazar_messages (recipient_id, read_at);

-- ---------- Objednávky a zásilky ----------
create table public.bazar_orders (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.bazar_listings (id) on delete restrict,
  buyer_id            uuid not null references public.bazar_sellers (user_id) on delete restrict,
  seller_id           uuid not null references public.bazar_sellers (user_id) on delete restrict,
  price_czk           integer not null,
  shipping_czk        integer not null,
  pickup_point_id     text not null,
  pickup_point_name   text not null,
  buyer_name          text not null check (char_length(buyer_name) between 2 and 100),
  buyer_email         text not null check (buyer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  buyer_phone         text check (char_length(buyer_phone) <= 20),
  status              public.bazar_order_status not null default 'ceka_na_postovne',
  comgate_trans_id    text unique,
  packeta_packet_id   text,
  packeta_barcode     text,
  submission_code     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create index bazar_orders_buyer_idx  on public.bazar_orders (buyer_id, created_at desc);
create index bazar_orders_seller_idx on public.bazar_orders (seller_id, created_at desc);
create index bazar_orders_listing_idx on public.bazar_orders (listing_id);
create unique index bazar_orders_one_open_per_listing on public.bazar_orders (listing_id) where status <> 'zruseno';

create trigger bazar_orders_set_updated_at
  before update on public.bazar_orders
  for each row execute function private.set_updated_at();

create function public.bazar_create_order(
  p_listing_id uuid, p_pickup_point_id text, p_pickup_point_name text,
  p_buyer_name text, p_buyer_email text, p_buyer_phone text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_listing public.bazar_listings;
  v_order_id uuid;
  v_shipping constant integer := 79;   -- poštovné v Kč, upravit podle smlouvy se Zásilkovnou
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

create function public.bazar_cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.bazar_orders;
begin
  select * into v_order from public.bazar_orders where id = p_order_id for update;
  if not found or (select auth.uid()) not in (v_order.buyer_id, v_order.seller_id) then
    raise exception 'Objednávka nenalezena.';
  end if;
  if v_order.status <> 'ceka_na_postovne' then
    raise exception 'Po zaplacení poštovného objednávku zruší jen Barevia.';
  end if;
  update public.bazar_orders set status = 'zruseno' where id = p_order_id;
  update public.bazar_listings set status = 'aktivni' where id = v_order.listing_id and status = 'rezervovano';
end $$;

create function public.bazar_confirm_received(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_listing_id uuid;
begin
  update public.bazar_orders set status = 'dokonceno'
  where id = p_order_id and buyer_id = (select auth.uid()) and status in ('k_odeslani', 'na_ceste', 'doruceno')
  returning listing_id into v_listing_id;
  if v_listing_id is null then raise exception 'Objednávku nelze potvrdit.'; end if;
  update public.bazar_listings set status = 'prodano' where id = v_listing_id;
end $$;

create function public.bazar_get_payment_details(p_order_id uuid)
returns table (bank_account text, amount_czk integer, variable_symbol text, seller_nickname text)
language sql stable security definer set search_path = '' as $$
  select sp.bank_account, o.price_czk,
         right(regexp_replace(o.id::text, '\D', '', 'g'), 10),
         s.nickname
  from public.bazar_orders o
  join public.bazar_seller_private sp on sp.user_id = o.seller_id
  join public.bazar_sellers s on s.user_id = o.seller_id
  where o.id = p_order_id and o.buyer_id = (select auth.uid())
    and o.status not in ('ceka_na_postovne', 'zruseno');
$$;

-- ---------- Hodnocení a nahlášení ----------
create table public.bazar_reviews (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null unique references public.bazar_orders (id) on delete cascade,
  reviewer_id  uuid not null references public.bazar_sellers (user_id) on delete cascade,
  reviewee_id  uuid not null references public.bazar_sellers (user_id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text check (char_length(comment) <= 500),
  created_at   timestamptz not null default now()
);
create index bazar_reviews_reviewee_idx on public.bazar_reviews (reviewee_id);

create view public.bazar_seller_ratings with (security_invoker = true) as
  select reviewee_id as seller_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from public.bazar_reviews group by reviewee_id;

create table public.bazar_reports (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references public.bazar_listings (id) on delete cascade,
  reporter_id  uuid references public.profiles (id) on delete set null,
  reason       text not null check (char_length(reason) between 3 and 1000),
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index bazar_reports_listing_idx on public.bazar_reports (listing_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.bazar_sellers        enable row level security;
alter table public.bazar_seller_private enable row level security;
alter table public.bazar_listings       enable row level security;
alter table public.bazar_listing_photos enable row level security;
alter table public.bazar_favorites      enable row level security;
alter table public.bazar_messages       enable row level security;
alter table public.bazar_orders         enable row level security;
alter table public.bazar_reviews        enable row level security;
alter table public.bazar_reports        enable row level security;

create policy "bazar_sellers: čtení veřejně" on public.bazar_sellers for select using (true);
create policy "bazar_sellers: založení" on public.bazar_sellers for insert to authenticated
  with check (user_id = (select auth.uid()) and is_admin = false and is_barevia = false);
create policy "bazar_sellers: úprava" on public.bazar_sellers for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and is_admin = (select s.is_admin from public.bazar_sellers s where s.user_id = (select auth.uid()))
    and is_barevia = (select s.is_barevia from public.bazar_sellers s where s.user_id = (select auth.uid())));

create policy "bazar_seller_private: jen vlastník" on public.bazar_seller_private for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "bazar_listings: čtení veřejně" on public.bazar_listings for select
  using (status in ('aktivni', 'rezervovano', 'prodano'));
create policy "bazar_listings: čtení vlastních" on public.bazar_listings for select to authenticated
  using (seller_id = (select auth.uid()) or private.bazar_is_admin());
create policy "bazar_listings: založení" on public.bazar_listings for insert to authenticated
  with check (seller_id = (select auth.uid()) and status in ('koncept', 'aktivni'));
create policy "bazar_listings: úprava" on public.bazar_listings for update to authenticated
  using ((seller_id = (select auth.uid()) and status in ('koncept', 'aktivni', 'skryto')) or private.bazar_is_admin())
  with check ((seller_id = (select auth.uid()) and status in ('koncept', 'aktivni', 'skryto')) or private.bazar_is_admin());
create policy "bazar_listings: smazání" on public.bazar_listings for delete to authenticated
  using ((seller_id = (select auth.uid()) and status in ('koncept', 'skryto')) or private.bazar_is_admin());

create policy "bazar_listing_photos: čtení" on public.bazar_listing_photos for select
  using (exists (select 1 from public.bazar_listings l where l.id = listing_id));
create policy "bazar_listing_photos: vlastník" on public.bazar_listing_photos for all to authenticated
  using (exists (select 1 from public.bazar_listings l where l.id = listing_id and l.seller_id = (select auth.uid())))
  with check (exists (select 1 from public.bazar_listings l where l.id = listing_id and l.seller_id = (select auth.uid())));

create policy "bazar_favorites: moje" on public.bazar_favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "bazar_messages: čtení" on public.bazar_messages for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));
create policy "bazar_messages: odeslání" on public.bazar_messages for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy "bazar_messages: přečteno" on public.bazar_messages for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

create policy "bazar_orders: čtení" on public.bazar_orders for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id) or private.bazar_is_admin());

create policy "bazar_reviews: čtení" on public.bazar_reviews for select using (true);
create policy "bazar_reviews: napsání" on public.bazar_reviews for insert to authenticated
  with check (reviewer_id = (select auth.uid()) and exists (
    select 1 from public.bazar_orders o
    where o.id = order_id and o.buyer_id = (select auth.uid())
      and o.seller_id = reviewee_id and o.status = 'dokonceno'));

create policy "bazar_reports: nahlášení" on public.bazar_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy "bazar_reports: admin čtení" on public.bazar_reports for select to authenticated
  using (private.bazar_is_admin());
create policy "bazar_reports: admin vyřízení" on public.bazar_reports for update to authenticated
  using (private.bazar_is_admin());

revoke execute on function public.bazar_create_order(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.bazar_cancel_order(uuid)        from public, anon;
revoke execute on function public.bazar_confirm_received(uuid)    from public, anon;
revoke execute on function public.bazar_get_payment_details(uuid) from public, anon;
grant  execute on function public.bazar_create_order(uuid, text, text, text, text, text) to authenticated;
grant  execute on function public.bazar_cancel_order(uuid)        to authenticated;
grant  execute on function public.bazar_confirm_received(uuid)    to authenticated;
grant  execute on function public.bazar_get_payment_details(uuid) to authenticated;
revoke execute on function private.bazar_is_admin() from public, anon;
grant  execute on function private.bazar_is_admin() to authenticated;

-- =====================================================================
-- Úložiště fotek bazaru (veřejné čtení přes URL, nahrávání jen do své složky)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bazar-photos', 'bazar-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "bazar-photos: nahrání" on storage.objects for insert to authenticated
  with check (bucket_id = 'bazar-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "bazar-photos: smazání" on storage.objects for delete to authenticated
  using (bucket_id = 'bazar-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- Doplněno po nasazení ----------
create policy "bazar_orders: admin úprava" on public.bazar_orders for update to authenticated
  using (private.bazar_is_admin()) with check (private.bazar_is_admin());
create policy "bazar_messages: admin čtení" on public.bazar_messages for select to authenticated
  using (private.bazar_is_admin());
create policy "shoe_categories: čtení pro bazar (veřejně)" on public.shoe_categories for select to anon using (true);
grant select on public.shoe_categories to anon;
revoke all on public.bazar_seller_private, public.bazar_orders, public.bazar_messages, public.bazar_favorites, public.bazar_reports from anon;
revoke insert, update, delete, truncate on public.bazar_listings, public.bazar_listing_photos, public.bazar_sellers, public.bazar_reviews from anon;
