'use client'

import { useActionState } from 'react'
import { saveChild } from '@/app/(app)/actions'
import { SubmitButton } from './SubmitButton'
import { Field, FormMessage, inputClass } from './ui'

export type ChildInitial = { id: string; name: string; birth_date: string; sex: string | null }

export function ChildForm({ today, initial }: { today: string; initial?: ChildInitial }) {
  const [state, action] = useActionState(saveChild, undefined)
  const v = state?.values

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="child_id" value={initial.id} />}
      <Field label="Jméno dítěte" htmlFor="name">
        <input id="name" name="name" type="text" defaultValue={v?.name ?? initial?.name} required maxLength={100} autoComplete="off" placeholder="např. Eliška" className={inputClass} />
      </Field>
      <Field label="Datum narození" htmlFor="birth_date">
        <input id="birth_date" name="birth_date" type="date" defaultValue={v?.birth_date ?? initial?.birth_date} required min="2000-01-01" max={today} className={inputClass} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">
          Pohlaví <span className="font-normal text-muted">(nepovinné)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'girl', label: 'Holka' },
            { value: 'boy', label: 'Kluk' },
            { value: '', label: 'Neuvádět' },
          ].map((o) => (
            <label
              key={o.value || 'none'}
              className="flex h-11 cursor-pointer items-center rounded-full border-[1.5px] border-field bg-white px-4 text-sm font-semibold has-checked:border-forest has-checked:bg-forest has-checked:text-white"
            >
              <input
                type="radio"
                name="sex"
                value={o.value}
                defaultChecked={(v?.sex ?? initial?.sex ?? '') === o.value}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      {!initial && (
        <p className="text-[13px] text-muted">Fotku dítěte přidáte po uložení klepnutím na jeho kolečko.</p>
      )}
      <FormMessage error={state?.error} />
      <SubmitButton className="mt-2">{initial ? 'Uložit změny' : 'Uložit dítě'}</SubmitButton>
    </form>
  )
}
