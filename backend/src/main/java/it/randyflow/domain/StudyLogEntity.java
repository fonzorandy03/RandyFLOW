package it.randyflow.domain;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="study_logs") public class StudyLogEntity { @Id public String id; @Column(name="exam_id") public String examId; @Column(name="material_id") public String materialId; @Column(name="log_date") public LocalDate logDate; @Column(name="from_page") public int fromPage; @Column(name="to_page") public int toPage; public int minutes; public String label; public StudyLogEntity() {} }
