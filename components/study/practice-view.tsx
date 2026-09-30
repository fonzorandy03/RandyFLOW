'use client'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { PageContainer } from '../layout/app-shell'
import { PageHeader } from '../common/page-header'
import { MasteryIndicator } from '../common/mastery-indicator'
import { ErrorState, LoadingState } from '../common/states'
import { useQuiz, useFlashcards, useExams, refreshPlanData } from '@/lib/hooks'
import { quizApi, flashcardsApi } from '@/lib/api/services'
import type { FlashcardRating, MasteryTopic, QuizAnswer } from '@/lib/types'
import { SlideReview } from './slide-review'

export function PracticeView({ kind }: { kind: 'quiz' | 'flashcard' }) {
  const params = useSearchParams()
  const exam = params.get('exam') ?? 'gps'
  const exams = useExams()
  if (exams.error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => void exams.mutate()} />
      </PageContainer>
    )
  if (!exams.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  const selected = exams.data.find((e) => e.id === exam)
  if (!selected)
    return (
      <PageContainer>
        <ErrorState message="Esame non trovato." />
        <Link href="/studio">Torna a Studio</Link>
      </PageContainer>
    )
  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow={selected.name}
          title={kind === 'quiz' ? 'Verifica quello che hai imparato' : 'Ripassa con le flashcard'}
          description={
            kind === 'quiz'
              ? 'Una domanda alla volta. Usa gli errori per orientare il prossimo ripasso.'
              : 'Gira la carta, poi valuta quanto ricordi.'
          }
        />
        <div className="flex flex-wrap gap-2">
          {exams.data.map((e) => (
            <Button
              key={e.id}
              component={Link}
              variant={e.id === exam ? 'contained' : 'outlined'}
              href={`/${kind}?exam=${e.id}`}
            >
              {e.shortName}
            </Button>
          ))}
        </div>
        {kind === 'quiz' ? (
          <Quiz key={exam} exam={exam} doc={selected.documentIds[0]} />
        ) : (
          <Flashcards key={exam} exam={exam} doc={selected.documentIds[0]} />
        )}
      </div>
    </PageContainer>
  )
}
function Quiz({ exam, doc }: { exam: string; doc: string }) {
  const quiz = useQuiz(exam)
  const [index, setIndex] = useState(0)
  const [given, setGiven] = useState('')
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState<MasteryTopic[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState<number | null>(null)
  if (quiz.error) return <ErrorState onRetry={() => void quiz.mutate()} />
  if (!quiz.data) return <LoadingState />
  if (!quiz.data.length) return <p>Nessuna domanda disponibile.</p>
  const q = quiz.data[index]
  const check = () => {
    const correct =
      q.type === 'multiple'
        ? Number(given) === q.correctIndex
        : (q.acceptedKeywords ?? []).some((k) => given.toLowerCase().includes(k))
    setAnswers((a) => [...a, { questionId: q.id, given, correct }])
    setChecked(true)
  }
  const next = async () => {
    if (index < quiz.data!.length - 1) {
      setIndex(index + 1)
      setGiven('')
      setChecked(false)
      return
    }
    setBusy(true)
    setError('')
    try {
      const topics = await quizApi.submit(exam, answers)
      await refreshPlanData()
      await mutate('stats')
      setResult(topics)
    } catch {
      setError('Risultato non salvato. Riprova.')
    } finally {
      setBusy(false)
    }
  }
  if (result)
    return (
      <section className="space-y-6 rounded-2xl border bg-card p-6">
        <h2 className="text-2xl font-semibold">Quiz completato</h2>
        <p className="text-4xl font-semibold text-primary">
          {answers.filter((a) => a.correct).length} / {answers.length}
        </p>
        <p className="text-sm text-muted-foreground">
          Padronanza aggiornata. I punti da ripassare sono collegati al planner.
        </p>
        {[
          ['Argomenti forti', result.filter((t) => t.score >= 80)],
          ['Argomenti deboli', result.filter((t) => t.score < 80 && !t.needsReview)],
          ['Da ripassare', result.filter((t) => t.needsReview)],
        ].map(([label, topics]) => (
          <div key={String(label)} className="space-y-4">
            <h3 className="font-semibold">{String(label)}</h3>
            {(topics as MasteryTopic[]).length ? (
              (topics as MasteryTopic[]).map((t) => <MasteryIndicator key={t.id} topic={t} />)
            ) : (
              <p className="text-sm text-muted-foreground">Nessun argomento in questa categoria.</p>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button component={Link} href={`/planner?exam=${exam}`} variant="contained">
            Apri planner
          </Button>
          <Button component={Link} href="/statistiche">
            Mastery e statistiche
          </Button>
          <Button
            onClick={() => {
              setResult(null)
              setIndex(0)
              setAnswers([])
              setChecked(false)
              setGiven('')
            }}
          >
            Ripeti quiz
          </Button>
        </div>
      </section>
    )
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Domanda {index + 1} di {quiz.data.length}
      </p>
      <h2 className="text-xl font-semibold">{q.prompt}</h2>
      {q.type === 'multiple' ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">Scegli una risposta</legend>
          {q.options?.map((option, i) => (
            <label
              key={i}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm ${given === String(i) ? 'border-primary bg-primary/5' : ''}`}
            >
              <input
                type="radio"
                name="answer"
                value={i}
                checked={given === String(i)}
                disabled={checked}
                onChange={() => setGiven(String(i))}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <TextField
            multiline
            minRows={3}
            fullWidth
            label="La tua risposta"
            value={given}
            disabled={checked}
            onChange={(e) => setGiven(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Valutazione dimostrativa basata su parole chiave.</p>
        </>
      )}
      {checked && (
        <div role="status" className="space-y-3 rounded-xl bg-muted p-4">
          <p className={`font-semibold ${answers.at(-1)?.correct ? 'text-success' : 'text-destructive'}`}>
            {answers.at(-1)?.correct ? 'Corretto' : 'Errato'}
          </p>
          <p className="text-sm">{q.explanation}</p>
          {q.modelAnswer && <p className="text-sm">Risposta di esempio: {q.modelAnswer}</p>}
          <Button onClick={() => setReview(q.slideRef)}>Rivedi slide {q.slideRef}</Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button
        variant="contained"
        disabled={busy || !given.trim()}
        onClick={() => (checked ? void next() : check())}
      >
        {checked
          ? index === quiz.data.length - 1
            ? 'Mostra risultato'
            : 'Prossima domanda'
          : 'Conferma risposta'}
      </Button>
      <SlideReview doc={doc} page={review} onClose={() => setReview(null)} />
    </section>
  )
}
function Flashcards({ exam, doc }: { exam: string; doc: string }) {
  const cards = useFlashcards(exam)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ratings, setRatings] = useState<FlashcardRating[]>([])
  const [review, setReview] = useState<number | null>(null)
  if (cards.error) return <ErrorState onRetry={() => void cards.mutate()} />
  if (!cards.data) return <LoadingState />
  const card = cards.data[index]
  const rate = async (rating: FlashcardRating) => {
    setBusy(true)
    setError('')
    try {
      await flashcardsApi.rate(exam, card.id, rating)
      setRatings((v) => [...v, rating])
      setIndex(index + 1)
      setFlipped(false)
      await refreshPlanData()
    } catch {
      setError('Valutazione non salvata. Riprova.')
    } finally {
      setBusy(false)
    }
  }
  if (!card)
    return (
      <section className="space-y-5 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Ripasso completato</h2>
        <p>
          {ratings.filter((r) => r === 'known').length} carte conosciute su {ratings.length}. Padronanza
          aggiornata.
        </p>
        <Button component={Link} href="/statistiche" variant="contained">
          Vedi Mastery
        </Button>
        <Button component={Link} href={`/planner?exam=${exam}`}>
          Apri planner
        </Button>
        <Button
          onClick={() => {
            setIndex(0)
            setRatings([])
          }}
        >
          Ripeti
        </Button>
      </section>
    )
  return (
    <section className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Flashcard {index + 1} di {cards.data.length} · {card.topic}
      </p>
      <button
        aria-label={flipped ? 'Mostra fronte' : 'Gira flashcard'}
        aria-pressed={flipped}
        onClick={() => setFlipped(!flipped)}
        className="perspective block w-full text-left"
      >
        <div
          className="preserve-3d relative grid min-h-72 transition-transform duration-300 motion-reduce:transition-none"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          <div
            aria-hidden={flipped}
            className="backface-hidden col-start-1 row-start-1 flex flex-col justify-center rounded-2xl border bg-card p-8"
          >
            <p className="mb-4 text-xs text-primary">FRONTE · CLICCA PER GIRARE</p>
            <h2 className="text-2xl font-semibold">{card.front}</h2>
          </div>
          <div
            aria-hidden={!flipped}
            style={{ transform: 'rotateY(180deg)' }}
            className="backface-hidden col-start-1 row-start-1 flex flex-col justify-center rounded-2xl border bg-card p-8"
          >
            <p className="mb-4 text-xs text-primary">RETRO</p>
            <p>{card.back}</p>
          </div>
        </div>
      </button>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['unknown', 'Non lo so'],
            ['hard', 'Difficile'],
            ['known', 'Lo so'],
          ] as const
        ).map(([value, label]) => (
          <Button key={value} variant="outlined" disabled={!flipped || busy} onClick={() => void rate(value)}>
            {label}
          </Button>
        ))}
        <Button onClick={() => setReview(card.slideRef)}>Rivedi slide {card.slideRef}</Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <SlideReview doc={doc} page={review} onClose={() => setReview(null)} />
    </section>
  )
}
