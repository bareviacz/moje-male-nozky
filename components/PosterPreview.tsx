'use client'

import { useEffect, useRef, useState } from 'react'

const A4_WIDTH_PX = 793.7 // 210 mm při 96 dpi

/** Na obrazovce plakát zmenší na šířku okna; při tisku zůstane ve skutečné velikosti. */
export function PosterPreview({ children }: { children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const update = () => setScale(Math.min(1, box.clientWidth / A4_WIDTH_PX))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={boxRef} className="poster-box w-full" style={{ height: `${297 * 3.7795 * scale}px` }}>
      <div className="poster-sheet shadow-lg ring-1 ring-line" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '210mm' }}>
        {children}
      </div>
    </div>
  )
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-forest px-5 text-base font-bold text-white hover:bg-forest-dark"
    >
      Vytisknout / uložit jako PDF
    </button>
  )
}
