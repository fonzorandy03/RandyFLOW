package it.randyflow.domain;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="study_materials") public class StudyMaterialEntity {
 @Id public String id; @Column(name="exam_id") public String examId; public String name; @Column(name="material_type") public String materialType;
 @Column(name="page_count") public int pageCount; @Column(name="studyable_pages") public int studyablePages; @Column(name="last_page") public int lastPage=1; @Column(name="pages_read") public int pagesRead;
 @Column(name="completed_pages_json",columnDefinition="TEXT") public String completedPagesJson="[]"; @Column(name="chapters_json",columnDefinition="TEXT") public String chaptersJson="[]";
 @Column(name="storage_path") public String storagePath; @Column(name="mime_type") public String mimeType; @Column(name="file_size") public Long fileSize; @Column(name="updated_at") public LocalDate updatedAt;
 @Column(name="page_types_json",columnDefinition="TEXT") public String pageTypesJson;
 @Column(name="page_overrides_json",columnDefinition="TEXT") public String pageOverridesJson="{}";
 public StudyMaterialEntity() {}
}
