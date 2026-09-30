package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="topic_mastery") public class TopicMasteryEntity { @Id @Column(name="topic_id") public String topicId; @Column(name="exam_id") public String examId; @Column(name="topic_name") public String topicName; public int score; public String trend="flat"; @Column(name="needs_review") public boolean needsReview=true; @Column(name="slide_from") public int slideFrom; @Column(name="slide_to") public int slideTo; public int attempts; public TopicMasteryEntity() {} }
