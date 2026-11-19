'use client'

import { useActionState } from 'react'
import { saveSeller } from '@/app/bazar/actions'
import { SubmitButton } from '../SubmitButton'
import { BAZAR_TERMS_PATH } from '@/lib/config'
import { Field, FormMessage, inputClass } from '../ui'

export function SellerForm({
  back,
  needAccount,
  initial,
  submitLabel,
}: {
  submitLabel?: string
  back: string
  needAccount: boolean
  initial?: { nickname?: string; city?: string | null; bank_account?: string; phone?: string | null }
}) {
  const [state, action] = useActionState(saveSeller, undefined)
  const v = state?.values
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="need_account" value={needAccount ? '1' : '0'} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Přezdívka v bazaru" htmlFor="nickname" hint="Uvidí ji ostatní rodiče.">
          <input id="nickname" name="nickname" type="text" maxLength={40} defaultValue={v?.nickname ?? initial?.nickname} placeholder="např. Jana z Brna" className={inputClass} />
        </Field>
        <Field label="Město" htmlFor="city" hint="Nepovinné.">
          <input id="city" name="city" type="text" maxLength={60} defaultValue={v?.city ?? initial?.city ?? ''} className={inputClass} />
        </Field>
      </div>
      {needAccount && (
        <>
          <Field
            label="Číslo účtu pro platbu za boty"
            htmlFor="bank_account"
            hint="Kupující ho uvidí až po rezervaci bot, v QR kódu pro platbu."
          >
            <input
              id="bank_account"
              name="bank_account"
              type="text"
              inputMode="text"
              autoComplete="off"
              defaultValue={v?.bank_account ?? initial?.bank_account}
              placeholder="123456789/0800"
              className={inputClass}
            />
          </Field>
          <Field label="Telefon" htmlFor="phone" hint="Nepovinné. Jen pro Barevii, kdyby se zásilka zatoulala.">
            <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} defaultValue={v?.phone ?? initial?.phone ?? ''} className={inputClass} />
          </Field>
        </>
      )}
      {!initial && (
        <div className="flex items-start gap-3">
          <input id="terms" name="terms" type="checkbox" required defaultChecked={v?.terms === 'on'} className="mt-0.5 size-[22px] shrink-0 accent-forest" />
          <label htmlFor="terms" className="text-sm leading-relaxed">
            Souhlasím s{' '}
            <a href={BAZAR_TERMS_PATH} target="_blank" className="font-bold text-forest underline">
              podmínkami užívání Bazárku
            </a>
            . Beru na vědomí, že obchod uzavírám přímo s druhým rodičem.
          </label>
        </div>
      )}
      <FormMessage error={state?.error} />
      <SubmitButton>{submitLabel ?? (needAccount ? 'Uložit a pokračovat' : 'Uložit přezdívku')}</SubmitButton>
    </form>
  )
}
