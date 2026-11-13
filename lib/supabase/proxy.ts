import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

/** Stránky jen pro přihlášené. */
const PROTECTED = ['/prehled', '/deti', '/mereni', '/boty', '/profil']
/** Stránky jen pro nepřihlášené (přihlášeného pošleme na přehled). */
const GUEST_ONLY = ['/prihlaseni', '/registrace']
/** Stránky, které na bazar.barevia.cz zůstávají společné s aplikací (přihlášení, odkazy z e-mailů). */
const SHARED = ['/prihlaseni', '/registrace', '/zapomenute-heslo', '/nove-heslo', '/auth', '/prehled', '/deti', '/mereni', '/boty', '/profil']

/** Na adrese bazar.barevia.cz se úvod a ostatní cesty mapují do /bazar. */
function bazarRewrite(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl
  if (!host.startsWith('bazar.')) return null
  if (pathname === '/bazar' || pathname.startsWith('/bazar/') || matches(pathname, SHARED)) return null
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? '/bazar' : `/bazar${pathname}`
  return url
}

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Obnoví přihlášení (cookies) při každém požadavku a hlídá přístup ke stránkám.
 * Skutečnou ochranu dat zajišťují pravidla RLS v databázi.
 */
export async function updateSession(request: NextRequest) {
  const rewriteTo = bazarRewrite(request)
  const next = () => (rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request }))
  let response = next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = next()
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Nic mezi createServerClient a getUser – jinak se může přihlášení náhodně ztrácet.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && matches(pathname, PROTECTED)) {
    const url = request.nextUrl.clone()
    url.pathname = '/prihlaseni'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (user && !rewriteTo && (pathname === '/' || matches(pathname, GUEST_ONLY))) {
    const url = request.nextUrl.clone()
    const back = request.nextUrl.searchParams.get('next') ?? ''
    url.pathname = /^\/bazar(\/[\w\-/]*)?$/.test(back) ? back : '/prehled'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
