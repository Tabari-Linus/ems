# Auth API: frontend integration contract

Slice 1. Applies to the backend on `feat/slice-1-auth` and later. All paths are relative to the API
origin (`APP_CONFIG.apiUrl`, e.g. `http://localhost:8080` locally, `https://api.<domain>` in production).

## 1. Model in one paragraph

Sign-in returns a short-lived **access token** (JWT, 15 min) in the JSON body and sets a long-lived,
rotating **refresh token** in an `HttpOnly` cookie. Keep the access token in memory only and send it as
`Authorization: Bearer <token>` to `/graphql` and to the two bearer-authenticated auth endpoints. When it
expires (or on app start), call `POST /api/v1/auth/refresh-token`; the browser sends the cookie
automatically. Every device/browser has its own session; signing in elsewhere never ends it.
**Permissions are no longer part of the contract of the token**: ask the server with the `me` query.

## 2. Tokens and cookie

| | Access token | Refresh token |
|---|---|---|
| Where | JSON body (`accessToken`) | Cookie `refresh_token` |
| Lifetime | 15 min (`JWT_EXPIRATION_MS`, default 900000) | 7 days (`JWT_REFRESH_EXPIRATION_MS`), renewed on every refresh |
| Format | RS256 JWT | Opaque 256-bit random string (only its SHA-256 hash is stored server-side) |
| Rotation | New one on every login/refresh | **Single use**: every refresh returns a new one and revokes the old one |

**Access-token claims:** `sub` (account public id, a UUID; equals `me.account.id`), `iss` (`ems-api`),
`aud` (`["ems-web"]`), `iat`, `exp`, `jti`, `sid` (session family id). The server validates signature,
`exp`, `iss` and `aud`, then loads the account on every request (cached ≤ 60 s, evicted on changes), so a
deactivated user or a revoked permission takes effect on the next request even with a valid-looking token.

**Cookie attributes** (env-driven): `refresh_token=<opaque>; Path=/api/v1/auth; HttpOnly; SameSite=Lax;
Max-Age=<seconds until session expiry>`, plus `Secure` in production (`AUTH_COOKIE_SECURE`, default
`true` in the `prod` profile). No `Domain` attribute (host-only on the API host). Clearing responses send
the same cookie with an empty value and `Max-Age=0`.

**Every request that should carry or receive the cookie must use credentials**:
`fetch(url, { credentials: 'include' })` / Angular `withCredentials: true`.

## 3. CSRF rule for cookie endpoints

`POST /refresh-token`, `POST /logout` and `POST /logout-all` must send:

```
X-Requested-With: ems-web
Origin: <an origin listed in ALLOWED_ORIGINS>      (browsers add this automatically on cross-origin fetch)
```

If `Origin` is missing, `Referer` is used instead. Otherwise the response is
`403 {"status":403,"code":"CSRF_REJECTED",...}`. The custom header makes the request CORS-preflighted, so a
foreign site cannot send it. `/graphql` needs no CSRF token (Bearer is not ambient); Apollo keeps sending
`apollo-require-preflight: true`.

The `Authorization` header is **ignored** on `/login`, `/refresh-token`, `/logout` and `/set-password`, so
attaching a stale access token to those calls is harmless.

## 4. Error body (every auth error)

```json
{ "status": 400, "code": "PASSWORD_POLICY", "message": "The password does not meet the password policy",
  "violations": [ { "field": "newPassword", "message": "Password must be at least 10 characters" } ] }
```

`violations` is present only for `VALIDATION_ERROR` and `PASSWORD_POLICY`. `message` is safe to show.

| code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed JSON or bean-validation failure (`violations[]` per field) |
| `INVALID_CREDENTIALS` | 401 (login) / 400 (change-password: wrong current password) | Unknown email or wrong password (same message for both) |
| `ACCOUNT_LOCKED` | 423 | 5 consecutive wrong passwords → locked 15 min; also returned for the 5th failure itself |
| `ACCOUNT_PENDING` | 403 | Account has no password yet: the user must use the welcome link |
| `ACCOUNT_INACTIVE` | 403 on login/refresh, 401 on bearer requests | Account disabled, or employee INACTIVE / ARCHIVED / deleted |
| `TOKEN_INVALID` | 401 (refresh, bearer) / 400 (set-password) | Unknown, revoked or reused refresh token; bad JWT; unknown/used one-time token |
| `TOKEN_EXPIRED` | 401 (refresh, bearer) / 400 (set-password) | Expired session, access token or one-time token |
| `PASSWORD_POLICY` | 400 | New password breaks the policy (`violations[]`) |
| `RATE_LIMITED` | 429 + `Retry-After: <seconds>` | Too many `/login` or `/set-password` calls from one IP |
| `CSRF_REJECTED` | 403 | Missing `X-Requested-With: ems-web` or disallowed origin |
| `UNAUTHENTICATED` | 401 | Bearer-only endpoint called without a token |
| `FORBIDDEN` | 403 | URL-level denial (GraphQL permission errors stay in `errors[].extensions.code`) |

