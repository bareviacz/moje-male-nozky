import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { formatDate } from '@/lib/format'

type Client = SupabaseClient<Database>

export type ReviewItem = { id: string; rating: number; comment: string | null; created_at: string; reviewer: string }

/** Hodnocení prodejce, nejnovější první, s přezdívkou hodnotícího. */
export async function getSellerReviews(supabase: Client, sellerId: string, limit = 50): Promise<ReviewItem[]> {
  const { data } = await supabase
    .from('bazar_reviews')
    .select('id, rating, comment, created_at, reviewer_id')
    .eq('reviewee_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  const rows = data ?? []
  const ids = [...new Set(rows.map((r) => r.reviewer_id))]
  const { data: nicks } = ids.length
    ? await supabase.from('bazar_sellers').select('user_id, nickname').in('user_id', ids)
    : { data: [] as { user_id: string; nickname: string }[] }
  const nick = new Map((nicks ?? []).map((n) => [n.user_id, n.nickname]))
  return rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at, reviewer: nick.get(r.reviewer_id) ?? 'Kupující' }))
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-wide" aria-label={`${rating} z 5`}>
      <span className="text-sun">{'★'.repeat(rating)}</span>
      <span className="text-field">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export function ReviewList({ reviews, empty }: { reviews: ReviewItem[]; empty: string }) {
  if (!reviews.length) return <p className="text-sm text-muted">{empty}</p>
  return (
    <ul className="flex flex-col divide-y divide-line">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <Stars rating={r.rating} />
            <span className="font-bold">{r.reviewer}</span>
            <span className="text-muted">· {formatDate(r.created_at.slice(0, 10))}</span>
          </div>
          {r.comment && <p className="text-[15px] leading-relaxed whitespace-pre-line">{r.comment}</p>}
        </li>
      ))}
    </ul>
  )
}
