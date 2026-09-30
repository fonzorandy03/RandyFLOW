# Prompt per creare uno Study Package

Copia il testo seguente in ChatGPT e allega il PDF delle slide.

```text
Analizza integralmente il PDF allegato e crea un RandyFLOW Study Package v1.0.

Restituisci esclusivamente un singolo oggetto JSON valido, senza blocchi Markdown, commenti o testo introduttivo. Il file finale sarà salvato con estensione .study.

Segui esattamente la specifica Study Package v1.0 fornita sotto. Usa i numeri di pagina/slide del PDF come riferimenti. Non inventare contenuti assenti. Se una pagina è illeggibile, non colmare i vuoti con supposizioni.

Requisiti:
- format = "randyflow-study-package" e version = "1.0";
- crea packageId e tutti gli ID in kebab-case, stabili e univoci;
- revision = 1 per il primo file; per un aggiornamento mantieni packageId e gli ID esistenti e incrementa revision;
- includi esame e ogni materiale con pageCount esatto;
- copri tutte le slide didattiche con topics coerenti;
- per ogni topic indica slideRange, difficulty 1–5, importance 1–5 ed estimatedMinutes realistico;
- per ogni topic scrivi spiegazioni simple, normal e deep, summary, keyConcepts ed examples;
- crea almeno 2 quiz, 3 flashcard e 1 possibile domanda d’esame per ogni topic;
- ogni quiz deve avere risposta, spiegazione e slideRefs; per type "multiple", correctAnswer è l’indice zero-based dell’opzione corretta; per type "open", è la risposta modello;
- ogni flashcard e domanda d’esame deve avere slideRefs;
- ogni domanda d’esame deve avere modelAnswer ed evaluationCriteria;
- inserisci gli ID delle attività negli array del relativo topic;
- verifica che materialId, topicId e tutti gli ID referenziati esistano;
- verifica che gli slideRefs siano entro il pageCount del materiale associato;
- non includere progresso personale, voti, sessioni, mastery o statistiche.

Prima di rispondere, esegui mentalmente questi controlli: JSON parsabile; campi obbligatori presenti; ID univoci; riferimenti senza orfani; range validi; tutte le slide coperte; contenuti fondati sul PDF.

SPECIFICA:
[Incolla qui il contenuto di docs/STUDY_PACKAGE_SPEC.md]
```
