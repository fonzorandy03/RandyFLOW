import assert from 'node:assert/strict'
import { test } from 'node:test'
import { currentDate } from '../lib/date'
import { materialLabel, sessionPages } from '../lib/planner-materials'
import type { StudyDocument, StudySession } from '../lib/types'

test('Italian calendar day changes at local midnight, including winter time', () => {
  assert.equal(currentDate(new Date('2026-09-30T21:59:59Z')), '2026-09-30')
  assert.equal(currentDate(new Date('2026-09-30T22:00:00Z')), '2026-10-01')
  assert.equal(currentDate(new Date('2026-12-31T22:59:59Z')), '2026-12-31')
  assert.equal(currentDate(new Date('2026-12-31T23:00:00Z')), '2027-01-01')
})

test('calendar page ranges refer to their own PDF, including single-page sessions', () => {
  const documents = [{ id: 'chapter-5' }, { id: 'chapter-1' }] as StudyDocument[]
  const session = { materialId: 'chapter-1', slideFrom: 4, slideTo: 11 } as StudySession
  assert.equal(materialLabel(session, documents), 'Dispensa 2')
  assert.equal(sessionPages(session), 'Pagine PDF 4–11')
  assert.equal(sessionPages({ ...session, slideTo: 4 }), 'Pagine PDF 4')
})
