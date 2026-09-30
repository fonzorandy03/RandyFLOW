# Deployment production

## Architettura

- Frontend Next.js: Vercel, `https://randyflow.vercel.app`.
- Backend: un servizio container pubblico costruito da `backend/Dockerfile`.
- Database: PostgreSQL gestito con storage persistente e backup abilitati.
- PDF: volume persistente montato nel container in `/data/uploads`.

Il backend e il database non devono essere pubblicati nello stesso servizio Vercel del frontend.

## Backend

Impostare queste variabili sul servizio container:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://HOST:5432/DATABASE?sslmode=require
DATABASE_USERNAME=USERNAME
DATABASE_PASSWORD=PASSWORD
CORS_ALLOWED_ORIGINS=https://randyflow.vercel.app
STORAGE_PATH=/data/uploads
PORT=8080
JAVA_OPTS=-XX:MaxRAMPercentage=75
```

`PORT` può essere assegnata automaticamente dal provider. Non inserire credenziali nei file del repository.

Build, eseguito dalla directory `backend`:

```bash
docker build -t randyflow-backend .
```

Avvio locale dell'immagine:

```bash
docker run --rm -p 8080:8080 --env-file .env.production -v randyflow-pdf:/data/uploads randyflow-backend
```

Health check del provider:

```text
GET /actuator/health/readiness
```

Flyway applica le migrazioni all'avvio. `ddl-auto=validate` verifica che lo schema risultante corrisponda alle entity e non crea tabelle fuori dalle migrazioni.

## PostgreSQL gestito

Creare database e utente dedicati a RandyFLOW. Il servizio deve offrire TLS; usare `sslmode=require` nella JDBC URL. Limitare l'accesso di rete al backend quando il provider lo permette. Abilitare backup automatici e conservazione adeguata.

Il volume `/data/uploads` è obbligatorio per conservare i PDF dopo riavvii o nuovi deploy. In alternativa futura, sostituire lo storage locale con un object storage compatibile S3.

## Vercel

Nel progetto Vercel impostare per Production e Preview:

```text
NEXT_PUBLIC_API_BASE_URL=https://URL-PUBBLICO-BACKEND
NEXT_PUBLIC_DATA_MODE=api
```

La URL può includere `/api/v1`; il client accetta entrambe le forme. Le variabili `NEXT_PUBLIC_*` vengono incorporate durante la build, quindi dopo ogni modifica occorre eseguire un nuovo deployment Vercel.

Per una demo esplicita senza backend usare `NEXT_PUBLIC_DATA_MODE=mock`. Se la modalità è `api`, un backend mancante o irraggiungibile produce un errore di connessione e non attiva i mock.

## Verifica prima del collegamento Vercel

1. Aprire `https://URL-PUBBLICO-BACKEND/actuator/health/readiness` e verificare `{"status":"UP"}`.
2. Inviare una preflight `OPTIONS /api/v1/exams` con origin `https://randyflow.vercel.app` e verificare l'header `Access-Control-Allow-Origin`.
3. Impostare le due variabili Vercel e ridistribuire il frontend.
4. Creare un esame dal sito pubblico e verificare il record nel PostgreSQL gestito.
5. Riavviare il backend e verificare che esame e PDF siano ancora disponibili.
