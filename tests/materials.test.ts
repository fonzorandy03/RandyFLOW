import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareMaterials } from '../lib/materials'
import { studyHref } from '../lib/routes'
import type { StudySession } from '../lib/types'

test('uses the chosen study order before chapter numbers', () => {
  const docs = [
    { name: 'Capitoli 1-4.pdf', studyOrder: 1 },
    { name: 'Capitoli 5-8.pdf', studyOrder: 0 },
  ]
  assert.deepEqual(
    docs.sort(compareMaterials).map((d) => d.name),
    ['Capitoli 5-8.pdf', 'Capitoli 1-4.pdf'],
  )
})

test('orders chapter ranges before alphabetic filename prefixes', () => {
  const docs = [
    { name: 'dispensa_ISTA_Cap5-8.pdf' },
    { name: 'ISTA_Dispensa_Capitoli_1-4.pdf' },
    { name: 'Capitoli_10-12.pdf' },
  ]
  assert.deepEqual(
    docs.sort(compareMaterials).map((d) => d.name),
    ['ISTA_Dispensa_Capitoli_1-4.pdf', 'dispensa_ISTA_Cap5-8.pdf', 'Capitoli_10-12.pdf'],
  )
})
test('never applies the goal of another PDF to a document link', () => {
  const session = {
    id: 'session-b',
    materialId: 'pdf-b',
    slideFrom: 3,
    slideTo: 9,
    nextPage: 5,
  } as StudySession
  assert.equal(studyHref('pdf-a', session, 2), '/studio/pdf-a?page=2')
  assert.equal(studyHref('pdf-b', session, 1), '/studio/pdf-b?page=5&from=3&to=9&session=session-b')
})
