import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/** Soukromé úložiště fotek. Cesta vždy začíná ID dítěte: <child_id>/<soubor>.jpg */
export const PHOTO_BUCKET = 'foot-photos'

const MAX_SIDE = 1600
const MAX_INPUT_BYTES = 25 * 1024 * 1024

/**
 * Zmenší fotku v prohlížeči na max. 1600 px a uloží jako JPEG.
 * Fotky z iPhonu převádí na JPEG už samotný telefon při výběru z galerie.
 */
export async function resizeImage(file: File, quality = 0.85): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) throw new Error('Fotka je příliš velká (max. 25 MB).')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Tento formát fotky neumíme načíst. Zkuste fotku ve formátu JPG nebo PNG.')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Fotku se nepodařilo zpracovat.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Fotku se nepodařilo zpracovat.'))),
      'image/jpeg',
      quality,
    ),
  )
}

/** Nahraje fotku do složky dítěte. Vrací cestu v úložišti. */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  childId: string,
  kind: 'avatar' | 'mereni',
  blob: Blob,
) {
  const path = `${childId}/${kind}-${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error('Fotku se nepodařilo nahrát. Zkuste to prosím znovu.')
  return path
}
