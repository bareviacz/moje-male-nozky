import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth-forms'
import { BackLink } from '@/components/ui'

export const metadata: Metadata = { title: 'Registrace' }

export default function RegisterPage() {
  return (
    <>
      <BackLink href="/" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold">Vytvořit účet</h1>
        <p className="text-[15px] leading-normal text-muted">
          Jeden účet pro celou rodinu. Děti přidáte hned po registraci.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-[15px] text-muted">
        Už máte účet?{' '}
        <Link href="/prihlaseni" className="font-bold text-forest">
          Přihlásit se
        </Link>
      </p>
    </>
  )
}
