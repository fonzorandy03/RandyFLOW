# RandyFLOW Backend

Backend REST di RandyFLOW basato su Java 17, Spring Boot, Spring Data JPA, Flyway e PostgreSQL.

## Avvio locale

Creare un database PostgreSQL e impostare, se diversi dai valori predefiniti:

```powershell
$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/randyflow"
$env:DATABASE_USERNAME = "randyflow"
$env:DATABASE_PASSWORD = "randyflow"
mvn spring-boot:run
```

Il frontend usa il backend quando viene avviato con:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080"
npm.cmd run dev
```

Le API sono sotto `/api/v1`. Swagger UI è disponibile su `/swagger-ui.html`; OpenAPI JSON su `/v3/api-docs`.

I PDF vengono salvati nella cartella configurata da `STORAGE_PATH` (predefinita `backend/storage`). Il file `.study` e le sue entità sono contenuti didattici; sessioni, progressi, tentativi, review, mastery e statistiche restano nelle tabelle personali e non vengono cancellati da un aggiornamento del package.

## Verifica

```powershell
mvn test
mvn clean package
```
