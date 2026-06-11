# Feature: User Management

## Goal

Manage users, user project access, and user authentication-related profile data.

## Status

Draft

## Route and Permission

- Route: `/users`
- Required permission: `users.manage`
- Related API actions: `users.list`, `users.get`, `users.create`, `users.update`, `users.delete`

## Files

### Frontend

- `src/pages/Users.tsx`

### Backend

- `api/routes/users.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Users page | `src/pages/Users.tsx` | Draft | Page exists | Needs function-level spec | Document list, create, edit, delete behavior | Every user action has defined behavior |
| List users | `api/routes/users.php` | Draft | API action exists | Needs contract | Document filters and pagination | UI receives expected users |
| Get user | `api/routes/users.php` | Draft | API action exists | Needs contract | Document detail fields | Detail consumers receive complete data |
| Create user | `api/routes/users.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid users are rejected |
| Update user | `api/routes/users.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete user | `api/routes/users.php` | Draft | API action exists | Needs dependency spec | Define safe delete behavior | Deletes are safe |
| User project access | `api/routes/users.php` | Draft | API action exists | Needs contract | Define access assignment behavior | Access assignments persist correctly |

## Missing Work

- Complete user CRUD specs.
- Define password handling behavior.
- Define delete safety rules.
- Verify `users.manage` permission.

## Next Planned Work

1. Inspect `Users.tsx`.
2. Inspect `api/routes/users.php`.
3. Add acceptance criteria for validation and project access.

## Acceptance Criteria

- Users route requires `users.manage`.
- User CRUD behavior is documented.
- User project access behavior is documented.
- Delete behavior is safe.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual user CRUD verification completed
- [ ] Permission verification completed

## Risks and Dependencies

- Deleting users can affect audit logs and ownership.
- Password handling must avoid exposing secrets.

## Definition of Done for This Feature

Users are done only when CRUD, project access, password behavior, and delete safety are specified and verified.
