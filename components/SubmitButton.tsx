'use client'

import { useFormStatus } from 'react-dom'
import { btn, cx } from './ui'

export function SubmitButton({
  children,
  pendingText = 'Ukládám…',
  variant = 'primary',
  className,
}: {
  children: React.ReactNode
  pendingText?: string
  variant?: 'primary' | 'secondary' | 'small' | 'ghost'
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cx(btn[variant], className)}>
      {pending ? pendingText : children}
    </button>
  )
}
