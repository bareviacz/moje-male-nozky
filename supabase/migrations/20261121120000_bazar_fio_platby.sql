-- Napojení na Fio banku: automatické spárování plateb za boty, které prodává Barevia.
create extension if not exists pg_cron;

alter table public.bazar_orders
  add column if not exists paid_at timestamptz,
  add column if not exists paid_amount integer;

create table if not exists public.bazar_bank_payments (
  fio_id bigint primary key,
  booked_on date,
  amount numeric(12, 2) not null,
  currency text,
  vs text,
  counterparty text,
  account text,
  message text,
  order_id uuid references public.bazar_orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.bazar_bank_payments enable row level security;
drop policy if exists "bazar_bank_payments_admin" on public.bazar_bank_payments;
create policy "bazar_bank_payments_admin" on public.bazar_bank_payments for select to authenticated
  using (exists (select 1 from public.bazar_sellers s where s.user_id = (select auth.uid()) and s.is_admin));
grant select on public.bazar_bank_payments to authenticated;

-- Tajný klíč pro volání synchronizace (cron -> edge funkce)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'fio_sync_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'fio_sync_secret');
  end if;
end $$;

create or replace function public.bazar_fio_secret_ok(p_secret text)
returns boolean language sql stable security definer set search_path to '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'fio_sync_secret' and decrypted_secret = p_secret)
$$;
revoke all on function public.bazar_fio_secret_ok(text) from public, anon, authenticated;
grant execute on function public.bazar_fio_secret_ok(text) to service_role;

-- Příjem pohybů z Fio a párování s objednávkami podle VS a částky
create or replace function public.bazar_fio_ingest(p_tx jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  t jsonb;
  v_id bigint;
  v_amount numeric;
  v_vs text;
  v_rows int;
  v_order public.bazar_orders;
  v_due int;
  v_title text;
  v_seller_email text;
  v_new int := 0;
  v_matched int := 0;
  v_url text;
begin
  for t in select * from jsonb_array_elements(coalesce(p_tx, '[]'::jsonb)) loop
    v_id := nullif(t->>'id', '')::bigint;
    v_amount := nullif(t->>'amount', '')::numeric;
    if v_id is null or v_amount is null or v_amount <= 0 or coalesce(t->>'currency', 'CZK') <> 'CZK' then continue; end if;
    v_vs := nullif(ltrim(regexp_replace(coalesce(t->>'vs', ''), '\D', '', 'g'), '0'), '');

    insert into public.bazar_bank_payments (fio_id, booked_on, amount, currency, vs, counterparty, account, message)
    values (v_id, nullif(left(t->>'date', 10), '')::date, v_amount, t->>'currency', v_vs,
            left(t->>'counterparty', 200), left(t->>'account', 60), left(t->>'message', 300))
    on conflict (fio_id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then continue; end if;
    v_new := v_new + 1;
    if v_vs is null then continue; end if;

    select o.* into v_order
      from public.bazar_orders o
      join public.bazar_sellers s on s.user_id = o.seller_id and s.is_barevia
     where o.paid_at is null and o.status <> 'zruseno'
       and ltrim(right(regexp_replace(o.id::text, '\D', '', 'g'), 10), '0') = v_vs
     order by o.created_at desc limit 1 for update of o;
    if not found then continue; end if;

    v_due := v_order.price_czk + v_order.shipping_czk;
    v_title := private.bazar_order_title(v_order.id, v_order.listing_id);
    v_url := 'https://bazar.barevia.cz/bazar/objednavka/' || v_order.id;
    select u.email into v_seller_email from auth.users u where u.id = v_order.seller_id;
    update public.bazar_bank_payments set order_id = v_order.id where fio_id = v_id;

    if v_amount >= v_due then
      update public.bazar_orders set paid_at = now(), paid_amount = v_amount::int where id = v_order.id;
      v_matched := v_matched + 1;
      perform private.bazar_send_email(v_seller_email, 'Zaplaceno: ' || v_title,
        '<p>Na účet dorazila platba <strong>' || v_amount::int || ' Kč</strong> od ' || private.bazar_html(v_order.buyer_name)
        || ' za <strong>' || private.bazar_html(v_title) || '</strong>.</p><p>Pošlete prosím boty a v objednávce klikněte na „Odesláno“.</p>'
        || private.bazar_button(v_url, 'Otevřít objednávku'));
      perform private.bazar_send_email(v_order.buyer_email, 'Platba přijata: ' || v_title,
        '<p>Děkujeme, platba <strong>' || v_amount::int || ' Kč</strong> za <strong>' || private.bazar_html(v_title)
        || '</strong> dorazila. Boty co nejdřív odešleme a dáme vám vědět.</p>'
        || private.bazar_button(v_url, 'Zobrazit objednávku'));
    else
      update public.bazar_bank_payments set note = 'Částka nesedí: přišlo ' || v_amount::int || ' Kč, má být ' || v_due || ' Kč' where fio_id = v_id;
      perform private.bazar_send_email(v_seller_email, 'Pozor, částka nesedí: ' || v_title,
        '<p>Od ' || private.bazar_html(v_order.buyer_name) || ' přišlo <strong>' || v_amount::int || ' Kč</strong>, ale objednávka je na <strong>'
        || v_due || ' Kč</strong>. Objednávku jsem jako zaplacenou neoznačil, zkontrolujte ji prosím.</p>'
        || private.bazar_button(v_url, 'Otevřít objednávku'));
    end if;
  end loop;
  return jsonb_build_object('new', v_new, 'matched', v_matched);
end $$;
revoke all on function public.bazar_fio_ingest(jsonb) from public, anon, authenticated;
grant execute on function public.bazar_fio_ingest(jsonb) to service_role;

-- K zaplacené objednávce už nejde nic přidat
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.bazar_add_to_order(uuid,uuid)'::regprocedure);
  v_def := replace(v_def, 'if v_order.status <> ''ceka_na_postovne'' then', 'if v_order.status <> ''ceka_na_postovne'' or v_order.paid_at is not null then');
  execute v_def;
end $$;

-- Každých 10 minut zkontrolovat nové platby
select cron.unschedule(jobid) from cron.job where jobname = 'bazar-fio-sync';
select cron.schedule('bazar-fio-sync', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://chjpgalnmarmxuqmlzup.supabase.co/functions/v1/fio-sync',
    headers := '{"content-type":"application/json"}'::jsonb,
    body := jsonb_build_object('secret', (select decrypted_secret from vault.decrypted_secrets where name = 'fio_sync_secret')),
    timeout_milliseconds := 30000)
$cron$);
