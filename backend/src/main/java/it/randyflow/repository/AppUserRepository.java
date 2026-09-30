package it.randyflow.repository;
import it.randyflow.domain.AppUserEntity; import java.util.Optional; import org.springframework.data.jpa.repository.JpaRepository;
public interface AppUserRepository extends JpaRepository<AppUserEntity,String> { Optional<AppUserEntity> findByEmailIgnoreCase(String email); }
