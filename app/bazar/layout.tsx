import type { Metadata } from 'next'
import { BazarNav } from '@/components/bazar/BazarNav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    absolute: 'Bazárek Barevia – obnošené barefoot botičky',
    template: '%s · Bazárek Barevia',
  },
  description:
    'Kupujte a prodávejte obnošené dětské barefoot boty. Hledejte podle vnitřní délky stélky, posílejte přes Z-BOX bez tisku štítku.',
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
      supabase.from('bazar_orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'ceka_na_postovne'),
    ])
    todo = (toShip ?? 0) + (toPay ?? 0)
  }

  return (
    <div className="min-h-dvh">
      <BazarNav todo={todo} />
      <main className="mx-auto w-full max-w-5xl px-5 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>
    </div>
  )
}
