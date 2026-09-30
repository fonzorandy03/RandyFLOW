import { Suspense } from 'react'
import { PracticeView } from '@/components/study/practice-view'
export default function Page() {
  return (
    <Suspense>
      <PracticeView kind="quiz" />
    </Suspense>
  )
}
