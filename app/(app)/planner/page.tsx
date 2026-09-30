import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/common/states'
import { PlannerView } from '@/components/planner/planner-view'

export const metadata: Metadata = { title: 'Planner' }

export default function PlannerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PlannerView />
    </Suspense>
  )
}
