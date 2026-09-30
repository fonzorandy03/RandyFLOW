package it.randyflow.service;

import it.randyflow.dto.StudyPackageDto; import it.randyflow.exception.ApiException; import java.util.*; import org.springframework.stereotype.Component;

@Component public class StudyPackageValidator {
 public void validate(StudyPackageDto p){List<String> errors=new ArrayList<>(); if(!"randyflow-study-package".equals(p.format()))errors.add("format non valido");if(!"1.0".equals(p.version()))errors.add("version non valida");
  Map<String,Integer> materials=new HashMap<>(); p.materials().forEach(m->{if(materials.put(m.id(),m.pageCount())!=null)errors.add("materiale duplicato: "+m.id());});
  Map<String,StudyPackageDto.Topic> topics=new HashMap<>(); for(var t:p.topics()){if(topics.put(t.id(),t)!=null)errors.add("topic duplicato: "+t.id());Integer pages=materials.get(t.materialId());if(pages==null)errors.add("materialId inesistente: "+t.materialId());else if(t.slideRange().to()<t.slideRange().from()||t.slideRange().to()>pages)errors.add("slideRange non valido: "+t.id());boolean explicitlyNonStudy=Boolean.FALSE.equals(t.studyable());if(explicitlyNonStudy&&(t.estimatedMinutes()!=0||t.difficulty()!=1||t.importance()!=1))errors.add("Le pagine non didattiche richiedono tempo 0, difficoltà 1 e importanza 1: "+t.id());if(explicitlyNonStudy&&(!t.quizIds().isEmpty()||!t.flashcardIds().isEmpty()||!t.examQuestionIds().isEmpty()))errors.add("Le pagine non didattiche non possono avere attività: "+t.id());}
  Set<String> quizIds=new HashSet<>(), cardIds=new HashSet<>(), questionIds=new HashSet<>();
  p.quizzes().forEach(q->{unique(quizIds,q.id(),errors);refs(q.topicId(),q.slideRefs(),topics,materials,errors);if("multiple".equals(q.type())&&(q.options()==null||q.options().size()<2||!(q.correctAnswer() instanceof Number n)||n.intValue()<0||n.intValue()>=q.options().size()))errors.add("quiz multiple non valido: "+q.id());if("open".equals(q.type())&&(!(q.correctAnswer() instanceof String text)||text.isBlank()))errors.add("quiz open non valido: "+q.id());});
  p.flashcards().forEach(c->{unique(cardIds,c.id(),errors);refs(c.topicId(),c.slideRefs(),topics,materials,errors);}); p.examQuestions().forEach(q->{unique(questionIds,q.id(),errors);refs(q.topicId(),q.slideRefs(),topics,materials,errors);});
  for(var t:p.topics()){missing(t.quizIds(),quizIds,"quiz",t.id(),errors);missing(t.flashcardIds(),cardIds,"flashcard",t.id(),errors);missing(t.examQuestionIds(),questionIds,"examQuestion",t.id(),errors);}
  if(!errors.isEmpty())throw ApiException.badRequest(String.join("; ",errors));
 }
 private void refs(String topicId,List<Integer> refs,Map<String,StudyPackageDto.Topic> topics,Map<String,Integer> materials,List<String> errors){var t=topics.get(topicId);if(t==null){errors.add("topicId inesistente: "+topicId);return;}int pages=materials.get(t.materialId());if(refs.stream().anyMatch(n->n<1||n>pages))errors.add("slideRefs fuori intervallo per "+topicId);}
 private void unique(Set<String>s,String id,List<String>e){if(!s.add(id))e.add("id duplicato: "+id);} private void missing(List<String> refs,Set<String> ids,String kind,String topic,List<String>e){refs.stream().filter(id->!ids.contains(id)).forEach(id->e.add(kind+" inesistente "+id+" in "+topic));}
 private String canonical(String type){if(type==null)return "content";return switch(type){case "section-divider"->"separator";case "references"->"reference";case "blank"->"empty";case "exercise"->"content";default->type;};}
}
