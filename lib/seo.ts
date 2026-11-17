import { headers } from 'next/headers'

/** Veřejná adresa podle domény, na které požadavek přišel (bazar.barevia.cz / malenozky.barevia.cz). */
export async function currentOrigin() {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? 'malenozky.barevia.cz').split(',')[0].trim()
  const isBazar = host.startsWith('bazar.')
  return { origin: `https://${host}`, isBazar }
}
