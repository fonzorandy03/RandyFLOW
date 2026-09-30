package it.randyflow.mapper;

import com.fasterxml.jackson.core.type.TypeReference; import com.fasterxml.jackson.databind.ObjectMapper; import it.randyflow.domain.*; import it.randyflow.dto.ApiDtos.*; import java.util.*; import org.springframework.stereotype.Component;

@Component public class EntityMapper {
 private final ObjectMapper json; public EntityMapper(ObjectMapper json){this.json=json;}
 public ExamDto exam(ExamEntity e,List<String> docs){return new ExamDto(e.id,e.name,e.shortName,e.examDate,e.description,e.totalSlides,e.slidesCompleted,e.minutesStudied,e.status,docs,e.reviewDays,read(e.unavailableDaysJson,new TypeReference<>(){}),read(e.availabilityJson,new TypeReference<>(){}),e.createdAt);}
 public MaterialDto material(StudyMaterialEntity m){return new MaterialDto(m.id,m.examId,m.name,"slides".equals(m.materialType)?"slides":"pdf",m.pageCount,m.lastPage,m.pagesRead,read(m.chaptersJson,new TypeReference<>(){}),m.updatedAt,m.fileSize==null?"—":size(m.fileSize));}
 public MasteryDto mastery(TopicMasteryEntity m){return new MasteryDto(m.topicId,m.examId,m.topicName,m.score,m.trend,m.needsReview,m.slideFrom,m.slideTo,m.attempts);}
 public String write(Object value){try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException(e);}}
 public <T>T read(String value,TypeReference<T> type){try{return json.readValue(value,type);}catch(Exception e){throw new IllegalStateException(e);}}
 private String size(long bytes){return bytes<1_000_000?Math.max(1,bytes/1000)+" KB":String.format(Locale.ROOT,"%.1f MB",bytes/1_000_000d);}
}
