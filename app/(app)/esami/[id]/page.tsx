import { ExamDetail } from '@/components/exams/exam-detail'

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExamDetail id={id} />
}
