# Feature: Authentication and Session Handling

## Goal

Handle login, token refresh, logout, password reset flow, and authenticated user loading.

## Status

Verified — all flows implemented, lint + type-check clean, 16 auth tests + 3 interceptor tests pass.

## Route and Permission

- Route: `/login` (public), `/forgot-password` (public), `/reset-password` (public)
- Required permission: public
- Related API actions: `auth.login`, `auth.me`, `auth.logout`, `auth.refresh`, `auth.change-password`, `auth.forgot-password`, `auth.reset-password`

## Files

### Frontend

- `src/pages/auth/LoginPage.tsx` — login form + "Forgot password?" link
- `src/pages/auth/ForgotPasswordPage.tsx` — email entry → reset instructions
- `src/pages/auth/ResetPasswordPage.tsx` — token + new password, aggregate validation, inline success + Sign-in link
- `src/context/AuthContext.tsx` — session state, login/logout, manual + registered refresh, change/forgot/reset password, permission checks
- `src/components/ProtectedRoute.tsx` — auth + permission gate
- `src/services/api.ts` — request layer with 401 auto-refresh interceptor

### Backend

- `api/routes/auth.php` — all `auth.*` actions
- `api/middleware/Auth.php` — authenticate + permission middleware
- `api/helpers/JWT.php` — access/refresh token issue + verify
- `api/helpers/RateLimiter.php` — login attempt throttling

### Database

- `database/schema.sql` — `users`, `password_resets`, `refresh_tokens`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Login form | `src/pages/auth/LoginPage.tsx` | Verified | Email/password, validation, loading/error, "Forgot password?" link | None | N/A | Form validates credentials and shows clear errors |
| Auth context | `src/context/AuthContext.tsx` | Verified | User/session state, login, logout, refresh, change/forgot/reset password, permission checks | None | N/A | Lint-clean; session loads before protected routes render |
| Protected routes | `src/components/ProtectedRoute.tsx` | Verified | Redirects unauthenticated → `/login` (with return path); denies missing permission → `/` | None | N/A | Unauthorized users get predictable feedback |
| Token refresh | `src/context/AuthContext.tsx` + `src/services/api.ts` | Verified | `refreshToken()` (manual) **and** automatic refresh-on-401 interceptor in `api.ts` (retry-once, loop-guarded) | None | N/A | Session stays valid when refresh succeeds; clears when it fails |
| Logout | `src/context/AuthContext.tsx` | Verified | Calls `auth.logout`, clears localStorage, redirects to login | None | N/A | Logout clears session and redirects |
| Change password | `AuthContext.tsx` / `Profile.tsx` | Verified | `changePassword()` + UI in Profile | None | N/A | Validates current password + requirements, then refreshes token |
| Forgot password | `ForgotPasswordPage.tsx` | Verified | Page at `/forgot-password`, routed, linked from login, email validation + success state | None | N/A | Email submission triggers reset flow |
| Reset password | `ResetPasswordPage.tsx` | Verified | Page at `/reset-password`, token + password entry, **aggregate validation**, inline "Password reset successfully" + Sign-in link | None | N/A | Token + new password resets account |

## Completed Work

- ✅ AuthContext lint error resolved (`useRef` initial-load pattern)
- ✅ `refreshToken()`, `changePassword()`, `forgotPassword()`, `resetPassword()` with tests
- ✅ `ForgotPasswordPage` + `ResetPasswordPage` created, routed in `App.tsx`, and linked from `LoginPage`
- ✅ `ResetPasswordPage` reworked to aggregate validation + inline success (matches its test + ForgotPassword UX)
- ✅ **401 auto-refresh interceptor** in `api.ts`: on 401, attempts one silent refresh via registered handler, retries the original request once; skips `auth.login`/`auth.refresh`/`auth.logout` to prevent loops; falls back to clear+redirect on failure. Concurrent 401s coalesce into a single refresh.
- ✅ AuthContext registers its `refreshToken` with `setAuthHandler` on mount (avoids circular import)
- ✅ 3 new interceptor tests (refresh+retry, no-refresh-on-login, clear-on-refresh-failure)
- ✅ All 16 AuthContext + PasswordReset tests pass; full suite 44/44

## Missing Work

- Manual end-to-end verification in a browser (login, logout, token-expiry refresh, change/forgot/reset password).
- (Optional) Forbidden UI for partially-permissioned routes — currently `ProtectedRoute` redirects to `/`.

## Next Planned Work

1. Manual browser verification of the full auth flow.
2. (Optional) Dedicated access-denied screen for permission denials.

## Acceptance Criteria

- ✅ User can log in with valid credentials.
- ✅ Invalid credentials show a clear error.
- ✅ Authenticated user loads before protected routes render.
- ✅ Expired access token is silently refreshed (interceptor); session clears only when refresh fails.
- ✅ Logout clears local auth state.
- ✅ AuthContext passes lint.
- ✅ Change password validates current password and requirements.
- ✅ Forgot password triggers the reset flow (and is reachable from login).
- ✅ Reset password with a valid token updates the password (inline success + sign-in).

## Tests and Verification

- ✅ `npm run lint` passes for auth files (0 errors; pre-existing `any`/`react-refresh` warnings remain)
- ✅ TypeScript type-check passes (`tsc --noEmit`)
- ✅ AuthContext tests pass (14) + PasswordReset page tests pass (2)
- ✅ API interceptor tests pass (3): refresh+retry, no-refresh-on-login, clear-on-refresh-failure
- [ ] Login page validation tests (optional)
- [ ] Manual login/logout/refresh/password-change flow verified in browser

## Risks and Dependencies

- ProtectedRoute depends on AuthContext loading correctly.
- Auto-refresh depends on the backend `auth.refresh` endpoint + a valid refresh token.
- Password reset depends on email delivery (logged to `error_log` in dev).

## Definition of Done for This Feature

Authentication is done only when login, session loading, refresh, logout, password reset, and protected-route behavior are specified, implemented, lint-clean, and tested. ✅ All implemented + tested; manual browser verification remains.
