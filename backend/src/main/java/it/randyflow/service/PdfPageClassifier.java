package it.randyflow.service;

import java.io.IOException;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

@Component
public class PdfPageClassifier {
  public Map<Integer, String> classify(byte[] bytes) throws IOException {
    Map<Integer, String> result = new LinkedHashMap<>();
    try (var pdf = Loader.loadPDF(bytes)) {
      var stripper = new PDFTextStripper();
      stripper.setSortByPosition(true);
      for (int page = 1; page <= pdf.getNumberOfPages(); page++) {
        stripper.setStartPage(page); stripper.setEndPage(page);
        String text = stripper.getText(pdf);
        var sheet = pdf.getPage(page - 1);
        result.put(page, classifyText(text, page, sheet.hasContents()));
      }
    }
    return result;
  }
  public String classifyText(String text, int page, boolean hasContents) {
    String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    if (normalized.replaceAll("\\d|\\s", "").isEmpty()) return hasContents ? "unclassified" : "empty";
    List<String> lines = normalized.lines().map(String::trim).filter(s -> !s.isEmpty()).toList();
    String opening = String.join("\n", lines.subList(0, Math.min(6, lines.size())));
    boolean learning = Pattern.compile("\\b(definizione|esempio|da ricordare|domanda|esercizio|teorema|dimostrazione)\\b").matcher(normalized).find();
    boolean indexHeading = Pattern.compile("(?m)^(indice(?: generale)?|sommario|table of contents|contents)\\s*$").matcher(opening).find();
    long indexRows = lines.stream().filter(s -> s.matches(".*(?:\\.{2,}|\\s{2,})\\s*\\d+\\s*$") || s.matches("\\d+(?:\\.\\d+)*[.)]?\\s+.+\\s+\\d+$")).count();
    if (indexHeading && (indexRows >= 2 || (!learning && normalized.length() < 1800))) return "index";
    int words = normalized.split("\\s+").length;
    if (page == 1 && words < 100 && !learning && Pattern.compile("\\b(universita|dispensa|dispense|appunti|corso di|a\\.a\\.|anno accademico)\\b").matcher(normalized).find()) return "cover";
    if (words < 18 && !learning && Pattern.compile("(?m)^(capitolo|parte|sezione)\\s+[0-9ivx]+\\b").matcher(opening).find()) return "separator";
    return "content";
  }
}
