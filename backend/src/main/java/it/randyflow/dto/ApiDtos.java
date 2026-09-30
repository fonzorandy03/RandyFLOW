package it.randyflow.dto;

import jakarta.validation.constraints.*; import java.time.*; import java.util.*;

public final class ApiDtos { private ApiDtos() {}
 public record PackageSummary(String packageId,int revision,String examId,String examName,int materialCount,int topicCount,int quizCount,int flashcardCount,int examQuestionCount,boolean isUpdate) {}
 public record PackagePreview(StudyPackageDto studyPackage, PackageSummary summary) {}
 public record ExamDto(String id,String name,String shortName,LocalDate date,String description,int totalSlides,int slidesCompleted,int minutesStudied,String status,List<String> documentIds,int reviewDays,List<LocalDate> unavailableDays,Map<Integer,Integer> availability,LocalDate createdAt) {}
 public record NewExam(@NotBlank String name,@NotNull LocalDate date,String description,@NotNull List<DocumentInput> documents,@NotNull Map<Integer,Integer> availability,@NotNull List<LocalDate> unavailableDays,@Min(0) int reviewDays) {}
 public record DocumentInput(@NotBlank String name,@Min(1) int pages) {}
 public record MaterialDto(String id,String examId,String name,String kind,int pages,int studyablePages,int lastPage,int pagesRead,List<Chapter> chapters,LocalDate updatedAt,String sizeLabel) {}
 public record Chapter(String title,int from,int to) {}
 public record Position(@Min(1) int page) {}
 public record Completion(String sessionId) {}
 public record StudyLogInput(@NotBlank String examId,@NotBlank String documentId,@Min(1) int fromPage,@Min(1) int toPage,@Min(1) int minutes,@NotBlank String label) {}
 public record StudyLogDto(String id,String examId,String documentId,LocalDate date,int fromPage,int toPage,int minutes,String label) {}
 public record TaskDto(String id,String kind,String label,int durationMin,boolean done,String meta) {}
 public record SessionDto(String id,String examId,String materialId,String materialName,LocalDate date,String status,String topic,Integer slideFrom,Integer slideTo,Integer slidesDone,Integer nextPage,int durationMin,Integer previousDurationMin,List<TaskDto> tasks,String note) {}
 public record QuizDto(String id,String type,String prompt,List<String> options,Integer correctIndex,List<String> acceptedKeywords,String modelAnswer,String explanation,int slideRef,String topicId,String topicName) {}
 public record QuizAnswer(@NotBlank String questionId,boolean correct,String given) {}
 public record QuizSubmission(@NotNull List<@jakarta.validation.Valid QuizAnswer> answers) {}
 public record FlashcardDto(String id,String front,String back,int slideRef,String topic) {}
 public record Rating(@Pattern(regexp="unknown|hard|known") String rating) {}
 public record MasteryDto(String id,String examId,String name,int score,String trend,boolean needsReview,int slideFrom,int slideTo,int attempts) {}
 public record SimulationInput(@NotBlank String questionId,@NotNull String answer,@Min(0) @Max(100) int rating) {}
 public record PreferenceDto(int sessionMinutes,int breakMinutes,boolean notifications,boolean autoBreak,String explanationLevel) {}
 public record ProfileDto(String id,String firstName,String lastName,String email,String university,String course,String year,String initials) {}
 public record StatsDto(int weekMinutes,int weekSlides,int taskCompletion,int quizAccuracy,int streakDays,List<Map<String,Object>> daily,List<Map<String,Object>> consistency,List<Map<String,Object>> planVsActual) {}
}
