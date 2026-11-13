'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dbErrorCs, fail, int, isIsoDate, isUuid, num, str, type FormState } from '@/lib/forms'
import { todayIso } from '@/lib/format'
import { PHOTO_BUCKET } from '@/lib/photos'
import { requireUser } from '@/lib/supabase/server'

/** Cesta k fotce v úložišti: <uuid dítěte>/<název>.jpg */
const PHOTO_PATH_RE = /^[0-9a-f-]{36}\/[a-z0-9-]+\.jpg$/

const inRange = (v: number | null, min: number, max: number) => v === null || (!Number.isNaN(v) && v >= min && v <= max)

/* ---------- Děti ---------- */

/** Založí dítě, nebo ho upraví (když formulář obsahuje child_id). */
export async function saveChild(_: FormState, formData: FormData): Promise<FormState> {
  const childId = str(formData, 'child_id')
  const name = str(formData, 'name')
  const birthDate = str(formData, 'birth_date')
  const sexRaw = str(formData, 'sex')
  const sex = sexRaw === 'girl' || sexRaw === 'boy' ? sexRaw : null

  if (!name || name.length > 100) return fail(formData, 'Vyplňte jméno dítěte.')
  if (!isIsoDate(birthDate) || birthDate < '2000-01-01' || birthDate > todayIso())
    return fail(formData, 'Zadejte platné datum narození.')

  const { supabase, user } = await requireUser()

  if (childId) {
    if (!isUuid(childId)) return fail(formData, dbErrorCs())
    const { data, error } = await supabase
      .from('children')
      .update({ name, birth_date: birthDate, sex })
      .eq('id', childId)
      .select('id')
    if (error || !data?.length) return fail(formData, 'Úpravu se nepodařilo uložit. Upravovat může jen vlastník nebo editor.')
    revalidatePath('/', 'layout')
    redirect(`/deti/${childId}`)
  }

  const { data, error } = await supabase
    .from('children')
    .insert({ name, birth_date: birthDate, sex, created_by: user.id })
    .select('id')
    .single()
  if (error || !data) return fail(formData, dbErrorCs())

  revalidatePath('/', 'layout')
  redirect(`/deti/${data.id}`)
}

/** Smaže dítě i se všemi měřeními, botami a fotkami (jen vlastník). */
export async function deleteChild(formData: FormData) {
  const childId = str(formData, 'child_id')
  if (!isUuid(childId)) return
  const { supabase } = await requireUser()

  // Fotky z úložiště (smazání řádků je neodstraní samo)
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(childId, { limit: 1000 })
  const paths = (files ?? []).map((f) => `${childId}/${f.name}`)

  const { data, error } = await supabase.from('children').delete().eq('id', childId).select('id')
  if (error || !data?.length) redirect(`/deti/${childId}/upravit?chyba=smazani`)

  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths)
  revalidatePath('/', 'layout')
  redirect('/deti')
}

/** Uloží fotku dítěte (soubor už je nahraný v úložišti). */
export async function setChildAvatar(childId: string, path: string | null): Promise<{ error?: string }> {
  if (!isUuid(childId)) return { error: 'Neplatné dítě.' }
  if (path !== null && !path.startsWith(`${childId}/`)) return { error: 'Neplatná fotka.' }

  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('children')
    .update({ avatar_path: path })
    .eq('id', childId)
    .select('id')
  if (error || !data?.length) return { error: 'Fotku se nepodařilo uložit.' }

  revalidatePath('/', 'layout')
  return {}
}

/* ---------- Měření ---------- */

