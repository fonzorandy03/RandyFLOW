package it.randyflow.repository;
import it.randyflow.domain.AuthSessionEntity; import java.time.OffsetDateTime; import java.util.Optional; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface AuthSessionRepository extends JpaRepository<AuthSessionEntity,Long> {
 Optional<AuthSessionEntity> findByTokenHashAndExpiresAtAfter(String tokenHash,OffsetDateTime now);
 void deleteByTokenHash(String tokenHash);
 @Modifying @Query("delete from AuthSessionEntity s where s.expiresAt < :now") void deleteExpired(@Param("now") OffsetDateTime now);
}
