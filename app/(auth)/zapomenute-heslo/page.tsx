import type { Metadata } from 'next'
import { ResetForm } from '@/components/auth-forms'
import { BackLink } from '@/components/ui'

export const metadata: Metadata = { title: 'Zapomenuté heslo' }

export default function ForgotPasswordPage() {
  return (
    <>
      <BackLink href="/prihlaseni" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold">Zapomenuté heslo</h1>
        <p className="text-[15px] leading-normal text-muted">
          Pošleme vám e-mail s odkazem, přes který si nastavíte nové heslo.
        </p>
      </div>
      <ResetForm />
    </>
  )
}
