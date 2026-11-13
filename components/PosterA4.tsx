import { Dancing_Script, Quicksand } from 'next/font/google'
import { longDate, monthYear, periodLabel, POSTER_COLORS, shortMonth, type PosterColor } from '@/lib/poster'

const script = Dancing_Script({ subsets: ['latin', 'latin-ext'], weight: ['600', '700'] })
const rounded = Quicksand({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'] })

/** Tvar dětské šlápoty (jednotky 60 × 100, pata dole na y = 100, špička prstíků nahoře na y ≈ 3,5). */
function FootShape() {
  return (
    <>
      <path d="M30 27C43 27 49 38 47.5 51C46 63 40.5 69 41.5 81C42.5 93 36.5 100 28.5 100C18.5 100 14 92.5 15.5 80.5C17 67 11.5 59 11.5 46.5C11.5 34.5 18 27 30 27Z" />
      <ellipse cx="17" cy="16" rx="7" ry="8.5" />
      <ellipse cx="29.5" cy="9.5" rx="5" ry="6" />
      <ellipse cx="39.5" cy="11.5" rx="4.3" ry="5.2" />
      <ellipse cx="47" cy="16.5" rx="3.7" ry="4.5" />
      <ellipse cx="52.5" cy="23.5" rx="3.2" ry="3.8" />
    </>
  )
}
const FOOT_UNITS = 96.5 // délka šlápoty v jednotkách tvaru
const FOOT_CX = 33 // střed šlápoty v jednotkách

/** Největší délka nožky, kterou ještě vytiskneme ve skutečné velikosti. Delší se zmenší. */
const MAX_TRUE_SCALE_MM = 175

export type PosterData = {
  name: string
  birthDate: string
  sex: string | null
  last: { date: string; length: number }
  first: { date: string; length: number } | null
  months: number
  points: { date: string; length: number }[]
}

export function PosterA4({ data, color }: { data: PosterData; color: PosterColor }) {
  const c = POSTER_COLORS[color]
  const { last, first } = data
  const maxLen = Math.max(last.length, first?.length ?? 0)

  // Geometrie v milimetrech (1 jednotka SVG = 1 mm)
  const sMax = maxLen / FOOT_UNITS
  const heelY = maxLen + 5
  const cx = 2 + 21.5 * sMax
  const rulerX = cx + 22.7 * sMax + 8
  const vbW = rulerX + 18
  const vbH = maxLen + 9
  const k = maxLen > MAX_TRUE_SCALE_MM ? MAX_TRUE_SCALE_MM / maxLen : 1

  const footTransform = (len: number) => {
    const s = len / FOOT_UNITS
    return `translate(${(cx - FOOT_CX * s).toFixed(3)} ${(heelY - 100 * s).toFixed(3)}) scale(${s.toFixed(5)})`
  }
  const ticks: number[] = []
  for (let mm = 0; mm <= maxLen; mm += 10) ticks.push(mm)

  const born = data.sex === 'girl' ? 'narozena' : data.sex === 'boy' ? 'narozen' : 'datum narození'
  const growth = first ? last.length - first.length : null

  return (
    <div
      className={rounded.className}
      style={{
        width: '210mm',
        height: '297mm',
        boxSizing: 'border-box',
        background: c.bg,
        color: '#3A3335',
        position: 'relative',
        overflow: 'hidden',
        padding: '16mm 19mm 13mm',
        display: 'flex',
        flexDirection: 'column',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
      {/* drobné ozdoby */}
      <svg aria-hidden="true" viewBox="0 0 210 297" style={{ position: 'absolute', inset: 0, width: '210mm', height: '297mm' }}>
        <g fill={c.fill} opacity="0.4">
          <circle cx="185" cy="32" r="1.3" />
          <circle cx="193" cy="42" r="0.8" />
          <circle cx="178" cy="47" r="0.9" />
          <circle cx="24" cy="267" r="1.1" />
          <circle cx="32" cy="275" r="0.7" />
        </g>
        <path d="M182 37c1-2 3.7-2 4.2 0 .5-2 3.2-2 4.2 0 1 2.6-4.2 5.3-4.2 5.3s-5.2-2.7-4.2-5.3z" fill={c.fill} opacity="0.75" />
        <path d="M18.5 250.5c.8-1.6 2.7-1.6 3.2 0 .5-1.6 2.4-1.6 3.2 0 .8 1.9-3.2 4-3.2 4s-4-2.1-3.2-4z" fill={c.fill} opacity="0.6" />
      </svg>

      <header style={{ position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5mm' }}>
        <span style={{ fontSize: '10.5pt', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: c.accent }}>
          Moje malá nožka
        </span>
        <h1 className={script.className} style={{ margin: 0, fontSize: '60pt', fontWeight: 700, lineHeight: 1.05 }}>
          {data.name}
        </h1>
        <span style={{ fontSize: '12pt', fontWeight: 600, color: '#6B6164' }}>
          {born} {longDate(data.birthDate)}
        </span>
      </header>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '5mm', marginTop: '7mm' }}>
        <svg
          role="img"
          aria-label={`Nožka: ${last.length} mm${first ? `, dříve ${first.length} mm` : ''}`}
          viewBox={`0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}`}
          style={{ width: `${(vbW * k).toFixed(2)}mm`, height: `${(vbH * k).toFixed(2)}mm`, flexShrink: 0, overflow: 'visible' }}
        >
          <g fill={c.fill} transform={footTransform(last.length)}>
            <FootShape />
          </g>
          {first && (
            <g
              fill="none"
              stroke={c.outline}
              strokeWidth={0.42 / (first.length / FOOT_UNITS)}
              strokeDasharray={`${1.6 / (first.length / FOOT_UNITS)} ${1.1 / (first.length / FOOT_UNITS)}`}
              strokeLinecap="round"
              transform={footTransform(first.length)}
            >
              <FootShape />
            </g>
          )}

          {/* pravítko */}
          <g stroke="#8A7F82" strokeWidth="0.3">
            <line x1={rulerX} y1={heelY - maxLen} x2={rulerX} y2={heelY} />
            {ticks.map((mm) => (
              <line key={mm} x1={rulerX - (mm % 20 === 0 ? 2 : 1)} x2={rulerX + (mm % 20 === 0 ? 2 : 1)} y1={heelY - mm} y2={heelY - mm} />
            ))}
          </g>
          <g fill="#8A7F82" fontSize="2.6" fontWeight="600" fontFamily="inherit">
            {ticks
              .filter((mm) => mm % 20 === 0)
              .map((mm) => (
                <text key={mm} x={rulerX + 3.5} y={heelY - mm + 0.9}>
                  {mm === 0 ? '0' : `${mm / 10} cm`}
                </text>
              ))}
          </g>
          <line x1={cx} y1={heelY - last.length} x2={rulerX} y2={heelY - last.length} stroke={c.accent} strokeWidth="0.4" />
          {first && (
            <line x1={cx} y1={heelY - first.length} x2={rulerX} y2={heelY - first.length} stroke={c.outline} strokeWidth="0.4" strokeDasharray="1.2 0.9" />
          )}
          <line x1={cx} y1={heelY + 0.2} x2={rulerX} y2={heelY + 0.2} stroke="#8A7F82" strokeWidth="0.3" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6mm', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
            <span style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.accent }}>Dnes</span>
            <span style={{ fontSize: '34pt', fontWeight: 700, lineHeight: 1 }}>
              {last.length}
              <span style={{ fontSize: '15pt' }}> mm</span>
            </span>
            <span style={{ fontSize: '10.5pt', fontWeight: 600, color: '#6B6164' }}>{longDate(last.date)}</span>
          </div>

          {first && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
              <span style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6164' }}>
                Na začátku
              </span>
              <span style={{ fontSize: '22pt', fontWeight: 700, lineHeight: 1, color: '#6B6164' }}>
                {first.length}
                <span style={{ fontSize: '12pt' }}> mm</span>
              </span>
              <span style={{ fontSize: '10.5pt', fontWeight: 600, color: '#6B6164' }}>{monthYear(first.date)}</span>
            </div>
          )}

          {growth !== null && growth > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '6mm', padding: '4mm 4.5mm', border: `0.5mm solid ${c.fill}` }}>
              <div className={script.className} style={{ fontSize: '30pt', fontWeight: 700, lineHeight: 1, color: c.accent }}>
                +{growth} mm
              </div>
              <div style={{ fontSize: '11pt', fontWeight: 600, marginTop: '1mm' }}>nožka povyrostla {periodLabel(data.months)}</div>
            </div>
          )}

          {data.points.length > 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
              <span style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6164' }}>
                Měření
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2mm', fontSize: '10pt', fontWeight: 600 }}>
                {data.points.map((p, i) => (
                  <span key={`${p.date}-${i}`} style={{ textAlign: 'center' }}>
                    {shortMonth(p.date)}
                    <br />
                    <strong>{p.length}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer style={{ position: 'relative', marginTop: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5mm' }}>
        <p className={script.className} style={{ margin: 0, fontSize: '22pt', fontWeight: 600 }}>
          Každý krůček se počítá.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', fontSize: '9pt', fontWeight: 600, color: '#6B6164' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-barevia.png" alt="Barevia" style={{ height: '6mm', width: 'auto' }} />
        </div>
      </footer>
    </div>
  )
}
