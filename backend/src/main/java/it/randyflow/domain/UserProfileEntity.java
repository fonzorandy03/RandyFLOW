package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="user_profiles") public class UserProfileEntity { @Id public String id; @Column(name="first_name") public String firstName; @Column(name="last_name") public String lastName; public String email; public String university; public String course; @Column(name="study_year") public String studyYear; public String initials; public UserProfileEntity() {} }
