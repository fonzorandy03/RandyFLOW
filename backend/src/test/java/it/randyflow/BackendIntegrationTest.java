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
  @Test void startsOnTheChosenDayAndRedistributesAroundNewExceptionsWithoutLosingProgress() {
    var start = java.time.LocalDate.now(java.time.ZoneId.of("Europe/Rome")).plusDays(3);
    var exam = core.create(new it.randyflow.dto.ApiDtos.NewExam("Piano flessibile",start.plusDays(20),"",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("Dispensa.pdf",6)),java.util.Map.of(1,60,2,60,3,60,4,60,5,60,6,60,7,60),java.util.List.of(),2,start));
    var doc = core.materials().stream().filter(d -> d.examId().equals(exam.id())).findFirst().orElseThrow();
    assertThat(exam.startDate()).isEqualTo(start);
    assertThat(planner.sessions(exam.id()).get(0).date()).isEqualTo(start);
    core.complete(doc.id(),1,null);
    var blocked = java.util.List.of(start,start.plusDays(1),start.plusDays(7));
    var updated = planner.settings(exam.id(),new it.randyflow.dto.ApiDtos.PlanSettings(start,blocked,3));
    var sessions = planner.sessions(exam.id()).stream().filter(s -> "planned".equals(s.status())).toList();
    assertThat(updated.unavailableDays()).containsExactlyElementsOf(blocked);
    assertThat(updated.reviewDays()).isEqualTo(3);
    assertThat(sessions).allSatisfy(s -> {assertThat(blocked).doesNotContain(s.date());assertThat(s.date()).isAfterOrEqualTo(start);});
    assertThat(sessions.stream().flatMap(s -> java.util.stream.IntStream.rangeClosed(s.slideFrom(),s.slideTo()).boxed()).toList()).containsExactlyInAnyOrder(2,3,4,5,6);
    assertThat(core.material(doc.id()).pagesRead()).isEqualTo(1);
    assertThat(core.material(doc.id()).studyOrder()).isEqualTo(doc.studyOrder());
    assertThatThrownBy(() -> planner.settings(exam.id(),new it.randyflow.dto.ApiDtos.PlanSettings(exam.date(),java.util.List.of(),3))).isInstanceOf(ApiException.class);
    assertThat(core.exam(exam.id()).unavailableDays()).containsExactlyElementsOf(blocked);
  }
  @Test void completionCanBeUndoneAndSkippedDayMovesOnlyUnreadPages() {
    var today=java.time.LocalDate.now(java.time.ZoneId.of("Europe/Rome"));
    var exam=core.create(new it.randyflow.dto.ApiDtos.NewExam("Correzioni",today.plusDays(12),"",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("Dispensa.pdf",24)),java.util.Map.of(1,60,2,60,3,60,4,60,5,60,6,60,7,60),java.util.List.of(),2,today));
    var doc=core.materials().stream().filter(d->d.examId().equals(exam.id())).findFirst().orElseThrow();
    var session=planner.sessions(exam.id()).get(0);
    core.complete(doc.id(),session.slideFrom(),null);
    planner.report(session.id(),"skipped",null);
    assertThat(core.material(doc.id()).completedPages()).contains(session.slideFrom());
    assertThat(core.exam(exam.id()).unavailableDays()).contains(today);
    assertThat(planner.sessions(exam.id()).stream().filter(s->"planned".equals(s.status())).toList()).allSatisfy(s->assertThat(s.date()).isAfter(today));
    planner.report(session.id(),"planned",null);
    assertThat(core.exam(exam.id()).unavailableDays()).doesNotContain(today);
    assertThat(core.material(doc.id()).pagesRead()).isEqualTo(1);
    var next=planner.sessions(exam.id()).stream().filter(s->"planned".equals(s.status())).findFirst().orElseThrow();
    planner.report(next.id(),"completed",null);
    assertThat(core.material(doc.id()).completedPages()).contains(next.slideFrom());
    core.uncomplete(doc.id(),next.slideFrom());
    assertThat(core.material(doc.id()).completedPages()).doesNotContain(next.slideFrom());
    assertThat(core.exam(exam.id()).slidesCompleted()).isEqualTo(core.material(doc.id()).pagesRead());
    assertThat(planner.sessions(exam.id()).stream().filter(s->"planned".equals(s.status())).toList()).anySatisfy(s->assertThat(next.slideFrom()).isBetween(s.slideFrom(),s.slideTo()));
  }
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

  @Test void plansEveryMaterialAndKeepsTheirPageNumbersSeparate() {
    var exam = core.create(new it.randyflow.dto.ApiDtos.NewExam("Due dispense", java.time.LocalDate.now().plusDays(20), "", java.util.List.of(
        new it.randyflow.dto.ApiDtos.DocumentInput("Parte A.pdf", 30),
        new it.randyflow.dto.ApiDtos.DocumentInput("Parte B.pdf", 20)), java.util.Map.of(1, 60, 2, 60, 3, 60, 4, 60, 5, 60, 6, 60), java.util.List.of(), 3));
    var sessions = planner.sessions(exam.id());
    assertThat(sessions.stream().map(it.randyflow.dto.ApiDtos.SessionDto::materialId).distinct().toList())
        .containsExactlyInAnyOrderElementsOf(exam.documentIds());
    assertThat(sessions).allSatisfy(session -> {
      assertThat(session.materialName()).isNotBlank();
      assertThat(session.slideTo() - session.slideFrom() + 1).isPositive();
    });
    assertThat(sessions.stream().filter(s -> s.materialId().equals(exam.documentIds().get(1))).mapToInt(it.randyflow.dto.ApiDtos.SessionDto::slideTo).max()).hasValue(20);
    assertThat(sessions.stream().mapToInt(s -> s.slideTo()-s.slideFrom()+1).sum()).isEqualTo(50);
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

  @Test void refusesPackagesWithDifferentPhysicalPageCounts() throws Exception {
    var exam = core.create(new it.randyflow.dto.ApiDtos.NewExam("PDF originale",java.time.LocalDate.now().plusMonths(2),"",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("Lezione 1.pdf",40)),java.util.Map.of(1,60),java.util.List.of(),2));
    assertThatThrownBy(() -> packages.importPackage(packages.preview(example()).studyPackage(),exam.id())).isInstanceOf(ApiException.class).hasMessageContaining("40 pagine");
    assertThat(core.material(exam.documentIds().get(0)).pages()).isEqualTo(40);
    assertThat(core.material(exam.documentIds().get(0)).name()).isEqualTo("Lezione 1.pdf");
  }

  private byte[] dispensaPdf() throws Exception {
    try (var document = new PDDocument(); var output = new java.io.ByteArrayOutputStream()) {
      for (String content : java.util.List.of("Universita - Dispensa ISTA", "Indice\n1 Manutenzione .... 3\n2 Testing .... 4", "Definizione: manutenzione del software. Esempio e spiegazione del contenuto.", "Esercizio: confronta manutenzione e testing.")) {
        var page = new PDPage(); document.addPage(page);
        try (var stream = new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page)) {
          stream.beginText(); stream.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA),12);
          stream.setLeading(18); stream.newLineAtOffset(40,700);
          for (String line : content.split("\n")) { stream.showText(line); stream.newLine(); }
          stream.endText();
        }
      }
      document.save(output); return output.toByteArray();
    }
  }

  @Test void analyzesTwoPdfsAndKeepsCoversOutOfTheirIndependentPlans() throws Exception {
    var exam = core.create(new it.randyflow.dto.ApiDtos.NewExam("ISTA due PDF",java.time.LocalDate.now().plusDays(20),"",java.util.List.of(
        new it.randyflow.dto.ApiDtos.DocumentInput("dispensa_ISTA_Cap5-8.pdf",4),
        new it.randyflow.dto.ApiDtos.DocumentInput("ISTA_Dispensa_Capitoli_1-4.pdf",4)),java.util.Map.of(1,60,2,60,3,60,4,60,5,60,6,60),java.util.List.of(),2));
    var second = core.upload(exam.id(),new MockMultipartFile("file","dispensa_ISTA_Cap5-8.pdf","application/pdf",dispensaPdf()));
    var first = core.upload(exam.id(),new MockMultipartFile("file","ISTA_Dispensa_Capitoli_1-4.pdf","application/pdf",dispensaPdf()));
    assertThat(planner.sessions(exam.id()).get(0).materialId()).isEqualTo(second.id());
    assertThatThrownBy(() -> core.reorder(exam.id(),java.util.List.of(first.id(),first.id()))).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> core.reorder(exam.id(),java.util.List.of(first.id(),"foreign-document"))).isInstanceOf(ApiException.class);
    assertThat(planner.sessions(exam.id()).get(0).materialId()).isEqualTo(second.id());
    assertThat(core.reorder(exam.id(),java.util.List.of(first.id(),second.id()))).extracting(it.randyflow.dto.ApiDtos.MaterialDto::id).containsExactly(first.id(),second.id());
    assertThat(core.material(first.id()).studyOrder()).isEqualTo(0);
    assertThat(first.studyablePages()).isEqualTo(2);
    assertThat(first.pageSelection()).filteredOn(p -> !p.studyable()).extracting(it.randyflow.dto.ApiDtos.PageInfo::page).containsExactly(1,2);
    var plan = planner.sessions(exam.id());
    assertThat(plan.get(0).materialId()).isEqualTo(first.id());
    assertThat(plan).allSatisfy(s -> { assertThat(s.slideFrom()).isGreaterThanOrEqualTo(3); assertThat(s.slideTo()).isLessThanOrEqualTo(4); });
    assertThat(plan.stream().flatMap(s -> java.util.stream.IntStream.rangeClosed(s.slideFrom(),s.slideTo()).mapToObj(p -> s.materialId()+":"+p)).toList())
        .containsExactlyInAnyOrder(first.id()+":3",first.id()+":4",second.id()+":3",second.id()+":4");
    var wrongSession = plan.stream().filter(s -> s.materialId().equals(second.id())).findFirst().orElseThrow();
    assertThatThrownBy(() -> core.complete(first.id(),3,wrongSession.id())).isInstanceOf(ApiException.class);
    core.complete(first.id(),1,null); assertThat(core.material(first.id()).pagesRead()).isZero();
    core.complete(first.id(),3,null); assertThat(core.material(first.id()).pagesRead()).isEqualTo(1);
    assertThat(core.material(second.id()).pagesRead()).isZero();
    core.selectPage(first.id(),1,true); core.analyze(first.id());
    assertThat(core.material(first.id()).pageSelection().get(0).studyable()).isTrue();
    assertThat(core.exam(exam.id()).totalSlides()).isEqualTo(5);
    assertThat(core.material(first.id()).pagesRead()).isEqualTo(1);
    core.selectPage(first.id(),1,null); assertThat(core.exam(exam.id()).totalSlides()).isEqualTo(4);
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
    var created=core.create(new it.randyflow.dto.ApiDtos.NewExam("ISTA",java.time.LocalDate.now().plusMonths(2),"Piano personale",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("ISTA_Dispensa_Capitoli_1-4.pdf",6)),java.util.Map.of(1,60),java.util.List.of(),7));
    String materialId=created.documentIds().get(0);
    assertThatThrownBy(() -> packages.importPackage(packages.preview(example()).studyPackage(),created.id())).isInstanceOf(ApiException.class);
    var attached=packages.importPackage(packages.preview(example()).studyPackage(),created.id(),"{\"economia-slide\":\""+materialId+"\"}");
    assertThat(attached.examId()).isEqualTo(created.id());
    assertThat(core.exams()).hasSize(1);
    assertThat(packages.getByExam(created.id()).materials().get(0).id()).isEqualTo(materialId);
    assertThat(core.exam(created.id()).name()).isEqualTo("ISTA");

    core.deleteExam(created.id());
    assertThat(core.exams()).isEmpty();
    assertThatThrownBy(()->core.exam(created.id())).isInstanceOf(ApiException.class);
  }
  @Test void addsAnotherDispensaAndUpdatesOnlyItsContents() throws Exception {
    var exam=core.create(new it.randyflow.dto.ApiDtos.NewExam("Two PDFs",java.time.LocalDate.now().plusMonths(2),"",java.util.List.of(new it.randyflow.dto.ApiDtos.DocumentInput("first.pdf",6),new it.randyflow.dto.ApiDtos.DocumentInput("second.pdf",6)),java.util.Map.of(1,120),java.util.List.of(),7));
    String first=exam.documentIds().get(0),second=exam.documentIds().get(1);
    var original=packages.preview(example()).studyPackage();
    packages.importPackage(original,exam.id(),new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(java.util.Map.of("economia-slide",first)));
    core.complete(first,4,null);
    var incoming=packages.preview(example().replace("economia","seconda")).studyPackage();
    packages.importPackage(incoming,exam.id(),new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(java.util.Map.of("seconda-slide",second)));
    var merged=packages.getByExam(exam.id());
    assertThat(merged.materials()).extracting(StudyPackageDto.Material::id).containsExactlyInAnyOrder(first,second);
    assertThat(merged.topics()).hasSize(original.topics().size()+incoming.topics().size());
    assertThat(core.material(first).pagesRead()).isEqualTo(1);
    String updated=example().replace("economia","seconda").replace("\"revision\": 1","\"revision\": 2");
    packages.importPackage(packages.preview(updated).studyPackage(),exam.id(),new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(java.util.Map.of("seconda-slide",second)));
    assertThat(packages.getByExam(exam.id()).topics()).hasSize(merged.topics().size());
    assertThat(core.material(first).pagesRead()).isEqualTo(1);
  }

}
