import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { deleteChild } from '@/app/(app)/actions'
import { ChildForm } from '@/components/ChildForm'
import { DeleteButton } from '@/components/DeleteButton'
import { BackLink, FormMessage, Page, PageTitle } from '@/components/ui'
import { todayIso } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Upravit dítě' }

export default async function EditChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ chyba?: string }>
}) {
  const { id } = await params
  const { chyba } = await searchParams
  if (!isUuid(id)) notFound()

  const { supabase } = await requireUser()
  const { data: child } = await supabase
    .from('children')
    .select('id, name, birth_date, sex')
    .eq('id', id)
    .maybeSingle()
  if (!child) notFound()

  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href={`/deti/${child.id}`} />
        <PageTitle>Upravit dítě</PageTitle>
      </div>
      <ChildForm today={todayIso()} initial={child} />

      <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5">
        {chyba === 'smazani' && (
          <FormMessage error="Dítě se nepodařilo smazat. Smazat ho může jen ten, kdo ho založil (vlastník)." />
        )}
        <DeleteButton
          action={deleteChild}
          name="child_id"
          value={child.id}
          label="Smazat dítě"
          question={`Opravdu smazat ${child.name}? Smažou se i všechna měření, boty a fotky. Nejde to vrátit.`}
        />
      </div>
    </Page>
  )
}
