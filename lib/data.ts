import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Client = SupabaseClient<Database>

export type ChildItem = { id: string; name: string; birth_date: string; index: number }
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
    .select('id, name, birth_date')
    .order('created_at', { ascending: true })
  return (data ?? []).map((c, index) => ({ ...c, index }))
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
