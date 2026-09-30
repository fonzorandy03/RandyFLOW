package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="study_tasks") public class StudyTaskEntity { @Id public String id; @Column(name="session_id") public String sessionId; @Column(name="task_kind") public String taskKind; public String label; @Column(name="duration_min") public int durationMin; public boolean done; public String meta; public StudyTaskEntity() {} }
