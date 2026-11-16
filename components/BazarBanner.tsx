import Image from 'next/image'
import Link from 'next/link'
import { cx } from './ui'

/** Banner „Barefoot bazárek“ – proklik z Moje malé nožky do bazárku. */
export function BazarBanner({ className }: { className?: string }) {
  return (
    <Link
      href="/bazar"
      aria-label="Barefoot bazárek – kupuj, prodávej, posílej dál. bazar.barevia.cz"
      className={cx(
        'group relative flex items-center gap-3 overflow-hidden rounded-[24px] bg-[#FBF7EC] px-3.5 py-3.5 ring-1 ring-[#EDE5CF] transition hover:ring-[#7BA23A] sm:gap-5 sm:px-5 sm:py-4',
        className,
      )}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full sm:h-7" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 14 C60 2 120 2 190 12 S320 22 400 8 V30 H0 Z" fill="#DCE8B0" />
      </svg>
      <Image
        src="/bazar-banner-shoe.png"
        alt=""
        width={108}
        height={104}
        className="relative size-16 shrink-0 rounded-full sm:size-[84px]"
      />
      <span aria-hidden="true" className="relative hidden h-14 w-[3px] shrink-0 rounded-full bg-[#7BA23A] sm:block" />
      <span className="relative flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
        <span className="font-display text-xl leading-tight font-extrabold text-[#2F5A16] sm:text-[26px]">Barefoot bazárek</span>
        <span className="text-[13px] font-bold text-[#2F5A16]/85 sm:text-base">Kupuj · Prodávej · Posílej dál</span>
        <span className="mt-1 self-start rounded-full bg-[#7BA23A] px-3 py-1 text-[13px] font-bold text-white sm:hidden">bazar.barevia.cz</span>
      </span>
      <span className="relative hidden shrink-0 rounded-full bg-[#7BA23A] px-5 py-2.5 text-[17px] font-bold text-white transition group-hover:bg-[#6A8F2F] sm:block">
        bazar.barevia.cz
      </span>
    </Link>
  )
}
