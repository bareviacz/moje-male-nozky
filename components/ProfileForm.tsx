'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/(app)/actions'
import { SubmitButton } from './SubmitButton'
import { Field, FormMessage, inputClass } from './ui'

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(updateProfile, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Vaše jméno" htmlFor="display_name">
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={100}
          defaultValue={state?.values?.display_name ?? displayName}
          autoComplete="given-name"
          className={inputClass}
        />
      </Field>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton variant="secondary">Uložit jméno</SubmitButton>
    </form>
  )
}
