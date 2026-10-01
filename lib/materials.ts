import type { StudyDocument } from './types'

export const pageTypeLabel: Record<string, string> = {
  content: 'Contenuto',
  cover: 'Copertina',
  index: 'Indice',
  separator: 'Separatore',
  reference: 'Riferimenti',
  empty: 'Pagina vuota',
  unclassified: 'Da verificare',
}
export function compareMaterials(
  a: Pick<StudyDocument, 'name' | 'studyOrder'>,
  b: Pick<StudyDocument, 'name' | 'studyOrder'>,
) {
  const first = (name: string) => Number(name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  const order = (a.studyOrder ?? Number.MAX_SAFE_INTEGER) - (b.studyOrder ?? Number.MAX_SAFE_INTEGER)
  return order || first(a.name) - first(b.name) || a.name.localeCompare(b.name, 'it', { numeric: true })
}
