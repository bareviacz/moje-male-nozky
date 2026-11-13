import { Logo } from '@/components/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-4 pb-8 md:pt-12">
      {children}
      <div className="mt-auto flex justify-center pt-6 opacity-80">
        <Logo height={28} href="/" />
      </div>
    </main>
  )
}
