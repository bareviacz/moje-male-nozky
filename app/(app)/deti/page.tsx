import type { Metadata } from 'next'
import Link from 'next/link'
import { ChildAvatar } from '@/components/ChildAvatar'
import { PlusIcon } from '@/components/icons'
import { btn, EmptyState, Page, PageTitle } from '@/components/ui'
import { getChildren, getLastMeasurements } from '@/lib/data'
import { formatAge, formatAgo } from '@/lib/format'
import { requireUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Děti' }

export default async function ChildrenPage() {
  const { supabase } = await requireUser()
  const [children, lastByChild] = await Promise.all([getChildren(supabase), getLastMeasurements(supabase)])

  return (
    <Page wide>
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Děti</PageTitle>
        <Link href="/deti/nove" className={btn.small}>
          <PlusIcon className="size-[18px]" strokeWidth={2.2} />
          Přidat
        </Link>
      </div>

      {children.length === 0 ? (
        <EmptyState
          title="Zatím tu nikdo není"
          text="Přidejte dítě a začněte zapisovat měření nožek."
          action={
            <Link href="/deti/nove" className={btn.small}>
              Přidat dítě
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {children.map((c) => {
            const last = lastByChild.get(c.id)
            return (
              <Link
                key={c.id}
                href={`/deti/${c.id}`}
                className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4 transition hover:border-field"
              >
                <ChildAvatar name={c.name} index={c.index} size="lg" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[17px] font-bold">{c.name}</span>
                  <span className="text-[13px] text-muted">
                    {formatAge(c.birth_date)}
                    {last ? ` · měřeno ${formatAgo(last.measured_at)}` : ' · zatím neměřeno'}
                  </span>
                </div>
                {last?.foot_length_mm != null && (
                  <div className="flex flex-col items-end">
                    <span className="font-display text-[22px] font-bold">{last.foot_length_mm}</span>
                    <span className="text-xs text-muted">mm</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </Page>
  )
}
