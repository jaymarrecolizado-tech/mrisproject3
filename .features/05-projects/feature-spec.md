# Feature: DICT Projects

## Goal

Manage DICT projects and provide project data for reports, dashboard, map, entries, milestones, and site relationships.

## Status

Draft

## Route and Permission

- Route: `/dict-projects`
- Required permission: `projects.view`
- Related API actions: `projects.list`, `projects.get`, `projects.create`, `projects.update`, `projects.delete`, `projects.stats`

## Files

### Frontend

- `src/pages/DictProjects.tsx`

### Backend

- `api/routes/projects.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Projects page | `src/pages/DictProjects.tsx` | Draft | Page exists | Needs function-level spec | Document project list, create, edit, delete behavior | Every UI action has a mapped function |
| List projects | `api/routes/projects.php` | Draft | API action exists | Needs response contract | Document filters and pagination | UI receives expected project list |
| Get project | `api/routes/projects.php` | Draft | API action exists | Needs contract | Document detail fields | Detail view receives complete data |
| Create project | `api/routes/projects.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid projects are rejected |
| Update project | `api/routes/projects.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete project | `api/routes/projects.php` | Draft | API action exists | Needs dependency spec | Define cascade/blocking rules | Deletes are safe |
| Project stats | `api/routes/projects.php` | Draft | API action exists | Needs calculation spec | Define stat fields | Stats match database state |

## Missing Work

- Complete project CRUD specs.
- Define project relationship rules.
- Add delete dependency rules.
- Verify route permission.

## Next Planned Work

1. Inspect `DictProjects.tsx`.
2. Map project fields to database columns.
3. Add acceptance criteria for stats and dependencies.

## Acceptance Criteria

- Projects route requires `projects.view`.
- Project CRUD behavior is documented.
- Project stats are documented.
- Delete behavior handles related records safely.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual project CRUD verification completed
- [ ] Permission verification completed

## Risks and Dependencies

- Project deletion may affect sites, entries, milestones, reports, and dashboard data.
- Reports depend on project metadata.

## Definition of Done for This Feature

Projects are done only when CRUD, stats, relationships, and delete safety are specified and verified.
