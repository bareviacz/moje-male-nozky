import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/** Klient pro komponenty běžící v prohlížeči ('use client'). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
