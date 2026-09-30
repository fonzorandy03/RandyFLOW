package it.randyflow.domain;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="study_packages") public class StudyPackageEntity {
 @Id @Column(name="package_id") public String packageId; @Column(name="exam_id",nullable=false,unique=true) public String examId;
 public String version; public int revision; @Column(name="generated_at") public OffsetDateTime generatedAt; public String language;
 @Column(name="raw_json",columnDefinition="TEXT") public String rawJson; @Column(name="imported_at") public OffsetDateTime importedAt;
 public StudyPackageEntity() {}
}
