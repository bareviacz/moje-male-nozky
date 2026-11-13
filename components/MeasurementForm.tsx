'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { saveMeasurement } from '@/app/(app)/actions'
import { recommendedInnerLength } from '@/lib/fit'
import type { FormState } from '@/lib/forms'
import { resizeImage, uploadPhoto } from '@/lib/photos'
import { createClient } from '@/lib/supabase/client'
import { CameraIcon, CloseIcon } from './icons'
import { ChildPicker, type PickerChild } from './ChildPicker'
import { SubmitButton } from './SubmitButton'
import { cx, FormMessage, inputClass } from './ui'

const METHODS = [
  { value: 'home', label: 'Doma' },
  { value: 'store', label: 'V prodejně' },
  { value: 'template', label: 'Šablona' },
]

const numberInput =
  'h-12 w-full rounded-xl border-[1.5px] border-field bg-white px-3 font-display text-xl font-bold text-ink focus:border-forest focus:outline-none focus:ring-3 focus:ring-forest/15'

function parse(v: string) {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) && n >= 50 && n <= 350 ? Math.round(n) : null
}

export type MeasurementInitial = {
  id: string
  measured_at: string
  left_length_mm: number | null
  right_length_mm: number | null
  left_width_mm: number | null
  right_width_mm: number | null
  method: string | null
  photoUrl: string | null
}

const str = (n: number | null | undefined) => (n == null ? '' : String(n))

