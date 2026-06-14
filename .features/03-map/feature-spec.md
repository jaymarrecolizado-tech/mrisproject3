# Feature: Map and Geospatial Project View

## Goal

Render project/site map data with geospatial filters and safe rendering behavior.

## Status

Implemented — empty-state bug fixed; lint + type-check pass; awaiting manual route verification.

## Route and Permission

- Route: `/map`
- Required permission: `map.view`
- Public access: No (authenticated + `map.view`)
- Related API actions: `sites.map-data`, `sites.geo-filters`, `sites.regions`

## Files

### Frontend

- `src/pages/MapView.tsx` — map page, filters, clustering, detail panel, empty state
- `src/components/ErrorBoundary.tsx` — wraps the route; map-specific message configured in `App.tsx`
- `src/App.tsx` — route registration + `map.view` guard + `ErrorBoundary` wrap

### Backend

- `api/routes/sites.php` — `sites.map-data`, `sites.geo-filters`, `sites.regions`

### Database

- `database/schema.sql` — `sites` (latitude/longitude), `projects`, `provinces` (region lookup)

## API Contracts

### `sites.map-data` — `GET`

Query params: `project_id`, `status`, `region`.

Returns `{ success: true, data: Site[] }` where each item has:

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `site_code`, `location_name`, `site_name` | int/string | identity |
| `province`, `municipality`, `island_group`, `site_type` | string | geography |
| `latitude`, `longitude` | float | **always non-null** (NULL rows filtered out server-side) |
| `status`, `isp_provider`, `bw_download` | string/number | telemetry |
| `project_id`, `project_code`, `project_name`, `project_color` | mixed | joined from `projects` |

### `sites.geo-filters` — `GET`

Query params: `project_id` (id or code, optional).

Returns `{ success: true, data: { provinces: string[], municipalities: [{municipality, province}], districts: [{district, province}] } }`.

### `sites.regions` — `GET`

Returns `{ success: true, data: [{ region: string }] }` (distinct regions from `provinces`).

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Map page | `src/pages/MapView.tsx` | Implemented | Page renders; project/region/status filters; clustering; detail panel | — | Manual browser verification | Page behavior is fully specified |
| Map rendering | `src/pages/MapView.tsx` + `App.tsx` | Implemented | `ErrorBoundary` wraps route with map message | — | — | Invalid coordinates do not crash map |
| Empty state | `src/pages/MapView.tsx` | Implemented | Real empty load shows "No sites to display" overlay; mock data only used on API failure | — | — | Empty data shows a clear empty state |
| Invalid coordinate handling | `src/pages/MapView.tsx` | Implemented | FE filters non-finite lat/lng; BE filters NULL lat/lng | — | — | Invalid coordinates excluded without crash |
| Site map data | `api/routes/sites.php` | Implemented | Contract documented above | — | — | UI consumes documented fields |
| Geo filters | `api/routes/sites.php` | Implemented | `sites.geo-filters` returns provinces/municipalities/districts | UI currently uses region filter only; province/muni/district filters not yet wired into the page | Optional enhancement: add province/municipality/district dropdowns driven by `sites.geo-filters` | Filters render without undefined values |
| Region data | `api/routes/sites.php` | Implemented | `sites.regions` powers the Region dropdown | — | — | Region filter is stable |

## Current Implementation Notes

- Route is gated by `ProtectedRoute requiredPermission="map.view"` and wrapped in `ErrorBoundary` with a map-specific title/message (`App.tsx`).
- Map tiles switch between OpenStreetMap (light) and CARTO dark via `useDarkMode`.
- Clustering uses `react-leaflet-cluster`; cluster icon colored by dominant project.
- `loadFailed` flag distinguishes a successful-but-empty load (show real empty state) from an API failure (fall back to dev/mock data so the page is still demoable).
- Invalid coordinates are rejected in two places: backend (`latitude IS NOT NULL AND longitude IS NOT NULL`) and frontend (`Number.isFinite` guard in `filteredSites`).

## Missing Work

- ~~Define map data response contract.~~ Done (see API Contracts).
- ~~Define empty-state and invalid-coordinate behavior.~~ Done (implemented + documented).
- Add manual verification for route permission.
- (Optional enhancement) Wire province/municipality/district filters from `sites.geo-filters` into the filter panel.

## Next Planned Work

1. Manual browser verification of `/map` (permission, empty state, invalid coords).
2. Optional: add province/municipality/district dropdowns.

## Acceptance Criteria

- [x] Map route requires `map.view`.
- [x] Map data loads safely.
- [x] Invalid coordinates are handled without crashing.
- [x] Empty data shows a clear empty state.
- [x] Geo filters use documented API fields (region filter via `sites.regions`).

## Tests and Verification

- [x] Frontend lint passes (0 errors; pre-existing `any` warnings remain)
- [x] TypeScript type-check passes (`tsc --noEmit`)
- [x] API syntax/static checks pass (existing `sites.php`)
- [ ] Manual route permission verified
- [ ] Manual map data verification completed
- [ ] Optional unit test for empty-state / invalid-coordinate filtering

## Risks and Dependencies

- Depends on site coordinate quality (NULL/non-finite coordinates are filtered out).
- Depends on map library behavior and network availability (tile + CDN marker icon).
- Marker default icon is loaded from `unpkg.com` CDN; offline builds may need a bundled icon.

## Definition of Done for This Feature

Map is done only when geospatial data, filters, empty states, and invalid-data behavior are documented and verified. Code + lint + types are complete; manual browser verification and user acceptance remain.
