import type { Chapter, Slide, StudyDocument } from '../types'

type Template = Omit<Slide, 'number' | 'chapter'>

interface ChapterSource extends Chapter {
  pool: Template[]
}

const GPS_CHAPTERS: ChapterSource[] = [
  {
    title: 'Introduzione al Project Management',
    from: 1,
    to: 30,
    pool: [
      {
        title: 'Che cos’è un progetto',
        kind: 'bullets',
        bullets: [
          'Impresa temporanea con un inizio e una fine definiti',
          'Produce un risultato unico: prodotto, servizio o cambiamento',
          'Vincolata da tempo, costi e qualità (triplo vincolo)',
          'Si distingue dalle operations, che sono continue e ripetitive',
        ],
      },
      {
        title: 'Il triplo vincolo',
        kind: 'diagram',
        diagram: [{ label: 'Ambito' }, { label: 'Tempo' }, { label: 'Costo' }, { label: 'Qualità (centro)' }],
        footnote: 'Modificare un vertice ha sempre effetto sugli altri due.',
      },
      {
        title: 'Stakeholder di progetto',
        kind: 'bullets',
        bullets: [
          'Sponsor: finanzia e sostiene il progetto',
          'Cliente e utenti finali: definiscono i requisiti',
          'Project manager: responsabile del raggiungimento degli obiettivi',
          'Team di progetto e fornitori esterni',
        ],
      },
      {
        title: 'Il ruolo del project manager',
        kind: 'bullets',
        bullets: [
          'Integra ambito, tempi, costi e qualità',
          'Gestisce la comunicazione con gli stakeholder',
          'Prende decisioni in condizioni di incertezza',
          'Bilancia obiettivi tecnici e vincoli di business',
        ],
      },
      {
        title: 'Perché i progetti software falliscono',
        kind: 'table',
        table: {
          head: ['Causa', 'Frequenza'],
          rows: [
            ['Requisiti incompleti', '13,1%'],
            ['Scarso coinvolgimento utenti', '12,4%'],
            ['Mancanza di risorse', '10,6%'],
            ['Aspettative irrealistiche', '9,9%'],
          ],
        },
        footnote: 'Fonte: Standish Group, CHAOS Report.',
      },
    ],
  },
  {
    title: 'Ciclo di vita e metodologie',
    from: 31,
    to: 62,
    pool: [
      {
        title: 'Modello a cascata (Waterfall)',
        kind: 'diagram',
        diagram: [
          { label: 'Requisiti' },
          { label: 'Progettazione' },
          { label: 'Implementazione' },
          { label: 'Verifica' },
          { label: 'Manutenzione' },
        ],
        footnote: 'Ogni fase inizia solo al termine della precedente.',
      },
      {
        title: 'Modello a spirale',
        kind: 'bullets',
        bullets: [
          'Proposto da Boehm (1988), guidato dall’analisi dei rischi',
          'Ogni ciclo: obiettivi, rischi, sviluppo, pianificazione',
          'Adatto a progetti grandi e ad alto rischio',
        ],
      },
      {
        title: 'Il manifesto Agile',
        kind: 'bullets',
        bullets: [
          'Individui e interazioni più che processi e strumenti',
          'Software funzionante più che documentazione esaustiva',
          'Collaborazione col cliente più che negoziazione dei contratti',
          'Rispondere al cambiamento più che seguire un piano',
        ],
      },
      {
        title: 'Scrum: ruoli ed eventi',
        kind: 'table',
        table: {
          head: ['Ruolo', 'Responsabilità'],
          rows: [
            ['Product Owner', 'Massimizza il valore, gestisce il backlog'],
            ['Scrum Master', 'Facilita il processo, rimuove ostacoli'],
            ['Developers', 'Realizzano l’incremento a ogni sprint'],
          ],
        },
      },
    ],
  },
  {
    title: 'Valutazione economica dei progetti',
    from: 63,
    to: 100,
    pool: [
      {
        title: 'Il valore finanziario del tempo',
        kind: 'bullets',
        bullets: [
          '100 € oggi valgono più di 100 € tra cinque anni',
          'Il denaro disponibile oggi può essere investito e generare interessi',
          'Inflazione e rischio riducono il valore dei flussi futuri',
          'Per confrontare flussi in tempi diversi occorre attualizzarli',
        ],
      },
      {
        title: 'Attualizzazione di un flusso',
        kind: 'formula',
        formula: 'VA = VF / (1 + r)ⁿ',
        formulaCaption: 'VA valore attuale · VF valore futuro · r tasso di attualizzazione · n periodi',
      },
      {
        title: 'Valore Attuale Netto (VAN)',
        kind: 'formula',
        formula: 'VAN = Σ Fₜ / (1 + r)ᵗ − I₀',
        formulaCaption: 'Se VAN > 0 il progetto crea valore rispetto al costo del capitale',
      },
      {
        title: 'Costo medio ponderato del capitale (WACC)',
        kind: 'formula',
        formula: 'WACC = E/V · Rₑ + D/V · R_d · (1 − T)',
        formulaCaption: 'E capitale proprio · D debito · V = E + D · T aliquota fiscale',
      },
      {
        title: 'Tasso Interno di Rendimento (TIR)',
        kind: 'bullets',
        bullets: [
          'È il tasso che rende il VAN uguale a zero',
          'Il progetto è conveniente se TIR > WACC',
          'Attenzione ai flussi con più cambi di segno: TIR multipli',
        ],
      },
      {
        title: 'Esempio: confronto tra due progetti',
        kind: 'table',
        table: {
          head: ['Anno', 'Progetto A', 'Progetto B'],
          rows: [
            ['0', '−10.000 €', '−10.000 €'],
            ['1', '3.000 €', '6.000 €'],
            ['2', '4.000 €', '4.000 €'],
            ['3', '6.000 €', '2.000 €'],
          ],
        },
        footnote: 'Con r = 8%: VAN(A) = 1.068 €, VAN(B) = 1.573 €.',
      },
      {
        title: 'Payback period',
        kind: 'bullets',
        bullets: [
          'Tempo necessario a recuperare l’investimento iniziale',
          'Semplice da calcolare e comunicare',
          'Ignora i flussi successivi al recupero e il valore del tempo',
        ],
      },
    ],
  },
  {
    title: 'Pianificazione: WBS e Project Scheduling',
    from: 101,
    to: 140,
    pool: [
      {
        title: 'Work Breakdown Structure (WBS)',
        kind: 'bullets',
        bullets: [
          'Scomposizione gerarchica del lavoro in deliverable',
          'Ogni livello aggiunge dettaglio al precedente',
          'Le foglie sono i work package, stimabili e assegnabili',
          'Regola del 100%: la WBS copre tutto l’ambito, niente di più',
        ],
      },
      {
        title: 'Esempio di WBS: app di prenotazione',
        kind: 'diagram',
        diagram: [
          { label: '1. Analisi', children: ['1.1 Requisiti', '1.2 Casi d’uso'] },
          { label: '2. Sviluppo', children: ['2.1 Backend', '2.2 App mobile'] },
          { label: '3. Test', children: ['3.1 Test di sistema', '3.2 UAT'] },
          { label: '4. Rilascio', children: ['4.1 Deploy', '4.2 Formazione'] },
        ],
      },
      {
        title: 'Dalla WBS alle attività',
        kind: 'bullets',
        bullets: [
          'Ogni work package viene scomposto in attività',
          'Per ogni attività si stimano durata e risorse',
          'Si identificano le dipendenze: FS, SS, FF, SF',
        ],
      },
      {
        title: 'Critical Path Method (CPM)',
        kind: 'bullets',
        bullets: [
          'Il cammino critico è la sequenza di attività più lunga',
          'Determina la durata minima del progetto',
          'Le attività critiche hanno slack (float) pari a zero',
          'Un ritardo su un’attività critica ritarda l’intero progetto',
        ],
      },
      {
        title: 'Calcolo in avanti e all’indietro',
        kind: 'table',
        table: {
          head: ['Attività', 'Durata', 'ES', 'EF', 'LS', 'LF', 'Slack'],
          rows: [
            ['A', '3', '0', '3', '0', '3', '0'],
            ['B', '4', '3', '7', '3', '7', '0'],
            ['C', '2', '3', '5', '5', '7', '2'],
            ['D', '5', '7', '12', '7', '12', '0'],
          ],
        },
        footnote: 'Cammino critico: A → B → D (12 giorni).',
      },
      {
        title: 'Diagramma di Gantt',
        kind: 'bullets',
        bullets: [
          'Rappresenta le attività su una scala temporale',
          'Mostra durata, sovrapposizioni e milestone',
          'Utile per comunicare lo stato di avanzamento',
          'Non evidenzia bene le dipendenze complesse',
        ],
      },
      {
        title: 'Stima PERT a tre punti',
        kind: 'formula',
        formula: 'Tₑ = (O + 4M + P) / 6',
        formulaCaption: 'O ottimistica · M più probabile · P pessimistica',
      },
    ],
  },
  {
    title: 'Stima di costi ed effort',
    from: 141,
    to: 180,
    pool: [
      {
        title: 'Tecniche di stima',
        kind: 'bullets',
        bullets: [
          'Giudizio esperto e tecnica Delphi',
          'Stima per analogia con progetti simili',
          'Modelli parametrici: COCOMO, Function Point',
        ],
      },
      {
        title: 'COCOMO II',
        kind: 'formula',
        formula: 'Effort = A · Size^E · Π EMᵢ',
        formulaCaption: 'Size in KSLOC · E esponente di scala · EM moltiplicatori di effort',
      },
      {
        title: 'Function Point Analysis',
        kind: 'table',
        table: {
          head: ['Componente', 'Semplice', 'Media', 'Complessa'],
          rows: [
            ['Input esterni', '3', '4', '6'],
            ['Output esterni', '4', '5', '7'],
            ['File logici interni', '7', '10', '15'],
          ],
        },
      },
    ],
  },
  {
    title: 'Risk Management',
    from: 181,
    to: 220,
    pool: [
      {
        title: 'Processo di gestione dei rischi',
        kind: 'diagram',
        diagram: [
          { label: 'Identificazione' },
          { label: 'Analisi' },
          { label: 'Pianificazione risposte' },
          { label: 'Monitoraggio' },
        ],
      },
      {
        title: 'Esposizione al rischio',
        kind: 'formula',
        formula: 'RE = P(evento) · Impatto',
        formulaCaption: 'Permette di ordinare i rischi per priorità',
      },
      {
        title: 'Strategie di risposta',
        kind: 'bullets',
        bullets: ['Evitare', 'Trasferire (es. assicurazione, outsourcing)', 'Mitigare', 'Accettare'],
      },
    ],
  },
  {
    title: 'Gestione del team e comunicazione',
    from: 221,
    to: 255,
    pool: [
      {
        title: 'Matrice RACI',
        kind: 'table',
        table: {
          head: ['Attività', 'PM', 'Dev', 'Cliente'],
          rows: [
            ['Requisiti', 'A', 'C', 'R'],
            ['Sviluppo', 'A', 'R', 'I'],
            ['Collaudo', 'A', 'C', 'R'],
          ],
        },
        footnote: 'R Responsible · A Accountable · C Consulted · I Informed',
      },
      {
        title: 'Fasi di sviluppo del team (Tuckman)',
        kind: 'diagram',
        diagram: [{ label: 'Forming' }, { label: 'Storming' }, { label: 'Norming' }, { label: 'Performing' }],
      },
      {
        title: 'Canali di comunicazione',
        kind: 'formula',
        formula: 'Canali = n(n − 1) / 2',
        formulaCaption: 'Con 10 persone: 45 canali di comunicazione',
      },
    ],
  },
  {
    title: 'Monitoraggio e controllo (EVM)',
    from: 256,
    to: 290,
    pool: [
      {
        title: 'Earned Value Management',
        kind: 'bullets',
        bullets: [
          'PV: valore pianificato del lavoro previsto',
          'EV: valore del lavoro effettivamente completato',
          'AC: costo effettivamente sostenuto',
        ],
      },
      {
        title: 'Indici di performance',
        kind: 'formula',
        formula: 'CPI = EV / AC    SPI = EV / PV',
        formulaCaption: 'Valori < 1 indicano sforamento dei costi o ritardo',
      },
    ],
  },
  {
    title: 'Chiusura del progetto e casi di studio',
    from: 291,
    to: 310,
    pool: [
      {
        title: 'Chiusura formale',
        kind: 'bullets',
        bullets: [
          'Accettazione dei deliverable da parte del cliente',
          'Rilascio delle risorse e chiusura dei contratti',
          'Lessons learned e archiviazione della documentazione',
        ],
      },
      {
        title: 'Caso di studio: migrazione a microservizi',
        kind: 'bullets',
        bullets: [
          'Budget iniziale 420.000 €, durata 14 mesi',
          'CPI a metà progetto: 0,86 — azioni correttive sul perimetro',
          'Rilascio incrementale per ridurre il rischio',
        ],
      },
    ],
  },
]

