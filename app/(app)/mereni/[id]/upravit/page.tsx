import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { deleteMeasurement } from '@/app/(app)/actions'
import { DeleteButton } from '@/components/DeleteButton'
import { MeasurementForm } from '@/components/MeasurementForm'
import { BackLink, Page, PageTitle } from '@/components/ui'
import { getChildren, signedUrls } from '@/lib/data'
import { formatDate, todayIso } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Upravit měření' }

export default async function EditMeasurementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const { supabase } = await requireUser()
  const [mRes, children] = await Promise.all([
    supabase
      .from('foot_measurements')
      .select('id, child_id, measured_at, left_length_mm, right_length_mm, left_width_mm, right_width_mm, method, photo_path')
      .eq('id', id)
      .maybeSingle(),
    getChildren(supabase),
  ])
  const m = mRes.data
  const child = m ? children.find((c) => c.id === m.child_id) : undefined
  if (!m || !child) notFound()

  const photoUrl = m.photo_path ? ((await signedUrls(supabase, [m.photo_path])).get(m.photo_path) ?? null) : null

  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href={`/deti/${child.id}`} />
        <PageTitle sub={`${child.name} · ${formatDate(m.measured_at)}`}>Upravit měření</PageTitle>
      </div>
      <MeasurementForm
        items={[{ id: child.id, name: child.name, index: child.index, photoUrl: child.photoUrl }]}
        defaultChildId={child.id}
        lastLength={{}}
        today={todayIso()}
        initial={{ ...m, photoUrl }}
      />
      <div className="mt-2 border-t border-line pt-5">
        <DeleteButton
          action={deleteMeasurement}
          name="measurement_id"
          value={m.id}
          label="Smazat měření"
          question={`Opravdu smazat měření z ${formatDate(m.measured_at)}? Nejde to vrátit.`}
        />
      </div>
    </Page>
  )
}
