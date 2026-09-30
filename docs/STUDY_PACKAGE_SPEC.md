# RandyFLOW Study Package v1.0

## Scopo

Un file `.study` è JSON UTF-8 conforme a `study-package-v1.schema.json`. Contiene esclusivamente contenuti didattici derivati dai materiali. Progresso, sessioni, risultati, mastery, statistiche e preferenze restano nell'applicazione e vengono preservati quando aumenta `revision` dello stesso `packageId`.

## Struttura principale

Il package richiede `format: "randyflow-study-package"`, `version: "1.0"`, `packageId`, `revision`, `generatedAt`, `language`, `exam`, `materials`, `topics`, `quizzes`, `flashcards` ed `examQuestions`. Gli ID devono essere stabili, univoci e usare lettere, numeri, punto, trattino o underscore. Ogni riferimento deve puntare a un ID esistente.

`exam` descrive esame, nome, descrizione e data facoltativa. Ogni material dichiara ID, nome, tipo e `pageCount` reale. La numerazione in `slideRange` e `slideRefs` coincide sempre con la pagina fisica del PDF, a partire da 1.

## Topic e classificazione delle pagine

Per permettere un controllo preciso, un generatore deve creare un topic per ogni pagina (`from` uguale a `to`). Ogni topic contiene:

- `pageType`: `content`, `cover`, `index`, `separator`, `reference` o `empty`;
- `studyable`: indica se la pagina entra nello studio personale;
- intervallo originale, difficoltà, importanza, minuti stimati;
- spiegazioni `simple`, `normal` e `deep`, summary, concetti ed esempi;
- ID delle attività collegate.

Solo una pagina con `pageType: "content"` e `studyable: true` entra in Planner, carico, progresso e mastery. Copertine, indici, separatori, riferimenti e pagine vuote restano visibili nel lettore con la numerazione originale, ma richiedono `studyable: false`, `difficulty: 1`, `importance: 1`, `estimatedMinutes: 0` e liste di attività vuote. `keyConcepts` ed `examples` possono essere vuoti.

Per compatibilità, se `pageType` manca l'importer usa `content`; se `studyable` manca usa `true`. L'importer converte anche i vecchi alias `section-divider`, `references`, `blank` ed `exercise` rispettivamente in `separator`, `reference`, `empty` e `content`.

## Qualità dei contenuti

Le spiegazioni devono insegnare davvero il contenuto visibile della singola pagina. Il livello semplice introduce termini e intuizione; quello normale sviluppa passaggi e collegamenti; quello approfondito aggiunge precisione, implicazioni e preparazione d'esame. Il summary deve essere sostanziale. Markdown è consentito nelle spiegazioni e nei riassunti per titoli, grassetto, paragrafi ed elenchi.

La classificazione richiede analisi visiva e testuale. Titolo, layout, immagini, formule, tabelle, densità e funzione nel documento servono a distinguere contenuto, copertina, indice, separatore, riferimenti e pagina vuota. Non basta la presenza di testo.

## Attività

Quiz, flashcard e domande d'esame appartengono a un topic didattico e includono `slideRefs` validi. I quiz contengono risposta e spiegazione; le flashcard fronte e retro; le domande d'esame risposta modello e criteri di valutazione. Una risposta multipla usa in `correctAnswer` l'indice zero-based dell'opzione. Una risposta aperta usa una stringa.

## Aggiornamento

Per aggiornare un package si conserva `packageId`, si incrementa `revision` e si mantengono gli ID dei contenuti invariati quando rappresentano lo stesso elemento. L'app sostituisce i contenuti importati e ricalcola il piano, ma conserva pagine completate ancora didattiche, sessioni storiche, tentativi, recensioni e statistiche personali.

## Controlli prima della consegna

1. `pageCount` coincide con il PDF.
2. Ogni pagina fisica compare una sola volta e l'ultima pagina è stata analizzata.
3. `pageType` deriva da testo e aspetto della pagina.
4. Solo i contenuti didattici hanno `studyable: true`.
5. Le pagine didattiche hanno spiegazioni complete, summary, concetti, esempi e attività.
6. Le pagine non didattiche hanno tempo zero e nessuna attività.
7. Tutti gli ID e riferimenti esistono e puntano alle pagine originali corrette.
8. Nessun contenuto è inventato o attribuito alla pagina sbagliata.

Vedi `STUDY_PACKAGE_EXAMPLE.study` per un file completo e `CHATGPT_STUDY_PACKAGE_PROMPT.md` per il prompt autonomo da usare insieme al PDF.
