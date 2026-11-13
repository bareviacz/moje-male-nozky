import type { Metadata } from 'next'
import { ChildForm } from '@/components/ChildForm'
import { BackLink, Page, PageTitle } from '@/components/ui'
import { todayIso } from '@/lib/format'

export const metadata: Metadata = { title: 'Přidat dítě' }

export default function NewChildPage() {
  return (
    <Page>
      <div className="flex items-center gap-3">
        <BackLink href="/deti" />
        <PageTitle>Přidat dítě</PageTitle>
      </div>
      <ChildForm today={todayIso()} />
    </Page>
  )
}
