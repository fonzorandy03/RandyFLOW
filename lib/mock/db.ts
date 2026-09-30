import { addDays, dateRange, TODAY } from '../date'
import { generatePlan } from '../planner-engine'
import type {
  AppNotification,
  Availability,
  Exam,
  Flashcard,
  MasteryTopic,
  PlanAdjustment,
  QuizQuestion,
  StatsOverview,
  Student,
  StudySession,
  StudySessionLog,
  StudyTask,
} from '../types'
import { DOCUMENTS } from './documents'

export const student: Student = {
  id: 'stu-1',
  firstName: 'Marco',
  lastName: 'Bellini',
  email: 'marco.bellini@studenti.unimi.it',
  university: 'Università degli Studi di Milano',
  course: 'Informatica — Laurea Magistrale',
  year: '1° anno',
  initials: 'MB',
}

const GPS_AVAILABILITY: Availability = { 0: 0, 1: 120, 2: 60, 3: 130, 4: 90, 5: 120, 6: 60 }
const IA_AVAILABILITY: Availability = { 0: 0, 1: 0, 2: 60, 3: 0, 4: 60, 5: 0, 6: 90 }
const ADS_AVAILABILITY: Availability = { 0: 0, 1: 90, 2: 0, 3: 90, 4: 0, 5: 90, 6: 0 }
const UNAVAILABLE = ['2026-10-04', '2026-10-05', '2026-10-06']

export const exams: Exam[] = [
  {
    id: 'gps',
    name: 'Gestione Progetti Software',
    shortName: 'GPS',
    date: '2026-10-26',
    description: 'Prof.ssa Ferrari · 9 CFU · Scritto + orale',
    totalSlides: 310,
    slidesCompleted: 118,
    minutesStudied: 11 * 60 + 40,
    status: 'adjusted',
    documentIds: ['doc-gps'],
    reviewDays: 4,
    unavailableDays: UNAVAILABLE,
    availability: GPS_AVAILABILITY,
    createdAt: '2026-09-20',
  },
  {
    id: 'ia',
    name: 'Intelligenza Artificiale',
    shortName: 'IA',
    date: '2026-11-12',
    description: 'Prof. Rinaldi · 6 CFU · Scritto',
    totalSlides: 180,
    slidesCompleted: 25,
    minutesStudied: 3 * 60 + 15,
    status: 'behind',
    documentIds: ['doc-ia'],
    reviewDays: 4,
    unavailableDays: UNAVAILABLE,
    availability: IA_AVAILABILITY,
    createdAt: '2026-09-24',
  },
  {
    id: 'ads',
    name: 'Affidabilità dei Sistemi',
    shortName: 'ADS',
    date: '2026-12-02',
    description: 'Prof. Conti · 6 CFU · Progetto + orale',
    totalSlides: 240,
    slidesCompleted: 0,
    minutesStudied: 0,
    status: 'not-started',
    documentIds: ['doc-ads'],
    reviewDays: 7,
    unavailableDays: [],
    availability: ADS_AVAILABILITY,
    createdAt: '2026-09-25',
  },
]

