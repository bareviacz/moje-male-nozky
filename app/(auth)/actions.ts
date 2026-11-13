'use server'

import { redirect } from 'next/navigation'
import { SITE_URL } from '@/lib/config'
import { authErrorCs, fail, str, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Kam po přihlášení: jen do bazaru (?next=/bazar/...), jinak přehled. */
function safeNext(next: string) {
  return /^\/bazar(\/[\w\-/]*)?$/.test(next) ? next : '/prehled'
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  const password = String(formData.get('password') ?? '')
  if (!EMAIL_RE.test(email) || !password) return fail(formData, 'Vyplňte e-mail a heslo.')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error?.code === 'email_not_confirmed') {
    await supabase.auth.resend({ type: 'signup', email })
    redirect(codeUrl('registrace', email, safeNext(str(formData, 'next'))))
  }
  if (error) return fail(formData, authErrorCs(error))

  redirect(safeNext(str(formData, 'next')))
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, 'name')
  const email = str(formData, 'email')
  const password = String(formData.get('password') ?? '')

  if (!name) return fail(formData, 'Vyplňte prosím své jméno.')
  if (!EMAIL_RE.test(email)) return fail(formData, 'Zadejte platný e-mail.')
  if (password.length < 8) return fail(formData, 'Heslo musí mít alespoň 8 znaků.')
  if (formData.get('gdpr') !== 'on') return fail(formData, 'Pro registraci je potřeba souhlas se zpracováním údajů.')

  const next = safeNext(str(formData, 'next'))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name.slice(0, 100) },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) return fail(formData, authErrorCs(error))

  // Když je potvrzování e-mailu vypnuté, je uživatel rovnou přihlášený.
  if (data.session) redirect(next)

  redirect(codeUrl('registrace', email, next))
}

type CodeKind = 'registrace' | 'prihlaseni' | 'heslo'
const OTP_TYPE = { registrace: 'signup', prihlaseni: 'email', heslo: 'recovery' } as const

function codeUrl(kind: CodeKind, email: string, next?: string) {
  const q = new URLSearchParams({ typ: kind, email })
  if (next && next !== '/prehled') q.set('next', next)
  return `/overeni?${q}`
}

/** Ověření 6místného kódu z e-mailu (registrace, přihlášení bez hesla, nové heslo). */
export async function verifyCode(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  const token = str(formData, 'token').replace(/\s+/g, '')
  const kind = str(formData, 'typ') as CodeKind
  if (!EMAIL_RE.test(email) || !(kind in OTP_TYPE)) return fail(formData, 'Něco se nepovedlo. Zkuste to prosím znovu.')
  if (!/^\d{6,10}$/.test(token)) return fail(formData, 'Opište kód z e-mailu (6 číslic).')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: OTP_TYPE[kind] })
  if (error) {
    if (error.code === 'otp_expired' || /expired|invalid/i.test(error.message))
      return fail(formData, 'Kód nesedí nebo už vypršel. Zkontrolujte ho, případně si nechte poslat nový.')
    return fail(formData, authErrorCs(error))
  }

  redirect(kind === 'heslo' ? '/nove-heslo' : safeNext(str(formData, 'next')))
}

/** Poslat kód znovu. */
export async function resendCode(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  const kind = str(formData, 'typ') as CodeKind
  if (!EMAIL_RE.test(email) || !(kind in OTP_TYPE)) return fail(formData, 'Něco se nepovedlo. Zkuste to prosím znovu.')

  const supabase = await createClient()
  const { error } =
    kind === 'registrace'
      ? await supabase.auth.resend({ type: 'signup', email })
      : kind === 'prihlaseni'
        ? await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        : await supabase.auth.resetPasswordForEmail(email)
  if (error) return fail(formData, authErrorCs(error))
  return { success: `Nový kód je na cestě na ${email}.` }
}

export async function sendMagicLink(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  if (!EMAIL_RE.test(email)) return fail(formData, 'Zadejte platný e-mail.')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/auth/confirm?next=/prehled` },
  })
  if (error) return fail(formData, authErrorCs(error))

  redirect(codeUrl('prihlaseni', email, safeNext(str(formData, 'next'))))
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  if (!EMAIL_RE.test(email)) return fail(formData, 'Zadejte platný e-mail.')

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/nove-heslo`,
  })
  if (error) return fail(formData, authErrorCs(error))

  redirect(codeUrl('heslo', email))
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') ?? '')
  if (password.length < 8) return fail(formData, 'Heslo musí mít alespoň 8 znaků.')

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return fail(formData, authErrorCs(error))

  redirect('/prehled')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
