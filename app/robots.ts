import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

/** Vyhledávače smí jen na veřejné stránky; soukromé části aplikace (děti, měření, boty, účet) ne. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/prehled',
          '/deti',
          '/mereni',
          '/boty',
          '/profil',
          '/auth',
          '/overeni',
          '/nove-heslo',
          '/zapomenute-heslo',
          '/bazar/moje',
          '/bazar/objednavka',
          '/bazar/admin',
          '/bazar/prodat',
          '/bazar/profil',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
