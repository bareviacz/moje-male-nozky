'use client'

import { useEffect } from 'react'

type BalikovnaPoint = { id?: string | number; name?: string; address?: string; zip?: string; municipality_name?: string }

const ORIGIN = 'https://b2c.cpost.cz'

/** Oficiální mapa Balíkoven České pošty (bez API klíče). Výběr přijde přes postMessage „pickerResult“. */
export function BalikovnaMap({
  onPick,
  onClose,
}: {
  onPick: (p: { id: string; name: string }) => void
  onClose: () => void
}) {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== ORIGIN) return
      const d = e.data as { message?: string; point?: BalikovnaPoint; id?: string | number } | null
      if (d?.message !== 'pickerResult' || !d.point) return
      const pt = d.point
      const id = String(pt.id ?? d.id ?? pt.zip ?? '')
      const name = [pt.name, pt.address].filter(Boolean).join(', ') || id
      onPick({ id, name: name.slice(0, 180) })
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('keydown', onKey)
    }
  }, [onPick, onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Výběr Balíkovny">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <span className="font-bold">Vyberte Balíkovnu</span>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 font-semibold ring-1 ring-line">
            Zavřít
          </button>
        </div>
        <iframe
          title="Výběr místa pro vyzvednutí zásilky"
          src={`${ORIGIN}/locations/?type=BALIKOVNY`}
          allow="geolocation"
          className="w-full flex-1 border-0"
        />
      </div>
    </div>
  )
}
