import type { Metadata } from 'next'
import Link from 'next/link'
import { CloseIcon } from '@/components/icons'
import { MeasurementForm } from '@/components/MeasurementForm'
import { btn, EmptyState, IconLink, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements } from '@/lib/data'
import { MERITKO_PDF_URL } from '@/lib/config'
import { todayIso } from '@/lib/format'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nové měření' }

export default async function NewMeasurementPage({ searchParams }: { searchParams: Promise<{ dite?: string }> }) {
  const { dite } = await searchParams
  const { supabase } = await requireUser()
  const [children, lastByChild] = await Promise.all([getChildren(supabase), getLastMeasurements(supabase)])

  const header = (
    <div className="flex items-center justify-between">
      <PageTitle>Nové měření</PageTitle>
      <IconLink href="/prehled" label="Zavřít">
        <CloseIcon className="size-5" strokeWidth={2} />
      </IconLink>
    </div>
  )

  if (children.length === 0) {
    return (
      <Page>
        {header}
        <EmptyState
          title="Nejdřív přidejte dítě"
          text="Měření se ukládá ke konkrétnímu dítěti."
          action={
            <Link href="/deti/nove" className={btn.small}>
              Přidat dítě
            </Link>
          }
        />
      </Page>
    )
  }

  const defaultChildId = children.some((c) => c.id === dite) ? dite! : children[0].id
  const lastLength = Object.fromEntries(children.map((c) => [c.id, lastByChild.get(c.id)?.foot_length_mm ?? null]))

  return (
    <Page>
      {header}
      <MeasurementForm
        items={children.map(({ id, name, index, photoUrl }) => ({ id, name, index, photoUrl }))}
        defaultChildId={defaultChildId}
        lastLength={lastLength}
        today={todayIso()}
      />
      <a
        href={MERITKO_PDF_URL}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-3 rounded-[20px] bg-forest-soft p-4 text-sm font-bold text-forest"
      >
        <span aria-hidden="true" className="text-2xl">📏</span>
        <span>
          Nemáte metr? Vytiskněte si měřítko na nožku
          <span className="block font-normal text-muted">PDF na A4 – tiskněte ve 100% velikosti</span>
        </span>
      </a>
    </Page>
  )
}