const AI_CHAPTERS: ChapterSource[] = [
  {
    title: 'Agenti intelligenti',
    from: 1,
    to: 25,
    pool: [
      {
        title: 'Agenti e ambienti',
        kind: 'bullets',
        bullets: [
          'Percezione tramite sensori',
          'Azione tramite attuatori',
          'Funzione agente: sequenze percettive → azioni',
        ],
      },
      {
        title: 'Proprietà degli ambienti',
        kind: 'table',
        table: {
          head: ['Proprietà', 'Esempio'],
          rows: [
            ['Osservabile / parziale', 'Scacchi / Poker'],
            ['Deterministico / stocastico', 'Puzzle / Guida autonoma'],
          ],
        },
      },
    ],
  },
  {
    title: 'Ricerca non informata',
    from: 26,
    to: 70,
    pool: [
      {
        title: 'Ricerca in ampiezza (BFS)',
        kind: 'bullets',
        bullets: [
          'Espande prima i nodi meno profondi',
          'Completa e ottima con costi uniformi',
          'Complessità O(bᵈ)',
        ],
      },
      {
        title: 'Ricerca in profondità (DFS)',
        kind: 'bullets',
        bullets: ['Espande il nodo più profondo', 'Memoria O(bm)', 'Non completa in spazi infiniti'],
      },
    ],
  },
  {
    title: 'Ricerca informata ed euristiche',
    from: 71,
    to: 110,
    pool: [
      {
        title: 'Algoritmo A*',
        kind: 'formula',
        formula: 'f(n) = g(n) + h(n)',
        formulaCaption: 'Ottimo se h è ammissibile e consistente',
      },
    ],
  },
  {
    title: 'Problemi di soddisfacimento di vincoli',
    from: 111,
    to: 145,
    pool: [
      {
        title: 'CSP: definizione',
        kind: 'bullets',
        bullets: [
          'Variabili, domini e vincoli',
          'Backtracking con euristiche MRV e LCV',
          'Propagazione: forward checking, AC-3',
        ],
      },
    ],
  },
  {
    title: 'Apprendimento automatico',
    from: 146,
    to: 180,
    pool: [
      {
        title: 'Apprendimento supervisionato',
        kind: 'bullets',
        bullets: [
          'Esempi etichettati (x, y)',
          'Classificazione e regressione',
          'Overfitting e validazione incrociata',
        ],
      },
    ],
  },
]

