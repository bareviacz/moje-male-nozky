import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Nunito_Sans } from 'next/font/google'
import './globals.css'

const nunito = Nunito_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-nunito',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  weight: ['600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Moje malé nožky – Barevia',
    template: '%s · Moje malé nožky',
  },
  description:
    'Zapisujte délku dětských chodidel, sledujte růst a včas poznejte, kdy jsou boty malé.',
  applicationName: 'Moje malé nožky',
  appleWebApp: { capable: true, title: 'Malé nožky', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#FBF8F3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${nunito.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh bg-ground font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
