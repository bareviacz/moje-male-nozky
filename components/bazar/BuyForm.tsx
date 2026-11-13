'use client'

import Script from 'next/script'
import { useActionState, useState } from 'react'
import { createOrder } from '@/app/bazar/actions'
import { BAZAR_SHIPPING_CZK, formatCzk } from '@/lib/bazar'
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
}: {
  listingId: string
  price: number
  defaultName: string
  defaultEmail: string
}) {
  const [state, action] = useActionState<FormState, FormData>(createOrder, undefined)
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
              Zásilku si zaplatíte sami v aplikaci dopravce (Zásilkovna, Balíkovna…) a podací kód vložíte do objednávky. Prodejce s ním balík jen odnese.
            </span>
          </span>
        </label>
      </fieldset>

      <dl className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-[15px] ring-1 ring-line tabular-nums">
        <div className="flex justify-between gap-3">
          <dt>Boty</dt>
          <dd>{formatCzk(price)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Poštovné</dt>
          <dd>{shipping ? formatCzk(shipping) : 'vlastní štítek'}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-1.5">
          <dt className="font-bold">Celkem, platíte QR platbou prodejci</dt>
          <dd className="font-bold">{formatCzk(price + shipping)}</dd>
        </div>
      </dl>
      <p className="text-[13px] leading-relaxed text-muted">
        Objednáním si boty rezervujete a hned uvidíte QR kód pro platbu prodejci. Vy i prodejce uvidíte navzájem e-mail
        a telefon. Kupujete od soukromé osoby, proto se na nákup nevztahuje 14denní lhůta pro vrácení.
      </p>

      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Rezervuji…">Rezervovat boty</SubmitButton>
    </form>
  )
}
