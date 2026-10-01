package it.randyflow.repository;
import it.randyflow.domain.ExamEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ExamRepository extends JpaRepository<ExamEntity,String> {
  List<ExamEntity> findByOwnerIdOrderByCreatedAtDesc(String ownerId);
  Optional<ExamEntity> findByIdAndOwnerId(String id,String ownerId);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select e from ExamEntity e where e.id=:id and e.ownerId=:owner")
  Optional<ExamEntity> lockForPlanning(@Param("id") String id,@Param("owner") String ownerId);
}
