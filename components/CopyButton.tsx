'use client'

import { useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

/** Malé tlačítko „zkopírovat do schránky“ vedle údaje (jméno, telefon, adresa…). */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // starší prohlížeče: dočasné textové pole
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? `${label} zkopírováno` : `Zkopírovat ${label}`}
      title={done ? 'Zkopírováno' : 'Zkopírovat'}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
        done ? 'bg-forest-soft text-forest' : 'text-muted hover:bg-forest-soft hover:text-forest'
      }`}
    >
      {done ? <CheckIcon className="size-[18px]" strokeWidth={2.4} /> : <CopyIcon className="size-[18px]" />}
    </button>
  )
}
