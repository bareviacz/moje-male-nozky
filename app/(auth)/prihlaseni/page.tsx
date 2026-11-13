import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
import { BackLink, FormMessage } from '@/components/ui'

export const metadata: Metadata = { title: 'Přihlášení' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ chyba?: string; next?: string }> }) {
  const { chyba, next } = await searchParams
  return (
    <>
      <BackLink href="/" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold">Vítejte zpět</h1>
        <p className="text-[15px] leading-normal text-muted">Přihlaste se a podívejte se, jak nožky rostou.</p>
      </div>
      {chyba === 'odkaz' && (
        <FormMessage error="Odkaz z e-mailu už neplatí nebo byl použit. Přihlaste se prosím znovu." />
      )}
      <LoginForm next={next} />
      <p className="text-center text-[15px] text-muted">
        Nemáte účet?{' '}
        <Link href={next ? `/registrace?next=${encodeURIComponent(next)}` : '/registrace'} className="font-bold text-forest">
          Zaregistrujte se
        </Link>
      </p>
    </>
  )
}
