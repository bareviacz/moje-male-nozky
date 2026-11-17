import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { currentOrigin } from '@/lib/seo'


const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

// Mapa webu pro Google a Seznam – na bazaru i všechny aktivní inzeráty
export async function GET() {
  const { origin, isBazar } = await currentOrigin()
  const urls: { loc: string; lastmod?: string; priority: string }[] = []

  if (isBazar) {
    urls.push({ loc: `${origin}/`, priority: '1.0' })
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    })
    const { data } = await supabase
      .from('bazar_listings')
      .select('id, created_at')
      .in('status', ['aktivni', 'rezervovano'])
      .order('created_at', { ascending: false })
      .limit(5000)
    for (const l of data ?? []) urls.push({ loc: `${origin}/${l.id}`, lastmod: l.created_at?.slice(0, 10), priority: '0.7' })
  } else {
    urls.push({ loc: `${origin}/`, priority: '1.0' }, { loc: `${origin}/registrace`, priority: '0.5' }, { loc: `${origin}/prihlaseni`, priority: '0.3' })
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`)
      .join('\n') +
    '\n</urlset>\n'
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
