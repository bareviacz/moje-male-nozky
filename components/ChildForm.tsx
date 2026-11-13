'use client'

import { useActionState } from 'react'
import { createChild } from '@/app/(app)/actions'
import { SubmitButton } from './SubmitButton'
import { Field, FormMessage, inputClass } from './ui'

export function ChildForm({ today }: { today: string }) {
  const [state, action] = useActionState(createChild, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Jméno dítěte" htmlFor="name">
        <input id="name" name="name" type="text" defaultValue={state?.values?.name} required maxLength={100} autoComplete="off" placeholder="např. Eliška" className={inputClass} />
      </Field>
      <Field label="Datum narození" htmlFor="birth_date">
        <input id="birth_date" name="birth_date" type="date" defaultValue={state?.values?.birth_date} required min="2000-01-01" max={today} className={inputClass} />
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
              <input type="radio" name="sex" value={o.value} defaultChecked={(state?.values?.sex ?? '') === o.value} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <FormMessage error={state?.error} />
      <SubmitButton className="mt-2">Uložit dítě</SubmitButton>
    </form>
  )
}
