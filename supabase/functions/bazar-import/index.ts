// Přesun bot z e-shopu barevia.cz do bazárku za Barevii.
// Volá se z databáze (pg_net) s tajemstvím z Vaultu; fotky stáhne z CDN Shoptetu do bucketu bazar-photos.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CDN = 'https://cdn.myshoptet.com/usr/www.barevia.cz/'
const KINDS = ['celek', 'podrazka', 'stelka', 'detail']

type Body = {
  secret: string
  listing: {
    brand: string
    model: string
    size_eu: number
    inner_length_mm: number
    inner_width_mm?: number | null
    width: 'uzka' | 'normalni' | 'siroka'
    category: string
    condition: string
    price_czk: number
    description?: string | null
  }
  photos: { url: string; kind: string }[]
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  let body: Body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad json' }, 400)
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const { data: ok } = await db.rpc('bazar_import_secret_ok', { p_secret: body.secret ?? '' })
  if (!ok) return json({ error: 'unauthorized' }, 401)

  const photos = body.photos ?? []
  if (!photos.length || photos.some((p) => !p.url.startsWith(CDN) || !KINDS.includes(p.kind)))
    return json({ error: 'photos must be from the Barevia Shoptet CDN with a valid kind' }, 400)
  if (!photos.some((p) => p.kind === 'podrazka')) return json({ error: 'missing podrazka photo' }, 400)

  const { data: seller } = await db.from('bazar_sellers').select('user_id').eq('is_barevia', true).single()
  if (!seller) return json({ error: 'Barevia seller not found' }, 500)

  const l = body.listing
  const id = crypto.randomUUID()
  const title = [l.brand, l.model].filter(Boolean).join(' ').slice(0, 90)
  const { error: insErr } = await db.from('bazar_listings').insert({
    id,
    seller_id: seller.user_id,
    title,
    brand: l.brand,
    model: l.model,
    size_eu: l.size_eu,
    inner_length_mm: l.inner_length_mm,
    inner_width_mm: l.inner_width_mm ?? null,
    width: l.width,
    category: l.category,
    condition: l.condition,
    price_czk: l.price_czk,
    description: l.description ?? null,
    status: 'koncept',
  })
  if (insErr) return json({ error: insErr.message }, 400)

  const rows = []
  for (const [position, p] of photos.entries()) {
    const res = await fetch(p.url)
    if (!res.ok) return json({ error: `download failed ${res.status}: ${p.url}`, listing_id: id }, 502)
    const bytes = new Uint8Array(await res.arrayBuffer())
    const path = `${seller.user_id}/${id}/${p.kind}-${crypto.randomUUID()}.jpg`
    const { error: upErr } = await db.storage.from('bazar-photos').upload(path, bytes, { contentType: 'image/jpeg' })
    if (upErr) return json({ error: upErr.message, listing_id: id }, 500)
    rows.push({ listing_id: id, storage_path: path, kind: p.kind, position })
  }
  const { error: phErr } = await db.from('bazar_listing_photos').insert(rows)
  if (phErr) return json({ error: phErr.message, listing_id: id }, 500)

  const { error: pubErr } = await db.from('bazar_listings').update({ status: 'aktivni' }).eq('id', id)
  if (pubErr) return json({ error: pubErr.message, listing_id: id }, 500)

  return json({ ok: true, listing_id: id, photos: rows.length })
})
