'use client'

import Button from '@mui/material/Button'
import { GraduationCap, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState, SkeletonBlock } from '@/components/common/states'
import { TODAY } from '@/lib/date'
import { useExams, useSessions } from '@/lib/hooks'
import { ExamCard } from './exam-card'

export function ExamsView() {
  const { data: exams, error, isLoading, mutate } = useExams()
  const { data: sessions } = useSessions()

  const nextSession = (examId: string) =>
    sessions?.find(
      (s) =>
        s.examId === examId && s.date >= TODAY && ['planned', 'rescheduled', 'review'].includes(s.status),
    )

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Esami"
          title="I miei esami"
          description="Tutti gli esami attivi, con il loro piano di studio."
          actions={
            <Button
              component={Link}
              href="/esami/nuovo"
              variant="contained"
              startIcon={<Plus className="size-4" />}
            >
              Nuovo esame
            </Button>
          }
        />

        {error ? (
          <ErrorState onRetry={() => mutate()} />
        ) : isLoading || !exams ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} height={228} />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nessun esame ancora"
            description="Aggiungi il tuo primo esame: carica le slide e RandyFLOW creerà il piano per te."
            action={
              <Button component={Link} href="/esami/nuovo" variant="contained">
                Crea il primo esame
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {[...exams]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((exam) => (
                <li key={exam.id}>
                  <ExamCard exam={exam} next={nextSession(exam.id)} />
                </li>
              ))}
            <li>
              <Link
                href="/esami/nuovo"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="size-5" aria-hidden />
                Aggiungi un esame
              </Link>
            </li>
          </ul>
        )}
      </div>
    </PageContainer>
  )
}
