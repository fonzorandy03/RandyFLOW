package it.randyflow.dto;

import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.time.*; import java.util.*;

public record StudyPackageDto(
 @NotBlank String format, @NotBlank String version, @NotBlank String packageId, @Min(1) int revision,
 @NotNull OffsetDateTime generatedAt, @NotBlank String language, @Valid @NotNull Exam exam,
 @Valid @NotEmpty List<Material> materials, @Valid @NotEmpty List<Topic> topics,
 @Valid @NotNull List<Quiz> quizzes, @Valid @NotNull List<Flashcard> flashcards, @Valid @NotNull List<ExamQuestion> examQuestions) {
 public record Exam(@NotBlank String id,@NotBlank String name,String description,LocalDate examDate) {}
 public record Material(@NotBlank String id,@NotBlank String name,@Pattern(regexp="pdf|slides|notes") String type,@Min(1) int pageCount) {}
 public record Range(@Min(1) int from,@Min(1) int to) {}
 public record Explanations(@NotBlank String simple,@NotBlank String normal,@NotBlank String deep) {}
 public record Topic(@NotBlank String id,@NotBlank String materialId,@NotBlank String name,@Valid @NotNull Range slideRange,@Min(1) @Max(5) int difficulty,@Min(1) @Max(5) int importance,@Min(1) int estimatedMinutes,@Valid @NotNull Explanations explanations,@NotBlank String summary,@NotEmpty List<@NotBlank String> keyConcepts,@NotEmpty List<@NotBlank String> examples,@NotNull List<String> quizIds,@NotNull List<String> flashcardIds,@NotNull List<String> examQuestionIds) {}
 public record Quiz(@NotBlank String id,@NotBlank String topicId,@Pattern(regexp="multiple|open") String type,@NotBlank String prompt,List<String> options,@NotNull Object correctAnswer,List<String> acceptedKeywords,@NotBlank String explanation,@NotEmpty List<@Min(1) Integer> slideRefs) {}
 public record Flashcard(@NotBlank String id,@NotBlank String topicId,@NotBlank String front,@NotBlank String back,@NotEmpty List<@Min(1) Integer> slideRefs) {}
 public record ExamQuestion(@NotBlank String id,@NotBlank String topicId,@NotBlank String prompt,@NotBlank String modelAnswer,@NotEmpty List<@NotBlank String> evaluationCriteria,@NotEmpty List<@Min(1) Integer> slideRefs) {}
}
