# RandyFLOW

Web application per organizzare lo studio universitario con planner, tracciamento del progresso e contenuti didattici importati tramite Study Package v1.0.

## Frontend

```bash
npm install
npm run dev
```

Il frontend usa le API per impostazione predefinita. Per collegarlo al backend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_DATA_MODE=api
```

I dati dimostrativi sono disponibili solo impostando esplicitamente `NEXT_PUBLIC_DATA_MODE=mock`.

## Backend

Il backend Spring Boot e le istruzioni PostgreSQL sono in [`backend`](./backend/README.md).

La preparazione per il deploy cloud è descritta in [`docs/PRODUCTION_DEPLOYMENT.md`](./docs/PRODUCTION_DEPLOYMENT.md).

## Study Package

La specifica, lo schema JSON, il file di esempio e il prompt per ChatGPT sono in [`docs`](./docs).
