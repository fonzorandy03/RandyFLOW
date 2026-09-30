# RandyFLOW

Web application per organizzare lo studio universitario con planner, tracciamento del progresso e contenuti didattici importati tramite Study Package v1.0.

## Frontend

```bash
npm install
npm run dev
```

Senza configurazione esterna il frontend usa i dati dimostrativi locali. Per collegarlo al backend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Backend

Il backend Spring Boot e le istruzioni PostgreSQL sono in [`backend`](./backend/README.md).

## Study Package

La specifica, lo schema JSON, il file di esempio e il prompt per ChatGPT sono in [`docs`](./docs).
