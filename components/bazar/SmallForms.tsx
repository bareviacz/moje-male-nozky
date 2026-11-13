'use client'

import { useActionState, useState } from 'react'
import { cancelOrder, markShipped, reportListing, sendMessage, sendReview } from '@/app/bazar/actions'
import { SubmitButton } from '../SubmitButton'
import { cx, FormMessage, inputClass } from '../ui'

export function MessageForm({ listingId, recipientId, label = 'Zeptat se prodejce' }: { listingId: string; recipientId: string; label?: string }) {
  const [state, action] = useActionState(sendMessage, undefined)
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="recipient_id" value={recipientId} />
      <label htmlFor={`body-${recipientId}-${listingId}`} className="text-sm font-bold">{label}</label>
      <textarea
        id={`body-${recipientId}-${listingId}`}
        name="body"
        rows={3}
        maxLength={2000}
        defaultValue={state?.values?.body}
        key={state?.success ? 'sent' : 'draft'}
        placeholder={label === 'Zeptat se prodejce' ? 'Dobrý den, jakou mají boty šířku v nártu?' : 'Napište zprávu…'}
        className={cx(inputClass, 'h-auto py-3')}
      />
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton variant="secondary" pendingText="Posílám…">Poslat zprávu</SubmitButton>
    </form>
  )
}

export function ReportForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(reportListing, undefined)
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm font-semibold text-muted underline hover:text-ink">
        Nahlásit inzerát
      </button>
    )
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="listing_id" value={listingId} />
      <label htmlFor="reason" className="text-sm font-bold">Co je s inzerátem špatně?</label>
      <textarea id="reason" name="reason" rows={2} maxLength={1000} className={cx(inputClass, 'h-auto py-3')} />
      <FormMessage error={state?.error} success={state?.success} />
      {!state?.success && <SubmitButton variant="small" pendingText="Odesílám…">Nahlásit</SubmitButton>}
    </form>
  )
}

export function ReviewForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(sendReview, undefined)
  const [rating, setRating] = useState(5)
  if (state?.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-bold">Jak jste spokojeni s prodejcem?</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} z 5`}
              aria-pressed={n === rating}
              className={cx('text-3xl leading-none', n <= rating ? 'text-sun' : 'text-field')}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="comment" className="text-sm font-bold">Komentář <span className="font-normal text-muted">(nepovinný)</span></label>
      <textarea id="comment" name="comment" rows={2} maxLength={500} className={cx(inputClass, 'h-auto py-3')} />
      <FormMessage error={state?.error} />
      <SubmitButton variant="small" pendingText="Odesílám…">Poslat hodnocení</SubmitButton>
    </form>
  )
}

export function CancelOrderForm({ orderId, paid }: { orderId: string; paid: boolean }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(cancelOrder, undefined)
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm font-bold text-coral-ink underline">
        Zrušit rezervaci
      </button>
    )
  return (
    <form action={action} className="flex flex-col gap-2.5 rounded-2xl bg-coral-soft p-4">
      <input type="hidden" name="order_id" value={orderId} />
      <p className="text-sm font-bold text-coral-ink">Opravdu zrušit rezervaci? Boty se vrátí do nabídky a druhá strana dostane upozornění.</p>
      {paid && (
        <p className="text-sm text-coral-ink">Pokud už odešla platba za boty, vraťte si ji prosím navzájem.</p>
      )}
      <label htmlFor="reason" className="text-sm font-bold">Důvod <span className="font-normal">(nepovinný)</span></label>
      <textarea id="reason" name="reason" rows={2} maxLength={500} className={cx(inputClass, 'h-auto py-3')} />
      <FormMessage error={state?.error} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton variant="small" pendingText="Ruším…" className="bg-coral hover:bg-coral-ink">Ano, zrušit</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-bold text-ink">
          Nerušit
        </button>
      </div>
    </form>
  )
}

export function ShippedForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(markShipped, undefined)
  if (state?.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="order_id" value={orderId} />
      <label htmlFor={`tracking-${orderId}`} className="text-sm font-bold">
        Číslo zásilky <span className="font-normal text-muted">(nepovinné)</span>
      </label>
      <input id={`tracking-${orderId}`} name="tracking" type="text" maxLength={120} placeholder="např. Z 123 4567 890" className={inputClass} />
      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Ukládám…">Boty jsem odeslal/a</SubmitButton>
    </form>
  )
}
