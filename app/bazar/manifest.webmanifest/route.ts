/** Samostatná instalovatelná aplikace Bazárek Barevia (bazar.barevia.cz). */
export function GET() {
  const manifest = {
    id: 'https://bazar.barevia.cz/',
    name: 'Bazárek Barevia',
    short_name: 'Bazárek',
    description: 'Bazarové dětské barefoot botičky – nákup i prodej podle délky nožky.',
    start_url: 'https://bazar.barevia.cz/',
    scope: 'https://bazar.barevia.cz/',
    display: 'standalone',
    background_color: '#FBF8F3',
    theme_color: '#FBF8F3',
    lang: 'cs',
    icons: [
      { src: '/bazar-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/bazar-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/bazar-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}
