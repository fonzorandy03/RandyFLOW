import type { StudyDocument, StudySession } from './types'

export function documentDailyGoal(
  doc: StudyDocument,
  sessions: StudySession[],
  today: string,
  completed: number[],
) {
  const selected = new Map(doc.pageSelection?.map((item) => [item.page, item.studyable]))
  const pages = new Set<number>()
  for (const session of sessions) {
    if (
      session.date !== today ||
      session.examId !== doc.examId ||
      session.materialId !== doc.id ||
      !['planned', 'rescheduled', 'partial', 'completed'].includes(session.status) ||
      session.slideFrom == null ||
      session.slideTo == null
    )
      continue
    for (let page = Math.max(1, session.slideFrom); page <= Math.min(doc.pages, session.slideTo); page++) {
      if (selected.get(page) !== false) pages.add(page)
    }
  }
  const ordered = [...pages].sort((a, b) => a - b)
  const ranges: string[] = []
  for (let index = 0; index < ordered.length; index++) {
    const start = ordered[index]
    let end = start
    while (ordered[index + 1] === end + 1) end = ordered[++index]
    ranges.push(start === end ? String(start) : `${start}–${end}`)
  }
  const done = new Set(completed.filter((page) => pages.has(page))).size
  return {
    pages: ordered,
    ranges: ranges.join(', '),
    done,
    total: pages.size,
    progress: pages.size ? Math.round((100 * done) / pages.size) : 0,
  }
}
