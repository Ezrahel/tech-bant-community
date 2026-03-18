# Audit Report

I reviewed the Vite frontend in [`src/`](/home/ditech/Documents/tech-bant-community/src), the active Next API routes in [`app/api/`](/home/ditech/Documents/tech-bant-community/app/api), the separate Go backend in [`server/`](/home/ditech/Documents/tech-bant-community/server), and the checked-in schema in [`server/database/schema.sql`](/home/ditech/Documents/tech-bant-community/server/database/schema.sql). The highest-risk issues are auth/authorization flaws, stored XSS, data leakage, and unfinished security features that are presented as implemented.

## Security Findings

- Critical: stored XSS is possible because post content is accepted unsanitized in [`app/api/v1/posts/route.ts:80`](/home/ditech/Documents/tech-bant-community/app/api/v1/posts/route.ts#L80) and then rendered with `dangerouslySetInnerHTML` in [`src/views/PostDetailPage.tsx:301`](/home/ditech/Documents/tech-bant-community/src/views/PostDetailPage.tsx#L301). Any user can persist script-bearing HTML.
- Critical: any admin can promote or demote arbitrary users, including to `super_admin`, because `PUT /admin/users/[id]` only requires `withAdmin` in [`app/api/v1/admin/users/[id]/route.ts:6`](/home/ditech/Documents/tech-bant-community/app/api/v1/admin/users/[id]/route.ts#L6). That is broken access control.
- High: password change does not verify `currentPassword` at all in [`app/api/v1/auth/change-password/route.ts:11`](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/change-password/route.ts#L11). Any stolen bearer token is enough to permanently take over the account.
- High: Google OAuth callback accepts a code even when `state` is absent or not found in storage in [`app/api/v1/auth/oauth/google/callback/route.ts:19`](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/oauth/google/callback/route.ts#L19). That opens login CSRF/session-swapping risk.
- High: 2FA is not actually enforced. OTP sending enumerates users in [`app/api/v1/auth/2fa/send-otp/route.ts:20`](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/2fa/send-otp/route.ts#L20), OTP verification is not bound to an authenticated user in [`app/api/v1/auth/2fa/verify/route.ts:13`](/home/ditech/Documents/tech-bant-community/app/api/v1/auth/2fa/verify/route.ts#L13), and the login UI just re-submits password login instead of verifying OTP in [`src/views/LoginPage.tsx:42`](/home/ditech/Documents/tech-bant-community/src/views/LoginPage.tsx#L42).
- High: public/user-facing endpoints leak email addresses broadly. Examples: [`app/api/v1/posts/route.ts:16`](/home/ditech/Documents/tech-bant-community/app/api/v1/posts/route.ts#L16), [`app/api/v1/users/[id]/route.ts:11`](/home/ditech/Documents/tech-bant-community/app/api/v1/users/[id]/route.ts#L11), [`app/api/v1/users/[id]/followers/route.ts:20`](/home/ditech/Documents/tech-bant-community/app/api/v1/users/[id]/followers/route.ts#L20), [`app/api/v1/users/search/route.ts:17`](/home/ditech/Documents/tech-bant-community/app/api/v1/users/search/route.ts#L17). That is unnecessary PII exposure.
- Medium: media upload has no allowlist, no size cap, no scanning, and uses the service-role key to write directly to public storage in [`app/api/v1/media/upload/route.ts:12`](/home/ditech/Documents/tech-bant-community/app/api/v1/media/upload/route.ts#L12). This allows arbitrary file hosting.
- Medium: profile `website` and `avatar` are stored without validation in [`app/api/v1/users/me/route.ts:70`](/home/ditech/Documents/tech-bant-community/app/api/v1/users/me/route.ts#L70) and rendered directly in [`src/views/UserProfilePage.tsx:337`](/home/ditech/Documents/tech-bant-community/src/views/UserProfilePage.tsx#L337) and [`src/views/UserProfilePage.tsx:211`](/home/ditech/Documents/tech-bant-community/src/views/UserProfilePage.tsx#L211). At minimum this enables abusive links and mixed-content issues.
- Medium: the search filter is built with raw string interpolation in [`app/api/v1/users/search/route.ts:20`](/home/ditech/Documents/tech-bant-community/app/api/v1/users/search/route.ts#L20). With PostgREST-style filter syntax, that is fragile and can be abused to alter query semantics or break search.

## Bugs And Product Gaps

- Auth session lifecycle is incomplete. The backend returns `refreshToken`, but the frontend never stores or uses it in [`src/services/auth.ts:72`](/home/ditech/Documents/tech-bant-community/src/services/auth.ts#L72) and [`src/services/auth.ts:141`](/home/ditech/Documents/tech-bant-community/src/services/auth.ts#L141). Logout usually does not invalidate the server-side session.
- Google OAuth URL construction is wrong when `VITE_API_BASE_URL=/api/v1`; it becomes `/api/v1/api/v1/...` in [`src/services/auth.ts:65`](/home/ditech/Documents/tech-bant-community/src/services/auth.ts#L65).
- The login page links to `/forgot-password` in [`src/views/LoginPage.tsx:134`](/home/ditech/Documents/tech-bant-community/src/views/LoginPage.tsx#L134), but that route does not exist in [`src/App.tsx:62`](/home/ditech/Documents/tech-bant-community/src/App.tsx#L62).
- Admin/verified badges are likely broken because the API returns `is_admin`/`is_verified`, but the post mapper reads `isAdmin`/`isVerified` in [`src/services/posts.ts:139`](/home/ditech/Documents/tech-bant-community/src/services/posts.ts#L139).
- `npm run lint` is broken because ESLint scans `.next` and crashes; ignore config only excludes `dist` in [`eslint.config.js:7`](/home/ditech/Documents/tech-bant-community/eslint.config.js#L7).
- The Go backend compiles, but it has no tests. `go test ./...` passed only because every package reports `[no test files]`.

## Unfinished / Inconsistent Areas

- Support submission is a stub in [`src/views/SupportPage.tsx:26`](/home/ditech/Documents/tech-bant-community/src/views/SupportPage.tsx#L26).
- The separate Go backend still contains placeholder auth/OAuth/rate limiting logic in [`server/services/auth_service.go:548`](/home/ditech/Documents/tech-bant-community/server/services/auth_service.go#L548), [`server/handlers/oauth_handler.go:110`](/home/ditech/Documents/tech-bant-community/server/handlers/oauth_handler.go#L110), and [`server/middleware/security.go:53`](/home/ditech/Documents/tech-bant-community/server/middleware/security.go#L53). It should not be treated as production-ready.
- Config/docs are inconsistent with the actual stack. [`/.env.example:8`](/home/ditech/Documents/tech-bant-community/.env.example#L8) still references Appwrite/Blueprint-era keys while current code uses Supabase/Resend/Next routes. That will mislead setup and ops.
- Local secret files exist and are populated in [`.env`](/home/ditech/Documents/tech-bant-community/.env) and [`server/.env`](/home/ditech/Documents/tech-bant-community/server/.env), but `git ls-files` shows they are not tracked. That is not a current repo leak, but it is operationally risky.

## Suggested Features

- Move auth to HttpOnly secure cookies, rotate refresh tokens, and bind sessions to device metadata.
- Add a real moderation/reporting workflow with reporter notifications, evidence snapshots, and admin audit trails.
- Add upload hardening: MIME allowlist, max size, virus scanning, image/video transcoding, private originals.
- Add schema-safe validation for every route with `zod` or equivalent instead of ad hoc checks.
- Add automated tests around auth, admin RBAC, profile privacy, and post/comment ownership before adding more features.
- Decide on one backend path. Right now the Next API and Go server overlap enough to create maintenance and security drift.

## Verification

`npm run build` passed. `npm run lint` failed due the ESLint/.next misconfiguration. `go test ./...` passed only after moving `GOCACHE` to `/tmp`, and there are no actual backend tests.
