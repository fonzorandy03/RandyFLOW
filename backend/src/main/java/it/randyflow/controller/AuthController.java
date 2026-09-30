package it.randyflow.controller;
import it.randyflow.dto.AuthDtos.*; import it.randyflow.service.AuthService; import jakarta.validation.Valid; import org.springframework.http.HttpStatus; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth") public class AuthController {
 private final AuthService auth; public AuthController(AuthService auth){this.auth=auth;}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) AuthResponse register(@Valid @RequestBody RegisterRequest input){return auth.register(input);}
 @PostMapping("/login") AuthResponse login(@Valid @RequestBody LoginRequest input){return auth.login(input);}
 @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) void logout(@RequestHeader(value="Authorization",required=false)String header){auth.logout(header!=null&&header.startsWith("Bearer ")?header.substring(7):null);}
}
