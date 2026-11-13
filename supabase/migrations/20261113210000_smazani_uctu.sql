-- Smazání vlastního účtu (heslo ověřuje aplikace před voláním).
-- Neprojde, pokud má uživatel v bazaru rozběhnutou objednávku.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (
    select 1 from public.bazar_orders o
    where (o.buyer_id = uid or o.seller_id = uid)
      and o.status not in ('dokonceno', 'zruseno')
  ) then
    raise exception 'open_orders';
  end if;

  -- Uzavřené objednávky (a jejich hodnocení) by bránily smazání prodejce.
  delete from public.bazar_orders where buyer_id = uid or seller_id = uid;

  -- Kaskádou zmizí profil, děti (které uživatel založil), měření, boty, inzeráty, zprávy.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
