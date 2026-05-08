# POPPED Admin Auth

POPPED uses simple allowlisted admin auth for the MVP.

This is intentionally smaller than full user auth:

- Public players do not need accounts.
- Admin routes need real protection before create/edit tools exist.
- Secrets stay server-only in `.env.local`.

## Environment Variables

Add these values to `.env.local`:

```bash
ADMIN_ALLOWED_EMAILS=founder@example.com
ADMIN_PASSWORD=replace-with-a-long-random-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

For multiple admins, use a comma-separated allowlist:

```bash
ADMIN_ALLOWED_EMAILS=founder@example.com,editor@example.com
```

Generate a local session secret with:

```bash
openssl rand -base64 32
```

Do not prefix these variables with `NEXT_PUBLIC_`. They are read only by server code.

## Routes

- `/` remains public.
- `/admin` shows a sign-in form when signed out and the admin entry when signed in.
- `/admin/puzzles` is protected and redirects signed-out users back to `/admin`.
- Future routes under `/admin/puzzles/*` inherit the same protection from the route layout.

## Session Behavior

Successful sign-in sets a signed HttpOnly cookie scoped to `/admin`.

The cookie:

- Lasts 12 hours.
- Uses `sameSite=lax`.
- Uses `secure` in production.
- Is invalidated if the email is removed from `ADMIN_ALLOWED_EMAILS`.
