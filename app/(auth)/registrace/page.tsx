import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth-forms'
import { BackLink } from '@/components/ui'

export const metadata: Metadata = { title: 'Registrace' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const fromBazar = !!next?.startsWith('/bazar')
  return (
    <>
      <BackLink href={fromBazar ? next! : '/'} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold">Vytvořit účet</h1>
        <p className="text-[15px] leading-normal text-muted">
          {fromBazar
            ? 'Jeden účet pro bazar i Moje malé nožky. Po potvrzení e-mailu se vrátíte k botám.'
            : 'Jeden účet pro celou rodinu. Děti přidáte hned po registraci.'}
        </p>
      </div>
      <RegisterForm next={next} />
      <p className="text-center text-[15px] text-muted">
        Už máte účet?{' '}
        <Link href={next ? `/prihlaseni?next=${encodeURIComponent(next)}` : '/prihlaseni'} className="font-bold text-forest">
          Přihlásit se
        </Link>
      </p>
    </>
  )
}