export const mastery: MasteryTopic[] = [
  {
    id: 'wbs',
    examId: 'gps',
    name: 'WBS',
    score: 91,
    trend: 'up',
    needsReview: false,
    slideFrom: 101,
    slideTo: 112,
    attempts: 12,
  },
  {
    id: 'planning',
    examId: 'gps',
    name: 'Project Planning',
    score: 82,
    trend: 'up',
    needsReview: false,
    slideFrom: 101,
    slideTo: 124,
    attempts: 9,
  },
  {
    id: 'agile',
    examId: 'gps',
    name: 'Metodologie Agile',
    score: 88,
    trend: 'flat',
    needsReview: false,
    slideFrom: 31,
    slideTo: 62,
    attempts: 10,
  },
  {
    id: 'van',
    examId: 'gps',
    name: 'VAN e attualizzazione',
    score: 74,
    trend: 'up',
    needsReview: false,
    slideFrom: 63,
    slideTo: 77,
    attempts: 8,
  },
  {
    id: 'risk',
    examId: 'gps',
    name: 'Risk Management',
    score: 67,
    trend: 'flat',
    needsReview: false,
    slideFrom: 14,
    slideTo: 22,
    attempts: 6,
  },
  {
    id: 'wacc',
    examId: 'gps',
    name: 'WACC',
    score: 42,
    trend: 'down',
    needsReview: true,
    slideFrom: 67,
    slideTo: 74,
    attempts: 7,
  },
  {
    id: 'bfs',
    examId: 'ia',
    name: 'Ricerca non informata',
    score: 71,
    trend: 'up',
    needsReview: false,
    slideFrom: 26,
    slideTo: 40,
    attempts: 5,
  },
  {
    id: 'agents',
    examId: 'ia',
    name: 'Agenti intelligenti',
    score: 84,
    trend: 'flat',
    needsReview: false,
    slideFrom: 1,
    slideTo: 25,
    attempts: 6,
  },
]

function task(
  id: string,
  kind: StudyTask['kind'],
  label: string,
  durationMin: number,
  done: boolean,
): StudyTask {
  return { id, kind, label, durationMin, done }
}

function past(
  date: string,
  from: number,
  to: number,
  topic: string,
  status: StudySession['status'],
  slidesDone?: number,
): StudySession {
  const id = `gps-${date}`
  const count = to - from + 1
  const durationMin = Math.round((count * 25) / 6 / 5) * 5 + 25
  const done = status === 'completed'
  return {
    id,
    examId: 'gps',
    date,
    status,
    topic,
    slideFrom: from,
    slideTo: to,
    slidesDone: slidesDone ?? (done ? count : 0),
    durationMin,
    tasks: [
      task(`${id}-read`, 'read', `Studia slide ${from}–${to}`, durationMin - 25, done),
      task(
        `${id}-review`,
        'review',
        'Ripasso argomenti di ieri',
        15,
        status !== 'skipped' && status !== 'rescheduled',
      ),
      task(`${id}-quiz`, 'quiz', 'Quiz finale — 10 domande', 10, done),
    ],
    note:
      status === 'partial'
        ? `${slidesDone} / ${count} slide completate`
        : status === 'rescheduled'
          ? 'Sessione riprogrammata nei giorni successivi'
          : undefined,
  }
}

const gpsHistory: StudySession[] = [
  past('2026-09-21', 1, 12, 'Introduzione al Project Management', 'completed'),
  past('2026-09-22', 13, 24, 'Introduzione al Project Management', 'completed'),
  past('2026-09-23', 25, 36, 'Ciclo di vita e metodologie', 'rescheduled'),
  past('2026-09-24', 25, 38, 'Ciclo di vita e metodologie', 'completed'),
  past('2026-09-25', 39, 52, 'Ciclo di vita e metodologie', 'completed'),
  past('2026-09-26', 53, 62, 'Ciclo di vita e metodologie', 'completed'),
  past('2026-09-28', 63, 82, 'Valutazione economica dei progetti', 'completed'),
  past('2026-09-29', 83, 109, 'Valutazione economica dei progetti', 'partial', 18),
]

const gpsToday: StudySession = {
  id: 'gps-2026-09-30',
  examId: 'gps',
  date: TODAY,
  status: 'planned',
  topic: 'Pianificazione e Project Management',
  slideFrom: 101,
  slideTo: 124,
  slidesDone: 18,
  durationMin: 130,
  previousDurationMin: 95,
  tasks: [
    task('gps-today-read', 'read', 'Studia slide 101–124', 100, false),
    { ...task('gps-today-concepts', 'concepts', 'Comprendi WBS e Project Scheduling', 0, false) },
    task('gps-today-review', 'review', 'Ripasso argomenti di ieri', 15, true),
    task('gps-today-quiz', 'quiz', 'Quiz finale — 10 domande', 15, false),
  ],
  note: 'Include le 9 slide redistribuite da ieri',
}

