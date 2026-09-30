package it.randyflow.security;
import it.randyflow.exception.ApiException; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component;
@Component public class UserContext {
 public String id(){var auth=SecurityContextHolder.getContext().getAuthentication();if(auth==null||!auth.isAuthenticated()||"anonymousUser".equals(auth.getPrincipal()))throw ApiException.unauthorized("Accesso richiesto");return auth.getName();}
 public String idOrLegacy(){try{return id();}catch(ApiException e){return "local";}}
}
