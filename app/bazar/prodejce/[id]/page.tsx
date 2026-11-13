import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ListingCard, type ListingCardData } from '@/components/bazar/ListingCard'
import { getSellerReviews, ReviewList, Stars } from '@/components/bazar/Reviews'
import { Card } from '@/components/ui'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

async function loadSeller(id: string) {
  if (!isUuid(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('bazar_sellers').select('user_id, nickname, city, is_barevia, created_at').eq('user_id', id).maybeSingle()
  return data ? { supabase, seller: data } : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const res = await loadSeller(id)
  return { title: res ? `Prodejce ${res.seller.nickname}` : 'Prodejce nenalezen' }
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await loadSeller(id)
  if (!res) notFound()
  const { supabase, seller } = res

  const [{ data: rating }, reviews, { data: listings }, { data: categories }] = await Promise.all([
    supabase.from('bazar_seller_ratings').select('avg_rating, review_count').eq('seller_id', id).maybeSingle(),
    getSellerReviews(supabase, id),
    supabase
      .from('bazar_listings')
      .select('id, brand, model, size_eu, inner_length_mm, width, category, condition, price_czk, status, bazar_listing_photos(storage_path, kind, position)')
      .eq('seller_id', id)
      .in('status', ['aktivni', 'rezervovano'])
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.from('shoe_categories').select('code, name'),
  ])
  const catName = new Map((categories ?? []).map((c) => [c.code, c.name]))
  const cards: ListingCardData[] = (listings ?? []).map((l) => ({
    id: l.id,
    brand: l.brand,
    model: l.model,
    size_eu: l.size_eu,
    inner_length_mm: l.inner_length_mm,
    width: l.width,
    condition: l.condition,
    price_czk: l.price_czk,
    status: l.status,
    categoryName: catName.get(l.category) ?? null,
    isBarevia: seller.is_barevia,
    photos: l.bazar_listing_photos ?? [],
  }))

  return (
    <div className="flex flex-col gap-5">
      <Link href="/bazar" className="self-start text-sm font-bold text-forest">← Zpět na nabídku</Link>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sun-soft font-display text-2xl font-bold">
          {seller.nickname.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-[28px] leading-tight font-bold">{seller.nickname}</h1>
          <p className="text-sm text-muted">
            {seller.is_barevia ? 'Prodává Barevia' : 'Prodává rodič'}
            {seller.city && ` · ${seller.city}`}
          </p>
          <p className="text-sm tabular-nums">
            {rating?.review_count ? (
              <>
                <Stars rating={Math.round(Number(rating.avg_rating))} />{' '}
                <strong>{String(rating.avg_rating).replace('.', ',')}</strong> z 5 · {rating.review_count} hodnocení
              </>
            ) : (
              <span className="text-muted">Zatím bez hodnocení</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1.4fr] md:items-start">
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">Hodnocení od kupujících</h2>
          <ReviewList reviews={reviews} empty="Zatím nikdo nehodnotil." />
        </Card>
        <section className="flex flex-col gap-3" aria-labelledby="nabidka-prodejce">
          <h2 id="nabidka-prodejce" className="font-display text-lg font-bold">Boty v nabídce ({cards.length})</h2>
          {cards.length ? (
            <div className="grid grid-cols-2 gap-3">
              {cards.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Teď nic nenabízí.</p>
          )}
        </section>
      </div>
    </div>
  )
}
