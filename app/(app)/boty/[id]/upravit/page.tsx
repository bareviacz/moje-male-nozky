import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { deleteShoe } from '@/app/(app)/actions'
import { DeleteButton } from '@/components/DeleteButton'
import { ShoeForm } from '@/components/ShoeForm'
import { BackLink, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements, getShoeCategories, signedUrls } from '@/lib/data'
import { todayIso } from '@/lib/format'
import { isUuid } from '@/lib/forms'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Upravit boty' }

export default async function EditShoePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const { supabase } = await requireUser()
  const [shoeRes, children, lastByChild, categories] = await Promise.all([
    supabase
      .from('shoes')
      .select('id, child_id, category, brand, model, eu_size, inner_length_mm, inner_width_mm, purchased_at, photo_path, photo_path_2')
      .eq('id', id)
      .maybeSingle(),
    getChildren(supabase),
    getLastMeasurements(supabase),
    getShoeCategories(supabase),
  ])
  const shoe = shoeRes.data
  if (!shoe) notFound()

  const title = [shoe.brand, shoe.model].filter(Boolean).join(' ') || 'boty'
  const photoPaths = [shoe.photo_path, shoe.photo_path_2].filter((p): p is string => !!p)
  const urls = await signedUrls(supabase, photoPaths)
  const photos = photoPaths.filter((p) => urls.has(p)).map((p) => ({ path: p, url: urls.get(p)! }))

  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href={`/boty?dite=${shoe.child_id}`} />
        <PageTitle>Upravit boty</PageTitle>
      </div>
      <ShoeForm
        items={children.map(({ id, name, index, photoUrl }) => ({ id, name, index, photoUrl }))}
        defaultChildId={shoe.child_id}
        lastLength={Object.fromEntries(children.map((c) => [c.id, lastByChild.get(c.id)?.foot_length_mm ?? null]))}
        categories={categories.map(({ code, name }) => ({ code, name }))}
        today={todayIso()}
        initial={{ ...shoe, photos }}
      />
      <div className="mt-6 border-t border-line pt-5">
        <DeleteButton
          action={deleteShoe}
          name="shoe_id"
          value={shoe.id}
          label="Smazat boty"
          question={`Opravdu smazat ${title}? Pokud je dítě už nenosí, stačí je místo smazání vyřadit.`}
        />
      </div>
    </Page>
  )
}
