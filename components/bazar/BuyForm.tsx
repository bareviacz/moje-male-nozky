'use client'

import Script from 'next/script'
import { useActionState, useState } from 'react'
import { createGuestOrder, createOrder } from '@/app/bazar/actions'
import { BAZAR_SHIPPING_CZK, formatCzk } from '@/lib/bazar'
import { BAZAR_TERMS_PATH, ESHOP_TERMS_URL } from '@/lib/config'
import type { FormState } from '@/lib/forms'
import { SubmitButton } from '../SubmitButton'
import { BalikovnaMap } from './BalikovnaMap'
import { btn, cx, Field, FormMessage, inputClass } from '../ui'

type PacketaPoint = { id: string | number; name?: string; formatedValue?: string; place?: string }
declare global {
  interface Window {
    Packeta?: { Widget: { pick: (apiKey: string, cb: (p: PacketaPoint | null) => void, opts?: Record<string, unknown>) => void } }
  }
}

const PACKETA_KEY = process.env.NEXT_PUBLIC_PACKETA_API_KEY ?? ''

type Carrier = 'zasilkovna' | 'balikovna'
const CARRIER_LABEL: Record<Carrier, string> = { zasilkovna: 'Zásilkovna', balikovna: 'Balíkovna' }

export function BuyForm({
  listingId,
  price,
  defaultName,
  defaultEmail,
  sellerIsBarevia = false,
  extras = [],
  guest = false,
  loginHref,
}: {
  guest?: boolean
  loginHref?: string
  extras?: { id: string; title: string; size: number; price: number; photo: string | null }[]
  listingId: string
  price: number
  defaultName: string
  defaultEmail: string
  sellerIsBarevia?: boolean
}) {
  const [state, action] = useActionState<FormState, FormData>(guest ? createGuestOrder : createOrder, undefined)
  const [picked, setPicked] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 9 ? p : [...p, id]))
  const pickedPrice = extras.filter((e) => picked.includes(e.id)).reduce((s, e) => s + e.price, 0)
  const pairs = 1 + picked.length
  const shown = showAll ? extras : extras.slice(0, 6)
  const v = state?.values
  const [method, setMethod] = useState<'postovne' | 'vlastni_stitek'>(v?.shipping_method === 'vlastni_stitek' ? 'vlastni_stitek' : 'postovne')
  const shipping = method === 'postovne' ? BAZAR_SHIPPING_CZK : 0
  const initialCarrier: Carrier = v?.pickup_point_id?.startsWith('balikovna:') ? 'balikovna' : 'zasilkovna'
  const [carrier, setCarrier] = useState<Carrier>(initialCarrier)
  const [mapOpen, setMapOpen] = useState(false)
  const [point, setPoint] = useState<{ id: string; name: string } | null>(
    v?.pickup_point_name
      ? {
          id: (v.pickup_point_id ?? '').replace(/^(zasilkovna|balikovna):/, ''),
          name: v.pickup_point_name.replace(/^(Zásilkovna|Balíkovna): /, ''),
        }
      : null,
  )

  function pick() {
    window.Packeta?.Widget.pick(
      PACKETA_KEY,
      (p) => {
        if (p) setPoint({ id: String(p.id), name: p.formatedValue ?? p.name ?? p.place ?? String(p.id) })
      },
      { language: 'cs', country: 'cz', view: 'modal' },
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="listing_id" value={listingId} />
      {guest && (
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-sm leading-relaxed text-sun-ink">
          <strong>Nakupujete bez registrace.</strong> Odkaz na objednávku a QR platbu vám pošleme e-mailem. Nezaplacená rezervace se po 3 dnech
          sama zruší.{loginHref && (<> Máte účet? <a href={loginHref} className="font-bold underline">Přihlaste se</a>.</>)}
        </p>
      )}
      {picked.map((id) => (
        <input key={id} type="hidden" name="extra" value={id} />
      ))}

      {extras.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          <legend className="sr-only">Další boty od prodejce</legend>
          <div>
            <p className="font-bold">Přidat další boty od tohoto prodejce</p>
            <p className="text-sm text-muted">
              Přijdou v jednom balíku{method === 'postovne' ? ' a poštovné zaplatíte jen jednou' : ''}. Stačí zaškrtnout.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {shown.map((e) => {
              const on = picked.includes(e.id)
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => toggle(e.id)}
                    aria-pressed={on}
                    className={cx('relative flex w-full flex-col gap-1 rounded-xl p-2 text-left ring-1 transition', on ? 'bg-forest-soft ring-2 ring-forest' : 'bg-white ring-line hover:ring-forest/40')}
                  >
                    <span className={cx('absolute top-3 right-3 flex size-6 items-center justify-center rounded-full text-sm font-bold', on ? 'bg-forest text-white' : 'bg-white text-transparent ring-1 ring-line')}>✓</span>
                    {e.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.photo} alt="" className="aspect-square w-full rounded-lg bg-white object-contain" />
                    ) : (
                      <span className="aspect-square w-full rounded-lg bg-ground" />
                    )}
                    <span className="line-clamp-2 text-[13px] font-bold leading-snug">{e.title}</span>
                    <span className="text-[13px] text-muted tabular-nums">EU {String(e.size).replace('.', ',')} · {formatCzk(e.price)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {extras.length > 6 && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className="self-start text-sm font-bold text-forest">
              {showAll ? 'Zobrazit méně' : `Zobrazit všechny (${extras.length})`}
            </button>
          )}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Doprava</legend>
        <label className={cx('flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1', method === 'postovne' ? 'ring-2 ring-forest' : 'ring-line')}>
          <input type="radio" name="shipping_method" value="postovne" checked={method === 'postovne'} onChange={() => setMethod('postovne')} className="mt-1 size-5 accent-forest" />
          <span className="flex flex-col">
            <span className="font-bold">Pošle prodejce · {formatCzk(BAZAR_SHIPPING_CZK)}</span>
            <span className="text-sm text-muted">Poštovné zaplatíte prodejci spolu s botami v jednom QR kódu.</span>
          </span>
        </label>
        <label className={cx('flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1', method === 'vlastni_stitek' ? 'ring-2 ring-forest' : 'ring-line')}>
          <input type="radio" name="shipping_method" value="vlastni_stitek" checked={method === 'vlastni_stitek'} onChange={() => setMethod('vlastni_stitek')} className="mt-1 size-5 accent-forest" />
          <span className="flex flex-col">
            <span className="font-bold">Vlastní štítek · bez poštovného</span>
            <span className="text-sm text-muted">
              Zásilku si zaplatíte sami v aplikaci dopravce (Zásilkovna, Balíkovna…) a tam si zvolíte i výdejní místo. Podací kód vložíte do objednávky, prodejce s ním balík jen odnese.
            </span>
          </span>
        </label>
      </fieldset>

      {method === 'postovne' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">Kam boty poslat</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Dopravce">
            {(['zasilkovna', 'balikovna'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={carrier === c}
                onClick={() => {
                  if (carrier !== c) {
                    setCarrier(c)
                    setPoint(null)
                  }
                }}
                className={cx('rounded-2xl bg-white px-4 py-3 font-bold ring-1', carrier === c ? 'ring-2 ring-forest' : 'ring-line')}
              >
                {CARRIER_LABEL[c]}
              </button>
            ))}
          </div>
          <input type="hidden" name="pickup_point_id" value={point ? `${carrier}:${point.id}` : ''} />
          <input type="hidden" name="pickup_point_name" value={point ? `${CARRIER_LABEL[carrier]}: ${point.name}` : ''} />
          {point && <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold">{point.name}</p>}

          {carrier === 'balikovna' ? (
            <>
              <button type="button" onClick={() => setMapOpen(true)} className={btn.secondary}>
                {point ? 'Změnit Balíkovnu' : 'Vybrat Balíkovnu na mapě'}
              </button>
              {mapOpen && <BalikovnaMap onClose={() => setMapOpen(false)} onPick={(p) => { setPoint(p); setMapOpen(false) }} />}
            </>
          ) : PACKETA_KEY ? (
            <>
              <Script src="https://widget.packeta.com/v6/www/js/library.js" strategy="lazyOnload" />
              <button type="button" onClick={pick} className={btn.secondary}>
                {point ? 'Změnit výdejní místo' : 'Vybrat Z-BOX nebo výdejní místo na mapě'}
              </button>
            </>
          ) : (
            <>
              <input
                id="pickup_point_text"
                type="text"
                maxLength={180}
                value={point?.name ?? ''}
                onChange={(e) => setPoint(e.target.value.trim() ? { id: '', name: e.target.value } : null)}
                placeholder="např. Z-BOX Brno, Lidická 12"
                aria-label="Z-BOX nebo výdejní místo Zásilkovny"
                className={inputClass}
              />
              <span className="text-[13px] text-muted">Napište adresu Z-BOXu nebo výdejního místa Zásilkovny.</span>
            </>
          )}
        </fieldset>
      )}

      <Field label="Jméno a příjmení" htmlFor="buyer_name">
        <input id="buyer_name" name="buyer_name" type="text" autoComplete="name" maxLength={100} defaultValue={v?.buyer_name ?? defaultName} className={inputClass} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="buyer_email">
          <input id="buyer_email" name="buyer_email" type="email" autoComplete="email" defaultValue={v?.buyer_email ?? defaultEmail} className={inputClass} />
        </Field>
        <Field label="Telefon (pro SMS od dopravce)" htmlFor="buyer_phone">
          <input id="buyer_phone" name="buyer_phone" type="tel" autoComplete="tel" maxLength={20} defaultValue={v?.buyer_phone} className={inputClass} />
        </Field>
      </div>


      <dl className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-[15px] ring-1 ring-line tabular-nums">
        <div className="flex justify-between gap-3">
          <dt>{pairs > 1 ? `Boty (${pairs} ${pairs < 5 ? 'páry' : 'párů'})` : 'Boty'}</dt>
          <dd>{formatCzk(price + pickedPrice)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Poštovné</dt>
          <dd>{shipping ? formatCzk(shipping) : 'vlastní štítek'}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-1.5">
          <dt className="font-bold">Celkem, platíte QR platbou prodejci</dt>
          <dd className="font-bold">{formatCzk(price + pickedPrice + shipping)}</dd>
        </div>
      </dl>
      <p className="text-[13px] leading-relaxed text-muted">
        Objednáním si boty rezervujete a hned uvidíte QR kód pro platbu prodejci. Vy i prodejce uvidíte navzájem e-mail a
        telefon.{' '}
        {sellerIsBarevia ? (
          <>
            Boty prodává přímo Barevia, platí{' '}
            <a href={ESHOP_TERMS_URL} target="_blank" rel="noopener" className="font-bold text-forest underline">
              obchodní podmínky e-shopu barevia.cz
            </a>{' '}
            včetně 14 dnů na vrácení.
          </>
        ) : (
          <>
            Kupujete od soukromé osoby, proto se na nákup nevztahuje 14denní lhůta pro vrácení. Více v{' '}
            <a href={BAZAR_TERMS_PATH} target="_blank" className="font-bold text-forest underline">
              podmínkách Bazárku
            </a>
            .
          </>
        )}
      </p>

      {guest && (
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="terms_guest" required className="mt-0.5 size-5 shrink-0 accent-forest" />
          <span>
            Souhlasím s{' '}
            <a href={ESHOP_TERMS_URL} target="_blank" rel="noopener" className="font-bold text-forest underline">obchodními podmínkami</a>{' '}
            a se zpracováním osobních údajů pro vyřízení objednávky.
          </span>
        </label>
      )}
      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Rezervuji…">{pairs > 1 ? `Rezervovat ${pairs} ${pairs < 5 ? 'páry' : 'párů'} bot` : 'Rezervovat boty'}</SubmitButton>
    </form>
  )
}
