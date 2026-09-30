# Prompt ChatGPT per Study Package v1.0

Copia il testo seguente in ChatGPT e allega il PDF.

``text
Analizza integralmente il PDF allegato, pagina per pagina, e crea un RandyFLOW Study Package v1.0.

Restituisci esclusivamente un singolo oggetto JSON valido, senza blocchi Markdown, commenti o testo introduttivo. Il file sarà salvato con estensione .study.

CONTROLLO VISIVO E TESTUALE OBBLIGATORIO
1. Conta le pagine reali e crea internamente un inventario numerato da 1 a pageCount.
2. Esamina ogni pagina usando sia il testo estratto sia la resa visiva completa: titoli, immagini, diagrammi, formule, tabelle, densità e impaginazione.
3. Non saltare, duplicare, accorpare o rinumerare pagine. Crea esattamente un topic per pagina, con slideRange.from = slideRange.to = numero originale del PDF.
4. Classifica semanticamente ogni pagina con pageType: content, cover, index, separator, reference oppure empty.
5. Imposta studyable=true soltanto per content realmente didattico. Per cover, index, separator, reference ed empty imposta sempre studyable=false.
6. Se una pagina sembra un indice, una copertina o un separatore, non classificarla come content solo perché contiene testo.
7. Prima di rispondere verifica la copertura esatta di tutte le pagine da 1 a pageCount, senza buchi o sovrapposizioni.

REGOLE PER PAGINE NON DIDATTICHE
Per studyable=false usa difficulty=1, importance=1, estimatedMinutes=0, keyConcepts ed examples vuoti e quizIds, flashcardIds, examQuestionIds vuoti. Non creare quiz, flashcard o domande d'esame collegate. Descrivi fedelmente la funzione della pagina nelle spiegazioni e nel riassunto, senza inventare contenuti.

CONTENUTO OBBLIGATORIO PER OGNI PAGINA DIDATTICA
- Tre spiegazioni realmente didattiche e riferite solo alla pagina: simple chiara per un principiante; normal completa, con passaggi e collegamenti; deep approfondita, precisa e utile per preparare un esame.
- Un summary sostanziale, non una sola frase generica.
- Tutti i keyConcepts presenti o direttamente ricavabili dalla pagina.
- Esempi coerenti. Se aggiungi un esempio non presente nel PDF, dichiaralo come esempio esplicativo.
- Almeno un quiz con risposta, spiegazione e slideRefs della pagina.
- Almeno una flashcard con domanda, risposta e slideRefs della pagina.
- Almeno una possibile domanda d'esame con risposta modello, criteri e slideRefs della pagina.
- Puoi usare Markdown dentro spiegazioni e summary: titoli ##/###, **grassetto**, elenchi e paragrafi.

COERENZA
Ogni contenuto deve essere coerente con la pagina indicata. Non spostare contenuti da altre pagine. Mantieni formule, definizioni, nomi, unità di misura e relazioni logiche fedeli al PDF. Se una pagina dipende dalla precedente, spiega il collegamento senza attribuirle informazioni assenti.

STRUTTURA
Usa format "randyflow-study-package", version "1.0", ID stabili e univoci in kebab-case. Per aggiornare un package mantieni packageId e ID esistenti e incrementa revision. Non includere progresso, sessioni, risultati, mastery o statistiche.

Ogni topic deve contenere: id, materialId, name, pageType, studyable, slideRange, difficulty, importance, estimatedMinutes, explanations {simple, normal, deep}, summary, keyConcepts, examples, quizIds, flashcardIds, examQuestionIds.
Ogni quiz deve contenere id, topicId, type, prompt, options quando multiple, correctAnswer (indice zero-based per multiple), acceptedKeywords, explanation, slideRefs.
Ogni flashcard deve contenere id, topicId, front, back, slideRefs.
Ogni domanda d'esame deve contenere id, topicId, prompt, modelAnswer, evaluationCriteria, slideRefs.

CONTROLLO FINALE
- Prima di accettare explanations.simple chiediti: "Uno studente che parte da zero capirebbe davvero questa pagina senza una spiegazione orale del professore?" Se NO, approfondisci.
- Prima di accettare summary chiediti: "Uno studente potrebbe usare questo riassunto per ripassare seriamente questa pagina prima dell'esame?" Se NO, amplialo.
- Il JSON è parsabile e conforme allo schema Study Package v1.0.
- pageCount coincide con il PDF e ogni pagina ha un solo topic.
- La classificazione deriva dal significato e dall'aspetto della pagina.
- Tutti e soli i topic content didattici hanno studyable=true.
- Ogni pagina didattica ha spiegazioni lunghe e utili, summary, concetti, esempi, quiz, flashcard e domanda d'esame.
- Le pagine non didattiche hanno tempo 0 e nessuna attività.
- Tutti gli ID e slideRefs esistono e puntano alla pagina originale corretta.
- Hai ricontrollato l'ultima pagina e non ti sei fermato prima della fine.
- Nessun contenuto è inventato o incoerente con la pagina.

Non omettere campi e restituisci soltanto il JSON.
``
