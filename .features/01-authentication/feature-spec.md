# Feature: Authentication and Session Handling

## Goal

Handle login, token refresh, logout, password reset flow, and authenticated user loading.

## Status

Draft

## Route and Permission

- Route: `/login`
- Required permission: public
- Related API actions: `auth.login`, `auth.me`, `auth.logout`, `auth.refresh`, `auth.change-password`, `auth.forgot-password`, `auth.reset-password`

## Files

### Frontend

- `src/pages/auth/LoginPage.tsx`
- `src/context/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`

### Backend

- `api/routes/auth.php`
- `api/middleware/Auth.php`
- `api/helpers/JWT.php`
- `api/helpers/RateLimiter.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Login form | `src/pages/auth/LoginPage.tsx` | Draft | Login UI exists | Needs function-level behavior map | Document required fields, validation, loading, and error states | Form validates credentials and shows clear errors |
| Auth context | `src/context/AuthContext.tsx` | In Progress | User/session state exists | React Hooks lint issue from `useEffect(() => { loadUser(); }, [loadUser])` | Refactor initial load so state updates are not called directly inside effect body | `npm run lint` has no AuthContext lint errors |
| Protected routes | `src/components/ProtectedRoute.tsx` | Draft | Redirects unauthorized users to `/` | No explicit forbidden UI | Add clear access-denied behavior if needed | Unauthorized users get predictable feedback |
| Token refresh | `src/context/AuthContext.tsx` | Draft | Refresh behavior exists | Needs explicit status | Add function-level spec and tests | Session remains valid when refresh succeeds |
| Logout | `src/context/AuthContext.tsx` | Draft | Logout behavior exists | Needs explicit status | Add spec and tests | Logout clears session and redirects correctly |

## Missing Work

- Resolve current AuthContext lint error.
- Define function-level specs for login validation, refresh, logout, and password reset.
- Add tests for AuthContext permission loading and token refresh.
- Confirm expected unauthorized-route behavior.

## Next Planned Work

1. Fix AuthContext lint issue.
2. Finish authentication function map.
3. Add tests for auth state transitions.

## Acceptance Criteria

- User can log in with valid credentials.
- Invalid credentials show a clear error.
- Authenticated user loads before protected routes render.
- Expired session refreshes correctly.
- Logout clears local auth state.
- AuthContext passes lint.

## Tests and Verification

- [ ] `npm run lint` passes
- [ ] AuthContext tests pass
- [ ] Login page validation tests pass
- [ ] Manual login/logout flow verified
- [ ] Permission loading verified

## Risks and Dependencies

- ProtectedRoute depends on AuthContext loading correctly.
- Reports visibility depends on permission loading.

## Definition of Done for This Feature

Authentication is done only when login, session loading, refresh, logout, and protected-route behavior are specified, implemented, lint-clean, and tested.