const gpsFuture = generatePlan({
  examId: 'gps',
  startDate: addDays(TODAY, 1),
  examDate: '2026-10-26',
  startSlide: 125,
  endSlide: 310,
  availability: GPS_AVAILABILITY,
  unavailable: UNAVAILABLE,
  reviewDays: 4,
  chapters: DOCUMENTS[0].chapters,
  weakTopics: mastery.filter((m) => m.examId === 'gps'),
})

const iaPlan = generatePlan({
  examId: 'ia',
  startDate: addDays(TODAY, 1),
  examDate: '2026-11-12',
  startSlide: 26,
  endSlide: 180,
  availability: IA_AVAILABILITY,
  unavailable: UNAVAILABLE,
  reviewDays: 4,
  chapters: DOCUMENTS[1].chapters,
})

const adsPlan = generatePlan({
  examId: 'ads',
  startDate: '2026-10-27',
  examDate: '2026-12-02',
  startSlide: 1,
  endSlide: 240,
  availability: ADS_AVAILABILITY,
  unavailable: [],
  reviewDays: 7,
  chapters: DOCUMENTS[2].chapters,
})

export const sessions: StudySession[] = [...gpsHistory, gpsToday, ...gpsFuture, ...iaPlan, ...adsPlan]

export const adjustments: PlanAdjustment[] = [
  {
    id: 'adj-gps-1',
    examId: 'gps',
    kind: 'redistributed',
    title: 'Il tuo piano è stato aggiornato',
    message:
      'Le 9 slide rimanenti sono state redistribuite mantenendo invariati i tuoi giorni non disponibili e il periodo di ripasso.',
    plannedSlides: 27,
    completedSlides: 18,
    beforeMin: 95,
    afterMin: 130,
    dismissed: false,
  },
  {
    id: 'adj-ia-1',
    examId: 'ia',
    kind: 'behind',
    title: 'Il ritmo attuale richiede un piccolo aggiustamento.',
    message:
      'Per mantenere 4 giorni di ripasso prima dell’esame servono circa 25 minuti aggiuntivi per 6 sessioni.',
    extraMinutes: 25,
    affectedSessions: 6,
    dismissed: false,
  },
]

