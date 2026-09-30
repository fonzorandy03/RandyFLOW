package it.randyflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import it.randyflow.dto.StudyPackageDto;
import it.randyflow.exception.ApiException;
import it.randyflow.repository.ApplicationRepository;
import it.randyflow.service.*;
import java.nio.file.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class BackendIntegrationTest {
  @Autowired StudyPackageService packages;
  @Autowired CoreService core;
  @Autowired PlannerService planner;
  @Autowired LearningService learning;
  @Autowired ApplicationRepository data;
  @Autowired WebApplicationContext web;

  private String example() throws Exception {
    return Files.readString(Path.of("..", "docs", "STUDY_PACKAGE_EXAMPLE.study"));
  }

  @Test void importsAndUpdatesPackageWithoutLosingProgress() throws Exception {
    var preview = packages.preview(example());
    packages.importPackage(preview.studyPackage());
    core.complete("economia-slide", 2, null);
    var mastery = data.masteryById("economia-costi");
    mastery.score = 72;
    data.save(mastery);

    String update = example().replace("\"revision\": 1", "\"revision\": 2")
        .replace("Costo totale = costo fisso", "Riassunto aggiornato. Costo totale = costo fisso");
    packages.importPackage(packages.preview(update).studyPackage());

    assertThat(core.material("economia-slide").pagesRead()).isEqualTo(1);
    assertThat(data.masteryById("economia-costi").score).isEqualTo(72);
    assertThat(packages.getByExam("economia").revision()).isEqualTo(2);
    assertThatThrownBy(() -> packages.importPackage(preview.studyPackage())).isInstanceOf(ApiException.class);
  }

  @Test void createsPlanAndPersistsLearningActivities() throws Exception {
    packages.importPackage(packages.preview(example()).studyPackage());
    assertThat(planner.recalculate("economia")).isNotEmpty();
    var quiz = learning.quiz("economia").get(0);
    learning.submitQuiz("economia", new it.randyflow.dto.ApiDtos.QuizSubmission(
        java.util.List.of(new it.randyflow.dto.ApiDtos.QuizAnswer(quiz.id(), true, "1"))));
    learning.review("economia", "card-costi-1", "known");
    var result = learning.simulation("economia", new it.randyflow.dto.ApiDtos.SimulationInput("exam-costi-1", "Risposta", 60));
    assertThat(result.attempts()).isGreaterThanOrEqualTo(3);
  }

  @Test void validatesCrossReferencesAndReadsRealPdfPageCount() throws Exception {
    String invalid = example().replace("\"topicId\": \"economia-costi\"", "\"topicId\": \"missing\"");
    assertThatThrownBy(() -> packages.preview(invalid)).isInstanceOf(ApiException.class);
    packages.importPackage(packages.preview(example()).studyPackage());
    byte[] pdf;
    try (var document = new PDDocument(); var output = new java.io.ByteArrayOutputStream()) {
      document.addPage(new PDPage()); document.addPage(new PDPage()); document.save(output); pdf = output.toByteArray();
    }
    var uploaded = core.upload("economia", new MockMultipartFile("file", "dispensa.pdf", "application/pdf", pdf));
    assertThat(uploaded.pages()).isEqualTo(2);
  }

  @Test void exposesVersionedRestApiAndOpenApi() throws Exception {
    MockMvc mvc = MockMvcBuilders.webAppContextSetup(web).build();
    mvc.perform(post("/api/v1/study-packages/preview").contentType("application/json").content(example()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.summary.packageId").value("economia-esempio"));
    mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
  }
}
