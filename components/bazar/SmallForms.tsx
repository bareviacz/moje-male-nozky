'use client'

import { useActionState, useState } from 'react'
import { reportListing, sendMessage, sendReview } from '@/app/bazar/actions'
import { SubmitButton } from '../SubmitButton'
import { cx, FormMessage, inputClass } from '../ui'

export function MessageForm({ listingId, recipientId }: { listingId: string; recipientId: string }) {
  const [state, action] = useActionState(sendMessage, undefined)
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="recipient_id" value={recipientId} />
      <label htmlFor="body" className="text-sm font-bold">Zeptat se prodejce</label>
      <textarea
        id="body"
        name="body"
        rows={3}
        maxLength={2000}
        defaultValue={state?.values?.body}
        key={state?.success ? 'sent' : 'draft'}
        placeholder="Dobrý den, jakou mají boty šířku v nártu?"
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
