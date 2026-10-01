'use client'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpen, CalendarDays, Clock3, Layers, Sparkles, CheckCircle2 } from 'lucide-react'
import { PageContainer } from '../layout/app-shell'
import { ErrorState, LoadingState } from '../common/states'
import { useDocuments, useExams, useSessions, useStudyLogs } from '@/lib/hooks'
import { studyHref } from '@/lib/routes'
import { formatDuration, formatDay } from '@/lib/date'
import { useCurrentDate } from '@/lib/use-current-date'
import { StudyPackageImport } from './study-package-import'
import { StudyPackagePromptCard } from './study-package-prompt-card'
import { MaterialPagesDialog } from './material-pages-dialog'
import { compareMaterials } from '@/lib/materials'
import type { StudyDocument } from '@/lib/types'

export function StudyView() {
  const [pageDocument, setPageDocument] = useState<StudyDocument | null>(null)
  const [selectedExam, setSelectedExam] = useState('all')
  const docs = useDocuments()
  const exams = useExams()
  const logs = useStudyLogs()
  const sessions = useSessions()
  const date = useCurrentDate()
  if (docs.error || exams.error || logs.error || sessions.error)
    return (
      <PageContainer>
        <ErrorState
          onRetry={() => {
            void docs.mutate()
            void exams.mutate()
            void logs.mutate()
            void sessions.mutate()
          }}
        />
      </PageContainer>
    )
  if (!docs.data || !exams.data || !logs.data || !sessions.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  const visibleExams = exams.data.filter((e) => selectedExam === 'all' || e.id === selectedExam)
  const visibleDocs = docs.data.filter((d) => visibleExams.some((e) => e.id === d.examId))
  const planned = sessions.data
    .filter(
      (s) =>
        visibleExams.some((e) => e.id === s.examId) &&
        s.date >= date &&
        ['planned', 'partial', 'rescheduled'].includes(s.status) &&
        visibleDocs.some((d) => d.id === s.materialId),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        compareMaterials(
          visibleDocs.find((d) => d.id === a.materialId)!,
          visibleDocs.find((d) => d.id === b.materialId)!,
        ) ||
        (a.slideFrom ?? 0) - (b.slideFrom ?? 0),
    )
  const next = planned[0]
  const resumeDoc =
    visibleDocs
      .filter((d) => d.pagesRead < d.studyablePages)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || compareMaterials(a, b))[0] ?? visibleDocs[0]
  const activeDoc = visibleDocs.find((d) => d.id === next?.materialId) ?? resumeDoc
  const activeExam = visibleExams.find((e) => e.id === activeDoc?.examId)
  const pagesDone = visibleDocs.reduce((sum, d) => sum + d.pagesRead, 0)
  const pagesTotal = visibleDocs.reduce((sum, d) => sum + d.studyablePages, 0)
  const recentLogs = logs.data.filter((l) => visibleDocs.some((d) => d.id === l.documentId)).slice(0, 4)
  return (
    <PageContainer wide>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
              Il tuo spazio di studio
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Un passo alla volta. Verso l’esame.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Il piano ti guida. Tu concentrati sulla prossima pagina.
            </p>
          </div>
          <Button component={Link} href="/planner" variant="outlined" startIcon={<CalendarDays size={17} />}>
            Il mio piano
          </Button>
        </header>
        {exams.data.length > 1 && (
          <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
            Sto preparando
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="max-w-full rounded-xl border border-border bg-card px-4 py-3"
            >
              <option value="all">Tutti gli esami</option>
              {exams.data.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
          <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full border-[32px] border-primary/5"
            />
            <div className="relative space-y-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <span className="size-2 rounded-full bg-primary" />
                {next
                  ? next.date === date
                    ? 'La tua sessione di oggi'
                    : `Prossima sessione · ${formatDay(next.date)}`
                  : 'Ritrova il tuo ritmo'}
              </p>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  {activeExam?.name ?? 'Il prossimo passo inizia qui'}
                </p>
                <h2 className="max-w-xl break-words text-2xl font-semibold tracking-tight md:text-3xl">
                  {activeDoc?.name ?? 'Porta qui le tue dispense'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {next && (
                  <>
                    <span className="flex items-center gap-2 rounded-full border border-primary/15 bg-background/40 px-3 py-2">
                      <BookOpen size={15} />
                      Pagine PDF {next.slideFrom}–{next.slideTo}
                    </span>
                    <span className="flex items-center gap-2 rounded-full border border-primary/15 bg-background/40 px-3 py-2">
                      <Clock3 size={15} />
                      {formatDuration(next.durationMin)}
                    </span>
                  </>
                )}
                {!next && activeDoc && (
                  <span className="text-muted-foreground">
                    Riprendi dalla pagina PDF {activeDoc.lastPage}. Anche una piccola sessione conta.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  component={Link}
                  href={activeDoc ? studyHref(activeDoc.id, next, activeDoc.lastPage) : '/esami/nuovo'}
                  variant="contained"
                  size="large"
                  startIcon={<BookOpen size={18} />}
                  endIcon={<ArrowRight size={17} />}
                >
                  {activeDoc
                    ? next?.date === date
                      ? 'Inizia la sessione'
                      : 'Continua a studiare'
                    : 'Crea il primo esame'}
                </Button>
                {activeExam && (
                  <Link
                    className="px-2 py-2 text-sm text-muted-foreground hover:text-primary"
                    href={`/esami/${activeExam.id}`}
                  >
                    Vai all’esame →
                  </Link>
                )}
              </div>
            </div>
          </section>
          <section className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 md:p-7">
            <div>
              <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 size={20} />
              </span>
              <h2 className="font-semibold">Ogni pagina è un progresso</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {pagesDone
                  ? 'Stai costruendo la tua preparazione, una sessione alla volta.'
                  : 'Non serve fare tutto oggi. Parti dalla prima sessione e costruisci il tuo ritmo.'}
              </p>
            </div>
            <div>
              <p className="mb-3 flex items-baseline gap-2">
                <strong className="text-3xl font-semibold">{pagesDone}</strong>
                <span className="text-sm text-muted-foreground">/ {pagesTotal} pagine studiate</span>
              </p>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (100 * pagesDone) / Math.max(1, pagesTotal))}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {visibleDocs.length} dispense · copertine e indici esclusi dal conteggio
              </p>
            </div>
          </section>
        </div>
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Le tue dispense</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nell’ordine del tuo piano. Ogni PDF ha le sue pagine e i suoi progressi.
              </p>
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers size={15} />
              {visibleDocs.length} documenti
            </span>
          </div>
          {visibleExams.map((exam) => {
            const materials = visibleDocs.filter((d) => d.examId === exam.id).sort(compareMaterials)
            return materials.length ? (
              <div key={exam.id} className="space-y-3">
                {visibleExams.length > 1 && (
                  <Link href={`/esami/${exam.id}`} className="text-sm font-medium text-primary">
                    {exam.name} →
                  </Link>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {materials.map((d, index) => (
                    <article
                      key={d.id}
                      className="group rounded-3xl border border-border bg-card p-5 transition-colors hover:border-primary/40 md:p-6"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                          <span className="grid size-8 place-items-center rounded-lg bg-primary/10">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          Dispensa {index + 1}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {Math.round((100 * d.pagesRead) / Math.max(1, d.studyablePages))}% completato
                        </span>
                      </div>
                      <Link href={studyHref(d.id, null, d.lastPage)} className="block">
                        <h3 className="break-words text-lg font-semibold group-hover:text-primary">
                          {d.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">{exam.name}</p>
                      </Link>
                      <div className="my-5">
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (100 * d.pagesRead) / Math.max(1, d.studyablePages))}
                        />
                        <p className="mt-3 text-sm text-muted-foreground">
                          {d.pagesRead} di {d.studyablePages} pagine studiate <span className="mx-1">·</span>{' '}
                          Riprendi da pag. {d.lastPage}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.pages} pagine nel PDF · {d.pages - d.studyablePages} fuori dal piano
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                        <Button
                          component={Link}
                          href={studyHref(d.id, null, d.lastPage)}
                          variant="outlined"
                          endIcon={<ArrowRight size={15} />}
                        >
                          Apri dispensa
                        </Button>
                        <button
                          onClick={() => setPageDocument(d)}
                          className="px-2 py-2 text-xs font-medium text-muted-foreground hover:text-primary"
                        >
                          Scegli le pagine
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null
          })}
          {!visibleDocs.length && (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <BookOpen className="mx-auto mb-3 text-primary" />
              <p className="text-muted-foreground">
                Aggiungi i PDF a un esame per ritrovarli qui, pronti da studiare.
              </p>
              <Button component={Link} href="/esami/nuovo" className="mt-3">
                Aggiungi materiale
              </Button>
            </div>
          )}
        </section>
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex gap-4 border-b border-border p-5 md:p-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={21} />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Studia con il tuo assistente</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Trasforma le dispense in spiegazioni, quiz e flashcard da usare direttamente nel lettore.
              </p>
            </div>
          </div>
          <div className="p-5 md:p-7">
            <StudyPackagePromptCard />
          </div>
          <div className="border-t border-border">
            <StudyPackageImport
              exams={visibleExams.filter((e) => sessions.data!.some((s) => s.examId === e.id))}
            />
          </div>
        </section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Metti alla prova quello che sai</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dopo la lettura, consolida i concetti con una verifica o un ripasso veloce.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                component={Link}
                href={activeExam ? `/quiz?exam=${activeExam.id}` : '/quiz'}
                variant="outlined"
              >
                Inizia un quiz
              </Button>
              <Button
                component={Link}
                href={activeExam ? `/flashcard?exam=${activeExam.id}` : '/flashcard'}
                variant="outlined"
              >
                Ripassa con le flashcard
              </Button>
            </div>
          </section>
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Il tuo percorso recente</h2>
            {recentLogs.length ? (
              <ul className="mt-3 divide-y divide-border">
                {recentLogs.map((l) => (
                  <li key={l.id} className="py-3">
                    <Link
                      className="text-sm font-medium hover:text-primary"
                      href={studyHref(l.documentId, null, l.toPage)}
                    >
                      {l.label}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDay(l.date)} · pagine PDF {l.fromPage}–{l.toPage} · {formatDuration(l.minutes)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                La tua prima sessione apparirà qui. Apri una dispensa, avvia il timer e comincia: terremo il
                filo per te.
              </p>
            )}
          </section>
        </div>
      </div>
      <MaterialPagesDialog document={pageDocument} onClose={() => setPageDocument(null)} />
    </PageContainer>
  )
}
