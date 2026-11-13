import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { confirmReceived } from '@/app/bazar/actions'
import { coverPhoto } from '@/components/bazar/ListingCard'
import { PaymentQr } from '@/components/bazar/PaymentQr'
import { CancelOrderForm, MessageForm, ReviewForm, ShippedForm } from '@/components/bazar/SmallForms'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, cx, PageTitle } from '@/components/ui'
import {
  accountToIban,
  formatCzk,
  formatEu,
  listingTitle,
  ORDER_STATUS_LABEL,
  publicPhotoUrl,
  spayd,
  type BazarOrderStatus,
} from '@/lib/bazar'
import { formatDate } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Objednávka', robots: { index: false } }

const FLOW: BazarOrderStatus[] = ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani', 'na_ceste', 'doruceno', 'dokonceno']

function Steps({ status, steps }: { status: BazarOrderStatus; steps: [BazarOrderStatus, string, string][] }) {
  const now = FLOW.indexOf(status)
  return (
    <ol className="flex flex-col">
      {steps.map(([s, title, text], i) => {
        const idx = FLOW.indexOf(s)
        const done = idx < now || status === 'dokonceno'
        const cur = idx === now && status !== 'dokonceno'
        return (
          <li key={s} className="relative grid grid-cols-[28px_1fr] gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className="absolute top-7 bottom-0 left-[13px] w-0.5 bg-line" aria-hidden="true" />}
            <span
              className={cx(
                'z-10 flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold',
                done ? 'border-forest bg-forest text-white' : cur ? 'border-forest bg-white text-forest' : 'border-line bg-white text-muted',
              )}
            >
              {done ? '✓' : i + 1}
            </span>
            <div className="flex flex-col">
              <span className={cx('font-bold', !done && !cur && 'text-muted')}>{title}</span>
              <span className="text-sm text-muted">{text}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=/bazar/objednavka/${id}`)

  const { data: o } = await supabase
    .from('bazar_orders')
    .select(
      'id, status, buyer_id, seller_id, buyer_name, cancelled_by, cancel_reason, tracking_info, price_czk, shipping_czk, pickup_point_name, submission_code, packeta_barcode, created_at, listing_id, bazar_listings(id, brand, model, size_eu, inner_length_mm, bazar_listing_photos(storage_path, kind, position))',
    )
    .eq('id', id)
    .maybeSingle()
  if (!o) notFound()

  const isBuyer = o.buyer_id === user.id
  const isSeller = o.seller_id === user.id
  const otherId = isBuyer ? o.seller_id : o.buyer_id
  const l = o.bazar_listings

  const [{ data: other }, { data: pay }, { data: review }, { data: messages }, { data: contacts }] = await Promise.all([
    supabase.from('bazar_sellers').select('nickname').eq('user_id', otherId).maybeSingle(),
    (isBuyer || isSeller) && o.status !== 'zruseno'
      ? supabase.rpc('bazar_get_payment_details', { p_order_id: o.id })
      : Promise.resolve({ data: null }),
    supabase.from('bazar_reviews').select('rating').eq('order_id', o.id).maybeSingle(),
    supabase
      .from('bazar_messages')
      .select('id, body, sender_id, created_at, read_at, recipient_id')
      .eq('listing_id', o.listing_id)
      .or(`and(sender_id.eq.${o.buyer_id},recipient_id.eq.${o.seller_id}),and(sender_id.eq.${o.seller_id},recipient_id.eq.${o.buyer_id})`)
      .order('created_at', { ascending: true }),
    o.status !== 'zruseno' && (isBuyer || isSeller)
      ? supabase.rpc('bazar_get_order_contacts', { p_order_id: o.id })
      : Promise.resolve({ data: null }),
  ])
  const contact = (contacts ?? []).find((c) => c.role === (isBuyer ? 'prodejce' : 'kupujici'))

  // Zprávy pro mě označit jako přečtené
  if (messages?.some((m) => m.recipient_id === user.id && !m.read_at)) {
    await supabase.from('bazar_messages').update({ read_at: new Date().toISOString() }).eq('listing_id', o.listing_id).eq('recipient_id', user.id).is('read_at', null)
  }

  const payment = pay?.[0]
  const iban = payment ? accountToIban(payment.bank_account) : null
  const qr = payment && iban ? spayd({ iban, amount: payment.amount_czk, vs: payment.variable_symbol, message: `Bazarek Barevia ${l ? listingTitle(l) : ''}` }) : null
  const cover = l ? coverPhoto(l.bazar_listing_photos ?? []) : null

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link href="/bazar/moje" className="self-start text-sm font-bold text-forest">← Moje prodeje a nákupy</Link>
      <PageTitle sub={`Objednáno ${formatDate(o.created_at.slice(0, 10))} · ${ORDER_STATUS_LABEL[o.status]}`}>
        {isBuyer ? 'Kupuji' : isSeller ? 'Prodávám' : 'Objednávka'}
      </PageTitle>

      <Card className="flex items-center gap-3.5">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicPhotoUrl(cover.storage_path)} alt="" className="size-16 rounded-xl object-cover ring-1 ring-line" />
        )}
        <div className="flex flex-col">
          <span className="font-bold">{l ? listingTitle(l) : 'Boty'}</span>
          <span className="text-sm text-muted tabular-nums">
            {l && `EU ${formatEu(l.size_eu)} · `}
            {formatCzk(o.price_czk)}{o.shipping_czk > 0 ? ` + poštovné ${formatCzk(o.shipping_czk)}` : ''} · {isBuyer ? `od ${other?.nickname ?? 'prodejce'}` : `pro ${o.buyer_name}`}
          </span>
          <span className="text-sm text-muted">Doručení: {o.pickup_point_name}</span>
        </div>
      </Card>

      {contact && (
        <Card className="flex flex-col gap-1.5 p-5">
          <h2 className="font-display text-lg font-bold">{isBuyer ? 'Kontakt na prodejce' : 'Kontakt na kupujícího'}</h2>
          <p className="text-[15px]">
            <strong>{isBuyer ? contact.nickname : o.buyer_name}</strong>
            {!isBuyer && <span className="text-muted"> ({contact.nickname})</span>}
          </p>
          <p className="flex flex-col gap-0.5 text-[15px]">
            <a href={`mailto:${contact.email}`} className="font-semibold text-forest underline">{contact.email}</a>
            {contact.phone && <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="font-semibold text-forest underline">{contact.phone}</a>}
          </p>
          <p className="text-[13px] text-muted">Domluvit se můžete i přes zprávy níže.</p>
        </Card>
      )}

      {o.status === 'zruseno' && (
        <div className="rounded-2xl bg-coral-soft px-4 py-3 text-coral-ink">
          <p className="font-semibold">
            Rezervace byla zrušena
            {o.cancelled_by ? (o.cancelled_by === user.id ? ' (zrušili jste ji vy)' : isBuyer ? ' prodejcem' : ' kupujícím') : ''}.
          </p>
          {o.cancel_reason && <p className="text-sm">Důvod: {o.cancel_reason}</p>}
        </div>
      )}

      {/* ---------- Kupující ---------- */}
      {isBuyer && o.status === 'ceka_na_postovne' && (
        <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Boty máte rezervované. Zaplaťte prodejci QR kódem níže, částka už obsahuje poštovné.
        </p>
      )}
      {isBuyer && o.status === 'na_ceste' && (
        <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Prodejce boty odeslal/a.{o.tracking_info ? ` Číslo zásilky: ${o.tracking_info}.` : ''} Až si je vyzvednete, potvrďte převzetí.
        </p>
      )}

      {payment && (isBuyer || isSeller) && ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status) && (
        <Card className="flex flex-col gap-4 p-5">
          <p className="font-bold">
            {isBuyer
              ? `Zaplaťte ${formatCzk(payment.amount_czk)} prodejci ${payment.seller_nickname}`
              : `Platba za boty od kupujícího: ${formatCzk(payment.amount_czk)}`}
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qr && <PaymentQr text={qr} />}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px] tabular-nums">
              <dt className="text-muted">Účet</dt>
              <dd className="font-bold">{payment.bank_account}</dd>
              <dt className="text-muted">Částka</dt>
              <dd className="font-bold">{formatCzk(payment.amount_czk)}</dd>
              <dt className="text-muted">VS</dt>
              <dd className="font-bold">{payment.variable_symbol}</dd>
            </dl>
          </div>
          <p className="text-sm text-muted">
            {isBuyer
              ? 'Naskenujte QR kód v aplikaci banky. Prodejce boty odešle, jakmile mu platba dorazí.'
              : 'Tento QR kód vidí kupující. Platbu na svém účtu poznáte podle variabilního symbolu. Kdyby kupujícímu něco nešlo, můžete mu QR kód ukázat nebo přeposlat.'}
          </p>
        </Card>
      )}

      {isBuyer && ['k_odeslani', 'na_ceste', 'doruceno'].includes(o.status) && (
        <form action={confirmReceived}>
          <input type="hidden" name="order_id" value={o.id} />
          <SubmitButton className="w-full" pendingText="Potvrzuji…">Boty mám, vše v pořádku</SubmitButton>
        </form>
      )}

      {isBuyer && o.status === 'dokonceno' && (
        <Card className="p-5">{review ? <p className="font-semibold">Hodnocení odesláno. Díky!</p> : <ReviewForm orderId={o.id} />}</Card>
      )}

      {/* ---------- Prodávající ---------- */}
      {isSeller && ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status) && (
        <Card className="flex flex-col gap-3 border-[1.5px] border-sun p-5">
          <p className="font-bold">
            Až vám přijde {formatCzk(o.price_czk + o.shipping_czk)}
            {o.shipping_czk > 0 && <span className="font-normal"> ({formatCzk(o.price_czk)} za boty + {formatCzk(o.shipping_czk)} poštovné)</span>}, pošlete boty a označte je jako odeslané.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Pošlete je na výdejní místo <strong className="text-ink">{o.pickup_point_name}</strong> pro {o.buyer_name}, třeba přes
            aplikaci Zásilkovny nebo Balíkovny. Poštovné zaplatíte z částky, kterou vám pošle kupující.
          </p>
          {o.submission_code && (
            <p className="text-sm">
              Podací kód: <strong className="font-mono text-lg tracking-widest">{o.submission_code}</strong>
              {o.packeta_barcode && <> · na balík napište: <strong>{o.packeta_barcode}</strong></>}
            </p>
          )}
          <ShippedForm orderId={o.id} />
        </Card>
      )}
      {isSeller && o.status === 'na_ceste' && (
        <p className="rounded-2xl bg-sky-soft px-4 py-3 text-sm font-semibold text-sky-ink">
          Odesláno{o.tracking_info ? ` (číslo zásilky ${o.tracking_info})` : ''}. Čeká se, až kupující potvrdí převzetí.
        </p>
      )}

      {(isBuyer || isSeller) && ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status) && (
        <CancelOrderForm orderId={o.id} paid />
      )}

      {o.status !== 'zruseno' && (
        <Card className="p-5">
          <Steps
            status={o.status}
            steps={[
              ['ceka_na_postovne', 'Rezervováno', 'Kupující platí prodejci QR kódem (boty + poštovné).'],
              ['na_ceste', 'Odesláno', 'Prodejce poslal boty na vybrané výdejní místo.'],
              ['dokonceno', 'Hotovo', 'Kupující potvrdí převzetí a ohodnotí prodejce.'],
            ]}
          />
        </Card>
      )}

      {(isBuyer || isSeller) && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">Zprávy</h2>
          {messages?.length ? (
            <ul className="flex flex-col gap-2">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] whitespace-pre-line',
                    m.sender_id === user.id ? 'self-end bg-forest-soft' : 'self-start bg-ground ring-1 ring-line',
                  )}
                >
                  {m.body}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Zatím žádné zprávy.</p>
          )}
          <MessageForm listingId={o.listing_id} recipientId={otherId} label={isBuyer ? 'Napsat prodejci' : 'Napsat kupujícímu'} />
        </Card>
      )}
    </div>
  )
}
