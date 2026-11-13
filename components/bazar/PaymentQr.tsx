'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

/** QR platba (SPAYD) – vykreslí se v prohlížeči. */
export function PaymentQr({ text }: { text: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: 'M' })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null))
    return () => {
      alive = false
    }
  }, [text])
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR kód pro platbu za boty" className="size-44 rounded-2xl bg-white p-2 ring-1 ring-line" />
  ) : (
    <div className="size-44 animate-pulse rounded-2xl bg-line motion-reduce:animate-none" aria-hidden="true" />
  )
}
