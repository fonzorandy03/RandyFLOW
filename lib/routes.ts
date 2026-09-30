import type { StudySession } from './types'

/** Deep link into the Study Workspace, resuming inside today's goal when there is one. */
export function studyHref(documentId: string, session?: StudySession | null, fallbackPage?: number) {
  const params = new URLSearchParams()
  if (session?.slideFrom !== undefined && session.slideTo !== undefined) {
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
