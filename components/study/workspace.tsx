'use client'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import TextField from '@mui/material/TextField'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { settingsApi, studyApi, studyPackageApi } from '@/lib/api/services'
import { refreshPlanData, useDocument, useSessions } from '@/lib/hooks'
import { topicForSlide } from '@/lib/study-package'
import type { StudyDocument } from '@/lib/types'
import { ErrorState, LoadingState } from '../common/states'
import { useShell } from '../layout/shell-context'
import { SlideContent } from './slide-content'

type AssistantTab = 'Spiegazione' | 'Riassunto' | 'Concetti' | 'Esempi' | 'Quiz' | 'Flashcard'
const assistantTabs: AssistantTab[] = ['Spiegazione', 'Riassunto', 'Concetti', 'Esempi', 'Quiz', 'Flashcard']

export function Workspace({ id }: { id: string }) {
  const document = useDocument(id)
  const params = useSearchParams()
  if (document.error)
    return (
      <div className="p-6">
        <ErrorState
          message="Documento non trovato o non disponibile."
          onRetry={() => void document.mutate()}
        />
        <Link href="/studio">Torna a Studio</Link>
      </div>
    )
  if (!document.data) return <LoadingState />
  return <WorkspaceContent key={`${id}:${params.toString()}`} document={document.data} />
}