export const quizzes: Record<string, QuizQuestion[]> = {
  gps: [
    {
      id: 'q1',
      type: 'multiple',
      prompt: 'Quale formula calcola il valore attuale di un flusso futuro?',
      options: ['VA = VF · (1 + r)ⁿ', 'VA = VF / (1 + r)ⁿ', 'VA = VF − r · n', 'VA = VF / (r · n)'],
      correctIndex: 1,
      explanation: 'Il valore futuro viene “scontato” dividendo per (1 + r) elevato al numero di periodi.',
      slideRef: 65,
      topicId: 'van',
      topicName: 'VAN e attualizzazione',
    },
    {
      id: 'q2',
      type: 'multiple',
      prompt: 'Un progetto con VAN positivo…',
      options: [
        'rende meno del costo del capitale',
        'ha un payback inferiore a un anno',
        'crea valore rispetto al costo del capitale',
        'ha sempre un TIR negativo',
      ],
      correctIndex: 2,
      explanation: 'VAN > 0 significa che i flussi attualizzati superano l’investimento iniziale.',
      slideRef: 66,
      topicId: 'van',
      topicName: 'VAN e attualizzazione',
    },
    {
      id: 'q3',
      type: 'multiple',
      prompt: 'Nella formula del WACC, perché il costo del debito è moltiplicato per (1 − T)?',
      options: [
        'Perché il debito è più rischioso del capitale proprio',
        'Perché gli interessi sul debito sono fiscalmente deducibili',
        'Perché il debito va rimborsato in T anni',
        'Per tenere conto dell’inflazione',
      ],
      correctIndex: 1,
      explanation:
        'Gli interessi passivi riducono l’imponibile: lo “scudo fiscale” abbassa il costo effettivo del debito.',
      slideRef: 67,
      topicId: 'wacc',
      topicName: 'WACC',
    },
    {
      id: 'q4',
      type: 'multiple',
      prompt: 'Cos’è il tasso di attualizzazione?',
      options: [
        'Il tasso di inflazione annuo previsto',
        'Il rendimento minimo richiesto per riportare al presente flussi futuri',
        'La percentuale di budget già spesa',
        'Il tasso di crescita dei ricavi del progetto',
      ],
      correctIndex: 1,
      explanation:
        'È il rendimento che si potrebbe ottenere da un investimento alternativo di pari rischio; spesso coincide con il WACC.',
      slideRef: 65,
      topicId: 'van',
      topicName: 'VAN e attualizzazione',
    },
    {
      id: 'q5',
      type: 'multiple',
      prompt: 'Un progetto è conveniente quando…',
      options: ['TIR > WACC', 'TIR < WACC', 'TIR = 0', 'Payback > durata del progetto'],
      correctIndex: 0,
      explanation: 'Se il rendimento interno supera il costo del capitale, il progetto crea valore.',
      slideRef: 68,
      topicId: 'wacc',
      topicName: 'WACC',
    },
    {
      id: 'q6',
      type: 'multiple',
      prompt: 'Cosa afferma la “regola del 100%” nella WBS?',
      options: [
        'Ogni work package deve durare al massimo 100 ore',
        'La WBS deve coprire tutto l’ambito del progetto, niente di più',
        'Il 100% del budget va assegnato al primo livello',
        'Tutte le attività devono essere critiche',
      ],
      correctIndex: 1,
      explanation:
        'La somma del lavoro dei livelli inferiori deve corrispondere esattamente al livello superiore.',
      slideRef: 102,
      topicId: 'wbs',
      topicName: 'WBS',
    },
    {
      id: 'q7',
      type: 'multiple',
      prompt: 'Le attività sul cammino critico hanno uno slack pari a…',
      options: ['Zero', 'Uno', 'La durata del progetto', 'Non è definito'],
      correctIndex: 0,
      explanation: 'Un’attività critica non può ritardare senza ritardare l’intero progetto.',
      slideRef: 105,
      topicId: 'planning',
      topicName: 'Project Planning',
    },
    {
      id: 'q8',
      type: 'multiple',
      prompt: 'Con la stima PERT, se O = 2, M = 4 e P = 12 giorni, la durata attesa è…',
      options: ['4 giorni', '5 giorni', '6 giorni', '6,5 giorni'],
      correctIndex: 1,
      explanation: 'Tₑ = (2 + 4·4 + 12) / 6 = 30 / 6 = 5 giorni.',
      slideRef: 108,
      topicId: 'planning',
      topicName: 'Project Planning',
    },
    {
      id: 'q9',
      type: 'multiple',
      prompt: 'Qual è il principale limite del diagramma di Gantt?',
      options: [
        'Non mostra le durate',
        'Non evidenzia bene le dipendenze complesse',
        'Non può rappresentare milestone',
        'Richiede sempre il metodo PERT',
      ],
      correctIndex: 1,
      explanation: 'Il Gantt è ottimo per comunicare i tempi ma rende poco leggibili le reti di dipendenze.',
      slideRef: 107,
      topicId: 'planning',
      topicName: 'Project Planning',
    },
    {
      id: 'q10',
      type: 'open',
      prompt: 'Spiega con parole tue perché 100 € oggi valgono più di 100 € tra cinque anni.',
      acceptedKeywords: ['invest', 'interess', 'inflaz', 'rischio', 'rendiment', 'attualizz'],
      modelAnswer:
        'Perché il denaro disponibile oggi può essere investito e generare interessi; inoltre inflazione e rischio riducono il valore dei flussi futuri.',
      explanation:
        'Il concetto chiave è il costo opportunità: rinunciare al denaro oggi significa perdere un rendimento.',
      slideRef: 64,
      topicId: 'van',
      topicName: 'VAN e attualizzazione',
    },
  ],
}

