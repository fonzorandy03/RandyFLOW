import { addDays, diffDays, TODAY } from '../date'
import { forecastDaysEarly, generatePlan } from '../planner-engine'
import * as db from '../mock/db'
import { DOCUMENTS } from '../mock/documents'
import { getSlide, slideToText } from '../mock/documents'
import { examSimulationResults, preferences, reading, quizResults } from '../mock/persistence'
import {
  allPackages,
  packageForExam,
  packageForMaterial,
  packageRevision,
  savePackage,
} from '../mock/study-packages'
import {
  packageFlashcardToCard,
  packageQuizToQuestion,
  parseStudyPackage,
  summarizeStudyPackage,
} from '../study-package'
import type {
  AppNotification,
  Exam,
  Flashcard,
  MasteryTopic,
  NewExamInput,
  PlanAdjustment,
  QuizAnswer,
  QuizQuestion,
  SessionStatus,
  StatsOverview,
  Student,
  StudyDocument,
  StudyPackage,
  StudyPackageSummary,
  StudySession,
  StudySessionLog,
  TodayOverview,
} from '../types'
import { http, mockResponse, USE_MOCKS } from './http'

const documents = DOCUMENTS

function findExam(id: string) {
  const exam = db.exams.find((e) => e.id === id)
  if (!exam) throw new Error('Esame non trovato')
  return exam
}

function documentFor(exam: Exam) {
  return documents.find((d) => d.id === exam.documentIds[0]) ?? documents[0]
}

/** Re-plans every planned session after `afterDate`, starting from `firstSlide`. */
function redistribute(exam: Exam, afterDate: string, firstSlide: number) {
  const doc = documentFor(exam)
  const topicMetadata = packageForExam(exam.id).topics.filter((topic) => topic.materialId === doc.id)
  const old = db.sessions.filter((s) => s.examId === exam.id && s.date > afterDate)
  const oldByDate = new Map(old.map((s) => [s.date, s]))
  const next = generatePlan({
    examId: exam.id,
    startDate: addDays(afterDate, 1),
    examDate: exam.date,
    startSlide: firstSlide,
    endSlide: exam.totalSlides,
    availability: exam.availability,
    unavailable: exam.unavailableDays,
    reviewDays: exam.reviewDays,
    chapters: doc.chapters,
    weakTopics: db.mastery.filter((m) => m.examId === exam.id),
    topicMetadata,
  }).map((s) => {
    const prev = oldByDate.get(s.date)
    if (prev && s.status === 'planned' && prev.durationMin !== s.durationMin) {
      return { ...s, previousDurationMin: prev.durationMin, status: 'rescheduled' as SessionStatus }
    }
    return s
  })
  const kept = db.sessions.filter((s) => !(s.examId === exam.id && s.date > afterDate))
  db.sessions.splice(0, db.sessions.length, ...kept, ...next)
  return next.filter((s) => s.status === 'rescheduled').length
}

export const userApi = {
  update: (input: Partial<Student>): Promise<Student> =>
    USE_MOCKS ? mockResponse(() => Object.assign(db.student, input)) : http.patch('/me', input),
  me: (): Promise<Student> => (USE_MOCKS ? mockResponse(() => db.student, 200) : http.get('/me')),
}

