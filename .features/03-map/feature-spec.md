# Feature: Map and Geospatial Project View

## Goal

Render project/site map data with geospatial filters and safe rendering behavior.

## Status

Draft

## Route and Permission

- Route: `/map`
- Required permission: `map.view`
- Related API actions: `sites.map-data`, `sites.geo-filters`, `sites.regions`

## Files

### Frontend

- `src/pages/MapView.tsx`
- `src/components/ErrorBoundary.tsx`

### Backend

- `api/routes/sites.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Map page | `src/pages/MapView.tsx` | Draft | Page exists | Needs function-level spec | Document filters, map loading, and error behavior | Page behavior is fully specified |
| Map rendering | `src/pages/MapView.tsx` | Draft | ErrorBoundary wraps route | Needs edge-case spec | Define invalid coordinate handling | Invalid coordinates do not crash map |
| Site map data | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document response shape | UI consumes documented fields |
| Geo filters | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document province/municipality/district response | Filters render without undefined values |
| Region data | `api/routes/sites.php` | Draft | API action exists | Needs contract | Document region response | Region filter is stable |

## Missing Work

- Define map data response contract.
- Define empty-state and invalid-coordinate behavior.
- Add manual verification for route permission.
- Add tests for filter behavior if UI logic is complex.

## Next Planned Work

1. Inspect `MapView.tsx`.
2. Map every map control to API data.
3. Add acceptance criteria for invalid data and empty states.

## Acceptance Criteria

- Map route requires `map.view`.
- Map data loads safely.
- Invalid coordinates are handled without crashing.
- Empty data shows a clear empty state.
- Geo filters use documented API fields.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual route permission verified
- [ ] Manual map data verification completed

## Risks and Dependencies

- Depends on site coordinate quality.
- Depends on map library behavior and network availability.

## Definition of Done for This Feature

Map is done only when geospatial data, filters, empty states, and invalid-data behavior are documented and verified.
