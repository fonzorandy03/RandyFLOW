# RandyFLOW Backend

Backend REST di RandyFLOW basato su Java 17, Spring Boot, Spring Data JPA, Flyway e PostgreSQL.

## PostgreSQL e avvio locale

Con PostgreSQL 18 installato nel percorso standard, inizializzare un cluster locale isolato sulla porta 5433 e avviare il backend:

```powershell
./backend/scripts/setup-local-postgres.ps1
./backend/scripts/start-backend.ps1
```

Lo script genera una password casuale e la salva in `backend/.env.local`, escluso da Git. Spring Boot non contiene password predefinite. Flyway applica automaticamente le migrazioni all'avvio.

Il frontend usa il backend quando viene avviato con:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:8081"
npm.cmd run dev
```

Le API sono sotto `/api/v1`. Swagger UI è disponibile su `/swagger-ui.html`; OpenAPI JSON su `/v3/api-docs`.

I PDF vengono salvati nella cartella configurata da `STORAGE_PATH` (predefinita `backend/storage`). Il file `.study` e le sue entità sono contenuti didattici; sessioni, progressi, tentativi, review, mastery e statistiche restano nelle tabelle personali e non vengono cancellati da un aggiornamento del package.

## Verifica

```powershell
mvn test
mvn clean package
```