export const examsApi = {
  updatePlan: (
    id: string,
    settings: { startDate: string; unavailableDays: string[]; reviewDays: number },
  ): Promise<Exam> => {
    if (!USE_MOCKS) return http.patch(`/exams/${id}/plan/settings`, settings)
    return mockResponse(() => {
      const exam = findExam(id)
      Object.assign(exam, settings)
      redistribute(
        exam,
        addDays(settings.startDate > TODAY ? settings.startDate : TODAY, -1),
        documentFor(exam).pagesRead + 1,
      )
      return exam
    })
  },
  reorderMaterials: (id: string, materialIds: string[]): Promise<StudyDocument[]> => {
    if (!USE_MOCKS) return http.patch(`/exams/${id}/materials/order`, { materialIds })
    return mockResponse(() => {
      const docs = documents.filter((d) => d.examId === id)
      if (
        docs.length !== materialIds.length ||
        new Set(materialIds).size !== docs.length ||
        docs.some((d) => !materialIds.includes(d.id))
      )
        throw new Error('Ordine non valido')
      docs.forEach((d) => {
        d.studyOrder = materialIds.indexOf(d.id)
      })
      return docs.sort((a, b) => (a.studyOrder ?? 0) - (b.studyOrder ?? 0))
    })
  },
  list: (): Promise<Exam[]> => (USE_MOCKS ? mockResponse(() => db.exams) : http.get('/exams')),
  get: (id: string): Promise<Exam> =>
    USE_MOCKS ? mockResponse(() => findExam(id)) : http.get(`/exams/${id}`),
  create: (input: NewExamInput): Promise<Exam> => {
    if (!USE_MOCKS) return http.post('/exams', input)
    return mockResponse(() => {
      const id = `exam-${Date.now()}`
      const pages = input.documents.reduce((s, d) => s + d.pages, 0) || 100
      const docId = `doc-${id}`
      const step = Math.ceil(pages / 5)
      const chapters = Array.from({ length: Math.ceil(pages / step) }, (_, i) => ({
        title: `Parte ${i + 1}`,
        from: i * step + 1,
        to: Math.min(pages, (i + 1) * step),
      }))
      documents.push({
        id: docId,
        examId: id,
        name: input.documents[0]?.name ?? `${input.name}.pdf`,
        kind: 'pdf',
        pages,
        studyablePages: pages,
        lastPage: 1,
        pagesRead: 0,
        chapters,
        updatedAt: TODAY,
        sizeLabel: '—',
      })
      const exam: Exam = {
        id,
        name: input.name,
        shortName: input.name.slice(0, 3).toUpperCase(),
        date: input.date,
        description: input.description,
        totalSlides: pages,
        slidesCompleted: 0,
        minutesStudied: 0,
        status: 'not-started',
        documentIds: [docId],
        startDate: input.startDate,
        reviewDays: input.reviewDays,
        unavailableDays: input.unavailableDays,
        availability: input.availability,
        createdAt: TODAY,
      }
      db.exams.push(exam)
      db.sessions.push(
        ...generatePlan({
          examId: id,
          startDate: input.startDate ?? addDays(TODAY, 1),
          examDate: input.date,
          startSlide: 1,
          endSlide: pages,
          availability: input.availability,
          unavailable: input.unavailableDays,
          reviewDays: input.reviewDays,
          chapters,
        }),
      )
      return exam
    }, 300)
  },
  delete: (id: string): Promise<void> => {
    if (!USE_MOCKS) return http.delete(`/exams/${id}`)
    return mockResponse(() => {
      const index = db.exams.findIndex((exam) => exam.id === id)
      if (index < 0) throw new Error('Esame non trovato')
      db.exams.splice(index, 1)
      for (let i = documents.length - 1; i >= 0; i--) if (documents[i].examId === id) documents.splice(i, 1)
      for (let i = db.sessions.length - 1; i >= 0; i--)
        if (db.sessions[i].examId === id) db.sessions.splice(i, 1)
    })
  },
}