/** Uloží nové měření, nebo upraví existující (když formulář obsahuje measurement_id). */
export async function saveMeasurement(_: FormState, formData: FormData): Promise<FormState> {
  const measurementId = str(formData, 'measurement_id')
  const childId = str(formData, 'child_id')
  const measuredAt = str(formData, 'measured_at')
  const leftLength = int(formData, 'left_length_mm')
  const rightLength = int(formData, 'right_length_mm')
  const leftWidth = int(formData, 'left_width_mm')
  const rightWidth = int(formData, 'right_width_mm')
  const photoPath = str(formData, 'photo_path') || null
  const removePhoto = formData.get('remove_photo') === '1'
  const methodRaw = str(formData, 'method')
  const method = ['home', 'store', 'template', 'other'].includes(methodRaw) ? methodRaw : null

  if (!isUuid(childId)) return fail(formData, 'Vyberte dítě.')
  if (!isIsoDate(measuredAt) || measuredAt > todayIso()) return fail(formData, 'Zadejte platné datum měření.')
  if (leftLength === null && rightLength === null) return fail(formData, 'Vyplňte délku alespoň jedné nožky.')
  if (!inRange(leftLength, 50, 350) || !inRange(rightLength, 50, 350))
    return fail(formData, 'Délka nožky musí být mezi 50 a 350 mm.')
  if (!inRange(leftWidth, 20, 150) || !inRange(rightWidth, 20, 150))
    return fail(formData, 'Šířka nožky musí být mezi 20 a 150 mm.')
  if (photoPath && !photoPath.startsWith(`${childId}/`)) return fail(formData, 'Fotku se nepodařilo uložit.')

  const { supabase, user } = await requireUser()
  const values = {
    measured_at: measuredAt,
    left_length_mm: leftLength,
    right_length_mm: rightLength,
    left_width_mm: leftWidth,
    right_width_mm: rightWidth,
    method,
  }

  if (measurementId) {
    if (!isUuid(measurementId)) return fail(formData, dbErrorCs())
    const { data: old } = await supabase
      .from('foot_measurements')
      .select('photo_path')
      .eq('id', measurementId)
      .maybeSingle()
    const newPhoto = photoPath ?? (removePhoto ? null : (old?.photo_path ?? null))
    const { data, error } = await supabase
      .from('foot_measurements')
      .update({ ...values, photo_path: newPhoto })
      .eq('id', measurementId)
      .select('id')
    if (error || !data?.length) return fail(formData, dbErrorCs())
    if (old?.photo_path && old.photo_path !== newPhoto) {
      await supabase.storage.from(PHOTO_BUCKET).remove([old.photo_path])
    }
  } else {
    const { error } = await supabase
      .from('foot_measurements')
      .insert({ ...values, child_id: childId, photo_path: photoPath, created_by: user.id })
    if (error) return fail(formData, dbErrorCs())
  }

  revalidatePath('/', 'layout')
  redirect(`/deti/${childId}`)
}

