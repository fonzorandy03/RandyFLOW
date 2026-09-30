package it.randyflow.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime;
@Entity @Table(name="auth_sessions") public class AuthSessionEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="user_id",nullable=false) public String userId; @Column(name="token_hash",nullable=false,unique=true) public String tokenHash; @Column(name="expires_at",nullable=false) public OffsetDateTime expiresAt; @Column(name="created_at",nullable=false) public OffsetDateTime createdAt;
 public AuthSessionEntity() {}
}
