import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

/** Stránky jen pro přihlášené. */
const PROTECTED = ['/prehled', '/deti', '/mereni', '/boty', '/profil']
/** Stránky jen pro nepřihlášené (přihlášeného pošleme na přehled). */
const GUEST_ONLY = ['/prihlaseni', '/registrace']

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Obnoví přihlášení (cookies) při každém požadavku a hlídá přístup ke stránkám.
 * Skutečnou ochranu dat zajišťují pravidla RLS v databázi.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

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
          response = NextResponse.next({ request })
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

  if (user && (pathname === '/' || matches(pathname, GUEST_ONLY))) {
    const url = request.nextUrl.clone()
    url.pathname = '/prehled'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
