'use client'

import Button from '@mui/material/Button'
import { ArrowLeft, BookOpen, CalendarDays, FileText, Layers, ListChecks, SearchX, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/app-shell'
import { MasteryIndicator } from '@/components/common/mastery-indicator'
import { SectionTitle } from '@/components/common/page-header'
import { ProgressRing } from '@/components/common/progress-ring'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/common/states'
import { ExamStatusLabel, SessionStatusBadge } from '@/components/common/status-badge'
import { AvailabilityDialog } from '@/components/plan/availability-dialog'
import { PlanAdjustmentNotice } from '@/components/plan/plan-adjustment-notice'
import {
  TODAY,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  daysUntil,
  formatDay,
  formatDuration,
  formatLong,
  relativeDay,
} from '@/lib/date'
import { useAdjustments, useDocuments, useExams, useMastery, useSessions } from '@/lib/hooks'
import { studyHref } from '@/lib/routes'
import { examsApi } from '@/lib/api/services'
import { mutate as mutateCache } from 'swr'

export function ExamDetail({ id }: { id: string }) {
  const { data: exams, error, isLoading, mutate } = useExams()
  const { data: sessions } = useSessions(id)
  const { data: documents } = useDocuments()
  const { data: mastery } = useMastery(id)
  const { data: adjustments } = useAdjustments()
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  if (error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => mutate()} />
      </PageContainer>
    )
  if (isLoading || !exams)
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    )

  const exam = exams.find((e) => e.id === id)
  if (!exam)
    return (
      <PageContainer>
        <EmptyState
          icon={SearchX}
          title="Esame non trovato"
          description="Questo esame non esiste più o il link non è corretto."
          action={
            <Button component={Link} href="/esami" variant="outlined">
              Torna ai miei esami
            </Button>
          }
        />
      </PageContainer>
    )

  const pct = exam.totalSlides ? exam.slidesCompleted / exam.totalSlides : 0
  const docs = documents?.filter((d) => exam.documentIds.includes(d.id)) ?? []
  const upcoming = (sessions ?? []).filter((s) => s.date >= TODAY && s.status !== 'unavailable').slice(0, 6)
  const todaySession = sessions?.find((s) => s.date === TODAY)
  const adjustment = adjustments?.find((a) => a.examId === exam.id)
  const weak = mastery?.filter((m) => m.needsReview) ?? []
  const weeklyMin = WEEKDAY_ORDER.reduce<number>((s, d) => s + exam.availability[d], 0)

  return (
    <PageContainer>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <Link
            href="/esami"
            className="flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />I miei esami
          </Link>
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <ProgressRing value={pct} size={76} stroke={5} label={`${Math.round(pct * 100)}% completato`}>
                <span className="tabular text-base font-semibold">{Math.round(pct * 100)}%</span>
              </ProgressRing>
              <div className="flex min-w-0 flex-col gap-1">
                <ExamStatusLabel status={exam.status} />
                <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
                  {exam.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatLong(exam.date)} · <span className="tabular">{daysUntil(exam.date)} giorni</span>
                  {exam.description ? ` · ${exam.description}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {docs[0] && (
                <Button
                  component={Link}
                  href={studyHref(docs[0].id, todaySession, docs[0].lastPage)}
                  variant="contained"
                  startIcon={<BookOpen className="size-4" />}
                >
                  Continua a studiare
                </Button>
              )}
              <Button
                component={Link}
                href={`/planner?exam=${exam.id}`}
                variant="outlined"
                color="inherit"
                startIcon={<CalendarDays className="size-4" />}
              >
                Planner
              </Button>
              <Button
                color="error"
                variant="outlined"
                disabled={deleting}
                startIcon={<Trash2 className="size-4" />}
                onClick={async () => {
                  if (!window.confirm(`Eliminare definitivamente l’esame “${exam.name}” e tutti i dati collegati?`)) return
                  setDeleting(true)
                  try {
                    await examsApi.delete(exam.id)
                    await mutateCache('exams')
                    router.push('/esami')
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Eliminazione…' : 'Elimina esame'}
              </Button>
            </div>
          </header>
        </div>

        {adjustment && <PlanAdjustmentNotice adjustment={adjustment} />}

        <dl className="grid grid-cols-2 gap-6 border-y border-border py-6 md:grid-cols-4">
          {[
            ['Slide completate', `${exam.slidesCompleted} / ${exam.totalSlides}`],
            ['Ore studiate', formatDuration(exam.minutesStudied)],
            ['Disponibilità', `${formatDuration(weeklyMin)} / sett.`],
            ['Ripasso finale', `${exam.reviewDays} giorni`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tabular text-lg font-semibold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="flex flex-col gap-10">
            <section aria-labelledby="upcoming-title">
              <SectionTitle
                action={
                  <Link
                    href={`/planner?exam=${exam.id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Vedi tutto
                  </Link>
                }
              >
                <span id="upcoming-title">Prossime sessioni</span>
              </SectionTitle>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna sessione in programma.</p>
              ) : (
                <ol className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
                  {upcoming.map((s) => (
                    <li key={s.id} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="w-20 shrink-0">
                        <p className="text-sm font-medium capitalize">{relativeDay(s.date)}</p>
                        <p className="text-xs text-muted-foreground">{formatDay(s.date)}</p>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-sm font-medium">
                          {s.slideFrom !== undefined
                            ? `Slide ${s.slideFrom}–${s.slideTo}`
                            : (s.topic ?? 'Ripasso')}
                        </p>
                        {s.topic && s.slideFrom !== undefined && (
                          <p className="truncate text-xs text-muted-foreground">{s.topic}</p>
                        )}
                      </div>
                      <span className="tabular hidden text-sm text-muted-foreground sm:block">
                        {formatDuration(s.durationMin)}
                      </span>
                      <SessionStatusBadge status={s.status} />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section aria-labelledby="docs-title">
              <SectionTitle>
                <span id="docs-title">Materiale</span>
              </SectionTitle>
              <ul className="flex flex-col gap-3">
                {docs.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={studyHref(d.id, null, d.lastPage)}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <span className="tabular shrink-0 text-xs text-muted-foreground">
                            {Math.round((d.pagesRead / Math.max(1, d.studyablePages)) * 100)}%
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(d.pagesRead / Math.max(1, d.studyablePages)) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {d.pages} slide · ultima posizione: slide {d.lastPage}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="flex flex-col gap-10">
            <section aria-labelledby="mastery-title">
              <SectionTitle>
                <span id="mastery-title">Padronanza</span>
              </SectionTitle>
              {mastery && mastery.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {[...mastery]
                    .sort((a, b) => b.score - a.score)
                    .map((m) => (
                      <MasteryIndicator key={m.id} topic={m} />
                    ))}
                  {weak.map((w) => (
                    <p key={w.id} className="rounded-xl bg-warning/10 px-3.5 py-3 text-sm">
                      <span className="font-medium">Ripasso {w.name} · 15 min</span>
                      <span className="block text-xs text-muted-foreground">
                        Aggiunto alla prossima sessione · slide {w.slideFrom}–{w.slideTo}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">La padronanza comparirà dopo il primo quiz.</p>
              )}
            </section>

            <section aria-labelledby="practice-title" className="flex flex-col gap-2">
              <SectionTitle>
                <span id="practice-title">Verifica</span>
              </SectionTitle>
              <Button
                component={Link}
                href={`/quiz?exam=${exam.id}`}
                variant="outlined"
                color="inherit"
                startIcon={<ListChecks className="size-4" />}
                className="justify-start"
              >
                Inizia un quiz
              </Button>
              <Button
                component={Link}
                href={`/flashcard?exam=${exam.id}`}
                variant="outlined"
                color="inherit"
                startIcon={<Layers className="size-4" />}
                className="justify-start"
              >
                Ripassa con le flashcard
              </Button>
            </section>

            <section aria-labelledby="availability-title-side">
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={() => setAvailabilityOpen(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Modifica
                  </button>
                }
              >
                <span id="availability-title-side">Disponibilità settimanale</span>
              </SectionTitle>
              <ul className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_ORDER.map((d) => (
                  <li key={d} className="flex flex-col items-center gap-1.5">
                    <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-muted">
                      <div
                        className="w-full rounded-md bg-primary/70"
                        style={{ height: `${Math.min(100, (exam.availability[d] / 180) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{WEEKDAY_LABELS[d].slice(0, 3)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
      <AvailabilityDialog
        open={availabilityOpen}
        examId={exam.id}
        onClose={() => setAvailabilityOpen(false)}
      />
    </PageContainer>
  )
}
