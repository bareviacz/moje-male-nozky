import { MERITKO_PDF_URL } from '@/lib/config'
import { cx } from './ui'

/** Výrazná karta „Měřítko na nožku“ – tisknutelné PDF z e-shopu Barevia. */
export function MeritkoCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <a
      href={MERITKO_PDF_URL}
      target="_blank"
      rel="noopener"
      aria-label="Měřítko na nožku – stáhnout PDF k tisku na A4"
      className={cx(
        'group relative flex items-center gap-4 overflow-hidden rounded-[24px] bg-olive-soft p-4 pb-6 ring-1 ring-[#DCE0C4] transition hover:ring-olive sm:p-5 sm:pb-7',
        className,
      )}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full sm:h-7" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 14 C60 2 120 2 190 12 S320 22 400 8 V30 H0 Z" fill="#DCE3B8" />
      </svg>

      {/* Ilustrace: list A4 s nožkou a pravítkem */}
      <svg aria-hidden="true" viewBox="0 0 64 84" className={cx('relative shrink-0 drop-shadow-sm', compact ? 'h-[68px]' : 'h-[84px] sm:h-[96px]')}>
        <rect x="2" y="2" width="60" height="80" rx="5" fill="#fff" stroke="#C9CFAA" strokeWidth="1.5" />
        <rect x="8" y="10" width="6" height="64" rx="1.5" fill="#F2B33D" />
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1="14" x2={i % 2 ? 17 : 19} y1={12 + i * 5} y2={12 + i * 5} stroke="#1D2433" strokeWidth="0.8" />
        ))}
        <g transform="translate(24 12) scale(0.6)" fill="#4F5B2E">
          <path d="M30 27C43 27 49 38 47.5 51C46 63 40.5 69 41.5 81C42.5 93 36.5 100 28.5 100C18.5 100 14 92.5 15.5 80.5C17 67 11.5 59 11.5 46.5C11.5 34.5 18 27 30 27Z" />
          <ellipse cx="17" cy="16" rx="7" ry="8.5" />
          <ellipse cx="29.5" cy="9.5" rx="5" ry="6" />
          <ellipse cx="39.5" cy="11.5" rx="4.3" ry="5.2" />
          <ellipse cx="47" cy="16.5" rx="3.7" ry="4.5" />
          <ellipse cx="52.5" cy="23.5" rx="3.2" ry="3.8" />
        </g>
      </svg>

      <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-extrabold tracking-wider text-olive uppercase">Zdarma ke stažení</span>
        <span className={cx('font-display leading-tight font-extrabold text-[#2F3A12]', compact ? 'text-xl' : 'text-[22px] sm:text-[26px]')}>
          Měřítko na nožku
        </span>
        <span className="text-[13px] text-[#2F3A12]/80 sm:text-sm">
          Nemáte metr? Vytiskněte si ho na A4 – v tisku zvolte <strong>100 % (skutečná velikost)</strong>.
        </span>
        <span className="mt-2 inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-olive px-4 text-sm font-bold text-white transition group-hover:bg-[#3E4824]">
          Stáhnout PDF
          <span aria-hidden="true">↓</span>
        </span>
      </span>
    </a>
  )
}
