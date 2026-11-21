import type { Metadata } from 'next'
import { BazarNav } from '@/components/bazar/BazarNav'
import { createClient } from '@/lib/supabase/server'
import { BAZAR_TERMS_PATH, PRIVACY_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: {
    absolute: 'Bazárek Barevia – bazarové barefoot botičky',
    template: '%s · Bazárek Barevia',
  },
  description:
    'Kupujte a prodávejte bazarové dětské barefoot boty. Hledejte podle vnitřní délky stélky, plaťte QR kódem přímo prodejci.',
  manifest: '/bazar/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Bazárek', statusBarStyle: 'default' },
  applicationName: 'Bazárek Barevia',
}

export default async function BazarLayout({ children }: { children: React.ReactNode }) {
  // Kolik věcí čeká na přihlášeného (k odeslání / k zaplacení)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let todo = 0
  if (user) {
    const [{ count: toShip }, { count: toPay }] = await Promise.all([
      supabase.from('bazar_orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).in('status', ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani']),
      supabase.from('bazar_orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'ceka_na_postovne').is('paid_at', null),
    ])
    todo = (toShip ?? 0) + (toPay ?? 0)
  }

  return (
    <div className="min-h-dvh">
      <BazarNav todo={todo} loggedIn={!!user} />
      <main className="mx-auto w-full max-w-5xl px-5 pt-5 pb-6 md:px-8 md:pt-8">{children}</main>
      <footer className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-1 px-5 pb-28 text-[13px] text-muted md:px-8 md:pb-10">
        <a href={BAZAR_TERMS_PATH} className="font-semibold underline-offset-2 hover:underline">
          Podmínky užívání
        </a>
        <a href={PRIVACY_URL} target="_blank" rel="noopener" className="font-semibold underline-offset-2 hover:underline">
          Ochrana osobních údajů
        </a>
        <span>© Barevia.cz</span>
      </footer>
    </div>
  )
}
