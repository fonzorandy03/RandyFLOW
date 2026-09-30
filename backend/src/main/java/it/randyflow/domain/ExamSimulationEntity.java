package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="exam_simulations") public class ExamSimulationEntity { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="exam_id") public String examId; @Column(name="question_id") public String questionId; @Column(columnDefinition="TEXT") public String answer; public int rating; @Column(name="submitted_at") public OffsetDateTime submittedAt; public ExamSimulationEntity() {} }
