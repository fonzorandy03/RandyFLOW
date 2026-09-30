package it.randyflow.repository;
import it.randyflow.domain.*; import org.springframework.data.jpa.repository.JpaRepository; import java.time.*; import java.util.*;
public final class PlanRepositories { private PlanRepositories() {} }
interface StudyPlanRows extends JpaRepository<StudyPlanEntity,Long> { List<StudyPlanEntity> findByExamId(String examId); }
interface StudySessionRows extends JpaRepository<StudySessionEntity,String> { List<StudySessionEntity> findByExamIdOrderBySessionDate(String examId); List<StudySessionEntity> findAllByOrderBySessionDate(); Optional<StudySessionEntity> findFirstBySessionDateOrderById(LocalDate date); }
interface StudyTaskRows extends JpaRepository<StudyTaskEntity,String> { List<StudyTaskEntity> findBySessionId(String sessionId); List<StudyTaskEntity> findBySessionIdIn(Collection<String> ids); }
