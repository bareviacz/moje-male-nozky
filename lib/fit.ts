/**
 * Pravidla velikosti bot (Barevia):
 * - Nové boty: vnitřní délka o 8–12 mm delší než chodidlo.
 * - Nošené boty: rezerva pod 4 mm = „Brzy malé“ (upozornit a nabídnout větší).
 * Stejná pravidla počítá databáze v pohledu shoe_fit (sloupec fit_status).
 */
export const NEW_SHOE_MIN_EXTRA_MM = 8
export const NEW_SHOE_MAX_EXTRA_MM = 12
export const SOON_SMALL_BELOW_MM = 4

export type FitStatus = 'ok' | 'soon_small' | 'too_small' | 'roomy' | 'unknown'

export function recommendedInnerLength(footLengthMm: number) {
  return {
    min: footLengthMm + NEW_SHOE_MIN_EXTRA_MM,
    max: footLengthMm + NEW_SHOE_MAX_EXTRA_MM,
  }
}

export const FIT_LABEL: Record<FitStatus, string> = {
  ok: 'Sedí',
  soon_small: 'Brzy malé',
  too_small: 'Malé',
  roomy: 'S rezervou',
  unknown: 'Chybí údaje',
}

export const FIT_BADGE: Record<FitStatus, string> = {
  ok: 'bg-forest-soft text-forest',
  soon_small: 'bg-sun-soft text-sun-ink',
  too_small: 'bg-coral-soft text-coral-ink',
  roomy: 'bg-sky-soft text-sky-ink',
  unknown: 'bg-line text-muted',
}

export const FIT_BAR: Record<FitStatus, string> = {
  ok: 'bg-forest',
  soon_small: 'bg-sun',
  too_small: 'bg-coral',
  roomy: 'bg-sky',
  unknown: 'bg-field',
}

export function asFitStatus(value: string | null | undefined): FitStatus {
  return value === 'ok' || value === 'soon_small' || value === 'too_small' || value === 'roomy'
    ? value
    : 'unknown'
}

/** Pro ukazatel rezervy: 0–16 mm přepočteno na 0–100 %. */
export function reservePercent(reserveMm: number | null) {
  if (reserveMm == null) return 0
  return Math.max(0, Math.min(100, Math.round((reserveMm / 16) * 100)))
}
