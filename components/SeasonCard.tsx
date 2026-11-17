import Link from 'next/link'
import { ChildAvatar } from './ChildAvatar'
import { CalendarIcon } from './icons'
import { cx } from './ui'
import { daysBetween, formatAgo, formatDayMonth, todayIso } from '@/lib/format'

export type SeasonRow = {
  child_id: string | null
  child_name: string | null
  recommended_inner_min_mm: number | null
  recommended_inner_max_mm: number | null
  days_since_measurement: number | null
  last_measured_at: string | null
}
type ChildInfo = { id: string; name: string; index: number; photoUrl: string | null }

const THEMES = {
  winter: { bg: 'bg-sky-soft', ring: 'ring-[#BFD8F0]', ink: 'text-sky-ink', wave: '#C9DFF4', accent: 'bg-sky-ink', btn: 'bg-sky-ink hover:bg-[#163B5D]', emoji: '❄️' },
  summer: { bg: 'bg-sun-soft', ring: 'ring-[#F3DDA6]', ink: 'text-sun-deep', wave: '#F8E2AE', accent: 'bg-sun-deep', btn: 'bg-sun-deep hover:bg-[#4A3200]', emoji: '☀️' },
  slippers: { bg: 'bg-lilac-soft', ring: 'ring-[#D9C9EE]', ink: 'text-lilac-ink', wave: '#DDCDF0', accent: 'bg-lilac-ink', btn: 'bg-lilac-ink hover:bg-[#472C6B]', emoji: '🏠' },
  default: { bg: 'bg-forest-soft', ring: 'ring-[#BFDCCF]', ink: 'text-forest-dark', wave: '#C6E2D6', accent: 'bg-forest', btn: 'bg-forest hover:bg-forest-dark', emoji: '🌱' },
}

function themeFor(code: string) {
  if (code === 'winter') return THEMES.winter
  if (code === 'summer') return THEMES.summer
  if (code === 'slippers') return THEMES.slippers
  return THEMES.default
}

/** Výrazná karta sezóny: „Je čas na zimní boty“ s časovou osou nákupního období a dětmi. */
export function SeasonCard({
  code,
  categoryName,
  startsOn,
  endsOn,
  isOpen,
  daysUntilStart,
  eshopUrl,
  rows,
  childById,
}: {
  code: string
  categoryName: string
  startsOn: string | null
  endsOn: string | null
  isOpen: boolean
  daysUntilStart: number | null
  eshopUrl: string
  rows: SeasonRow[]
  childById: Map<string, ChildInfo>
}) {
  const t = themeFor(code)
  const name = categoryName.toLowerCase()

  // Kde v nákupním období jsme (0–100 %)
  let progress = 0
  let daysLeft: number | null = null
  if (startsOn && endsOn) {
    const total = Math.max(1, daysBetween(startsOn, endsOn))
    const done = daysBetween(startsOn, todayIso())
    progress = Math.max(0, Math.min(100, Math.round((done / total) * 100)))
    daysLeft = isOpen ? Math.max(0, daysBetween(todayIso(), endsOn)) : null
  }
  const firstChild = rows.find((r) => r.child_id)?.child_id

  return (
    <section aria-label={`Sezóna: ${name}`} className={cx('relative overflow-hidden rounded-[24px] p-4 pb-6 ring-1 sm:p-5 sm:pb-7', t.bg, t.ring)}>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full sm:h-7" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 14 C60 2 120 2 190 12 S320 22 400 8 V30 H0 Z" fill={t.wave} />
      </svg>

      <div className="relative flex flex-col gap-4">
        {/* Hlavička */}
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[28px] shadow-sm">
            {t.emoji}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className={cx('text-xs font-extrabold tracking-wider uppercase', t.ink)}>
              {isOpen ? 'Sezóna právě běží' : daysUntilStart != null ? `Sezóna začíná za ${daysUntilStart} dní` : 'Blíží se sezóna'}
            </span>
            <span className={cx('font-display text-[22px] leading-tight font-extrabold sm:text-[26px]', t.ink)}>
              {isOpen ? `Je čas na ${name}` : `Připravte se na ${name}`}
            </span>
          </div>
        </div>

        {/* Časová osa nákupního období */}
        {startsOn && endsOn && (
          <div className="rounded-2xl bg-white/80 p-3.5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <CalendarIcon className="size-4" />
                Nákupní období
              </span>
              <span className={cx('text-sm font-extrabold', t.ink)}>
                {daysLeft != null ? (daysLeft === 0 ? 'poslední den' : `zbývá ${daysLeft} dní`) : `od ${formatDayMonth(startsOn)}`}
              </span>
            </div>
            <div className="relative h-3.5 rounded-full bg-line">
              <div className={cx('absolute inset-y-0 left-0 rounded-full opacity-35', t.accent)} style={{ width: `${progress}%` }} />
              {isOpen && (
                <div
                  aria-hidden="true"
                  className={cx('absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow', t.accent)}
                  style={{ left: `${progress}%` }}
                />
              )}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-muted">
              <span>{formatDayMonth(startsOn)}</span>
              {isOpen && <span className={t.ink}>dnes</span>}
              <span>{formatDayMonth(endsOn)}</span>
            </div>
          </div>
        )}

        {/* Děti a doporučená délka */}
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const child = r.child_id ? childById.get(r.child_id) : undefined
            const stale = r.days_since_measurement != null && r.days_since_measurement > 60
            return (
              <li key={r.child_id ?? r.child_name} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2.5">
                {child && <ChildAvatar name={child.name} index={child.index} size="sm" photoUrl={child.photoUrl} />}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{r.child_name}</span>
                  {stale && r.last_measured_at && (
                    <span className="text-xs text-muted">měřeno {formatAgo(r.last_measured_at)} – změřte znovu</span>
                  )}
                </div>
                {r.recommended_inner_min_mm != null ? (
                  <span className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-muted">stélka</span>
                    <span className="font-display text-lg leading-none font-extrabold">
                      {r.recommended_inner_min_mm}–{r.recommended_inner_max_mm} mm
                    </span>
                  </span>
                ) : (
                  r.child_id && (
                    <Link href={`/mereni/nove?dite=${r.child_id}`} className={cx('text-sm font-bold underline', t.ink)}>
                      Změřit nožky
                    </Link>
                  )
                )}
              </li>
            )
          })}
        </ul>

        {/* Akce */}
        <div className="flex flex-wrap items-center gap-2.5">
          {firstChild && (
            <Link
              href={`/boty/vybrat?dite=${firstChild}`}
              className={cx('inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold text-white transition', t.btn)}
            >
              Najít {name}
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <a
            href={eshopUrl}
            target="_blank"
            rel="noopener"
            className={cx('inline-flex h-12 items-center rounded-full bg-white px-4 text-sm font-bold ring-1 ring-black/5 hover:bg-white/70', t.ink)}
          >
            barevia.cz
          </a>
        </div>
      </div>
    </section>
  )
}
