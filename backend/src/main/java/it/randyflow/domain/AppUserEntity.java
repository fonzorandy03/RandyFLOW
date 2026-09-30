package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="app_users") public class AppUserEntity {
 @Id public String id; @Column(nullable=false,unique=true) public String email; @Column(name="password_hash",nullable=false) public String passwordHash; @Column(name="created_at",nullable=false) public OffsetDateTime createdAt;
 public AppUserEntity() {}
}
