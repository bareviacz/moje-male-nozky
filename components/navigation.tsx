'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChildrenIcon, HomeIcon, PlusIcon, ProfileIcon, RulerIcon, ShoeIcon } from './icons'
import { AppNamePill, Logo } from './Logo'
import { cx } from './ui'

const ITEMS = [
  { href: '/prehled', label: 'Domů', Icon: HomeIcon },
  { href: '/deti', label: 'Děti', Icon: ChildrenIcon },
  { href: '/mereni/nove', label: 'Měřit', Icon: RulerIcon, primary: true },
  { href: '/boty', label: 'Boty', Icon: ShoeIcon },
  { href: '/profil', label: 'Profil', Icon: ProfileIcon },
]

function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/mereni/nove' ? pathname.startsWith('/mereni') : pathname === href || pathname.startsWith(`${href}/`)
}

/** Spodní lišta – jen na mobilu (do 768 px). */
export function BottomNav() {
  const isActive = useIsActive()
  return (
    <nav
      aria-label="Hlavní navigace"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex h-[76px] max-w-xl items-start px-2 pt-2">
        {ITEMS.map(({ href, label, Icon, primary }) => {
          const active = isActive(href)
          if (primary)
            return (
              <li key={href} className="flex flex-1 justify-center">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="-mt-[22px] flex flex-col items-center gap-1 text-xs font-bold text-ink"
                >
                  <span className="flex size-14 items-center justify-center rounded-[18px] border-4 border-ground bg-forest text-white shadow-sm">
                    <PlusIcon className="size-[26px]" strokeWidth={2} />
                  </span>
                  {label}
                </Link>
              </li>
            )
          return (
            <li key={href} className="flex flex-1 justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex min-h-[52px] w-full flex-col items-center gap-1 pt-1.5 text-xs',
                  active ? 'font-bold text-forest' : 'font-semibold text-muted',
                )}
              >
                <Icon strokeWidth={active ? 2 : 1.8} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Boční menu – tablet a počítač (od 768 px). */
export function SideNav() {
  const isActive = useIsActive()
  return (
    <nav
      aria-label="Hlavní navigace"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-7 border-r border-line bg-white px-4 py-6 md:flex"
    >
      <div className="flex flex-col items-start gap-2 px-2">
        <Logo height={36} href="/prehled" />
        <AppNamePill />
      </div>
      <ul className="flex flex-col gap-1">
        {ITEMS.filter((i) => !i.primary).map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-[46px] items-center gap-3 rounded-xl px-3 text-[15px]',
                  active ? 'bg-forest-soft font-bold text-forest' : 'font-semibold text-ink hover:bg-ground',
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.8} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
      <Link
        href="/mereni/nove"
        className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-forest text-[15px] font-bold text-white hover:bg-forest-dark"
      >
        <PlusIcon className="size-5" strokeWidth={2.2} />
        Nové měření
      </Link>
    </nav>
  )
}
