# Production Runtime

This repository runs as a hybrid application:

- the React SPA is built by Vite into `dist/`
- the API is built by Next.js from `app/api/`
- `server.mjs` serves the built SPA and forwards `/api` and `/_next` requests to the Next runtime in the same process

The repository also now contains a minimal Next app shell under `app/` so platforms that only support standard Next routing, such as Vercel, can serve the frontend instead of returning a 404 at `/`.

## Commands

Build everything:

```bash
npm run build
```

Start production:

```bash
npm run start
```

Vercel-compatible build:

```bash
npm run build:api
```

The Next shell mounts the existing React app client-side and keeps the existing API routes under `app/api/`.

Environment requirements:

- frontend and API env vars already used by the app
- `SUPABASE_DB_URL` or `DATABASE_URL` if you want atomic SQL-backed counter updates enabled

## Notes

- `npm run dev:all` remains the local development flow.
- A plain `vite build` output is not sufficient by itself because the app depends on the Next API routes under `app/api/`.
- Railway and Render can use the checked-in `railway.json`, `render.yaml`, and `Procfile`.
- Vercel should deploy the project as a normal Next app now that a catch-all frontend route exists.
- `build:api` uses `next build --webpack` to avoid the Turbopack CSS build panic seen in this repo.