export async function deleteMeasurement(formData: FormData) {
  const measurementId = str(formData, 'measurement_id')
  if (!isUuid(measurementId)) return
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from('foot_measurements')
    .delete()
    .eq('id', measurementId)
    .select('child_id, photo_path')
  const row = data?.[0]
  if (row?.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([row.photo_path])
  revalidatePath('/', 'layout')
  redirect(row ? `/deti/${row.child_id}` : '/deti')
}

/* ---------- Boty ---------- */

/** Přidá boty, nebo je upraví (když formulář obsahuje shoe_id). */
export async function saveShoe(_: FormState, formData: FormData): Promise<FormState> {
  const shoeId = str(formData, 'shoe_id')
  const childId = str(formData, 'child_id')
  const category = str(formData, 'category') || null
  const brand = str(formData, 'brand') || null
  const model = str(formData, 'model') || null
  const euSize = num(formData, 'eu_size')
  const innerLength = int(formData, 'inner_length_mm')
  const innerWidth = int(formData, 'inner_width_mm')
  const purchasedAt = str(formData, 'purchased_at') || null
  const photo1 = str(formData, 'photo_1') || null
  const photo2 = str(formData, 'photo_2') || null

  if (!isUuid(childId)) return fail(formData, 'Vyberte dítě.')
  if ([photo1, photo2].some((p) => p && !PHOTO_PATH_RE.test(p))) return fail(formData, 'Fotku se nepodařilo uložit.')
  if (category && !/^[a-z_]{2,40}$/.test(category)) return fail(formData, 'Vyberte druh obuvi.')
  if (euSize !== null && (Number.isNaN(euSize) || euSize < 15 || euSize > 45))
    return fail(formData, 'EU velikost musí být mezi 15 a 45.')
  if (!inRange(innerLength, 60, 380)) return fail(formData, 'Vnitřní délka musí být mezi 60 a 380 mm.')
  if (!inRange(innerWidth, 20, 160)) return fail(formData, 'Vnitřní šířka musí být mezi 20 a 160 mm.')
  if (purchasedAt && (!isIsoDate(purchasedAt) || purchasedAt > todayIso()))
    return fail(formData, 'Zadejte platné datum nákupu.')

  const { supabase, user } = await requireUser()
  const values = {
    child_id: childId,
    category,
    brand: brand?.slice(0, 100) ?? null,
    model: model?.slice(0, 200) ?? null,
    eu_size: euSize === null ? null : Math.round(euSize * 2) / 2,
    inner_length_mm: innerLength,
    inner_width_mm: innerWidth,
    purchased_at: purchasedAt,
    photo_path: photo1 ?? photo2,
    photo_path_2: photo1 ? photo2 : null,
  }

  if (shoeId) {
    if (!isUuid(shoeId)) return fail(formData, dbErrorCs())
    const { data: old } = await supabase.from('shoes').select('photo_path, photo_path_2').eq('id', shoeId).maybeSingle()
    const { data, error } = await supabase.from('shoes').update(values).eq('id', shoeId).select('id')
    if (error || !data?.length) return fail(formData, dbErrorCs())
    const kept = new Set([values.photo_path, values.photo_path_2])
    const removed = [old?.photo_path, old?.photo_path_2].filter((p): p is string => !!p && !kept.has(p))
    if (removed.length) await supabase.storage.from(PHOTO_BUCKET).remove(removed)
  } else {
    const { error } = await supabase.from('shoes').insert({ ...values, created_by: user.id })
    if (error) return fail(formData, dbErrorCs())
  }

  revalidatePath('/', 'layout')
  redirect(`/boty?dite=${childId}`)
}

export async function deleteShoe(formData: FormData) {
  const shoeId = str(formData, 'shoe_id')
  if (!isUuid(shoeId)) return
  const { supabase } = await requireUser()
  const { data } = await supabase.from('shoes').delete().eq('id', shoeId).select('child_id, photo_path, photo_path_2')
  const row = data?.[0]
  const photos = [row?.photo_path, row?.photo_path_2].filter((p): p is string => !!p)
  if (photos.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos)
  revalidatePath('/', 'layout')
  redirect(row ? `/boty?dite=${row.child_id}` : '/boty')
}

/** Vyřadit botu (vyrostlá / zničená). */
export async function retireShoe(formData: FormData) {
  const shoeId = str(formData, 'shoe_id')
  if (!isUuid(shoeId)) return
  const { supabase } = await requireUser()
  await supabase.from('shoes').update({ retired_at: todayIso() }).eq('id', shoeId)
  revalidatePath('/', 'layout')
}

/** Vrátit vyřazenou botu mezi nošené. */
export async function restoreShoe(formData: FormData) {
  const shoeId = str(formData, 'shoe_id')
  if (!isUuid(shoeId)) return
  const { supabase } = await requireUser()
  await supabase.from('shoes').update({ retired_at: null }).eq('id', shoeId)
  revalidatePath('/', 'layout')
}

/* ---------- Profil ---------- */

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, 'display_name')
  if (!name || name.length > 100) return fail(formData, 'Vyplňte jméno (max. 100 znaků).')

  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
  if (error) return fail(formData, dbErrorCs())

  revalidatePath('/', 'layout')
  return { success: 'Uloženo.' }
}
