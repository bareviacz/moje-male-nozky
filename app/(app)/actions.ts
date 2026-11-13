'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dbErrorCs, fail, int, isIsoDate, isUuid, num, str, type FormState } from '@/lib/forms'
import { todayIso } from '@/lib/format'
import { requireUser } from '@/lib/supabase/server'

const inRange = (v: number | null, min: number, max: number) => v === null || (!Number.isNaN(v) && v >= min && v <= max)

/* ---------- Děti ---------- */

export async function createChild(_: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, 'name')
  const birthDate = str(formData, 'birth_date')
  const sexRaw = str(formData, 'sex')
  const sex = sexRaw === 'girl' || sexRaw === 'boy' ? sexRaw : null

  if (!name || name.length > 100) return fail(formData, 'Vyplňte jméno dítěte.')
  if (!isIsoDate(birthDate) || birthDate < '2000-01-01' || birthDate > todayIso())
    return fail(formData, 'Zadejte platné datum narození.')

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('children')
    .insert({ name, birth_date: birthDate, sex, created_by: user.id })
    .select('id')
    .single()
  if (error || !data) return fail(formData, dbErrorCs())

  revalidatePath('/', 'layout')
  redirect(`/deti/${data.id}`)
}

/* ---------- Měření ---------- */

export async function createMeasurement(_: FormState, formData: FormData): Promise<FormState> {
  const childId = str(formData, 'child_id')
  const measuredAt = str(formData, 'measured_at')
  const leftLength = int(formData, 'left_length_mm')
  const rightLength = int(formData, 'right_length_mm')
  const leftWidth = int(formData, 'left_width_mm')
  const rightWidth = int(formData, 'right_width_mm')
  const methodRaw = str(formData, 'method')
  const method = ['home', 'store', 'template', 'other'].includes(methodRaw) ? methodRaw : null

  if (!isUuid(childId)) return fail(formData, 'Vyberte dítě.')
  if (!isIsoDate(measuredAt) || measuredAt > todayIso()) return fail(formData, 'Zadejte platné datum měření.')
  if (leftLength === null && rightLength === null) return fail(formData, 'Vyplňte délku alespoň jedné nožky.')
  if (!inRange(leftLength, 50, 350) || !inRange(rightLength, 50, 350))
    return fail(formData, 'Délka nožky musí být mezi 50 a 350 mm.')
  if (!inRange(leftWidth, 20, 150) || !inRange(rightWidth, 20, 150))
    return fail(formData, 'Šířka nožky musí být mezi 20 a 150 mm.')

  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('foot_measurements').insert({
    child_id: childId,
    measured_at: measuredAt,
    left_length_mm: leftLength,
    right_length_mm: rightLength,
    left_width_mm: leftWidth,
    right_width_mm: rightWidth,
    method,
    created_by: user.id,
  })
  if (error) return fail(formData, dbErrorCs())

  revalidatePath('/', 'layout')
  redirect(`/deti/${childId}`)
}

/* ---------- Boty ---------- */

export async function createShoe(_: FormState, formData: FormData): Promise<FormState> {
  const childId = str(formData, 'child_id')
  const category = str(formData, 'category') || null
  const brand = str(formData, 'brand') || null
  const model = str(formData, 'model') || null
  const euSize = num(formData, 'eu_size')
  const innerLength = int(formData, 'inner_length_mm')
  const innerWidth = int(formData, 'inner_width_mm')
  const purchasedAt = str(formData, 'purchased_at') || null

  if (!isUuid(childId)) return fail(formData, 'Vyberte dítě.')
  if (category && !/^[a-z_]{2,40}$/.test(category)) return fail(formData, 'Vyberte druh obuvi.')
  if (euSize !== null && (Number.isNaN(euSize) || euSize < 15 || euSize > 45))
    return fail(formData, 'EU velikost musí být mezi 15 a 45.')
  if (!inRange(innerLength, 60, 380)) return fail(formData, 'Vnitřní délka musí být mezi 60 a 380 mm.')
  if (!inRange(innerWidth, 20, 160)) return fail(formData, 'Vnitřní šířka musí být mezi 20 a 160 mm.')
  if (purchasedAt && (!isIsoDate(purchasedAt) || purchasedAt > todayIso()))
    return fail(formData, 'Zadejte platné datum nákupu.')

  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('shoes').insert({
    child_id: childId,
    category,
    brand: brand?.slice(0, 100) ?? null,
    model: model?.slice(0, 200) ?? null,
    eu_size: euSize === null ? null : Math.round(euSize * 2) / 2,
    inner_length_mm: innerLength,
    inner_width_mm: innerWidth,
    purchased_at: purchasedAt,
    created_by: user.id,
  })
  if (error) return fail(formData, dbErrorCs())

  revalidatePath('/', 'layout')
  redirect(`/boty?dite=${childId}`)
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
