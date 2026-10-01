package it.randyflow;

import static org.assertj.core.api.Assertions.assertThat;
import it.randyflow.service.PdfPageClassifier;
import org.junit.jupiter.api.Test;

class PdfPageClassifierTest {
  private final PdfPageClassifier classifier = new PdfPageClassifier();
  @Test void recognizesFrontMatterWithoutExcludingLessonsOrExercises() {
    assertThat(classifier.classifyText("Dispensa Completa ISTA Capitoli 1-4\nCome usare questa dispensa\nLeggi ogni capitolo seguendo Spiegazione, Esempio e Domanda d'esame.\nEsempio guida usato in tutta la dispensa\nUn'app bancaria.",1,true)).isEqualTo("cover");
    assertThat(classifier.classifyText("Università di Napoli\nCorso di ISTA\nDispensa capitoli 1-4\nAnno accademico 2026",1,true)).isEqualTo("cover");
    assertThat(classifier.classifyText("Indice\n1 Software Maintenance .... 3\n2 Esercizi .... 9\n3 Teoremi .... 12",2,true)).isEqualTo("index");
    assertThat(classifier.classifyText("Capitolo 2\nSoftware testing",12,true)).isEqualTo("separator");
    assertThat(classifier.classifyText("Esercizio: descrivi la manutenzione del software e confronta le diverse attività.",8,true)).isEqualTo("content");
    assertThat(classifier.classifyText("Il valore di un indice dipende dalla struttura dati. Esempio: indice di un database.",5,true)).isEqualTo("content");
    assertThat(classifier.classifyText("",3,true)).isEqualTo("unclassified");
    assertThat(classifier.classifyText("",3,false)).isEqualTo("empty");
  }
}
