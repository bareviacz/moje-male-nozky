-- Bazárek: poštovné (Zásilkovna i Balíkovna) zvýšeno z 55 na 89 Kč.
-- Mění jen částku v aktuální definici funkce, nic dalšího.
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.bazar_create_order(uuid,text,text,text,text,text,text)'::regprocedure) into v_def;
  if position('else 55 end' in v_def) = 0 then raise exception 'Nečekaná definice bazar_create_order'; end if;
  execute replace(v_def, 'else 55 end', 'else 89 end');
end $$;
