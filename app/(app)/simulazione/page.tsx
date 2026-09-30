import { Suspense } from 'react'
import { ExamSimulation } from '@/components/study/exam-simulation'
import { LoadingState } from '@/components/common/states'

export default function SimulationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ExamSimulation />
    </Suspense>
  )
}