export const flashcards: Record<string, Flashcard[]> = {
  gps: [
    {
      id: 'f1',
      front: 'Che cos’è il WACC?',
      back: 'Il costo medio ponderato del capitale: la media dei costi di capitale proprio e debito, pesati sulla struttura finanziaria. Il debito è considerato al netto delle imposte: WACC = E/V·Rₑ + D/V·R_d·(1 − T).',
      slideRef: 67,
      topic: 'WACC',
    },
    {
      id: 'f2',
      front: 'Cosa indica un VAN positivo?',
      back: 'Che il progetto genera flussi attualizzati superiori all’investimento iniziale: crea valore rispetto al costo del capitale.',
      slideRef: 66,
      topic: 'VAN e attualizzazione',
    },
    {
      id: 'f3',
      front: 'Cos’è il tasso interno di rendimento (TIR)?',
      back: 'Il tasso di attualizzazione che rende il VAN uguale a zero. Il progetto conviene se TIR > WACC.',
      slideRef: 68,
      topic: 'WACC',
    },
    {
      id: 'f4',
      front: 'Cos’è un work package?',
      back: 'L’elemento foglia della WBS: un’unità di lavoro abbastanza piccola da essere stimata, assegnata e controllata.',
      slideRef: 102,
      topic: 'WBS',
    },
    {
      id: 'f5',
      front: 'Cos’è il cammino critico?',
      back: 'La sequenza di attività dipendenti con durata complessiva maggiore. Determina la durata minima del progetto; le sue attività hanno slack zero.',
      slideRef: 105,
      topic: 'Project Planning',
    },
    {
      id: 'f6',
      front: 'Come si calcola la stima PERT?',
      back: 'Tₑ = (O + 4M + P) / 6, dove O è la stima ottimistica, M la più probabile e P la pessimistica.',
      slideRef: 108,
      topic: 'Project Planning',
    },
    {
      id: 'f7',
      front: 'Quali sono i vertici del triplo vincolo?',
      back: 'Ambito, tempo e costo, con la qualità al centro. Modificarne uno ha effetto sugli altri.',
      slideRef: 3,
      topic: 'Introduzione',
    },
    {
      id: 'f8',
      front: 'Qual è il limite principale del payback period?',
      back: 'Ignora i flussi successivi al recupero dell’investimento e non considera il valore finanziario del tempo.',
      slideRef: 70,
      topic: 'VAN e attualizzazione',
    },
  ],
}

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Piano aggiornato',
    body: '9 slide di Gestione Progetti Software sono state redistribuite nei prossimi giorni.',
    time: '07:02',
    read: false,
    kind: 'plan',
  },
  {
    id: 'n2',
    title: 'WACC — da ripassare',
    body: 'Abbiamo aggiunto una sessione di ripasso da 15 minuti il 2 ottobre.',
    time: 'Ieri',
    read: false,
    kind: 'mastery',
  },
  {
    id: 'n3',
    title: 'Quiz completato',
    body: 'Hai risposto correttamente a 8 domande su 10 su Valutazione economica.',
    time: 'Ieri',
    read: true,
    kind: 'reminder',
  },
  {
    id: 'n4',
    title: 'Materiale elaborato',
    body: 'Affidabilità dei Sistemi.pdf è pronto: 240 slide analizzate.',
    time: '25 set',
    read: true,
    kind: 'system',
  },
]

