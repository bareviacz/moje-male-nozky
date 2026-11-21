import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { addToOrder, confirmReceived } from '@/app/bazar/actions'
import { coverPhoto } from '@/components/bazar/ListingCard'
import { PaymentQr } from '@/components/bazar/PaymentQr'
import { BuyerLabelForm, CancelOrderForm, MessageForm, ReviewForm, ShippedForm } from '@/components/bazar/SmallForms'
import { SubmitButton } from '@/components/SubmitButton'
import { CopyButton } from '@/components/CopyButton'
import { Card, cx, PageTitle } from '@/components/ui'
import {
  accountToIban,
  formatCzk,
  formatEu,
  listingTitle,
  ORDER_STATUS_LABEL,
  thumbUrl,
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

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pridano?: string; pridat?: string }>
}) {
  const { id } = await params
  const { pridano, pridat } = await searchParams
  if (!isUuid(id)) notFound()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=/bazar/objednavka/${id}`)

  const { data: o } = await supabase
    .from('bazar_orders')
    .select(
      'id, status, buyer_id, seller_id, buyer_name, cancelled_by, cancel_reason, tracking_info, price_czk, shipping_czk, shipping_method, buyer_label_code, pickup_point_name, submission_code, packeta_barcode, paid_at, paid_amount, created_at, listing_id, bazar_listings!bazar_orders_listing_id_fkey(id, brand, model, size_eu, inner_length_mm, bazar_listing_photos(storage_path, kind, position)), bazar_order_items(listing_id, price_czk, created_at, bazar_listings(id, brand, model, size_eu, bazar_listing_photos(storage_path, kind, position)))',
    )
    .eq('id', id)
    .maybeSingle()
  if (!o) notFound()

  const isBuyer = o.buyer_id === user.id
  const isSeller = o.seller_id === user.id
  const otherId = isBuyer ? o.seller_id : o.buyer_id
  const l = o.bazar_listings

  const paid = !!o.paid_at
  const canAdd = isBuyer && o.status === 'ceka_na_postovne' && !paid
  const [{ data: other }, { data: pay }, { data: review }, { data: messages }, { data: contacts }, { data: more }] = await Promise.all([
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
    canAdd
      ? supabase
          .from('bazar_listings')
          .select('id, brand, model, size_eu, price_czk, bazar_listing_photos(storage_path, kind, position)')
          .eq('seller_id', o.seller_id)
          .eq('status', 'aktivni')
          .order('size_eu', { ascending: true })
          .limit(60)
      : Promise.resolve({ data: null }),
  ])
  const items = [...(o.bazar_order_items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const contact = (contacts ?? []).find((c) => c.role === (isBuyer ? 'prodejce' : 'kupujici'))

  // Zprávy pro mě označit jako přečtené
  if (messages?.some((m) => m.recipient_id === user.id && !m.read_at)) {
    await supabase.from('bazar_messages').update({ read_at: new Date().toISOString() }).eq('listing_id', o.listing_id).eq('recipient_id', user.id).is('read_at', null)
  }

  const payment = pay?.[0]
  const iban = payment ? accountToIban(payment.bank_account) : null
  const qr = payment && iban ? spayd({ iban, amount: payment.amount_czk, vs: payment.variable_symbol, message: `Bazarek Barevia ${l ? listingTitle(l) : ''}` }) : null
  const ownLabel = o.shipping_method === 'vlastni_stitek'
  const open = ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link href="/bazar/moje" className="self-start text-sm font-bold text-forest">← Moje prodeje a nákupy</Link>
      <PageTitle sub={`Objednáno ${formatDate(o.created_at.slice(0, 10))} · ${ORDER_STATUS_LABEL[o.status]}`}>
        {isBuyer ? 'Kupuji' : isSeller ? 'Prodávám' : 'Objednávka'}
      </PageTitle>

      {pridano && <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">Boty jsme přidali k objednávce. Částka k zaplacení se upravila.</p>}
      {pridat && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-[15px] font-semibold text-coral-ink">Tyhle boty už přidat nejde, mezitím je asi někdo koupil.</p>}

      <Card className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {(items.length ? items : [{ listing_id: o.listing_id, price_czk: o.price_czk, bazar_listings: l }]).map((it) => {
            const il = it.bazar_listings
            const ic = il ? coverPhoto(il.bazar_listing_photos ?? []) : null
            return (
              <li key={it.listing_id} className="flex items-center gap-3.5">
                {ic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl(ic.storage_path)} alt="" className="size-16 shrink-0 rounded-xl bg-white object-contain ring-1 ring-line" />
                ) : (
                  <span className="size-16 shrink-0 rounded-xl bg-ground ring-1 ring-line" />
                )}
                <Link href={`/bazar/${it.listing_id}`} className="flex min-w-0 flex-col">
                  <span className="font-bold">{il ? listingTitle(il) : 'Boty'}</span>
                  <span className="text-sm text-muted tabular-nums">{il && `EU ${formatEu(il.size_eu)} · `}{formatCzk(it.price_czk)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col gap-0.5 border-t border-line pt-3 text-sm text-muted">
          <span className="tabular-nums">
            {items.length > 1 ? `${items.length} ${items.length < 5 ? 'páry' : 'párů'} bot · ` : 'Boty '}
            {formatCzk(o.price_czk)}{ownLabel ? ' · vlastní štítek' : o.shipping_czk > 0 ? ` + poštovné ${formatCzk(o.shipping_czk)} = ` : ''}
            {!ownLabel && o.shipping_czk > 0 && <strong className="text-ink">{formatCzk(o.price_czk + o.shipping_czk)}</strong>}
            {' · '}{isBuyer ? `od ${other?.nickname ?? 'prodejce'}` : `pro ${o.buyer_name}`}
          </span>
          {ownLabel ? (
            <span>Doručení: {o.pickup_point_name}</span>
          ) : (
            <span className="flex items-start gap-1">
              <span className="pt-2">Doručení: {o.pickup_point_name}</span>
              <CopyButton value={(o.pickup_point_name ?? "").replace(/^(Zásilkovna|Balíkovna):\s*/, '')} label="adresu výdejního místa" />
            </span>
          )}
        </div>
      </Card>

      {canAdd && !!more?.length && (
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <h2 className="font-display text-lg font-bold">Přidat další boty od tohoto prodejce</h2>
            <p className="text-sm text-muted">
              Pošle vám je v jednom balíku{ownLabel ? '' : ' a poštovné zaplatíte jen jednou'}. Přidávat jde, dokud nezaplatíte.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {more.map((m) => {
              const mc = coverPhoto(m.bazar_listing_photos ?? [])
              return (
                <li key={m.id} className="flex flex-col gap-1.5 rounded-2xl p-2 ring-1 ring-line">
                  <Link href={`/bazar/${m.id}`} className="flex flex-col gap-1">
                    {mc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl(mc.storage_path)} alt="" className="aspect-square w-full rounded-xl bg-white object-contain" />
                    ) : (
                      <span className="aspect-square w-full rounded-xl bg-ground" />
                    )}
                    <span className="line-clamp-2 text-sm font-bold leading-snug">{listingTitle(m)}</span>
                    <span className="text-sm text-muted tabular-nums">EU {formatEu(m.size_eu)} · {formatCzk(m.price_czk)}</span>
                  </Link>
                  <form action={addToOrder} className="mt-auto">
                    <input type="hidden" name="order_id" value={o.id} />
                    <input type="hidden" name="listing_id" value={m.id} />
                    <SubmitButton className="w-full !px-3 !py-2 text-sm" pendingText="Přidávám…">Přidat</SubmitButton>
                  </form>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {contact && (
        <Card className="flex flex-col gap-1.5 p-5">
          <h2 className="font-display text-lg font-bold">{isBuyer ? 'Kontakt na prodejce' : 'Kontakt na kupujícího'}</h2>
          <p className="flex items-center gap-1 text-[15px]">
            <span>
              <strong>{isBuyer ? contact.nickname : o.buyer_name}</strong>
              {!isBuyer && <span className="text-muted"> ({contact.nickname})</span>}
            </span>
            <CopyButton value={isBuyer ? contact.nickname : o.buyer_name} label="jméno" />
          </p>
          <p className="flex items-center gap-1 text-[15px]">
            <a href={`mailto:${contact.email}`} className="min-w-0 font-semibold break-all text-forest underline">{contact.email}</a>
            <CopyButton value={contact.email} label="e-mail" />
          </p>
          {contact.phone && (
            <p className="flex items-center gap-1 text-[15px]">
              <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="font-semibold text-forest underline">{contact.phone}</a>
              <CopyButton value={contact.phone} label="telefon" />
            </p>
          )}
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
      {paid && o.status !== 'zruseno' && ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status) && (
        <p className="rounded-2xl bg-forest px-4 py-3 text-[15px] font-semibold text-white">
          ✓ Zaplaceno {formatDate(o.paid_at!.slice(0, 10))}{o.paid_amount ? ` (${formatCzk(o.paid_amount)})` : ''}.{' '}
          {isBuyer ? 'Platba dorazila, boty brzy odešleme.' : 'Platba dorazila na účet, můžete poslat boty.'}
        </p>
      )}
      {isBuyer && o.status === 'ceka_na_postovne' && !paid && (
        <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Boty máte rezervované. Zaplaťte prodejci QR kódem níže{ownLabel ? '.' : ', částka už obsahuje poštovné.'}
        </p>
      )}
      {isBuyer && ownLabel && open && (
        <Card className="flex flex-col gap-3 border-[1.5px] border-sun p-5">
          <p className="font-bold">{o.buyer_label_code ? 'Podací kód máte vložený' : 'Pošlete prodejci podací kód'}</p>
          <p className="text-sm leading-relaxed text-muted">
            V aplikaci Zásilkovny nebo Balíkovny vytvořte a zaplaťte zásilku na svoje výdejní místo. Jako odesílatele
            uveďte prodejce (kontakt je výše). Podací kód vložte sem, prodejce ho uvidí a dostane e-mail.
          </p>
          <BuyerLabelForm orderId={o.id} current={o.buyer_label_code} />
        </Card>
      )}
      {isBuyer && o.status === 'na_ceste' && (
        <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Prodejce boty odeslal/a.{o.tracking_info ? ` Číslo zásilky: ${o.tracking_info}.` : ''} Až si je vyzvednete, potvrďte převzetí.
        </p>
      )}

      {payment && !paid && (isBuyer || isSeller) && ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani'].includes(o.status) && (
        <Card className="flex flex-col gap-4 p-5">
          <p className="font-bold">
            {isBuyer
              ? `Zaplaťte ${formatCzk(payment.amount_czk)} prodejci ${payment.seller_nickname}`
              : `Platba za boty od kupujícího: ${formatCzk(payment.amount_czk)}`}
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qr && <PaymentQr text={qr} />}
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 text-[15px] tabular-nums">
              <dt className="text-muted">Účet</dt>
              <dd className="flex items-center gap-1 font-bold">{payment.bank_account}<CopyButton value={payment.bank_account} label="číslo účtu" /></dd>
              <dt className="text-muted">Částka</dt>
              <dd className="font-bold">{formatCzk(payment.amount_czk)}</dd>
              <dt className="text-muted">VS</dt>
              <dd className="flex items-center gap-1 font-bold">{payment.variable_symbol}<CopyButton value={String(payment.variable_symbol)} label="variabilní symbol" /></dd>
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
            {ownLabel && !o.buyer_label_code ? 'Čeká se na podací kód od kupujícího. ' : ''}{paid ? 'Platba dorazila. ' : ''}Až vám přijde {formatCzk(o.price_czk + o.shipping_czk)}
            {o.shipping_czk > 0 && <span className="font-normal"> ({formatCzk(o.price_czk)} za boty + {formatCzk(o.shipping_czk)} poštovné)</span>}, pošlete boty a označte je jako odeslané.
          </p>
          {ownLabel ? (
            <>
              <p className="text-sm leading-relaxed text-muted">
                Kupující si zásilku zaplatil/a sám/sama (vlastní štítek). Balík jen podáte s jeho podacím kódem, nic neplatíte.
              </p>
              {o.buyer_label_code ? (
                <p className="whitespace-pre-wrap rounded-2xl bg-forest-soft px-4 py-3 text-[15px]">
                  Podací kód od kupujícího: <strong className="font-mono text-lg tracking-widest">{o.buyer_label_code}</strong>
                </p>
              ) : (
                <p className="rounded-2xl bg-white px-4 py-3 text-sm text-muted ring-1 ring-line">Kód zatím nepřišel. Pošleme vám e-mail, jakmile ho kupující vloží.</p>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              Pošlete je na výdejní místo <strong className="text-ink">{o.pickup_point_name}</strong> pro {o.buyer_name}, třeba přes
              aplikaci Zásilkovny nebo Balíkovny. Poštovné zaplatíte z částky, kterou vám pošle kupující.
            </p>
          )}
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
              ['ceka_na_postovne', 'Rezervováno', ownLabel ? 'Kupující platí prodejci QR kódem a posílá podací kód.' : 'Kupující platí prodejci QR kódem (boty + poštovné).'],
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
