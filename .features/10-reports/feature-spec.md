# Feature: Reports

## Goal

Allow authorized users to view recent reports, generate reports, download reports, and delete generated reports.

## Status

In Progress

## Route and Permission

- Route: `/reports`
- Required permission: `reports.view`
- Related API actions: `reports.list`, `reports.generate`, `reports.download`, `reports.delete`, `sites.export`

## Files

### Frontend

- `src/pages/Reports.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/Layout.tsx`
- `src/context/AuthContext.tsx`

### Backend

- `api/routes/reports.php`
- `api/cron/generate_reports.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Reports route | `src/App.tsx` | Draft | Route requires `reports.view` | Unauthorized users currently redirect to `/` | Decide whether to show explicit access-denied UI | Unauthorized users get predictable behavior |
| Reports nav item | `src/components/Layout.tsx` | Draft | Hidden when `reports.view` is false | Status depends on permission loading | Verify AuthContext permission state | Nav matches actual permissions |
| Recent reports | `src/pages/Reports.tsx` | Draft | Calls `reports.list` | Needs loading/error/empty states | Add function-level spec | Recent reports load safely |
| Report summary | `src/pages/Reports.tsx` | Draft | Calls `reports.summary` | `reports.summary` requires `reports.generate` | Define behavior for non-generation users | Non-generation users see clear message |
| Generate CSV/PDF | `src/pages/Reports.tsx` | Draft | Calls `reports.generate` | Needs validation and permission behavior | Add function-level spec | Only authorized users can generate |
| Generate XLSX | `src/pages/Reports.tsx` | Draft | Calls `reports.generate` | Needs validation and permission behavior | Add function-level spec | XLSX generation is verified |
| Download generated report | `src/pages/Reports.tsx` | Draft | Calls `reports.download` | Needs permission behavior | Add function-level spec | Download works for owned/generated reports |
| Delete generated report | `src/pages/Reports.tsx` | Draft | Calls `reports.delete` | Needs confirmation/audit behavior | Add function-level spec | Delete behavior is safe |
| Export all sites | `src/pages/Reports.tsx` | Draft | Calls `sites.export` | Needs permission behavior | Add function-level spec | Export respects permissions |

## Current Implementation Notes

- `Reports.tsx` was recently refactored to move state updates out of effect bodies.
- Remaining frontend lint issue is in `src/context/AuthContext.tsx`.
- `reports.list` is available to authenticated users.
- `reports.summary`, `reports.generate`, and `reports.delete` require `reports.generate`.

## Missing Work

- Resolve current blank-page/visibility issue for roles without generation access.
- Add explicit access-denied or disabled-generation behavior.
- Complete report type field contracts.
- Add tests/manual verification for permission behavior.
- Re-run `npm run lint`.

## Next Planned Work

1. Fix AuthContext lint issue.
2. Confirm expected reports behavior for `reports.view` vs `reports.generate`.
3. Add explicit UI for users who can view reports but cannot generate them.
4. Re-run lint and verify reports route.

## Acceptance Criteria

- Users without `reports.view` cannot access Reports.
- Users with `reports.view` but without `reports.generate` do not see a blank page.
- Users with `reports.generate` can generate CSV, PDF, and XLSX reports.
- Recent reports load safely.
- Generated reports can be downloaded and deleted according to permission rules.

## Tests and Verification

- [ ] `npm run lint` passes
- [ ] Reports route permission verified
- [ ] Reports generation permission verified
- [ ] Manual report generation verified
- [ ] Manual report download verified

## Risks and Dependencies

- Reports depend on project, site, entry, milestone, and log data quality.
- Permission mismatch can cause blank pages or confusing UI.
- Large report generation can be slow.

## Definition of Done for This Feature

Reports are done only when view/generate permissions are clear, non-generation users see useful UI, generation works, and lint/tests pass.
