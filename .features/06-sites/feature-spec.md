# Feature: Sites and Site Management

## Goal

Manage site records, map data, geo filters, regions, import, export, and relationships to projects, photos, logs, and entries.

## Status

Draft

## Route and Permission

- Route: site management is used across map, projects, reports, and photos
- Required permission: depends on consuming feature
- Related API actions: `sites.list`, `sites.get`, `sites.create`, `sites.update`, `sites.delete`, `sites.map-data`, `sites.import`, `sites.export`, `sites.geo-filters`, `sites.regions`

## Files

### Frontend

- `src/pages/MapView.tsx`
- `src/pages/Reports.tsx`
- `src/components/SitePhotos.tsx`

### Backend

- `api/routes/sites.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| List sites | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document filters and pagination | Consumers use expected fields |
| Get site | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document detail fields | Detail consumers receive complete data |
| Create site | `api/routes/sites.php` | Draft | API action exists | Needs validation spec | Define required fields | Invalid sites are rejected |
| Update site | `api/routes/sites.php` | Draft | API action exists | Needs validation spec | Define editable fields | Updates persist correctly |
| Delete site | `api/routes/sites.php` | Draft | API action exists | Needs dependency spec | Define blocking/cascade rules | Deletes are safe |
| Map data | `api/routes/sites.php` | Draft | API action exists | Needs map contract | Document coordinates and project fields | Map renders safely |
| Import sites | `api/routes/sites.php` | Draft | API action exists | Needs CSV spec | Define columns and row errors | Import reports valid/invalid rows |
| Export sites | `api/routes/sites.php` | Draft | API action exists | Needs export contract | Define columns and filters | Export contains expected rows |
| Geo filters | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document province/municipality/district response | Report/map filters render correctly |
| Regions | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document region response | Region selectors are stable |

## Missing Work

- Define site CSV import/export format.
- Define site coordinate validation.
- Define site delete dependency rules.
- Add function-level specs for all site API actions.

## Next Planned Work

1. Inspect `api/routes/sites.php`.
2. Define site data contract.
3. Add import/export validation criteria.

## Acceptance Criteria

- Site CRUD behavior is documented.
- Map data response is documented.
- Geo filter response is documented.
- Import/export formats are documented.
- Delete behavior is safe.

## Tests and Verification

- [ ] API syntax/static checks pass
- [ ] Import/export manual verification completed
- [ ] Map data verification completed
- [ ] Geo filter verification completed

## Risks and Dependencies

- Site data drives dashboard, reports, map, photos, and logs.
- Invalid coordinates can break map rendering.

## Definition of Done for This Feature

Sites are done only when CRUD, import/export, map data, and geo filter behavior are specified and verified.
