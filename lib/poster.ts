export const POSTER_COLORS = {
  ruzova: { label: 'Růžová', bg: '#FFF7F5', fill: '#F6CFCB', outline: '#C77F84', accent: '#A55A60' },
  modra: { label: 'Modrá', bg: '#F4F8FC', fill: '#C9DDF0', outline: '#6E97BA', accent: '#3F6F96' },
  zelena: { label: 'Zelená', bg: '#F8F7F1', fill: '#DCE3C8', outline: '#8A9B6A', accent: '#5F7A45' },
  zluta: { label: 'Žlutá', bg: '#FFFBF0', fill: '#F9DE9A', outline: '#C89B2E', accent: '#8A6514' },
  levandulova: { label: 'Levandulová', bg: '#FAF7FD', fill: '#DCCFF0', outline: '#9A84C4', accent: '#6B4FA0' },
} as const

export type PosterColor = keyof typeof POSTER_COLORS

export function posterColor(value: string | undefined, sex: string | null): PosterColor {
  if (value && value in POSTER_COLORS) return value as PosterColor
  if (sex === 'girl') return 'ruzova'
  if (sex === 'boy') return 'modra'
  return 'zelena'
}

const MONTHS_NOM = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
const MONTHS_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']

/** „listopad 2025“ */
export function monthYear(date: string) {
  const [y, m] = date.split('-').map(Number)
  return `${MONTHS_NOM[m - 1]} ${y}`
}

/** „13. listopadu 2026“ */
export function longDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return `${d}. ${MONTHS_GEN[m - 1]} ${y}`
}

/** „11/25“ */
export function shortMonth(date: string) {
  const [y, m] = date.split('-').map(Number)
  return `${m}/${String(y).slice(2)}`
}

/** „za jeden rok“, „za 8 měsíců“, „za 2 roky“ */
export function periodLabel(months: number) {
  if (months >= 11 && months <= 13) return 'za jeden rok'
  if (months >= 22 && months <= 26) return 'za dva roky'
  if (months < 1) return 'za necelý měsíc'
  if (months === 1) return 'za jeden měsíc'
  if (months <= 4) return `za ${months} měsíce`
  return `za ${months} měsíců`
}
