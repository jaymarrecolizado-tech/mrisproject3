# Feature: Sites and Site Management

## Goal

Manage site records, map data, geo filters, regions, import, and export. Sites are the backbone: they carry operational status, coordinates, and relationships to projects, photos, free-WiFi daily logs, status events, entries, and milestones.

## Domain Rule (applies here)

Free WiFi is the ONLY project whose **daily activity** is tracked via `free_wifi_daily_logs`. All other DICT projects track accomplishment via `dict_project_entries` (per-site, re-conductable). **Sites themselves are shared** — a Free WiFi site and a milestone-project site are the same kind of record in the `sites` table; only the activity-tracking table differs. See [[project-activity-tracking-model]].

## Status

**Implemented** — backend (`api/routes/sites.php`) is substantially complete (list w/ filters + pagination, get, create, update, hardened delete, map-data, CSV import/export, geo-filters, regions). This verification pass: hardened `sites.delete`, made `sites.create` validate `project_id`, rewrote `sites.import` to be header-aware (export now round-trips), and rewrote this spec from a stale "Draft". Automated checks green (`php -l` clean). The one remaining check is a live manual import round-trip against the DB; frontend has no standalone `/sites` route and no CRUD UI (see Known Gaps).

## Route and Permission

- No dedicated route — sites surface inside Map (`/map`), DICT Projects (`/dict-projects`), Free WiFi (`/freewifi`), and Reports (`/reports`).
- `AppRoot.tsx` has **no `/sites` route** (confirmed).
- API permission gates (`api/routes/sites.php`):
  - `sites.list` / `sites.get` / `sites.map-data` / `sites.geo-filters` / `sites.regions` → authenticated (`AuthMiddleware::authenticate`)
  - `sites.create` / `sites.delete` → `sites.manage`
  - `sites.update` → `sites.edit`
  - `sites.export` → `sites.export`
  - `sites.import` → `sites.import`

## Files

### Frontend

- `src/pages/MapView.tsx` — `sites.map-data`, `sites.regions`
- `src/pages/Reports.tsx` — `sites.geo-filters`, `sites.export`
- `src/pages/FreeWifi.tsx` — `sites.export`, `sites.import` (import modal; toggles between `logs.bulk-import` and `sites.import`)
- `src/pages/DictProjects.tsx` — `sites.list` (per_page 2000) for the project sites table + site-detail modal
- `src/components/SitePhotos.tsx` — photos keyed off `site_id`

### Backend

- `api/routes/sites.php` — all site actions

### Database

