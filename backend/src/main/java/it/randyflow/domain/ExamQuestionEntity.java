package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="exam_questions") public class ExamQuestionEntity { @Id public String id; @Column(name="topic_id") public String topicId; @Column(columnDefinition="TEXT") public String prompt; @Column(name="model_answer",columnDefinition="TEXT") public String modelAnswer; @Column(name="evaluation_criteria_json",columnDefinition="TEXT") public String evaluationCriteriaJson; @Column(name="slide_refs_json",columnDefinition="TEXT") public String slideRefsJson; public ExamQuestionEntity() {} }
