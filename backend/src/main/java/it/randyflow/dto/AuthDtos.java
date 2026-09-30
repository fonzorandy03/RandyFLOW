package it.randyflow.dto;
import it.randyflow.dto.ApiDtos.ProfileDto; import jakarta.validation.constraints.*;
public final class AuthDtos { private AuthDtos() {}
 public record RegisterRequest(@NotBlank @Size(min=2,max=120) String firstName,@NotBlank @Size(min=2,max=120) String lastName,@NotBlank @Email String email,@NotBlank @Size(min=8,max=128) String password) {}
 public record LoginRequest(@NotBlank @Email String email,@NotBlank String password) {}
 public record AuthResponse(String token,ProfileDto user) {}
}
