'use client'

import Button from '@mui/material/Button'
import { CalendarCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/app-shell'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/common/states'
import { PlanAdjustmentNotice } from '@/components/plan/plan-adjustment-notice'
import { planApi } from '@/lib/api/services'
import { TODAY, formatWeekdayLong } from '@/lib/date'
import { keys, useAdjustments, useExams, useMastery, useStudent, useToday } from '@/lib/hooks'
import { mutate } from 'swr'
import { DailyGoal } from './daily-goal'
import { ExamProgress } from './exam-progress'
import { UpcomingGoals } from './upcoming-goals'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

export function TodayView() {
  const { data, error, isLoading, mutate: reload } = useToday()
  const { data: student } = useStudent()
  const { data: mastery } = useMastery(data?.exam.id)
  const { data: adjustments } = useAdjustments()
  const { data: exams } = useExams()

  if (error) {
    return (
      <PageContainer>
        <ErrorState onRetry={() => reload()} />
      </PageContainer>
    )
  }
  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    )
  }

  const toggle = async (taskId: string) => {
    if (!data.session) return
    const sessionId = data.session.id
    await mutate(
      keys.today,
      async () => {
        await planApi.toggleTask(sessionId, taskId)
        return planApi.today()
      },
      {
        optimisticData: {
          ...data,
          session: {
            ...data.session,
            tasks: data.session.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          },
        },
        rollbackOnError: true,
        revalidate: false,
      },
    )
  }

  const otherAdjustments = (adjustments ?? []).filter((a) => a.examId !== data.exam.id && a.kind === 'behind')
  const examName = (id: string) => exams?.find((e) => e.id === id)?.name

  return (
    <PageContainer>
      <div className="flex flex-col gap-8 md:gap-10">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-medium capitalize text-muted-foreground">{formatWeekdayLong(TODAY)}</p>
          <h1
            suppressHydrationWarning
            className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]"
          >
            {greeting()}
            {student ? `, ${student.firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.session
              ? `Oggi hai una sessione di ${data.exam.shortName}. Mancano ${data.daysLeft} giorni all'esame.`
              : 'Oggi non hai sessioni in programma.'}
          </p>
        </header>

        {data.adjustment && <PlanAdjustmentNotice adjustment={data.adjustment} />}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="flex flex-col gap-10">
            {data.session && data.session.slideFrom !== undefined ? (
              <DailyGoal
                exam={data.exam}
                session={data.session}
                document={data.document}
                onToggleTask={toggle}
              />
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="Giornata libera"
                description="Non ci sono sessioni pianificate per oggi. Puoi ripassare con le flashcard o goderti la pausa."
                action={
                  <Button component={Link} href={`/flashcard?exam=${data.exam.id}`} variant="outlined">
                    Ripassa con le flashcard
                  </Button>
                }
              />
            )}

            {otherAdjustments.map((a) => (
              <PlanAdjustmentNotice key={a.id} adjustment={a} examName={examName(a.examId)} />
            ))}

            {data.upcoming.length > 0 && <UpcomingGoals sessions={data.upcoming} />}
          </div>

          <div className="flex flex-col gap-8">
            <ExamProgress
              exam={data.exam}
              progress={data.progress}
              daysLeft={data.daysLeft}
              forecastDaysEarly={data.forecastDaysEarly}
              mastery={mastery}
            />
            <Link
              href="/esami/nuovo"
              className="flex items-center gap-2 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-4" aria-hidden />
              Aggiungi un esame
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
