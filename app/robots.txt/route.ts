import { currentOrigin } from '@/lib/seo'

// robots.txt podle domény – bazar je veřejný katalog, aplikace Malé nožky je hlavně za přihlášením
export async function GET() {
  const { origin, isBazar } = await currentOrigin()
  const disallow = isBazar
    ? ['/moje', '/profil', '/objednavka/', '/prodat', '/admin', '/prodejce/', '/*/koupit', '/*/upravit', '/prihlaseni', '/registrace', '/overeni', '/auth/']
    : ['/prehled', '/deti/', '/mereni/', '/boty', '/profil', '/overeni', '/auth/', '/bazar/']
  const body = ['User-agent: *', 'Allow: /', ...disallow.map((p) => `Disallow: ${p}`), '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
