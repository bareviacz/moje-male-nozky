'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { setChildAvatar } from '@/app/(app)/actions'
import { PHOTO_BUCKET, resizeImage, uploadPhoto } from '@/lib/photos'
import { createClient } from '@/lib/supabase/client'
import { ChildAvatar } from './ChildAvatar'
import { CameraIcon } from './icons'

/** Avatar dítěte – klepnutím se vybere / vyfotí nová fotka. */
export function AvatarUploader({
  childId,
  name,
  index,
  photoUrl,
  currentPath,
}: {
  childId: string
  name: string
  index: number
  photoUrl: string | null
  currentPath: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const blob = await resizeImage(file)
      const supabase = createClient()
      const path = await uploadPhoto(supabase, childId, 'avatar', blob)
      const res = await setChildAvatar(childId, path)
      if (res.error) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path])
        throw new Error(res.error)
      }
      if (currentPath) await supabase.storage.from(PHOTO_BUCKET).remove([currentPath])
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fotku se nepodařilo nahrát.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={photoUrl ? `Změnit fotku – ${name}` : `Přidat fotku – ${name}`}
        className="relative block rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun"
      >
        <ChildAvatar name={name} index={index} photoUrl={photoUrl} />
        <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-forest text-white ring-2 ring-ground">
          <CameraIcon className="size-3.5" strokeWidth={2} />
        </span>
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 text-[11px] font-bold text-forest">
            …
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {error && (
        <p role="alert" className="absolute top-full left-0 z-10 mt-2 w-60 rounded-xl bg-coral-soft px-3 py-2 text-xs font-semibold text-coral-ink shadow-sm">
          {error}
        </p>
      )}
    </div>
  )
}
