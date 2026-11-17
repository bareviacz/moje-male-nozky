import catalog from './eshop-catalog.json'
import { minExtraForSize, NEW_SHOE_MAX_EXTRA_MM, OFFER_MAX_EXTRA_MM } from './fit'

/**
 * Boty z e-shopu barevia.cz s velikostními tabulkami (snímek k datu stockDate).
 * Všechny délky jsou vnitřní délky stélky v mm.
 * Až se katalog bude načítat živě ze Shoptetu, stačí vyměnit zdroj dat – výpočet zůstává.
 */
export type CatalogSize = { size: string; innerMm: number | null; widthMm: number | null; inStock: boolean }
export type CatalogProduct = {
  name: string
  url: string
  price: number | null
  brand: string | null
  audience: 'all' | 'girl' | 'boy'
  img: string | null
  sizes: CatalogSize[]
}

export const CATALOG = catalog as { stockDate: string; products: CatalogProduct[] }

export type Audience = 'all' | 'girl' | 'boy'
type Row = CatalogSize & { innerMm: number }

export type FitResult =
  | { kind: 'fit'; rows: Row[]; pick: Row; alt: Row | null; status: 'ok' | 'alt' | 'out'; shown: Row; reserve: number; roomy: boolean; widthNote: string | null }
  | { kind: 'noTable' | 'tooBig' | 'tooSmall' }

/** Najde nejmenší velikost s dostatečnou rezervou (do vel. 26 aspoň 5 mm, od 27 aspoň 8 mm) a náhradu, když došla. */
export function fitProduct(p: CatalogProduct, footMm: number, widthMm: number | null): FitResult {
  const rows = p.sizes.filter((s): s is Row => typeof s.innerMm === 'number').sort((a, b) => a.innerMm - b.innerMm)
  if (rows.length === 0) return { kind: 'noTable' }
  const idx = rows.findIndex((s) => s.innerMm - footMm >= minExtraForSize(s.size))
  if (idx === -1) return { kind: 'tooSmall' }
  if (rows[idx].innerMm - footMm > OFFER_MAX_EXTRA_MM) return { kind: 'tooBig' }

  const pick = rows[idx]
  let alt: Row | null = null
  if (!pick.inStock) {
    alt = rows.slice(idx + 1).find((s) => s.inStock && s.innerMm - footMm <= OFFER_MAX_EXTRA_MM) ?? null
  }
  const status = pick.inStock ? 'ok' : alt ? 'alt' : 'out'
  const shown = alt ?? pick
  const reserve = shown.innerMm - footMm

  let widthNote: string | null = null
  if (widthMm != null && shown.widthMm != null) {
    const diff = widthMm - shown.widthMm
    if (diff >= 5) widthNote = `Vnitřní šířka ${shown.widthMm} mm je o ${diff} mm menší než šířka chodidla – bota může být úzká.`
    else if (diff <= -5) widthNote = `Vnitřní šířka ${shown.widthMm} mm je o ${-diff} mm větší než šířka chodidla – bota může být široká.`
  }
  return { kind: 'fit', rows, pick, alt, status, shown, reserve, roomy: reserve > NEW_SHOE_MAX_EXTRA_MM, widthNote }
}
