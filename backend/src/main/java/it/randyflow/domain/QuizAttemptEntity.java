package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="quiz_attempts") public class QuizAttemptEntity { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="exam_id") public String examId; @Column(name="question_id") public String questionId; public boolean correct; @Column(name="given_answer",columnDefinition="TEXT") public String givenAnswer; @Column(name="attempted_at") public OffsetDateTime attemptedAt; public QuizAttemptEntity() {} }
