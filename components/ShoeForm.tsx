'use client'

import { useActionState, useState } from 'react'
import { saveShoe } from '@/app/(app)/actions'
import { FIT_BADGE, FIT_LABEL, NEW_SHOE_MAX_EXTRA_MM, SOON_SMALL_BELOW_MM, type FitStatus } from '@/lib/fit'
import { ChildPicker, type PickerChild } from './ChildPicker'
import { SubmitButton } from './SubmitButton'
import { cx, Field, FormMessage, inputClass } from './ui'

export type ShoeInitial = {
  id: string
  category: string | null
  brand: string | null
  model: string | null
  eu_size: number | null
  inner_length_mm: number | null
  inner_width_mm: number | null
  purchased_at: string | null
}

function statusFor(reserve: number): FitStatus {
  if (reserve <= 0) return 'too_small'
  if (reserve < SOON_SMALL_BELOW_MM) return 'soon_small'
  if (reserve > NEW_SHOE_MAX_EXTRA_MM) return 'roomy'
  return 'ok'
}

export function ShoeForm({
  items,
  defaultChildId,
  lastLength,
  categories,
  today,
  initial,
}: {
  items: PickerChild[]
  defaultChildId: string
  lastLength: Record<string, number | null>
  categories: { code: string; name: string }[]
  today: string
  initial?: ShoeInitial
}) {
  const [state, action] = useActionState(saveShoe, undefined)
  const [childId, setChildId] = useState(defaultChildId)
  const [inner, setInner] = useState(initial?.inner_length_mm != null ? String(initial.inner_length_mm) : '')
  const init = (k: keyof ShoeInitial) => {
    const x = initial?.[k]
    return x == null ? undefined : String(x)
  }

  const foot = lastLength[childId] ?? null
  const innerNum = Number(inner)
  const reserve = foot != null && inner.trim() !== '' && Number.isFinite(innerNum) ? Math.round(innerNum) - foot : null
  const status = reserve != null ? statusFor(reserve) : null
  const v = state?.values

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="shoe_id" value={initial.id} />}
      <ChildPicker items={items} value={childId} onChange={setChildId} legend="Čí boty" />

      <Field label="Druh obuvi" htmlFor="category">
        <select id="category" name="category" defaultValue={v?.category ?? init('category') ?? ''} className={inputClass}>
          <option value="">Vyberte…</option>
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Značka" htmlFor="brand">
          <input id="brand" name="brand" type="text" maxLength={100} defaultValue={v?.brand ?? init('brand')} placeholder="např. Bugga" className={inputClass} />
        </Field>
        <Field label="Model" htmlFor="model">
          <input id="model" name="model" type="text" maxLength={200} defaultValue={v?.model ?? init('model')} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="EU velikost" htmlFor="eu_size">
          <input id="eu_size" name="eu_size" type="text" inputMode="decimal" defaultValue={v?.eu_size ?? init('eu_size')?.replace('.', ',')} placeholder="např. 25" className={inputClass} />
        </Field>
        <Field label="Vnitřní délka (mm)" htmlFor="inner_length_mm">
          <input
            id="inner_length_mm"
            name="inner_length_mm"
            type="number"
            inputMode="numeric"
            min={60}
            max={380}
            value={inner}
            onChange={(e) => setInner(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="-mt-2 text-[13px] text-muted">Vnitřní délku stélky najdete ve velikostní tabulce u produktu.</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Vnitřní šířka (mm)" htmlFor="inner_width_mm">
          <input id="inner_width_mm" name="inner_width_mm" type="number" inputMode="numeric" min={20} max={160} defaultValue={v?.inner_width_mm ?? init('inner_width_mm')} className={inputClass} />
        </Field>
        <Field label="Koupeno" htmlFor="purchased_at">
          <input id="purchased_at" name="purchased_at" type="date" max={today} defaultValue={v?.purchased_at ?? init('purchased_at')} className={inputClass} />
        </Field>
      </div>

      <div aria-live="polite">
        {status && reserve != null && (
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3.5 ring-1 ring-line">
            <span className="text-[15px]">
              Rezerva oproti poslední délce nožky: <strong>{reserve} mm</strong>
            </span>
            <span className={cx('rounded-[10px] px-2.5 py-1 text-xs font-bold whitespace-nowrap', FIT_BADGE[status])}>
              {FIT_LABEL[status]}
            </span>
          </div>
        )}
        {foot == null && (
          <p className="text-[13px] text-muted">Dítě zatím nemá měření – rezervu spočítáme po prvním změření.</p>
        )}
      </div>

      <FormMessage error={state?.error} />
      <SubmitButton className="mt-1">{initial ? 'Uložit změny' : 'Uložit boty'}</SubmitButton>
    </form>
  )
}
