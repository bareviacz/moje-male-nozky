import type { Metadata } from 'next'
import Link from 'next/link'
import { BazarBanner } from '@/components/BazarBanner'
import { ChildAvatar } from '@/components/ChildAvatar'
import { FirstChildCard } from '@/components/FirstChildCard'
import { MeritkoCard } from '@/components/MeritkoCard'
import { SeasonCard } from '@/components/SeasonCard'
import { ShoeAlertCard } from '@/components/ShoeAlertCard'
import { RulerIcon } from '@/components/icons'
import { Page } from '@/components/ui'
import { ESHOP_URL, utm } from '@/lib/config'
import { getChildren, getLastMeasurements, getShoeCategories, REMEASURE_AFTER_DAYS } from '@/lib/data'
import { daysBetween, formatAge, formatAgo, greeting } from '@/lib/format'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Přehled' }

export default async function OverviewPage() {
  const { supabase, user } = await requireUser()

  const [profileRes, children, lastByChild, categories, alertsRes, seasonsRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    getChildren(supabase),
    getLastMeasurements(supabase),
    getShoeCategories(supabase),
    supabase.from('shoe_fit').select('*').in('fit_status', ['soon_small', 'too_small']),
    supabase.from('season_reminders').select('*').order('starts_on', { ascending: true }),
  ])

  const name = profileRes.data?.display_name
  const childById = new Map(children.map((c) => [c.id, c]))
  const categoryByCode = new Map(categories.map((c) => [c.code, c]))
  const shoeAlerts = (alertsRes.data ?? []).filter((s) => s.child_id && childById.has(s.child_id))

  // Sezónní upozornění: jedna karta na druh obuvi
  const seasons = new Map<string, NonNullable<typeof seasonsRes.data>>()
  for (const row of seasonsRes.data ?? []) {
    if (!row.category) continue
    seasons.set(row.category, [...(seasons.get(row.category) ?? []), row])
  }

  const toMeasure = children.filter((c) => {
    const last = lastByChild.get(c.id)
    return !last || daysBetween(last.measured_at) > REMEASURE_AFTER_DAYS
  })

  return (
    <Page wide>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-muted">{greeting()}</span>
          <h1 className="font-display text-[28px] font-bold md:text-[34px]">{name || 'Vítejte'}</h1>
        </div>
      </div>

      {children.length === 0 && <FirstChildCard />}

      {/* Děti */}
      {children.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="deti-nadpis">
          <div className="flex items-baseline justify-between">
            <h2 id="deti-nadpis" className="font-display text-xl font-bold">
              Moje děti
            </h2>
            <Link href="/deti/nove" className="text-sm font-bold text-forest">
              + Přidat dítě
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {children.map((c) => {
              const last = lastByChild.get(c.id)
              return (
                <Link
                  key={c.id}
                  href={`/deti/${c.id}`}
                  className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4 transition hover:border-field"
                >
                  <ChildAvatar name={c.name} index={c.index} size="lg" photoUrl={c.photoUrl} />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[17px] font-bold">{c.name}</span>
                    <span className="text-[13px] text-muted">
                      {formatAge(c.birth_date)}
                      {last ? ` · měřeno ${formatAgo(last.measured_at)}` : ' · zatím neměřeno'}
                    </span>
                  </div>
                  {last?.foot_length_mm != null && (
                    <div className="flex flex-col items-end">
                      <span className="font-display text-[22px] font-bold">{last.foot_length_mm}</span>
                      <span className="text-xs text-muted">mm</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Boty brzy malé */}
      {shoeAlerts.map((s) => {
        const child = childById.get(s.child_id!)!
        const cat = s.category ? categoryByCode.get(s.category) : undefined
        const what = [cat?.name, s.brand].filter(Boolean).join(' ') || 'Boty'
        return (
          <ShoeAlertCard
            key={s.shoe_id}
            child={child}
            what={what}
            reserveMm={s.length_reserve_mm}
            footMm={s.foot_length_mm}
            tooSmall={s.fit_status === 'too_small'}
            eshopUrl={utm(cat?.eshop_url ?? ESHOP_URL, 'prehled_male_boty')}
          />
        )
      })}

      {/* Sezóna */}
      {[...seasons.entries()].map(([code, rows]) => {
        const first = rows[0]
        return (
          <SeasonCard
            key={code}
            code={code}
            categoryName={first.category_name ?? 'nové boty'}
            startsOn={first.starts_on}
            endsOn={first.ends_on}
            isOpen={!!first.is_open}
            daysUntilStart={first.days_until_start}
            eshopUrl={utm(first.eshop_url ?? ESHOP_URL, 'prehled_doporuceni')}
            rows={rows}
            childById={childById}
          />
        )
      })}

      {/* Bazárek */}
      <BazarBanner />

      {/* Měřítko na nožku */}
      <MeritkoCard />

      {/* Připomínka měření */}
      {toMeasure.slice(0, 1).map((c) => (
        <Link
          key={c.id}
          href={`/mereni/nove?dite=${c.id}`}
          className="flex items-center gap-3.5 rounded-[20px] bg-forest p-[18px] text-white transition hover:bg-forest-dark"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sun text-ink">
            <RulerIcon className="size-[22px]" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-bold">{c.name} čeká na změření</span>
            <span className="text-[13px] text-forest-pale">Malé nožky měřte zhruba každé 3 měsíce</span>
          </span>
        </Link>
      ))}
    </Page>
  )
}