export function MeasurementForm({
  items,
  defaultChildId,
  lastLength,
  today,
  initial,
}: {
  items: PickerChild[]
  defaultChildId: string
  lastLength: Record<string, number | null>
  today: string
  initial?: MeasurementInitial
}) {
  // Fotka uložená u upravovaného měření (null = žádná nebo ji rodič odebral)
  const [keptPhoto, setKeptPhoto] = useState<string | null>(initial?.photoUrl ?? null)
  // Vybraná fotka se drží mimo formulář (React po odeslání formulář vymaže).
  const photoRef = useRef<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function choosePhoto(file: File | null) {
    photoRef.current = file
    setPreview(file ? URL.createObjectURL(file) : null)
    if (!file && fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit(prev: FormState, formData: FormData): Promise<FormState> {
    const file = photoRef.current
    if (file) {
      try {
        const blob = await resizeImage(file)
        const path = await uploadPhoto(createClient(), String(formData.get('child_id') ?? ''), 'mereni', blob)
        formData.set('photo_path', path)
      } catch (e) {
        const values: Record<string, string> = {}
        formData.forEach((v, k) => {
          if (typeof v === 'string' && !k.startsWith('$')) values[k] = v
        })
        return {
          error: `${e instanceof Error ? e.message : 'Fotku se nepodařilo nahrát.'} Měření můžete uložit i bez fotky.`,
          values,
        }
      }
    }
    return saveMeasurement(prev, formData)
  }

  const [state, action] = useActionState(submit, undefined)
  const [childId, setChildId] = useState(defaultChildId)
  const [left, setLeft] = useState(str(initial?.left_length_mm))
  const [right, setRight] = useState(str(initial?.right_length_mm))

  const l = parse(left)
  const r = parse(right)
  const longer = l != null || r != null ? Math.max(l ?? 0, r ?? 0) : null
  const longerSide = l != null && r != null ? (l > r ? 'left' : r > l ? 'right' : null) : null
  const prev = initial ? null : (lastLength[childId] ?? null)
  const rec = longer != null ? recommendedInnerLength(longer) : null

  const foot = (side: 'left' | 'right', label: string, value: string, set: (v: string) => void) => (
    <div
      className={cx(
        'flex flex-col gap-2.5 rounded-[18px] bg-white p-3.5',
        longerSide === side ? 'border-2 border-forest p-[13px]' : 'border border-line',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">{label}</span>
        {longerSide === side && (
          <span className="rounded-lg bg-forest-soft px-1.5 py-0.5 text-[11px] font-bold text-forest">delší</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${side}_length_mm`} className="text-xs font-bold text-muted">
          Délka (mm)
        </label>
        <input
          id={`${side}_length_mm`}
          name={`${side}_length_mm`}
          type="number"
          inputMode="numeric"
          min={50}
          max={350}
          value={value}
          onChange={(e) => set(e.target.value)}
          className={numberInput}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${side}_width_mm`} className="text-xs font-bold text-muted">
          Šířka (mm)
        </label>
        <input id={`${side}_width_mm`} name={`${side}_width_mm`} defaultValue={state?.values?.[`${side}_width_mm`] ?? str(initial?.[`${side}_width_mm`])} type="number" inputMode="numeric" min={20} max={150} className={numberInput} />
      </div>
    </div>
  )

  return (
    <form action={action} className="flex flex-col gap-[18px]">
      {initial && <input type="hidden" name="measurement_id" value={initial.id} />}
      {initial && !keptPhoto && initial.photoUrl && <input type="hidden" name="remove_photo" value="1" />}
      <ChildPicker items={items} value={childId} onChange={setChildId} legend={initial ? 'Dítě' : 'Komu měříte'} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="measured_at" className="text-sm font-bold">
          Datum měření
        </label>
        <input id="measured_at" name="measured_at" type="date" defaultValue={state?.values?.measured_at ?? initial?.measured_at ?? today} max={today} required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {foot('left', 'Levá nožka', left, setLeft)}
        {foot('right', 'Pravá nožka', right, setRight)}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Jak jste měřili</legend>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m, i) => (
            <label
              key={m.value}
              className="flex h-11 cursor-pointer items-center rounded-full border-[1.5px] border-field bg-white px-4 text-sm font-semibold has-checked:border-forest has-checked:bg-forest has-checked:font-bold has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-sun"
            >
              <input type="radio" name="method" value={m.value} defaultChecked={(state?.values?.method ?? initial?.method) ? (state?.values?.method ?? initial?.method) === m.value : i === 0} className="sr-only" />
              {m.label}
            </label>
          ))}
          {!preview && !keptPhoto && (
            <label className="flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-[#B9B1A4] px-3.5 text-sm font-semibold has-focus-visible:outline-3 has-focus-visible:outline-sun">
              <CameraIcon className="size-[18px]" />
              Fotka
              <span className="sr-only"> nožky (nepovinné)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
        {!preview && keptPhoto && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={keptPhoto} alt="Uložená fotka nožky" className="size-16 rounded-xl object-cover ring-1 ring-line" />
            <span className="flex-1 text-sm text-muted">Uložená fotka</span>
            <button
              type="button"
              onClick={() => setKeptPhoto(null)}
              aria-label="Odebrat fotku"
              className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-white hover:text-ink"
            >
              <CloseIcon className="size-5" strokeWidth={2} />
            </button>
          </div>
        )}
        {preview && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Vybraná fotka nožky" className="size-16 rounded-xl object-cover ring-1 ring-line" />
            <span className="flex-1 text-sm text-muted">Fotka se uloží spolu s měřením.</span>
            <button
              type="button"
              onClick={() => choosePhoto(null)}
              aria-label="Odebrat fotku"
              className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-white hover:text-ink"
            >
              <CloseIcon className="size-5" strokeWidth={2} />
            </button>
          </div>
        )}
      </fieldset>

      <div aria-live="polite" className="flex flex-col gap-1 rounded-[18px] bg-forest-soft px-4 py-3.5">
        <span className="text-[13px] font-bold text-forest">Výsledek</span>
        {rec && longer != null ? (
          <span className="text-[15px] leading-normal">
            {prev != null && (
              <>
                Oproti minule{' '}
                <strong>
                  {longer - prev >= 0 ? '+' : ''}
                  {longer - prev} mm
                </strong>
                .{' '}
              </>
            )}
            Boty by měly mít vnitřní délku{' '}
            <strong>
              {rec.min}–{rec.max} mm
            </strong>
            .
          </span>
        ) : (
          <span className="text-[15px] text-muted">
            Změřte od paty k nejdelšímu prstu, ve stoje a nejlépe odpoledne.
          </span>
        )}
      </div>

      <FormMessage error={state?.error} />

      <div className="sticky bottom-[84px] -mx-5 border-t border-line bg-ground/95 px-5 pt-3.5 pb-1 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="w-full">{initial ? 'Uložit změny' : 'Uložit měření'}</SubmitButton>
      </div>
    </form>
  )
}
