/** Dětské šlápoty s pěti prstíky – ilustrace na úvodní stránce. */
const FOOT = (
  <>
    <path d="M30 27C43 27 49 38 47.5 51C46 63 40.5 69 41.5 81C42.5 93 36.5 100 28.5 100C18.5 100 14 92.5 15.5 80.5C17 67 11.5 59 11.5 46.5C11.5 34.5 18 27 30 27Z" />
    <ellipse cx="17" cy="16" rx="7" ry="8.5" />
    <ellipse cx="29.5" cy="9.5" rx="5" ry="6" />
    <ellipse cx="39.5" cy="11.5" rx="4.3" ry="5.2" />
    <ellipse cx="47" cy="16.5" rx="3.7" ry="4.5" />
    <ellipse cx="52.5" cy="23.5" rx="3.2" ry="3.8" />
  </>
)

export function Footprints({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 342 236" className={className} preserveAspectRatio="xMidYMid meet">
      <g fill="#F2B33D" transform="translate(76 128) rotate(-14) scale(-0.9 0.9)">{FOOT}</g>
      <g fill="#E46A4E" transform="translate(98 74) rotate(-4) scale(0.9)">{FOOT}</g>
      <g fill="#6FA8DC" transform="translate(218 38) rotate(-20) scale(-0.9 0.9)">{FOOT}</g>
      <g fill="#F2B33D" transform="translate(244 6) rotate(-10) scale(0.82)">{FOOT}</g>
    </svg>
  )
}
