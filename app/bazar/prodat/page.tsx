import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListingForm, type ListingPrefill } from '@/components/bazar/ListingForm'
import { SellerForm } from '@/components/bazar/SellerForm'
import { Card, cx, PageTitle } from '@/components/ui'
import { formatEu } from '@/lib/bazar'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Prodat boty', robots: { index: false } }

export default async function SellPage({ searchParams }: { searchParams: Promise<{ bota?: string }> }) {
  const { bota } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=${encodeURIComponent(bota ? `/bazar/prodat?bota=${bota}` : '/bazar/prodat')}`)

  const [{ data: seller }, { data: priv }, { data: categories }] = await Promise.all([
    supabase.from('bazar_sellers').select('nickname, city').eq('user_id', user.id).maybeSingle(),
    supabase.from('bazar_seller_private').select('bank_account').eq('user_id', user.id).maybeSingle(),
    supabase.from('shoe_categories').select('code, name').order('sort_order'),
  ])

  if (!seller || !priv) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <PageTitle sub="Jednou nastavíte a pak už jen přidáváte boty.">Než začnete prodávat</PageTitle>
        <Card className="p-5">
          <SellerForm back={bota ? `/bazar/prodat?bota=${bota}` : '/bazar/prodat'} needAccount initial={seller ?? undefined} />
        </Card>
      </div>
    )
  }

  // Přerostlé (vyřazené) boty z evidence Moje malé nožky, které ještě nejsou v bazaru
  const [{ data: retired }, { data: listed }] = await Promise.all([
    supabase
      .from('shoes')
      .select('id, brand, model, eu_size, inner_length_mm, inner_width_mm, category, retired_at, children(name)')
      .not('retired_at', 'is', null)
      .order('retired_at', { ascending: false })
      .limit(20),
    supabase.from('bazar_listings').select('source_shoe_id').eq('seller_id', user.id).not('source_shoe_id', 'is', null).neq('status', 'skryto'),
  ])
  const listedIds = new Set((listed ?? []).map((x) => x.source_shoe_id))
  const offer = (retired ?? []).filter((s) => !listedIds.has(s.id))

  let prefill: ListingPrefill | undefined
  if (bota && isUuid(bota)) {
    const s = (retired ?? []).find((x) => x.id === bota)
    if (s)
      prefill = {
        source_shoe_id: s.id,
        brand: s.brand,
        model: s.model,
        size_eu: s.eu_size,
        inner_length_mm: s.inner_length_mm,
        inner_width_mm: s.inner_width_mm,
        category: s.category,
      }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageTitle sub={`Prodáváte jako ${seller.nickname}.`}>Prodat boty</PageTitle>

      {offer.length > 0 && (
        <Card className="flex flex-col gap-2.5 bg-forest-soft ring-0">
          <p className="text-sm font-bold">Z evidence Moje malé nožky: boty, ze kterých děti vyrostly</p>
          <div className="flex flex-wrap gap-1.5">
            {offer.map((s) => (
              <Link
                key={s.id}
                href={`/bazar/prodat?bota=${s.id}`}
                aria-current={prefill?.source_shoe_id === s.id ? 'true' : undefined}
                className={cx(
                  'rounded-full px-3 py-1.5 text-sm font-bold',
                  prefill?.source_shoe_id === s.id ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-forest/30',
                )}
              >
                {[s.brand, s.model].filter(Boolean).join(' ') || 'Boty'}
                {s.eu_size != null && `, EU ${formatEu(s.eu_size)}`}
                {s.children?.name && ` (${s.children.name})`}
              </Link>
            ))}
          </div>
          <span className="text-[13px] text-muted">Klepnutím se vyplní značka, velikost i vnitřní délka.</span>
        </Card>
      )}

      <ListingForm key={prefill?.source_shoe_id ?? 'nove'} userId={user.id} categories={categories ?? []} prefill={prefill} />
    </div>
  )
}
