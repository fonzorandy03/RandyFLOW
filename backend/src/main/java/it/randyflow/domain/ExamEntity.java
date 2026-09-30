package it.randyflow.domain;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="exams") public class ExamEntity {
 @Id public String id; @Column(nullable=false) public String name; @Column(name="short_name",nullable=false) public String shortName;
 @Column(name="exam_date") public LocalDate examDate; public String description; @Column(nullable=false) public String status="not-started";
 @Column(name="total_slides") public int totalSlides; @Column(name="slides_completed") public int slidesCompleted; @Column(name="minutes_studied") public int minutesStudied;
 @Column(name="review_days") public int reviewDays=4; @Column(name="availability_json",columnDefinition="TEXT") public String availabilityJson="{}";
 @Column(name="unavailable_days_json",columnDefinition="TEXT") public String unavailableDaysJson="[]"; @Column(name="created_at",nullable=false) public LocalDate createdAt;
 public ExamEntity() {}
}
