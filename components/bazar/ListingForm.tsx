'use client'

import { useActionState, useMemo, useRef, useState } from 'react'
import { createListing } from '@/app/bazar/actions'
import { BAZAR_BUCKET, CONDITION_LABEL, PHOTO_KIND_LABEL, WIDTH_LABEL, type BazarPhotoKind } from '@/lib/bazar'
import type { FormState } from '@/lib/forms'
import { resizeImage } from '@/lib/photos'
import { createClient } from '@/lib/supabase/client'
import { CameraIcon, CloseIcon } from '../icons'
import { SubmitButton } from '../SubmitButton'
import { cx, Field, FormMessage, inputClass } from '../ui'

export type ListingPrefill = {
  source_shoe_id?: string
  brand?: string | null
  model?: string | null
  size_eu?: number | null
  inner_length_mm?: number | null
  inner_width_mm?: number | null
  category?: string | null
}

const SLOTS: { kind: BazarPhotoKind; required?: boolean; hint: string }[] = [
  { kind: 'celek', required: true, hint: 'z boku · povinná' },
  { kind: 'podrazka', required: true, hint: 'povinná' },
  { kind: 'stelka', hint: 'shora · nepovinná' },
  { kind: 'detail', hint: 'odřeniny apod. · nepovinná' },
]

type Slot = { file: File; url: string; path?: string }

