-- Katalog bot z e-shopu barevia.cz (Shoptet). Čtou všichni, zapisuje jen import (service/MCP).
create table public.catalog_products (
  id           uuid primary key default gen_random_uuid(),
  shoptet_guid text not null unique,
  brand        text not null,
  name         text not null,
  url          text not null,
  image_url    text,
  price_czk    integer not null,
  category     text not null references public.shoe_categories(code),
  gender       text not null default 'unisex' check (gender in ('holky', 'kluci', 'unisex')),
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table public.catalog_variants (
  product_id      uuid not null references public.catalog_products(id) on delete cascade,
  size_eu         numeric(4,1) not null,
  inner_length_mm integer not null check (inner_length_mm between 80 and 320),
  in_stock        boolean,            -- null = neznámo (ověřit v e-shopu)
  primary key (product_id, size_eu)
);
create index catalog_variants_length_idx on public.catalog_variants (inner_length_mm);

alter table public.catalog_products enable row level security;
alter table public.catalog_variants enable row level security;

create policy "katalog: čtení" on public.catalog_products for select to anon, authenticated using (active);
create policy "katalog varianty: čtení" on public.catalog_variants for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.catalog_products, public.catalog_variants from anon, authenticated;
grant select on public.catalog_products, public.catalog_variants to anon, authenticated;
