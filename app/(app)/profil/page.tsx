import type { Metadata } from 'next'
import { signOut } from '@/app/(auth)/actions'
import { AppNamePill, Logo } from '@/components/Logo'
import { DeleteAccountForm } from '@/components/DeleteAccountForm'
import { ProfileForm } from '@/components/ProfileForm'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, Page, PageTitle } from '@/components/ui'
import { ESHOP_URL, PRIVACY_URL } from '@/lib/config'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()

  return (
    <Page>
      <PageTitle sub={user.email}>Profil</PageTitle>

      <Card className="flex flex-col gap-4">
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-bold">Užitečné odkazy</h2>
        <a href={ESHOP_URL} target="_blank" rel="noopener" className="text-[15px] font-semibold text-forest underline">
          E-shop Barevia.cz
        </a>
        <a href={PRIVACY_URL} target="_blank" rel="noopener" className="text-[15px] font-semibold text-forest underline">
          Zásady ochrany osobních údajů
        </a>
      </Card>

      <form action={signOut}>
        <SubmitButton variant="secondary" pendingText="Odhlašuji…" className="w-full">
          Odhlásit se
        </SubmitButton>
      </form>

      <DeleteAccountForm />

      <div className="flex flex-col items-center gap-2 pt-4 md:hidden">
        <Logo height={28} />
        <AppNamePill />
      </div>
    </Page>
  )
}
