import type { Metadata } from 'next'
import { ExamsView } from '@/components/exams/exams-view'

export const metadata: Metadata = { title: 'I miei esami' }

export default function ExamsPage() {
  return <ExamsView />
}
