'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  BAZAR_BUCKET,
  isCondition,
  isOrderStatus,
  isPhotoKind,
  isWidth,
  normalizeAccount,
  type BazarCondition,
  type BazarListingStatus,
  type BazarPhotoKind,
  type BazarWidth,
} from '@/lib/bazar'
import { dbErrorCs, fail, int, isUuid, num, str, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Přihlášený uživatel; nepřihlášeného pošle na přihlášení a pak zpět. */
async function requireBazarUser(back: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/prihlaseni?next=${encodeURIComponent(back)}`)
  return { supabase, user }
}

/* ---------- Profil prodejce ---------- */

export async function saveSeller(_: FormState, formData: FormData): Promise<FormState> {
  const nickname = str(formData, 'nickname')
  const city = str(formData, 'city') || null
  const accountRaw = str(formData, 'bank_account')
  const account = accountRaw ? normalizeAccount(accountRaw) : null
  const needAccount = formData.get('need_account') === '1'
  const phone = str(formData, 'phone') || null
  const back = str(formData, 'back') || '/bazar/prodat'

  if (nickname.length < 2 || nickname.length > 40) return fail(formData, 'Přezdívka musí mít 2–40 znaků.')
  if (city && city.length > 60) return fail(formData, 'Město může mít nejvýš 60 znaků.')
  if ((needAccount || accountRaw) && !account)
    return fail(formData, 'Zadejte číslo účtu ve tvaru 123456789/0800 nebo IBAN.')
  if (phone && phone.length > 20) return fail(formData, 'Telefon je moc dlouhý.')

  const { supabase, user } = await requireBazarUser(back)
  const { data: existing } = await supabase.from('bazar_sellers').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!existing && formData.get('terms') !== 'on') return fail(formData, 'Pro vstup do Bazárku je potřeba souhlas s podmínkami.')
  const { error } = existing
    ? await supabase.from('bazar_sellers').update({ nickname, city }).eq('user_id', user.id)
    : await supabase.from('bazar_sellers').insert({ user_id: user.id, nickname, city, terms_accepted_at: new Date().toISOString() })
  if (error) return fail(formData, dbErrorCs())

  if (account) {
    const { error: privErr } = await supabase
      .from('bazar_seller_private')
      .upsert({ user_id: user.id, bank_account: account, phone, updated_at: new Date().toISOString() })
    if (privErr) return fail(formData, dbErrorCs())
  }

  revalidatePath('/bazar', 'layout')
  redirect(back.startsWith('/bazar') ? back : '/bazar/prodat')
}

/* ---------- Inzeráty ---------- */

const PHOTO_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[a-z]+-[0-9a-f-]{36}\.jpg$/

/**
 * Uloží nový inzerát. Fotky už jsou nahrané v prohlížeči (bazar-photos),
 * sem přijdou jen jejich cesty jako „druh:cesta“.
 */
type ListingInput = {
  listingId: string
  brand: string
  model: string | null
  sizeEu: number
  innerLength: number
  innerWidth: number | null
  width: string
  category: string
  condition: string
  price: number
  description: string | null
  photos: { kind: string; path: string }[]
}

/** Společná kontrola formuláře pro nový i upravovaný inzerát. */
function parseListing(formData: FormData): ListingInput | string {
  const listingId = str(formData, 'listing_id')
  const brand = str(formData, 'brand')
  const model = str(formData, 'model') || null
  const sizeEu = num(formData, 'size_eu')
  const innerLength = int(formData, 'inner_length_mm')
  const innerWidth = int(formData, 'inner_width_mm')
  const width = str(formData, 'width')
  const category = str(formData, 'category')
  const condition = str(formData, 'condition')
  const price = int(formData, 'price_czk')
  const description = str(formData, 'description') || null
  const photos = formData
    .getAll('photo')
    .map(String)
    .map((v) => {
      const i = v.indexOf(':')
      return { kind: v.slice(0, i), path: v.slice(i + 1) }
    })

  if (!isUuid(listingId)) return dbErrorCs()
  if (!brand || brand.length > 40) return 'Vyplňte značku.'
  if (!model || model.length < 3) return 'Vyplňte název bot, třeba „Zimní sněhule s liškou“ nebo model.'
  if (model.length > 60) return 'Název může mít nejvýš 60 znaků.'
  if (sizeEu === null || Number.isNaN(sizeEu) || sizeEu < 15 || sizeEu > 42) return 'EU velikost musí být mezi 15 a 42.'
  if (innerLength === null || Number.isNaN(innerLength) || innerLength < 90 || innerLength > 300)
    return 'Vnitřní délka musí být mezi 90 a 300 mm.'
  if (innerWidth !== null && (Number.isNaN(innerWidth) || innerWidth < 30 || innerWidth > 120))
    return 'Vnitřní šířka musí být mezi 30 a 120 mm.'
  if (!isWidth(width)) return 'Vyberte šířku.'
  if (!/^[a-z_]{2,40}$/.test(category)) return 'Vyberte druh obuvi.'
  if (!isCondition(condition)) return 'Vyberte stav.'
  if (price === null || Number.isNaN(price) || price < 1 || price > 20000) return 'Cena musí být mezi 1 a 20 000 Kč.'
  if (description && description.length > 2000) return 'Popis může mít nejvýš 2000 znaků.'
  if (!photos.some((p) => p.kind === 'celek')) return 'Přidejte fotku celé boty z boku.'
  if (!photos.some((p) => p.kind === 'podrazka')) return 'Přidejte fotku podrážky.'
  return {
    listingId, brand, model, sizeEu: Math.round(sizeEu * 2) / 2, innerLength, innerWidth, width, category,
    condition, price, description, photos,
  }
}

function listingColumns(d: ListingInput) {
  return {
    title: [d.brand, d.model].filter(Boolean).join(' ').slice(0, 90).padEnd(3, ' '),
    brand: d.brand,
    model: d.model,
    size_eu: d.sizeEu,
    inner_length_mm: d.innerLength,
    inner_width_mm: d.innerWidth,
    width: d.width as BazarWidth,
    category: d.category,
    condition: d.condition as BazarCondition,
    price_czk: d.price,
    description: d.description,
  }
}

function badPhotos(d: ListingInput, userId: string) {
  const prefix = `${userId}/${d.listingId}/`
  return d.photos.some((p) => !isPhotoKind(p.kind) || !p.path.startsWith(prefix) || !PHOTO_PATH_RE.test(p.path))
}

/**
 * Uloží nový inzerát. Fotky už jsou nahrané v prohlížeči (bazar-photos),
 * sem přijdou jen jejich cesty jako „druh:cesta“.
 */
export async function createListing(_: FormState, formData: FormData): Promise<FormState> {
  const d = parseListing(formData)
  if (typeof d === 'string') return fail(formData, d)
  if (formData.get('terms') !== 'on') return fail(formData, 'Potvrďte prosím, že inzerát odpovídá skutečnosti a souhlasíte s podmínkami.')
  const sourceShoe = str(formData, 'source_shoe_id') || null
  if (sourceShoe && !isUuid(sourceShoe)) return fail(formData, dbErrorCs())

  const { supabase, user } = await requireBazarUser('/bazar/prodat')
  if (badPhotos(d, user.id)) return fail(formData, 'Fotky se nepodařilo uložit. Zkuste je přidat znovu.')

  const { error } = await supabase.from('bazar_listings').insert({
    id: d.listingId,
    seller_id: user.id,
    source_shoe_id: sourceShoe,
    ...listingColumns(d),
    status: 'koncept',
  })
  if (error) {
    if (error.message.includes('evidence')) return fail(formData, 'Tyhle boty z evidence prodat nemůžete.')
    if (error.code === '23505') return fail(formData, 'Tyhle boty z evidence už v bazaru máte.')
    return fail(formData, dbErrorCs())
  }

  const { error: photoErr } = await supabase.from('bazar_listing_photos').insert(
    d.photos.map((p, position) => ({
      listing_id: d.listingId,
      storage_path: p.path,
      kind: p.kind as BazarPhotoKind,
      position,
    })),
  )
  if (photoErr) return fail(formData, dbErrorCs())

  const { error: pubErr } = await supabase.from('bazar_listings').update({ status: 'aktivni' }).eq('id', d.listingId)
  if (pubErr) return fail(formData, 'Inzerát je uložený jako koncept, ale nepodařilo se ho zveřejnit.')

  revalidatePath('/bazar', 'layout')
  redirect(`/bazar/${d.listingId}?nove=1`)
}

/** Úprava vlastního inzerátu (jen dokud není rezervovaný nebo prodaný). */
export async function updateListing(_: FormState, formData: FormData): Promise<FormState> {
  const d = parseListing(formData)
  if (typeof d === 'string') return fail(formData, d)

  const { supabase, user } = await requireBazarUser(`/bazar/${d.listingId}/upravit`)
  if (badPhotos(d, user.id)) return fail(formData, 'Fotky se nepodařilo uložit. Zkuste je přidat znovu.')

  const { data: listing } = await supabase
    .from('bazar_listings')
    .select('status, seller_id, bazar_listing_photos(storage_path)')
    .eq('id', d.listingId)
    .maybeSingle()
  if (!listing || listing.seller_id !== user.id) return fail(formData, 'Inzerát se nenašel.')
  if (!['aktivni', 'skryto', 'koncept'].includes(listing.status))
    return fail(formData, 'Rezervovaný nebo prodaný inzerát už upravit nejde.')

  const { error } = await supabase.from('bazar_listings').update(listingColumns(d)).eq('id', d.listingId)
  if (error) return fail(formData, dbErrorCs())

  // Fotky: smazat staré řádky a vložit aktuální sadu v novém pořadí
  const { error: delErr } = await supabase.from('bazar_listing_photos').delete().eq('listing_id', d.listingId)
  if (delErr) return fail(formData, dbErrorCs())
  const { error: photoErr } = await supabase.from('bazar_listing_photos').insert(
    d.photos.map((p, position) => ({
      listing_id: d.listingId,
      storage_path: p.path,
      kind: p.kind as BazarPhotoKind,
      position,
    })),
  )
  if (photoErr) return fail(formData, dbErrorCs())

  const keep = new Set(d.photos.map((p) => p.path))
  const removed = (listing.bazar_listing_photos ?? []).map((p) => p.storage_path).filter((p) => !keep.has(p))
  if (removed.length) await supabase.storage.from(BAZAR_BUCKET).remove(removed)

  revalidatePath('/bazar', 'layout')
  redirect(`/bazar/${d.listingId}?upraveno=1`)
}

/** Smazání vlastního inzerátu. Pokud už k němu byla objednávka, jen se stáhne z nabídky. */
export async function deleteListing(_: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, 'listing_id')
  if (!isUuid(id)) return { error: dbErrorCs() }
  const { supabase, user } = await requireBazarUser('/bazar/moje')

  const { data: listing } = await supabase
    .from('bazar_listings')
    .select('status, seller_id, bazar_listing_photos(storage_path)')
    .eq('id', id)
    .maybeSingle()
  if (!listing || listing.seller_id !== user.id) return { error: 'Inzerát se nenašel.' }
  if (!['aktivni', 'skryto', 'koncept'].includes(listing.status))
    return { error: 'Rezervovaný nebo prodaný inzerát smazat nejde.' }

  if (listing.status === 'aktivni') await supabase.from('bazar_listings').update({ status: 'skryto' }).eq('id', id)
  const { error } = await supabase.from('bazar_listings').delete().eq('id', id)
  if (error) {
    revalidatePath('/bazar', 'layout')
    return { error: 'K inzerátu už existuje objednávka, proto jsme ho jen stáhli z nabídky.' }
  }
  const paths = (listing.bazar_listing_photos ?? []).map((p) => p.storage_path)
  if (paths.length) await supabase.storage.from(BAZAR_BUCKET).remove(paths)

  revalidatePath('/bazar', 'layout')
  redirect('/bazar/moje?smazano=1')
}

/** Skrýt / znovu zveřejnit vlastní inzerát. */
export async function setListingStatus(formData: FormData) {
  const id = str(formData, 'listing_id')
  const status = str(formData, 'status') as BazarListingStatus
  if (!isUuid(id) || !['aktivni', 'skryto'].includes(status)) return
  const { supabase } = await requireBazarUser('/bazar/moje')
  await supabase.from('bazar_listings').update({ status }).eq('id', id)
  revalidatePath('/bazar', 'layout')
}

/* ---------- Nákup ---------- */

export async function createOrder(_: FormState, formData: FormData): Promise<FormState> {
  const listingId = str(formData, 'listing_id')
  let pointId = str(formData, 'pickup_point_id')
  let pointName = str(formData, 'pickup_point_name')
  const name = str(formData, 'buyer_name')
  const email = str(formData, 'buyer_email')
  const phone = str(formData, 'buyer_phone') || undefined
  const method = str(formData, 'shipping_method') === 'vlastni_stitek' ? 'vlastni_stitek' : 'postovne'

  if (!isUuid(listingId)) return fail(formData, dbErrorCs())
  // S vlastním štítkem si kupující místo doručení volí sám v aplikaci dopravce
  if (method === 'vlastni_stitek') {
    pointId = 'vlastni_stitek'
    pointName = 'Vlastní štítek kupujícího'
  }
  if (!pointName || pointName.length > 200) return fail(formData, 'Vyberte výdejní místo, Z-BOX nebo Balíkovnu.')
  if (name.length < 2 || name.length > 100) return fail(formData, 'Vyplňte jméno a příjmení.')
  if (!EMAIL_RE.test(email)) return fail(formData, 'Zadejte platný e-mail.')
  if (phone && phone.length > 20) return fail(formData, 'Telefon je moc dlouhý.')

  const { supabase } = await requireBazarUser(`/bazar/${listingId}/koupit`)
  const extras = formData
    .getAll('extra')
    .map(String)
    .filter((x) => isUuid(x) && x !== listingId)
    .slice(0, 9)
  const { data, error } = await supabase.rpc('bazar_create_order_multi', {
    p_listing_ids: [listingId, ...extras],
    p_pickup_point_id: (pointId || pointName).slice(0, 100),
    p_pickup_point_name: pointName,
    p_buyer_name: name,
    p_buyer_email: email,
    p_buyer_phone: phone,
    p_shipping_method: method,
  })
  if (error || !data) {
    const msg = error?.message ?? ''
    if (msg.includes('není k dispozici'))
      return fail(formData, extras.length ? 'Některé z vybraných bot už mezitím někdo koupil. Obnovte stránku a vyberte znovu.' : 'Boty už mezitím někdo koupil nebo je prodejce stáhl.')
    if (msg.includes('Vlastní')) return fail(formData, 'Vlastní boty si koupit nemůžete.')
    if (msg.includes('přezdívku')) return fail(formData, 'Nejdřív si nastavte přezdívku v bazaru.')
    return fail(formData, dbErrorCs())
  }

  revalidatePath('/bazar', 'layout')
  redirect(`/bazar/objednavka/${data}`)
}

export async function addToOrder(formData: FormData) {
  const orderId = str(formData, 'order_id')
  const listingId = str(formData, 'listing_id')
  if (!isUuid(orderId) || !isUuid(listingId)) return
  const { supabase } = await requireBazarUser(`/bazar/objednavka/${orderId}`)
  const { error } = await supabase.rpc('bazar_add_to_order', { p_order_id: orderId, p_listing_id: listingId })
  revalidatePath('/bazar', 'layout')
  redirect(`/bazar/objednavka/${orderId}${error ? '?pridat=chyba' : '?pridano=1'}`)
}

export async function cancelOrder(_: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, 'order_id')
  const reason = str(formData, 'reason').slice(0, 500)
  if (!isUuid(id)) return fail(formData, dbErrorCs())
  const { supabase } = await requireBazarUser(`/bazar/objednavka/${id}`)
  const { error } = await supabase.rpc('bazar_cancel_order', { p_order_id: id, p_reason: reason || undefined })
  if (error) {
    return fail(formData, error.message.includes('Odeslanou') ? 'Odeslanou objednávku už zrušit nejde. Napište prosím Barevii.' : dbErrorCs())
  }
  revalidatePath('/bazar', 'layout')
  redirect(`/bazar/objednavka/${id}`)
}

export async function markShipped(_: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, 'order_id')
  const tracking = str(formData, 'tracking').slice(0, 120)
  if (!isUuid(id)) return fail(formData, dbErrorCs())
  const { supabase } = await requireBazarUser(`/bazar/objednavka/${id}`)
  const { error } = await supabase.rpc('bazar_mark_shipped', { p_order_id: id, p_tracking: tracking || undefined })
  if (error) return fail(formData, 'Objednávku se nepodařilo označit jako odeslanou.')
  revalidatePath('/bazar', 'layout')
  return { success: 'Hotovo, kupující dostal zprávu, že boty jsou na cestě.' }
}

export async function setBuyerLabel(_: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, 'order_id')
  const code = str(formData, 'code').slice(0, 300)
  if (!isUuid(id)) return fail(formData, dbErrorCs())
  if (code.length < 3) return fail(formData, 'Vložte podací kód nebo číslo zásilky.')
  const { supabase } = await requireBazarUser(`/bazar/objednavka/${id}`)
  const { error } = await supabase.rpc('bazar_set_buyer_label', { p_order_id: id, p_code: code })
  if (error) return fail(formData, 'Kód se nepodařilo uložit.')
  revalidatePath('/bazar', 'layout')
  return { success: 'Uloženo, prodejce dostal kód.' }
}

export async function confirmReceived(formData: FormData) {
  const id = str(formData, 'order_id')
  if (!isUuid(id)) return
  const { supabase } = await requireBazarUser(`/bazar/objednavka/${id}`)
  await supabase.rpc('bazar_confirm_received', { p_order_id: id })
  revalidatePath('/bazar', 'layout')
}

export async function sendReview(_: FormState, formData: FormData): Promise<FormState> {
  const orderId = str(formData, 'order_id')
  const rating = int(formData, 'rating')
  const comment = str(formData, 'comment') || null
  if (!isUuid(orderId)) return fail(formData, dbErrorCs())
  if (rating === null || Number.isNaN(rating) || rating < 1 || rating > 5) return fail(formData, 'Vyberte počet hvězdiček.')
  if (comment && comment.length > 500) return fail(formData, 'Komentář může mít nejvýš 500 znaků.')

  const { supabase, user } = await requireBazarUser(`/bazar/objednavka/${orderId}`)
  const { data: order } = await supabase.from('bazar_orders').select('seller_id').eq('id', orderId).maybeSingle()
  if (!order) return fail(formData, dbErrorCs())
  const { error } = await supabase
    .from('bazar_reviews')
    .insert({ order_id: orderId, reviewer_id: user.id, reviewee_id: order.seller_id, rating, comment })
  if (error) return fail(formData, error.code === '23505' ? 'Hodnocení už jste poslali.' : dbErrorCs())
  revalidatePath('/bazar', 'layout')
  return { success: 'Díky za hodnocení!' }
}

/* ---------- Zprávy a nahlášení ---------- */

export async function sendMessage(_: FormState, formData: FormData): Promise<FormState> {
  const listingId = str(formData, 'listing_id')
  const recipient = str(formData, 'recipient_id')
  const body = str(formData, 'body')
  if (!isUuid(listingId) || !isUuid(recipient)) return fail(formData, dbErrorCs())
  if (!body || body.length > 2000) return fail(formData, 'Napište zprávu (max. 2000 znaků).')

  const { supabase, user } = await requireBazarUser(`/bazar/${listingId}`)
  if (recipient === user.id) return fail(formData, 'Sami sobě psát nemůžete.')
  const { error } = await supabase.from('bazar_messages').insert({ listing_id: listingId, sender_id: user.id, recipient_id: recipient, body })
  if (error) return fail(formData, 'Zprávu se nepodařilo odeslat. Máte v bazaru nastavenou přezdívku?')
  revalidatePath('/bazar', 'layout')
  return { success: 'Zpráva odeslána.' }
}

export async function reportListing(_: FormState, formData: FormData): Promise<FormState> {
  const listingId = str(formData, 'listing_id')
  const reason = str(formData, 'reason')
  if (!isUuid(listingId)) return fail(formData, dbErrorCs())
  if (reason.length < 3 || reason.length > 1000) return fail(formData, 'Napište prosím, co je špatně.')
  const { supabase, user } = await requireBazarUser(`/bazar/${listingId}`)
  const { error } = await supabase.from('bazar_reports').insert({ listing_id: listingId, reporter_id: user.id, reason })
  if (error) return fail(formData, dbErrorCs())
  return { success: 'Děkujeme, Barevia inzerát zkontroluje.' }
}

/* ---------- Správa (Barevia) ---------- */

export async function adminUpdateOrder(formData: FormData) {
  const id = str(formData, 'order_id')
  const status = str(formData, 'status')
  const code = str(formData, 'submission_code') || null
  const barcode = str(formData, 'packeta_barcode') || null
  if (!isUuid(id) || !isOrderStatus(status)) return
  const { supabase } = await requireBazarUser('/bazar/admin')
  await supabase
    .from('bazar_orders')
    .update({ status, submission_code: code?.slice(0, 40) ?? null, packeta_barcode: barcode?.slice(0, 40) ?? null })
    .eq('id', id)
  // Zrušená objednávka vrátí inzerát do nabídky, doručená/dokončená ho označí jako prodaný
  const { data: order } = await supabase.from('bazar_orders').select('listing_id').eq('id', id).maybeSingle()
  if (order) {
    if (status === 'zruseno')
      await supabase.from('bazar_listings').update({ status: 'aktivni' }).eq('id', order.listing_id).eq('status', 'rezervovano')
    if (status === 'dokonceno') await supabase.from('bazar_listings').update({ status: 'prodano' }).eq('id', order.listing_id)
  }
  revalidatePath('/bazar', 'layout')
}

export async function adminResolveReport(formData: FormData) {
  const id = str(formData, 'report_id')
  const hide = formData.get('hide') === '1'
  const listingId = str(formData, 'listing_id')
  if (!isUuid(id)) return
  const { supabase } = await requireBazarUser('/bazar/admin')
  await supabase.from('bazar_reports').update({ resolved: true }).eq('id', id)
  if (hide && isUuid(listingId)) await supabase.from('bazar_listings').update({ status: 'skryto' }).eq('id', listingId)
  revalidatePath('/bazar', 'layout')
}
