import type { Metadata } from 'next'
import { NewPasswordForm } from '@/components/auth-forms'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nové heslo' }

export default async function NewPasswordPage() {
  await requireUser()
  return (
    <>
      <div className="flex flex-col gap-2 pt-6">
        <h1 className="font-display text-[30px] font-bold">Nové heslo</h1>
        <p className="text-[15px] leading-normal text-muted">Zvolte si nové heslo k účtu.</p>
      </div>
      <NewPasswordForm />
    </>
  )
}
