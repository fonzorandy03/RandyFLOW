'use client'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  List,
  Search,
  Sparkles,
  Target,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { settingsApi, studyApi, studyPackageApi } from '@/lib/api/services'
import { ApiError, USE_MOCKS } from '@/lib/api/http'
import { refreshPlanData, useDocument, useDocuments, useSessions } from '@/lib/hooks'
import { studyHref, studyPanelHref } from '@/lib/routes'
import { documentDailyGoal } from '@/lib/study-goal'
import { useCurrentDate } from '@/lib/use-current-date'
import { compareMaterials } from '@/lib/materials'
import { topicForSlide } from '@/lib/study-package'
import type { StudyDocument } from '@/lib/types'
import { ErrorState, LoadingState } from '../common/states'
import { LessonContent } from './lesson-content'
import { useToast } from '../common/toast'
import { useShell } from '../layout/shell-context'
import { SlideContent } from './slide-content'
import { PdfReader } from './pdf-reader'
import { SessionTimer } from './session-timer'
import { MaterialPagesDialog } from './material-pages-dialog'
import { pageTypeLabel } from '@/lib/materials'

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
  const router = useRouter()
  const documents = useDocuments()
  const examDocuments =
    documents.data?.filter((item) => item.examId === doc.examId).sort(compareMaterials) ?? []
  const params = useSearchParams()
  const clamp = (n: number) => Math.max(1, Math.min(doc.pages, Number.isFinite(n) ? Math.floor(n) : 1))
  const [page, setPage] = useState(() => clamp(Number(params.get('page') || doc.lastPage)))
  const [pageInput, setPageInput] = useState(String(page))
  const detached = params.get('detached') === '1'
  const floating = params.get('floating') === '1'
  const initialView = params.get('view')
  const [mobileTab, setMobileTab] = useState<'document' | 'assistant'>(
    initialView === 'explanation' ? 'assistant' : 'document',
  )
  const [assistantTab, setAssistantTab] = useState<AssistantTab>(
    () => assistantTabs.find((tab) => tab === params.get('tab')) ?? 'Spiegazione',
  )
  const [assistantOpen, setAssistantOpen] = useState(initialView !== 'pdf')
  const [readingMode, setReadingMode] = useState<'split' | 'pdf' | 'explanation'>(
    initialView === 'pdf' || initialView === 'explanation' ? initialView : 'split',
  )
  const [explanationLevel, setExplanationLevel] = useState(
    () =>
      ['Semplice', 'Normale', 'Approfondito'].find((level) => level === params.get('level')) ?? 'Semplice',
  )
  const needsPdf = readingMode !== 'explanation'
  const panelHref = (view: 'pdf' | 'explanation') =>
    studyPanelHref(doc.id, params.toString(), page, view, assistantTab, explanationLevel)
  const openPanelWindow = (event: React.MouseEvent<HTMLAnchorElement>, view: 'pdf' | 'explanation') => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const width = Math.min(840, window.screen.availWidth)
    const height = Math.min(900, window.screen.availHeight)
    window.open(
      `${panelHref(view)}&floating=1`,
      '_blank',
      `popup=yes,width=${width},height=${height},resizable=yes,scrollbars=yes,noopener,noreferrer`,
    )
  }
  const [zoom, setZoom] = useState(100)
  const [outline, setOutline] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState<number[]>(doc.completedPages ?? [])
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfError, setPdfError] = useState(false)
  const [pdfAttempt, setPdfAttempt] = useState(0)
  const [managePages, setManagePages] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const lesson = useRef<HTMLDivElement>(null)
  useEffect(() => {
    lesson.current?.scrollTo({ top: 0 })
  }, [page, assistantTab, explanationLevel])
  const positionQueue = useRef(Promise.resolve())
  const savingRef = useRef(false)
  const { focus, setFocus } = useShell()
  const toast = useToast()
  const sessions = useSessions(doc.examId)
  const today = useCurrentDate()
  const dailyGoal = documentDailyGoal(doc, sessions.data ?? [], today, completed)
  const session = sessions.data?.find(
    (item) => item.id === params.get('session') && (!item.materialId || item.materialId === doc.id),
  )
  const from = clamp(Number(params.get('from') || 1))
  const to = Math.max(from, clamp(Number(params.get('to') || doc.pages)))
  const hasGoal = params.has('from') && params.has('to') && (!params.has('session') || !!session)
  const count = session?.slidesDone ?? completed.filter((value) => value >= from && value <= to).length
  const total = to - from + 1
  const done = hasGoal ? Math.min(count, total) : doc.pagesRead
  const goal = hasGoal ? total : doc.studyablePages
  const progress = Math.min(100, (100 * done) / Math.max(1, goal))
  const slide = useSWR(USE_MOCKS ? ['slide', doc.id, page] : null, () => studyApi.slide(doc.id, page))
  const pkg = useSWR(['study-package-material', doc.id], () => studyPackageApi.forMaterial(doc.id), {
    shouldRetryOnError: false,
  })
  const prefs = useSWR('settings', settingsApi.get)
  const results = useSWR(query ? ['search-document', doc.id, query] : null, () =>
    studyApi.search(doc.id, query),
  )
  const topic = pkg.data ? topicForSlide(pkg.data, doc.id, page) : undefined
  const pageInfo = doc.pageSelection?.find((item) => item.page === page)
  const isStudyable =
    pageInfo?.studyable ??
    (!topic || ((topic.pageType ?? 'content') === 'content' && (topic.studyable ?? true)))
  const quizzes = pkg.data?.quizzes.filter((item) => item.topicId === topic?.id) ?? []
  const cards = pkg.data?.flashcards.filter((item) => item.topicId === topic?.id) ?? []
  const chapter = doc.chapters.find((item) => page >= item.from && page <= item.to)
  const missingPackage = pkg.error && (pkg.error instanceof ApiError ? pkg.error.status === 404 : USE_MOCKS)

  useEffect(() => {
    if (detached) setFocus(true)
    return () => setFocus(false)
  }, [detached, setFocus])
  useEffect(() => {
    if (sessions.data) {
      void mutate(['document', doc.id])
      void mutate('documents')
    }
  }, [doc.id, sessions.data])
  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timeout)
  }, [search])
  useEffect(() => {
    if (USE_MOCKS || !needsPdf) return
    let active = true
    let objectUrl = ''
    setPdfError(false)
    void studyApi
      .pdf(doc.id)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      })
      .catch(() => {
        if (active) setPdfError(true)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc.id, pdfAttempt, needsPdf])
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
    const handle = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement
      if (
        element.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const next = Math.max(1, Math.min(doc.pages, page + (event.key === 'ArrowRight' ? 1 : -1)))
        setPage(next)
        setPageInput(String(next))
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [page, doc.pages])
  const go = (value: number) => {
    const next = clamp(value)
    setPage(next)
    setPageInput(String(next))
    setMobileTab(readingMode === 'explanation' ? 'assistant' : 'document')
  }
  const commitPage = () => {
    if (pageInput.trim()) go(Number(pageInput))
    else setPageInput(String(page))
  }
  useEffect(() => {
    setCompleted(doc.completedPages ?? [])
  }, [doc.completedPages])
  const undo = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      await studyApi.uncompletePage(doc.id, page)
      setCompleted((value) => value.filter((n) => n !== page))
      await refreshPlanData()
      toast('Pagina rimessa da studiare. Piano aggiornato.')
    } catch {
      setError('Modifica non salvata. Riprova.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  const complete = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    try {
      await studyApi.completePage(doc.id, page)
      setCompleted((value) => (value.includes(page) ? value : [...value, page]))
      await refreshPlanData()
      toast(
        page === (hasGoal ? to : doc.pages)
          ? 'Hai raggiunto la fine. Ottimo lavoro!'
          : 'Pagina completata. Continua così!',
      )
      if (page < (hasGoal ? to : doc.pages)) go(page + 1)
    } catch {
      setError('Progresso non salvato. Riprova.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  return (
    <div
      ref={root}
      className={`study-workspace ${focus ? 'is-focus' : ''} ${detached ? 'is-detached' : ''} ${floating ? 'is-floating' : ''}`}
    >
      <header className="study-heading">
        <div className="min-w-0">
          <Link
            href="/studio"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} />
            Il tuo spazio di studio
          </Link>
          <div className="flex items-center gap-3">
            <span className="study-document-icon">
              <BookOpen size={22} />
            </span>
            <div className="min-w-0">
              <p className="study-eyebrow">Una pagina alla volta, verso il tuo obiettivo</p>
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl" title={doc.name}>
                {doc.name.replace(/\.pdf$/i, '').replace(/_/g, ' ')}
              </h1>
              {examDocuments.length > 1 && (
                <select
                  aria-label="Cambia dispensa"
                  className="mt-2 max-w-full rounded-lg border bg-card px-2 py-1 text-xs text-muted-foreground"
                  value={doc.id}
                  onChange={(event) => {
                    const selected = examDocuments.find((item) => item.id === event.target.value)
                    if (selected) router.push(studyHref(selected.id, null, selected.lastPage))
                  }}
                >
                  {examDocuments.map((item, index) => (
                    <option key={item.id} value={item.id}>
                      Dispensa {index + 1} di {examDocuments.length}: {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className={`study-action ${focus ? 'active' : ''}`} onClick={() => setFocus(!focus)}>
            <Target size={16} />
            {focus ? 'Esci da Focus' : 'Concentrati'}
          </button>
          <button
            className="study-icon"
            aria-label="Schermo intero"
            title="Schermo intero"
            onClick={async () => {
              try {
                if (window.document.fullscreenElement) await window.document.exitFullscreen()
                else await root.current?.requestFullscreen()
              } catch {
                setError('Schermo intero non disponibile in questo browser.')
              }
            }}
          >
            <Expand size={18} />
          </button>
        </div>
      </header>
      {!detached && (
        <div className="study-session-bar">
          <div className="study-progress">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="size-2 rounded-full bg-success" />
                {hasGoal ? `Obiettivo di oggi · pagine ${from}–${to}` : 'Il tuo percorso'}
              </span>
              <span className="tabular text-xs text-muted-foreground">
                {done} / {goal} completate
              </span>
            </div>
            <div
              className="study-progress-track"
              role="progressbar"
              aria-label="Pagine completate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {progress >= 100
                ? 'Obiettivo raggiunto. Prenditi un momento per ripassare.'
                : 'Ogni pagina è un piccolo passo avanti.'}
            </p>
          </div>
          <SessionTimer
            key={doc.id}
            documentId={doc.id}
            examId={doc.examId}
            page={page}
            label={chapter?.title ?? doc.name}
            targetMinutes={prefs.data?.sessionMinutes}
            breakMinutes={prefs.data?.breakMinutes}
            autoBreak={prefs.data?.autoBreak}
          />
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
          <button className="study-icon" aria-label="Chiudi messaggio" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      <div role="tablist" aria-label="Pannelli di studio" className="study-mobile-tabs">
        <button role="tab" aria-selected={mobileTab === 'document'} onClick={() => setMobileTab('document')}>
          Documento
        </button>
        <button
          role="tab"
          aria-selected={mobileTab === 'assistant'}
          onClick={() => {
            setAssistantOpen(true)
            setMobileTab('assistant')
          }}
        >
          Assistente
        </button>
      </div>
      <div className="study-reading-controls">
        <div className="study-view-switch" aria-label="Modalità di lettura">
          {(
            [
              ['split', 'PDF e spiegazione'],
              ['pdf', 'Solo PDF'],
              ['explanation', 'Solo spiegazione'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              aria-pressed={readingMode === mode}
              onClick={() => {
                setReadingMode(mode)
                setAssistantOpen(mode !== 'pdf')
                setMobileTab(mode === 'explanation' ? 'assistant' : 'document')
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="study-icon"
            aria-label="Pagina precedente"
            disabled={page <= 1}
            onClick={() => go(page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm tabular">
            Pagina {page} / {doc.pages}
          </span>
          <button
            className="study-icon"
            aria-label="Pagina successiva"
            disabled={page >= doc.pages}
            onClick={() => go(page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {detached && (
        <section className="study-daily-goal" aria-label="Obiettivo giornaliero">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Target size={16} className="text-primary" />
              {dailyGoal.total > 0 && dailyGoal.done === dailyGoal.total
                ? 'Obiettivo di oggi raggiunto'
                : 'Obiettivo di oggi'}
            </span>
            {dailyGoal.total > 0 && (
              <span className="text-xs tabular text-muted-foreground">
                {dailyGoal.done} / {dailyGoal.total} pagine completate
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {sessions.error
              ? 'Obiettivo non disponibile.'
              : !today || !sessions.data
                ? 'Carico il piano di oggi…'
                : dailyGoal.total > 0
                  ? `Pagine PDF ${dailyGoal.ranges} · questa dispensa`
                  : 'Nessuna pagina prevista per oggi in questa dispensa. Puoi studiare in anticipo.'}
            {sessions.error && (
              <button className="ml-2 text-primary underline" onClick={() => void sessions.mutate()}>
                Riprova
              </button>
            )}
          </p>
          {dailyGoal.total > 0 && (
            <div
              className="study-progress-track mt-2"
              role="progressbar"
              aria-label="Progresso dell’obiettivo giornaliero"
              aria-valuemin={0}
              aria-valuemax={dailyGoal.total}
              aria-valuenow={dailyGoal.done}
            >
              <div style={{ width: `${dailyGoal.progress}%` }} />
            </div>
          )}
        </section>
      )}
      <div className={`study-panels reading-${readingMode} ${assistantOpen ? '' : 'reader-only'}`}>
        <section
          aria-label="Documento"
          className={`study-reader ${mobileTab === 'document' ? '' : 'mobile-hidden'}`}
        >
          <div className="study-panel-launch flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Documento PDF</span>
            <a
              className="study-action text-xs"
              href={panelHref('pdf')}
              onClick={(event) => openPanelWindow(event, 'pdf')}
              target="_blank"
              rel="noopener noreferrer"
              title="Apri lo stesso lettore in una finestra spostabile e ridimensionabile"
            >
              <ExternalLink size={14} />
              Apri PDF in finestra
            </a>
          </div>
          <div className="reader-toolbar">
            <div className="flex items-center gap-1">
              <button
                className={`study-icon ${outline ? 'active' : ''}`}
                aria-label="Mostra indice delle pagine"
                aria-expanded={outline}
                onClick={() => setOutline(!outline)}
                title="Indice e pagine"
              >
                <List size={18} />
              </button>
              <button
                className="study-icon hidden sm:inline-flex"
                aria-label="Gestisci pagine da studiare"
                title="Copertine, indici e pagine da studiare"
                onClick={() => setManagePages(true)}
              >
                <BookOpen size={17} />
              </button>
              <span className="toolbar-divider" />
              <button
                className="study-icon"
                aria-label="Pagina precedente"
                disabled={page === 1}
                onClick={() => go(page - 1)}
              >
                <ChevronLeft size={19} />
              </button>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  commitPage()
                }}
                className="flex items-center gap-2"
              >
                <input
                  className="page-input tabular"
                  aria-label="Pagina corrente"
                  type="number"
                  min={1}
                  max={doc.pages}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  onBlur={commitPage}
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">di {doc.pages}</span>
              </form>
              <button
                className="study-icon"
                aria-label="Pagina successiva"
                disabled={page === doc.pages}
                onClick={() => go(page + 1)}
              >
                <ChevronRight size={19} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <select
                className="zoom-select"
                aria-label="Zoom documento"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              >
                <option value={0}>Pagina intera</option>
                {[75, 100, 125, 150, 200].map((value) => (
                  <option key={value} value={value}>
                    {value === 100 ? 'Adatta alla larghezza' : `${value}%`}
                  </option>
                ))}
              </select>
              <button
                className={`study-icon ${searchOpen ? 'active' : ''}`}
                aria-label="Cerca nel documento"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search size={17} />
              </button>
              <button
                className="study-icon assistant-toggle"
                aria-label={assistantOpen ? 'Nascondi assistente' : 'Mostra assistente'}
                onClick={() => {
                  setReadingMode(assistantOpen ? 'pdf' : 'split')
                  setAssistantOpen(!assistantOpen)
                }}
                title={assistantOpen ? 'Più spazio al documento' : 'Mostra assistente'}
              >
                {assistantOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              </button>
            </div>
          </div>
          {searchOpen && (
            <div className="reader-search">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-muted-foreground" />
                <input
                  autoFocus
                  aria-label="Cerca nel documento"
                  placeholder="Cerca una parola o un concetto…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <button
                  className="study-icon"
                  aria-label="Chiudi ricerca"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearch('')
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              {query && (
                <div className="max-h-44 overflow-auto">
                  {results.error ? (
                    <p role="alert" className="py-3 text-sm text-destructive">
                      Ricerca non disponibile. Riprova.
                    </p>
                  ) : !results.data || search.trim() !== query ? (
                    <p className="py-3 text-xs text-muted-foreground">Ricerca in corso…</p>
                  ) : results.data.length ? (
                    results.data.map((result) => (
                      <button
                        key={result.page}
                        className="search-result"
                        onClick={() => {
                          go(result.page)
                          setSearchOpen(false)
                        }}
                      >
                        <span>Pagina {result.page}</span>
                        {result.title}
                        <ArrowRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p className="py-3 text-sm text-muted-foreground">Nessun risultato.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="reader-body">
            {outline && (
              <nav className="reader-outline scrollbar-thin" aria-label="Indice documento">
                <button
                  className="mb-4 text-xs font-medium text-primary"
                  onClick={() => setManagePages(true)}
                >
                  Pagine da studiare
                </button>
                <p className="study-eyebrow mb-3">Vai alla pagina</p>
                {doc.chapters.map((item) => (
                  <button
                    key={`${item.from}:${item.title}`}
                    className={`outline-chapter ${chapter === item ? 'active' : ''}`}
                    onClick={() => go(item.from)}
                  >
                    <span>{item.title}</span>
                    <small>
                      {item.from}?{item.to}
                    </small>
                  </button>
                ))}
                <div className="page-grid">
                  {Array.from({ length: doc.pages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      aria-label={`Vai a pagina ${number}`}
                      aria-current={page === number ? 'page' : undefined}
                      className={page === number ? 'active' : ''}
                      onClick={() => go(number)}
                    >
                      {number}
                      {completed.includes(number) && <Check size={10} />}
                    </button>
                  ))}
                </div>
              </nav>
            )}
            {pdfUrl ? (
              <PdfReader key={pdfUrl} url={pdfUrl} page={page} zoom={zoom} name={doc.name} />
            ) : USE_MOCKS ? (
              <div className="pdf-stage scrollbar-thin">
                <article className="demo-sheet" style={{ width: `${zoom}%` }}>
                  {slide.error ? (
                    <ErrorState onRetry={() => void slide.mutate()} />
                  ) : slide.data ? (
                    <SlideContent slide={slide.data} />
                  ) : (
                    <LoadingState />
                  )}
                </article>
              </div>
            ) : pdfError ? (
              <div className="study-empty">
                <BookOpen size={30} />
                <h3>Il documento non è disponibile</h3>
                <p>Controlla la connessione e riprova a caricarlo.</p>
                <button className="study-action" onClick={() => setPdfAttempt((value) => value + 1)}>
                  Riprova
                </button>
              </div>
            ) : (
              <div className="pdf-stage">
                <LoadingState />
              </div>
            )}
          </div>
          <footer className="reader-footer">
            {completed.includes(page) && (
              <button className="study-action" disabled={saving} onClick={() => void undo()}>
                Segna da studiare
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{chapter?.title ?? `Pagina ${page}`}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isStudyable
                  ? 'Leggi con calma. Poi segna la pagina come completata.'
                  : `${pageTypeLabel[pageInfo?.type ?? topic?.pageType ?? ''] ?? 'Pagina di servizio'} · esclusa dal piano di studio`}
              </p>
            </div>
            <button
              className="study-complete"
              disabled={saving || (!isStudyable && page === doc.pages)}
              onClick={() => (isStudyable ? void complete() : go(page + 1))}
            >
              {saving ? (
                'Salvataggio…'
              ) : isStudyable ? (
                <>
                  <Check size={17} />
                  Letta, continua
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Continua
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </footer>
        </section>
        {assistantOpen && (
          <section
            aria-label="Assistente di studio"
            className={`study-assistant ${mobileTab === 'assistant' ? '' : 'mobile-hidden'}`}
          >
            <div className="study-panel-launch flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Spiegazioni e riassunti</span>
              <a
                className="study-action text-xs"
                href={panelHref('explanation')}
                onClick={(event) => openPanelWindow(event, 'explanation')}
                target="_blank"
                rel="noopener noreferrer"
                title="Apri spiegazioni e riassunti in una finestra spostabile e ridimensionabile"
              >
                <ExternalLink size={14} />
                Apri in finestra
              </a>
            </div>
            <div className="assistant-heading">
              <div className="flex items-center gap-3">
                <span className="assistant-symbol">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Capisci questa pagina</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Una spiegazione alla volta, senza fretta.
                  </p>
                </div>
              </div>
              <div className="assistant-context">
                <span className="tabular">Pagina {page}</span>
                <p>{topic?.name ?? chapter?.title ?? 'Il tuo documento'}</p>
              </div>
            </div>
            {floating && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
                <button
                  className="study-icon"
                  aria-label="Pagina precedente"
                  disabled={page <= 1}
                  onClick={() => go(page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm tabular">
                  Pagina {page} / {doc.pages}
                </span>
                <button
                  className="study-icon"
                  aria-label="Pagina successiva"
                  disabled={page >= doc.pages}
                  onClick={() => go(page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            {topic && (
              <div role="tablist" aria-label="Contenuti di studio" className="assistant-tabs">
                {assistantTabs.map((item) => (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={assistantTab === item}
                    onClick={() => setAssistantTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            <div ref={lesson} className="assistant-content scrollbar-thin">
              {topic && assistantTab === 'Spiegazione' && (
                <div className="explanation-level">
                  <label htmlFor="explanation-level">Come vuoi la spiegazione?</label>
                  <select
                    id="explanation-level"
                    value={explanationLevel}
                    onChange={(e) => setExplanationLevel(e.target.value)}
                  >
                    <option>Semplice</option>
                    <option>Normale</option>
                    <option>Approfondito</option>
                  </select>
                </div>
              )}
              {pkg.error && !missingPackage ? (
                <div className="study-empty">
                  <Sparkles size={26} />
                  <h3>Assistente momentaneamente non disponibile</h3>
                  <p>Puoi continuare a leggere e riprovare tra poco.</p>
                  <button className="study-action" onClick={() => void pkg.mutate()}>
                    Riprova
                  </button>
                </div>
              ) : !pkg.data && !pkg.error ? (
                <LoadingState />
              ) : !topic ? (
                <div className="assistant-welcome">
                  <p className="study-eyebrow">Fai spazio alla comprensione</p>
                  <h3>
                    Non serve fare tutto.
                    <br />
                    Inizia da questa pagina.
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Tre piccoli passi per trasformare la lettura in qualcosa che ricordi.
                  </p>
                  <ol className="study-steps">
                    <li>
                      <span>01</span>
                      <div>
                        <b>Trova l’idea centrale</b>
                        <p>Qual è il concetto più importante della pagina?</p>
                      </div>
                    </li>
                    <li>
                      <span>02</span>
                      <div>
                        <b>Spiegalo con parole tue</b>
                        <p>Come lo racconteresti a un compagno?</p>
                      </div>
                    </li>
                    <li>
                      <span>03</span>
                      <div>
                        <b>Metti alla prova il ricordo</b>
                        <p>Distogli lo sguardo e riassumi ciò che hai letto.</p>
                      </div>
                    </li>
                  </ol>
                  <div className="assistant-package">
                    <Sparkles size={18} />
                    <p>
                      {pkg.data
                        ? 'Questa pagina non ha contenuti di ripasso associati.'
                        : 'Aggiungi un pacchetto di studio per avere spiegazioni, quiz e flashcard legati alle tue pagine.'}
                    </p>
                    <Link href="/studio">
                      {pkg.data ? 'Gestisci materiali' : 'Aggiungi contenuti'}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <AssistantContent
                  tab={assistantTab}
                  topic={topic}
                  quizzes={quizzes}
                  cards={cards}
                  level={explanationLevel}
                  go={go}
                  examId={doc.examId}
                />
              )}
            </div>
            <div className="assistant-footer">
              {completed.includes(page) && (
                <button className="study-action mb-3" disabled={saving} onClick={() => void undo()}>
                  Pagina completata ? Segna da studiare
                </button>
              )}
              <button
                className="study-complete mb-3"
                disabled={saving || (page >= doc.pages && !isStudyable)}
                onClick={() => (isStudyable ? void complete() : go(page + 1))}
              >
                <Check size={16} />
                {saving ? 'Salvataggio…' : isStudyable ? 'Ho capito, continua' : 'Passa alla prossima pagina'}
                <ArrowRight size={16} />
              </button>
              <span className="study-eyebrow">Metti in pratica</span>
              <div className="flex flex-wrap gap-2">
                <Link className="study-action" href={`/quiz?exam=${doc.examId}`}>
                  Quiz
                  <ArrowRight size={14} />
                </Link>
                <Link className="study-action" href={`/flashcard?exam=${doc.examId}`}>
                  Flashcard
                  <ArrowRight size={14} />
                </Link>
                <Link
                  className="text-xs text-muted-foreground hover:text-primary"
                  href={`/simulazione?exam=${doc.examId}`}
                >
                  Simula l’esame
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
      <MaterialPagesDialog document={managePages ? doc : null} onClose={() => setManagePages(false)} />
    </div>
  )
}

function SlideRefs({ refs, go }: { refs: number[]; go: (page: number) => void }) {
  return (
    <details className="mt-5 rounded-xl border p-3 text-xs text-muted-foreground">
      <summary className="cursor-pointer">
        Riferimenti · {refs.length === 1 ? `pagina ${refs[0]}` : `pagine ${refs[0]}–${refs.at(-1)}`}
      </summary>
      <div className="mt-2 flex flex-wrap gap-1">
        {refs.map((ref) => (
          <Button size="small" key={ref} onClick={() => go(ref)}>
            Pagina {ref}
          </Button>
        ))}
      </div>
    </details>
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
      <div className="explanation-article">
        <LessonContent text={topic.explanations[key]} />
        {topic.studyable &&
          (topic.explanations[key].trim().split(/\s+/).length < 100 ||
            /[\u0000-\u0008\u000b\u000c\u000e-\u001f]|(?:…|\.\.\.)\s*$/.test(topic.explanations[key])) && (
            <details className="explanation-quality-note">
              <summary className="cursor-pointer text-xs font-medium">
                Nota sulla completezza del testo importato
              </summary>
              <p>
                Questa spiegazione importata sembra abbreviata o poco curata. Per una lezione completa,
                rigenera il file .study con il nuovo prompt e aggiorna questa dispensa.
              </p>
              <Link href="/studio">Migliora i contenuti →</Link>
            </details>
          )}
        <SlideRefs refs={refs} go={go} />
      </div>
    )
  }
  if (tab === 'Riassunto')
    return (
      <div>
        <LessonContent text={topic.summary} />
        <SlideRefs refs={refs} go={go} />
      </div>
    )
  if (tab === 'Concetti')
    return (
      <ul className="space-y-3">
        {topic.keyConcepts.map((item) => (
          <li key={item} className="rounded-xl bg-muted p-3 text-sm">
            <LessonContent text={item} />
          </li>
        ))}
      </ul>
    )
  if (tab === 'Esempi')
    return (
      <ol className="list-decimal space-y-3 pl-5">
        {topic.examples.map((item) => (
          <li key={item} className="text-sm leading-6">
            <LessonContent text={item} />
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
