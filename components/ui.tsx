import Link from 'next/link'
import { BackIcon } from './icons'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const btn = {
  primary:
    'inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-forest px-5 text-base font-bold text-white transition hover:bg-forest-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun disabled:opacity-60',
  secondary:
    'inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-field bg-white px-5 text-base font-bold text-ink transition hover:border-ink/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun',
  small:
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-forest px-4 text-sm font-bold text-white transition hover:bg-forest-dark',
  ghost:
    'inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-forest hover:bg-forest-soft',
}

export const inputClass =
  'h-[52px] w-full rounded-[14px] border-[1.5px] border-field bg-white px-4 text-base text-ink placeholder:text-muted/70 focus:border-forest focus:outline-none focus:ring-3 focus:ring-forest/15'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx('rounded-[20px] border border-line bg-white p-4', className)}>{children}</div>
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-semibold text-coral-ink">
        {error}
      </p>
    )
  if (success)
    return (
      <p role="status" className="rounded-2xl bg-forest-soft px-4 py-3 text-sm font-semibold text-forest">
        {success}
      </p>
    )
  return null
}

export function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[#E6E0D6] bg-white text-ink transition hover:border-field"
    >
      {children}
    </Link>
  )
}

export function BackLink({ href, label = 'Zpět' }: { href: string; label?: string }) {
  return (
    <IconLink href={href} label={label}>
      <BackIcon className="size-5" strokeWidth={2} />
    </IconLink>
  )
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="font-display text-[28px] leading-tight font-bold">{children}</h1>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )
}

/** Obsah stránky v aplikaci – na mobilu úzký, na počítači širší. */
export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cx('mx-auto flex w-full flex-col gap-5 px-5 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12', wide ? 'max-w-5xl' : 'max-w-xl')}>
      {children}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[20px] border border-dashed border-field bg-white/60 p-5">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      {action}
    </div>
  )
}
