import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { PHOTO_BUCKET } from './photos'

type Client = SupabaseClient<Database>

export type ChildItem = {
  id: string
  name: string
  birth_date: string
  index: number
  avatar_path: string | null
  photoUrl: string | null
}
export type LastMeasurement = {
  measured_at: string
  foot_length_mm: number | null
  foot_width_mm: number | null
  growth_mm: number | null
}

/** Děti, ke kterým má přihlášený rodič přístup (RLS), v pořadí založení. */
export async function getChildren(supabase: Client): Promise<ChildItem[]> {
  const { data } = await supabase
    .from('children')
    .select('id, name, birth_date, avatar_path')
    .order('created_at', { ascending: true })
  const rows = data ?? []
  const urls = await signedUrls(
    supabase,
    rows.map((c) => c.avatar_path),
  )
  return rows.map((c, index) => ({
    ...c,
    index,
    photoUrl: c.avatar_path ? (urls.get(c.avatar_path) ?? null) : null,
  }))
}

/** Dočasné odkazy (1 hodina) na soukromé fotky. */
export async function signedUrls(supabase: Client, paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))]
  const map = new Map<string, string>()
  if (list.length === 0) return map
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, 60 * 60)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}

/** Poslední měření každého dítěte. */
export async function getLastMeasurements(supabase: Client) {
  const { data } = await supabase
    .from('child_growth')
    .select('child_id, measured_at, foot_length_mm, foot_width_mm, growth_mm')
    .order('measured_at', { ascending: false })
  const map = new Map<string, LastMeasurement>()
  for (const row of data ?? []) {
    if (row.child_id && row.measured_at && !map.has(row.child_id)) {
      map.set(row.child_id, {
        measured_at: row.measured_at,
        foot_length_mm: row.foot_length_mm,
        foot_width_mm: row.foot_width_mm,
        growth_mm: row.growth_mm,
      })
    }
  }
  return map
}

export async function getShoeCategories(supabase: Client) {
  const { data } = await supabase
    .from('shoe_categories')
    .select('code, name, eshop_url, sort_order')
    .order('sort_order', { ascending: true })
  return data ?? []
}

/** Nožky měřit zhruba každé 3 měsíce. */
export const REMEASURE_AFTER_DAYS = 90
