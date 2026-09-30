import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import type { StudyPackage } from '../lib/types'

async function main() {
process.env.NEXT_PUBLIC_API_BASE_URL ??= 'http://localhost:8081'

const services = await import('../lib/api/services')
const { USE_MOCKS } = await import('../lib/api/http')
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

assert.equal(USE_MOCKS, false, 'Il test deve usare il backend reale')
assert.ok(baseUrl)

const suffix = Date.now().toString()
const exam = await services.examsApi.create({
  name: `Esame E2E ${suffix}`,
  date: '2026-12-15',
  description: 'Verifica completa PostgreSQL',
  documents: [{ name: 'Lezione 1.pdf', pages: 4 }],
  availability: { 0: 0, 1: 90, 2: 60, 3: 90, 4: 60, 5: 90, 6: 0 },
  unavailableDays: [],
  reviewDays: 4,
})
assert.equal(exam.totalSlides, 4)

const materialId = exam.documentIds[0]
const topicId = `topic-${suffix}`
const quizId = `quiz-${suffix}`
const cardId = `card-${suffix}`
const questionId = `question-${suffix}`
const studyPackage: StudyPackage = {
  format: 'randyflow-study-package' as const,
  version: '1.0' as const,
  packageId: `package-${suffix}`,
  revision: 1,
  generatedAt: new Date().toISOString(),
  language: 'it',
  exam: { id: exam.id, name: exam.name, description: exam.description, examDate: exam.date },
  materials: [{ id: materialId, name: 'Lezione 1.pdf', type: 'pdf' as const, pageCount: 4 }],
  topics: [{
    id: topicId,
    materialId,
    name: 'Argomento E2E',
    slideRange: { from: 1, to: 4 },
    difficulty: 3,
    importance: 5,
    estimatedMinutes: 40,
    explanations: { simple: 'Spiegazione semplice.', normal: 'Spiegazione normale.', deep: 'Spiegazione approfondita.' },
    summary: 'Riassunto E2E.',
    keyConcepts: ['Concetto E2E'],
    examples: ['Esempio E2E'],
    quizIds: [quizId],
    flashcardIds: [cardId],
    examQuestionIds: [questionId],
  }],
  quizzes: [{ id: quizId, topicId, type: 'multiple' as const, prompt: 'Risposta corretta?', options: ['No', 'Sì'], correctAnswer: 1, explanation: 'La risposta corretta è Sì.', slideRefs: [2] }],
  flashcards: [{ id: cardId, topicId, front: 'Domanda flashcard', back: 'Risposta flashcard', slideRefs: [2] }],
  examQuestions: [{ id: questionId, topicId, prompt: 'Domanda esame', modelAnswer: 'Risposta modello', evaluationCriteria: ['Criterio'], slideRefs: [1, 2] }],
}

const preview = await services.studyPackageApi.preview(JSON.stringify(studyPackage))
assert.equal(preview.summary.examId, exam.id)
await services.studyPackageApi.import(studyPackage)

const loadedExam = await services.examsApi.get(exam.id)
assert.equal(loadedExam.id, exam.id)
const sessions = await services.planApi.recalculate(exam.id)
assert.ok(sessions.length > 0)

const document = await services.studyApi.document(materialId)
assert.equal(document.pages, 4)
assert.equal((await services.studyApi.slide(materialId, 2)).number, 2)
assert.equal((await services.studyPackageApi.forMaterial(materialId)).topics[0].id, topicId)
await services.studyApi.savePosition(materialId, 2)
await services.studyApi.completePage(materialId, 1, sessions[0].id)
await services.studyApi.log({ examId: exam.id, documentId: materialId, fromPage: 1, toPage: 1, minutes: 12, label: 'Sessione E2E' })

const quiz = await services.quizApi.get(exam.id)
assert.equal(quiz[0].id, quizId)
await services.quizApi.submit(exam.id, [{ questionId: quizId, correct: true, given: '1' }])
const cards = await services.flashcardsApi.get(exam.id)
assert.equal(cards[0].id, cardId)
await services.flashcardsApi.rate(exam.id, cardId, 'known')
let mastery = await services.masteryApi.list(exam.id)
assert.ok(mastery[0].score > 0)
await services.examSimulationApi.submit(exam.id, questionId, 'Risposta E2E', 100)
mastery = await services.masteryApi.list(exam.id)
assert.ok(mastery[0].attempts >= 3)
const stats = await services.statsApi.get()
assert.ok(stats.weekMinutes >= 12)
assert.ok(stats.quizAccuracy > 0)

const beforeUpdate = await services.studyApi.document(materialId)
const masteryBeforeUpdate = mastery[0]
const updatedPackage = structuredClone(studyPackage)
updatedPackage.revision = 2
updatedPackage.topics[0].summary = 'Riassunto aggiornato senza perdita del progresso.'
await services.studyPackageApi.import(updatedPackage)
const afterUpdate = await services.studyApi.document(materialId)
const masteryAfterUpdate = (await services.masteryApi.list(exam.id))[0]
assert.equal(afterUpdate.pagesRead, beforeUpdate.pagesRead)
assert.equal(afterUpdate.lastPage, beforeUpdate.lastPage)
assert.equal(masteryAfterUpdate.score, masteryBeforeUpdate.score)
assert.equal(masteryAfterUpdate.attempts, masteryBeforeUpdate.attempts)

const pdfBytes = await readFile('backend/.local/test-material.pdf')
const uploaded = await services.studyApi.uploadPdf(exam.id, new File([pdfBytes], 'Lezione 1.pdf', { type: 'application/pdf' }))
assert.equal(uploaded.pages, 4)
const pdfResponse = await fetch(`${baseUrl}/api/v1/documents/${materialId}/file`)
assert.equal(pdfResponse.status, 200)
assert.equal((await pdfResponse.arrayBuffer()).byteLength, pdfBytes.byteLength)

const missing = await fetch(`${baseUrl}/api/v1/exams/not-found`)
assert.equal(missing.status, 404)
assert.match(await missing.text(), /Esame non trovato/)
const cors = await fetch(`${baseUrl}/api/v1/exams`, {
  method: 'OPTIONS',
  headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET' },
})
assert.ok(cors.ok)
assert.equal(cors.headers.get('access-control-allow-origin'), 'http://localhost:3000')

console.log(JSON.stringify({
  useMocks: USE_MOCKS,
  examId: exam.id,
  materialId,
  packageRevision: 2,
  sessions: sessions.length,
  pagesRead: afterUpdate.pagesRead,
  masteryScore: masteryAfterUpdate.score,
  masteryAttempts: masteryAfterUpdate.attempts,
  statsMinutes: stats.weekMinutes,
  pdfBytes: pdfBytes.byteLength,
  apiErrorStatus: missing.status,
  corsOrigin: cors.headers.get('access-control-allow-origin'),
}))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
