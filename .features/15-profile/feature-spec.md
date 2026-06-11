# Feature: User Profile

## Goal

Allow authenticated users to view and update profile information and change password.

## Status

Draft

## Route and Permission

- Route: `/profile`
- Required permission: authenticated user
- Related API actions: `auth.me`, `auth.change-password`

## Files

### Frontend

- `src/pages/Profile.tsx`
- `src/context/AuthContext.tsx`

### Backend

- `api/routes/auth.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Profile page | `src/pages/Profile.tsx` | Draft | Page exists | Needs function-level spec | Document editable fields | Profile form behavior is clear |
| Load profile | `src/context/AuthContext.tsx` | In Progress | User state exists | AuthContext has lint issue | Fix lint and verify profile data load | Profile data loads safely |
| Change password | `api/routes/auth.php` | Draft | API action exists | Needs validation spec | Define password requirements | Invalid passwords are rejected |
| Save profile | `src/pages/Profile.tsx` | Draft | Page exists | Needs backend mapping | Identify whether profile update endpoint exists | Profile updates are documented or added |

## Missing Work

- Fix AuthContext lint issue.
- Define profile editable fields.
- Confirm whether profile update is implemented.
- Add change-password validation spec.

## Next Planned Work

1. Inspect `Profile.tsx`.
2. Inspect `auth.change-password`.
3. Add profile update acceptance criteria.

## Acceptance Criteria

- Profile route is available to authenticated users.
- Profile data loads safely.
- Change password validates input.
- Profile editable fields are documented.
- AuthContext lint is clean.

## Tests and Verification

- [ ] `npm run lint` passes
- [ ] API syntax/static checks pass
- [ ] Manual profile verification completed
- [ ] Password change verification completed

## Risks and Dependencies

- Password changes must follow strong validation.
- Profile updates must not expose sensitive fields.

## Definition of Done for This Feature

Profile is done only when profile data loading, editable fields, password change, and validation are specified and verified.
