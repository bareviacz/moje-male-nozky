import Link from 'next/link'
import { Footprints } from '@/components/Footprints'
import { ChartIcon, RulerIcon, ShoeIcon } from '@/components/icons'
import { AppNamePill, Logo } from '@/components/Logo'
import { btn } from '@/components/ui'

const FEATURES = [
  { text: 'Historie měření pro každé dítě', Icon: RulerIcon, tone: 'bg-sun-soft text-sun-ink' },
  { text: 'Růstový graf chodidel', Icon: ChartIcon, tone: 'bg-forest-soft text-forest' },
  { text: 'Upozornění, když jsou boty malé', Icon: ShoeIcon, tone: 'bg-coral-soft text-coral-ink' },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-6 pt-6 pb-8 md:gap-10 md:px-10 md:pt-10">
      <header className="flex items-center justify-between gap-3">
        <Logo height={40} />
        <AppNamePill />
      </header>

      <div className="grid flex-1 items-center gap-6 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[342/236] overflow-hidden rounded-[28px] bg-forest-soft md:order-2">
          <Footprints className="absolute inset-0 size-full" />
          <div className="absolute right-[5%] bottom-[8%] flex flex-col gap-0.5 rounded-2xl bg-white px-3.5 py-2.5">
            <span className="text-xs font-semibold text-muted">Od posledního měření</span>
            <span className="font-display text-[22px] font-bold text-forest">+8 mm</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <h1 className="font-display text-[32px] leading-[1.1] font-bold md:text-5xl">
              Nožky rostou rychleji, než si myslíte.
            </h1>
            <p className="text-base leading-normal text-muted md:text-lg">
              Zapisujte délku chodidel, sledujte růst a včas poznejte, kdy jsou boty malé.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FEATURES.map(({ text, Icon, tone }) => (
              <li key={text} className="flex items-center gap-3">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="size-[22px]" />
                </span>
                <span className="text-[15px] font-semibold">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 md:flex-row">
            <Link href="/registrace" className={`${btn.primary} md:flex-1`}>
              Vytvořit účet
            </Link>
            <Link href="/prihlaseni" className={`${btn.secondary} md:flex-1`}>
              Už mám účet – přihlásit se
            </Link>
          </div>
          <Link href="/bazar" className="text-center text-[15px] font-bold text-forest underline">
            Bazárek: barefoot botičky od rodičů
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Od{' '}
        <a href="https://www.barevia.cz/" className="font-semibold text-forest underline">
          Barevia.cz
        </a>{' '}
        – barefoot obuv pro děti
      </p>
    </main>
  )
}
