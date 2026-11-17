/**
 * Pravidla velikosti bot (Barevia):
 * - Nové boty do velikosti 26 (vnitřní délka do 170 mm): o 5–12 mm delší než chodidlo.
 * - Nové boty od velikosti 27: o 8–12 mm delší než chodidlo.
 * - Větší rezervu taky ukazujeme, jen až za ideálními a s poznámkou.
 * - Nošené boty: rezerva pod 4 mm = „Brzy malé“ (upozornit a nabídnout větší).
 * Stav nošených bot počítá databáze v pohledu shoe_fit (sloupec fit_status).
 */
export const SMALL_SIZE_MAX_EU = 26
/** Vnitřní délka velikosti 26 v e-shopu je nejvýš 170 mm. */
export const SMALL_SIZE_MAX_INNER_MM = 170
export const SMALL_SHOE_MIN_EXTRA_MM = 5
export const NEW_SHOE_MIN_EXTRA_MM = 8
export const NEW_SHOE_MAX_EXTRA_MM = 12
/** Do kolika mm rezervy ještě boty nabízíme (jako „větší“). */
export const OFFER_MAX_EXTRA_MM = 20
export const SOON_SMALL_BELOW_MM = 4

export type FitStatus = 'ok' | 'soon_small' | 'too_small' | 'roomy' | 'unknown'

/** Minimální rezerva podle velikosti boty (EU). */
export function minExtraForSize(sizeEu: number | string | null | undefined) {
  const n = typeof sizeEu === 'string' ? parseFloat(sizeEu.replace(',', '.')) : sizeEu
  return n != null && isFinite(n) && n <= SMALL_SIZE_MAX_EU ? SMALL_SHOE_MIN_EXTRA_MM : NEW_SHOE_MIN_EXTRA_MM
}

/** Minimální rezerva podle vnitřní délky boty. */
export function minExtraForInner(innerMm: number) {
  return innerMm <= SMALL_SIZE_MAX_INNER_MM ? SMALL_SHOE_MIN_EXTRA_MM : NEW_SHOE_MIN_EXTRA_MM
}

/** Doporučená vnitřní délka nové boty pro danou délku chodidla. */
export function recommendedInnerLength(footLengthMm: number) {
  const extra = footLengthMm + SMALL_SHOE_MIN_EXTRA_MM <= SMALL_SIZE_MAX_INNER_MM ? SMALL_SHOE_MIN_EXTRA_MM : NEW_SHOE_MIN_EXTRA_MM
  return {
    min: footLengthMm + extra,
    max: footLengthMm + NEW_SHOE_MAX_EXTRA_MM,
    minExtra: extra,
  }
}

/** Sedí bota s touto vnitřní délkou jako nová? (ideální / větší / malá) */
export function newShoeFit(footMm: number, innerMm: number): 'small' | 'ideal' | 'bigger' | 'tooBig' {
  const reserve = innerMm - footMm
  if (reserve < minExtraForInner(innerMm)) return 'small'
  if (reserve <= NEW_SHOE_MAX_EXTRA_MM) return 'ideal'
  if (reserve <= OFFER_MAX_EXTRA_MM) return 'bigger'
  return 'tooBig'
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
