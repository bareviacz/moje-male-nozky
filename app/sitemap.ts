import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { SITE_URL } from '@/lib/config'

export const revalidate = 3600

/** Mapa veřejných stránek pro Google a Seznam: úvod, registrace, bazárek a aktivní inzeráty. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/bazar`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/registrace`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    })
    const { data } = await supabase
      .from('bazar_listings')
      .select('id, created_at')
      .eq('status', 'aktivni')
      .order('created_at', { ascending: false })
      .limit(1000)
    for (const l of data ?? []) {
      pages.push({ url: `${SITE_URL}/bazar/${l.id}`, lastModified: new Date(l.created_at), changeFrequency: 'weekly', priority: 0.6 })
    }
  } catch {
    // Bez inzerátů – mapa i tak obsahuje hlavní stránky.
  }
  return pages
}
