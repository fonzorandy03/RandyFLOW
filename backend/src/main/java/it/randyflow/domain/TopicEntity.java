package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="topics") public class TopicEntity {
 @Id public String id; @Column(name="material_id") public String materialId; public String name; @Column(name="slide_from") public int slideFrom; @Column(name="slide_to") public int slideTo;
 public int difficulty; public int importance; @Column(name="estimated_minutes") public int estimatedMinutes;
 @Column(name="simple_explanation",columnDefinition="TEXT") public String simpleExplanation; @Column(name="normal_explanation",columnDefinition="TEXT") public String normalExplanation;
 @Column(name="deep_explanation",columnDefinition="TEXT") public String deepExplanation; @Column(columnDefinition="TEXT") public String summary;
 @Column(name="key_concepts_json",columnDefinition="TEXT") public String keyConceptsJson; @Column(name="examples_json",columnDefinition="TEXT") public String examplesJson;
 public TopicEntity() {}
}
