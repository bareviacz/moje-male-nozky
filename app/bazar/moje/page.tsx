import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { coverPhoto } from '@/components/bazar/ListingCard'
import { MessageForm } from '@/components/bazar/SmallForms'
import { btn, Card, cx, EmptyState, PageTitle } from '@/components/ui'
import {
  formatCzk,
  formatEu,
  LISTING_STATUS_LABEL,
  listingTitle,
  ORDER_STATUS_LABEL,
  publicPhotoUrl,
  type BazarOrderStatus,
} from '@/lib/bazar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Moje prodeje a nákupy', robots: { index: false } }

const TODO_SELLER: BazarOrderStatus[] = ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani']
const TODO_BUYER: BazarOrderStatus[] = ['ceka_na_postovne', 'postovne_zaplaceno', 'k_odeslani']

function Thumb({ path }: { path?: string }) {
  return path ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={publicPhotoUrl(path)} alt="" className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-line" />
  ) : (
    <span className="size-16 shrink-0 rounded-xl bg-ground ring-1 ring-line" />
  )
}

export default async function MinePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni?next=/bazar/moje')

  const [{ data: me }, { data: sales }, { data: buys }, { data: mine }, { count: unread }] = await Promise.all([
    supabase.from('bazar_sellers').select('nickname, is_admin').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('bazar_orders')
      .select('id, status, pickup_point_name, buyer_name, created_at, bazar_listings(id, brand, model, size_eu, price_czk, bazar_listing_photos(storage_path, kind, position))')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bazar_orders')
      .select('id, status, pickup_point_name, created_at, bazar_listings(id, brand, model, size_eu, price_czk, bazar_listing_photos(storage_path, kind, position))')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bazar_listings')
      .select('id, brand, model, size_eu, price_czk, status, bazar_listing_photos(storage_path, kind, position)')
      .eq('seller_id', user.id)
      .in('status', ['aktivni', 'skryto', 'koncept'])
      .order('created_at', { ascending: false }),
    supabase.from('bazar_messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
  ])

  // Zprávy: konverzace podle inzerátu a druhé strany
  const { data: msgs } = await supabase
    .from('bazar_messages')
    .select('id, body, sender_id, recipient_id, created_at, read_at, listing_id, bazar_listings(id, brand, model)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(200)
  type Thread = { key: string; listingId: string; title: string; otherId: string; items: NonNullable<typeof msgs> ; unread: boolean }
  const threads = new Map<string, Thread>()
  for (const m of msgs ?? []) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
    const key = `${m.listing_id}:${otherId}`
    let t = threads.get(key)
    if (!t) {
      t = { key, listingId: m.listing_id, title: m.bazar_listings ? listingTitle(m.bazar_listings) : 'Boty', otherId, items: [], unread: false }
      threads.set(key, t)
    }
    if (t.items.length < 6) t.items.push(m)
    if (m.recipient_id === user.id && !m.read_at) t.unread = true
  }
  const otherIds = [...new Set([...threads.values()].map((t) => t.otherId))]
  const { data: others } = otherIds.length
    ? await supabase.from('bazar_sellers').select('user_id, nickname').in('user_id', otherIds)
    : { data: [] as { user_id: string; nickname: string }[] }
  const nick = new Map((others ?? []).map((o) => [o.user_id, o.nickname]))
  if (unread) {
    await supabase.from('bazar_messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', user.id).is('read_at', null)
  }

  const orderRow = (
    o: { id: string; status: BazarOrderStatus; pickup_point_name: string; buyer_name?: string; bazar_listings: { brand: string; model: string | null; size_eu: number; price_czk: number; bazar_listing_photos: { storage_path: string; kind: 'celek' | 'podrazka' | 'stelka' | 'detail'; position: number }[] } | null },
    todo: boolean,
    who: string,
  ) => {
    const l = o.bazar_listings
    return (
      <Link key={o.id} href={`/bazar/objednavka/${o.id}`} className={cx('flex items-center gap-3.5 rounded-[20px] bg-white p-3.5', todo ? 'border-[1.5px] border-sun' : 'border border-line')}>
        <Thumb path={l ? coverPhoto(l.bazar_listing_photos ?? [])?.storage_path : undefined} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-bold">{l ? listingTitle(l) : 'Boty'}</span>
          <span className="text-[13px] text-muted tabular-nums">
            {l && `EU ${formatEu(l.size_eu)} · ${formatCzk(l.price_czk)} · `}
            {who}
          </span>
          <span className={cx('self-start rounded-[10px] px-2 py-0.5 text-xs font-bold', todo ? 'bg-sun text-sun-deep' : 'bg-ground ring-1 ring-line')}>
            {todo ? (who.startsWith('pro ') ? 'Pošlete boty' : 'Zaplaťte prodejci') : ORDER_STATUS_LABEL[o.status]}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <PageTitle sub={me ? `V bazaru vystupujete jako ${me.nickname}.` : undefined}>Moje prodeje a nákupy</PageTitle>
        {me?.is_admin && <Link href="/bazar/admin" className={btn.ghost}>Správa</Link>}
      </div>

      {!!unread && (
        <a href="#zpravy" className="rounded-2xl bg-sky-soft px-4 py-3 text-sm font-semibold text-sky-ink">
          Máte {unread} {unread === 1 ? 'novou zprávu' : unread < 5 ? 'nové zprávy' : 'nových zpráv'} ↓
        </a>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="prodavam">
        <h2 id="prodavam" className="font-display text-xl font-bold">Prodávám</h2>
        {(sales ?? []).map((o) => orderRow(o, TODO_SELLER.includes(o.status), `pro ${o.buyer_name}`))}
        {(mine ?? []).map((l) => (
          <Link key={l.id} href={`/bazar/${l.id}`} className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-3.5">
            <Thumb path={coverPhoto(l.bazar_listing_photos ?? [])?.storage_path} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-bold">{listingTitle(l)}</span>
              <span className="text-[13px] text-muted tabular-nums">EU {formatEu(l.size_eu)} · {formatCzk(l.price_czk)}</span>
              <span className={cx('self-start rounded-[10px] px-2 py-0.5 text-xs font-bold', l.status === 'aktivni' ? 'bg-forest-soft text-forest' : 'bg-ground ring-1 ring-line')}>
                {LISTING_STATUS_LABEL[l.status]}
              </span>
            </div>
          </Link>
        ))}
        {!sales?.length && !mine?.length && (
          <EmptyState title="Zatím nic neprodáváte" text="Boty, ze kterých dítě vyrostlo, vystavíte za pár minut." action={<Link href="/bazar/prodat" className={btn.small}>Prodat boty</Link>} />
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="kupuji">
        <h2 id="kupuji" className="font-display text-xl font-bold">Kupuji</h2>
        {(buys ?? []).map((o) => orderRow(o, TODO_BUYER.includes(o.status), o.pickup_point_name))}
        {!buys?.length && (
          <Card>
            <p className="text-sm text-muted">
              Zatím nic. <Link href="/bazar" className="font-bold text-forest">Projděte nabídku</Link>, třeba podle délky nožky.
            </p>
          </Card>
        )}
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="zpravy" aria-labelledby="zpravy-h">
        <h2 id="zpravy-h" className="font-display text-xl font-bold">Zprávy</h2>
        {threads.size === 0 && (
          <Card>
            <p className="text-sm text-muted">Zatím žádné zprávy. Na dotazy k vašim inzerátům odpovíte tady.</p>
          </Card>
        )}
        {[...threads.values()].map((t) => (
          <Card key={t.key} className={cx('flex flex-col gap-3 p-4', t.unread && 'border-[1.5px] border-sky')}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/bazar/${t.listingId}`} className="font-bold text-forest">{t.title}</Link>
              <span className="text-sm text-muted">s {nick.get(t.otherId) ?? 'uživatelem'}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {[...t.items].reverse().map((m) => (
                <li
                  key={m.id}
                  className={cx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] whitespace-pre-line',
                    m.sender_id === user.id ? 'self-end bg-forest-soft' : 'self-start bg-ground ring-1 ring-line',
                  )}
                >
                  {m.body}
                </li>
              ))}
            </ul>
            <MessageForm listingId={t.listingId} recipientId={t.otherId} label="Odpovědět" />
          </Card>
        ))}
      </section>
    </div>
  )
}
