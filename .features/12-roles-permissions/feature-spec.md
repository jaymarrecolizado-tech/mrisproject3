# Feature: Roles and Permissions

## Goal

Manage roles, permissions, role assignment, and permission checks used by the frontend and backend.

## Status

Draft

## Route and Permission

- Route: `/roles`
- Required permission: `users.manage`
- Related API actions: `roles.list`, `roles.get`, `roles.update`, `permissions.list`

## Files

### Frontend

- `src/pages/Roles.tsx`
- `src/context/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/Layout.tsx`

### Backend

- `api/routes/roles.php`
- `api/routes/permissions.php`
- `api/middleware/Auth.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Roles page | `src/pages/Roles.tsx` | Draft | Page exists | Needs function-level spec | Document role list/edit behavior | Every role action has defined behavior |
| List roles | `api/routes/roles.php` | Draft | API action exists | Needs contract | Document response shape | UI receives expected roles |
| Get role | `api/routes/roles.php` | Draft | API action exists | Needs contract | Document detail fields | Detail consumers receive complete data |
| Update role | `api/routes/roles.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| List permissions | `api/routes/permissions.php` | Draft | API action exists | Needs contract | Document permission list | UI receives expected permissions |
| Permission checks | `src/context/AuthContext.tsx` | In Progress | Used by routes/layout | AuthContext has lint issue | Fix lint and verify permission loading | Routes and nav match actual permissions |
| Protected routes | `src/components/ProtectedRoute.tsx` | Draft | Redirects unauthorized users | Needs explicit denied UI decision | Define denied-route behavior | Unauthorized users get predictable behavior |

## Missing Work

- Fix AuthContext lint issue.
- Complete role/permission function map.
- Define permission matrix.
- Verify protected route behavior.

## Next Planned Work

1. Fix AuthContext lint issue.
2. Inspect `Roles.tsx`.
3. Document permission matrix and role update rules.

## Acceptance Criteria

- Roles route requires `users.manage`.
- Role update behavior is documented.
- Permission list behavior is documented.
- ProtectedRoute behavior is predictable.
- AuthContext permission loading is lint-clean.

## Tests and Verification

- [ ] `npm run lint` passes
- [ ] API syntax/static checks pass
- [ ] Manual role update verification completed
- [ ] Permission verification completed

## Risks and Dependencies

- Incorrect permission loading can hide or expose pages.
- Role changes can affect audit/report access.

## Definition of Done for This Feature

Roles and permissions are done only when role CRUD, permission list, frontend permission checks, and protected-route behavior are specified and verified.
