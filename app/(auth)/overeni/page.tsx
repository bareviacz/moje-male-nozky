import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { VerifyCodeForm } from '@/components/auth-forms'
import { MailIcon } from '@/components/icons'
import { BackLink } from '@/components/ui'

export const metadata: Metadata = { title: 'Kód z e-mailu' }

const TEXT: Record<string, { title: string; sub: string }> = {
  registrace: { title: 'Potvrďte e-mail', sub: 'Poslali jsme vám 6místný kód. Opište ho sem a účet je hotový.' },
  prihlaseni: { title: 'Přihlášení kódem', sub: 'Poslali jsme vám 6místný kód. Opište ho sem a jste přihlášení.' },
  heslo: { title: 'Nové heslo', sub: 'Poslali jsme vám 6místný kód. Po jeho opsání si nastavíte nové heslo.' },
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ typ?: string; email?: string; next?: string }> }) {
  const { typ = '', email = '', next } = await searchParams
  const t = TEXT[typ]
  if (!t || !email) redirect('/prihlaseni')
  return (
    <>
      <BackLink href="/prihlaseni" />
      <div className="flex flex-col gap-2">
        <MailIcon className="size-8 text-forest" />
        <h1 className="font-display text-[30px] font-bold">{t.title}</h1>
        <p className="text-[15px] leading-normal text-muted">
          {t.sub} E-mail: <strong className="text-ink">{email}</strong>
        </p>
        <p className="text-sm text-muted">Nedorazil? Podívejte se i do složky Hromadné nebo Spam. Kód platí 1 hodinu.</p>
      </div>
      <VerifyCodeForm email={email} typ={typ} next={next} />
    </>
  )
}
