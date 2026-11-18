import Link from 'next/link'
import { Footprints } from './Footprints'

const STEPS = [
  { n: 1, title: 'Přidejte dítě', text: 'Jméno a datum narození', color: 'bg-sun text-sun-deep' },
  { n: 2, title: 'Změřte nožky', text: 'Stačí pravítko nebo naše měřítko', color: 'bg-coral text-white' },
  { n: 3, title: 'My hlídáme boty', text: 'Upozorníme, až budou malé', color: 'bg-sky text-white' },
]

/** Uvítací karta na přehledu, dokud rodič nemá žádné dítě. */
export function FirstChildCard() {
  return (
    <section
      aria-labelledby="prvni-dite"
      className="relative overflow-hidden rounded-[28px] bg-forest-soft p-5 pb-8 ring-1 ring-forest-pale sm:p-7 sm:pb-10"
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 w-full sm:h-8" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 14 C60 2 120 2 190 12 S320 22 400 8 V30 H0 Z" fill="#CFE6DC" />
      </svg>
      <Footprints className="pointer-events-none absolute -top-2 -right-6 hidden h-40 w-56 opacity-90 sm:block md:h-48 md:w-64" />

      <div className="relative flex flex-col gap-5 sm:max-w-[62%]">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold tracking-wider text-forest uppercase">Začínáme</span>
          <h2 id="prvni-dite" className="font-display text-[26px] leading-tight font-bold text-forest-dark sm:text-[30px]">
            Přidejte první dítě
          </h2>
          <p className="text-[15px] text-ink/80">Za minutu máte přehled, jak nožky rostou a kdy bude potřeba nová velikost.</p>
        </div>

        <ol className="grid gap-2.5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-white sm:flex-col sm:items-start sm:gap-2">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${s.color}`}>{s.n}</span>
              <span className="flex flex-col">
                <span className="text-[15px] font-bold">{s.title}</span>
                <span className="text-[13px] text-muted">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <Link
          href="/deti/nove"
          className="inline-flex h-[54px] items-center justify-center gap-2 self-start rounded-2xl bg-forest px-6 text-base font-bold text-white shadow-sm transition hover:bg-forest-dark"
        >
          <span aria-hidden="true" className="text-xl leading-none">+</span>
          Přidat dítě
        </Link>
      </div>
    </section>
  )
}
