# QA Audit Report

Date: 2026-03-18

Scope reviewed:
- Vite React frontend in `src/`
- Next.js API routes in `app/api/`
- Shared auth and validation helpers in `lib/`
- Build and runtime configuration

Checks run:
- `npx tsc --noEmit` ✅
- `npm test` ✅

Important context:
- Typecheck and the current unit tests pass, but they do not cover the highest-risk runtime paths in this repo.
- This codebase mixes a Vite SPA with Next.js API routes. Several issues below are integration defects that static checks will not catch.

## Executive Summary

The most serious issues are in the authentication/session model and production build setup. The current refresh flow does not mint a new Supabase access token, so expired sessions cannot actually recover. Logout depends on a still-valid access token, which prevents proper session revocation once the access token has expired. The frontend also consumes raw auth payloads without normalizing them to the app’s `User` shape, which can cause subtle authorization and UI state errors.

I would prioritize fixes in this order:
1. Repair refresh-token behavior and logout semantics.
2. Align frontend auth/user models with backend response shapes.
3. Fix the production build/runtime story for Vite + Next.
4. Address counter drift and OAuth edge cases.

## Findings

### 1. Critical: refresh flow rotates the refresh session but reuses the old access token

Severity: Critical

Evidence:
- [app/api/v1/auth/login/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/login/route.ts#L148) stores the current Supabase access token in `sessions.token_id`.
- [app/api/v1/auth/refresh/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/refresh/route.ts#L44) inserts a new session row using the old `session.token_id`.
- [app/api/v1/auth/refresh/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/refresh/route.ts#L64) returns that same token to the client as the refreshed token.

Impact:
- After the Supabase JWT expires, `/auth/refresh` does not provide a fresh JWT.
- The client retries verification with another expired token and eventually signs the user out.
- The refresh endpoint gives a false impression that session renewal succeeded.

Suggested fix:
- Replace the custom refresh implementation with a real token re-issuance flow from Supabase Auth.
- Do not persist access tokens as the source of truth for refresh.
- Store an application session identifier separately from Supabase JWTs.

### 2. High: logout cannot revoke server-side sessions once the access token has expired

Severity: High

Evidence:
- [app/api/v1/auth/logout/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/logout/route.ts#L7) requires `withAuth(req)`.
- [src/services/auth.ts](/home/ditech/Documents/tech-bant-community/src/services/auth.ts#L107) always calls `/auth/logout`, even when the local state may only have a refresh token left.

Impact:
- A user with an expired access token cannot fully log out server-side.
- The frontend clears local storage, but the session row may remain active in the database.
- This creates stale sessions and weakens expected “log out all traces” behavior.

Suggested fix:
- Allow logout by refresh token alone.
- Revoke the matching session row without requiring a valid access JWT first.
- Clear cookies even when the access token is already expired.

### 3. High: signup can create a “successful” session with an empty access token

Severity: High

Evidence:
- [app/api/v1/auth/signup/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/signup/route.ts#L53) initializes `accessToken` to `''`.
- [app/api/v1/auth/signup/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/signup/route.ts#L54) attempts `signInWithPassword`.
- [app/api/v1/auth/signup/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/signup/route.ts#L95) creates a session record regardless of whether a token was obtained.
- [app/api/v1/auth/signup/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/signup/route.ts#L124) returns the empty token to the client.

Impact:
- A user can receive a refresh token and cookies while lacking a valid access token.
- The app then enters an immediate verify/refresh failure path after signup.
- This will show up as intermittent “signed up but not logged in” behavior.

Suggested fix:
- Treat sign-in failure after user creation as a hard failure.
- Roll back the newly created profile/auth user if session establishment fails, or return an explicit “account created, login required” response without session creation.

### 4. High: auth context consumes raw backend user payloads that do not match the frontend `User` type

Severity: High

Evidence:
- [src/types/index.ts](/home/ditech/Documents/tech-bant-community/src/types/index.ts#L1) defines camelCase fields like `isAdmin`, `isVerified`, `createdAt`, `updatedAt`.
- [src/services/auth.ts](/home/ditech/Documents/tech-bant-community/src/services/auth.ts#L164) returns `response.user` from `/auth/verify` directly.
- [src/contexts/AuthContext.tsx](/home/ditech/Documents/tech-bant-community/src/contexts/AuthContext.tsx#L59) stores that object directly as `user` and `userProfile`.
- [src/services/user.ts](/home/ditech/Documents/tech-bant-community/src/services/user.ts#L79) already shows the correct normalization approach for user responses.

Impact:
- Fields like `is_admin` and `is_verified` from the backend do not populate `isAdmin` and `isVerified` in the UI auth state.
- Components using auth context can silently render the wrong permissions, badges, or profile metadata.
- This is especially risky in navigation and admin-only affordances where the UI trusts client state.

Suggested fix:
- Introduce a shared user-mapper for auth responses.
- Use the same conversion path in `authService` that `userService` already uses.
- Avoid exposing raw API shapes through frontend domain types.

### 5. High: production build path does not package the Next.js API layer

Severity: High

Evidence:
- [package.json](/home/ditech/Documents/tech-bant-community/package.json#L7) uses `vite` for `dev`.
- [package.json](/home/ditech/Documents/tech-bant-community/package.json#L8) uses `next dev` only in `dev:all`.
- [package.json](/home/ditech/Documents/tech-bant-community/package.json#L10) uses `vite build` for production build.
- [vite.config.ts](/home/ditech/Documents/tech-bant-community/vite.config.ts#L7) proxies `/api` to a separately running Next server in development.

Impact:
- A Vite-only production build will not include or run the Next API routes under `app/api`.
- The frontend is tightly coupled to `/api/v1/*`, so a standard SPA deployment will break authentication, posts, comments, media, and admin features.
- This is a deployment blocker, not just a documentation gap.

Suggested fix:
- Decide on one runtime architecture:
  - pure Next.js app/router app, or
  - separate frontend and backend services with a real deployable API server.
- Align `build`, `start`, and deployment docs accordingly.

### 6. Medium: OAuth callback PKCE handling is incomplete and may fail depending on provider flow

Severity: Medium

Evidence:
- [app/api/v1/auth/oauth/google/callback/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/oauth/google/callback/route.ts#L45) requests a PKCE token exchange.
- [app/api/v1/auth/oauth/google/callback/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/oauth/google/callback/route.ts#L53) reads `code_verifier` from the callback URL query string.
- No corresponding server-side storage/retrieval of a PKCE verifier is present in [app/api/v1/auth/oauth/google/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/oauth/google/route.ts#L1).

Impact:
- PKCE flows typically require the original verifier generated at auth initiation time.
- If Supabase/Google expects PKCE here, the exchange can fail intermittently or permanently.
- The fallback `authorization_code` branch may mask the problem in some environments and fail in others.

Suggested fix:
- Either implement PKCE properly by storing the verifier server-side with the state record, or remove the PKCE branch and use the supported exchange method consistently.

### 7. Medium: counters and engagement metrics can drift under concurrency

Severity: Medium

Evidence:
- [app/api/v1/posts/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/posts/route.ts#L155) updates `posts_count` using a read-modify-write pattern.
- [app/api/v1/posts/[id]/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/posts/[id]/route.ts#L38) increments views non-atomically.
- [app/api/v1/posts/[id]/comments/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/posts/[id]/comments/route.ts#L70) recalculates comments count after insertion, outside a transaction.
- [app/api/v1/comments/[id]/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/comments/[id]/route.ts#L64) deletes a comment and then decrements the stored comment count separately.

Impact:
- Concurrent requests can overwrite each other.
- Post views, comment totals, and user post counts will eventually become inaccurate.
- This creates hard-to-debug UI inconsistencies and incorrect analytics.

Suggested fix:
- Move counter updates to SQL functions, database triggers, or transactional RPCs.
- Treat derived counters as computed data where possible instead of hand-maintained fields.

### 8. Medium: comment deletion ignores the delete result before updating counters

Severity: Medium

Evidence:
- [app/api/v1/comments/[id]/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/comments/[id]/route.ts#L64) deletes the comment.
- The result is not checked before [app/api/v1/comments/[id]/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/comments/[id]/route.ts#L67) decrements the post’s comment count.

Impact:
- If the delete fails silently, the API can still return success after mutating related counts.
- This can leave comment counts lower than the actual number of stored comments.

Suggested fix:
- Check and handle the delete error explicitly before mutating the post record.
- Prefer recalculating count from the comments table or using DB-side integrity logic.

### 9. Medium: password reset can leave multiple valid OTPs active for the same user

Severity: Medium

Evidence:
- [app/api/v1/auth/reset-password/route.ts](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/reset-password/route.ts#L27) inserts a new OTP.
- Unlike the shared helper in [lib/security.ts](/home/ditech/Documents/tech-bant-community/lib/security.ts#L145), the reset-password route does not mark prior unused password-reset OTPs as used first.

Impact:
- Multiple reset codes can remain valid at the same time.
- Users may enter an older code and get inconsistent outcomes depending on which OTP record is selected during confirmation.
- This is also a mild security regression.

Suggested fix:
- Reuse `issueEmailOTP` for password resets or mirror its “invalidate previous codes first” behavior.

### 10. Low: Next image config uses deprecated `images.domains`

Severity: Low

Evidence:
- [next.config.js](/home/ditech/Documents/tech-bant-community/next.config.js#L4) still uses `images.domains`.

Impact:
- The app emits a framework warning in development.
- This will eventually become technical debt or breakage as Next continues to deprecate older config paths.

Suggested fix:
- Replace `images.domains` with `images.remotePatterns`.

## Test Coverage Gaps

Current automated coverage is very narrow:
- `tests/security.test.ts`
- `tests/validation.test.ts`

Missing automated coverage:
- Auth lifecycle: signup, login, verify, refresh, logout, expired-token recovery
- OAuth happy path and failure paths
- Profile data normalization between API and UI types
- Post/comment counter correctness under repeated or concurrent actions
- Media upload success/failure cleanup behavior
- Role-based admin authorization flows
- Production build/deployment smoke tests

## Recommended Next Test Additions

1. Add integration tests for `/auth/login`, `/auth/verify`, `/auth/refresh`, and `/auth/logout`.
2. Add a contract test that asserts backend user payloads are normalized before entering React auth state.
3. Add an end-to-end test that signs up, reloads, refreshes a session, and logs out.
4. Add a concurrency-oriented integration test for post views and comment counters.
5. Add a deployment smoke test that fails if `/api/v1/*` is unavailable after the documented production build.

## Final Assessment

The codebase is not in immediate static-check failure, but it is not yet reliable in production-critical auth flows. The largest quality risks are session management correctness, frontend/backend data-shape drift, and an ambiguous deployment model. Those should be addressed before spending time on lower-priority UI polish or feature expansion.
