'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  requestPasswordReset,
  sendMagicLink,
  signIn,
  signUp,
  updatePassword,
} from '@/app/(auth)/actions'
import { PRIVACY_URL } from '@/lib/config'
import { MailIcon } from './icons'
import { SubmitButton } from './SubmitButton'
import { btn, Field, FormMessage, inputClass } from './ui'

export function LoginForm({ next }: { next?: string } = {}) {
  const [state, action] = useActionState(signIn, undefined)
  const [magic, magicAction] = useActionState(sendMagicLink, undefined)
  const [email, setEmail] = useState('')

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="E-mail" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vas@email.cz"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm font-bold">
              Heslo
            </label>
            <Link href="/zapomenute-heslo" className="text-sm font-bold text-forest hover:text-forest-dark">
              Zapomenuté heslo?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <FormMessage error={state?.error} />
        <SubmitButton pendingText="Přihlašuji…">Přihlásit se</SubmitButton>
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-[#E6E0D6]" />
        <span className="text-[13px] text-muted">nebo</span>
        <div className="h-px flex-1 bg-[#E6E0D6]" />
      </div>

      <form action={magicAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <FormMessage error={magic?.error} success={magic?.success} />
        <SubmitButton variant="secondary" pendingText="Posílám…">
          <MailIcon className="size-5" />
          Poslat přihlašovací odkaz e-mailem
        </SubmitButton>
      </form>
    </div>
  )
}

export function RegisterForm({ next }: { next?: string } = {}) {
  const [state, action] = useActionState(signUp, undefined)

  if (state?.success)
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-forest-soft p-5">
        <MailIcon className="size-8 text-forest" />
        <p className="font-display text-xl font-bold">Zkontrolujte e-mail</p>
        <p className="text-[15px] leading-relaxed">{state.success}</p>
        <p className="text-sm text-muted">Nedorazil? Podívejte se i do složky Hromadné nebo Spam.</p>
      </div>
    )

  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Vaše jméno" htmlFor="name">
        <input id="name" name="name" type="text" defaultValue={state?.values?.name} autoComplete="given-name" placeholder="např. Jana" required maxLength={100} className={inputClass} />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <input id="email" name="email" type="email" defaultValue={state?.values?.email} autoComplete="email" inputMode="email" placeholder="vas@email.cz" required className={inputClass} />
      </Field>
      <Field label="Heslo" htmlFor="password" hint="Alespoň 8 znaků">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </Field>
      <div className="flex items-start gap-3">
        <input id="gdpr" name="gdpr" type="checkbox" defaultChecked={state?.values?.gdpr === 'on'} required className="mt-0.5 size-[22px] shrink-0 accent-forest" />
        <label htmlFor="gdpr" className="text-sm leading-relaxed">
          Souhlasím se{' '}
          <a href={PRIVACY_URL} target="_blank" rel="noopener" className="font-bold text-forest underline">
            zpracováním osobních údajů
          </a>{' '}
          o mně a mých dětech.
        </label>
      </div>
      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Zakládám účet…" className="mt-1">
        Zaregistrovat se
      </SubmitButton>
    </form>
  )
}

export function ResetForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-mail" htmlFor="email">
        <input id="email" name="email" type="email" defaultValue={state?.values?.email} autoComplete="email" inputMode="email" placeholder="vas@email.cz" required className={inputClass} />
      </Field>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton pendingText="Posílám…">Poslat odkaz</SubmitButton>
    </form>
  )
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nové heslo" htmlFor="password" hint="Alespoň 8 znaků">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton>Uložit heslo</SubmitButton>
      <Link href="/prehled" className={btn.ghost}>
        Přeskočit
      </Link>
    </form>
  )
}
