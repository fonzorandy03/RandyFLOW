import type {
  StudyDifficulty,
  StudyPackage,
  StudyPackageExamQuestion,
  StudyPackageFlashcard,
  StudyPackageQuiz,
  StudyPackageSummary,
  StudyPackageTopic,
} from './types'

export class StudyPackageValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join('\n'))
    this.name = 'StudyPackageValidationError'
  }
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const integer = (value: unknown) => Number.isInteger(value)
const difficulty = (value: unknown): value is StudyDifficulty =>
  integer(value) && Number(value) >= 1 && Number(value) <= 5

export function parseStudyPackage(source: string): StudyPackage {
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    throw new StudyPackageValidationError(['Il file non contiene JSON valido.'])
  }
  return validateStudyPackage(value)
}

export function validateStudyPackage(value: unknown): StudyPackage {
  const issues: string[] = []
  if (!object(value))
    throw new StudyPackageValidationError(['La radice del package deve essere un oggetto JSON.'])
  if (value.format !== 'randyflow-study-package') issues.push('format deve essere "randyflow-study-package".')
  if (value.version !== '1.0') issues.push('version deve essere "1.0".')
  if (!text(value.packageId)) issues.push('packageId è obbligatorio.')
  if (!integer(value.revision) || Number(value.revision) < 1)
    issues.push('revision deve essere un intero positivo.')
  if (!text(value.generatedAt) || Number.isNaN(Date.parse(String(value.generatedAt))))
    issues.push('generatedAt deve essere una data ISO valida.')
  if (!text(value.language)) issues.push('language è obbligatorio.')

  const exam = value.exam
  if (!object(exam) || !text(exam.id) || !text(exam.name))
    issues.push('exam.id ed exam.name sono obbligatori.')
  const materials = Array.isArray(value.materials) ? value.materials : []
  if (!materials.length) issues.push('materials deve contenere almeno un materiale.')
  const materialIds = new Set<string>()
  for (const [index, material] of materials.entries()) {
    if (!object(material) || !text(material.id) || !text(material.name)) {
      issues.push(`materials[${index}] deve avere id e name.`)
      continue
    }
    if (materialIds.has(material.id as string)) issues.push(`Materiale duplicato: ${material.id}.`)
    materialIds.add(material.id as string)
    if (!['pdf', 'slides', 'notes'].includes(String(material.type)))
      issues.push(`materials[${index}].type non valido.`)
    if (!integer(material.pageCount) || Number(material.pageCount) < 1)
      issues.push(`materials[${index}].pageCount deve essere positivo.`)
  }

  const topics = Array.isArray(value.topics) ? value.topics : []
  if (!topics.length) issues.push('topics deve contenere almeno un argomento.')
  const topicIds = new Set<string>()
  for (const [index, topic] of topics.entries()) validateTopic(topic, index, materialIds, topicIds, issues)

  const quizzes = Array.isArray(value.quizzes) ? value.quizzes : []
  const flashcards = Array.isArray(value.flashcards) ? value.flashcards : []
  const examQuestions = Array.isArray(value.examQuestions) ? value.examQuestions : []
  const quizIds = validateItems(quizzes, 'quizzes', topicIds, issues, validateQuiz)
  const flashcardIds = validateItems(flashcards, 'flashcards', topicIds, issues, validateFlashcard)
  const examQuestionIds = validateItems(
    examQuestions,
    'examQuestions',
    topicIds,
    issues,
    validateExamQuestion,
  )

  const materialPages = new Map(
    materials.filter(object).map((material) => [String(material.id), Number(material.pageCount)] as const),
  )
  const topicById = new Map(topics.filter(object).map((topic) => [String(topic.id), topic] as const))
  for (const [index, topic] of topics.entries()) {
    if (!object(topic) || !object(topic.slideRange)) continue
    const pageCount = materialPages.get(String(topic.materialId))
    if (pageCount && Number(topic.slideRange.to) > pageCount)
      issues.push(`topics[${index}].slideRange supera le pagine del materiale.`)
  }
  for (const [collectionName, collection] of [
    ['quizzes', quizzes],
    ['flashcards', flashcards],
    ['examQuestions', examQuestions],
  ] as const) {
    for (const [index, item] of collection.entries()) {
      if (!object(item) || !Array.isArray(item.slideRefs)) continue
      const topic = topicById.get(String(item.topicId))
      if (!topic) continue
      const pageCount = materialPages.get(String(topic.materialId))
      if (pageCount && item.slideRefs.some((slide) => Number(slide) > pageCount))
        issues.push(`${collectionName}[${index}].slideRefs supera le pagine del materiale.`)
    }
  }

  for (const [index, topic] of topics.entries()) {
    if (!object(topic)) continue
    validateReferences(topic.quizIds, quizIds, `topics[${index}].quizIds`, issues)
    validateReferences(topic.flashcardIds, flashcardIds, `topics[${index}].flashcardIds`, issues)
    validateReferences(topic.examQuestionIds, examQuestionIds, `topics[${index}].examQuestionIds`, issues)
  }
  if (issues.length) throw new StudyPackageValidationError(issues)
  return structuredClone(value) as unknown as StudyPackage
}

