package it.randyflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.randyflow.domain.*;
import it.randyflow.dto.ApiDtos.PageInfo;
import it.randyflow.exception.ApiException;
import it.randyflow.repository.*;
import java.io.IOException;
import java.util.*;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;

@Service
public class PageSelectionService {
  private final ObjectMapper json;
  private final TopicRepository topics;
  private final StudyMaterialRepository materials;
  private final ExamRepository exams;
  private final MaterialStorageService storage;
  private final PdfPageClassifier classifier;
  public PageSelectionService(ObjectMapper json, TopicRepository topics, StudyMaterialRepository materials,
      ExamRepository exams, MaterialStorageService storage, PdfPageClassifier classifier) {
    this.json=json; this.topics=topics; this.materials=materials; this.exams=exams; this.storage=storage; this.classifier=classifier;
  }
  public List<PageInfo> pages(StudyMaterialEntity material) {
    Map<Integer,String> types = read(material.pageTypesJson, new TypeReference<>() {}, Map.of());
    Map<Integer,Boolean> overrides = read(material.pageOverridesJson, new TypeReference<>() {}, Map.of());
    List<TopicEntity> ts = topics.findByMaterialIdIn(List.of(material.id));
    return IntStream.rangeClosed(1, material.pageCount).mapToObj(page -> {
      var topic = ts.stream().filter(t -> page >= t.slideFrom && page <= t.slideTo).findFirst().orElse(null);
      String automatic = types.getOrDefault(page, "unclassified");
      String type = !Set.of("content", "unclassified").contains(automatic) ? automatic : topic != null ? topic.pageType : automatic;
      boolean studyable = Set.of("content", "unclassified").contains(type) && (topic == null || topic.studyable);
      String source = topic != null ? "package" : types.containsKey(page) ? "pdf" : "unclassified";
      if (overrides.containsKey(page)) { studyable = overrides.get(page); source = "manual"; }
      return new PageInfo(page, type, studyable, source);
    }).toList();
  }
  public Set<Integer> studyPages(StudyMaterialEntity material) {
    Set<Integer> selected = new LinkedHashSet<>();
    pages(material).stream().filter(PageInfo::studyable).forEach(p -> selected.add(p.page()));
    return selected;
  }
  public boolean ensureAnalyzed(StudyMaterialEntity material) {
    if (material.storagePath == null || material.pageTypesJson != null) return false;
    try { analyze(material); return true; }
    catch (RuntimeException ignored) { return false; } // Keep the existing plan usable if storage is unavailable.
  }
  public void analyze(StudyMaterialEntity material) {
    if (material.storagePath == null) throw ApiException.badRequest("Carica il PDF originale prima di analizzare le pagine.");
    try (var input = storage.load(material.storagePath, material.name).getInputStream()) {
      var detected = classifier.classify(input.readAllBytes());
      material.pageCount = detected.size();
      material.lastPage = Math.max(1, Math.min(material.lastPage, material.pageCount));
      material.pageTypesJson = write(detected);
      materials.save(material);
    } catch (IOException | IllegalStateException exception) { throw ApiException.badRequest("Non riesco ad analizzare il PDF. Riprova tra poco."); }
  }
  public void override(StudyMaterialEntity material, int page, Boolean studyable) {
    if (page < 1 || page > material.pageCount) throw ApiException.badRequest("Pagina non valida");
    Map<Integer,Boolean> overrides = new LinkedHashMap<>(read(material.pageOverridesJson, new TypeReference<Map<Integer,Boolean>>() {}, Map.of()));
    if (studyable == null) overrides.remove(page); else overrides.put(page, studyable);
    material.pageOverridesJson = write(overrides); materials.save(material);
  }
  public void recount(String examId) {
    var exam = exams.findById(examId).orElseThrow();
    int total = 0, completed = 0;
    for (var material : materials.findByExamId(examId)) {
      Set<Integer> selected = studyPages(material);
      List<Integer> done = read(material.completedPagesJson, new TypeReference<>() {}, List.of());
      material.studyablePages = selected.size();
      material.pagesRead = (int) done.stream().distinct().filter(selected::contains).count();
      total += material.studyablePages; completed += material.pagesRead;
      materials.save(material);
    }
    exam.totalSlides = total; exam.slidesCompleted = completed; exams.save(exam);
  }
  private String write(Object value) { try { return json.writeValueAsString(value); } catch (IOException e) { throw new IllegalStateException(e); } }
  private <T> T read(String value, TypeReference<T> type, T fallback) {
    if (value == null) return fallback;
    try { return json.readValue(value, type); } catch (IOException e) { throw new IllegalStateException(e); }
  }
}
