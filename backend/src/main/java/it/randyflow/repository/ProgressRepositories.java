package it.randyflow.repository;
import it.randyflow.domain.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public final class ProgressRepositories { private ProgressRepositories() {} }
interface MasteryRows extends JpaRepository<TopicMasteryEntity,String> { List<TopicMasteryEntity> findByExamId(String examId); }
interface QuizAttemptRows extends JpaRepository<QuizAttemptEntity,Long> { List<QuizAttemptEntity> findByExamId(String examId); }
interface FlashcardReviewRows extends JpaRepository<FlashcardReviewEntity,Long> { List<FlashcardReviewEntity> findByExamId(String examId); }
interface SimulationRows extends JpaRepository<ExamSimulationEntity,Long> { List<ExamSimulationEntity> findByExamId(String examId); }
interface StudyLogRows extends JpaRepository<StudyLogEntity,String> { List<StudyLogEntity> findAllByOrderByLogDateDesc(); }
interface ProfileRows extends JpaRepository<UserProfileEntity,String> {}
interface PreferenceRows extends JpaRepository<UserPreferenceEntity,String> {}
