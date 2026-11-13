'use client'

import { useState } from 'react'
import { PHOTO_KIND_LABEL, type BazarPhotoKind } from '@/lib/bazar'
import { ShoeIcon } from '../icons'
import { cx } from '../ui'

export function Gallery({ photos }: { photos: { url: string; kind: BazarPhotoKind }[] }) {
  const [i, setI] = useState(0)
  const cur = photos[i]
  if (!cur)
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] border border-line bg-white text-field">
        <ShoeIcon className="size-20" strokeWidth={1.2} />
      </div>
    )
  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.url} alt={PHOTO_KIND_LABEL[cur.kind]} className="size-full object-contain" />
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold ring-1 ring-line">
          {PHOTO_KIND_LABEL[cur.kind]}
        </span>
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {photos.map((p, idx) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Fotka: ${PHOTO_KIND_LABEL[p.kind]}`}
              aria-pressed={idx === i}
              className={cx('aspect-square overflow-hidden rounded-xl border-2 bg-white', idx === i ? 'border-forest' : 'border-line')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