- `database/schema.sql` — `sites` (status ENUM `UP/DOWN/PARTIAL/PENDING/DECOMMISSIONED`); FK `project_id → projects(id) ON DELETE CASCADE`. No `is_active` column (soft-delete not supported without a migration).

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| List sites | `sites.php` | Implemented | `sites.list` paginated; filters `project_id` (resolves non-numeric project codes like `fw`→id), `status`, `province` (LIKE), `island_group`, `region` (via `provinces`), `search` (code/location/name/municipality); joins project code/name/color; `per_page` clamped 10–2000 | Project-code filter is a side-feature, not advertised | Consumers receive expected fields; filters/pagination correct |
| Get site | `sites.php` | Implemented | `sites.get` returns `s.*` + project code/name/color/**type**; 404 when missing | — | Detail consumers receive complete data |
| Create site | `sites.php` | Implemented | `sites.create` validates `project_id` + `site_code` required; **resolves + validates `project_id`** (numeric id or code, 400 on unknown — fixed this pass); defaults status `PENDING`; gated `sites.manage` | **No frontend UI** | Invalid sites rejected (400) |
| Update site | `sites.php` | Implemented | `sites.update` allow-listed fields incl. `nationwide_id`; audit-logged via `AuditHelper` (`site.update`); gated `sites.edit` | **No frontend UI** | Updates persist + audited |
| Delete site | `sites.php` | Implemented | `sites.delete` gated `sites.manage`; **hardened this pass**: 404 when missing, 409 when dependents exist | **No frontend UI** | Deletes are safe (no silent cascade loss) |
| Map data | `sites.php` | Implemented | `sites.map-data` returns id/code/location/name/province/muni/coords/status/isp/bw/island/type + project fields; filters `project_id`/`status`/`region`; drops rows with null coords | — | Map renders safely |
| Import sites | `sites.php` | Implemented | `sites.import` (CSV, `sites.import` gated); **header-aware** (maps columns by name — fixed this pass); resolves project by id or code; upserts on `(project_id, site_code)`; transactional; per-row error collection; returns `{imported, updated, errors}` | Live round-trip not yet manually tested | Import reports valid/invalid rows; export round-trips |
| Export sites | `sites.php` | Implemented | `sites.export` CSV (`sites.export` gated); streams to `php://output`; 15 columns | No filter params (always all sites) | Export contains expected rows |
| Geo filters | `sites.php` | Implemented | `sites.geo-filters` returns distinct provinces/municipalities (+province)/districts (+province); optional project_id/code filter | — | Report/map filters render correctly |
| Regions | `sites.php` | Implemented | `sites.regions` distinct regions from `provinces` | — | Region selectors stable |

## Changes in This Sweep (Feature 06)

1. **Hardened `sites.delete` (the real bug).** It was an unguarded hard delete: deleting a site CASCADE-destroyed `free_wifi_daily_logs`, `site_status_events`, and `site_photos`, and SET-NULLed `dict_project_entries`/`milestones` — irreversible loss of operational history, and it wasn't even audit-logged (delete isn't audited anywhere in the codebase). Now: returns **404** if the site doesn't exist, and **409** if the site still has any daily logs / entries / photos / status events (lists the counts), so history can never vanish by accident. Only empty sites can be removed. Soft-delete was not an option — the `sites` table has no `is_active` column — so guard-instead-of-cascade is the safe, migration-free fix.
2. **Spec rewritten** from stale "Draft" to reflect the substantially-implemented backend and to record the contract.
3. **`sites.create` now validates `project_id`.** Previously an unknown/invalid `project_id` tripped a SQL foreign-key error and surfaced as HTTP 500. Now it resolves a numeric id or a project code (mirroring `sites.list`) and returns a clean **400** when the project is unknown.
4. **`sites.import` is now header-aware (export round-trips).** The importer previously read columns positionally (col 0 = `project_id`, col 1 = `site_code`, …), but `sites.export` emits `[ID, Project Code, Site Code, Location, …]` — so re-importing an export shifted every column and resolved the project from the wrong cell. Now it reads the header row, maps each column by normalized name (tolerating `Site Code`/`site_code`/`sitecode`, `Bandwidth`/`bw_download`, etc.), ignores the exported `ID` column, resolves the project from a `project_id` or `project code` column, and **upserts** on `(project_id, site_code)` so re-importing an export updates existing rows instead of creating duplicates. Response now includes `{imported, updated, errors}`.

## What Is Implemented

- Full read paths: filtered/paginated list, detail (with project type), map data (null-coords excluded), geo-filters, regions.
- CRUD: create (with required-field **and project-existence** validation), update (allow-listed + audited), delete (dependency-guarded).
- CSV export (streamed) and import (header-aware, transactional, per-row error reporting, upserts).
- `project_id` accepted as a **code** (e.g. `fw`) — resolved to the numeric id — in `sites.list`, `sites.create`, and `sites.import`.

## Known Gaps / Not Implemented

- **No sites CRUD UI.** `create`/`update`/`delete` actions exist but no frontend screen calls them — sites are created via import or seeded. (Update flows partially exist: e.g. Free WiFi log editing touches log rows, not the site record itself.)
- **No audit on create/delete.** Consistent with the rest of the codebase (only `*.update` is audited, plus `projects.create`); not a site-specific gap. Raising here for visibility.
- **`sites.delete` is a hard delete.** Now dependency-guarded, but there's no audit trail that a site was deleted (delete isn't logged anywhere) and no soft-delete/restore path.
- **Import doesn't validate ENUM values** (`status`, `island_group`). A row with an out-of-ENUM value will fail at insert time and be reported as a per-row error (caught by the row-level try/catch), not pre-validated. Acceptable; noted for future hardening.

## Acceptance Criteria

- [x] Site CRUD behavior documented.
- [x] Map data response documented.
- [x] Geo filter response documented.
- [x] Import/export formats documented and aligned (export round-trips through import).
- [x] Delete behavior is safe (guard prevents cascade data loss).
- [x] Create rejects unknown `project_id` with a clean 400.

## Tests and Verification

- [x] `php -l api/routes/sites.php` — no syntax errors.
- [x] Spec-vs-code review of all 10 actions; function map reflects real implementation.
- [x] Delete hardening: 404 (missing) and 409 (has dependents) paths added and reasoned through against schema FKs.
- [x] Create validation: unknown `project_id` → 400 (numeric id or code resolution).
- [x] Import rewrite: header mapping, project resolution, upsert logic reviewed; `php -l` clean.
- [ ] Manual: import round-trip against a live DB (export → import → confirm upsert/update, no column shift). Code is header-aware and syntax-clean; this is the one remaining live check.
- [ ] Manual: map-data / geo-filters / regions render (covered when Features 03 Map and 10 Reports are verified).

## Risks and Dependencies

- Site data drives dashboard, reports, map, photos, logs, entries, milestones — `sites.list`/`map-data` changes ripple widely.
- Invalid coordinates are excluded from `map-data` (NULL coord guard), so they can't break the map.
- Hard delete is now guarded, but a determined `sites.manage` user can still delete an *empty* site with no audit record.
- Depends on Feature 03 (map), 04 (free wifi), 05 (projects), 07 (photos), 09 (entries) consumers.

## Definition of Done for This Feature

Sites are done only when CRUD, import/export, map data, and geo filter behavior are specified, implemented, and verified — including a decision on the export/import format and (optionally) a sites CRUD UI.
