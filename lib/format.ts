const TZ = 'Europe/Prague'

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  if (n >= 2 && n <= 4) return few
  return many
}

/** Celé měsíce mezi dvěma daty (YYYY-MM-DD). */
export function monthsBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) months -= 1
  return Math.max(0, months)
}

export function todayIso() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date())
}

/** „3 roky 8 měsíců“, „1 rok“, „7 měsíců“ */
export function formatAge(birthDate: string, at: string = todayIso()) {
  const total = monthsBetween(birthDate, at)
  const years = Math.floor(total / 12)
  const months = total % 12
  const y = years > 0 ? `${years} ${plural(years, 'rok', 'roky', 'let')}` : ''
  const m = months > 0 || years === 0 ? `${months} ${plural(months, 'měsíc', 'měsíce', 'měsíců')}` : ''
  return [y, m].filter(Boolean).join(' ')
}

/** Krátký popis věku pro osu grafu: „2 r“, „2 r 6 m“ */
export function formatAgeShort(totalMonths: number) {
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  if (y === 0) return `${m} m`
  return m === 0 ? `${y} r` : `${y} r ${m} m`
}

export function daysBetween(from: string, to: string = todayIso()) {
  const a = new Date(`${from}T00:00:00Z`).getTime()
  const b = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** „dnes“, „před 5 dny“, „před 6 týdny“, „před 3 měsíci“ */
export function formatAgo(date: string) {
  const d = daysBetween(date)
  if (d <= 0) return 'dnes'
  if (d === 1) return 'včera'
  if (d < 14) return `před ${d} dny`
  if (d < 60) return `před ${Math.round(d / 7)} týdny`
  const months = Math.round(d / 30.44)
  if (months < 12) return `před ${months} ${months === 1 ? 'měsícem' : 'měsíci'}`
  const years = Math.round(d / 365)
  return `před ${years} ${years === 1 ? 'rokem' : 'lety'}`
}

/** „12. 11. 2026“ */
export function formatDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}

/** „1. 10.“ */
export function formatDayMonth(date: string) {
  const [, m, d] = date.split('-').map(Number)
  return `${d}. ${m}.`
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date()),
  )
  if (hour < 10) return 'Dobré ráno'
  if (hour < 18) return 'Dobrý den'
  return 'Dobrý večer'
}
