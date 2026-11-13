import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Moje malé nožky – Barevia',
    short_name: 'Malé nožky',
    description: 'Měření dětských chodidel, růstové grafy a hlídání velikosti bot.',
    start_url: '/prehled',
    display: 'standalone',
    background_color: '#FBF8F3',
    theme_color: '#FBF8F3',
    lang: 'cs',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
