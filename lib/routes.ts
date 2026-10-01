import type { StudySession } from './types'

/** Opens one study panel without losing the current page or session context. */
export function studyPanelHref(
  documentId: string,
  currentQuery: string,
  page: number,
  view: 'pdf' | 'explanation',
  tab = 'Spiegazione',
  level = 'Semplice',
) {
  const params = new URLSearchParams(currentQuery)
  params.set('page', String(page))
  params.set('view', view)
  params.set('detached', '1')
  params.set('tab', tab)
  params.set('level', level)
  return `/studio/${documentId}?${params.toString()}`
}

/** Deep link into the Study Workspace, resuming inside today's goal when there is one. */
export function studyHref(documentId: string, session?: StudySession | null, fallbackPage?: number) {
  const params = new URLSearchParams()
  if (
    session?.slideFrom !== undefined &&
    session.slideTo !== undefined &&
    (!session.materialId || session.materialId === documentId)
  ) {
    const total = session.slideTo - session.slideFrom + 1
    const resume = session.nextPage ?? session.slideFrom + Math.min(total - 1, session.slidesDone ?? 0)
    params.set('page', String(resume))
    params.set('from', String(session.slideFrom))
    params.set('to', String(session.slideTo))
    params.set('session', session.id)
  } else if (fallbackPage) {
    params.set('page', String(fallbackPage))
  }
  const qs = params.toString()
  return `/studio/${documentId}${qs ? `?${qs}` : ''}`
}
