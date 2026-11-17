import Link from 'next/link'
import { ChildAvatar } from './ChildAvatar'
import { ShoeIcon } from './icons'
import { cx } from './ui'
import { NEW_SHOE_MAX_EXTRA_MM, NEW_SHOE_MIN_EXTRA_MM, SOON_SMALL_BELOW_MM } from '@/lib/fit'

const SCALE_MM = 16

/** Výrazné upozornění „botičky jsou (skoro) malé“ s měřítkem místa u prstů. */
export function ShoeAlertCard({
  child,
  what,
  reserveMm,
  footMm,
  tooSmall,
  eshopUrl,
}: {
  child: { id: string; name: string; index: number; photoUrl: string | null }
  what: string
  reserveMm: number | null
  footMm: number | null
  tooSmall: boolean
  eshopUrl: string
}) {
  const t = tooSmall
    ? { bg: 'bg-coral-soft', ring: 'ring-[#F3C2B4]', ink: 'text-coral-ink', wave: '#F6CDBF', badge: 'bg-coral', btn: 'bg-coral-ink hover:bg-[#86301B]' }
    : { bg: 'bg-sun-soft', ring: 'ring-[#F3DDA6]', ink: 'text-sun-deep', wave: '#F8E2AE', badge: 'bg-sun', btn: 'bg-sun-deep hover:bg-[#4A3200]' }
  const reserve = reserveMm ?? 0
  const pos = (mm: number) => `${(Math.max(0, Math.min(SCALE_MM, mm)) / SCALE_MM) * 100}%`

  return (
    <section
      aria-label={`${child.name}: ${tooSmall ? 'boty už jsou malé' : 'boty budou brzy malé'}`}
      className={cx('relative overflow-hidden rounded-[24px] p-4 pb-6 ring-1 sm:p-5 sm:pb-7', t.bg, t.ring)}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full sm:h-7" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 14 C60 2 120 2 190 12 S320 22 400 8 V30 H0 Z" fill={t.wave} />
      </svg>

      <div className="relative flex flex-col gap-4">
        {/* Hlavička */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ChildAvatar name={child.name} index={child.index} size="lg" photoUrl={child.photoUrl} />
            <span className={cx('absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full text-white ring-2 ring-white', t.badge)}>
              <ShoeIcon className="size-4" strokeWidth={2.2} />
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className={cx('text-xs font-extrabold tracking-wider uppercase', t.ink)}>{tooSmall ? 'Je čas na nové' : 'Brzy bude čas na nové'}</span>
            <span className={cx('font-display text-[22px] leading-tight font-extrabold sm:text-[26px]', t.ink)}>
              {tooSmall ? 'Botičky už jsou malé' : 'Botičky jsou skoro malé'}
            </span>
            <span className="text-sm font-semibold text-ink/75">
              {child.name} · {what}
            </span>
          </div>
        </div>

        {/* Měřítko místa u prstů */}
        <div className="rounded-2xl bg-white/80 p-3.5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold">Místo u prstů</span>
            <span className={cx('font-display text-2xl font-extrabold', t.ink)}>
              {reserveMm == null ? '–' : `${reserve} mm`}
            </span>
          </div>
          <div className="relative h-3.5 rounded-full bg-line">
            <div className="absolute inset-y-0 left-0 rounded-l-full bg-[#F4B6A4]" style={{ width: pos(SOON_SMALL_BELOW_MM) }} />
            <div
              className="absolute inset-y-0 bg-forest-pale"
              style={{ left: pos(NEW_SHOE_MIN_EXTRA_MM), width: pos(NEW_SHOE_MAX_EXTRA_MM - NEW_SHOE_MIN_EXTRA_MM) }}
            />
            <div
              aria-hidden="true"
              className={cx('absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow', t.badge)}
              style={{ left: pos(reserve) }}
            />
          </div>
          <div className="relative mt-1.5 h-4 text-[11px] font-semibold text-muted">
            <span className="absolute left-0">0</span>
            <span className="absolute -translate-x-1/2 text-forest" style={{ left: pos((NEW_SHOE_MIN_EXTRA_MM + NEW_SHOE_MAX_EXTRA_MM) / 2) }}>
              nové boty {NEW_SHOE_MIN_EXTRA_MM}–{NEW_SHOE_MAX_EXTRA_MM} mm
            </span>
            <span className="absolute right-0">{SCALE_MM} mm</span>
          </div>
        </div>

        {footMm != null && (
          <p className="text-sm text-ink/80">
            Nožka měří <strong>{footMm} mm</strong> → nové boty s vnitřní délkou{' '}
            <strong>
              {footMm + NEW_SHOE_MIN_EXTRA_MM}–{footMm + NEW_SHOE_MAX_EXTRA_MM} mm
            </strong>
            .
          </p>
        )}

        {/* Akce */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/boty/vybrat?dite=${child.id}`}
            className={cx('inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold text-white transition', t.btn)}
          >
            Najít větší botičky
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href={eshopUrl}
            target="_blank"
            rel="noopener"
            className={cx('inline-flex h-12 items-center rounded-full bg-white px-4 text-sm font-bold ring-1 ring-black/5 hover:bg-white/70', t.ink)}
          >
            barevia.cz
          </a>
          <Link href={`/boty?dite=${child.id}`} className={cx('px-2 text-sm font-bold underline-offset-2 hover:underline', t.ink)}>
            Moje boty
          </Link>
        </div>
      </div>
    </section>
  )
}