function validateTopic(
  value: unknown,
  index: number,
  materialIds: Set<string>,
  ids: Set<string>,
  issues: string[],
) {
  if (!object(value) || !text(value.id) || !text(value.name)) {
    issues.push(`topics[${index}] deve avere id e name.`)
    return
  }
  const id = value.id as string
  if (ids.has(id)) issues.push(`Argomento duplicato: ${id}.`)
  ids.add(id)
  if (!materialIds.has(String(value.materialId))) issues.push(`topics[${index}].materialId non esiste.`)
  if (
    value.pageType !== undefined &&
    !['content', 'cover', 'index', 'section-divider', 'blank', 'references', 'exercise'].includes(
      String(value.pageType),
    )
  )
    issues.push(`topics[${index}].pageType non valido.`)
  const range = value.slideRange
  if (
    !object(range) ||
    !integer(range.from) ||
    !integer(range.to) ||
    Number(range.from) < 1 ||
    Number(range.to) < Number(range.from)
  )
    issues.push(`topics[${index}].slideRange non valido.`)
  if (!difficulty(value.difficulty)) issues.push(`topics[${index}].difficulty deve essere 1–5.`)
  if (!difficulty(value.importance)) issues.push(`topics[${index}].importance deve essere 1–5.`)
  if (!integer(value.estimatedMinutes) || Number(value.estimatedMinutes) < 1)
    issues.push(`topics[${index}].estimatedMinutes deve essere positivo.`)
  const explanations = value.explanations
  if (
    !object(explanations) ||
    !text(explanations.simple) ||
    !text(explanations.normal) ||
    !text(explanations.deep)
  )
    issues.push(`topics[${index}].explanations deve contenere simple, normal e deep.`)
  if (!text(value.summary)) issues.push(`topics[${index}].summary è obbligatorio.`)
  for (const field of ['keyConcepts', 'examples', 'quizIds', 'flashcardIds', 'examQuestionIds']) {
    if (!Array.isArray(value[field]) || !(value[field] as unknown[]).every(text))
      issues.push(`topics[${index}].${field} deve essere un array di stringhe.`)
  }
}

