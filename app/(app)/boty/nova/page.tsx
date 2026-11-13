import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoeForm } from '@/components/ShoeForm'
import { BackLink, btn, EmptyState, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements, getShoeCategories } from '@/lib/data'
import { todayIso } from '@/lib/format'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Přidat boty' }

export default async function NewShoePage({ searchParams }: { searchParams: Promise<{ dite?: string }> }) {
  const { dite } = await searchParams
  const { supabase } = await requireUser()
  const [children, lastByChild, categories] = await Promise.all([
    getChildren(supabase),
    getLastMeasurements(supabase),
    getShoeCategories(supabase),
  ])

  if (children.length === 0) {
    return (
      <Page>
        <PageTitle>Přidat boty</PageTitle>
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

  const defaultChildId = children.some((c) => c.id === dite) ? dite! : children[0].id

  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href={`/boty?dite=${defaultChildId}`} />
        <PageTitle>Přidat boty</PageTitle>
      </div>
      <ShoeForm
        items={children.map(({ id, name, index, photoUrl }) => ({ id, name, index, photoUrl }))}
        defaultChildId={defaultChildId}
        lastLength={Object.fromEntries(children.map((c) => [c.id, lastByChild.get(c.id)?.foot_length_mm ?? null]))}
        categories={categories.map(({ code, name }) => ({ code, name }))}
        today={todayIso()}
      />
    </Page>
  )
}
