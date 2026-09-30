package it.randyflow.domain;
import jakarta.persistence.*;
@Entity @Table(name="user_preferences") public class UserPreferenceEntity { @Id public String id; @Column(name="session_minutes") public int sessionMinutes; @Column(name="break_minutes") public int breakMinutes; public boolean notifications; @Column(name="auto_break") public boolean autoBreak; @Column(name="explanation_level") public String explanationLevel; public UserPreferenceEntity() {} }
