import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'
import { SellerForm } from '@/components/bazar/SellerForm'
import { DeleteAccountForm } from '@/components/DeleteAccountForm'
import { ProfileForm } from '@/components/ProfileForm'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, PageTitle } from '@/components/ui'
import { PRIVACY_URL } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profil', robots: { index: false } }

export default async function BazarProfilePage({ searchParams }: { searchParams: Promise<{ ulozeno?: string }> }) {
  const { ulozeno } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni?next=/bazar/profil')

  const [{ data: profile }, { data: seller }, { data: priv }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    supabase.from('bazar_sellers').select('nickname, city').eq('user_id', user.id).maybeSingle(),
    supabase.from('bazar_seller_private').select('bank_account, phone').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageTitle sub={user.email}>Profil</PageTitle>

      {ulozeno && (
        <p role="status" className="rounded-2xl bg-forest-soft px-4 py-3 text-[15px] font-semibold text-forest">
          Uloženo.
        </p>
      )}

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-bold">V bazárku</h2>
          {seller && (
            <Link href={`/bazar/prodejce/${user.id}`} className="text-sm font-bold text-forest">
              Můj veřejný profil →
            </Link>
          )}
        </div>
        <SellerForm
          back="/bazar/profil?ulozeno=1"
          needAccount={!!priv}
          submitLabel="Uložit"
          initial={seller ? { ...seller, bank_account: priv?.bank_account, phone: priv?.phone } : undefined}
        />
        {!priv && <p className="text-sm text-muted">Číslo účtu pro platby nastavíte, až budete poprvé prodávat.</p>}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="font-display text-lg font-bold">Jméno v aplikaci</h2>
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <Link href="/prehled" className="text-[15px] font-semibold text-forest underline">
          Moje malé nožky – měření a boty dětí
        </Link>
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
    </div>
  )
}
