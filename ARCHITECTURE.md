# Architecture Decision

## Canonical Backend

The canonical application backend is the Next.js API implementation under [`app/api/`](/home/ditech/Documents/tech-bant-community/app/api).

This repository still contains a separate Go backend under [`server/`](/home/ditech/Documents/tech-bant-community/server), but it is now considered legacy reference code and not the primary production path for new features.

## Decision

- New auth, moderation, media, and user-management work should be implemented in the Next.js API.
- Frontend code should target `/api/v1/*` exposed by the Next.js app.
- The Go backend should not receive new feature work unless the team explicitly decides to migrate back to it.

## Rationale

- The active frontend already depends directly on the Next.js API surface.
- Running two overlapping backends for the same product area creates security drift, behavior drift, and duplicated maintenance.
- The recent hardening work in this repo is concentrated in the Next.js API.

## Follow-Up

- Keep the Go backend only as a reference until it is either removed or formally revived as a migration target.
- Avoid documenting both backends as current production implementations.
