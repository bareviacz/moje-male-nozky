import type { Metadata } from 'next'
import { SizeAdvisor, type AdvisorChild } from '@/components/SizeAdvisor'
import { BackLink, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements } from '@/lib/data'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Najít boty' }

export default async function SizeAdvisorPage({ searchParams }: { searchParams: Promise<{ dite?: string }> }) {
  const { dite } = await searchParams
  const { supabase } = await requireUser()
  const [children, lastByChild, sexRes] = await Promise.all([
    getChildren(supabase),
    getLastMeasurements(supabase),
    supabase.from('children').select('id, sex'),
  ])
  const sexById = new Map((sexRes.data ?? []).map((c) => [c.id, c.sex]))
  const items: AdvisorChild[] = children.map((c) => ({
    id: c.id,
    name: c.name,
    index: c.index,
    photoUrl: c.photoUrl,
    lengthMm: lastByChild.get(c.id)?.foot_length_mm ?? null,
    widthMm: lastByChild.get(c.id)?.foot_width_mm ?? null,
    sex: sexById.get(c.id) ?? null,
  }))

  return (
    <Page wide>
      <div className="flex items-center gap-3">
        <BackLink href={dite ? `/boty?dite=${dite}` : '/boty'} />
        <PageTitle sub="Podle velikostních tabulek bot z e-shopu barevia.cz">Najít boty</PageTitle>
      </div>
      <SizeAdvisor items={items} initialId={dite} />
    </Page>
  )
}
