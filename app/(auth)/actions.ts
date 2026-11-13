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

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name.slice(0, 100) },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=/prehled`,
    },
  })
  if (error) return fail(formData, authErrorCs(error))

  // Když je potvrzování e-mailu vypnuté, je uživatel rovnou přihlášený.
  if (data.session) redirect('/prehled')

  return { success: `Hotovo! Na ${email} jsme poslali odkaz pro potvrzení účtu.` }
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

  return { success: `Pokud účet existuje, poslali jsme na ${email} přihlašovací odkaz.` }
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email')
  if (!EMAIL_RE.test(email)) return fail(formData, 'Zadejte platný e-mail.')

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/nove-heslo`,
  })
  if (error) return fail(formData, authErrorCs(error))

  return { success: `Pokud účet existuje, poslali jsme na ${email} odkaz pro nastavení nového hesla.` }
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