export function ListingForm({
  userId,
  categories,
  prefill,
}: {
  userId: string
  categories: { code: string; name: string }[]
  prefill?: ListingPrefill
}) {
  const listingId = useMemo(() => crypto.randomUUID(), [])
  const [photos, setPhotos] = useState<Partial<Record<BazarPhotoKind, Slot>>>({})
  const photosRef = useRef(photos)
  photosRef.current = photos

  function setPhoto(kind: BazarPhotoKind, file: File | null) {
    const old = photosRef.current[kind]
    if (old) URL.revokeObjectURL(old.url)
    const next = { ...photosRef.current }
    if (file) next[kind] = { file, url: URL.createObjectURL(file) }
    else delete next[kind]
    setPhotos(next)
  }

  async function submit(prev: FormState, formData: FormData): Promise<FormState> {
    const keep = () => {
      const values: Record<string, string> = {}
      formData.forEach((val, k) => {
        if (typeof val === 'string' && !k.startsWith('$')) values[k] = val
      })
      return values
    }
    if (!photosRef.current.celek) return { error: 'Přidejte fotku celé boty z boku.', values: keep() }
    if (!photosRef.current.podrazka) return { error: 'Přidejte fotku podrážky. Podle ní kupující pozná, jak moc jsou boty sešlapané.', values: keep() }
    const supabase = createClient()
    try {
      for (const { kind } of SLOTS) {
        const slot = photosRef.current[kind]
        if (!slot) continue
        if (!slot.path) {
          const blob = await resizeImage(slot.file)
          const path = `${userId}/${listingId}/${kind}-${crypto.randomUUID()}.jpg`
          const { error } = await supabase.storage.from(BAZAR_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
          if (error) throw new Error('Fotku se nepodařilo nahrát. Zkuste to prosím znovu.')
          slot.path = path
        }
        formData.append('photo', `${kind}:${slot.path}`)
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fotku se nepodařilo nahrát.', values: keep() }
    }
    return createListing(prev, formData)
  }

  const [state, action] = useActionState(submit, undefined)
  const v = state?.values
  const val = (k: keyof ListingPrefill) => {
    const x = prefill?.[k]
    return x == null ? undefined : String(x).replace('.', k === 'size_eu' ? ',' : '.')
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listingId} />
      {prefill?.source_shoe_id && <input type="hidden" name="source_shoe_id" value={prefill.source_shoe_id} />}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Fotky</legend>
        <div className="grid grid-cols-4 gap-2.5">
          {SLOTS.map(({ kind, required, hint }) => {
            const slot = photos[kind]
            return (
              <div key={kind} className="relative">
                <label
                  className={cx(
                    'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-[1.5px] border-dashed bg-white p-1 text-center text-xs font-semibold text-muted hover:text-ink has-focus-visible:outline-3 has-focus-visible:outline-sun',
                    required ? 'border-sun' : 'border-[#B9B1A4]',
                  )}
                >
                  {slot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slot.url} alt="" className="absolute inset-0 size-full rounded-2xl object-cover" />
                  ) : (
                    <>
                      <CameraIcon className="size-6" />
                      <span className="font-bold text-ink">{PHOTO_KIND_LABEL[kind]}</span>
                      <span>{hint}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={`Fotka: ${PHOTO_KIND_LABEL[kind]}`}
                    onChange={(e) => setPhoto(kind, e.target.files?.[0] ?? null)}
                  />
                </label>
                {slot && (
                  <button
                    type="button"
                    onClick={() => setPhoto(kind, null)}
                    aria-label={`Odebrat fotku: ${PHOTO_KIND_LABEL[kind]}`}
                    className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-white text-ink shadow ring-1 ring-line hover:text-coral-ink"
                  >
                    <CloseIcon className="size-4" strokeWidth={2.2} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <span className="text-[13px] text-muted">Povinné jsou první dvě fotky (celá bota a podrážka), další jsou nepovinné. Foťte prosím jen boty, ne děti. Fotky jsou v bazaru veřejné.</span>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Značka" htmlFor="brand">
          <input id="brand" name="brand" type="text" maxLength={40} defaultValue={v?.brand ?? val('brand')} placeholder="např. Be Lenka" className={inputClass} />
        </Field>
        <Field label="Model (nepovinné)" htmlFor="model">
          <input id="model" name="model" type="text" maxLength={60} defaultValue={v?.model ?? val('model')} className={inputClass} />
        </Field>
        <Field label="EU velikost" htmlFor="size_eu">
          <input id="size_eu" name="size_eu" type="text" inputMode="decimal" defaultValue={v?.size_eu ?? val('size_eu')} placeholder="25" className={inputClass} />
        </Field>
        <Field label="Vnitřní délka (mm)" htmlFor="inner_length_mm">
          <input id="inner_length_mm" name="inner_length_mm" type="number" inputMode="numeric" min={90} max={300} defaultValue={v?.inner_length_mm ?? val('inner_length_mm')} className={inputClass} />
        </Field>
      </div>
      <p className="-mt-3 text-[13px] text-muted">
        Podle vnitřní délky stélky rodiče boty hledají. Změřte ji uvnitř boty od paty ke špičce, nebo ji opište z velikostní tabulky výrobce.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Vnitřní šířka (mm)" htmlFor="inner_width_mm" hint="Nepovinné.">
          <input id="inner_width_mm" name="inner_width_mm" type="number" inputMode="numeric" min={30} max={120} defaultValue={v?.inner_width_mm ?? val('inner_width_mm')} className={inputClass} />
        </Field>
        <Field label="Šířka boty" htmlFor="width">
          <select id="width" name="width" defaultValue={v?.width ?? 'normalni'} className={inputClass}>
            {Object.entries(WIDTH_LABEL).map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Druh" htmlFor="category">
          <select id="category" name="category" defaultValue={v?.category ?? prefill?.category ?? ''} className={inputClass}>
            <option value="">Vyberte…</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Stav" htmlFor="condition">
          <select id="condition" name="condition" defaultValue={v?.condition ?? 'lehce_nosene'} className={inputClass}>
            {Object.entries(CONDITION_LABEL).filter(([k]) => k !== 'hodne_nosene' || v?.condition === 'hodne_nosene').map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Cena (Kč)" htmlFor="price_czk">
        <input id="price_czk" name="price_czk" type="number" inputMode="numeric" min={1} max={20000} step={1} defaultValue={v?.price_czk} placeholder="590" className={inputClass} />
      </Field>
      <Field label="Popis" htmlFor="description" hint="Jak dlouho se nosily, vady, jestli jsou vyprané…">
        <textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={v?.description} className={cx(inputClass, 'h-auto py-3')} />
      </Field>

      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Nahrávám fotky a zveřejňuji…">Zveřejnit inzerát</SubmitButton>
    </form>
  )
}