const ADS_CHAPTERS: ChapterSource[] = [
  {
    title: 'Fondamenti di affidabilità',
    from: 1,
    to: 80,
    pool: [
      {
        title: 'Funzione di affidabilità',
        kind: 'formula',
        formula: 'R(t) = e^(−λt)',
        formulaCaption: 'Con tasso di guasto λ costante',
      },
      {
        title: 'MTTF e MTBF',
        kind: 'bullets',
        bullets: ['MTTF: tempo medio al primo guasto', 'MTBF = MTTF + MTTR', 'Disponibilità A = MTTF / MTBF'],
      },
    ],
  },
  {
    title: 'Sistemi serie e parallelo',
    from: 81,
    to: 160,
    pool: [
      {
        title: 'Sistema in serie',
        kind: 'formula',
        formula: 'Rₛ = Π Rᵢ',
        formulaCaption: 'Il sistema funziona solo se tutti i componenti funzionano',
      },
    ],
  },
  {
    title: 'Fault Tree Analysis',
    from: 161,
    to: 240,
    pool: [
      {
        title: 'Alberi dei guasti',
        kind: 'bullets',
        bullets: [
          'Evento top e porte logiche AND/OR',
          'Minimal cut set',
          'Analisi quantitativa della probabilità',
        ],
      },
    ],
  },
]

