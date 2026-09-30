package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="quizzes") public class QuizEntity {
 @Id public String id; @Column(name="topic_id") public String topicId; @Column(name="quiz_type") public String quizType; @Column(columnDefinition="TEXT") public String prompt;
 @Column(name="options_json",columnDefinition="TEXT") public String optionsJson; @Column(name="correct_answer",columnDefinition="TEXT") public String correctAnswer;
 @Column(name="accepted_keywords_json",columnDefinition="TEXT") public String acceptedKeywordsJson; @Column(columnDefinition="TEXT") public String explanation; @Column(name="slide_refs_json",columnDefinition="TEXT") public String slideRefsJson;
 public QuizEntity() {}
}
