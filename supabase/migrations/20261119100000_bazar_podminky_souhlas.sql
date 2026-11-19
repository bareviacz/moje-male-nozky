-- Kdy uživatel souhlasil s Podmínkami užívání Bazárku
alter table public.bazar_sellers add column if not exists terms_accepted_at timestamptz;
