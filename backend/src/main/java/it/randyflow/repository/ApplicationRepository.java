package it.randyflow.repository;

import it.randyflow.domain.*; import jakarta.persistence.EntityManager; import java.time.LocalDate; import java.util.*; import org.springframework.stereotype.Repository;

@Repository public class ApplicationRepository {
 private final EntityManager em; public ApplicationRepository(EntityManager em){this.em=em;}
 public <T>T save(T value){if(entityId(value)==null){em.persist(value);return value;}return em.merge(value);}
 private Object entityId(Object value){return em.getEntityManagerFactory().getPersistenceUnitUtil().getIdentifier(value);}
 public List<StudySessionEntity> sessions(String examId,Collection<String> ownedExamIds){if(examId!=null)return em.createQuery("select s from StudySessionEntity s where s.examId=:exam order by s.sessionDate",StudySessionEntity.class).setParameter("exam",examId).getResultList();if(ownedExamIds.isEmpty())return List.of();return em.createQuery("select s from StudySessionEntity s where s.examId in :ids order by s.sessionDate",StudySessionEntity.class).setParameter("ids",ownedExamIds).getResultList();}
 public List<StudyTaskEntity> tasks(Collection<String> ids){if(ids.isEmpty())return List.of();return em.createQuery("select t from StudyTaskEntity t where t.sessionId in :ids",StudyTaskEntity.class).setParameter("ids",ids).getResultList();}
 public StudySessionEntity session(String id){return em.find(StudySessionEntity.class,id);}
 public StudyTaskEntity task(String id){return em.find(StudyTaskEntity.class,id);}
 public List<TopicMasteryEntity> mastery(String examId,Collection<String> ownedExamIds){if(examId!=null)return em.createQuery("select m from TopicMasteryEntity m where m.examId=:exam",TopicMasteryEntity.class).setParameter("exam",examId).getResultList();if(ownedExamIds.isEmpty())return List.of();return em.createQuery("select m from TopicMasteryEntity m where m.examId in :ids",TopicMasteryEntity.class).setParameter("ids",ownedExamIds).getResultList();}
 public TopicMasteryEntity masteryById(String id){return em.find(TopicMasteryEntity.class,id);}
 public List<StudyLogEntity> logs(Collection<String> examIds){if(examIds.isEmpty())return List.of();return em.createQuery("select l from StudyLogEntity l where l.examId in :ids order by l.logDate desc",StudyLogEntity.class).setParameter("ids",examIds).getResultList();}
 public long quizAttempts(Collection<String> examIds){if(examIds.isEmpty())return 0;return em.createQuery("select count(a) from QuizAttemptEntity a where a.examId in :ids",Long.class).setParameter("ids",examIds).getSingleResult();}
 public long correctQuizAttempts(Collection<String> examIds){if(examIds.isEmpty())return 0;return em.createQuery("select count(a) from QuizAttemptEntity a where a.correct=true and a.examId in :ids",Long.class).setParameter("ids",examIds).getSingleResult();}
 public int minutesSince(LocalDate date,Collection<String> examIds){if(examIds.isEmpty())return 0;return em.createQuery("select coalesce(sum(l.minutes),0) from StudyLogEntity l where l.logDate>=:date and l.examId in :ids",Long.class).setParameter("date",date).setParameter("ids",examIds).getSingleResult().intValue();}
 public UserProfileEntity profile(String id){return em.find(UserProfileEntity.class,id);} public UserPreferenceEntity preferences(String id){return em.find(UserPreferenceEntity.class,id);}
 public void deleteFuturePlan(String examId){em.createQuery("delete from StudyTaskEntity t where t.sessionId in (select s.id from StudySessionEntity s where s.examId=:exam and s.sessionDate>=:today)").setParameter("exam",examId).setParameter("today",LocalDate.now()).executeUpdate();em.createQuery("delete from StudySessionEntity s where s.examId=:exam and s.sessionDate>=:today").setParameter("exam",examId).setParameter("today",LocalDate.now()).executeUpdate();}
}
