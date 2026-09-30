package it.randyflow.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class MaterialStorageService {
  private final String provider;
  private final Path localPath;
  private final String supabaseUrl;
  private final String serviceRoleKey;
  private final String bucket;
  private final HttpClient http = HttpClient.newHttpClient();

  public MaterialStorageService(
      @Value("${randyflow.storage-provider:local}") String provider,
      @Value("${randyflow.storage-path:./storage}") String localPath,
      @Value("${randyflow.supabase-url:}") String supabaseUrl,
      @Value("${randyflow.supabase-service-role-key:}") String serviceRoleKey,
      @Value("${randyflow.supabase-storage-bucket:study-materials}") String bucket) {
    this.provider = provider;
    this.localPath = Paths.get(localPath).toAbsolutePath().normalize();
    this.supabaseUrl = supabaseUrl.replaceAll("/$", "");
    this.serviceRoleKey = serviceRoleKey;
    this.bucket = bucket;
    if ("supabase".equals(provider) && (this.supabaseUrl.isBlank() || serviceRoleKey.isBlank())) {
      throw new IllegalStateException("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono obbligatorie");
    }
  }

  public String store(String materialId, byte[] bytes) throws IOException {
    String objectKey = materialId + ".pdf";
    if (!"supabase".equals(provider)) {
      Files.createDirectories(localPath);
      Path target = localPath.resolve(objectKey);
      Files.write(target, bytes);
      return target.toString();
    }
    HttpRequest request = HttpRequest.newBuilder(storageUri("/object/", objectKey))
        .header("Authorization", "Bearer " + serviceRoleKey)
        .header("apikey", serviceRoleKey)
        .header("Content-Type", "application/pdf")
        .header("x-upsert", "true")
        .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
        .build();
    send(request, HttpResponse.BodyHandlers.discarding());
    return "supabase:" + objectKey;
  }

  public Resource load(String reference, String filename) {
    if (!reference.startsWith("supabase:")) return new FileSystemResource(reference);
    String objectKey = reference.substring("supabase:".length());
    HttpRequest request = HttpRequest.newBuilder(storageUri("/object/authenticated/", objectKey))
        .header("Authorization", "Bearer " + serviceRoleKey)
        .header("apikey", serviceRoleKey)
        .GET()
        .build();
    byte[] bytes = send(request, HttpResponse.BodyHandlers.ofByteArray()).body();
    return new ByteArrayResource(bytes) {
      @Override public String getFilename() { return filename; }
    };
  }

  public void delete(String reference) {
    if (reference == null || reference.isBlank()) return;
    try {
      if (!reference.startsWith("supabase:")) {
        Files.deleteIfExists(Paths.get(reference));
        return;
      }
      String objectKey = reference.substring("supabase:".length());
      HttpRequest request = HttpRequest.newBuilder(storageUri("/object/", objectKey))
          .header("Authorization", "Bearer " + serviceRoleKey).header("apikey", serviceRoleKey)
          .DELETE().build();
      send(request, HttpResponse.BodyHandlers.discarding());
    } catch (IOException e) {
      throw new IllegalStateException("Impossibile eliminare il PDF", e);
    }
  }

  private URI storageUri(String operation, String objectKey) {
    return URI.create(supabaseUrl + "/storage/v1" + operation + bucket + "/" + objectKey);
  }

  private <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler) {
    try {
      HttpResponse<T> response = http.send(request, handler);
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new IllegalStateException("Supabase Storage ha risposto con HTTP " + response.statusCode());
      }
      return response;
    } catch (IOException e) {
      throw new IllegalStateException("Supabase Storage non raggiungibile", e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Richiesta Supabase Storage interrotta", e);
    }
  }
}
