# Production Runtime

This repository runs as a hybrid application:

- the React SPA is built by Vite into `dist/`
- the API is built by Next.js from `app/api/`
- `server.mjs` serves the built SPA and forwards `/api` and `/_next` requests to the Next runtime in the same process

## Commands

Build everything:

```bash
npm run build
```

Start production:

```bash
npm run start
```

Environment requirements:

- frontend and API env vars already used by the app
- `SUPABASE_DB_URL` or `DATABASE_URL` if you want atomic SQL-backed counter updates enabled

## Notes

- `npm run dev:all` remains the local development flow.
- A plain `vite build` output is not sufficient by itself because the app depends on the Next API routes under `app/api/`.
