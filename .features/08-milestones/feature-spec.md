# Feature: Project Milestones

## Goal

Manage project milestones and provide milestone data for dashboard, reports, and project progress tracking.

## Status

Draft

## Route and Permission

- Route: milestone actions are used from project/dashboard/report contexts
- Required permission: depends on consuming feature
- Related API actions: `milestones.list`, `milestones.get`, `milestones.create`, `milestones.update`, `milestones.delete`

## Files

### Frontend

- `src/pages/Dashboard.tsx`
- `src/pages/DictProjects.tsx`
- `src/pages/Reports.tsx`

### Backend

- `api/routes/milestones.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| List milestones | `api/routes/milestones.php` | Draft | API action exists | Needs contract | Document filters and pagination | Consumers receive expected milestones |
| Get milestone | `api/routes/milestones.php` | Draft | API action exists | Needs contract | Document detail fields | Detail consumers receive complete data |
| Create milestone | `api/routes/milestones.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid milestones are rejected |
| Update milestone | `api/routes/milestones.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete milestone | `api/routes/milestones.php` | Draft | API action exists | Needs dependency spec | Define safe delete behavior | Deletes are safe |
| Dashboard milestone progress | `src/pages/Dashboard.tsx` | Draft | Dashboard uses milestone data | Needs calculation spec | Define progress calculation | Progress matches milestone status |

## Missing Work

- Define milestone status rules.
- Define project relationship validation.
- Define delete dependency rules.
- Add dashboard progress calculation spec.

## Next Planned Work

1. Inspect `api/routes/milestones.php`.
2. Map milestone fields to dashboard/report usage.
3. Add acceptance criteria for status and progress.

## Acceptance Criteria

- Milestone CRUD behavior is documented.
- Status transitions are documented.
- Dashboard progress calculation is documented.
- Delete behavior is safe.

## Tests and Verification

- [ ] API syntax/static checks pass
- [ ] Dashboard milestone verification completed
- [ ] Manual milestone CRUD verification completed

## Risks and Dependencies

- Milestone status affects dashboard and report calculations.
- Deleting milestones may affect historical reporting.

## Definition of Done for This Feature

Milestones are done only when CRUD, status rules, dashboard usage, and delete safety are specified and verified.
