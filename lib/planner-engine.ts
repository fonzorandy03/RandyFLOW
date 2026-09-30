import { addDays, dateRange, weekday } from './date'
import type {
  Availability,
  Chapter,
  ISODate,
  MasteryTopic,
  StudyPackageTopic,
  StudySession,
  StudyTask,
} from './types'

export const MINUTES_PER_SLIDE = 25 / 6

export interface PlanConfig {
  examId: string
  startDate: ISODate
  examDate: ISODate
  startSlide: number
  endSlide: number
  availability: Availability
  unavailable: ISODate[]
  reviewDays: number
  chapters: Chapter[]
  weakTopics?: MasteryTopic[]
  topicMetadata?: StudyPackageTopic[]
  idPrefix?: string
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

export function chapterFor(chapters: Chapter[], slide: number): Chapter | undefined {
  return chapters.find((c) => slide >= c.from && slide <= c.to)
}

const CONCEPTS: Record<string, string> = {
  'Introduzione al Project Management': 'Comprendi ruoli, vincoli e stakeholder',
  'Ciclo di vita e metodologie': 'Confronta Waterfall, Spirale e Agile',
  'Valutazione economica dei progetti': 'Comprendi VAN, attualizzazione e WACC',
  'Pianificazione: WBS e Project Scheduling': 'Comprendi WBS e Project Scheduling',
  'Stima di costi ed effort': 'Comprendi COCOMO e Function Point',
  'Risk Management': 'Comprendi identificazione e mitigazione dei rischi',
  'Gestione del team e comunicazione': 'Comprendi RACI e piano di comunicazione',
  'Monitoraggio e controllo (EVM)': 'Comprendi Earned Value, CPI e SPI',
  'Chiusura del progetto e casi di studio': 'Collega i concetti ai casi di studio',
}

function studyTasks(
  id: string,
  from: number,
  to: number,
  chapter: Chapter | undefined,
  isFirst: boolean,
  topicMetadata?: StudyPackageTopic[],
): StudyTask[] {
  const matching =
    topicMetadata?.filter((topic) => topic.slideRange.from <= to && topic.slideRange.to >= from) ?? []
  const packageMinutes = matching.reduce((minutes, topic) => {
    const overlap = Math.max(0, Math.min(to, topic.slideRange.to) - Math.max(from, topic.slideRange.from) + 1)
    const base = (topic.estimatedMinutes * overlap) / (topic.slideRange.to - topic.slideRange.from + 1)
    return minutes + base * (0.8 + ((topic.difficulty + topic.importance) / 10) * 0.4)
  }, 0)
  const readMin = round5(packageMinutes || (to - from + 1) * MINUTES_PER_SLIDE)
  const tasks: StudyTask[] = [
    {
      id: `${id}-read`,
      kind: 'read',
      label: `Studia slide ${from}–${to}`,
      durationMin: readMin,
      done: false,
    },
  ]
  if (chapter) {
    tasks.push({
      id: `${id}-concepts`,
      kind: 'concepts',
      label: CONCEPTS[chapter.title] ?? `Comprendi ${chapter.title}`,
      durationMin: 0,
      done: false,
    })
  }
  if (!isFirst) {
    tasks.push({
      id: `${id}-review`,
      kind: 'review',
      label: 'Ripasso argomenti di ieri',
      durationMin: 15,
      done: false,
    })
  }
  tasks.push({
    id: `${id}-quiz`,
    kind: 'quiz',
    label: 'Quiz finale — 10 domande',
    durationMin: 10,
    done: false,
  })
  return tasks
}

/**
 * Distributes the remaining material over available days, keeping
 * unavailable days and the final review window untouched.
 */
export function generatePlan(cfg: PlanConfig): StudySession[] {
  const prefix = cfg.idPrefix ?? cfg.examId
  const reviewStart = addDays(cfg.examDate, -cfg.reviewDays)
  const days = dateRange(cfg.startDate, addDays(cfg.examDate, -1))
  const unavailable = new Set(cfg.unavailable)

  const studyDays = days.filter(
    (d) => d < reviewStart && !unavailable.has(d) && (cfg.availability[weekday(d)] ?? 0) > 0,
  )
  const totalWeight = studyDays.reduce((s, d) => s + cfg.availability[weekday(d)], 0)
  const totalSlides = Math.max(0, cfg.endSlide - cfg.startSlide + 1)

  const sessions: StudySession[] = []
  let cursor = cfg.startSlide
  let accWeight = 0
  let weakIndex = 0
  const weak = (cfg.weakTopics ?? []).filter((t) => t.needsReview)

  for (const date of days) {
    const id = `${prefix}-${date}`
    if (unavailable.has(date)) {
      sessions.push({ id, examId: cfg.examId, date, status: 'unavailable', durationMin: 0, tasks: [] })
      continue
    }
    if (date >= reviewStart) {
      const idx = sessions.filter((s) => s.status === 'review').length
      const perDay = Math.ceil(cfg.chapters.length / cfg.reviewDays)
      const group = cfg.chapters.slice(idx * perDay, idx * perDay + perDay)
      const minutes = Math.max(60, cfg.availability[weekday(date)] || 90)
      sessions.push({
        id,
        examId: cfg.examId,
        date,
        status: 'review',
        topic: 'Ripasso finale',
        slideFrom: group[0]?.from,
        slideTo: group[group.length - 1]?.to,
        durationMin: minutes,
        tasks: [
          ...group.map((c, i) => ({
            id: `${id}-r${i}`,
            kind: 'review' as const,
            label: `Ripasso · ${c.title}`,
            durationMin: round5((minutes - 20) / Math.max(1, group.length)),
            done: false,
          })),
          {
            id: `${id}-quiz`,
            kind: 'quiz',
            label: 'Simulazione d’esame — 15 domande',
            durationMin: 20,
            done: false,
          },
        ],
      })
      continue
    }
    const minutes = cfg.availability[weekday(date)] ?? 0
    if (minutes === 0 || cursor > cfg.endSlide) continue

    accWeight += minutes
    const target = cfg.startSlide - 1 + Math.round((accWeight / totalWeight) * totalSlides)
    const to = Math.min(cfg.endSlide, Math.max(cursor, target))
    const chapter = chapterFor(cfg.chapters, cursor)
    const tasks = studyTasks(
      id,
      cursor,
      to,
      chapter,
      sessions.every((s) => s.status !== 'planned'),
      cfg.topicMetadata,
    )

    if (weak[weakIndex] && sessions.filter((s) => s.status === 'planned').length === 1) {
      const t = weak[weakIndex++]
      tasks.splice(1, 0, {
        id: `${id}-mastery-${t.id}`,
        kind: 'mastery',
        label: `Ripasso ${t.name}`,
        durationMin: 15,
        done: false,
        meta: `Slide ${t.slideFrom}–${t.slideTo}`,
      })
    }

    sessions.push({
      id,
      examId: cfg.examId,
      date,
      status: 'planned',
      topic: chapter?.title,
      slideFrom: cursor,
      slideTo: to,
      durationMin: tasks.reduce((s, t) => s + t.durationMin, 0),
      tasks,
    })
    cursor = to + 1
  }

  sessions.push({
    id: `${prefix}-exam`,
    examId: cfg.examId,
    date: cfg.examDate,
    status: 'exam',
    topic: 'Esame',
    durationMin: 0,
    tasks: [],
  })

  return sessions
}

/** Number of free study days left before the review window if the student keeps the given pace. */
export function forecastDaysEarly(
  sessions: StudySession[],
  remainingSlides: number,
  slidesPerDayPace: number,
): number {
  const future = sessions.filter((s) => s.status === 'planned')
  const needed = Math.ceil(remainingSlides / Math.max(1, slidesPerDayPace))
  return Math.max(0, future.length - needed)
}
