# Feature: Audit Trail

## Goal

Display audit logs with filtering, pagination, and readable change details.

## Status

Draft

## Route and Permission

- Route: `/audit`
- Required permission: `audit.view`
- Related API actions: `audit.list`

## Files

### Frontend

- `src/pages/AuditTrail.tsx`

### Backend

- `api/routes/audit.php`
- `api/helpers/AuditHelper.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Audit page | `src/pages/AuditTrail.tsx` | Draft | Page exists | Needs function-level spec | Document filters, pagination, detail modal | Every audit UI action has defined behavior |
| List audit logs | `api/routes/audit.php` | Draft | API action exists | Needs contract | Document filters and pagination | UI receives expected logs |
| Change detail rendering | `src/pages/AuditTrail.tsx` | Draft | Diff UI exists | Needs edge-case spec | Define old/new object comparison | Diff renders safely |
| Filter logs | `src/pages/AuditTrail.tsx` | Draft | Filter state exists | Needs acceptance criteria | Define supported filters | Filters return expected logs |
| Pagination | `src/pages/AuditTrail.tsx` | Draft | Page state exists | Needs acceptance criteria | Define page size and total handling | Pagination is stable |
| Audit logging | `api/helpers/AuditHelper.php` | Draft | Helper exists | Needs coverage spec | Document audited actions | Audit logs are created for expected actions |

## Missing Work

- Complete audit function map.
- Define filter behavior.
- Define diff rendering edge cases.
- Verify audit coverage for critical actions.

## Next Planned Work

1. Inspect `AuditTrail.tsx`.
2. Inspect `api/routes/audit.php`.
3. Add acceptance criteria for filters and diff rendering.

## Acceptance Criteria

- Audit route requires `audit.view`.
- Audit logs paginate correctly.
- Filters return expected logs.
- Diff rendering handles missing keys safely.
- Critical actions are audited.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual audit filter verification completed
- [ ] Audit logging verification completed

## Risks and Dependencies

- Audit logs depend on actions being logged consistently.
- Diff rendering can fail on complex nested objects.

## Definition of Done for This Feature

Audit trail is done only when list, filter, pagination, diff rendering, and audit coverage are specified and verified.