function WorkspaceContent({ document: doc }: { document: StudyDocument }) {
  const params = useSearchParams()
  const clamp = (n: number) => Math.max(1, Math.min(doc.pages, Number.isFinite(n) ? Math.floor(n) : 1))
  const [page, setPage] = useState(() => clamp(Number(params.get('page') || doc.lastPage)))
  const [mobileTab, setMobileTab] = useState<'document' | 'assistant'>('document')
  const [assistantTab, setAssistantTab] = useState<AssistantTab>('Spiegazione')
  const [zoom, setZoom] = useState(100)
  const [thumbs, setThumbs] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [timer, setTimer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState<number[]>([])
  const root = useRef<HTMLDivElement>(null)
  const positionQueue = useRef(Promise.resolve())
  const { focus, setFocus } = useShell()
  const sessions = useSessions(doc.examId)
  const session = sessions.data?.find((item) => item.id === params.get('session'))
  const from = clamp(Number(params.get('from') || 1))
  const to = Math.max(from, clamp(Number(params.get('to') || doc.pages)))
  const hasGoal = params.has('from') && params.has('to')
  const count = session?.slidesDone ?? completed.filter((value) => value >= from && value <= to).length
  const total = to - from + 1
  const slide = useSWR(['slide', doc.id, page], () => studyApi.slide(doc.id, page))
  const pkg = useSWR(['study-package-material', doc.id], () => studyPackageApi.forMaterial(doc.id))
  const prefs = useSWR('settings', settingsApi.get)
  const results = useSWR(search.trim() ? ['search-document', doc.id, search] : null, () =>
    studyApi.search(doc.id, search),
  )
  const thumbnails = useSWR(thumbs ? ['thumbnails', doc.id] : null, () => studyApi.thumbnails(doc.id))
  const topic = pkg.data ? topicForSlide(pkg.data, doc.id, page) : undefined
  const quizzes = pkg.data?.quizzes.filter((item) => item.topicId === topic?.id) ?? []
  const cards = pkg.data?.flashcards.filter((item) => item.topicId === topic?.id) ?? []

  useEffect(() => () => setFocus(false), [setFocus])
  useEffect(() => {
    positionQueue.current = positionQueue.current
      .then(async () => {
        const saved = await studyApi.savePosition(doc.id, page)
        await mutate(['document', doc.id], saved, false)
        await mutate('documents')
      })
      .catch(() => setError('Posizione non salvata. Riprova cambiando pagina.'))
  }, [doc.id, page])
  useEffect(() => {
    if (!timer) return
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(interval)
  }, [timer])
  const go = (value: number) => {
    setPage(clamp(value))
    setMobileTab('document')
  }
  const complete = async () => {
    setSaving(true)
    setError('')
    try {
      await studyApi.completePage(doc.id, page, session?.id)
      setCompleted((value) => (value.includes(page) ? value : [...value, page]))
      await refreshPlanData()
      if (page < (hasGoal ? to : doc.pages)) go(page + 1)
    } catch {
      setError('Progresso non salvato. Riprova.')
    } finally {
      setSaving(false)
    }
  }
  const saveTime = async () => {
    setSaving(true)
    try {
      await studyApi.log({
        examId: doc.examId,
        documentId: doc.id,
        fromPage: from,
        toPage: page,
        minutes: Math.max(1, Math.round(seconds / 60)),
        label: slide.data?.chapter ?? doc.name,
      })
      setTimer(false)
      setSeconds(0)
      await mutate('stats')
      await mutate('logs')
      await refreshPlanData()
    } catch {
      setError('Sessione non salvata. Riprova.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div ref={root} className={`flex min-h-full flex-col bg-background ${focus ? '' : 'pb-20 md:pb-0'}`}>
      <header className="flex flex-wrap items-center gap-2 border-b p-3">
        <Link href="/studio" className="mr-2 text-sm text-primary">
          ← Studio
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{doc.name}</h1>
        <Button size="small" onClick={() => setFocus(!focus)}>
          {focus ? 'Esci da Focus' : 'Focus Mode'}
        </Button>
        <Button
          size="small"
          onClick={async () => {
            try {
              if (window.document.fullscreenElement) await window.document.exitFullscreen()
              else await root.current?.requestFullscreen()
            } catch {
              setError('Fullscreen non disponibile in questo browser.')
            }
          }}
        >
          Fullscreen
        </Button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card p-3">
        <div className="min-w-48 flex-1">
          <p className="mb-2 text-sm font-medium">
            {hasGoal
              ? `Obiettivo: slide ${from}–${to} · ${Math.min(count, total)} / ${total} slide`
              : `Documento · ${doc.pagesRead} / ${doc.pages} pagine completate`}
          </p>
          <LinearProgress
            variant="determinate"
            value={hasGoal ? Math.min(100, (100 * count) / total) : (100 * doc.pagesRead) / doc.pages}
          />
        </div>
        <Button variant="contained" disabled={saving} onClick={complete}>
          Segna pagina letta e continua
        </Button>
        <Button size="small" onClick={() => setTimer(!timer)}>
          {timer ? 'Pausa' : 'Timer'} {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </Button>
        {seconds > 0 && (
          <Button disabled={saving} onClick={saveTime}>
            Salva sessione
          </Button>
        )}
        {prefs.data?.autoBreak && seconds >= (prefs.data.sessionMinutes ?? 25) * 60 && (
          <span className="text-xs text-primary">
            È il momento di una pausa di {prefs.data.breakMinutes ?? 5} min.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div role="tablist" className="flex border-b lg:hidden">
        {(
          [
            ['document', 'Documento'],
            ['assistant', 'Assistente'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mobileTab === id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 p-3 ${mobileTab === id ? 'border-b-2 border-primary text-primary' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <section
          aria-label="Documento"
          className={`${mobileTab === 'document' ? 'flex' : 'hidden'} min-w-0 flex-col lg:flex lg:border-r`}
        >
          <div className="flex flex-wrap items-center gap-2 border-b p-2">
            <Button size="small" disabled={page === 1} onClick={() => go(page - 1)}>
              Precedente
            </Button>
            <label className="text-xs">
              Pagina{' '}
              <input
                aria-label="Pagina corrente"
                type="number"
                min={1}
                max={doc.pages}
                value={page}
                onChange={(event) => go(Number(event.target.value))}
                className="w-16 rounded border bg-card p-2"
              />{' '}
              / {doc.pages}
            </label>
            <Button size="small" disabled={page === doc.pages} onClick={() => go(page + 1)}>
              Successiva
            </Button>
            <label className="text-xs">
              Zoom{' '}
              <select
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="rounded border bg-card p-2"
              >
                {[75, 100, 125, 150, 200].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <Button size="small" onClick={() => setThumbs(!thumbs)}>
              Miniature
            </Button>
          </div>
          <div className="p-3">
            <TextField
              fullWidth
              size="small"
              label="Cerca nel documento"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <div className="max-h-40 overflow-auto">
                {results.data?.map((result) => (
                  <button
                    key={result.page}
                    className="block w-full p-2 text-left text-sm hover:bg-muted"
                    onClick={() => go(result.page)}
                  >
                    Slide {result.page} · {result.title}
                  </button>
                ))}
                {results.data && !results.data.length && <p className="p-2 text-sm">Nessun risultato</p>}
              </div>
            )}
          </div>
          {thumbs && (
            <div className="flex max-h-40 gap-2 overflow-auto px-3 pb-3">
              {Array.from({ length: doc.pages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => go(number)}
                  className={`w-24 shrink-0 rounded-lg border p-2 text-left text-xs ${page === number ? 'border-primary bg-primary/10' : 'bg-card'}`}
                >
                  <b>{number}</b>
                  <span className="mt-2 block">
                    {thumbnails.data?.[number - 1]?.title ??
                      doc.chapters.find((chapter) => number >= chapter.from && number <= chapter.to)?.title}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-auto bg-muted/50 p-3 md:p-6">
            <article
              className="mx-auto min-h-80 rounded-xl border bg-card p-6 shadow-sm md:p-9"
              style={{ zoom: zoom / 100 }}
            >
              {slide.error ? (
                <ErrorState onRetry={() => void slide.mutate()} />
              ) : slide.data ? (
                <SlideContent slide={slide.data} />
              ) : (
                <LoadingState />
              )}
            </article>
          </div>
        </section>
        <section
          aria-label="Assistente di Studio"
          className={`${mobileTab === 'assistant' ? 'flex' : 'hidden'} min-w-0 flex-col bg-card lg:flex`}
        >
          <div className="border-b p-4">
            <h2 className="font-semibold">Assistente di Studio</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Slide {page}
              {topic ? ` · ${topic.name}` : ''}
            </p>
          </div>
          <div role="tablist" className="flex flex-wrap gap-1 border-b p-2">
            {assistantTabs.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={assistantTab === item}
                onClick={() => setAssistantTab(item)}
                className={`rounded-lg px-3 py-2 text-xs ${assistantTab === item ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-5">
            {pkg.error ? (
              <ErrorState message="Study Package non disponibile." onRetry={() => void pkg.mutate()} />
            ) : !pkg.data ? (
              <LoadingState />
            ) : !topic ? (
              <p className="text-sm text-muted-foreground">Nessun contenuto associato a questa slide.</p>
            ) : (
              <AssistantContent
                tab={assistantTab}
                topic={topic}
                quizzes={quizzes}
                cards={cards}
                level={prefs.data?.explanationLevel ?? 'Normale'}
                go={go}
                examId={doc.examId}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t p-3">
            <Button component={Link} href={`/quiz?exam=${doc.examId}`}>
              Apri quiz
            </Button>
            <Button component={Link} href={`/flashcard?exam=${doc.examId}`}>
              Apri flashcard
            </Button>
            <Button component={Link} href={`/simulazione?exam=${doc.examId}`}>
              Simulazione esame
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function SlideRefs({ refs, go }: { refs: number[]; go: (page: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1">
      {refs.map((ref) => (
        <Button size="small" key={ref} onClick={() => go(ref)}>
          Slide {ref}
        </Button>
      ))}
    </div>
  )
}
function AssistantContent({
  tab,
  topic,
  quizzes,
  cards,
  level,
  go,
  examId,
}: {
  tab: AssistantTab
  topic: import('@/lib/types').StudyPackageTopic
  quizzes: import('@/lib/types').StudyPackageQuiz[]
  cards: import('@/lib/types').StudyPackageFlashcard[]
  level: string
  go: (page: number) => void
  examId: string
}) {
  const refs = Array.from(
    { length: topic.slideRange.to - topic.slideRange.from + 1 },
    (_, index) => topic.slideRange.from + index,
  )
  if (tab === 'Spiegazione') {
    const key = level === 'Semplice' ? 'simple' : level === 'Approfondito' ? 'deep' : 'normal'
    return (
      <div>
        <p className="whitespace-pre-wrap text-sm leading-7">{topic.explanations[key]}</p>
        <SlideRefs refs={refs} go={go} />
      </div>
    )
  }
  if (tab === 'Riassunto')
    return (
      <div>
        <p className="whitespace-pre-wrap text-sm leading-7">{topic.summary}</p>
        <SlideRefs refs={refs} go={go} />
      </div>
    )
  if (tab === 'Concetti')
    return (
      <ul className="space-y-3">
        {topic.keyConcepts.map((item) => (
          <li key={item} className="rounded-xl bg-muted p-3 text-sm">
            {item}
          </li>
        ))}
      </ul>
    )
  if (tab === 'Esempi')
    return (
      <ol className="list-decimal space-y-3 pl-5">
        {topic.examples.map((item) => (
          <li key={item} className="text-sm leading-6">
            {item}
          </li>
        ))}
      </ol>
    )
  if (tab === 'Quiz')
    return (
      <div className="space-y-4">
        {quizzes.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <p className="font-medium">{item.prompt}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
            <SlideRefs refs={item.slideRefs} go={go} />
          </article>
        ))}
        <Button component={Link} href={`/quiz?exam=${examId}`} variant="contained">
          Svolgi il quiz
        </Button>
      </div>
    )
  return (
    <div className="space-y-4">
      {cards.map((item) => (
        <article key={item.id} className="rounded-xl border p-4">
          <p className="font-medium">{item.front}</p>
          <p className="mt-2 text-sm text-muted-foreground">{item.back}</p>
          <SlideRefs refs={item.slideRefs} go={go} />
        </article>
      ))}
      <Button component={Link} href={`/flashcard?exam=${examId}`} variant="contained">
        Ripassa le flashcard
      </Button>
    </div>
  )
}
