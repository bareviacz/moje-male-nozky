import type { Metadata } from 'next'
import Link from 'next/link'
import { ChildAvatar } from '@/components/ChildAvatar'
import { CalendarIcon, RulerIcon, ShoeIcon } from '@/components/icons'
import { btn, EmptyState, Page } from '@/components/ui'
import { ESHOP_URL } from '@/lib/config'
import { getChildren, getLastMeasurements, getShoeCategories, REMEASURE_AFTER_DAYS } from '@/lib/data'
import { daysBetween, formatAge, formatAgo, formatDayMonth, greeting } from '@/lib/format'
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

      {children.length === 0 && (
        <EmptyState
          title="Přidejte první dítě"
          text="Zadejte jméno a datum narození. Pak můžete zapsat první měření nožek."
          action={
            <Link href="/deti/nove" className={btn.small}>
              Přidat dítě
            </Link>
          }
        />
      )}

      {/* Boty brzy malé */}
      {shoeAlerts.map((s) => {
        const child = childById.get(s.child_id!)!
        const cat = s.category ? categoryByCode.get(s.category) : undefined
        const what = [cat?.name, s.brand].filter(Boolean).join(' ') || 'Boty'
        return (
          <div key={s.shoe_id} className="flex items-start gap-3.5 rounded-[20px] bg-sun-soft p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sun-ink">
              <ShoeIcon className="size-[22px]" />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[15px] font-bold">
                {what} – {child.name}: {s.fit_status === 'too_small' ? 'už jsou malé' : 'brzy budou malé'}
              </span>
              <span className="text-sm leading-snug text-sun-deep">
                Rezerva {s.length_reserve_mm} mm.
                {s.foot_length_mm != null &&
                  ` Na nové doporučujeme vnitřní délku ${s.foot_length_mm + 8}–${s.foot_length_mm + 12} mm.`}
              </span>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <a href={cat?.eshop_url ?? ESHOP_URL} target="_blank" rel="noopener" className="text-sm font-bold text-sun-ink underline">
                  Vybrat větší na barevia.cz
                </a>
                <Link href={`/boty?dite=${child.id}`} className="text-sm font-bold text-sun-ink">
                  Zobrazit boty
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {/* Sezóna */}
      {[...seasons.entries()].map(([code, rows]) => {
        const first = rows[0]
        const open = first.is_open
        return (
          <div key={code} className="flex items-start gap-3.5 rounded-[20px] border border-line bg-white p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-olive-soft text-olive">
              <CalendarIcon className="size-[22px]" />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[15px] font-bold">
                {open
                  ? `Je čas na ${first.category_name?.toLowerCase()}`
                  : `Za ${first.days_until_start} dní začíná sezóna: ${first.category_name?.toLowerCase()}`}
              </span>
              <span className="text-[13px] text-muted">
                Nákup od {first.starts_on && formatDayMonth(first.starts_on)} do {first.ends_on && formatDayMonth(first.ends_on)}
              </span>
              <ul className="flex flex-col gap-1">
                {rows.map((r) => (
                  <li key={`${r.child_id}-${r.window_id}`} className="text-sm">
                    <strong>{r.child_name}:</strong>{' '}
                    {r.recommended_inner_min_mm != null
                      ? `vnitřní délka ${r.recommended_inner_min_mm}–${r.recommended_inner_max_mm} mm`
                      : 'nejdřív změřte nožky'}
                    {r.days_since_measurement != null && r.days_since_measurement > 60 && (
                      <span className="text-muted"> (měřeno {formatAgo(r.last_measured_at!)} – změřte znovu)</span>
                    )}
                  </li>
                ))}
              </ul>
              <a href={first.eshop_url ?? ESHOP_URL} target="_blank" rel="noopener" className="mt-1 text-sm font-bold text-forest underline">
                Prohlédnout {first.category_name?.toLowerCase()} na barevia.cz
              </a>
            </div>
          </div>
        )
      })}

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
                  <ChildAvatar name={c.name} index={c.index} size="lg" />
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
