export type FormState = { error?: string; success?: string; values?: Record<string, string> } | undefined

/** Chyba + vyplněné hodnoty (bez hesla), aby formulář po chybě nezůstal prázdný. */
export function fail(formData: FormData, error: string): FormState {
  const values: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string' && k !== 'password' && !k.startsWith('$')) values[k] = v
  })
  return { error, values }
}

export function str(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

/** Celé číslo z formuláře; prázdné → null, nesmysl → NaN. */
export function int(formData: FormData, key: string) {
  const v = str(formData, key).replace(',', '.')
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : NaN
}

export function num(formData: FormData, key: string) {
  const v = str(formData, key).replace(',', '.')
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime())
}

/** Přeloží chyby ze Supabase do češtiny. */
export function authErrorCs(error: { code?: string; message: string }) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Nesprávný e-mail nebo heslo.'
    case 'email_not_confirmed':
      return 'E-mail zatím není potvrzený. Klikněte na odkaz, který jsme vám poslali.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Účet s tímto e-mailem už existuje. Zkuste se přihlásit.'
    case 'weak_password':
      return 'Heslo je příliš slabé. Použijte alespoň 8 znaků.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.'
    case 'otp_disabled':
    case 'user_not_found':
      return 'Účet s tímto e-mailem jsme nenašli.'
    case 'same_password':
      return 'Nové heslo musí být jiné než současné.'
    default:
      return 'Něco se nepovedlo. Zkuste to prosím znovu.'
  }
}

export function dbErrorCs() {
  return 'Uložení se nepovedlo. Zkontrolujte údaje a zkuste to znovu.'
}
