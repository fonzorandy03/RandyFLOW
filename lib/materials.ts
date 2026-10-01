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
export function compareMaterials(a: Pick<StudyDocument, 'name'>, b: Pick<StudyDocument, 'name'>) {
  const first = (name: string) => Number(name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  return first(a.name) - first(b.name) || a.name.localeCompare(b.name, 'it', { numeric: true })
}
