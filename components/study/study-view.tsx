'use client'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Link from 'next/link'
import { PageContainer } from '../layout/app-shell'
import { PageHeader } from '../common/page-header'
import { ErrorState, LoadingState } from '../common/states'
import { useDocuments, useExams, useStudyLogs, useToday } from '@/lib/hooks'
import { studyHref } from '@/lib/routes'
import { formatDuration, formatDay } from '@/lib/date'
import { StudyPackageImport } from './study-package-import'
import { StudyPackagePromptCard } from './study-package-prompt-card'

export function StudyView() {
  const docs = useDocuments()
  const exams = useExams()
  const logs = useStudyLogs()
  const today = useToday()
  if (docs.error || exams.error || logs.error)
    return (
      <PageContainer>
        <ErrorState
          onRetry={() => {
            void docs.mutate()
            void exams.mutate()
            void logs.mutate()
          }}
        />
      </PageContainer>
    )
  if (!docs.data || !exams.data || !logs.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Studio"
          title="Il tuo spazio di studio"
          description="Riprendi il filo, una pagina alla volta."
        />
        <StudyPackagePromptCard />
        <StudyPackageImport exams={exams.data} />
        {today.data && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs text-primary">ESAME CORRENTE</p>
            <h2 className="my-2 text-xl font-semibold">{today.data.exam.name}</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {today.data.session?.topic} · ultima pagina {today.data.document.lastPage}
            </p>
            <Button
              component={Link}
              href={studyHref(today.data.document.id, today.data.session, today.data.document.lastPage)}
              variant="contained"
            >
              Continua da dove avevi lasciato
            </Button>
          </section>
        )}
        <section>
          <h2 className="mb-4 font-semibold">Documenti</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {docs.data.map((d) => (
              <article key={d.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  {exams.data?.find((e) => e.id === d.examId)?.name}
                </p>
                <h3 className="font-medium">{d.name}</h3>
                <LinearProgress variant="determinate" value={(100 * d.pagesRead) / d.pages} />
                <p className="text-sm text-muted-foreground">
                  {d.pagesRead} / {d.pages} pagine · ultima posizione: {d.lastPage}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button component={Link} href={studyHref(d.id, null, d.lastPage)} variant="outlined">
                    Apri documento
                  </Button>
                  <Button component={Link} href={`/quiz?exam=${d.examId}`}>
                    Quiz
                  </Button>
                  <Button component={Link} href={`/flashcard?exam=${d.examId}`}>
                    Flashcard
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!docs.data.length && <p>Nessun documento. Aggiungi un esame per iniziare.</p>}
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Sessioni recenti</h2>
          <ul className="divide-y divide-border">
            {logs.data.map((l) => (
              <li key={l.id} className="py-4">
                <Link
                  className="text-sm font-medium hover:text-primary"
                  href={studyHref(l.documentId, null, l.toPage)}
                >
                  {l.label}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDay(l.date)} · pagine {l.fromPage}–{l.toPage} · {formatDuration(l.minutes)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  )
}
