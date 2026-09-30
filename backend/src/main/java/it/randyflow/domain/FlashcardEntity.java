package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="flashcards") public class FlashcardEntity { @Id public String id; @Column(name="topic_id") public String topicId; @Column(columnDefinition="TEXT") public String front; @Column(columnDefinition="TEXT") public String back; @Column(name="slide_refs_json",columnDefinition="TEXT") public String slideRefsJson; public FlashcardEntity() {} }
