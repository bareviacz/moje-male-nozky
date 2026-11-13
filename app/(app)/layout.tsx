import { BottomNav, SideNav } from '@/components/navigation'
import { requireUser } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <div className="min-h-dvh md:flex">
      <SideNav />
      <main className="min-w-0 flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
