# Feature: Free WiFi Daily Logs

## Goal

Manage Free WiFi daily logs, including list, create, update, delete, bulk import, summary, site logs, and export.

> **Domain note:** Free WiFi is the ONLY project type that uses daily logs (`free_wifi_daily_logs`). All other DICT projects use site mapping + activity entries (`dict_project_entries`) instead. See `[[project-activity-tracking-model]]`.

## Status

Implemented — CRUD (incl. delete UI) complete; lint + type-check pass; awaiting manual import/export + permission verification.

## Route and Permission

- Route: `/freewifi`
- Required permission: `logs.view`
- Related API actions: `logs.list`, `logs.get`, `logs.create`, `logs.update`, `logs.delete`, `logs.bulk-import`, `logs.daily-summary`, `logs.site-logs`, `logs.export`

## Files

### Frontend

- `src/pages/FreeWifi.tsx` — monitoring page: stats, 30-day trend, site table, detail modal (14-day per-site logs + delete), submit-log modal, import modal, export menu
- `src/components/SitePhotos.tsx` — embedded in detail modal

### Backend

- `api/routes/logs.php` — all `logs.*` actions

### Database

- `database/schema.sql` — `free_wifi_daily_logs`, view `vw_free_wifi_daily_summary`
- `database/seed.sql` / `seed-region2.sql` — FREEWIFI is seeded as `projects.id = 1`

## API Contracts

### `logs.list` — `GET`, paginated
Filters: `site_id`, `status`, `date_from`, `date_to`. Returns joined rows: log fields + `site_code`, `location_name`, `province`, `municipality`, `project_code`, `project_name`, `logged_by_name`. Ordered `log_date DESC, site_id`. (Currently unused by the UI — page is site-centric via `logs.site-logs`.)

### `logs.get` — `GET` (`id`)
Single log + site code/location + logger name. 404 if missing.

### `logs.create` — `POST`, perm `logs.create`
Body: `site_id` (required), `date`|`log_date`, `status` (default `UP`), `bandwidth_utilization`|`bandwidth`, `total_unique_users`|`users`, `remarks`. **Upsert** on `(site_id, log_date)`. Side effects: updates `sites.status` + `sites.last_updated`; emits notifications (DOWN alert; restored alert when previous log was DOWN). 201.

### `logs.update` — `PUT/PATCH` (`id`), perm `logs.edit`
Editable fields: `status`, `bandwidth_utilization`, `total_unique_users`, `remarks`. Audited via `AuditHelper`. (UI covers update through the create-upsert; dedicated edit endpoint remains for API consumers.)

### `logs.delete` — `DELETE` (`id`), perm `logs.edit`
Removes the log row. **Now exposed in the UI** (per-site log history → trash button, `logs.edit`-gated, with confirm + spinner).

### `logs.bulk-import` — `POST` (multipart `file`), perm `logs.bulk_import`
CSV columns (positional): `site_id, date, status, bandwidth, users, remarks`. Returns `{ imported, errors[] }` inside a transaction (rollback on hard failure; per-row errors collected).

### `logs.daily-summary` — `GET` (`days`, default 30)
Reads view `vw_free_wifi_daily_summary` → rows of `{ date, total_sites, up_count, down_count, partial_count, total_users, avg_bandwidth }`. (UI currently surfaces the 30-day trend via `dashboard.daily`; this endpoint is available for a dedicated FW summary.)

### `logs.site-logs` — `GET` (`site_id`, `days`)
All logs for a site within the window, `log_date DESC`. Powers the detail modal 14-day trend.

### `logs.export` — `GET`, perm `logs.export`, respects `site_id`/`date_from`/`date_to`/`status`
CSV columns: `Site ID, Site Code, Site Name, Province, Municipality, Project, Date, Status, Bandwidth Utilization %, Total Unique Users, Logged By, Remarks`.

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Free WiFi page | `src/pages/FreeWifi.tsx` | Implemented | Stats, trend, filters, sort, pagination, detail modal, submit/import/export | — | Manual verification | Every UI action has a backend mapping |
| List logs | `api/routes/logs.php` | Implemented | Contract documented | — | — | Page displays expected logs |
| Create log | `api/routes/logs.php` | Implemented | Upsert on site+date; status/notification side effects | — | — | Invalid records rejected clearly (site_id required) |
| Update log | `api/routes/logs.php` | Implemented | Dedicated endpoint + upsert path; audited | — | — | Updates persist correctly |
| Delete log | `api/routes/logs.php` + `FreeWifi.tsx` | Implemented | API + UI trash button (confirm, `logs.edit`-gated) | — | — | Deleted log removed safely |
| Bulk import | `api/routes/logs.php` + `FreeWifi.tsx` | Implemented | CSV columns documented; per-row errors; transactional | Optional: hide "Sites" option when user lacks `sites.import` | — | Import reports valid and invalid rows |
| Daily summary | `api/routes/logs.php` | Implemented | View-backed aggregation documented | UI uses `dashboard.daily` for the trend chart (acceptable) | — | Summary matches seeded data |
| Export | `api/routes/logs.php` + `FreeWifi.tsx` | Implemented | Logs + Sites export, columns documented | — | — | Export contains expected rows |

## Current Implementation Notes

- Route gated by `ProtectedRoute requiredPermission="logs.view"` (`App.tsx`).
- Page fetches FW sites via `sites.list { project_id: 1 }` (FREEWIFI is seeded as id 1 — reliable for the seeded DB).
- Buttons gated by permission: Import (`logs.bulk_import`), Export (`sites.export`), Submit Log (`logs.create`), Delete log (`logs.edit`).
- `logs.create` upsert means re-submitting for the same site+date updates the existing log (covers Create + Update in one flow).
- DOWN/restored notifications are emitted from `logs.create` and are best-effort (failures logged, never break the log response).
- Mock data (`dailySummaries`) is only a fallback for the trend chart if `dashboard.daily` fails.

## Missing Work

- ~~Expose delete-log in UI.~~ Done.
- ~~Fix `react-hooks/set-state-in-effect` lint error in `SiteDetailModal`.~~ Done.
- Optional: hide the "Sites" import option when the user lacks `sites.import`.
- Optional: switch the 30-day trend to `logs.daily-summary` for a FW-only series.

## Acceptance Criteria

- [x] Free WiFi route requires `logs.view`.
- [x] CRUD operations are specified (Create+Update via upsert, Read via list/site-logs, Delete via UI+API).
- [x] Bulk import validates rows (per-row errors, transactional).
- [x] Daily summary calculations are documented (view-backed).
- [x] Export format is documented.

## Tests and Verification

- [x] Frontend lint passes (0 errors; pre-existing `any` warnings remain)
- [x] TypeScript type-check passes (`tsc --noEmit`)
- [x] API syntax/static checks pass (existing `logs.php`)
- [ ] Import/export manual verification completed
- [ ] Permission verification completed (logs.view / logs.create / logs.edit / logs.bulk_import / logs.export)
- [ ] Manual: delete-log flow + DOWN/restored notifications

## Risks and Dependencies

- Bulk import can introduce malformed data (mitigated by per-row try/catch + transaction).
- Summary calculations depend on the `vw_free_wifi_daily_summary` view matching log data.
- `project_id: 1` hardcode assumes FREEWIFI is seeded first — fragile if seed order changes (use code `'fw'`/`'freewifi'` to be safe in future).

## Definition of Done for This Feature

Free WiFi logs are done only when CRUD, import, summary, and export behavior are specified and verified. Code + lint + types are complete; manual import/export and permission verification remain.
