import assert from 'node:assert/strict'
import { test } from 'node:test'
import { documentDailyGoal } from '../lib/study-goal'
import type { StudyDocument, StudySession } from '../lib/types'
const doc = {
  id: 'a',
  examId: 'exam',
  pages: 40,
  pageSelection: [{ page: 20, studyable: false }],
} as StudyDocument
const session = (
  id: string,
  materialId: string,
  date: string,
  from: number,
  to: number,
  status: StudySession['status'] = 'planned',
): StudySession => ({
  id,
  materialId,
  examId: 'exam',
  date,
  slideFrom: from,
  slideTo: to,
  status,
  durationMin: 20,
  tasks: [],
})
test('daily goal combines current-day PDF pages without duplicates or excluded pages', () => {
  const sessions = [
    session('one', 'a', '2026-10-01', 19, 22),
    session('two', 'a', '2026-10-01', 21, 24),
    session('other', 'b', '2026-10-01', 1, 40),
    session('tomorrow', 'a', '2026-10-02', 25, 30),
    session('skip', 'a', '2026-10-01', 1, 10, 'skipped'),
  ]
  const goal = documentDailyGoal(doc, sessions, '2026-10-01', [19, 19, 20, 21, 40])
  assert.deepEqual(goal.pages, [19, 21, 22, 23, 24])
  assert.equal(goal.ranges, '19, 21–24')
  assert.equal(goal.done, 2)
  assert.equal(goal.total, 5)
  assert.equal(goal.progress, 40)
  assert.equal(documentDailyGoal(doc, sessions, '2026-10-02', [25, 26, 27, 28, 29, 30]).progress, 100)
})
test('a day without study sessions never invents a daily goal', () => {
  assert.equal(documentDailyGoal(doc, [], '2026-10-01', [18]).total, 0)
})
