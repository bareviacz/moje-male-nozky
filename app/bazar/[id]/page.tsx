import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setListingStatus } from '@/app/bazar/actions'
import { coverPhoto } from '@/components/bazar/ListingCard'
import { Gallery } from '@/components/bazar/Gallery'
import { MessageForm, ReportForm } from '@/components/bazar/SmallForms'
import { SubmitButton } from '@/components/SubmitButton'
import { btn, Card, cx, FormMessage } from '@/components/ui'
import {
  BAZAR_SHIPPING_CZK,
  CONDITION_LABEL,
  fitRange,
  formatCzk,
  formatEu,
  LISTING_STATUS_LABEL,
  listingTitle,
  publicPhotoUrl,
  WIDTH_LABEL,
} from '@/lib/bazar'
import { getChildren, getLastMeasurements } from '@/lib/data'
import { isUuid } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

async function load(id: string) {
  if (!isUuid(id)) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('bazar_listings')
    .select(
      'id, brand, model, size_eu, inner_length_mm, inner_width_mm, width, category, condition, price_czk, description, status, seller_id, bazar_sellers!inner(user_id, nickname, city, is_barevia), bazar_listing_photos(storage_path, kind, position)',
    )
    .eq('id', id)
    .maybeSingle()
  return data ? { supabase, l: data } : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const res = await load(id)
  if (!res) return { title: 'Inzerát nenalezen' }
  const { l } = res
  const cover = coverPhoto(l.bazar_listing_photos ?? [])
  const title = `${listingTitle(l)}, EU ${formatEu(l.size_eu)} – ${formatCzk(l.price_czk)}`
  return {
    title,
    description: `Obnošené barefoot boty ${listingTitle(l)}, vnitřní délka ${l.inner_length_mm} mm, stav: ${CONDITION_LABEL[l.condition].toLowerCase()}.`,
    openGraph: cover ? { title, images: [publicPhotoUrl(cover.storage_path)] } : { title },
  }
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nove?: string }>
}) {
  const [{ id }, { nove }] = await Promise.all([params, searchParams])
  const res = await load(id)
  if (!res) notFound()
  const { supabase, l } = res
  const seller = l.bazar_sellers

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwn = user?.id === l.seller_id

  const [{ data: rating }, { data: category }] = await Promise.all([
    supabase.from('bazar_seller_ratings').select('avg_rating, review_count').eq('seller_id', l.seller_id).maybeSingle(),
    supabase.from('shoe_categories').select('name').eq('code', l.category).maybeSingle(),
  ])

  // Padnou mým dětem?
  const fits: { name: string; foot: number; reserve: number; ok: boolean }[] = []
  if (user && !isOwn) {
    const [children, last] = await Promise.all([getChildren(supabase), getLastMeasurements(supabase)])
    for (const c of children) {
      const foot = last.get(c.id)?.foot_length_mm
      if (!foot) continue
      const r = fitRange(foot)
      fits.push({ name: c.name, foot, reserve: l.inner_length_mm - foot, ok: l.inner_length_mm >= r.min && l.inner_length_mm <= r.max })
    }
  }

  const photos = [...(l.bazar_listing_photos ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((p) => ({ url: publicPhotoUrl(p.storage_path), kind: p.kind }))

  return (
    <div className="flex flex-col gap-4">
      <Link href="/bazar" className="self-start text-sm font-bold text-forest">← Zpět na nabídku</Link>
      {nove === '1' && <FormMessage success="Inzerát je zveřejněný. Když se boty prodají, ozveme se vám e-mailem i tady v bazaru." />}

      <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-start md:gap-7">
        <Gallery photos={photos} />

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span
                className={cx(
                  'self-start rounded-full px-2.5 py-1 text-xs font-bold',
                  seller?.is_barevia ? 'bg-forest text-white' : 'bg-ground text-ink ring-1 ring-line',
                )}
              >
                {seller?.is_barevia ? 'Prodává Barevia: zkontrolováno' : 'Prodává rodič'}
              </span>
              <h1 className="font-display text-[28px] leading-tight font-bold text-balance">{listingTitle(l)}</h1>
              <p className="font-display text-3xl font-bold tabular-nums">
                {formatCzk(l.price_czk)}{' '}
                <span className="font-sans text-sm font-semibold text-muted">+ poštovné {formatCzk(BAZAR_SHIPPING_CZK)} nebo vlastní štítek</span>
              </p>
            </div>

            {fits.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {fits.map((f) => (
                  <li key={f.name} className={cx('rounded-2xl px-3.5 py-2.5 text-sm tabular-nums', f.ok ? 'bg-forest-soft' : 'bg-sun-soft')}>
                    {f.ok ? (
                      <><strong>{f.name}</strong> ({f.foot} mm): padnou, rezerva {f.reserve} mm.</>
                    ) : (
                      <><strong>{f.name}</strong> ({f.foot} mm): rezerva {f.reserve} mm, doporučujeme 8–12 mm.</>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-[15px]">
              {[
                ['Velikost EU', formatEu(l.size_eu)],
                ['Vnitřní délka', `${l.inner_length_mm} mm`],
                ...(l.inner_width_mm ? [['Vnitřní šířka', `${l.inner_width_mm} mm`]] : []),
                ['Šířka', WIDTH_LABEL[l.width]],
                ['Druh', category?.name ?? '–'],
                ['Stav', CONDITION_LABEL[l.condition]],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-line py-2 text-muted">{k}</dt>
                  <dd className="border-b border-line py-2 font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            {l.description && <p className="leading-relaxed whitespace-pre-line">{l.description}</p>}

            {isOwn ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">Váš inzerát · {LISTING_STATUS_LABEL[l.status]}</p>
                {(l.status === 'aktivni' || l.status === 'skryto') && (
                  <form action={setListingStatus}>
                    <input type="hidden" name="listing_id" value={l.id} />
                    <input type="hidden" name="status" value={l.status === 'aktivni' ? 'skryto' : 'aktivni'} />
                    <SubmitButton variant="secondary" className="w-full" pendingText="Ukládám…">
                      {l.status === 'aktivni' ? 'Stáhnout z nabídky' : 'Znovu zveřejnit'}
                    </SubmitButton>
                  </form>
                )}
              </div>
            ) : l.status === 'aktivni' ? (
              <Link href={`/bazar/${l.id}/koupit`} className={btn.primary}>Koupit</Link>
            ) : (
              <p className="rounded-2xl bg-sun-soft px-4 py-3 text-center font-bold text-sun-deep">
                {l.status === 'rezervovano' ? 'Rezervováno pro jiného kupujícího' : 'Už prodáno'}
              </p>
            )}

            <div className="flex items-center gap-3 border-t border-line pt-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sun-soft font-bold">
                {(seller?.nickname ?? '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="flex flex-col">
                <Link href={`/bazar/prodejce/${l.seller_id}`} className="font-bold text-forest underline-offset-2 hover:underline">
                  {seller?.nickname} {seller?.city && <span className="font-normal text-muted">· {seller.city}</span>}
                </Link>
                <span className="text-sm text-muted tabular-nums">
                  {rating?.review_count ? (
                    <><span className="text-sun" aria-hidden="true">★</span> {String(rating.avg_rating).replace('.', ',')} z 5 · {rating.review_count} hodnocení</>
                  ) : (
                    'Zatím bez hodnocení'
                  )}
                  {' · '}
                  <Link href={`/bazar/prodejce/${l.seller_id}`} className="font-semibold text-forest">Profil a hodnocení</Link>
                </span>
              </div>
            </div>
          </Card>

          {!isOwn && (
            <Card className="flex flex-col gap-3 p-5">
              {user ? (
                <MessageForm listingId={l.id} recipientId={l.seller_id} />
              ) : (
                <p className="text-sm text-muted">
                  <Link href={`/prihlaseni?next=/bazar/${l.id}`} className="font-bold text-forest">Přihlaste se</Link>{' '}
                  a můžete se prodejce na cokoli zeptat.
                </p>
              )}
              {user && <ReportForm listingId={l.id} />}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
