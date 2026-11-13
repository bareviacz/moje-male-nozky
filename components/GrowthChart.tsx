import { formatAgeShort, formatDate } from '@/lib/format'

export type GrowthPoint = { months: number; length: number; date: string }

const W = 640
const H = 220
const PAD = { left: 40, right: 24, top: 16, bottom: 34 }

/** Růstový graf délky chodidla (delší nožka) podle věku. */
export function GrowthChart({ points }: { points: GrowthPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-2xl bg-ground px-4 py-6 text-center text-sm text-muted">
        Graf se ukáže po druhém měření.
      </p>
    )
  }

  const lengths = points.map((p) => p.length)
  let yMin = Math.floor((Math.min(...lengths) - 4) / 10) * 10
  let yMax = Math.ceil((Math.max(...lengths) + 4) / 10) * 10
  if (yMax - yMin < 30) yMax = yMin + 30
  const xMin = points[0].months
  const xMax = Math.max(points[points.length - 1].months, xMin + 1)

  const x = (m: number) => PAD.left + ((m - xMin) / (xMax - xMin)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom)

  const ticks: number[] = []
  const step = yMax - yMin > 60 ? 20 : 10
  for (let v = yMin; v <= yMax; v += step) ticks.push(v)

  // Popisky osy X: všechny body, nebo při větším počtu jen každý n-tý + poslední
  const every = Math.ceil(points.length / 5)
  const xLabels = points.filter((_, i) => i % every === 0 || i === points.length - 1)

  const line = points.map((p) => `${x(p.months).toFixed(1)},${y(p.length).toFixed(1)}`).join(' ')
  const area = `M${x(points[0].months)},${y(yMin)} L${line.replaceAll(' ', ' L')} L${x(points[points.length - 1].months)},${y(yMin)} Z`
  const last = points[points.length - 1]

  const description = points.map((p) => `${formatDate(p.date)}: ${p.length} mm`).join(', ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Graf růstu chodidla. ${description}`} className="h-auto w-full">
      <g stroke="#EDE7DD" strokeWidth="1">
        {ticks.map((t) => (
          <line key={t} x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
        ))}
      </g>
      <g fill="#5B6472" fontSize="12" fontFamily="var(--font-nunito), sans-serif">
        {ticks.map((t) => (
          <text key={t} x={0} y={y(t) + 4}>
            {t}
          </text>
        ))}
        {xLabels.map((p, i) => (
          <text key={`${p.date}-${i}`} x={x(p.months)} y={H - 10} textAnchor="middle">
            {formatAgeShort(p.months)}
          </text>
        ))}
      </g>
      <path d={area} fill="#E3F0EA" />
      <polyline points={line} fill="none" stroke="#1F6F5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#FFFFFF" stroke="#1F6F5C" strokeWidth="2.5">
        {points.slice(0, -1).map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={x(p.months)} cy={y(p.length)} r="5" />
        ))}
      </g>
      <circle cx={x(last.months)} cy={y(last.length)} r="7" fill="#F2B33D" stroke="#1D2433" strokeWidth="2" />
    </svg>
  )
}
