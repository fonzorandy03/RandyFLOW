'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import {
  examsApi,
  flashcardsApi,
  masteryApi,
  notificationsApi,
  planApi,
  quizApi,
  statsApi,
  studyApi,
  userApi,
} from './api/services'

export const keys = {
  me: 'me',
  exams: 'exams',
  today: 'today',
  sessions: (examId?: string) => ['sessions', examId ?? 'all'] as const,
  documents: 'documents',
  document: (id: string) => ['document', id] as const,
  logs: 'logs',
  mastery: (examId?: string) => ['mastery', examId ?? 'all'] as const,
  quiz: (examId: string) => ['quiz', examId] as const,
  flashcards: (examId: string) => ['flashcards', examId] as const,
  stats: 'stats',
  notifications: 'notifications',
  adjustments: 'adjustments',
  studyPackage: (examId: string) => ['study-package', examId] as const,
}

const once = { revalidateOnFocus: false }

export const useStudent = () => useSWR(keys.me, userApi.me, once)
export const useExams = () => useSWR(keys.exams, examsApi.list, once)
export const useToday = () => useSWR(keys.today, planApi.today, once)
export const useSessions = (examId?: string) =>
  useSWR(keys.sessions(examId), () => planApi.sessions(examId), once)
export const useDocuments = () => useSWR(keys.documents, studyApi.documents, once)
export const useDocument = (id: string) => useSWR(keys.document(id), () => studyApi.document(id), once)
export const useStudyLogs = () => useSWR(keys.logs, studyApi.logs, once)
export const useMastery = (examId?: string) =>
  useSWR(keys.mastery(examId), () => masteryApi.list(examId), once)
export const useQuiz = (examId: string) => useSWR(keys.quiz(examId), () => quizApi.get(examId), once)
export const useFlashcards = (examId: string) =>
  useSWR(keys.flashcards(examId), () => flashcardsApi.get(examId), once)
export const useStats = () => useSWR(keys.stats, statsApi.get, once)
export const useNotifications = () => useSWR(keys.notifications, notificationsApi.list, once)
export const useAdjustments = () => useSWR(keys.adjustments, planApi.adjustments, once)

/** Revalidates every cache entry that depends on the study plan. */
export function refreshPlanData() {
  return globalMutate(
    (key) =>
      key === keys.today ||
      key === keys.exams ||
      key === keys.adjustments ||
      key === keys.documents ||
      key === keys.stats ||
      key === keys.logs ||
      (Array.isArray(key) && ['sessions', 'mastery', 'document'].includes(key[0])),
  )
}
