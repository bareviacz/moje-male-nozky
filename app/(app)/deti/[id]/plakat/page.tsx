import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PosterA4, type PosterData } from '@/components/PosterA4'
import { PosterPreview, PrintButton } from '@/components/PosterPreview'
import { BackLink, btn, cx, EmptyState, Page, PageTitle } from '@/components/ui'
import { monthsBetween } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { POSTER_COLORS, posterColor, type PosterColor } from '@/lib/poster'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Plakát' }

export default async function PosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ barva?: string }>
}) {
  const { id } = await params
  const { barva } = await searchParams
  if (!isUuid(id)) notFound()

  const { supabase } = await requireUser()
  const [childRes, growthRes] = await Promise.all([
    supabase.from('children').select('id, name, birth_date, sex').eq('id', id).maybeSingle(),
    supabase
      .from('child_growth')
      .select('measured_at, foot_length_mm')
      .eq('child_id', id)
      .order('measured_at', { ascending: true }),
  ])
  const child = childRes.data
  if (!child) notFound()

  const all = (growthRes.data ?? [])
    .filter((r) => r.measured_at && r.foot_length_mm)
    .map((r) => ({ date: r.measured_at!, length: r.foot_length_mm! }))

  const color = posterColor(barva, child.sex)

  if (all.length === 0) {
    return (
      <Page>
        <div className="flex items-center gap-3">
          <BackLink href={`/deti/${child.id}`} />
          <PageTitle>Plakát</PageTitle>
        </div>
        <EmptyState
          title="Nejdřív změřte nožku"
          text="Plakát se skládá z naměřených délek. Po prvním měření ukáže nožku ve skutečné velikosti, po dalších i to, jak povyrostla."
          action={
            <Link href={`/mereni/nove?dite=${child.id}`} className={btn.small}>
              Změřit nožky
            </Link>
          }
        />
      </Page>
    )
  }

  // Období: od měření zhruba před rokem (nebo od prvního) do posledního
  const last = all[all.length - 1]
  const yearAgoCandidates = all.filter((m) => monthsBetween(m.date, last.date) <= 13)
  const first = yearAgoCandidates[0] !== last ? yearAgoCandidates[0] : null
  const period = first ? all.filter((m) => m.date >= first.date) : [last]
  const points =
    period.length <= 6 ? period : [0, 1, 2, 3, 4, 5].map((i) => period[Math.round((i * (period.length - 1)) / 5)])

  const data: PosterData = {
    name: child.name,
    birthDate: child.birth_date,
    sex: child.sex,
    last,
    first,
    months: first ? monthsBetween(first.date, last.date) : 0,
    points,
  }

  return (
    <div className="poster-page">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .no-print, nav { display: none !important; }
          .poster-page { padding: 0 !important; }
          .poster-box { height: auto !important; }
          .poster-sheet { transform: none !important; box-shadow: none !important; outline: none !important; --tw-ring-shadow: 0 0 #0000 !important; }
        }
      `}</style>

      <div className="no-print">
        <Page>
          <div className="flex items-center gap-3">
            <BackLink href={`/deti/${child.id}`} />
            <PageTitle sub="A4 · nožka ve skutečné velikosti">Plakát – {child.name}</PageTitle>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold">Barva</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(POSTER_COLORS) as PosterColor[]).map((key) => (
                <Link
                  key={key}
                  href={`/deti/${child.id}/plakat?barva=${key}`}
                  replace
                  scroll={false}
                  aria-current={key === color ? 'true' : undefined}
                  className={cx(
                    'flex h-11 items-center gap-2 rounded-full bg-white pr-4 pl-1.5 text-sm',
                    key === color ? 'border-2 border-ink font-bold' : 'border-[1.5px] border-field font-semibold',
                  )}
                >
                  <span
                    className="size-8 rounded-full ring-1 ring-black/10"
                    style={{ background: POSTER_COLORS[key].fill }}
                    aria-hidden="true"
                  />
                  {POSTER_COLORS[key].label}
                </Link>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <PrintButton />
            <p className="text-[13px] leading-relaxed text-muted">
              V tisku zvolte papír <strong>A4</strong> a měřítko <strong>100 %</strong> („Skutečná velikost“, ne „Přizpůsobit
              stránce“), jinak nožka nebude mít správnou délku. Pro PDF vyberte tiskárnu „Uložit jako PDF“.
            </p>
          </div>
        </Page>
      </div>

      <div className="mx-auto w-full max-w-[820px] px-5 pb-28 md:px-8 print:max-w-none print:p-0">
        <PosterPreview>
          <PosterA4 data={data} color={color} />
        </PosterPreview>
      </div>
    </div>
  )
}
