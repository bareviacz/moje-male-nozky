'use client'

import Script from 'next/script'
import { useActionState, useState } from 'react'
import { createOrder } from '@/app/bazar/actions'
import { BAZAR_SHIPPING_CZK, formatCzk } from '@/lib/bazar'
import type { FormState } from '@/lib/forms'
import { SubmitButton } from '../SubmitButton'
import { btn, Field, FormMessage, inputClass } from '../ui'

type PacketaPoint = { id: string | number; name?: string; formatedValue?: string; place?: string }
declare global {
  interface Window {
    Packeta?: { Widget: { pick: (apiKey: string, cb: (p: PacketaPoint | null) => void, opts?: Record<string, unknown>) => void } }
  }
}

const PACKETA_KEY = process.env.NEXT_PUBLIC_PACKETA_API_KEY ?? ''

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
  const [point, setPoint] = useState<{ id: string; name: string } | null>(
    v?.pickup_point_name ? { id: v.pickup_point_id ?? '', name: v.pickup_point_name } : null,
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
        <legend className="mb-1 text-sm font-bold">Kam boty poslat (Zásilkovna)</legend>
        {PACKETA_KEY ? (
          <>
            <Script src="https://widget.packeta.com/v6/www/js/library.js" strategy="lazyOnload" />
            <input type="hidden" name="pickup_point_id" value={point?.id ?? ''} />
            <input type="hidden" name="pickup_point_name" value={point?.name ?? ''} />
            {point && <p className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold">{point.name}</p>}
            <button type="button" onClick={pick} className={btn.secondary}>
              {point ? 'Změnit výdejní místo' : 'Vybrat Z-BOX nebo výdejní místo'}
            </button>
          </>
        ) : (
          <>
            <input type="hidden" name="pickup_point_id" value="" />
            <input
              id="pickup_point_name"
              name="pickup_point_name"
              type="text"
              maxLength={200}
              defaultValue={v?.pickup_point_name}
              placeholder="např. Z-BOX Brno, Lidická 12"
              aria-label="Z-BOX nebo výdejní místo Zásilkovny"
              className={inputClass}
            />
            <span className="text-[13px] text-muted">Napište adresu Z-BOXu nebo výdejního místa. Mapa Zásilkovny se sem doplní.</span>
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
        <Field label="Telefon (pro SMS od Zásilkovny)" htmlFor="buyer_phone">
          <input id="buyer_phone" name="buyer_phone" type="tel" autoComplete="tel" maxLength={20} defaultValue={v?.buyer_phone} className={inputClass} />
        </Field>
      </div>

      <dl className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-[15px] ring-1 ring-line tabular-nums">
        <div className="flex justify-between gap-3">
          <dt>Poštovné, platíte Barevii</dt>
          <dd className="font-bold">{formatCzk(BAZAR_SHIPPING_CZK)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Boty, platíte QR platbou prodejci</dt>
          <dd className="font-bold">{formatCzk(price)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-1.5">
          <dt className="font-bold">Celkem</dt>
          <dd className="font-bold">{formatCzk(price + BAZAR_SHIPPING_CZK)}</dd>
        </div>
      </dl>
      <p className="text-[13px] leading-relaxed text-muted">
        Objednáním si boty rezervujete. Po zaplacení poštovného uvidíte QR kód pro platbu prodejci a prodejce dostane kód
        k odeslání. Kupujete od soukromé osoby, proto se na nákup nevztahuje 14denní lhůta pro vrácení.
      </p>

      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Rezervuji…">Rezervovat boty</SubmitButton>
    </form>
  )
}