Bearer failures on `/graphql` return the same JSON body with `401` and a `WWW-Authenticate: Bearer ...`
header (`TOKEN_EXPIRED` → refresh and retry once; `TOKEN_INVALID`/`ACCOUNT_*` → sign out).

## 5. Endpoints

### `POST /api/v1/auth/login`
Request `{"email": "ama@example.com", "password": "..."}` (email is case-insensitive).
`200 {"accessToken": "<jwt>", "expiresAt": "2026-10-23T10:15:00Z"}` + `Set-Cookie: refresh_token=...`,
`Cache-Control: no-store`. Starts a new session; other devices keep theirs. Errors: `VALIDATION_ERROR`,
`INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_PENDING`, `ACCOUNT_INACTIVE`, `RATE_LIMITED`
(10 per minute per IP by default).

### `POST /api/v1/auth/refresh-token`  (cookie + CSRF headers, no body)
`200` with the same body as login and a **new** cookie. Errors: `TOKEN_INVALID` (no cookie, unknown or
already-used token), `TOKEN_EXPIRED`, `ACCOUNT_INACTIVE`/`ACCOUNT_LOCKED`, `CSRF_REJECTED`.

**Reuse detection:** presenting a refresh token that was already rotated revokes the whole session
(family) and is audited; the user must sign in again on that device. Therefore refreshes **must be
single-flight**: one in-flight refresh per app, shared by every request that hit a 401, and coordinated
across tabs (e.g. `navigator.locks.request('ems-refresh', ...)` or a BroadcastChannel), because two tabs
refreshing the same cookie at once look like reuse.

### `POST /api/v1/auth/logout`  (cookie + CSRF headers)
Revokes this device's session (if the cookie is valid) and clears the cookie. Always `204`.

### `POST /api/v1/auth/logout-all`  (Bearer + CSRF headers)
Revokes every session of the user on every device and clears the cookie. `204`. `401 UNAUTHENTICATED`
without a valid access token.

### `POST /api/v1/auth/set-password`
Request `{"token": "<from the email link>", "newPassword": "..."}`. Consumes the one-time token, sets the
password, moves a `PENDING` employee to `ACTIVE`, unlocks the account, revokes all sessions, clears the
cookie. `204`; then send the user to the login page. Errors: `TOKEN_INVALID` / `TOKEN_EXPIRED` (400),
`PASSWORD_POLICY` (the token is **not** consumed, the user can retry), `ACCOUNT_INACTIVE`,
`VALIDATION_ERROR`, `RATE_LIMITED`.

Welcome emails link to `${APP_FRONTEND_URL}/set-password?token=<raw>`; the token is valid once for 72 h,
and issuing a new one invalidates older unused ones. The frontend route must read `token` from the query
string, POST it, and avoid logging or storing it (strip it from the URL with `history.replaceState`).

### `POST /api/v1/auth/change-password`  (Bearer)
Request `{"currentPassword": "...", "newPassword": "..."}`. `204`. Keeps the current session (the one
named by the access token's `sid`) and revokes all others. Errors: `INVALID_CREDENTIALS` (400, wrong
current password), `PASSWORD_POLICY` (incl. "must differ from the current one"), `UNAUTHENTICATED`.

### Password policy
10–128 characters; must not contain the part of the email before `@`; must not be a common password
(bundled list). Mirror these rules in the strength meter, but always display the server's `violations`.

## 6. GraphQL `me`

```graphql
query Me {
  me {
    account { id email lastLoginAt }
    employee { id firstName lastName workEmail status }   # null for accounts without an employee
    permissions                                          # effective permissions, [Permission!]!
  }
}
```

Requires only a valid access token (no permission). `permissions` comes from the employee's access level
**only if that level is ACTIVE**; an archived level yields `[]`. Drive guards, menus and `*hasPermission`
from this list and re-fetch it after a refresh or on a `FORBIDDEN` error.

## 7. Transition flag (`app.auth.legacy-permissions-claim`, env `AUTH_LEGACY_PERMISSIONS_CLAIM`)

Default `true`: access tokens still carry the old `permissions` (string array) and `account_id` claims so
the current frontend keeps working. The server **never** reads them for authorization. Once the frontend
uses `me`, set it to `false`; the tokens then contain only the claims in §2.

## 8. What the frontend must change

1. Send credentials on every auth call; send `X-Requested-With: ems-web` on refresh/logout/logout-all.
2. App initializer: `POST /refresh-token` → on 200 keep the access token in memory and run `me`; on 401
   show the login page.
3. Single-flight refresh (per app and across tabs, see §5) and one retry of the failed request.
4. Replace JWT decoding of permissions with the `me` query (then turn the transition flag off).
5. New pages: set-password (from the welcome link) and change-password; logout and "log out everywhere".
6. Handle the error codes in §4 (lockout, pending, inactive, rate-limit with `Retry-After`).
