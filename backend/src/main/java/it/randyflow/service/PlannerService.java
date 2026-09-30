package it.randyflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import it.randyflow.domain.*;
import it.randyflow.dto.ApiDtos.*;
import it.randyflow.exception.ApiException;
import it.randyflow.mapper.EntityMapper;
import it.randyflow.repository.*;
import it.randyflow.security.UserContext;
import jakarta.transaction.Transactional;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service public class PlannerService {
 private final ApplicationRepository data; private final ExamRepository exams; private final StudyMaterialRepository materials; private final TopicRepository topics; private final UserContext users; private final EntityMapper mapper;
 public PlannerService(ApplicationRepository data,ExamRepository exams,StudyMaterialRepository materials,TopicRepository topics,UserContext users,EntityMapper mapper){this.data=data;this.exams=exams;this.materials=materials;this.topics=topics;this.users=users;this.mapper=mapper;}

 private record PageWork(StudyMaterialEntity material,int page,TopicEntity topic,int minutes){}
 private static final class Segment {StudyMaterialEntity material;LocalDate day;int from;int to;int minutes;LinkedHashSet<String> topics=new LinkedHashSet<>();Segment(PageWork w,LocalDate d){material=w.material;day=d;from=to=w.page;add(w);}void add(PageWork w){to=w.page;minutes+=w.minutes;if(w.topic!=null)topics.add(w.topic.name);}}

 @Transactional public List<SessionDto> recalculate(String examId){
  ExamEntity exam=requireExam(examId);List<StudyMaterialEntity> examMaterials=materials.findByExamId(examId).stream().sorted(Comparator.comparing(m->m.name.toLowerCase(Locale.ROOT))).toList();if(examMaterials.isEmpty())throw ApiException.badRequest("Materiale mancante");data.deleteFuturePlan(examId);StudyPlanEntity plan=new StudyPlanEntity();plan.examId=examId;plan.generatedAt=OffsetDateTime.now();data.save(plan);
  LocalDate start=LocalDate.now().plusDays(1),end=exam.examDate.minusDays(Math.max(0,exam.reviewDays));if(end.isBefore(start))return sessions(examId);
  Map<Integer,Integer> availability=mapper.read(exam.availabilityJson,new TypeReference<Map<Integer,Integer>>(){});Set<LocalDate> unavailable=new HashSet<>(mapper.read(exam.unavailableDaysJson,new TypeReference<List<LocalDate>>(){}));List<LocalDate> days=start.datesUntil(end.plusDays(1)).filter(d->!unavailable.contains(d)&&(availability.getOrDefault(d.getDayOfWeek().getValue(),0)>0)).toList();if(days.isEmpty())return sessions(examId);
  List<PageWork> work=new ArrayList<>();
  for(var material:examMaterials){List<TopicEntity> allTopics=topics.findByMaterialIdIn(List.of(material.id));Set<Integer> done=new HashSet<>(mapper.read(material.completedPagesJson,new TypeReference<List<Integer>>(){}));for(int page=1;page<=material.pageCount;page++){final int current=page;TopicEntity topic=allTopics.stream().filter(t->studyable(t)&&current>=t.slideFrom&&current<=t.slideTo).findFirst().orElse(null);if(!done.contains(page)&&(allTopics.isEmpty()||topic!=null))work.add(new PageWork(material,page,topic,pageMinutes(topic)));}}
  List<Segment> segments=new ArrayList<>();Segment current=null;for(int i=0;i<work.size();i++){PageWork w=work.get(i);LocalDate day=days.get(Math.min(days.size()-1,(int)((long)i*days.size()/Math.max(1,work.size()))));if(current==null||!current.day.equals(day)||!current.material.id.equals(w.material.id)||w.page!=current.to+1){current=new Segment(w,day);segments.add(current);}else current.add(w);}
  int index=0;for(var segment:segments){String id=examId+"-"+segment.day+"-"+Integer.toHexString(segment.material.id.hashCode())+"-"+(index++);StudySessionEntity s=new StudySessionEntity();s.id=id;s.planId=plan.id;s.examId=examId;s.materialId=segment.material.id;s.sessionDate=segment.day;s.status="planned";s.topic=segment.topics.isEmpty()?"Studio":String.join(" · ",segment.topics);s.slideFrom=segment.from;s.slideTo=segment.to;s.slidesDone=0;s.nextPage=segment.from;s.durationMin=Math.max(5,segment.minutes);data.save(s);StudyTaskEntity read=new StudyTaskEntity();read.id=id+"-read";read.sessionId=id;read.taskKind="read";read.label="Studia "+segment.material.name+" · pagine "+segment.from+(segment.from==segment.to?"":"–"+segment.to);read.durationMin=s.durationMin;data.save(read);}
  return sessions(examId);
 }
 private int pageMinutes(TopicEntity topic){if(topic==null)return 4;double base=topic.estimatedMinutes/(double)Math.max(1,topic.slideTo-topic.slideFrom+1);double weight=.8+(topic.difficulty+topic.importance)/25d;return Math.max(5,(int)Math.round(base*weight/5)*5);}
 private boolean studyable(TopicEntity t){return t.studyable&&"content".equals(t.pageType);}
 public List<SessionDto> sessions(String examId){if(examId!=null)requireExam(examId);List<StudySessionEntity> rows=data.sessions(examId,ownedExamIds());Map<String,List<StudyTaskEntity>> tasks=new HashMap<>();for(var t:data.tasks(rows.stream().map(s->s.id).toList()))tasks.computeIfAbsent(t.sessionId,k->new ArrayList<>()).add(t);Map<String,String> names=new HashMap<>();materials.findAll().forEach(m->names.put(m.id,m.name));return rows.stream().map(s->new SessionDto(s.id,s.examId,s.materialId,names.get(s.materialId),s.sessionDate,s.status,s.topic,s.slideFrom,s.slideTo,s.slidesDone,s.nextPage,s.durationMin,s.previousDurationMin,tasks.getOrDefault(s.id,List.of()).stream().map(t->new TaskDto(t.id,t.taskKind,t.label,t.durationMin,t.done,t.meta)).toList(),s.note)).toList();}
 @Transactional public SessionDto toggle(String sessionId,String taskId){StudySessionEntity s=data.session(sessionId);if(s!=null)requireExam(s.examId);StudyTaskEntity t=data.task(taskId);if(s==null||t==null||!t.sessionId.equals(sessionId))throw ApiException.notFound("Attività non trovata");t.done=!t.done;data.save(t);return sessions(s.examId).stream().filter(x->x.id().equals(sessionId)).findFirst().orElseThrow();}
 @Transactional public Map<String,Object> report(String sessionId,String outcome,Integer slidesDone){StudySessionEntity s=data.session(sessionId);if(s!=null)requireExam(s.examId);if(s==null)throw ApiException.notFound("Sessione non trovata");int total=s.slideFrom==null||s.slideTo==null?0:s.slideTo-s.slideFrom+1;s.slidesDone="completed".equals(outcome)?total:"skipped".equals(outcome)?0:Math.min(total,Math.max(0,slidesDone==null?0:slidesDone));s.status=outcome;data.save(s);Map<String,Object> result=new HashMap<>();result.put("session",sessions(s.examId).stream().filter(x->x.id().equals(sessionId)).findFirst().orElseThrow());result.put("adjustment",null);return result;}
 @Transactional public ExamDto availability(String examId,Map<Integer,Integer> availability){ExamEntity e=requireExam(examId);e.availabilityJson=new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(availability).toString();exams.save(e);recalculate(examId);return mapper.exam(e,materials.findByExamId(examId).stream().map(m->m.id).toList());}
 private ExamEntity requireExam(String id){return exams.findByIdAndOwnerId(id,users.idOrLegacy()).orElseThrow(()->ApiException.notFound("Esame non trovato"));}private List<String> ownedExamIds(){return exams.findByOwnerIdOrderByCreatedAtDesc(users.idOrLegacy()).stream().map(e->e.id).toList();}
}
