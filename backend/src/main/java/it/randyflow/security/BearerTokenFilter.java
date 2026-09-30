package it.randyflow.security;
import it.randyflow.service.AuthService; import jakarta.servlet.*; import jakarta.servlet.http.*; import java.io.IOException; import java.util.List; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
@Component public class BearerTokenFilter extends OncePerRequestFilter {
 private final AuthService auth; public BearerTokenFilter(AuthService auth){this.auth=auth;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {String header=req.getHeader("Authorization");if(header!=null&&header.startsWith("Bearer "))auth.authenticate(header.substring(7)).ifPresent(userId->SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId,null,List.of())));chain.doFilter(req,res);}
}
