# Feature: Schema Specification View

## Goal

Provide an internal schema specification/reference view for developers or administrators.

## Status

Draft

## Route and Permission

- Route: `/schema`
- Required permission: `users.manage`
- Related files: `database/schema.sql`, `src/pages/SchemaSpec.tsx`

## Files

### Frontend

- `src/pages/SchemaSpec.tsx`

### Backend

- None currently required unless schema is generated dynamically

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Schema page | `src/pages/SchemaSpec.tsx` | Draft | Page exists | Needs function-level spec | Document what schema data is shown | Page purpose and behavior are clear |
| Schema source | `database/schema.sql` | Draft | Schema file exists | Needs parsing/source contract | Define whether page reads static file or generated schema | Schema source is documented |
| Admin access | `src/App.tsx` | Draft | Route requires `users.manage` | Needs verification | Verify route protection | Only managers can access schema page |
| Schema freshness | `database/schema.sql` | Draft | Schema file exists | Needs update process | Define how schema changes are reflected | Schema page stays current |

## Missing Work

- Define schema page behavior.
- Define schema source and update process.
- Verify route permission.
- Add acceptance criteria for schema freshness.

## Next Planned Work

1. Inspect `SchemaSpec.tsx`.
2. Inspect `database/schema.sql`.
3. Document schema page purpose and update workflow.

## Acceptance Criteria

- Schema route requires `users.manage`.
- Schema source is documented.
- Schema page behavior is documented.
- Schema freshness/update process is defined.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] Manual route permission verified
- [ ] Schema source verification completed

## Risks and Dependencies

- Schema page can expose internal database structure.
- Schema freshness can drift from migrations or manual schema edits.

## Definition of Done for This Feature

Schema spec view is done only when source, access control, display behavior, and freshness process are documented and verified.
