import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { NEW_SHOE_MAX_EXTRA_MM, NEW_SHOE_MIN_EXTRA_MM } from '@/lib/fit'

type Pick = {
  id: string
  brand: string
  name: string
  url: string
  image: string | null
  price: number
  size: number
  innerMm: number
  inStock: boolean | null
}

/** Obrázek ze Shoptetu v rozumné velikosti (bez parametrů zmenšování). */
function shopImage(url: string | null) {
  return url ? url.split('?')[0].replace('/user/shop/detail/', '/user/shop/big/') : null
}

const czk = (n: number) => `${new Intl.NumberFormat('cs-CZ').format(n)} Kč`
const eu = (n: number) => String(n).replace('.', ',')

/**
 * Boty z katalogu Barevie, které dítěti teď sednou: nejmenší velikost
 * s vnitřní délkou chodidlo + 8 až 12 mm (u každého modelu jedna).
 */
export async function CatalogPicks({
  supabase,
  footMm,
  sex,
}: {
  supabase: SupabaseClient<Database>
  footMm: number
  sex: string | null
}) {
  if (sex === 'boy') return null // zatím jen dívčí zimní boty

  const min = footMm + NEW_SHOE_MIN_EXTRA_MM
  const max = footMm + NEW_SHOE_MAX_EXTRA_MM
  const { data } = await supabase
    .from('catalog_variants')
    .select('size_eu, inner_length_mm, in_stock, catalog_products!inner(id, brand, name, url, image_url, price_czk, category, gender)')
    .gte('inner_length_mm', min)
    .lte('inner_length_mm', max)
    .eq('catalog_products.category', 'winter')
    .order('inner_length_mm')

  const byProduct = new Map<string, Pick>()
  for (const v of data ?? []) {
    const p = v.catalog_products
    if (!p || v.in_stock === false || byProduct.has(p.id)) continue
    byProduct.set(p.id, {
      id: p.id,
      brand: p.brand,
      name: p.name,
      url: p.url,
      image: shopImage(p.image_url),
      price: p.price_czk,
      size: Number(v.size_eu),
      innerMm: v.inner_length_mm,
      inStock: v.in_stock,
    })
  }
  const picks = [...byProduct.values()].sort((a, b) => Number(b.inStock === true) - Number(a.inStock === true)).slice(0, 8)
  if (picks.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="katalog-nadpis">
      <div className="flex flex-col gap-0.5">
        <h2 id="katalog-nadpis" className="font-display text-lg font-bold">
          Zimní boty, které teď sednou
        </h2>
        <p className="text-[13px] text-muted">
          Z e-shopu Barevia. Podle posledního měření ({footMm} mm) vybíráme vnitřní délku {min}–{max} mm.
        </p>
      </div>
      <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
        {picks.map((p) => (
          <li key={p.id} className="w-[170px] shrink-0 snap-start md:w-auto">
            <a
              href={`${p.url}?utm_source=malenozky&utm_medium=app&utm_campaign=zimni_divci`}
              target="_blank"
              rel="noopener"
              className="flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white transition hover:border-field"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" loading="lazy" className="aspect-[4/3] w-full bg-white object-contain p-2" />
              )}
              <span className="flex flex-1 flex-col gap-1 p-3 pt-1">
                <span className="text-xs font-semibold text-muted">{p.brand}</span>
                <span className="line-clamp-2 text-sm leading-snug font-bold">{p.name}</span>
                <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="rounded-full bg-forest-soft px-2 py-0.5 text-xs font-bold text-forest">
                    vel. {eu(p.size)} · {p.innerMm} mm
                  </span>
                </span>
                <span className="text-[15px] font-bold">{czk(p.price)}</span>
                <span className="text-xs text-muted">{p.inStock ? 'Skladem' : 'Dostupnost ověřte v e-shopu'}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
