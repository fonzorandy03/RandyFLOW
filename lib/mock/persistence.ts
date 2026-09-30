import { configureMockStore } from '../api/http'
import * as db from './db'
import { DOCUMENTS } from './documents'

export const preferences = {
  sessionMinutes: 25,
  breakMinutes: 5,
  notifications: true,
  autoBreak: true,
  explanationLevel: 'Normale',
}
export const reading: Record<string, number[]> = {}
export const quizResults: { correct: number; total: number }[] = []
export const examSimulationResults: {
  examId: string
  questionId: string
  rating: number
  answer: string
  date: string
}[] = []
const store = {
  student: db.student,
  exams: db.exams,
  sessions: db.sessions,
  mastery: db.mastery,
  adjustments: db.adjustments,
  documents: DOCUMENTS,
  logs: db.sessionLogs,
  notifications: db.notifications,
  stats: db.stats,
  preferences,
  reading,
  quizResults,
  examSimulationResults,
}
let hydrated = false
configureMockStore(
  () => {
    if (hydrated || typeof window === 'undefined') return
    hydrated = true
    try {
      const saved = JSON.parse(localStorage.getItem('randyflow-demo-v1') ?? 'null')
      if (!saved || saved.version !== 1) return
      for (const [key, target] of Object.entries(store)) {
        const value = saved.data?.[key]
        if (Array.isArray(target) && Array.isArray(value)) target.splice(0, target.length, ...value)
        else if (!Array.isArray(target) && value && typeof value === 'object' && !Array.isArray(value))
          Object.assign(target, value)
      }
    } catch {
      /* An invalid saved demo starts from the seed. */
    }
  },
  () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('randyflow-demo-v1', JSON.stringify({ version: 1, data: store }))
    } catch {
      /* Reading remains available if browser storage is full or disabled. */
    }
  },
)
