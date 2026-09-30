import { Suspense } from 'react'
import { Workspace } from '@/components/study/workspace'
export default async function Page({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params
  return (
    <Suspense>
      <Workspace id={documentId} />
    </Suspense>
  )
}
