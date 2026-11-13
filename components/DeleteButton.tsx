'use client'

import { useState } from 'react'
import { SubmitButton } from './SubmitButton'

/** Smazání s potvrzením: první klepnutí se zeptá, druhé smaže. */
export function DeleteButton({
  action,
  name,
  value,
  label = 'Smazat',
  question,
}: {
  action: (formData: FormData) => Promise<void>
  name: string
  value: string
  label?: string
  question: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-coral-ink hover:bg-coral-soft"
      >
        {label}
      </button>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl bg-coral-soft p-4">
      <input type="hidden" name={name} value={value} />
      <p className="text-sm font-semibold text-coral-ink">{question}</p>
      <div className="flex flex-wrap gap-2">
        <SubmitButton
          variant="small"
          pendingText="Mažu…"
          className="bg-coral-ink hover:bg-[#82301C]"
        >
          Ano, smazat
        </SubmitButton>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-ink hover:bg-white/60"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}
