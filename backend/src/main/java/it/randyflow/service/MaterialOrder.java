package it.randyflow.service;

import it.randyflow.domain.StudyMaterialEntity;
import java.util.Comparator;
import java.util.Locale;
import java.util.regex.Pattern;

/** Chapter ranges take precedence over alphabetic filename prefixes. */
public final class MaterialOrder {
  private static final Pattern NUMBER = Pattern.compile("\\d+");
  private MaterialOrder() {}
  public static int firstNumber(String name) {
    var match = NUMBER.matcher(name);
    if (!match.find()) return Integer.MAX_VALUE;
    try { return Integer.parseInt(match.group()); }
    catch (NumberFormatException ignored) { return Integer.MAX_VALUE; }
  }
  public static final Comparator<StudyMaterialEntity> COMPARATOR = Comparator
      .comparingInt((StudyMaterialEntity m) -> m.studyOrder == null ? Integer.MAX_VALUE : m.studyOrder)
      .thenComparingInt(m -> firstNumber(m.name))
      .thenComparing(m -> m.name.toLowerCase(Locale.ROOT)).thenComparing(m -> m.id);
}
