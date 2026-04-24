# Legacy Notice

This Go-based superadmin bootstrap path has been intentionally disabled.

The active backend for this repository is the Next API under `app/api`, and superadmin creation now happens through:

```text
POST /api/v1/admin/bootstrap
```

## Why this was disabled

- It duplicated admin provisioning logic outside the primary backend.
- It previously relied on hardcoded credentials, which is unsafe.
- Keeping two bootstrap paths makes role setup harder to reason about and easier to misuse.

## Use the Next backend instead

1. Set `SUPERADMIN_BOOTSTRAP_SECRET` in your environment.
2. Start the app with the Next API available.
3. Call `POST /api/v1/admin/bootstrap` with JSON like:

```json
{
  "name": "Super Admin",
  "email": "you@example.com",
  "password": "strongpassword",
  "secret": "your-bootstrap-secret"
}
```

## Behavior

- The bootstrap route only works when there is no existing `super_admin` in `public.users`.
- Once the first superadmin exists, create or manage admins through the authenticated Next admin routes instead.
