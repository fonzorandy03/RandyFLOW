import type { StudyDocument, StudySession } from './types'

export function sessionPages(session: StudySession) {
  return session.slideFrom != null
    ? `Pagine PDF ${session.slideFrom}${session.slideTo != null && session.slideTo !== session.slideFrom ? `–${session.slideTo}` : ''}`
    : 'Ripasso'
}
export function materialLabel(session: StudySession, documents: StudyDocument[]) {
  const index = documents.findIndex((d) => d.id === session.materialId)
  return index < 0 ? 'Documento' : `Dispensa ${index + 1}`
}
export function materialTone(index: number) {
  return index % 2 === 0
    ? 'border-violet-400/25 bg-violet-400/10 text-violet-600 dark:text-violet-300'
    : 'border-teal-400/25 bg-teal-400/10 text-teal-600 dark:text-teal-300'
}
