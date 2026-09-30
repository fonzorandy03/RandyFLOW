export type ISODate = string

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Minutes available per weekday (0 = Sunday). */
export type Availability = Record<Weekday, number>

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  university: string
  course: string
  year: string
  initials: string
}

export type ExamStatus = 'on-track' | 'adjusted' | 'behind' | 'not-started'

export interface Exam {
  id: string
  name: string
  shortName: string
  date: ISODate
  description?: string
  totalSlides: number
  slidesCompleted: number
  minutesStudied: number
  status: ExamStatus
  documentIds: string[]
  reviewDays: number
  unavailableDays: ISODate[]
  availability: Availability
  createdAt: ISODate
}

export type SessionStatus =
  'planned' | 'completed' | 'partial' | 'skipped' | 'rescheduled' | 'review' | 'unavailable' | 'exam'

export type TaskKind = 'read' | 'concepts' | 'review' | 'quiz' | 'mastery'

export interface StudyTask {
  id: string
  kind: TaskKind
  label: string
  durationMin: number
  done: boolean
  meta?: string
}

export interface StudySession {
  id: string
  examId: string
  date: ISODate
  status: SessionStatus
  topic?: string
  slideFrom?: number
  slideTo?: number
  slidesDone?: number
  nextPage?: number
  durationMin: number
  previousDurationMin?: number
  tasks: StudyTask[]
  note?: string
}

export interface Chapter {
  title: string
  from: number
  to: number
}

export interface StudyDocument {
  id: string
  examId: string
  name: string
  kind: 'pdf' | 'slides'
  pages: number
  lastPage: number
  pagesRead: number
  chapters: Chapter[]
  updatedAt: ISODate
  sizeLabel: string
}

export type SlideKind = 'title' | 'bullets' | 'formula' | 'diagram' | 'table'

export interface Slide {
  number: number
  chapter: string
  title: string
  kind: SlideKind
  subtitle?: string
  bullets?: string[]
  formula?: string
  formulaCaption?: string
  diagram?: { label: string; children?: string[] }[]
  table?: { head: string[]; rows: string[][] }
  footnote?: string
}

export interface MasteryTopic {
  id: string
  examId: string
  name: string
  score: number
  trend: 'up' | 'down' | 'flat'
  needsReview: boolean
  slideFrom: number
  slideTo: number
  attempts: number
}

export interface QuizQuestion {
  id: string
  type: 'multiple' | 'open'
  prompt: string
  options?: string[]
  correctIndex?: number
  acceptedKeywords?: string[]
  modelAnswer?: string
  explanation: string
  slideRef: number
  topicId: string
  topicName: string
}

export interface QuizAnswer {
  questionId: string
  correct: boolean
  given: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
  slideRef: number
  topic: string
}

export type FlashcardRating = 'unknown' | 'hard' | 'known'

export type StudyDifficulty = 1 | 2 | 3 | 4 | 5

export interface SlideRange {
  from: number
  to: number
}

export interface StudyPackageExam {
  id: string
  name: string
  description?: string
  examDate?: ISODate
}

export interface StudyPackageMaterial {
  id: string
  name: string
  type: 'pdf' | 'slides' | 'notes'
  pageCount: number
}

export interface StudyPackageTopic {
  id: string
  materialId: string
  name: string
  pageType?: 'content' | 'cover' | 'index' | 'section-divider' | 'blank' | 'references' | 'exercise'
  slideRange: SlideRange
  difficulty: StudyDifficulty
  importance: StudyDifficulty
  estimatedMinutes: number
  explanations: { simple: string; normal: string; deep: string }
  summary: string
  keyConcepts: string[]
  examples: string[]
  quizIds: string[]
  flashcardIds: string[]
  examQuestionIds: string[]
}

export interface StudyPackageQuiz {
  id: string
  topicId: string
  type: 'multiple' | 'open'
  prompt: string
  options?: string[]
  correctAnswer: string | number
  acceptedKeywords?: string[]
  explanation: string
  slideRefs: number[]
}

export interface StudyPackageFlashcard {
  id: string
  topicId: string
  front: string
  back: string
  slideRefs: number[]
}

export interface StudyPackageExamQuestion {
  id: string
  topicId: string
  prompt: string
  modelAnswer: string
  evaluationCriteria: string[]
  slideRefs: number[]
}

export interface StudyPackage {
  format: 'randyflow-study-package'
  version: '1.0'
  packageId: string
  revision: number
  generatedAt: string
  language: string
  exam: StudyPackageExam
  materials: StudyPackageMaterial[]
  topics: StudyPackageTopic[]
  quizzes: StudyPackageQuiz[]
  flashcards: StudyPackageFlashcard[]
  examQuestions: StudyPackageExamQuestion[]
}

export interface StudyPackageSummary {
  packageId: string
  revision: number
  examId: string
  examName: string
  materialCount: number
  topicCount: number
  quizCount: number
  flashcardCount: number
  examQuestionCount: number
  isUpdate: boolean
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  kind: 'plan' | 'reminder' | 'mastery' | 'system'
}

export interface PlanAdjustment {
  id: string
  examId: string
  kind: 'redistributed' | 'behind'
  title: string
  message: string
  plannedSlides?: number
  completedSlides?: number
  beforeMin?: number
  afterMin?: number
  extraMinutes?: number
  affectedSessions?: number
  dismissed: boolean
}

export interface TodayOverview {
  exam: Exam
  session: StudySession | null
  daysLeft: number
  plannedMinutes: number
  upcoming: StudySession[]
  progress: number
  forecastDaysEarly: number
  adjustment: PlanAdjustment | null
  document: StudyDocument
}

export interface DailyStat {
  date: ISODate
  plannedMin: number
  studiedMin: number
  slides: number
}

export interface StatsOverview {
  weekMinutes: number
  weekSlides: number
  taskCompletion: number
  quizAccuracy: number
  streakDays: number
  daily: DailyStat[]
  consistency: { date: ISODate; minutes: number }[]
  planVsActual: { date: ISODate; planned: number; actual: number }[]
}

export interface StudySessionLog {
  id: string
  examId: string
  documentId: string
  date: ISODate
  fromPage: number
  toPage: number
  minutes: number
  label: string
}

export interface NewExamInput {
  name: string
  date: ISODate
  description?: string
  documents: { name: string; pages: number }[]
  availability: Availability
  unavailableDays: ISODate[]
  reviewDays: number
}
