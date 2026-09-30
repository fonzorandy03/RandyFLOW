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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.web.FilterChainProxy;

@SpringBootTest
@Transactional
class BackendIntegrationTest {
  @Autowired StudyPackageService packages;
  @Autowired CoreService core;
  @Autowired PlannerService planner;
  @Autowired LearningService learning;
  @Autowired ApplicationRepository data;
  @Autowired AuthService auth;
  @Autowired WebApplicationContext web;
  @Autowired FilterChainProxy springSecurityFilterChain;

  private String example() throws Exception {
    return Files.readString(Path.of("..", "docs", "STUDY_PACKAGE_EXAMPLE.study"));
  }

  @Test void importsAndUpdatesPackageWithoutLosingProgress() throws Exception {
    var preview = packages.preview(example());
    packages.importPackage(preview.studyPackage());
    core.complete("economia-slide", 4, null);
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

  @Test void excludesNonStudyPagesButKeepsOriginalPageNumbers() throws Exception {
    packages.importPackage(packages.preview(example()).studyPackage());
    var sessions = planner.sessions("economia");
    assertThat(sessions).extracting(it.randyflow.dto.ApiDtos.SessionDto::slideFrom)
        .containsExactlyInAnyOrder(4, 5, 6);
    assertThat(core.exam("economia").totalSlides()).isEqualTo(3);
    assertThat(core.material("economia-slide").studyablePages()).isEqualTo(3);
    core.complete("economia-slide", 1, null);
    assertThat(core.material("economia-slide").pagesRead()).isZero();
    core.complete("economia-slide", 4, null);
    assertThat(core.material("economia-slide").pagesRead()).isEqualTo(1);
    assertThat(learning.mastery("economia").stream().map(it.randyflow.dto.ApiDtos.MasteryDto::id).toList())
        .containsExactly("economia-costi");
  }

  @Test void importsLegacyTopicsWithoutClassificationFields() throws Exception {
    String legacy = example()
        .replace("\"pageType\": \"content\",", "")
        .replace("\"studyable\": true,", "");
    var preview = packages.preview(legacy);
    var topic = preview.studyPackage().topics().stream().filter(t -> t.id().equals("economia-costi")).findFirst().orElseThrow();
    assertThat(topic.pageType()).isEqualTo("content");
    assertThat(topic.studyable()).isTrue();
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
    mvc.perform(post("/api/v1/study-packages/import").contentType("application/json").content(example()))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
  }

  @Test void separatesDataBetweenRegisteredUsers() throws Exception {
    var first = auth.register(new it.randyflow.dto.AuthDtos.RegisterRequest("Anna", "Verdi", "anna@example.com", "Password123!"));
    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(first.user().id(), null, java.util.List.of()));
    core.create(new it.randyflow.dto.ApiDtos.NewExam("Analisi", java.time.LocalDate.now().plusMonths(2), "", java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("Slide", 10)), java.util.Map.of(1, 60), java.util.List.of(), 2));
    var firstPackage = packages.importPackage(packages.preview(example()).studyPackage());
    assertThat(core.exams()).hasSize(2);

    var second = auth.register(new it.randyflow.dto.AuthDtos.RegisterRequest("Luca", "Neri", "luca@example.com", "Password123!"));
    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(second.user().id(), null, java.util.List.of()));
    assertThat(core.exams()).isEmpty();
    var secondPackage = packages.importPackage(packages.preview(example()).studyPackage());
    assertThat(secondPackage.examId()).isNotEqualTo(firstPackage.examId());
    assertThat(core.exams()).hasSize(1);
    SecurityContextHolder.clearContext();
  }

  @Test void protectsApiAndAcceptsBearerSession() throws Exception {
    MockMvc secureMvc=MockMvcBuilders.webAppContextSetup(web).addFilters(springSecurityFilterChain).build();
    secureMvc.perform(get("/api/v1/exams")).andExpect(status().isUnauthorized());
    String body=secureMvc.perform(post("/api/v1/auth/register").contentType("application/json").content("""
      {"firstName":"Marta","lastName":"Blu","email":"marta@example.com","password":"Password123!"}
      """)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    String token=new com.fasterxml.jackson.databind.ObjectMapper().readTree(body).get("token").asText();
    secureMvc.perform(get("/api/v1/exams").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(content().json("[]"));
  }

  @Test void attachesPackageToExistingExamAndDeletesTheWholeExam() throws Exception {
    packages.importPackage(packages.preview(example()).studyPackage());
    var created=core.create(new it.randyflow.dto.ApiDtos.NewExam("ISTA",java.time.LocalDate.now().plusMonths(2),"Piano personale",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("ISTA_Dispensa_Capitoli_1-4.pdf",40)),java.util.Map.of(1,60),java.util.List.of(),7));
    String materialId=created.documentIds().get(0);
    var attached=packages.importPackage(packages.preview(example()).studyPackage(),created.id());
    assertThat(attached.examId()).isEqualTo(created.id());
    assertThat(core.exams()).hasSize(1);
    assertThat(packages.getByExam(created.id()).materials().get(0).id()).isEqualTo(materialId);
    assertThat(core.exam(created.id()).name()).isEqualTo("ISTA");

    core.deleteExam(created.id());
    assertThat(core.exams()).isEmpty();
    assertThatThrownBy(()->core.exam(created.id())).isInstanceOf(ApiException.class);
  }
}
