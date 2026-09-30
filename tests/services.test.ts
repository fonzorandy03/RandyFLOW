import test from 'node:test'
import assert from 'node:assert/strict'
import {
  studyApi,
  quizApi,
  flashcardsApi,
  planApi,
  examsApi,
  studyPackageApi,
  examSimulationApi,
} from '../lib/api/services'
import { sessions, mastery } from '../lib/mock/db'
import { generatePlan } from '../lib/planner-engine'
import { StudyPackageValidationError } from '../lib/study-package'

test('unknown documents reject instead of leaving a pending request', async () => {
  await assert.rejects(studyApi.document('does-not-exist'), /Documento non trovato/)
})
test('navigation preserves progress, clamps bounds; completion is idempotent and counts the last page', async () => {
  const before = await studyApi.document('doc-gps')
  const jumped = await studyApi.savePosition('doc-gps', 9999)
  assert.equal(jumped.lastPage, jumped.pages)
  assert.equal(jumped.pagesRead, before.pagesRead)
  await studyApi.completePage('doc-gps', 310)
  await studyApi.completePage('doc-gps', 310)
  assert.equal((await studyApi.document('doc-gps')).pagesRead, before.pagesRead + 1)
  await assert.rejects(studyApi.completePage('doc-gps', 0))
})
test('daily goal completes only after all six outstanding pages, then quiz completes session', async () => {
  for (let page = 119; page <= 124; page++) await studyApi.completePage('doc-gps', page, 'gps-2026-09-30')
  const session = sessions.find((s) => s.id === 'gps-2026-09-30')!
  assert.equal(session.slidesDone, 24)
  assert.equal(session.tasks.find((t) => t.kind === 'read')?.done, true)
  const questions = await quizApi.get('gps')
  await quizApi.submit(
    'gps',
    questions.map((q) => ({ questionId: q.id, given: '', correct: false })),
  )
  assert.equal(session.status, 'completed')
  assert.ok(mastery.find((t) => t.id === 'wacc')!.needsReview)
  assert.ok(sessions.some((s) => s.date > '2026-09-30' && s.tasks.some((t) => t.label === 'Ripasso WACC')))
})
test('flashcard rating updates mastery and does not duplicate pending review tasks', async () => {
  const card = (await flashcardsApi.get('gps')).find((item) => item.id === 'f1')!
  const topic = mastery.find((item) => item.examId === 'gps' && item.name === card.topic)!
  const before = topic.score
  const pendingBefore = sessions
    .flatMap((s) => s.tasks)
    .filter((task) => task.id.endsWith(`-mastery-${topic.id}`)).length
  await flashcardsApi.rate('gps', 'f1', 'unknown')
  assert.ok(mastery.find((item) => item.id === topic.id)!.score < before)
  assert.equal(
    sessions.flatMap((s) => s.tasks).filter((task) => task.id.endsWith(`-mastery-${topic.id}`)).length,
    pendingBefore,
  )
})
test('other exams receive their own questions, cards and slide references', async () => {
  const questions = await quizApi.get('ia')
  assert.ok(questions.every((q) => q.id.startsWith('ia-') && q.slideRef <= 180))
  const cards = await flashcardsApi.get('ads')
  assert.ok(cards.every((c) => c.id.startsWith('ads-')))
  assert.match(cards[0].back, /affidabilità|R\(t\)/i)
})
test('new exams are navigable and do not display unrelated GPS content', async () => {
  const exam = await examsApi.create({
    name: 'Analisi matematica',
    date: '2026-11-15',
    documents: [{ name: 'Analisi.pdf', pages: 10 }],
    availability: { 0: 0, 1: 60, 2: 60, 3: 60, 4: 60, 5: 60, 6: 0 },
    unavailableDays: [],
    reviewDays: 3,
  })
  const slide = await studyApi.slide(exam.documentIds[0], 1)
  assert.match(slide.title, /Analisi.pdf/)
  assert.ok((await planApi.sessions(exam.id)).length > 0)
})
test('planner covers the requested interval without overlaps and respects unavailable days', () => {
  const plan = generatePlan({
    examId: 'test',
    startDate: '2026-10-01',
    examDate: '2026-10-20',
    startSlide: 1,
    endSlide: 100,
    availability: { 0: 0, 1: 60, 2: 60, 3: 60, 4: 60, 5: 60, 6: 0 },
    unavailable: ['2026-10-02'],
    reviewDays: 3,
    chapters: [{ title: 'Test', from: 1, to: 100 }],
  })
  const study = plan.filter((s) => s.status === 'planned')
  assert.equal(study[0].slideFrom, 1)
  assert.equal(study.at(-1)?.slideTo, 100)
  for (let i = 1; i < study.length; i++) assert.equal(study[i].slideFrom, study[i - 1].slideTo! + 1)
  assert.equal(plan.find((s) => s.date === '2026-10-02')?.status, 'unavailable')
})
test('Study Package validates, updates content and preserves personal progress', async () => {
  await assert.rejects(studyPackageApi.preview('{"version":"1.0"}'), StudyPackageValidationError)
  const original = await studyPackageApi.forExam('gps')
  const before = await studyApi.document('doc-gps')
  const score = mastery.find((topic) => topic.examId === 'gps')!.score
  const updated = structuredClone(original)
  updated.revision += 1
  updated.topics[0].summary = 'Riassunto aggiornato dal package.'
  const preview = await studyPackageApi.preview(JSON.stringify(updated))
  assert.equal(preview.summary.isUpdate, true)
  await studyPackageApi.import(updated)
  assert.equal((await studyPackageApi.forExam('gps')).topics[0].summary, 'Riassunto aggiornato dal package.')
  assert.equal((await studyApi.document('doc-gps')).pagesRead, before.pagesRead)
  assert.equal(mastery.find((topic) => topic.examId === 'gps')!.score, score)
  await assert.rejects(studyPackageApi.import(original), /precedente/)
})
test('exam simulation uses package questions and updates mastery without generation', async () => {
  const pkg = await studyPackageApi.forExam('gps')
  const question = pkg.examQuestions[0]
  const topic = mastery.find((item) => item.id === question.topicId)
  const attempts = topic?.attempts ?? 0
  const result = await examSimulationApi.submit('gps', question.id, 'Risposta personale', 60)
  assert.equal(result.attempts, attempts + 1)
})
