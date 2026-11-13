'use client'

import { ChildAvatar } from './ChildAvatar'

export type PickerChild = { id: string; name: string; index: number }

/** Výběr dítěte jako „pilulky“ (přístupné radio buttony). */
export function ChildPicker({
  items,
  value,
  onChange,
  legend = 'Komu měříte',
}: {
  items: PickerChild[]
  value: string
  onChange: (id: string) => void
  legend?: string
}) {
  return (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2.5">
        {items.map((c) => (
          <label
            key={c.id}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-field bg-white py-0 pr-4 pl-1.5 text-[15px] font-semibold has-checked:border-2 has-checked:border-forest has-checked:font-bold has-focus-visible:outline-3 has-focus-visible:outline-sun"
          >
            <input
              type="radio"
              name="child_id"
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
              className="sr-only"
            />
            <ChildAvatar name={c.name} index={c.index} size="sm" />
            {c.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
