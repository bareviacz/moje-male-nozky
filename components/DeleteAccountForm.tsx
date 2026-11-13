'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteAccount } from '@/app/(app)/actions'
import { btn, Field, FormMessage, inputClass } from './ui'

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(deleteAccount, undefined)

  if (!open && !state?.error)
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.ghost}>
        Smazat účet
      </button>
    )

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-coral-soft p-5">
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-lg font-bold text-coral-ink">Smazat účet natrvalo</p>
        <p className="text-sm leading-relaxed text-coral-ink">
          Smažeme váš účet, profily dětí, které jste založili, všechna měření, boty a fotky, a také vaše inzeráty a zprávy v
          bazárku. Vrátit to nejde.
        </p>
      </div>
      <Field label="Pro potvrzení zadejte heslo" htmlFor="delete_password">
        <input id="delete_password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input name="confirm" type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-coral" />
        Rozumím, že se účet a všechna data smažou natrvalo.
      </label>
      <FormMessage error={state?.error} />
      <DeleteButton />
      <button type="button" onClick={() => setOpen(false)} className={btn.ghost}>
        Zpět
      </button>
    </form>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[54px] items-center justify-center rounded-2xl bg-coral-ink px-5 text-base font-bold text-white transition disabled:opacity-60"
    >
      {pending ? 'Mažu účet…' : 'Smazat účet natrvalo'}
    </button>
  )
}
