import { restoreShoe, retireShoe } from '@/app/(app)/actions'
import { ESHOP_URL } from '@/lib/config'
import { asFitStatus, FIT_BADGE, FIT_BAR, FIT_LABEL, reservePercent, SOON_SMALL_BELOW_MM } from '@/lib/fit'
import { formatDate } from '@/lib/format'
import { SubmitButton } from './SubmitButton'
import { cx } from './ui'

export type ShoeView = {
  id: string
  brand: string | null
  model: string | null
  categoryName: string | null
  eshopUrl: string | null
  euSize: number | null
  innerLength: number | null
  reserve: number | null
  fitStatus: string | null
  retiredAt?: string | null
}

function title(s: ShoeView) {
  return [s.brand, s.model].filter(Boolean).join(' ') || s.categoryName || 'Boty'
}

export function ShoeCard({ shoe }: { shoe: ShoeView }) {
  const status = asFitStatus(shoe.fitStatus)
  const alert = status === 'soon_small' || status === 'too_small'
  const details = [
    shoe.categoryName,
    shoe.euSize != null ? `EU ${String(shoe.euSize).replace('.', ',')}` : null,
    shoe.innerLength != null ? `vnitřní ${shoe.innerLength} mm` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  if (shoe.retiredAt) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-white/70 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{title(shoe)}</span>
          <span className="text-[13px] text-muted">
            {details}
            {details && ' · '}vyřazeno {formatDate(shoe.retiredAt)}
          </span>
        </div>
        <form action={restoreShoe}>
          <input type="hidden" name="shoe_id" value={shoe.id} />
          <SubmitButton variant="ghost" pendingText="…">
            Vrátit
          </SubmitButton>
        </form>
      </div>
    )
  }

  return (
    <div className={cx('flex flex-col gap-3 rounded-[20px] bg-white p-4', alert ? 'border-[1.5px] border-sun' : 'border border-line')}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">{title(shoe)}</span>
          {details && <span className="text-[13px] text-muted">{details}</span>}
        </div>
        <span className={cx('rounded-[10px] px-2.5 py-1 text-xs font-bold whitespace-nowrap', FIT_BADGE[status])}>
          {FIT_LABEL[status]}
        </span>
      </div>

      {shoe.reserve != null && (
        <div className="flex flex-col gap-1.5">
          <div
            className="relative h-2 rounded bg-[#EFE9DF]"
            role="meter"
            aria-label="Rezerva v botě"
            aria-valuemin={0}
            aria-valuemax={16}
            aria-valuenow={Math.max(0, Math.min(16, shoe.reserve))}
            aria-valuetext={`${shoe.reserve} mm`}
          >
            <div className={cx('absolute inset-y-0 left-0 rounded', FIT_BAR[status])} style={{ width: `${reservePercent(shoe.reserve)}%` }} />
            <div className="absolute -top-[3px] h-3.5 w-0.5 bg-ink" style={{ left: `${reservePercent(SOON_SMALL_BELOW_MM)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>
              Rezerva <strong className="text-ink">{shoe.reserve} mm</strong>
            </span>
            <span>upozornění pod {SOON_SMALL_BELOW_MM} mm</span>
          </div>
        </div>
      )}
      {shoe.reserve == null && (
        <p className="text-xs text-muted">Pro výpočet rezervy doplňte vnitřní délku boty a změřte nožku.</p>
      )}

      {alert && (
        <a
          href={shoe.eshopUrl ?? ESHOP_URL}
          target="_blank"
          rel="noopener"
          className="flex h-[46px] items-center justify-center rounded-[14px] bg-sun-soft text-sm font-bold text-sun-deep hover:bg-[#FBE7BE]"
        >
          Najít větší velikost na barevia.cz
        </a>
      )}

      <form action={retireShoe} className="-mb-1 flex justify-end">
        <input type="hidden" name="shoe_id" value={shoe.id} />
        <SubmitButton variant="ghost" pendingText="Vyřazuji…" className="text-muted hover:text-ink">
          Vyřadit (už nenosí)
        </SubmitButton>
      </form>
    </div>
  )
}
