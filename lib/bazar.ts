import type { Database } from './database.types'
import { NEW_SHOE_MAX_EXTRA_MM, NEW_SHOE_MIN_EXTRA_MM } from './fit'

type Enums = Database['public']['Enums']
export type BazarWidth = Enums['bazar_width']
export type BazarCondition = Enums['bazar_condition']
export type BazarListingStatus = Enums['bazar_listing_status']
export type BazarOrderStatus = Enums['bazar_order_status']
export type BazarPhotoKind = Enums['bazar_photo_kind']

/** Veřejné úložiště fotek bazaru. Cesta: <user_id>/<listing_id>/<druh>-<uuid>.jpg */
export const BAZAR_BUCKET = 'bazar-photos'

/** Poštovné v Kč – přičítá se k ceně bot. Musí odpovídat hodnotě v databázi (bazar_create_order). */
export const BAZAR_SHIPPING_CZK = 55

export const WIDTH_LABEL: Record<BazarWidth, string> = {
  uzka: 'Úzká',
  normalni: 'Normální',
  siroka: 'Široká',
}

export const CONDITION_LABEL: Record<BazarCondition, string> = {
  jako_nove: 'Jako nové',
  lehce_nosene: 'Lehce nošené',
  nosene: 'Nošené',
  hodne_nosene: 'Hodně nošené',
}

/** Barevný proužek stavu (Tailwind třídy). */
export const CONDITION_STRIPE: Record<BazarCondition, string> = {
  jako_nove: 'border-l-forest',
  lehce_nosene: 'border-l-[#6AA84F]',
  nosene: 'border-l-sun',
  hodne_nosene: 'border-l-coral',
}

export const PHOTO_KIND_LABEL: Record<BazarPhotoKind, string> = {
  celek: 'Celá bota',
  podrazka: 'Podrážka',
  stelka: 'Špička',
  detail: 'Detail',
}

export const ORDER_STATUS_LABEL: Record<BazarOrderStatus, string> = {
  ceka_na_postovne: 'Rezervováno',
  postovne_zaplaceno: 'Poštovné zaplaceno',
  k_odeslani: 'K odeslání',
  na_ceste: 'Na cestě',
  doruceno: 'Doručeno',
  dokonceno: 'Dokončeno',
  zruseno: 'Zrušeno',
}

export const LISTING_STATUS_LABEL: Record<BazarListingStatus, string> = {
  koncept: 'Koncept',
  aktivni: 'V nabídce',
  rezervovano: 'Rezervováno',
  prodano: 'Prodáno',
  skryto: 'Skryto',
}

export const isWidth = (v: string): v is BazarWidth => v in WIDTH_LABEL
export const isCondition = (v: string): v is BazarCondition => v in CONDITION_LABEL
export const isPhotoKind = (v: string): v is BazarPhotoKind => v in PHOTO_KIND_LABEL
export const isOrderStatus = (v: string): v is BazarOrderStatus => v in ORDER_STATUS_LABEL

/**
 * Boty z bazaru „padnou“, když je vnitřní délka o 8–12 mm delší než nožka
 * (stejné pravidlo jako pro nové boty v Moje malé nožky).
 */
export function fitRange(footMm: number) {
  return { min: footMm + NEW_SHOE_MIN_EXTRA_MM, max: footMm + NEW_SHOE_MAX_EXTRA_MM }
}

export function publicPhotoUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/${BAZAR_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function formatCzk(n: number) {
  return `${n.toLocaleString('cs-CZ')} Kč`
}

export function formatEu(n: number) {
  return String(n).replace('.', ',')
}

export function listingTitle(l: { brand: string; model: string | null }) {
  return [l.brand, l.model].filter(Boolean).join(' ')
}

/** Číslo účtu: „123456789/0800“, „19-123456789/0800“ nebo IBAN CZ. */
export function normalizeAccount(raw: string): string | null {
  const v = raw.replace(/\s+/g, '').toUpperCase()
  if (/^(\d{1,6}-)?\d{2,10}\/\d{4}$/.test(v)) return v
  if (/^CZ\d{22}$/.test(v)) return v
  return null
}

/** Převod českého čísla účtu na IBAN (pro QR platbu). */
export function accountToIban(account: string): string | null {
  if (account.startsWith('CZ')) return account
  const m = account.match(/^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/)
  if (!m) return null
  const bban = m[3] + (m[1] ?? '').padStart(6, '0') + m[2].padStart(10, '0')
  // CZ = 12 35, kontrolní číslice podle ISO 13616
  const numeric = bban + '123500'
  let rem = 0
  for (const ch of numeric) rem = (rem * 10 + Number(ch)) % 97
  const check = String(98 - rem).padStart(2, '0')
  return `CZ${check}${bban}`
}

/** Text QR platby (formát SPAYD, čtou ho všechny české bankovní aplikace). */
export function spayd({ iban, amount, vs, message }: { iban: string; amount: number; vs: string; message: string }) {
  const msg = message
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[*]/g, '')
    .slice(0, 60)
  return `SPD*1.0*ACC:${iban}*AM:${amount.toFixed(2)}*CC:CZK*X-VS:${vs}*MSG:${msg}`
}
