import Link from 'next/link'
import {
  CONDITION_LABEL,
  CONDITION_STRIPE,
  formatCzk,
  formatEu,
  listingTitle,
  publicPhotoUrl,
  WIDTH_LABEL,
  type BazarCondition,
  type BazarPhotoKind,
  type BazarWidth,
} from '@/lib/bazar'
import { ShoeIcon } from '../icons'
import { cx } from '../ui'

export type ListingCardData = {
  id: string
  brand: string
  model: string | null
  size_eu: number
  inner_length_mm: number
  width: BazarWidth
  condition: BazarCondition
  price_czk: number
  status: string
  categoryName: string | null
  isBarevia: boolean
  photos: { storage_path: string; kind: BazarPhotoKind; position: number }[]
}

export function coverPhoto(photos: ListingCardData['photos']) {
  const sorted = [...photos].sort((a, b) => a.position - b.position)
  return sorted.find((p) => p.kind === 'celek') ?? sorted[0] ?? null
}

export function ListingCard({ l, footMm }: { l: ListingCardData; footMm?: number | null }) {
  const cover = coverPhoto(l.photos)
  const reserve = footMm ? l.inner_length_mm - footMm : null
  return (
    <Link
      href={`/bazar/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white transition hover:-translate-y-0.5 hover:border-field motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] bg-ground">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicPhotoUrl(cover.storage_path)} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-field">
            <ShoeIcon className="size-16" strokeWidth={1.2} />
          </div>
        )}
        {l.isBarevia && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-forest px-2.5 py-1 text-xs font-bold text-white">Prodává Barevia</span>
        )}
        {l.status === 'rezervovano' && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-sun px-2.5 py-1 text-xs font-bold text-sun-deep">Rezervováno</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="font-display text-xl font-bold tabular-nums">{formatCzk(l.price_czk)}</span>
        <span className="font-bold leading-snug">{listingTitle(l)}</span>
        <span className="text-[13px] text-muted tabular-nums">
          EU {formatEu(l.size_eu)} · stélka {l.inner_length_mm} mm · {WIDTH_LABEL[l.width].toLowerCase()}
        </span>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <span className={cx('rounded-full border border-l-4 border-line bg-ground px-2 py-0.5 text-xs font-bold', CONDITION_STRIPE[l.condition])}>
            {CONDITION_LABEL[l.condition]}
          </span>
          {l.categoryName && <span className="rounded-full border border-line bg-ground px-2 py-0.5 text-xs font-bold">{l.categoryName}</span>}
          {reserve != null && (
            <span className="rounded-full bg-forest-soft px-2 py-0.5 text-xs font-bold text-forest tabular-nums">+{reserve} mm rezerva</span>
          )}
        </div>
      </div>
    </Link>
  )
}
