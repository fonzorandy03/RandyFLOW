'use client'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { examSimulationApi, studyPackageApi } from '@/lib/api/services'
import { useExams } from '@/lib/hooks'
import { ErrorState, LoadingState } from '../common/states'
import { PageHeader } from '../common/page-header'
import { PageContainer } from '../layout/app-shell'

export function ExamSimulation() {
  const params = useSearchParams()
  const exams = useExams()
  const examId = params.get('exam') ?? exams.data?.[0]?.id ?? ''
  const pkg = useSWR(examId ? ['study-package', examId] : null, () => studyPackageApi.forExam(examId))
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [busy, setBusy] = useState(false)
  if (!exams.data || !pkg.data)
    return (
      <PageContainer>
        {pkg.error ? <ErrorState onRetry={() => void pkg.mutate()} /> : <LoadingState />}
      </PageContainer>
    )
  const questions = pkg.data.examQuestions
  const question = questions[index]
  if (!question)
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Simulazione esame"
          title="Nessuna domanda disponibile"
          description="Importa un package che contenga examQuestions."
        />
        <Button component={Link} href="/studio">
          Vai a Studio
        </Button>
      </PageContainer>
    )
  const rate = async (rating: 0 | 60 | 100) => {
    setBusy(true)
    try {
      await examSimulationApi.submit(examId, question.id, answer, rating)
      await mutate(['mastery', examId])
      setDone((value) => value + 1)
      setIndex((value) => value + 1)
      setAnswer('')
      setRevealed(false)
    } finally {
      setBusy(false)
    }
  }
  if (done >= questions.length)
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Simulazione esame"
          title="Simulazione completata"
          description={`Hai valutato ${done} risposte. I risultati hanno aggiornato la mastery e i ripassi.`}
        />
        <div className="flex gap-2">
          <Button component={Link} href={`/quiz?exam=${examId}`} variant="contained">
            Vai ai quiz
          </Button>
          <Button component={Link} href="/planner">
            Apri il planner
          </Button>
        </div>
      </PageContainer>
    )
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Simulazione esame"
          title={pkg.data.exam.name}
          description={`Domanda ${index + 1} di ${questions.length} · contenuto pregenerato nel package`}
        />
        <div className="h-2 overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary" style={{ width: `${(100 * done) / questions.length}%` }} />
        </div>
        <article className="rounded-2xl border bg-card p-6">
          <p className="text-xs text-primary">
            {pkg.data.topics.find((topic) => topic.id === question.topicId)?.name}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{question.prompt}</h2>
          <div className="mt-3 flex gap-1">
            {question.slideRefs.map((slide) => {
              const topic = pkg.data!.topics.find((item) => item.id === question.topicId)!
              return (
                <Button
                  key={slide}
                  component={Link}
                  href={`/studio/${topic.materialId}?page=${slide}`}
                  size="small"
                >
                  Slide {slide}
                </Button>
              )
            })}
          </div>
          <TextField
            className="mt-5"
            fullWidth
            multiline
            minRows={6}
            label="La tua risposta"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          {!revealed ? (
            <Button
              className="mt-4"
              variant="contained"
              disabled={!answer.trim()}
              onClick={() => setRevealed(true)}
            >
              Confronta con la risposta modello
            </Button>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-muted p-4">
                <h3 className="font-semibold">Risposta modello</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{question.modelAnswer}</p>
              </div>
              <div>
                <h3 className="font-semibold">Criteri di valutazione</h3>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {question.evaluationCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void rate(0)}>
                  Da ripassare
                </Button>
                <Button disabled={busy} onClick={() => void rate(60)}>
                  Parziale
                </Button>
                <Button disabled={busy} variant="contained" onClick={() => void rate(100)}>
                  Solida
                </Button>
              </div>
            </div>
          )}
        </article>
      </div>
    </PageContainer>
  )
}
