import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PaymentQr } from '@/components/bazar/PaymentQr'
import { CopyButton } from '@/components/CopyButton'
import { Card, PageTitle } from '@/components/ui'
import { accountToIban, formatCzk, formatEu, listingTitle, ORDER_STATUS_LABEL, spayd, thumbUrl, type BazarOrderStatus } from '@/lib/bazar'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

type GuestOrderData = {
  id: string
  status: BazarOrderStatus
  created_at: string
  price_czk: number
  shipping_czk: number
  shipping_method: string
  pickup_point_name: string | null
  buyer_name: string
  tracking_info: string | null
  paid_at: string | null
  paid_amount: number | null
  cancel_reason: string | null
  seller_nickname: string
  seller_email: string | null
  seller_phone: string | null
  items: { listing_id: string; brand: string; model: string | null; size_eu: number; price_czk: number; photo: string | null }[]
  payment: { bank_account: string | null; amount_czk: number; variable_symbol: string } | null
}

/** Objednávka bez registrace – přístup jen přes tajný odkaz z e-mailu. */
export async function GuestOrder({ id, token }: { id: string; token: string }) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('bazar_guest_order', { p_order_id: id, p_token: token })
  const o = data as GuestOrderData | null
  if (!o) notFound()

  const pay = o.payment
  const iban = pay?.bank_account ? accountToIban(pay.bank_account) : null
  const qr = pay && iban ? spayd({ iban, amount: pay.amount_czk, vs: pay.variable_symbol, message: 'Bazarek Barevia' }) : null
  const ownLabel = o.shipping_method === 'vlastni_stitek'
  const open = ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status)
  const pairs = o.items.length

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link href="/bazar" className="self-start text-sm font-bold text-forest">← Zpět do Bazárku</Link>
      <PageTitle sub={`Objednáno ${formatDate(o.created_at.slice(0, 10))} · ${ORDER_STATUS_LABEL[o.status]}`}>Vaše objednávka</PageTitle>

      <p className="rounded-2xl bg-sun-soft px-4 py-3 text-sm text-sun-ink">
        Tuhle stránku si uložte – odkaz na ni máte i v e-mailu. Nakupujete bez registrace, takže je to jediný přístup k objednávce.
      </p>

      {o.status === 'zruseno' && (
        <div className="rounded-2xl bg-coral-soft px-4 py-3 text-coral-ink">
          <p className="font-semibold">Rezervace byla zrušena.</p>
          {o.cancel_reason && <p className="text-sm">{o.cancel_reason}</p>}
        </div>
      )}
      {o.paid_at && open && (
        <p className="rounded-2xl bg-forest px-4 py-3 text-[15px] font-semibold text-white">
          ✓ Zaplaceno {formatDate(o.paid_at.slice(0, 10))}. Děkujeme, boty brzy odešleme.
        </p>
      )}
      {o.status === 'na_ceste' && (
        <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Boty jsou na cestě.{o.tracking_info ? ` Číslo zásilky: ${o.tracking_info}.` : ''}
        </p>
      )}

      <Card className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {o.items.map((it) => (
            <li key={it.listing_id} className="flex items-center gap-3.5">
              {it.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(it.photo)} alt="" className="size-16 shrink-0 rounded-xl bg-white object-contain ring-1 ring-line" />
              ) : (
                <span className="size-16 shrink-0 rounded-xl bg-ground ring-1 ring-line" />
              )}
              <div className="flex min-w-0 flex-col">
                <span className="font-bold">{listingTitle(it)}</span>
                <span className="text-sm text-muted tabular-nums">EU {formatEu(it.size_eu)} · {formatCzk(it.price_czk)}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-0.5 border-t border-line pt-3 text-sm text-muted tabular-nums">
          <span>
            {pairs > 1 ? `${pairs} ${pairs < 5 ? 'páry' : 'párů'} bot · ` : ''}
            {formatCzk(o.price_czk)}
            {ownLabel ? ' · vlastní štítek' : ` + poštovné ${formatCzk(o.shipping_czk)} = `}
            {!ownLabel && <strong className="text-ink">{formatCzk(o.price_czk + o.shipping_czk)}</strong>}
          </span>
          <span>Doručení: {o.pickup_point_name}</span>
        </div>
      </Card>

      {pay && open && (
        <Card className="flex flex-col gap-4 p-5">
          <p className="font-bold">Zaplaťte {formatCzk(pay.amount_czk)} QR platbou</p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qr && <PaymentQr text={qr} />}
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 text-[15px] tabular-nums">
              <dt className="text-muted">Účet</dt>
              <dd className="flex items-center gap-1 font-bold">
                {pay.bank_account}
                {pay.bank_account && <CopyButton value={pay.bank_account} label="číslo účtu" />}
              </dd>
              <dt className="text-muted">Částka</dt>
              <dd className="font-bold">{formatCzk(pay.amount_czk)}</dd>
              <dt className="text-muted">VS</dt>
              <dd className="flex items-center gap-1 font-bold">
                {pay.variable_symbol}
                <CopyButton value={pay.variable_symbol} label="variabilní symbol" />
              </dd>
            </dl>
          </div>
          <p className="text-sm text-muted">
            Naskenujte QR kód v aplikaci banky. Jakmile platba dorazí, pošleme vám potvrzení e-mailem a boty odešleme.
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-1.5 p-5">
        <h2 className="font-display text-lg font-bold">Dotazy k objednávce</h2>
        <p className="text-[15px]">
          Prodává <strong>{o.seller_nickname}</strong>. Napište nám na{' '}
          {o.seller_email && (
            <a href={`mailto:${o.seller_email}`} className="font-semibold text-forest underline">
              {o.seller_email}
            </a>
          )}
          {o.seller_phone && <> nebo zavolejte {o.seller_phone}</>}.
        </p>
      </Card>

      <p className="text-center text-sm text-muted">
        Chcete mít nákupy přehledně na jednom místě?{' '}
        <Link href="/registrace?next=/bazar" className="font-bold text-forest">Založte si účet zdarma</Link>
      </p>
    </div>
  )
}
