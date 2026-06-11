# Feature: Free WiFi Daily Logs

## Goal

Manage Free WiFi daily logs, including list, create, update, delete, bulk import, summary, site logs, and export.

## Status

Draft

## Route and Permission

- Route: `/freewifi`
- Required permission: `logs.view`
- Related API actions: `logs.list`, `logs.get`, `logs.create`, `logs.update`, `logs.delete`, `logs.bulk-import`, `logs.daily-summary`, `logs.site-logs`, `logs.export`

## Files

### Frontend

- `src/pages/FreeWifi.tsx`

### Backend

- `api/routes/logs.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Free WiFi page | `src/pages/FreeWifi.tsx` | Draft | Page exists | Needs function-level spec | Document every UI function | Every UI action has a backend mapping |
| List logs | `api/routes/logs.php` | Draft | API action exists | Needs contract | Document query filters and pagination | Page displays expected logs |
| Create log | `api/routes/logs.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid records are rejected clearly |
| Update log | `api/routes/logs.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete log | `api/routes/logs.php` | Draft | API action exists | Needs confirmation/audit spec | Define delete behavior | Deleted log is removed safely |
| Bulk import | `api/routes/logs.php` | Draft | API action exists | Needs file validation spec | Define CSV format and row errors | Import reports valid and invalid rows |
| Daily summary | `api/routes/logs.php` | Draft | API action exists | Needs calculation spec | Define aggregation rules | Summary matches seeded data |
| Export | `api/routes/logs.php` | Draft | API action exists | Needs export contract | Define columns and filters | Export contains expected rows |

## Missing Work

- Complete UI/backend function map.
- Define import/export file format.
- Define validation errors.
- Verify permission behavior.

## Next Planned Work

1. Inspect `FreeWifi.tsx`.
2. Document CSV import/export format.
3. Add acceptance criteria for summary calculations.

## Acceptance Criteria

- Free WiFi route requires `logs.view`.
- CRUD operations are specified.
- Bulk import validates rows.
- Daily summary calculations are documented.
- Export format is documented.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Import/export manual verification completed
- [ ] Permission verification completed

## Risks and Dependencies

- Bulk import can introduce malformed data.
- Summary calculations depend on log data consistency.

## Definition of Done for This Feature

Free WiFi logs are done only when CRUD, import, summary, and export behavior are specified and verified.
