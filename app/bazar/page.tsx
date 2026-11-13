import Link from 'next/link'
import { FiltersToggle } from '@/components/bazar/FiltersToggle'
import { ListingCard, type ListingCardData } from '@/components/bazar/ListingCard'
import { btn, cx, EmptyState, inputClass } from '@/components/ui'
import { CONDITION_LABEL, fitRange, isCondition, isWidth, WIDTH_LABEL } from '@/lib/bazar'
import { getChildren, getLastMeasurements } from '@/lib/data'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

type Search = {
  noha?: string
  dite?: string
  druh?: string
  sirka?: string
  stav?: string
  znacka?: string
  max?: string
  prodava?: string
  razeni?: string
}

const CONDITION_ORDER = ['jako_nove', 'lehce_nosene', 'nosene', 'hodne_nosene'] as const

export default async function BazarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Děti přihlášeného rodiče a jejich poslední délka nožky (pro filtr „padne“)
  const kids: { id: string; name: string; foot: number | null }[] = []
  if (user) {
    const [children, last] = await Promise.all([getChildren(supabase), getLastMeasurements(supabase)])
    for (const c of children) kids.push({ id: c.id, name: c.name, foot: last.get(c.id)?.foot_length_mm ?? null })
  }

  const kid = sp.dite && isUuid(sp.dite) ? kids.find((k) => k.id === sp.dite) : undefined
  const footRaw = kid?.foot ?? Number(sp.noha)
  const foot = Number.isFinite(footRaw) && footRaw >= 60 && footRaw <= 300 ? Math.round(footRaw) : null

  const { data: categories } = await supabase.from('shoe_categories').select('code, name').order('sort_order')
  const catName = new Map((categories ?? []).map((c) => [c.code, c.name]))

  let q = supabase
    .from('bazar_listings')
    .select(
      'id, brand, model, size_eu, inner_length_mm, width, category, condition, price_czk, status, created_at, bazar_sellers!inner(is_barevia), bazar_listing_photos(storage_path, kind, position)',
    )
    .in('status', ['aktivni', 'rezervovano'])

  if (foot) {
    const r = fitRange(foot)
    q = q.gte('inner_length_mm', r.min).lte('inner_length_mm', r.max)
  }
  if (sp.druh && catName.has(sp.druh)) q = q.eq('category', sp.druh)
  if (sp.sirka && isWidth(sp.sirka)) q = q.eq('width', sp.sirka)
  if (sp.stav && isCondition(sp.stav)) q = q.in('condition', CONDITION_ORDER.slice(0, CONDITION_ORDER.indexOf(sp.stav) + 1))
  if (sp.znacka && sp.znacka.trim().length >= 2)
    q = q.ilike('brand', `%${sp.znacka.trim().replace(/[%_,()]/g, '').slice(0, 40)}%`)
  const max = Number(sp.max)
  if (Number.isFinite(max) && max > 0) q = q.lte('price_czk', Math.round(max))
  q =
    sp.razeni === 'cena'
      ? q.order('price_czk', { ascending: true })
      : q.order('status', { ascending: true }).order('created_at', { ascending: false })

  const { data, error } = await q.limit(120)

  const listings: ListingCardData[] = (data ?? [])
    .filter((l) => (sp.prodava === 'barevia' ? l.bazar_sellers?.is_barevia : sp.prodava === 'rodice' ? !l.bazar_sellers?.is_barevia : true))
    .map((l) => ({
    id: l.id,
    brand: l.brand,
    model: l.model,
    size_eu: l.size_eu,
    inner_length_mm: l.inner_length_mm,
    width: l.width,
    condition: l.condition,
    price_czk: l.price_czk,
    status: l.status,
    categoryName: catName.get(l.category) ?? null,
    isBarevia: l.bazar_sellers?.is_barevia ?? false,
    photos: l.bazar_listing_photos ?? [],
  }))
  if (foot && sp.razeni === 'padne') {
    const ideal = foot + 10
    listings.sort((a, b) => Math.abs(a.inner_length_mm - ideal) - Math.abs(b.inner_length_mm - ideal))
  }

  const anyFilter = !!(sp.druh || sp.sirka || sp.stav || sp.znacka || sp.max || sp.prodava)
  const r = foot ? fitRange(foot) : null

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[280px_1fr] md:items-start md:gap-7">
      <form method="get" action="/bazar" className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-4 md:sticky md:top-24">
        <div className="flex flex-col gap-2 rounded-2xl bg-forest-soft p-3.5">
          <label htmlFor="noha" className="text-sm font-bold">
            Délka nožky (mm)
          </label>
          {kids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kids.map((k) =>
                k.foot ? (
                  <Link
                    key={k.id}
                    href={`/bazar?dite=${k.id}`}
                    className={cx(
                      'rounded-full px-3 py-1.5 text-sm font-bold',
                      kid?.id === k.id ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-forest/30',
                    )}
                  >
                    {k.name} · {k.foot} mm
                  </Link>
                ) : null,
              )}
            </div>
          )}
          <input id="noha" name="noha" type="number" inputMode="numeric" min={60} max={300} defaultValue={kid ? '' : (foot ?? '')} placeholder="např. 148" className={inputClass} />
          <span className="text-[13px] text-muted">
            Ukážeme boty s vnitřní délkou o 8–12 mm delší, než je nožka.
            {!user && ' Po přihlášení stačí klepnout na jméno dítěte z Moje malé nožky.'}
          </span>
        </div>

        <FiltersToggle defaultOpen={anyFilter}>
            <Select id="druh" label="Druh" value={sp.druh} options={(categories ?? []).map((c): [string, string] => [c.code, c.name])} all="Všechny druhy" />
            <Select id="sirka" label="Šířka" value={sp.sirka} options={Object.entries(WIDTH_LABEL)} all="Vše" />
            <Select id="stav" label="Stav nejhůř" value={sp.stav} options={Object.entries(CONDITION_LABEL).filter(([k]) => k !== 'hodne_nosene')} all="Vše" />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="znacka" className="text-sm font-bold">Značka</label>
              <input id="znacka" name="znacka" type="text" defaultValue={sp.znacka} placeholder="např. Be Lenka" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="max" className="text-sm font-bold">Cena do (Kč)</label>
              <input id="max" name="max" type="number" inputMode="numeric" min={0} step={50} defaultValue={sp.max} className={inputClass} />
            </div>
            <Select id="prodava" label="Prodává" value={sp.prodava} options={[['barevia', 'Barevia.cz'], ['rodice', 'Ostatní']]} all="Kdokoli" />
            <Select
              id="razeni"
              label="Řadit"
              value={sp.razeni}
              options={[['cena', 'Od nejlevnější'], ['padne', 'Nejlépe padnoucí']]}
              all="Nejnovější"
            />
        </FiltersToggle>
        {kid && <input type="hidden" name="dite" value={kid.id} />}
        <button type="submit" className={btn.primary}>Hledat</button>
        {(anyFilter || foot) && (
          <Link href="/bazar" className="text-center text-sm font-bold text-forest">Zrušit filtry</Link>
        )}
      </form>

      <section className="flex flex-col gap-4" aria-labelledby="nabidka">
        <div className="flex flex-col gap-1">
          <h1 id="nabidka" className="font-display text-[28px] leading-tight font-bold text-balance">Bazarové barefoot botičky</h1>
          <p className="text-sm text-muted tabular-nums" aria-live="polite">
            {r
              ? `${listings.length} párů s vnitřní délkou ${r.min}–${r.max} mm${kid ? ` pro ${kid.name}` : ''}.`
              : `${listings.length} párů v nabídce.`}
          </p>
        </div>
        {error && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-semibold text-coral-ink">Nabídku se nepodařilo načíst. Zkuste stránku obnovit.</p>}
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} l={l} footMm={foot} />
            ))}
          </div>
        ) : (
          !error && (
            <EmptyState
              title={foot || anyFilter ? 'Takové boty teď nikdo nenabízí' : 'Bazar se teprve plní'}
              text={foot || anyFilter ? 'Zkuste povolit jiný druh, šířku nebo stav.' : 'Buďte první, kdo sem dá boty, ze kterých dítě vyrostlo.'}
              action={<Link href="/bazar/prodat" className={btn.small}>Prodat boty</Link>}
            />
          )
        )}
      </section>
    </div>
  )
}

function Select({ id, label, value, options, all }: { id: string; label: string; value?: string; options: [string, string][]; all: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      <select id={id} name={id} defaultValue={value ?? ''} className={inputClass}>
        <option value="">{all}</option>
        {options.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </div>
  )
}
