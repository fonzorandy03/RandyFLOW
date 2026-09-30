package it.randyflow.exception;
import java.time.OffsetDateTime; import java.util.*; import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MaxUploadSizeExceededException;
@RestControllerAdvice public class GlobalExceptionHandler {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);
 public record Problem(OffsetDateTime timestamp,int status,String error,String message,List<String> details) {}
 @ExceptionHandler(ApiException.class) ResponseEntity<Problem> api(ApiException e){return response(e.status,e.getMessage(),List.of());}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<Problem> validation(MethodArgumentNotValidException e){return response(HttpStatus.BAD_REQUEST,"Validazione non superata",e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+": "+x.getDefaultMessage()).toList());}
 @ExceptionHandler(MaxUploadSizeExceededException.class) ResponseEntity<Problem> size(MaxUploadSizeExceededException e){return response(HttpStatus.PAYLOAD_TOO_LARGE,"Il PDF supera il limite configurato",List.of());}
 @ExceptionHandler(Exception.class) ResponseEntity<Problem> generic(Exception e){log.error("Errore API non gestito",e);return response(HttpStatus.INTERNAL_SERVER_ERROR,"Errore interno",List.of());}
 private ResponseEntity<Problem> response(HttpStatus s,String message,List<String> details){return ResponseEntity.status(s).body(new Problem(OffsetDateTime.now(),s.value(),s.getReasonPhrase(),message,details));}
}
