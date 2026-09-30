'use client'

import Button from '@mui/material/Button'
import { CalendarDays, CalendarRange, List, SlidersHorizontal } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/common/page-header'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { SESSION_STATUS } from '@/components/common/status-badge'
import { AvailabilityDialog } from '@/components/plan/availability-dialog'
import { PlanAdjustmentNotice } from '@/components/plan/plan-adjustment-notice'
import { TODAY } from '@/lib/date'
import { useAdjustments, useExams, useSessions } from '@/lib/hooks'
import type { ISODate, SessionStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DayPanel } from './day-panel'
import { MonthCalendar } from './month-calendar'
import { PlanTimeline } from './plan-timeline'

const LEGEND: SessionStatus[] = [
  'planned',
  'completed',
  'partial',
  'skipped',
  'rescheduled',
  'review',
  'exam',
]

export function PlannerView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { data: exams, error, isLoading, mutate } = useExams()
  const sorted = exams ? [...exams].sort((a, b) => a.date.localeCompare(b.date)) : []
  const examId = params.get('exam') ?? sorted[0]?.id
  const exam = sorted.find((e) => e.id === examId) ?? sorted[0]
  const { data: sessions } = useSessions(exam?.id)
  const { data: adjustments } = useAdjustments()
  const [view, setView] = useState<'month' | 'timeline'>('month')
  const [selected, setSelected] = useState<ISODate>(TODAY)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)

  if (error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => mutate()} />
      </PageContainer>
    )
  if (isLoading || !exam)
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    )

  const adjustment = adjustments?.find((a) => a.examId === exam.id)
  const selectedSession = sessions?.find((s) => s.date === selected)

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Planner"
          title="Piano di studio"
          description="Il piano si adatta a quello che riesci davvero a fare."
          actions={
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setAvailabilityOpen(true)}
              startIcon={<SlidersHorizontal className="size-4" />}
            >
              Disponibilità
            </Button>
          }
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Esame" className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {sorted.map((e) => (
              <button
                key={e.id}
                role="tab"
                aria-selected={e.id === exam.id}
                onClick={() => router.replace(`${pathname}?exam=${e.id}`, { scroll: false })}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  e.id === exam.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {e.shortName}
              </button>
            ))}
          </div>
          <div role="tablist" aria-label="Vista" className="flex self-start rounded-xl bg-muted p-1">
            {(
              [
                ['month', 'Mese', CalendarDays],
                ['timeline', 'Timeline', List],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  view === v
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {adjustment && <PlanAdjustmentNotice adjustment={adjustment} examName={exam.name} />}

        {!sessions ? (
          <PageSkeleton />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <CalendarRange className="size-6" aria-hidden />
            Nessuna sessione pianificata per questo esame.
          </div>
        ) : view === 'month' ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <MonthCalendar
              sessions={sessions}
              examDate={exam.date}
              selected={selected}
              onSelect={setSelected}
            />
            <DayPanel date={selected} session={selectedSession} exam={exam} />
          </div>
        ) : (
          <PlanTimeline sessions={sessions} />
        )}

        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda">
          {LEGEND.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('size-2 rounded-full', SESSION_STATUS[s].dot)} aria-hidden />
              {SESSION_STATUS[s].label}
            </li>
          ))}
        </ul>
      </div>
      <AvailabilityDialog
        open={availabilityOpen}
        examId={exam.id}
        onClose={() => setAvailabilityOpen(false)}
      />
    </PageContainer>
  )
}