const SOURCES: Record<string, ChapterSource[]> = {
  'doc-gps': GPS_CHAPTERS,
  'doc-ia': AI_CHAPTERS,
  'doc-ads': ADS_CHAPTERS,
}

const stripPool = (c: ChapterSource[]): Chapter[] => c.map(({ title, from, to }) => ({ title, from, to }))

export const GPS_CHAPTER_LIST = stripPool(GPS_CHAPTERS)

export const DOCUMENTS: StudyDocument[] = [
  {
    id: 'doc-gps',
    examId: 'gps',
    name: 'Gestione Progetti Software.pdf',
    kind: 'pdf',
    pages: 310,
    lastPage: 119,
    pagesRead: 118,
    chapters: GPS_CHAPTER_LIST,
    updatedAt: '2026-09-30',
    sizeLabel: '18,4 MB',
  },
  {
    id: 'doc-ia',
    examId: 'ia',
    name: 'Intelligenza Artificiale — Dispense.pdf',
    kind: 'pdf',
    pages: 180,
    lastPage: 26,
    pagesRead: 25,
    chapters: stripPool(AI_CHAPTERS),
    updatedAt: '2026-09-28',
    sizeLabel: '9,1 MB',
  },
  {
    id: 'doc-ads',
    examId: 'ads',
    name: 'Affidabilità dei Sistemi.pdf',
    kind: 'slides',
    pages: 240,
    lastPage: 1,
    pagesRead: 0,
    chapters: stripPool(ADS_CHAPTERS),
    updatedAt: '2026-09-25',
    sizeLabel: '12,7 MB',
  },
]

