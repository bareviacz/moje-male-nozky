import type { Metadata } from 'next'
import Link from 'next/link'
import { ChildAvatar } from '@/components/ChildAvatar'
import { PlusIcon } from '@/components/icons'
import { ShoeCard } from '@/components/ShoeCard'
import { btn, cx, EmptyState, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements, getShoeCategories, signedUrls } from '@/lib/data'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Boty' }

export default async function ShoesPage({
  searchParams,
}: {
  searchParams: Promise<{ dite?: string; vyrazene?: string }>
}) {
  const { dite, vyrazene } = await searchParams
  const showRetired = vyrazene === '1'
  const { supabase } = await requireUser()
  const [children, lastByChild, categories] = await Promise.all([
    getChildren(supabase),
    getLastMeasurements(supabase),
    getShoeCategories(supabase),
  ])

  if (children.length === 0) {
    return (
      <Page>
        <PageTitle>Boty</PageTitle>
        <EmptyState
          title="Nejdřív přidejte dítě"
          text="Boty se evidují ke konkrétnímu dítěti."
          action={
            <Link href="/deti/nove" className={btn.small}>
              Přidat dítě
            </Link>
          }
        />
      </Page>
    )
  }

  const child = children.find((c) => c.id === dite) ?? children[0]
  const categoryByCode = new Map(categories.map((c) => [c.code, c]))

  const [activeRes, retiredRes, retiredCountRes, photoRes] = await Promise.all([
    supabase.from('shoe_fit').select('*').eq('child_id', child.id),
    showRetired
      ? supabase
          .from('shoes')
          .select('id, brand, model, category, eu_size, inner_length_mm, retired_at')
          .eq('child_id', child.id)
          .not('retired_at', 'is', null)
          .order('retired_at', { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from('shoes')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', child.id)
      .not('retired_at', 'is', null),
    supabase.from('shoes').select('id, photo_path, photo_path_2').eq('child_id', child.id),
  ])

  // Fotky bot (dočasné odkazy)
  const photoRows = photoRes.data ?? []
  const photoUrls = await signedUrls(supabase, photoRows.flatMap((p) => [p.photo_path, p.photo_path_2]))
  const photosByShoe = new Map(
    photoRows.map((p) => [
      p.id,
      [p.photo_path, p.photo_path_2].flatMap((path) => (path && photoUrls.has(path) ? [photoUrls.get(path)!] : [])),
    ]),
  )

  const active = activeRes.data ?? []
  const retired = retiredRes.data ?? []
  const retiredCount = retiredCountRes.count ?? 0
  const last = lastByChild.get(child.id)

  // Nejdřív boty, které jsou malé
  const order = { too_small: 0, soon_small: 1, ok: 2, roomy: 3, unknown: 4 } as Record<string, number>
  active.sort((a, b) => (order[a.fit_status ?? 'unknown'] ?? 9) - (order[b.fit_status ?? 'unknown'] ?? 9))

  const tab = (href: string, label: string, selected: boolean) => (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={cx(
        'flex h-11 items-center border-b-[3px] px-0.5 text-[15px]',
        selected ? 'border-forest font-bold text-ink' : 'border-transparent font-semibold text-muted',
      )}
    >
      {label}
    </Link>
  )

  return (
    <Page wide>
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Boty</PageTitle>
        <Link href={`/boty/nova?dite=${child.id}`} className={btn.small}>
          <PlusIcon className="size-[18px]" strokeWidth={2.2} />
          Přidat
        </Link>
      </div>

      <nav aria-label="Vybrat dítě" className="flex flex-wrap gap-2">
        {children.map((c) => {
          const selected = c.id === child.id
          const len = lastByChild.get(c.id)?.foot_length_mm
          return (
            <Link
              key={c.id}
              href={`/boty?dite=${c.id}`}
              aria-current={selected ? 'page' : undefined}
              className={cx(
                'flex h-11 items-center gap-2 rounded-full bg-white py-0 pr-3.5 pl-1.5 text-sm',
                selected ? 'border-2 border-forest font-bold' : 'border-[1.5px] border-field font-semibold',
              )}
            >
              <ChildAvatar name={c.name} index={c.index} size="sm" photoUrl={c.photoUrl} />
              {c.name}
              {selected && len != null && <span className="font-semibold text-muted">· {len} mm</span>}
            </Link>
          )
        })}
      </nav>

      <div className="flex gap-5 border-b border-[#E6E0D6]">
        {tab(`/boty?dite=${child.id}`, `Nosí se (${active.length})`, !showRetired)}
        {tab(`/boty?dite=${child.id}&vyrazene=1`, `Vyřazené (${retiredCount})`, showRetired)}
      </div>

      {!showRetired && (
        <Link
          href={`/boty/vybrat?dite=${child.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-forest-soft px-4 py-3 text-sm text-forest-dark hover:bg-forest-pale"
        >
          <span>
            <strong>Najít nové boty:</strong> velikost z e-shopu Barevia podle délky nožky{last?.foot_length_mm != null ? ` (${last.foot_length_mm} mm)` : ''}.
          </span>
          <span aria-hidden="true" className="font-bold">→</span>
        </Link>
      )}

      <Link
        href={showRetired ? '/bazar/prodat' : `/bazar?dite=${child.id}`}
        className="flex items-center justify-between gap-3 rounded-2xl bg-sun-soft px-4 py-3 text-sm text-sun-deep hover:bg-[#FBE7BE]"
      >
        <span>
          <strong>Bazárek Barevia:</strong>{' '}
          {showRetired ? 'boty, ze kterých děti vyrostly, prodáte jedním klepnutím.' : 'bazarové barefoot boty vybrané podle délky nožky.'}
        </span>
        <span aria-hidden="true" className="font-bold">→</span>
      </Link>

      {!last && !showRetired && (
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-sm text-sun-deep">
          {child.name} zatím nemá žádné měření, rezervu v botách proto nespočítáme.{' '}
          <Link href={`/mereni/nove?dite=${child.id}`} className="font-bold underline">
            Změřit nožky
          </Link>
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {!showRetired &&
          active.map((s) => {
            const cat = s.category ? categoryByCode.get(s.category) : undefined
            return (
              <ShoeCard
                key={s.shoe_id}
                shoe={{
                  id: s.shoe_id!,
                  brand: s.brand,
                  model: s.model,
                  categoryName: cat?.name ?? null,
                  eshopUrl: cat?.eshop_url ?? null,
                  euSize: s.eu_size,
                  innerLength: s.inner_length_mm,
                  reserve: s.length_reserve_mm,
                  fitStatus: s.fit_status,
                  photos: photosByShoe.get(s.shoe_id!),
                }}
              />
            )
          })}
        {showRetired &&
          retired.map((s) => {
            const cat = s.category ? categoryByCode.get(s.category) : undefined
            return (
              <ShoeCard
                key={s.id}
                shoe={{
                  id: s.id,
                  brand: s.brand,
                  model: s.model,
                  categoryName: cat?.name ?? null,
                  eshopUrl: null,
                  euSize: s.eu_size,
                  innerLength: s.inner_length_mm,
                  reserve: null,
                  fitStatus: null,
                  retiredAt: s.retired_at,
                  photos: photosByShoe.get(s.id),
                }}
              />
            )
          })}
      </div>

      {!showRetired && active.length === 0 && (
        <EmptyState
          title="Žádné nošené boty"
          text="Přidejte boty, které dítě právě nosí. Aplikace pak pohlídá, kdy budou malé."
          action={
            <Link href={`/boty/nova?dite=${child.id}`} className={btn.small}>
              Přidat boty
            </Link>
          }
        />
      )}
      {showRetired && retired.length === 0 && <p className="text-sm text-muted">Zatím žádné vyřazené boty.</p>}
    </Page>
  )
}