export const planApi = {
  recalculate: (examId: string): Promise<StudySession[]> =>
    USE_MOCKS
      ? mockResponse(() => {
          redistribute(findExam(examId), TODAY, findExam(examId).slidesCompleted + 1)
          return db.sessions.filter((session) => session.examId === examId)
        })
      : http.post(`/exams/${examId}/plan/recalculate`),
  sessions: (examId?: string): Promise<StudySession[]> =>
    USE_MOCKS
      ? mockResponse(() =>
          db.sessions
            .filter((s) => !examId || s.examId === examId)
            .sort((a, b) => a.date.localeCompare(b.date)),
        )
      : http.get(`/sessions${examId ? `?examId=${examId}` : ''}`),

  today: (): Promise<TodayOverview> => {
    if (!USE_MOCKS) return http.get('/today')
    return mockResponse(() => {
      const exam = findExam('gps')
      const doc = documentFor(exam)
      const examSessions = db.sessions
        .filter((s) => s.examId === exam.id)
        .sort((a, b) => a.date.localeCompare(b.date))
      const session = examSessions.find((s) => s.date === TODAY) ?? null
      const upcoming = examSessions.filter((s) => s.date > TODAY && s.status !== 'unavailable').slice(0, 4)
      const remaining = exam.totalSlides - exam.slidesCompleted
      return {
        exam,
        session,
        document: doc,
        daysLeft: diffDays(exam.date, TODAY),
        plannedMinutes: session?.durationMin ?? 0,
        upcoming,
        progress: exam.slidesCompleted / exam.totalSlides,
        forecastDaysEarly: Math.min(4, forecastDaysEarly(examSessions, remaining, 17)),
        adjustment: db.adjustments.find((a) => a.examId === exam.id && !a.dismissed) ?? null,
      } satisfies TodayOverview
    })
  },

  toggleTask: (sessionId: string, taskId: string): Promise<StudySession> => {
    if (!USE_MOCKS) return http.patch(`/sessions/${sessionId}/tasks/${taskId}`)
    return mockResponse(() => {
      const session = db.sessions.find((s) => s.id === sessionId)
      if (!session) throw new Error('Sessione non trovata')
      const t = session.tasks.find((x) => x.id === taskId)
      if (t) t.done = !t.done
      return session
    }, 150)
  },

  /** Marks a session as skipped or partially completed and redistributes the rest of the material. */
  reportSession: (
    sessionId: string,
    outcome: 'completed' | 'partial' | 'skipped' | 'planned',
    slidesDone?: number,
  ): Promise<{ session: StudySession; adjustment: PlanAdjustment | null }> => {
    if (!USE_MOCKS) return http.post(`/sessions/${sessionId}/report`, { outcome, slidesDone })
    return mockResponse(() => {
      const session = db.sessions.find((s) => s.id === sessionId)
      if (!session || session.slideFrom === undefined || session.slideTo === undefined)
        throw new Error('Sessione non trovata')
      const exam = findExam(session.examId)
      const total = session.slideTo - session.slideFrom + 1
      const done =
        outcome === 'completed' ? total : outcome === 'skipped' ? 0 : Math.min(total, slidesDone ?? 0)
      const doc =
        documents.find((d) => d.id === session.materialId) ??
        documents.find((d) => d.examId === session.examId)
      const wasSkipped = session.status === 'skipped'
      if (doc) {
        let pages = reading[doc.id] ?? Array.from({ length: doc.pagesRead }, (_, i) => i + 1)
        if (outcome !== 'skipped' && !(outcome === 'planned' && wasSkipped)) {
          pages = pages.filter((p) => p < session.slideFrom! || p > session.slideTo!)
          for (let n = 0; n < (outcome === 'planned' ? 0 : done); n++) pages.push(session.slideFrom + n)
        }
        reading[doc.id] = pages
        doc.completedPages = [...pages]
        doc.pagesRead = pages.length
        exam.slidesCompleted = documents
          .filter((d) => d.examId === exam.id)
          .reduce((sum, d) => sum + d.pagesRead, 0)
      }
      session.status = outcome === 'skipped' ? 'skipped' : outcome
      session.slidesDone = doc
        ? (reading[doc.id] ?? []).filter((p) => p >= session.slideFrom! && p <= session.slideTo!).length
        : done
      session.tasks.forEach((t) => {
        if (t.kind === 'read' || t.kind === 'quiz') t.done = outcome === 'completed'
      })
      if (outcome === 'completed' || outcome === 'planned') return { session, adjustment: null }

      const missing = total - done
      const affected = redistribute(exam, session.date, session.slideFrom + done)
      const adjustment: PlanAdjustment = {
        id: `adj-${Date.now()}`,
        examId: exam.id,
        kind: 'redistributed',
        title: 'Piano aggiornato',
        message: `${missing} slide non completate sono state redistribuite nei prossimi giorni.`,
        plannedSlides: total,
        completedSlides: done,
        affectedSessions: affected,
        dismissed: false,
      }
      exam.status = 'adjusted'
      db.adjustments.unshift(adjustment)
      return { session, adjustment }
    }, 700)
  },

  adjustments: (): Promise<PlanAdjustment[]> =>
    USE_MOCKS ? mockResponse(() => db.adjustments.filter((a) => !a.dismissed)) : http.get('/adjustments'),

  resolveAdjustment: (id: string, action: 'apply' | 'keep' | 'dismiss'): Promise<void> => {
    if (!USE_MOCKS) return http.post(`/adjustments/${id}`, { action })
    return mockResponse(() => {
      const adj = db.adjustments.find((a) => a.id === id)
      if (!adj) return
      adj.dismissed = true
      if (action === 'apply' && adj.kind === 'behind') {
        const exam = findExam(adj.examId)
        db.sessions
          .filter((s) => s.examId === exam.id && s.status === 'planned')
          .slice(0, adj.affectedSessions ?? 0)
          .forEach((s) => {
            s.previousDurationMin = s.durationMin
            s.durationMin += adj.extraMinutes ?? 0
          })
        exam.status = 'on-track'
      }
    }, 400)
  },

  updateAvailability: (examId: string, availability: Exam['availability']): Promise<Exam> => {
    if (!USE_MOCKS) return http.patch(`/exams/${examId}/availability`, { availability })
    return mockResponse(() => {
      const exam = findExam(examId)
      exam.availability = availability
      redistribute(exam, TODAY, exam.slidesCompleted + 1)
      db.adjustments.filter((a) => a.examId === examId).forEach((a) => (a.dismissed = true))
      exam.status = 'on-track'
      return exam
    }, 600)
  },
}

