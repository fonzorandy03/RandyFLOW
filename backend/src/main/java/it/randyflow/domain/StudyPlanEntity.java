package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="study_plans") public class StudyPlanEntity { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="exam_id") public String examId; @Column(name="generated_at") public OffsetDateTime generatedAt; public boolean active=true; public StudyPlanEntity() {} }
