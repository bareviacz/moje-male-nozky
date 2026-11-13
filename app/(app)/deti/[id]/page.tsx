import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AvatarUploader } from '@/components/AvatarUploader'
import { GrowthChart, type GrowthPoint } from '@/components/GrowthChart'
import { EditIcon, PlusIcon, ShoeIcon } from '@/components/icons'
import { ShoeCard } from '@/components/ShoeCard'
import { BackLink, btn, Card, EmptyState, IconLink, Page } from '@/components/ui'
import { getChildren, getShoeCategories, signedUrls } from '@/lib/data'
import { CatalogPicks } from '@/components/CatalogPicks'
import { recommendedInnerLength } from '@/lib/fit'
import { formatAge, formatDate } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Detail dítěte' }

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const { supabase } = await requireUser()
  const [children, growthRes, fitRes, categories, photosRes, sexRes] = await Promise.all([
    getChildren(supabase),
    supabase.from('child_growth').select('*').eq('child_id', id).order('measured_at', { ascending: true }),
    supabase.from('shoe_fit').select('*').eq('child_id', id),
    getShoeCategories(supabase),
    supabase.from('foot_measurements').select('id, photo_path').eq('child_id', id).not('photo_path', 'is', null),
    supabase.from('children').select('sex').eq('id', id).maybeSingle(),
  ])
  const { data: shoePhotoRows } = await supabase.from('shoes').select('id, photo_path, photo_path_2').eq('child_id', id)

  const child = children.find((c) => c.id === id)
  if (!child) notFound()

  const rows = (growthRes.data ?? []).filter((r) => r.foot_length_mm != null && r.measured_at)
  const last = rows.at(-1)
  const points: GrowthPoint[] = rows.map((r) => ({
    months: r.age_months ?? 0,
    length: r.foot_length_mm!,
    date: r.measured_at!,
  }))
  const recommended = last?.foot_length_mm != null ? recommendedInnerLength(last.foot_length_mm) : null
  const categoryByCode = new Map(categories.map((c) => [c.code, c]))

  // Fotky nožek u měření (dočasné odkazy)
  const photoRows = photosRes.data ?? []
  const photoUrlByPath = await signedUrls(supabase, [
    ...photoRows.map((p) => p.photo_path),
    ...(shoePhotoRows ?? []).flatMap((p) => [p.photo_path, p.photo_path_2]),
  ])
  const shoePhotos = new Map(
    (shoePhotoRows ?? []).map((p) => [
      p.id,
      [p.photo_path, p.photo_path_2].flatMap((path) => (path && photoUrlByPath.has(path) ? [photoUrlByPath.get(path)!] : [])),
    ]),
  )
  const photoByMeasurement = new Map(
    photoRows
      .filter((p) => p.photo_path && photoUrlByPath.has(p.photo_path))
      .map((p) => [p.id, photoUrlByPath.get(p.photo_path!)!]),
  )

  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href="/deti" />
        <AvatarUploader
          childId={child.id}
          name={child.name}
          index={child.index}
          photoUrl={child.photoUrl}
          currentPath={child.avatar_path}
        />
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-[22px] font-bold">{child.name}</h1>
          <span className="text-[13px] text-muted">{formatAge(child.birth_date)}</span>
        </div>
        <IconLink href={`/deti/${child.id}/upravit`} label={`Upravit – ${child.name}`}>
          <EditIcon className="size-5" />
        </IconLink>
      </div>

      {!last ? (
        <EmptyState
          title="Zatím žádné měření"
          text="Změřte nožky od paty k nejdelšímu prstu, ideálně ve stoje a odpoledne."
          action={
            <Link href={`/mereni/nove?dite=${child.id}`} className={btn.small}>
              Změřit nožky
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-white p-3">
              <span className="text-xs font-semibold text-muted">Délka</span>
              <span className="font-display text-[22px] font-bold">
                {last.foot_length_mm} <span className="text-[13px] font-semibold">mm</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-white p-3">
              <span className="text-xs font-semibold text-muted">Šířka</span>
              <span className="font-display text-[22px] font-bold">
                {last.foot_width_mm ?? '–'} {last.foot_width_mm != null && <span className="text-[13px] font-semibold">mm</span>}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-forest-soft p-3">
              <span className="text-xs font-bold text-forest">Od minula</span>
              <span className="font-display text-[22px] font-bold text-forest">
                {last.growth_mm != null ? `${last.growth_mm > 0 ? '+' : ''}${last.growth_mm}` : '–'}{' '}
                {last.growth_mm != null && <span className="text-[13px] font-semibold">mm</span>}
              </span>
            </div>
          </div>

          <Card className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold">Růst chodidla</h2>
              <span className="text-xs text-muted">delší nožka, mm</span>
            </div>
            <GrowthChart points={points} />
          </Card>

          <Link
            href={`/deti/${child.id}/plakat`}
            className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4 transition hover:border-field"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-coral-soft text-coral-ink">
              <svg aria-hidden="true" className="size-[22px]" viewBox="0 0 60 100" fill="currentColor">
                <path d="M30 27C43 27 49 38 47.5 51C46 63 40.5 69 41.5 81C42.5 93 36.5 100 28.5 100C18.5 100 14 92.5 15.5 80.5C17 67 11.5 59 11.5 46.5C11.5 34.5 18 27 30 27Z" />
                <ellipse cx="17" cy="16" rx="7" ry="8.5" /><ellipse cx="29.5" cy="9.5" rx="5" ry="6" /><ellipse cx="39.5" cy="11.5" rx="4.3" ry="5.2" /><ellipse cx="47" cy="16.5" rx="3.7" ry="4.5" /><ellipse cx="52.5" cy="23.5" rx="3.2" ry="3.8" />
              </svg>
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">Plakát k tisku</span>
              <span className="text-[13px] text-muted">Nožka ve skutečné velikosti a jak povyrostla</span>
            </span>
          </Link>

          {recommended && (
            <Card className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sun-soft text-sun-ink">
                <ShoeIcon className="size-[22px]" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-muted">Doporučená vnitřní délka nové boty</span>
                <span className="font-display text-xl font-bold">
                  {recommended.min}–{recommended.max} mm
                </span>
              </div>
              <Link href={`/boty/vybrat?dite=${child.id}`} className={btn.small}>
                Najít boty
              </Link>
            </Card>
          )}

          {last.foot_length_mm != null && (
            <CatalogPicks supabase={supabase} footMm={last.foot_length_mm} sex={sexRes.data?.sex ?? null} />
          )}
        </>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="mereni-nadpis">
        <div className="flex items-baseline justify-between">
          <h2 id="mereni-nadpis" className="font-display text-lg font-bold">
            Měření
          </h2>
          <Link href={`/mereni/nove?dite=${child.id}`} className="flex items-center gap-1 text-sm font-bold text-forest">
            <PlusIcon className="size-4" strokeWidth={2.2} /> Nové měření
          </Link>
        </div>
        {rows.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
            {[...rows].reverse().map((r) => (
              <li key={r.measurement_id} className="flex items-center justify-between gap-3 px-4 py-3">
                {r.measurement_id && photoByMeasurement.has(r.measurement_id) && (
                  <a
                    href={photoByMeasurement.get(r.measurement_id)}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Fotka nožky z ${formatDate(r.measured_at!)}`}
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoByMeasurement.get(r.measurement_id)}
                      alt=""
                      className="size-11 rounded-xl object-cover ring-1 ring-line"
                    />
                  </a>
                )}
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{formatDate(r.measured_at!)}</span>
                  <span className="text-xs text-muted">
                    L {r.left_length_mm ?? '–'} · P {r.right_length_mm ?? '–'} mm
                  </span>
                </div>
                <Link
                  href={`/mereni/${r.measurement_id}/upravit`}
                  className="flex flex-col items-end rounded-xl px-2 py-1 hover:bg-ground"
                  aria-label={`Upravit měření z ${formatDate(r.measured_at!)}`}
                >
                  <span className="font-display text-lg font-bold">{r.foot_length_mm} mm</span>
                  {r.growth_mm != null && r.growth_mm !== 0 && (
                    <span className="text-xs font-bold text-forest">
                      {r.growth_mm > 0 ? '+' : ''}
                      {r.growth_mm} mm
                    </span>
                  )}
                  <span className="text-xs font-bold text-forest">Upravit</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="boty-nadpis">
        <div className="flex items-baseline justify-between">
          <h2 id="boty-nadpis" className="font-display text-lg font-bold">
            Nošené boty
          </h2>
          <Link href={`/boty/nova?dite=${child.id}`} className="flex items-center gap-1 text-sm font-bold text-forest">
            <PlusIcon className="size-4" strokeWidth={2.2} /> Přidat botu
          </Link>
        </div>
        {(fitRes.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Zatím žádné boty.</p>
        ) : (
          (fitRes.data ?? []).map((s) => {
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
                  photos: shoePhotos.get(s.shoe_id!),
                }}
              />
            )
          })
        )}
      </section>
    </Page>
  )
}
