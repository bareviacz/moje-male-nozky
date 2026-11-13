import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BuyForm } from '@/components/bazar/BuyForm'
import { coverPhoto } from '@/components/bazar/ListingCard'
import { SellerForm } from '@/components/bazar/SellerForm'
import { Card, PageTitle } from '@/components/ui'
import { formatCzk, formatEu, listingTitle, publicPhotoUrl } from '@/lib/bazar'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Koupit', robots: { index: false } }

export default async function BuyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=/bazar/${id}/koupit`)

  const [{ data: l }, { data: me }, { data: profile }] = await Promise.all([
    supabase
      .from('bazar_listings')
      .select('id, brand, model, size_eu, inner_length_mm, price_czk, status, seller_id, bazar_listing_photos(storage_path, kind, position)')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('bazar_sellers').select('nickname').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
  ])
  if (!l) notFound()
  if (l.status !== 'aktivni' || l.seller_id === user.id) redirect(`/bazar/${id}`)

  const cover = coverPhoto(l.bazar_listing_photos ?? [])

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link href={`/bazar/${id}`} className="self-start text-sm font-bold text-forest">← Zpět na inzerát</Link>
      <PageTitle>Rezervovat boty</PageTitle>
      <Card className="flex items-center gap-3.5">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicPhotoUrl(cover.storage_path)} alt="" className="size-16 rounded-xl object-cover ring-1 ring-line" />
        )}
        <div className="flex flex-col">
          <span className="font-bold">{listingTitle(l)}</span>
          <span className="text-sm text-muted tabular-nums">
            EU {formatEu(l.size_eu)} · stélka {l.inner_length_mm} mm · {formatCzk(l.price_czk)}
          </span>
        </div>
      </Card>

      {me ? (
        <BuyForm listingId={l.id} price={l.price_czk} defaultName={profile?.display_name ?? ''} defaultEmail={user.email ?? ''} />
      ) : (
        <Card className="flex flex-col gap-4 p-5">
          <p className="text-[15px] leading-relaxed">
            Než poprvé nakoupíte, nastavte si přezdívku. Pod ní vás uvidí prodejce a vaše jméno z Moje malé nožky zůstane soukromé.
          </p>
          <SellerForm back={`/bazar/${id}/koupit`} needAccount={false} />
        </Card>
      )}
    </div>
  )
}
