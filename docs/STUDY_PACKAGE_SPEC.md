# Study Package v1.0

Study Package è il formato JSON che porta in RandyFLOW contenuti didattici già preparati. Il file usa l’estensione `.study` (consigliata) oppure `.json`. Non contiene progresso, risposte dello studente, sessioni, mastery o statistiche: questi dati restano nell’app e vengono conservati quando il package viene aggiornato.

## Identità e aggiornamenti

- `format` deve essere `randyflow-study-package`.
- `version` deve essere `1.0`.
- `packageId` è l’identità stabile del package. Non cambiarlo tra revisioni.
- `revision` è un intero positivo e deve aumentare per ogni aggiornamento.
- Gli `id` di esame, materiali, argomenti e attività devono restare stabili se rappresentano lo stesso elemento. Questo permette all’app di conservare il progresso.
- `generatedAt` è una data e ora ISO 8601; `language` è un codice lingua, per esempio `it`.

## Struttura

```json
{
  "format": "randyflow-study-package",
  "version": "1.0",
  "packageId": "stringa-stabile",
  "revision": 1,
  "generatedAt": "2026-09-30T12:00:00Z",
  "language": "it",
  "exam": {},
  "materials": [],
  "topics": [],
  "quizzes": [],
  "flashcards": [],
  "examQuestions": []
}
```

### `exam`

`id` e `name` sono obbligatori. `description` e `examDate` (`YYYY-MM-DD`) sono facoltativi. L’`id` deve essere breve, stabile e univoco.

### `materials`

Ogni materiale richiede `id`, `name`, `type` (`pdf`, `slides` o `notes`) e `pageCount` intero positivo. I numeri usati in tutti gli `slideRefs` si riferiscono alle pagine del materiale. Un argomento identifica il materiale tramite `materialId`.

### `topics`

Ogni argomento richiede:

- `id`, `materialId`, `name`;
- `pageType`, che classifica la pagina come `content`, `cover`, `index`, `section-divider`, `blank`, `references` oppure `exercise`;
- `slideRange` con `from` e `to` inclusivi, interi positivi;
- `difficulty` e `importance`, interi da 1 a 5;
- `estimatedMinutes`, minuti interi positivi necessari per studiare l’intero intervallo;
- `explanations.simple`, `explanations.normal`, `explanations.deep`;
- `summary`, `keyConcepts[]`, `examples[]`;
- `quizIds[]`, `flashcardIds[]`, `examQuestionIds[]`, contenenti solo ID esistenti.

Gli intervalli devono coprire le slide utili senza uscire da `pageCount`. Se una slide appartiene a un argomento, l’Assistente di Studio mostra automaticamente quel contenuto. Le tre spiegazioni devono trattare lo stesso argomento con profondità crescente. Il riassunto deve essere autonomo; concetti ed esempi devono essere specifici e verificabili nelle slide.

`pageType` ? facoltativo per mantenere compatibili i package v1.0 gi? creati; se manca, l'app usa `content`. Nei nuovi package deve essere sempre presente. Copertine, indici, separatori, pagine vuote, riferimenti ed esercizi devono avere un topic dedicato alla singola pagina. I contenuti associati devono descrivere fedelmente ci? che appare: una copertina non va trattata come una lezione e una pagina vuota non deve generare nozioni inventate.

### `quizzes`

Campi comuni: `id`, `topicId`, `type`, `prompt`, `correctAnswer`, `explanation`, `slideRefs` non vuoto.

- `multiple`: `options` contiene almeno due risposte e `correctAnswer` è l’indice zero-based dell’opzione corretta.
- `open`: `correctAnswer` è la risposta modello; `acceptedKeywords` può elencare parole chiave utili.

La spiegazione deve motivare la risposta. Tutti i riferimenti devono indicare le slide che contengono l’evidenza.

### `flashcards`

Ogni elemento richiede `id`, `topicId`, `front`, `back` e `slideRefs` non vuoto. Il fronte deve porre una singola domanda; il retro deve essere breve ma sufficiente a ripassare il concetto.

### `examQuestions`

Ogni elemento richiede `id`, `topicId`, `prompt`, `modelAnswer`, `evaluationCriteria[]` e `slideRefs` non vuoto. Queste domande alimentano la Simulazione Esame. La risposta modello deve essere completa e i criteri devono consentire un’autovalutazione concreta.

## Regole di validità

1. Il file deve contenere un solo oggetto JSON, senza Markdown o commenti.
2. Tutti gli ID devono essere univoci nella propria collezione e tutti i riferimenti devono esistere.
3. Ogni `topicId` deve esistere; ogni `materialId` deve esistere.
4. Ogni riferimento slide deve essere un intero positivo e ricadere nel materiale dell’argomento.
5. Ogni argomento deve avere contenuti reali per tutte le sezioni e almeno una domanda, una flashcard e una possibile domanda d’esame.
6. Non inventare informazioni assenti dal PDF. Segnalare in modo esplicito eventuali limiti nel testo del contenuto.
7. Validare il risultato con [`study-package-v1.schema.json`](./study-package-v1.schema.json) prima della consegna.

## Procedura consigliata dal PDF

Leggere tutte le pagine, rilevare titolo e numero effettivo di ciascuna slide, classificare ogni pagina con `pageType`, raggruppare intervalli coerenti, stimare difficoltà/importanza/tempo, scrivere i tre livelli di spiegazione e infine produrre attività con riferimenti puntuali. Controllare che nessun ID o riferimento sia orfano. L’esempio completo è in [`STUDY_PACKAGE_EXAMPLE.study`](./STUDY_PACKAGE_EXAMPLE.study).