export const studyApi = {
  analyze: (id: string): Promise<StudyDocument> =>
    USE_MOCKS
      ? mockResponse(() => {
          const doc = documents.find((d) => d.id === id)
          if (!doc) throw new Error('Documento non trovato')
          return doc
        })
      : http.post(`/documents/${id}/analyze`),
  selectPage: (id: string, page: number, studyable: boolean | null): Promise<StudyDocument> =>
    USE_MOCKS
      ? Promise.reject(new Error('La gestione delle pagine richiede il backend reale.'))
      : http.patch(`/documents/${id}/pages/${page}/selection`, { studyable }),
  inspectPdf: (file: File): Promise<{ name: string; pages: number; bytes: number }> =>
    USE_MOCKS
      ? file.arrayBuffer().then((buffer) => {
          const text = new TextDecoder('latin1').decode(buffer)
          return {
            name: file.name,
            pages: Math.max(1, text.match(/\/Type\s*\/Page\b/g)?.length ?? 1),
            bytes: file.size,
          }
        })
      : http.upload('/materials/inspect', file),
  uploadPdf: (examId: string, file: File): Promise<StudyDocument> =>
    USE_MOCKS
      ? Promise.reject(new Error('Avvia il backend per caricare PDF reali.'))
      : http.upload(`/exams/${examId}/materials`, file),
  pdf: (id: string) => http.blob(`/documents/${id}/file`),
  thumbnails: (id: string): Promise<import('../types').Slide[]> =>
    USE_MOCKS
      ? mockResponse(() => {
          const doc = documents.find((d) => d.id === id)
          if (!doc) throw new Error('Documento non trovato')
          return Array.from({ length: doc.pages }, (_, i) => getSlide(id, i + 1))
        }, 80)
      : http.get(`/documents/${id}/thumbnails`),
  slide: (id: string, page: number) =>
    USE_MOCKS
      ? mockResponse(() => getSlide(id, page), 20)
      : http.get<import('../types').Slide>(`/documents/${id}/pages/${page}`),
  search: (id: string, query: string): Promise<{ page: number; title: string }[]> =>
    USE_MOCKS
      ? mockResponse(() => {
          const doc = documents.find((d) => d.id === id)
          if (!doc || !query.trim()) return []
          return Array.from({ length: doc.pages }, (_, i) => getSlide(id, i + 1))
            .filter((s) => slideToText(s).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
            .map((s) => ({ page: s.number, title: s.title }))
        }, 80)
      : http.get(`/documents/${id}/search?q=${encodeURIComponent(query)}`),
  uncompletePage: (id: string, page: number): Promise<void> =>
    USE_MOCKS
      ? mockResponse(() => {
          const doc = documents.find((d) => d.id === id)
          if (!doc) throw new Error('Documento non trovato')
          reading[id] = (reading[id] ?? Array.from({ length: doc.pagesRead }, (_, i) => i + 1)).filter(
            (p) => p !== page,
          )
          doc.completedPages = reading[id]
          doc.pagesRead = reading[id].length
          db.sessions
            .filter(
              (s) =>
                (s.materialId === id || (!s.materialId && s.examId === doc.examId)) &&
                s.slideFrom !== undefined &&
                page >= s.slideFrom &&
                page <= s.slideTo!,
            )
            .forEach((s) => {
              s.slidesDone = reading[id].filter((p) => p >= s.slideFrom! && p <= s.slideTo!).length
              s.nextPage = page
              if (s.status === 'completed') s.status = 'planned'
              s.tasks
                .filter((t) => t.kind === 'read' || t.kind === 'concepts')
                .forEach((t) => {
                  t.done = false
                })
            })
          findExam(doc.examId).slidesCompleted = documents
            .filter((d) => d.examId === doc.examId)
            .reduce((sum, d) => sum + d.pagesRead, 0)
        })
      : http.delete(`/documents/${id}/pages/${page}/complete`),
  completePage: (id: string, page: number, sessionId?: string): Promise<void> =>
    USE_MOCKS
      ? mockResponse(() => {
          const doc = documents.find((d) => d.id === id)
          if (!doc || !Number.isInteger(page) || page < 1 || page > doc.pages)
            throw new Error('Pagina non valida')
          const pages = (reading[id] ??= Array.from({ length: doc.pagesRead }, (_, i) => i + 1))
          if (!pages.includes(page)) {
            pages.push(page)
            doc.completedPages = [...pages]
            doc.pagesRead = pages.length
            const exam = findExam(doc.examId)
            exam.slidesCompleted = documents
              .filter((d) => d.examId === exam.id)
              .reduce((sum, d) => sum + d.pagesRead, 0)
            db.stats.weekSlides += 1
            const day = db.stats.daily.find((d) => d.date === TODAY)
            if (day) day.slides += 1
            const actual = db.stats.planVsActual.find((d) => d.date === TODAY)
            if (actual && doc.examId === 'gps') actual.actual = exam.slidesCompleted
          }
          const session = db.sessions.find(
            (s) => (sessionId ? s.id === sessionId : s.date === TODAY) && s.examId === doc.examId,
          )
          if (session?.slideFrom && session.slideTo) {
            session.slidesDone = pages.filter((p) => p >= session.slideFrom! && p <= session.slideTo!).length
            session.nextPage =
              Array.from(
                { length: session.slideTo - session.slideFrom + 1 },
                (_, i) => session.slideFrom! + i,
              ).find((p) => !pages.includes(p)) ?? session.slideTo
            const done = session.slidesDone >= session.slideTo - session.slideFrom + 1
            session.tasks
              .filter((t) => t.kind === 'read' || t.kind === 'concepts')
              .forEach((t) => {
                t.done = done
              })
            if (done && session.tasks.every((t) => t.done)) session.status = 'completed'
          }
        }, 40)
      : http.post(`/documents/${id}/pages/${page}/complete`, { sessionId }),
  log: (input: Omit<StudySessionLog, 'id' | 'date'>): Promise<void> =>
    USE_MOCKS
      ? mockResponse(() => {
          db.sessionLogs.unshift({ ...input, id: crypto.randomUUID(), date: TODAY })
          findExam(input.examId).minutesStudied += input.minutes
          db.stats.weekMinutes += input.minutes
          const day = db.stats.daily.find((d) => d.date === TODAY)
          if (day) day.studiedMin += input.minutes
        }, 30)
      : http.post('/study-logs', input),
  documents: (): Promise<StudyDocument[]> =>
    USE_MOCKS ? mockResponse(() => documents) : http.get('/documents'),
  document: (id: string): Promise<StudyDocument> =>
    USE_MOCKS
      ? mockResponse(() => {
          const d = documents.find((x) => x.id === id)
          if (!d) throw new Error('Documento non trovato')
          return d
        }, 250)
      : http.get(`/documents/${id}`),
  logs: (): Promise<StudySessionLog[]> =>
    USE_MOCKS ? mockResponse(() => db.sessionLogs) : http.get('/study-logs'),

  /** Navigation only: completing a page is an explicit, idempotent operation. */
  savePosition: (id: string, page: number): Promise<StudyDocument> => {
    if (!USE_MOCKS) return http.patch(`/documents/${id}/position`, { page })
    return mockResponse(() => {
      const d = documents.find((x) => x.id === id)
      if (!d) throw new Error('Documento non trovato')
      d.lastPage = Math.max(1, Math.min(d.pages, Math.floor(page) || 1))
      return d
    }, 120)
  },
}

export const masteryApi = {
  list: (examId?: string): Promise<MasteryTopic[]> =>
    USE_MOCKS
      ? mockResponse(() => db.mastery.filter((m) => !examId || m.examId === examId))
      : http.get(`/mastery${examId ? `?examId=${examId}` : ''}`),
}

export const quizApi = {
  get: (examId: string): Promise<QuizQuestion[]> =>
    USE_MOCKS ? mockResponse(() => questionsFor(examId), 500) : http.get(`/exams/${examId}/quiz`),
  submit: (examId: string, answers: QuizAnswer[]): Promise<MasteryTopic[]> => {
    if (!USE_MOCKS) return http.post(`/exams/${examId}/quiz`, { answers })
    return mockResponse(() => {
      const questions = questionsFor(examId)
      quizResults.push({ correct: answers.filter((a) => a.correct).length, total: answers.length })
      const count = quizResults.reduce((n, r) => n + r.total, 0)
      db.stats.quizAccuracy = count
        ? Math.round((100 * quizResults.reduce((n, r) => n + r.correct, 0)) / count)
        : 0
      const session = db.sessions.find((s) => s.examId === examId && s.date === TODAY)
      session?.tasks
        .filter((t) => t.kind === 'quiz')
        .forEach((t) => {
          t.done = true
        })
      if (session?.tasks.every((t) => t.done)) session.status = 'completed'
      for (const topic of db.mastery.filter((m) => m.examId === examId)) {
        const related = answers.filter(
          (a) => questions.find((q) => q.id === a.questionId)?.topicId === topic.id,
        )
        if (!related.length) continue
        const ratio = related.filter((a) => a.correct).length / related.length
        const next = Math.round(topic.score * 0.6 + ratio * 100 * 0.4)
        topic.trend = next > topic.score ? 'up' : next < topic.score ? 'down' : 'flat'
        topic.score = next
        topic.needsReview = next < 60
        topic.attempts += related.length
      }
      scheduleReviews(examId)
      return db.mastery.filter((m) => m.examId === examId)
    }, 500)
  },
}

export const flashcardsApi = {
  rate: (examId: string, cardId: string, rating: import('../types').FlashcardRating): Promise<void> =>
    USE_MOCKS
      ? mockResponse(() => {
          const card = cardsFor(examId).find((c) => c.id === cardId)
          if (!card) throw new Error('Flashcard non trovata')
          let topic = db.mastery.find((t) => t.examId === examId && t.name === card.topic)
          if (!topic) {
            topic = {
              id: `${examId}-${card.id}`,
              examId,
              name: card.topic,
              score: 0,
              trend: 'flat',
              needsReview: true,
              slideFrom: card.slideRef,
              slideTo: card.slideRef,
              attempts: 0,
            }
            db.mastery.push(topic)
          }
          const score = Math.round(topic.score * 0.7 + { unknown: 0, hard: 45, known: 100 }[rating] * 0.3)
          topic.trend = score > topic.score ? 'up' : score < topic.score ? 'down' : 'flat'
          topic.score = score
          topic.attempts++
          topic.needsReview = score < 60
          scheduleReviews(examId)
        }, 100)
      : http.post(`/exams/${examId}/flashcards/${cardId}/ratings`, { rating }),
  get: (examId: string): Promise<Flashcard[]> =>
    USE_MOCKS ? mockResponse(() => cardsFor(examId)) : http.get(`/exams/${examId}/flashcards`),
}

export const studyPackageApi = {
  list: (): Promise<StudyPackage[]> =>
    USE_MOCKS ? mockResponse(() => allPackages(), 100) : http.get('/study-packages'),
  forExam: (examId: string): Promise<StudyPackage> =>
    USE_MOCKS ? mockResponse(() => packageForExam(examId), 80) : http.get(`/study-packages/exams/${examId}`),
  forMaterial: (materialId: string): Promise<StudyPackage> =>
    USE_MOCKS
      ? mockResponse(() => {
          const pkg = packageForMaterial(materialId)
          if (!pkg) throw new Error('Study Package non trovato')
          return pkg
        }, 80)
      : http.get(`/study-packages/materials/${materialId}`),
  preview: (source: string): Promise<{ package: StudyPackage; summary: StudyPackageSummary }> =>
    USE_MOCKS
      ? mockResponse(() => {
          const pkg = parseStudyPackage(source)
          const current = packageRevision(pkg.packageId)
          if (current !== undefined && pkg.revision < current)
            throw new Error(`La revisione ${pkg.revision} è precedente alla revisione installata ${current}.`)
          return { package: pkg, summary: summarizeStudyPackage(pkg, current) }
        }, 80)
      : http
          .post<{ studyPackage: StudyPackage; summary: StudyPackageSummary }>(
            '/study-packages/preview',
            parseStudyPackage(source),
          )
          .then((result) => ({ package: result.studyPackage, summary: result.summary })),
  import: (
    pkg: StudyPackage,
    examId?: string,
    materialMap?: Record<string, string>,
  ): Promise<StudyPackageSummary> => {
    if (!USE_MOCKS)
      return http.post(
        `/study-packages/import${examId ? `?examId=${encodeURIComponent(examId)}` : ''}${materialMap && examId ? `&materialMap=${encodeURIComponent(JSON.stringify(materialMap))}` : ''}`,
        pkg,
      )
    return mockResponse(() => {
      const current = packageRevision(pkg.packageId)
      if (current !== undefined && pkg.revision < current)
        throw new Error(`La revisione ${pkg.revision} è precedente alla revisione installata ${current}.`)
      const existingExam = db.exams.find((exam) => exam.id === pkg.exam.id)
      const studyable = (materialId?: string) =>
        pkg.topics.filter(
          (topic) =>
            (!materialId || topic.materialId === materialId) &&
            (topic.pageType ?? 'content') === 'content' &&
            (topic.studyable ?? true),
        )
      const studyableCount = (materialId?: string) =>
        studyable(materialId).reduce((sum, topic) => sum + topic.slideRange.to - topic.slideRange.from + 1, 0)
      const totalSlides = studyableCount()
      if (existingExam) {
        existingExam.name = pkg.exam.name
        existingExam.description = pkg.exam.description
        existingExam.totalSlides = totalSlides
        if (pkg.exam.examDate) existingExam.date = pkg.exam.examDate
        existingExam.documentIds = pkg.materials.map((material) => material.id)
      } else {
        const examDate = pkg.exam.examDate ?? addDays(TODAY, 30)
        const availability: Exam['availability'] = { 0: 0, 1: 90, 2: 60, 3: 90, 4: 60, 5: 90, 6: 0 }
        const exam: Exam = {
          id: pkg.exam.id,
          name: pkg.exam.name,
          shortName: pkg.exam.name.slice(0, 3).toUpperCase(),
          date: examDate,
          description: pkg.exam.description,
          totalSlides,
          slidesCompleted: 0,
          minutesStudied: 0,
          status: 'not-started',
          documentIds: pkg.materials.map((material) => material.id),
          reviewDays: 4,
          unavailableDays: [],
          availability,
          createdAt: TODAY,
        }
        db.exams.push(exam)
        const primary = pkg.materials[0]
        db.sessions.push(
          ...generatePlan({
            examId: exam.id,
            startDate: addDays(TODAY, 1),
            examDate,
            startSlide: 1,
            endSlide: primary.pageCount,
            availability,
            unavailable: [],
            reviewDays: 4,
            chapters: topicsAsChapters(pkg, primary.id),
            topicMetadata: pkg.topics.filter((topic) => topic.materialId === primary.id),
          }),
        )
      }
      for (const material of pkg.materials) {
        const existing = documents.find((document) => document.id === material.id)
        const chapters = topicsAsChapters(pkg, material.id)
        if (existing) {
          existing.name = material.name
          existing.kind = material.type === 'slides' ? 'slides' : 'pdf'
          existing.pages = material.pageCount
          existing.studyablePages = studyableCount(material.id)
          existing.lastPage = Math.min(existing.lastPage, material.pageCount)
          existing.pagesRead = Math.min(existing.pagesRead, material.pageCount)
          existing.chapters = chapters
          existing.updatedAt = TODAY
        } else {
          documents.push({
            id: material.id,
            examId: pkg.exam.id,
            name: material.name,
            kind: material.type === 'slides' ? 'slides' : 'pdf',
            pages: material.pageCount,
            studyablePages: studyableCount(material.id),
            lastPage: 1,
            pagesRead: 0,
            chapters,
            updatedAt: TODAY,
            sizeLabel: 'Study Package',
          })
        }
      }
      for (const topic of studyable()) {
        if (!db.mastery.some((item) => item.id === topic.id))
          db.mastery.push({
            id: topic.id,
            examId: pkg.exam.id,
            name: topic.name,
            score: 0,
            trend: 'flat',
            needsReview: true,
            slideFrom: topic.slideRange.from,
            slideTo: topic.slideRange.to,
            attempts: 0,
          })
      }
      applyPackageMetadataToSessions(pkg)
      savePackage(pkg)
      return summarizeStudyPackage(pkg, current)
    }, 250)
  },
}

export const examSimulationApi = {
  submit: (
    examId: string,
    questionId: string,
    answer: string,
    rating: 0 | 60 | 100,
  ): Promise<MasteryTopic> => {
    if (!USE_MOCKS) return http.post(`/exams/${examId}/simulation`, { questionId, answer, rating })
    return mockResponse(() => {
      const pkg = packageForExam(examId)
      const question = pkg.examQuestions.find((item) => item.id === questionId)
      if (!question) throw new Error('Domanda d’esame non trovata')
      let topic = db.mastery.find((item) => item.id === question.topicId)
      const packageTopic = pkg.topics.find((item) => item.id === question.topicId)!
      if (!topic) {
        topic = {
          id: packageTopic.id,
          examId,
          name: packageTopic.name,
          score: 0,
          trend: 'flat',
          needsReview: true,
          slideFrom: packageTopic.slideRange.from,
          slideTo: packageTopic.slideRange.to,
          attempts: 0,
        }
        db.mastery.push(topic)
      }
      const next = Math.round(topic.score * 0.7 + rating * 0.3)
      topic.trend = next > topic.score ? 'up' : next < topic.score ? 'down' : 'flat'
      topic.score = next
      topic.attempts += 1
      topic.needsReview = next < 60
      examSimulationResults.push({ examId, questionId, rating, answer, date: TODAY })
      scheduleReviews(examId)
      return topic
    }, 120)
  },
}

export const statsApi = {
  get: (): Promise<StatsOverview> =>
    USE_MOCKS
      ? mockResponse(() => {
          const tasks = db.sessions.filter((s) => s.date <= TODAY).flatMap((s) => s.tasks)
          return {
            ...db.stats,
            taskCompletion: tasks.length
              ? Math.round((100 * tasks.filter((t) => t.done).length) / tasks.length)
              : 0,
          }
        }, 500)
      : http.get('/stats'),
}

export const notificationsApi = {
  list: (): Promise<AppNotification[]> =>
    USE_MOCKS ? mockResponse(() => db.notifications, 200) : http.get('/notifications'),
  markAllRead: (): Promise<void> =>
    USE_MOCKS
      ? mockResponse(() => db.notifications.forEach((n) => (n.read = true)), 100)
      : http.post('/notifications/read'),
}

export const settingsApi = {
  get: (): Promise<typeof preferences> =>
    USE_MOCKS ? mockResponse(() => preferences, 50) : http.get('/settings'),
  update: (input: typeof preferences): Promise<typeof preferences> =>
    USE_MOCKS ? mockResponse(() => Object.assign(preferences, input), 50) : http.patch('/settings', input),
}

function scheduleReviews(examId: string) {
  const future = db.sessions.find(
    (s) => s.examId === examId && s.date > TODAY && ['planned', 'rescheduled'].includes(s.status),
  )
  if (!future) return
  for (const topic of db.mastery.filter((t) => t.examId === examId && t.needsReview)) {
    if (
      db.sessions.some(
        (s) =>
          s.examId === examId &&
          s.date > TODAY &&
          s.tasks.some((t) => t.id.endsWith(`-mastery-${topic.id}`) && !t.done),
      )
    )
      continue
    future.tasks.push({
      id: `${future.id}-mastery-${topic.id}`,
      kind: 'mastery',
      label: `Ripasso ${topic.name}`,
      durationMin: 15,
      done: false,
      meta: `Slide ${topic.slideFrom}–${topic.slideTo}`,
    })
    future.durationMin += 15
  }
}

function questionsFor(examId: string): QuizQuestion[] {
  const pkg = packageForExam(findExam(examId).id)
  return pkg.quizzes.map((quiz) =>
    packageQuizToQuestion(
      quiz,
      pkg.topics.find((topic) => topic.id === quiz.topicId)!,
    ),
  )
}
function cardsFor(examId: string): Flashcard[] {
  const pkg = packageForExam(findExam(examId).id)
  return pkg.flashcards.map((card) =>
    packageFlashcardToCard(
      card,
      pkg.topics.find((topic) => topic.id === card.topicId)!,
    ),
  )
}

function topicsAsChapters(pkg: StudyPackage, materialId: string) {
  return pkg.topics
    .filter((topic) => topic.materialId === materialId)
    .map((topic) => ({ title: topic.name, from: topic.slideRange.from, to: topic.slideRange.to }))
}

function applyPackageMetadataToSessions(pkg: StudyPackage) {
  for (const session of db.sessions.filter(
    (item) => item.examId === pkg.exam.id && item.date >= TODAY && item.slideFrom && item.slideTo,
  )) {
    const topics = pkg.topics.filter(
      (topic) => topic.slideRange.from <= session.slideTo! && topic.slideRange.to >= session.slideFrom!,
    )
    if (!topics.length) continue
    session.topic = topics.map((topic) => topic.name).join(' · ')
    const estimated = topics.reduce((minutes, topic) => {
      const overlap = Math.max(
        0,
        Math.min(session.slideTo!, topic.slideRange.to) -
          Math.max(session.slideFrom!, topic.slideRange.from) +
          1,
      )
      return minutes + (topic.estimatedMinutes * overlap) / (topic.slideRange.to - topic.slideRange.from + 1)
    }, 0)
    const priority =
      topics.reduce((sum, topic) => sum + (topic.difficulty + topic.importance) / 10, 0) / topics.length
    const studyMinutes = Math.max(5, Math.round((estimated * (0.8 + priority * 0.4)) / 5) * 5)
    const read = session.tasks.find((task) => task.kind === 'read')
    if (read) read.durationMin = studyMinutes
    session.durationMin = session.tasks.reduce((sum, task) => sum + task.durationMin, 0)
  }
}
