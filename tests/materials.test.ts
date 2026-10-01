import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareMaterials } from '../lib/materials'
import { studyHref, studyPanelHref } from '../lib/routes'
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

test('detached study panels retain the visible page, goal and selected lesson', () => {
  const href = studyPanelHref(
    'doc-a',
    'page=3&from=19&to=24&session=session-a',
    24,
    'explanation',
    'Riassunto',
    'Approfondito',
  )
  const url = new URL(href, 'https://randyflow.vercel.app')
  assert.equal(url.pathname, '/studio/doc-a')
  assert.equal(url.searchParams.get('page'), '24')
  assert.equal(url.searchParams.get('from'), '19')
  assert.equal(url.searchParams.get('to'), '24')
  assert.equal(url.searchParams.get('session'), 'session-a')
  assert.equal(url.searchParams.get('view'), 'explanation')
  assert.equal(url.searchParams.get('detached'), '1')
  assert.equal(url.searchParams.get('tab'), 'Riassunto')
  assert.equal(url.searchParams.get('level'), 'Approfondito')
  assert.equal(new URL(studyPanelHref('doc-a', url.search, 25, 'pdf'), url).searchParams.get('view'), 'pdf')
})
