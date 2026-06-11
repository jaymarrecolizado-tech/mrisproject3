# Feature: DICT Project Entries

## Goal

Manage DICT project entries and provide entry data for projects, reports, and progress tracking.

## Status

Draft

## Route and Permission

- Route: entry actions are used from project/report contexts
- Required permission: depends on consuming feature
- Related API actions: `entries.list`, `entries.get`, `entries.create`, `entries.update`, `entries.delete`

## Files

### Frontend

- `src/pages/DictProjects.tsx`
- `src/pages/Reports.tsx`

### Backend

- `api/routes/entries.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| List entries | `api/routes/entries.php` | Draft | API action exists | Needs contract | Document filters and pagination | Consumers receive expected entries |
| Get entry | `api/routes/entries.php` | Draft | API action exists | Needs contract | Document detail fields | Detail consumers receive complete data |
| Create entry | `api/routes/entries.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid entries are rejected |
| Update entry | `api/routes/entries.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete entry | `api/routes/entries.php` | Draft | API action exists | Needs dependency spec | Define safe delete behavior | Deletes are safe |
| Entry reporting | `src/pages/Reports.tsx` | Draft | Reports can include entry data | Needs field contract | Define report fields | Reports consume documented entry fields |

## Missing Work

- Define entry validation rules.
- Define project relationship validation.
- Define delete dependency rules.
- Add report field contract.

## Next Planned Work

1. Inspect `api/routes/entries.php`.
2. Map entry fields to project and report UI.
3. Add acceptance criteria for validation and deletion.

## Acceptance Criteria

- Entry CRUD behavior is documented.
- Project relationship validation is documented.
- Report usage is documented.
- Delete behavior is safe.

## Tests and Verification

- [ ] API syntax/static checks pass
- [ ] Manual entry CRUD verification completed
- [ ] Report field verification completed

## Risks and Dependencies

- Entry data affects project progress and reports.
- Deleting entries may affect historical reporting.

## Definition of Done for This Feature

Entries are done only when CRUD, validation, project relationship, report usage, and delete safety are specified and verified.
