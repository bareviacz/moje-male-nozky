// Stáhne pohyby z Fio banky za posledních 7 dní a předá je databázi k párování s objednávkami bazárku.
// Token je v tajném nastavení edge funkcí jako FIO_TOKEN; nikdy se neloguje.
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })
type Col = { value?: string | number | null } | null | undefined
const v = (c: Col) => (c && c.value != null ? String(c.value) : null)

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}))
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: ok } = await db.rpc('bazar_fio_secret_ok', { p_secret: String(body?.secret ?? '') })
  if (!ok) return json({ error: 'forbidden' }, 403)

  const token = Deno.env.get('FIO_TOKEN')
  if (!token) return json({ skipped: 'FIO_TOKEN není nastavený' })

  const day = (d: Date) => d.toISOString().slice(0, 10)
  const to = new Date()
  const from = new Date(Date.now() - 7 * 864e5)
  const res = await fetch(`https://fioapi.fio.cz/v1/rest/periods/${encodeURIComponent(token)}/${day(from)}/${day(to)}/transactions.json`)
  if (!res.ok) return json({ error: `Fio odpověděla ${res.status}` }, 502)
  const data = await res.json().catch(() => null)
  // deno-lint-ignore no-explicit-any
  const list: any[] = data?.accountStatement?.transactionList?.transaction ?? []
  const tx = list.map((t) => ({
    id: v(t.column22),
    date: v(t.column0),
    amount: v(t.column1),
    currency: v(t.column14),
    vs: v(t.column5),
    counterparty: v(t.column10),
    account: v(t.column2),
    message: v(t.column16),
  }))
  const { data: result, error } = await db.rpc('bazar_fio_ingest', { p_tx: tx })
  if (error) return json({ error: error.message }, 500)
  return json({ fetched: tx.length, ...result })
})
