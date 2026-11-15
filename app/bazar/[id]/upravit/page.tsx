import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DeleteListingForm } from '@/components/bazar/SmallForms'
import { ListingForm } from '@/components/bazar/ListingForm'
import { Card, PageTitle } from '@/components/ui'
import { isPhotoKind, listingTitle, publicPhotoUrl, type BazarPhotoKind } from '@/lib/bazar'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Upravit inzerát', robots: { index: false } }

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=${encodeURIComponent(`/bazar/${id}/upravit`)}`)

  const [{ data: l }, { data: categories }] = await Promise.all([
    supabase
      .from('bazar_listings')
      .select(
        'id, seller_id, status, brand, model, size_eu, inner_length_mm, inner_width_mm, width, category, condition, price_czk, description, bazar_listing_photos(storage_path, kind, position)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('shoe_categories').select('code, name').order('sort_order'),
  ])
  if (!l || l.seller_id !== user.id) notFound()

  const editable = ['aktivni', 'skryto', 'koncept'].includes(l.status)
  const photos = [...(l.bazar_listing_photos ?? [])]
    .sort((a, b) => a.position - b.position)
    .filter((p) => isPhotoKind(p.kind))
    .map((p) => ({ kind: p.kind as BazarPhotoKind, path: p.storage_path, url: publicPhotoUrl(p.storage_path) }))

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link href={`/bazar/${l.id}`} className="text-sm font-bold text-forest">← Zpět na inzerát</Link>
      <PageTitle sub={listingTitle(l)}>Upravit inzerát</PageTitle>
      {editable ? (
        <>
          <ListingForm
            userId={user.id}
            categories={categories ?? []}
            edit={{
              id: l.id,
              brand: l.brand,
              model: l.model,
              size_eu: l.size_eu,
              inner_length_mm: l.inner_length_mm,
              inner_width_mm: l.inner_width_mm,
              width: l.width,
              category: l.category,
              condition: l.condition,
              price_czk: l.price_czk,
              description: l.description,
              photos,
            }}
          />
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-display text-lg font-bold">Smazat inzerát</h2>
            <p className="text-sm text-muted">Inzerát i fotky zmizí natrvalo. Pokud ho chcete jen dočasně schovat, použijte na inzerátu „Stáhnout z nabídky“.</p>
            <DeleteListingForm listingId={l.id} />
          </Card>
        </>
      ) : (
        <Card className="p-5 text-[15px]">Rezervovaný nebo prodaný inzerát už upravit ani smazat nejde.</Card>
      )}
    </div>
  )
}
