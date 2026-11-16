import { ESHOP_TIP_BY_CATEGORY, ESHOP_TIP_DEFAULT, utm } from '@/lib/config'
import { ShoeIcon } from '../icons'
import { cx } from '../ui'

/** Proklik z bazárku do e-shopu: „Nesehnali jste? Podívejte se na nové botičky od Barevie.“ */
export function EshopTip({ category, place, className }: { category?: string; place: string; className?: string }) {
  const url = utm(ESHOP_TIP_BY_CATEGORY[category ?? ''] ?? ESHOP_TIP_DEFAULT, place, 'bazar')
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className={cx(
        'flex flex-col justify-between gap-3 rounded-[20px] bg-sun-soft p-4 transition hover:bg-[#FBE7BE] sm:p-5',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-white text-sun-deep">
        <ShoeIcon className="size-6" strokeWidth={1.9} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-display text-lg leading-tight font-bold">Nesehnali jste? Nevadí.</span>
        <span className="text-sm leading-relaxed text-ink/80">
          Podívejte se na nové barefoot botičky v e-shopu Barevia – s vnitřní délkou u každé velikosti.
        </span>
      </span>
      <span className="text-sm font-bold text-sun-deep">Na barevia.cz →</span>
    </a>
  )
}
