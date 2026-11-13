import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Povolí jen přesměrování v rámci aplikace. */
function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/prehled'
}

/**
 * Sem vedou odkazy z e-mailů (potvrzení registrace, přihlašovací odkaz, nové heslo).
 * Podporuje token_hash (doporučené šablony e-mailů) i code (výchozí šablony Supabase).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  // Odkaz už použitý (často ho předem „otevře“ antivir pošty, např. Seznam) nebo otevřený v jiném prohlížeči.
  // E-mail bývá i tak potvrzený, takže uživatele pošleme na přihlášení heslem a zachováme, kam chtěl jít.
  const login = new URL('/prihlaseni', origin)
  login.searchParams.set('chyba', 'odkaz')
  if (next.startsWith('/bazar')) login.searchParams.set('next', next)
  return NextResponse.redirect(login)
}
