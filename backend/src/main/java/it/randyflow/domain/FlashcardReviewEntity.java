package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="flashcard_reviews") public class FlashcardReviewEntity { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="exam_id") public String examId; @Column(name="flashcard_id") public String flashcardId; public String rating; @Column(name="reviewed_at") public OffsetDateTime reviewedAt; public FlashcardReviewEntity() {} }
