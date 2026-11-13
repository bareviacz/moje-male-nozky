import Image from 'next/image'
import Link from 'next/link'
import { cx } from './ui'

/** Logo Barevia (808 × 213 px, průhledné pozadí). */
export function Logo({ height = 40, href, className }: { height?: number; href?: string; className?: string }) {
  const img = (
    <Image
      src="/logo-barevia.png"
      alt="Barevia"
      width={Math.round((808 / 213) * height)}
      height={height}
      priority
      className={cx('h-auto', className)}
    />
  )
  return href ? (
    <Link href={href} aria-label="Barevia – domů">
      {img}
    </Link>
  ) : (
    img
  )
}

export function AppNamePill({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'rounded-[10px] bg-olive-soft px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-olive',
        className,
      )}
    >
      Moje malé nožky
    </span>
  )
}
