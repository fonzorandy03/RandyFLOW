import type { Metadata } from 'next'
import { NewExamWizard } from '@/components/exams/new-exam-wizard'

export const metadata: Metadata = { title: 'Nuovo esame' }

export default function NewExamPage() {
  return <NewExamWizard />
}
