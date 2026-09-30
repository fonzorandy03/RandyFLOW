export const STUDY_PACKAGE_PROMPT = `Analizza integralmente il PDF allegato, pagina per pagina, e crea un RandyFLOW Study Package v1.0.

Restituisci esclusivamente un singolo oggetto JSON valido, senza Markdown, commenti o testo introduttivo. Il risultato verrà salvato con estensione .study.

CONTROLLO OBBLIGATORIO DELLE PAGINE
1. Prima di scrivere il JSON, conta le pagine reali del PDF e costruisci internamente un inventario numerato da 1 a pageCount.
2. Analizza ogni pagina individualmente, comprese copertine, indici, separatori, bibliografie, esercizi e pagine vuote o quasi vuote. Usa anche gli elementi visivi, non soltanto il testo estratto.
3. Non saltare, unire, duplicare o rinumerare pagine. I riferimenti devono coincidere con il numero mostrato dal lettore PDF.
4. Crea esattamente un topic per ogni pagina: slideRange.from e slideRange.to devono entrambi corrispondere a quella pagina.
5. Prima di rispondere, verifica che l'insieme dei topic copra esattamente tutte le pagine da 1 a pageCount, senza buchi e senza sovrapposizioni.
6. Classifica ogni pagina con pageType: content, cover, index, section-divider, blank, references oppure exercise. Basa la classificazione sul contenuto visibile della singola pagina.
7. Se una pagina ? illeggibile o priva di contenuto didattico, dichiaralo fedelmente nei contenuti di quella pagina. Non inventare informazioni.

PAGINE SPECIALI
- cover: descrivi solo titolo, autore, corso e altri dati realmente visibili; non trasformarla in una lezione.
- index: riporta fedelmente la struttura e le voci dell'indice, mantenendo eventuali numeri di pagina.
- section-divider: indica il titolo della sezione e il suo ruolo nel documento.
- blank: dichiara che la pagina ? vuota o priva di contenuto utile.
- references: riporta e organizza esclusivamente le fonti presenti.
- exercise: spiega consegna e dati presenti, senza inventare una soluzione non ricavabile dalla pagina.
- Per queste pagine, quiz, flashcard e domanda d?esame devono verificare il ruolo o le informazioni realmente visibili nella pagina. Non inventare concetti disciplinari assenti.

CONTENUTO OBBLIGATORIO PER OGNI SINGOLA PAGINA
- spiegazione simple, normal e deep riferita soltanto a ciò che compare in quella pagina;
- summary specifico della pagina;
- keyConcepts della pagina;
- examples coerenti con la pagina e chiaramente indicati come esempi esplicativi quando non sono presenti nel PDF;
- almeno un quiz sulla pagina, con risposta corretta, spiegazione e slideRefs contenente quella pagina;
- almeno una flashcard sulla pagina, con domanda, risposta e slideRefs contenente quella pagina;
- almeno una possibile domanda d'esame pertinente, con risposta modello, criteri di valutazione e riferimento alla pagina.

COERENZA OBBLIGATORIA
- Ogni spiegazione, riassunto, concetto, esempio, quiz e flashcard deve essere coerente con la pagina indicata.
- Non attribuire a una pagina contenuti presenti soltanto in altre pagine.
- Mantieni formule, definizioni, nomi, unità di misura e relazioni logiche fedeli al PDF.
- Quando una pagina dipende dalla precedente, spiega il collegamento senza spostare il contenuto da una pagina all'altra.

REQUISITI DEL PACKAGE
- format = "randyflow-study-package" e version = "1.0";
- packageId e tutti gli ID in kebab-case, stabili e univoci;
- revision = 1 per il primo file; per un aggiornamento mantieni packageId e gli ID esistenti e incrementa revision;
- includi exam e materials; pageCount deve essere il numero reale di pagine del PDF;
- per ogni topic indica difficulty 1-5, importance 1-5 ed estimatedMinutes realistico;
- per i quiz multiple, correctAnswer è l'indice zero-based dell'opzione corretta; per i quiz open è la risposta modello;
- collega quizIds, flashcardIds ed examQuestionIds al topic della stessa pagina;
- tutti i materialId, topicId e ID referenziati devono esistere;
- non includere progresso personale, sessioni, risultati, mastery o statistiche.

STRUTTURA JSON DA PRODURRE
{
  "format": "randyflow-study-package",
  "version": "1.0",
  "packageId": "...",
  "revision": 1,
  "generatedAt": "data ISO-8601",
  "language": "it",
  "exam": { "id": "...", "name": "...", "description": "...", "examDate": "YYYY-MM-DD oppure null" },
  "materials": [{ "id": "...", "name": "nome PDF", "type": "pdf", "pageCount": 1 }],
  "topics": [{
    "id": "...", "materialId": "...", "name": "...", "pageType": "content",
    "slideRange": { "from": 1, "to": 1 },
    "difficulty": 1, "importance": 1, "estimatedMinutes": 1,
    "explanations": { "simple": "...", "normal": "...", "deep": "..." },
    "summary": "...", "keyConcepts": ["..."], "examples": ["..."],
    "quizIds": ["..."], "flashcardIds": ["..."], "examQuestionIds": ["..."]
  }],
  "quizzes": [{
    "id": "...", "topicId": "...", "type": "multiple oppure open", "prompt": "...",
    "options": ["..."], "correctAnswer": 0, "acceptedKeywords": [],
    "explanation": "...", "slideRefs": [1]
  }],
  "flashcards": [{ "id": "...", "topicId": "...", "front": "...", "back": "...", "slideRefs": [1] }],
  "examQuestions": [{
    "id": "...", "topicId": "...", "prompt": "...", "modelAnswer": "...",
    "evaluationCriteria": ["..."], "slideRefs": [1]
  }]
}

CONTROLLO FINALE PRIMA DELLA RISPOSTA
- JSON parsabile e conforme a Study Package v1.0;
- pageCount uguale al PDF;
- numero di topic uguale a pageCount;
- per ogni numero da 1 a pageCount esiste un solo topic con from = to = quel numero;
- ogni topic contiene un pageType corretto e ogni copertina, indice, separatore, pagina vuota, pagina di riferimenti o esercizio ? riconosciuta;
- ogni pagina contiene tutte e tre le spiegazioni, summary, keyConcepts, examples, almeno un quiz, almeno una flashcard e almeno una domanda d'esame;
- nessun ID duplicato o riferimento orfano;
- tutti gli slideRefs sono validi e puntano alla pagina corretta;
- nessun contenuto inventato o incoerente con la pagina.

Non omettere nessun campo della struttura.`