const slideCache = new Map<string, Slide>()

export function getSlide(documentId: string, number: number): Slide {
  const key = `${documentId}:${number}`
  const cached = slideCache.get(key)
  if (cached) return cached

  const source = SOURCES[documentId]
  if (!source) {
    const document = DOCUMENTS.find((d) => d.id === documentId)
    if (!document) throw new Error('Documento non trovato')
    return {
      number,
      chapter: document.chapters.find((c) => number >= c.from && number <= c.to)?.title ?? 'Materiale',
      title: `${document.name} · pagina ${number}`,
      kind: 'bullets',
      bullets: [
        'Anteprima dimostrativa del materiale aggiunto.',
        'Il contenuto del PDF originale sarà disponibile dopo l’elaborazione del documento.',
      ],
      footnote: 'Questa pagina non rappresenta il contenuto del file caricato.',
    }
  }
  const chapters = source
  const chapter = chapters.find((c) => number >= c.from && number <= c.to) ?? chapters[chapters.length - 1]
  const chapterIndex = chapters.indexOf(chapter) + 1
  let slide: Slide

  if (number === chapter.from) {
    slide = {
      number,
      chapter: chapter.title,
      kind: 'title',
      title: chapter.title,
      subtitle: `Capitolo ${chapterIndex} · Slide ${chapter.from}–${chapter.to}`,
    }
  } else {
    const offset = number - chapter.from - 1
    const template = chapter.pool[offset % chapter.pool.length]
    const round = Math.floor(offset / chapter.pool.length)
    slide = {
      ...template,
      number,
      chapter: chapter.title,
      title: round === 0 ? template.title : `${template.title} (${round + 1})`,
    }
  }
  slideCache.set(key, slide)
  return slide
}

export function slideToText(slide: Slide): string {
  const parts = [slide.title]
  if (slide.subtitle) parts.push(slide.subtitle)
  if (slide.bullets) parts.push(...slide.bullets)
  if (slide.formula) parts.push(slide.formula, slide.formulaCaption ?? '')
  if (slide.diagram) parts.push(...slide.diagram.map((d) => [d.label, ...(d.children ?? [])].join(', ')))
  if (slide.table) parts.push(slide.table.head.join(' | '), ...slide.table.rows.map((r) => r.join(' | ')))
  if (slide.footnote) parts.push(slide.footnote)
  return parts.filter(Boolean).join('\n')
}
