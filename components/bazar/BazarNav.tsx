'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, MailIcon, PlusIcon, ProfileIcon, ShoeIcon } from '../icons'
import { Logo } from '../Logo'
import { cx } from '../ui'

const ITEMS = [
  { href: '/bazar', label: 'Nabídka', Icon: ShoeIcon },
  { href: '/bazar/moje', label: 'Moje', Icon: MailIcon },
  { href: '/bazar/prodat', label: 'Prodat', Icon: PlusIcon, primary: true },
  { href: '/bazar/profil', label: 'Profil', Icon: ProfileIcon },
  { href: '/prehled', label: 'Malé nožky', Icon: HomeIcon },
]

function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/bazar'
      ? pathname === '/bazar' || /^\/bazar\/[0-9a-f-]{36}/.test(pathname)
      : pathname === href || pathname.startsWith(`${href}/`) || (href === '/bazar/moje' && pathname.startsWith('/bazar/objednavka'))
}

export function BazarPill({ className }: { className?: string }) {
  return (
    <span className={cx('rounded-[10px] bg-sun-soft px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-sun-deep', className)}>
      Bazárek
    </span>
  )
}

/** Horní lišta (tablet, počítač) + spodní lišta (mobil). */
export function BazarNav({ todo }: { todo: number }) {
  const isActive = useIsActive()
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 md:px-8">
          <Link href="/bazar" className="flex items-center gap-2" aria-label="Bazárek Barevia – nabídka">
            <Logo height={28} />
            <BazarPill />
          </Link>
          <nav aria-label="Bazar" className="ml-auto hidden items-center gap-1 md:flex">
            {ITEMS.filter((i) => !i.primary).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cx(
                  'flex h-10 items-center gap-1.5 rounded-xl px-3 text-[15px]',
                  isActive(href) ? 'bg-forest-soft font-bold text-forest' : 'font-semibold text-ink hover:bg-ground',
                )}
              >
                {label}
                {href === '/bazar/moje' && todo > 0 && (
                  <span className="rounded-full bg-coral px-1.5 text-xs font-bold text-white">{todo}</span>
                )}
              </Link>
            ))}
            <Link
              href="/bazar/prodat"
              className="ml-2 flex h-10 items-center gap-1.5 rounded-xl bg-forest px-4 text-[15px] font-bold text-white hover:bg-forest-dark"
            >
              <PlusIcon className="size-5" strokeWidth={2.2} />
              Prodat boty
            </Link>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Bazar"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex h-[76px] max-w-xl items-start px-2 pt-2">
          {ITEMS.map(({ href, label, Icon, primary }) => {
            const active = isActive(href)
            if (primary)
              return (
                <li key={href} className="flex flex-1 justify-center">
                  <Link href={href} aria-current={active ? 'page' : undefined} className="-mt-[22px] flex flex-col items-center gap-1 text-xs font-bold text-ink">
                    <span className="flex size-14 items-center justify-center rounded-[18px] border-4 border-ground bg-forest text-white shadow-sm">
                      <Icon className="size-[26px]" strokeWidth={2} />
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
                    'relative flex min-h-[52px] w-full flex-col items-center gap-1 pt-1.5 text-xs',
                    active ? 'font-bold text-forest' : 'font-semibold text-muted',
                  )}
                >
                  <Icon strokeWidth={active ? 2 : 1.8} />
                  {label}
                  {href === '/bazar/moje' && todo > 0 && (
                    <span className="absolute top-0 left-1/2 ml-2 rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">{todo}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
