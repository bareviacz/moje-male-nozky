import { cx } from './ui'

const COLORS = [
  'bg-coral-soft text-coral-ink',
  'bg-sky-soft text-sky-ink',
  'bg-sun-soft text-sun-ink',
  'bg-lilac-soft text-lilac-ink',
  'bg-forest-soft text-forest',
]

/** Barva podle pořadí dítěte – stabilní napříč obrazovkami. */
export function childColor(index: number) {
  return COLORS[((index % COLORS.length) + COLORS.length) % COLORS.length]
}

export function ChildAvatar({
  name,
  index,
  size = 'md',
}: {
  name: string
  index: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'size-[30px] rounded-full text-sm',
    md: 'size-12 rounded-2xl text-xl',
    lg: 'size-[52px] rounded-2xl text-[22px]',
  }
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center font-display font-bold',
        sizes[size],
        childColor(index),
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
