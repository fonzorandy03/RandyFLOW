'use client'

import Button from '@mui/material/Button'
import { CalendarDays, CalendarRange, List, SlidersHorizontal } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/common/page-header'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { SESSION_STATUS } from '@/components/common/status-badge'
import { AvailabilityDialog } from '@/components/plan/availability-dialog'
import { PlanAdjustmentNotice } from '@/components/plan/plan-adjustment-notice'
import { diffDays, formatDay, formatWeekdayLong } from '@/lib/date'
import { useCurrentDate } from '@/lib/use-current-date'
import { compareMaterials } from '@/lib/materials'
import { materialTone } from '@/lib/planner-materials'
import { useAdjustments, useDocuments, useExams, useSessions } from '@/lib/hooks'
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
  const { data: sessions, mutate: refreshSessions, error: sessionError } = useSessions(exam?.id)
  const { data: documents } = useDocuments()
  const today = useCurrentDate()
  const { data: adjustments } = useAdjustments()
  const [view, setView] = useState<'month' | 'timeline'>('month')
  const [selection, setSelected] = useState<ISODate | null>(null)
  const selected = selection ?? today
  const [calendarReset, setCalendarReset] = useState(0)
  useEffect(() => {
    if (today) {
      void refreshSessions()
      void mutate()
    }
  }, [today, refreshSessions, mutate])
  const [availabilityOpen, setAvailabilityOpen] = useState(false)

  if (error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => mutate()} />
      </PageContainer>
    )
  if (isLoading || !exam || !today)
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    )

  const docs = documents?.filter((d) => d.examId === exam.id).sort(compareMaterials) ?? []
  const adjustment = adjustments?.find((a) => a.examId === exam.id)
  const selectedSessions = sessions?.filter((s) => s.date === selected) ?? []

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Planner"
          title="Piano di studio"
          description="Un percorso chiaro, una sessione alla volta. Scegli un giorno e apri la dispensa giusta."
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
                {e.name}
              </button>
            ))}
          </div>
          <div role="tablist" aria-label="Vista" className="flex self-start rounded-xl bg-muted p-1">
            {(
              [
                ['month', 'Mese', CalendarDays],
                ['timeline', 'Agenda', List],
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">Oggi</p>
            <p className="mt-1 font-semibold capitalize">{formatWeekdayLong(today)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Verso il tuo esame</p>
            <p className="mt-1 font-semibold">
              {Math.max(0, diffDays(exam.date, today))} giorni · {formatDay(exam.date)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Il tuo percorso</p>
            <p className="mt-1 font-semibold">
              {docs.length} dispense · {exam.slidesCompleted}/{exam.totalSlides} pagine
            </p>
          </div>
        </div>
        <section
          aria-label="Legenda delle dispense"
          className="rounded-2xl border border-border bg-card/60 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Le tue dispense</p>
            <button
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              onClick={() => {
                setSelected(null)
                setCalendarReset((n) => n + 1)
              }}
            >
              Vai a oggi
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {docs.map((doc, index) => (
              <div
                key={doc.id}
                className={`flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs ${materialTone(index)}`}
              >
                <span className="shrink-0 font-semibold">Dispensa {index + 1}</span>
                <span className="truncate" title={doc.name}>
                  {doc.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            I numeri indicano le pagine del PDF originale, contando anche copertina e indice. Le pagine
            escluse non sono assegnate allo studio. Seleziona un giorno per vedere il file e aprirlo alla
            pagina giusta.
          </p>
        </section>
        {adjustment && <PlanAdjustmentNotice adjustment={adjustment} examName={exam.name} />}

        {sessionError ? (
          <ErrorState onRetry={() => refreshSessions()} />
        ) : !sessions ? (
          <PageSkeleton />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <CalendarRange className="size-6" aria-hidden />
            Nessuna sessione pianificata per questo esame.
          </div>
        ) : view === 'month' ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <MonthCalendar
              key={`${exam.id}-${calendarReset}-${selected.slice(0, 7)}`}
              today={today}
              documents={docs}
              sessions={sessions}
              examDate={exam.date}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="flex flex-col gap-4">
              {selectedSessions.length ? (
                selectedSessions.map((session) => (
                  <DayPanel
                    key={session.id}
                    today={today}
                    documents={docs}
                    date={selected}
                    session={session}
                    exam={exam}
                  />
                ))
              ) : (
                <DayPanel today={today} documents={docs} date={selected} exam={exam} />
              )}
            </div>
          </div>
        ) : (
          <PlanTimeline today={today} sessions={sessions} />
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
