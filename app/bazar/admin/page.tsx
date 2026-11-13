import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { adminResolveReport, adminUpdateOrder } from '@/app/bazar/actions'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, inputClass, PageTitle } from '@/components/ui'
import { formatCzk, listingTitle, ORDER_STATUS_LABEL } from '@/lib/bazar'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Správa bazaru', robots: { index: false } }

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni?next=/bazar/admin')
  const { data: me } = await supabase.from('bazar_sellers').select('is_admin').eq('user_id', user.id).maybeSingle()
  if (!me?.is_admin) notFound()

  const [{ data: orders }, { data: reports }] = await Promise.all([
    supabase
      .from('bazar_orders')
      .select('id, status, buyer_name, buyer_email, buyer_phone, pickup_point_name, pickup_point_id, price_czk, shipping_czk, submission_code, packeta_barcode, created_at, bazar_listings(id, brand, model)')
      .neq('status', 'dokonceno')
      .neq('status', 'zruseno')
      .order('created_at', { ascending: true }),
    supabase.from('bazar_reports').select('id, reason, created_at, listing_id, bazar_listings(id, brand, model)').eq('resolved', false).order('created_at'),
  ])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageTitle sub="Dokud nejsou zapojené Comgate a Zásilkovna, posouváte objednávky tady ručně.">Správa bazaru</PageTitle>

      <section className="flex flex-col gap-3" aria-labelledby="objednavky">
        <h2 id="objednavky" className="font-display text-xl font-bold">Rozpracované objednávky ({orders?.length ?? 0})</h2>
        {(orders ?? []).map((o) => (
          <Card key={o.id} className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/bazar/objednavka/${o.id}`} className="font-bold text-forest">
                {o.bazar_listings ? listingTitle(o.bazar_listings) : 'Boty'}
              </Link>
              <span className="text-sm text-muted">{formatDate(o.created_at.slice(0, 10))} · {ORDER_STATUS_LABEL[o.status]}</span>
            </div>
            <p className="text-sm leading-relaxed tabular-nums">
              {o.buyer_name} · {o.buyer_email}
              {o.buyer_phone && ` · ${o.buyer_phone}`}
              <br />
              Kam: {o.pickup_point_name}
              {o.pickup_point_id && ` (ID ${o.pickup_point_id})`}
              <br />
              Boty {formatCzk(o.price_czk)} (platí prodejci) · poštovné {formatCzk(o.shipping_czk)} (platí Barevii)
            </p>
            <form action={adminUpdateOrder} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="order_id" value={o.id} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`st-${o.id}`} className="text-sm font-bold">Stav</label>
                <select id={`st-${o.id}`} name="status" defaultValue={o.status} className={inputClass}>
                  {Object.entries(ORDER_STATUS_LABEL).map(([k, t]) => (
                    <option key={k} value={k}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`kod-${o.id}`} className="text-sm font-bold">Podací kód</label>
                <input id={`kod-${o.id}`} name="submission_code" defaultValue={o.submission_code ?? ''} maxLength={40} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`heslo-${o.id}`} className="text-sm font-bold">Heslo na balík</label>
                <input id={`heslo-${o.id}`} name="packeta_barcode" defaultValue={o.packeta_barcode ?? ''} maxLength={40} className={inputClass} />
              </div>
              <SubmitButton variant="small" className="sm:col-span-3 sm:justify-self-start">Uložit</SubmitButton>
            </form>
          </Card>
        ))}
        {!orders?.length && <p className="text-sm text-muted">Nic nečeká.</p>}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="nahlaseni">
        <h2 id="nahlaseni" className="font-display text-xl font-bold">Nahlášené inzeráty ({reports?.length ?? 0})</h2>
        {(reports ?? []).map((r) => (
          <Card key={r.id} className="flex flex-col gap-2 p-5">
            {r.bazar_listings && (
              <Link href={`/bazar/${r.bazar_listings.id}`} className="font-bold text-forest">{listingTitle(r.bazar_listings)}</Link>
            )}
            <p className="text-sm whitespace-pre-line">{r.reason}</p>
            <div className="flex flex-wrap gap-2">
              <form action={adminResolveReport}>
                <input type="hidden" name="report_id" value={r.id} />
                <input type="hidden" name="listing_id" value={r.listing_id ?? ''} />
                <input type="hidden" name="hide" value="1" />
                <SubmitButton variant="small">Skrýt inzerát</SubmitButton>
              </form>
              <form action={adminResolveReport}>
                <input type="hidden" name="report_id" value={r.id} />
                <SubmitButton variant="ghost">V pořádku</SubmitButton>
              </form>
            </div>
          </Card>
        ))}
        {!reports?.length && <p className="text-sm text-muted">Žádná nahlášení.</p>}
      </section>
    </div>
  )
}
