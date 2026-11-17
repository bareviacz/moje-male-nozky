export const ESHOP_URL = 'https://www.barevia.cz/'

/**
 * Zásady ochrany osobních údajů – stejné jako na e-shopu (Shoptet).
 * Ověřte prosím přesnou adresu stránky v administraci Shoptetu.
 */
/** Tisknutelné měřítko na nožku (A4, PDF) z e-shopu. */
export const MERITKO_PDF_URL = 'https://www.barevia.cz/user/documents/upload/Barevia-meritko-na-nozku-A4.pdf'

export const PRIVACY_URL = 'https://www.barevia.cz/podminky-ochrany-osobnich-udaju/'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Přidá k odkazu na e-shop UTM značky, aby bylo v Google Analytics vidět, odkud lidé přišli.
 * source: malenozky | bazar, campaign: místo v aplikaci.
 */
export function utm(url: string, campaign: string, source: 'malenozky' | 'bazar' = 'malenozky') {
  if (!/^https:\/\/(www\.)?barevia\.cz/.test(url)) return url
  const u = new URL(url)
  u.searchParams.set('utm_source', source)
  u.searchParams.set('utm_medium', 'app')
  u.searchParams.set('utm_campaign', campaign)
  return u.toString()
}

/**
 * Kam posílat z bazárku „nesehnali jste?“ – podle druhu bot.
 * Až bude v e-shopu kategorie Akce/Výprodej, stačí změnit ESHOP_TIP_DEFAULT.
 */
export const ESHOP_TIP_DEFAULT = 'https://www.barevia.cz/barefoot-obuv/'
export const ESHOP_TIP_BY_CATEGORY: Record<string, string> = {
  winter: 'https://www.barevia.cz/zimni-barefoot-boty/',
  all_season_spring: 'https://www.barevia.cz/celorocni-barefoot-boty/',
  all_season_autumn: 'https://www.barevia.cz/celorocni-barefoot-boty/',
  sneakers: 'https://www.barevia.cz/barefoot-tenisky/',
  summer: 'https://www.barevia.cz/detske-sandaly/',
  slippers: 'https://www.barevia.cz/detske-barefoot-backory-a-papuce/',
}