type ItemValidator = (value: Record<string, unknown>, path: string, issues: string[]) => void
function validateItems(
  values: unknown[],
  path: string,
  topicIds: Set<string>,
  issues: string[],
  validate: ItemValidator,
) {
  const ids = new Set<string>()
  for (const [index, value] of values.entries()) {
    if (!object(value) || !text(value.id)) {
      issues.push(`${path}[${index}].id è obbligatorio.`)
      continue
    }
    if (ids.has(value.id as string)) issues.push(`${path} contiene id duplicato: ${value.id}.`)
    ids.add(value.id as string)
    if (!topicIds.has(String(value.topicId))) issues.push(`${path}[${index}].topicId non esiste.`)
    validate(value, `${path}[${index}]`, issues)
  }
  return ids
}
function slideRefs(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value) || !value.length || !value.every((n) => integer(n) && Number(n) > 0))
    issues.push(`${path}.slideRefs deve contenere numeri di slide positivi.`)
}
function validateQuiz(value: Record<string, unknown>, path: string, issues: string[]) {
  if (!['multiple', 'open'].includes(String(value.type)) || !text(value.prompt) || !text(value.explanation))
    issues.push(`${path} non contiene type, prompt o explanation validi.`)
  if (
    value.type === 'multiple' &&
    (!Array.isArray(value.options) ||
      value.options.length < 2 ||
      !integer(value.correctAnswer) ||
      Number(value.correctAnswer) < 0 ||
      Number(value.correctAnswer) >= value.options.length)
  )
    issues.push(`${path} deve avere options e correctAnswer coerenti.`)
  if (value.type === 'open' && !text(value.correctAnswer))
    issues.push(`${path}.correctAnswer deve essere una risposta modello.`)
  slideRefs(value.slideRefs, path, issues)
}
function validateFlashcard(value: Record<string, unknown>, path: string, issues: string[]) {
  if (!text(value.front) || !text(value.back)) issues.push(`${path} deve avere front e back.`)
  slideRefs(value.slideRefs, path, issues)
}
function validateExamQuestion(value: Record<string, unknown>, path: string, issues: string[]) {
  if (
    !text(value.prompt) ||
    !text(value.modelAnswer) ||
    !Array.isArray(value.evaluationCriteria) ||
    !value.evaluationCriteria.every(text)
  )
    issues.push(`${path} deve avere prompt, modelAnswer ed evaluationCriteria.`)
  slideRefs(value.slideRefs, path, issues)
}
function validateReferences(value: unknown, ids: Set<string>, path: string, issues: string[]) {
  if (!Array.isArray(value)) return
  for (const id of value)
    if (!ids.has(String(id))) issues.push(`${path} contiene un riferimento inesistente: ${id}.`)
}

export function summarizeStudyPackage(pkg: StudyPackage, existingRevision?: number): StudyPackageSummary {
  return {
    packageId: pkg.packageId,
    revision: pkg.revision,
    examId: pkg.exam.id,
    examName: pkg.exam.name,
    materialCount: pkg.materials.length,
    topicCount: pkg.topics.length,
    quizCount: pkg.quizzes.length,
    flashcardCount: pkg.flashcards.length,
    examQuestionCount: pkg.examQuestions.length,
    isUpdate: existingRevision !== undefined,
  }
}

export function topicForSlide(
  pkg: StudyPackage,
  materialId: string,
  slide: number,
): StudyPackageTopic | undefined {
  return pkg.topics.find(
    (topic) =>
      topic.materialId === materialId && slide >= topic.slideRange.from && slide <= topic.slideRange.to,
  )
}

export function packageQuizToQuestion(quiz: StudyPackageQuiz, topic: StudyPackageTopic) {
  return {
    id: quiz.id,
    type: quiz.type,
    prompt: quiz.prompt,
    options: quiz.options,
    correctIndex: quiz.type === 'multiple' ? Number(quiz.correctAnswer) : undefined,
    acceptedKeywords: quiz.acceptedKeywords,
    modelAnswer: quiz.type === 'open' ? String(quiz.correctAnswer) : undefined,
    explanation: quiz.explanation,
    slideRef: quiz.slideRefs[0],
    topicId: topic.id,
    topicName: topic.name,
  } as const
}

export function packageFlashcardToCard(card: StudyPackageFlashcard, topic: StudyPackageTopic) {
  return { id: card.id, front: card.front, back: card.back, slideRef: card.slideRefs[0], topic: topic.name }
}

export function examQuestionForTopic(question: StudyPackageExamQuestion, topic: StudyPackageTopic) {
  return { ...question, topicName: topic.name }
}
