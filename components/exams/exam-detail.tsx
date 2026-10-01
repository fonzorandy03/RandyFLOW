'use client'

import Button from '@mui/material/Button'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileText,
  Layers,
  ListChecks,
  SearchX,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/app-shell'
import { MasteryIndicator } from '@/components/common/mastery-indicator'
import { SectionTitle } from '@/components/common/page-header'
import { ProgressRing } from '@/components/common/progress-ring'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/common/states'
import { ExamStatusLabel, SessionStatusBadge } from '@/components/common/status-badge'
import { PlanSettingsDialog } from '@/components/plan/plan-settings-dialog'
import { useCurrentDate } from '@/lib/use-current-date'
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
import { useAdjustments, useDocuments, useExams, useMastery, useSessions, refreshPlanData } from '@/lib/hooks'
import { MaterialOrderControls, moveMaterial } from '../study/material-order-controls'
import { studyHref } from '@/lib/routes'
import { compareMaterials } from '@/lib/materials'
import { MaterialPagesDialog } from '../study/material-pages-dialog'
import type { StudyDocument } from '@/lib/types'
import { examsApi } from '@/lib/api/services'
import { mutate as mutateCache } from 'swr'

export function ExamDetail({ id }: { id: string }) {
  const { data: exams, error, isLoading, mutate } = useExams()
  const { data: sessions } = useSessions(id)
  const { data: documents } = useDocuments()
  const { data: mastery } = useMastery(id)
  const { data: adjustments } = useAdjustments()
  const today = useCurrentDate() || TODAY
  const [planOpen, setPlanOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [pageDocument, setPageDocument] = useState<StudyDocument | null>(null)
  const router = useRouter()
  useEffect(() => {
    if (sessions) {
      void mutateCache('documents')
      void mutateCache('exams')
    }
  }, [sessions])

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
  const docs = documents?.filter((d) => d.examId === id).sort(compareMaterials) ?? []
  const reorder = async (index: number, direction: -1 | 1) => {
    setOrdering(true)
    setOrderError('')
    try {
      await examsApi.reorderMaterials(
        id,
        moveMaterial(docs, index, direction).map((d) => d.id),
      )
      await refreshPlanData()
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : 'Ordine non aggiornato. Riprova.')
    } finally {
      setOrdering(false)
    }
  }
  const upcoming = (sessions ?? []).filter((s) => s.date >= today && s.status !== 'unavailable').slice(0, 6)
  const todaySession = sessions?.find((s) => s.date === today)
  const continueDoc = docs.find((doc) => doc.id === todaySession?.materialId) ?? docs[0]
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
          <header className="flex flex-col gap-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-center gap-5">
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
              {continueDoc && (
                <Button
                  component={Link}
                  href={studyHref(continueDoc.id, todaySession, continueDoc.lastPage)}
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
                variant="outlined"
                startIcon={<SlidersHorizontal size={16} />}
                onClick={() => setPlanOpen(true)}
              >
                Modifica piano
              </Button>
              <Button
                color="error"
                variant="outlined"
                disabled={deleting}
                startIcon={<Trash2 className="size-4" />}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Eliminare definitivamente l’esame “${exam.name}” e tutti i dati collegati?`,
                    )
                  )
                    return
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

        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Pagine studiate', `${exam.slidesCompleted} / ${exam.totalSlides}`],
            ['Ore studiate', formatDuration(exam.minutesStudied)],
            ['Disponibilità', `${formatDuration(weeklyMin)} / sett.`],
            ['Ripasso finale', `${exam.reviewDays} giorni`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tabular text-lg font-semibold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>

        <section
          className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Gestione del piano"
        >
          <div>
            <p className="font-semibold">Un imprevisto? Facciamo spazio.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Scegli i giorni in cui non puoi studiare: il piano redistribuisce le pagine ancora da
              completare.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {exam.startDate ? `Inizio: ${formatLong(exam.startDate)} · ` : ''}
              {exam.unavailableDays.length} giorni esclusi · {exam.reviewDays} giorni di ripasso
            </p>
          </div>
          <Button
            className="shrink-0"
            variant="outlined"
            onClick={() => setPlanOpen(true)}
            startIcon={<CalendarDays size={16} />}
          >
            Modifica i giorni di studio
          </Button>
        </section>

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
                      <Link
                        href={studyHref(s.materialId ?? continueDoc?.id ?? '', s)}
                        className="flex min-w-0 flex-1 flex-col hover:text-primary"
                      >
                        {s.materialName && (
                          <p className="mb-1 break-words text-sm font-semibold text-primary">
                            {s.materialName}
                          </p>
                        )}
                        <p className="truncate text-sm font-medium">
                          {s.slideFrom !== undefined
                            ? `Pagine PDF ${s.slideFrom}–${s.slideTo}`
                            : (s.topic ?? 'Ripasso')}
                        </p>
                        {s.topic && s.slideFrom !== undefined && (
                          <p className="truncate text-xs text-muted-foreground">{s.topic}</p>
                        )}
                      </Link>
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
              <p className="mb-4 text-sm text-muted-foreground">
                {docs.length} dispense · le pagine sono numerate separatamente in ogni PDF. Copertine e indici
                riconosciuti non fanno parte del piano.
              </p>
              <ul className="flex flex-col gap-3">
                {docs.map((d, index) => (
                  <li key={d.id}>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-xs text-muted-foreground">
                        {ordering ? 'Aggiornamento del piano…' : 'Ordine di studio'}
                      </span>
                      <MaterialOrderControls
                        name={d.name}
                        index={index}
                        total={docs.length}
                        disabled={ordering}
                        onMove={(direction) => void reorder(index, direction)}
                      />
                    </div>
                    <Link
                      href={studyHref(d.id, null, d.lastPage)}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="break-words text-sm font-medium">
                            <span className="mr-2 text-xs text-primary">DISPENSA {index + 1}</span>
                            {d.name}
                          </p>
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
                          {d.studyablePages} pagine da studiare su {d.pages} nel PDF ·{' '}
                          {d.pages - d.studyablePages} escluse · ultima pagina aperta: {d.lastPage}
                        </p>
                      </div>
                    </Link>
                    <button
                      className="mt-2 px-4 text-xs font-medium text-primary hover:underline"
                      onClick={() => setPageDocument(d)}
                    >
                      Controlla pagine da studiare
                    </button>
                  </li>
                ))}
              </ul>
              {orderError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {orderError}
                </p>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6 rounded-3xl border border-border bg-card/50 p-5 lg:self-start">
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
      {planOpen && <PlanSettingsDialog exam={exam} onClose={() => setPlanOpen(false)} />}
      <MaterialPagesDialog document={pageDocument} onClose={() => setPageDocument(null)} />
    </PageContainer>
  )
}
