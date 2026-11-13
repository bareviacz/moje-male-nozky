'use client'

import { useState } from 'react'
import { cx } from '../ui'

/** Na mobilu sbalitelné „Další filtry“, na tabletu a počítači vždy otevřené. */
export function FiltersToggle({ defaultOpen, children }: { defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="dalsi-filtry"
        className="self-start text-sm font-bold text-forest md:hidden"
      >
        {open ? 'Méně filtrů ▴' : 'Další filtry ▾'}
      </button>
      <div id="dalsi-filtry" className={cx(open ? 'flex' : 'hidden', 'flex-col gap-4 md:flex')}>
        {children}
      </div>
    </div>
  )
}
