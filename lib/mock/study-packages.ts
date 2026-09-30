import type {
  StudyPackage,
  StudyPackageExamQuestion,
  StudyPackageFlashcard,
  StudyPackageQuiz,
  StudyPackageTopic,
} from '../types'
import * as db from './db'
import { DOCUMENTS, getSlide, slideToText } from './documents'

const packages: Record<string, StudyPackage> = {}
let hydrated = false
const STORAGE_KEY = 'randyflow-study-packages-v1'

function seed(examId: string): StudyPackage {
  const exam = db.exams.find((item) => item.id === examId)
  if (!exam) throw new Error('Esame non trovato')
  const materials = DOCUMENTS.filter((document) => document.examId === examId)
  const topics: StudyPackageTopic[] = materials.flatMap((material) =>
    material.chapters.map((chapter, index) => {
      const sample = getSlide(material.id, Math.min(chapter.to, chapter.from + 1))
      const base = slideToText(sample)
      const existingTopic = db.mastery.find(
        (item) => item.examId === examId && item.slideFrom <= chapter.to && item.slideTo >= chapter.from,
      )
      return {
        id: existingTopic?.id ?? `${examId}-topic-${material.id}-${index + 1}`,
        materialId: material.id,
        name: existingTopic?.name ?? chapter.title,
        slideRange: { from: chapter.from, to: chapter.to },
        difficulty: Math.min(5, 2 + (index % 4)) as StudyPackageTopic['difficulty'],
        importance: Math.min(5, 3 + (index % 3)) as StudyPackageTopic['importance'],
        estimatedMinutes: Math.max(20, Math.round(((chapter.to - chapter.from + 1) * 4) / 5) * 5),
        explanations: {
          simple: `${sample.title}: ${sample.bullets?.[0] ?? sample.formulaCaption ?? 'introduce il tema centrale del capitolo'}.`,
          normal: base,
          deep: `${base}\n\nCollega questo argomento alle ipotesi, ai limiti e alle applicazioni presentate nelle slide ${chapter.from}–${chapter.to}.`,
        },
        summary: `${chapter.title} raccoglie i concetti essenziali delle slide ${chapter.from}–${chapter.to}.`,
        keyConcepts: [sample.title, ...(sample.bullets ?? []).slice(0, 3)],
        examples: [sample.footnote ?? `Applica ${sample.title} a un caso concreto e motiva ogni passaggio.`],
        quizIds: [],
        flashcardIds: [],
        examQuestionIds: [],
      }
    }),
  )
  const topicAt = (page: number) =>
    topics.find((topic) => page >= topic.slideRange.from && page <= topic.slideRange.to) ?? topics[0]
  const quizzes: StudyPackageQuiz[] = (db.quizzes[examId] ?? []).map((question) => {
    const topic = topicAt(question.slideRef)
    topic.quizIds.push(question.id)
    return {
      id: question.id,
      topicId: topic.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correctAnswer:
        question.type === 'multiple' ? (question.correctIndex ?? 0) : (question.modelAnswer ?? ''),
      acceptedKeywords: question.acceptedKeywords,
      explanation: question.explanation,
      slideRefs: [question.slideRef],
    }
  })
  if (!quizzes.length) {
    for (const [index, topic] of topics.entries()) {
      const id = `${examId}-quiz-${index + 1}`
      topic.quizIds.push(id)
      quizzes.push({
        id,
        topicId: topic.id,
        type: 'open',
        prompt: `Spiega il concetto principale di ${topic.name}.`,
        correctAnswer: topic.explanations.normal,
        acceptedKeywords: topic.keyConcepts.slice(0, 3),
        explanation: topic.summary,
        slideRefs: [topic.slideRange.from],
      })
    }
  }
  const flashcards: StudyPackageFlashcard[] = (db.flashcards[examId] ?? []).map((card) => {
    const topic = topicAt(card.slideRef)
    topic.flashcardIds.push(card.id)
    return { id: card.id, topicId: topic.id, front: card.front, back: card.back, slideRefs: [card.slideRef] }
  })
  if (!flashcards.length) {
    for (const [index, topic] of topics.entries()) {
      const id = `${examId}-flashcard-${index + 1}`
      topic.flashcardIds.push(id)
      flashcards.push({
        id,
        topicId: topic.id,
        front: `Qual è l’idea centrale di ${topic.name}?`,
        back: topic.summary,
        slideRefs: [topic.slideRange.from],
      })
    }
  }
  const examQuestions: StudyPackageExamQuestion[] = topics.map((topic, index) => {
    const id = `${examId}-exam-${index + 1}`
    topic.examQuestionIds.push(id)
    return {
      id,
      topicId: topic.id,
      prompt: `Illustra ${topic.name} e collegalo a un caso applicativo.`,
      modelAnswer: topic.explanations.deep,
      evaluationCriteria: ['Definizione corretta', 'Collegamenti tra i concetti', 'Esempio coerente'],
      slideRefs: [topic.slideRange.from, topic.slideRange.to],
    }
  })
  return {
    format: 'randyflow-study-package',
    version: '1.0',
    packageId: `${examId}-official`,
    revision: 1,
    generatedAt: '2026-09-30T00:00:00.000Z',
    language: 'it',
    exam: { id: exam.id, name: exam.name, description: exam.description, examDate: exam.date },
    materials: materials.map((material) => ({
      id: material.id,
      name: material.name,
      type: material.kind,
      pageCount: material.pages,
    })),
    topics,
    quizzes,
    flashcards,
    examQuestions,
  }
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, StudyPackage>
    Object.assign(packages, saved)
  } catch {
    /* Invalid local content falls back to the bundled package. */
  }
}

function persist() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packages))
}

export function packageForExam(examId: string) {
  hydrate()
  return packages[examId] ?? (packages[examId] = seed(examId))
}

export function packageForMaterial(materialId: string) {
  hydrate()
  const stored = Object.values(packages).find((pkg) =>
    pkg.materials.some((material) => material.id === materialId),
  )
  if (stored) return stored
  const document = DOCUMENTS.find((item) => item.id === materialId)
  return document ? packageForExam(document.examId) : undefined
}

export function packageRevision(packageId: string) {
  hydrate()
  return Object.values(packages).find((pkg) => pkg.packageId === packageId)?.revision
}

export function savePackage(pkg: StudyPackage) {
  hydrate()
  packages[pkg.exam.id] = structuredClone(pkg)
  persist()
  return packages[pkg.exam.id]
}

export function allPackages() {
  hydrate()
  for (const exam of db.exams) if (!packages[exam.id]) packages[exam.id] = seed(exam.id)
  return Object.values(packages)
}