export const sessionLogs: StudySessionLog[] = [
  {
    id: 'l1',
    examId: 'gps',
    documentId: 'doc-gps',
    date: '2026-09-30',
    fromPage: 101,
    toPage: 118,
    minutes: 75,
    label: 'WBS e Project Scheduling',
  },
  {
    id: 'l2',
    examId: 'gps',
    documentId: 'doc-gps',
    date: '2026-09-29',
    fromPage: 83,
    toPage: 100,
    minutes: 75,
    label: 'VAN, WACC e TIR',
  },
  {
    id: 'l3',
    examId: 'gps',
    documentId: 'doc-gps',
    date: '2026-09-28',
    fromPage: 63,
    toPage: 82,
    minutes: 100,
    label: 'Valore finanziario del tempo',
  },
  {
    id: 'l4',
    examId: 'ia',
    documentId: 'doc-ia',
    date: '2026-09-27',
    fromPage: 14,
    toPage: 25,
    minutes: 30,
    label: 'Proprietà degli ambienti',
  },
]

const consistencyMinutes = [
  0, 30, 0, 45, 0, 20, 0, 40, 30, 0, 25, 50, 0, 0, 30, 45, 0, 60, 70, 55, 0, 70, 85, 55, 30, 100, 75, 100,
]

export const stats: StatsOverview = {
  weekMinutes: 515,
  weekSlides: 124,
  taskCompletion: 82,
  quizAccuracy: 76,
  streakDays: 6,
  daily: [
    { date: '2026-09-24', plannedMin: 90, studiedMin: 70, slides: 20 },
    { date: '2026-09-25', plannedMin: 90, studiedMin: 85, slides: 20 },
    { date: '2026-09-26', plannedMin: 60, studiedMin: 55, slides: 16 },
    { date: '2026-09-27', plannedMin: 45, studiedMin: 30, slides: 12 },
    { date: '2026-09-28', plannedMin: 120, studiedMin: 100, slides: 20 },
    { date: '2026-09-29', plannedMin: 110, studiedMin: 75, slides: 18 },
    { date: '2026-09-30', plannedMin: 130, studiedMin: 100, slides: 18 },
  ],
  consistency: dateRange('2026-09-03', TODAY).map((date, i) => ({
    date,
    minutes: consistencyMinutes[i] ?? 0,
  })),
  planVsActual: [
    { date: '2026-09-21', planned: 12, actual: 12 },
    { date: '2026-09-22', planned: 24, actual: 24 },
    { date: '2026-09-23', planned: 36, actual: 24 },
    { date: '2026-09-24', planned: 50, actual: 38 },
    { date: '2026-09-25', planned: 62, actual: 52 },
    { date: '2026-09-26', planned: 72, actual: 62 },
    { date: '2026-09-28', planned: 88, actual: 82 },
    { date: '2026-09-29', planned: 109, actual: 100 },
    { date: '2026-09-30', planned: 124, actual: 118 },
  ],
}

export const archivedConversation = {
  'doc-gps': [
    {
      id: 'm1',
      role: 'user',
      content: 'Non ho capito perché 100 € oggi valgono più di 100 € tra cinque anni.',
      createdAt: '2026-09-29T18:12:00',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: `È il principio del **valore finanziario del tempo** [Slide 64](#slide-64). In breve: il denaro che hai *oggi* può lavorare per te.

**Tre motivi, in ordine di importanza**

1. **Costo opportunità** — 100 € oggi possono essere investiti. Al 5% annuo, tra cinque anni diventano circa 127,63 €.
2. **Inflazione** — i prezzi salgono: con 100 € tra cinque anni compri meno cose.
3. **Rischio** — un incasso futuro è meno certo di uno immediato.

Per confrontare somme in momenti diversi le riportiamo al presente con l’attualizzazione [Slide 65](#slide-65):

$$VA = \\frac{VF}{(1 + r)^n}$$

| Tra 5 anni ricevi | r = 5% | Valore oggi |
| --- | --- | --- |
| 100 € | 1,05⁵ ≈ 1,276 | **78,35 €** |

> Da ricordare per l’esame: più alto è il tasso r, minore è il valore attuale di un flusso futuro.`,
      createdAt: '2026-09-29T18:12:08',
      sources: [64, 65],
    },
  ],
}
