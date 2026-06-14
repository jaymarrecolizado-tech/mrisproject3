# Feature: DICT Projects

## Goal

Manage DICT projects and provide project data for reports, dashboard, map, entries, milestones, and site relationships.

## Status

**Implemented** — automated checks green (tsc clean, 42/42 tests, `DictProjects.tsx` 0 lint errors, PHP syntax clean). Manual CRUD + permission verification still pending (see Tests and Verification).

## Domain Rule (applies here)

Free WiFi is the ONLY project with daily logs (`free_wifi_daily_logs`). All other DICT projects use **site mapping + multi-per-site activity entries** (`dict_project_entries`), where activities can be re-conducted at the same site. This feature (DICT Projects) is the project container; sites live in Feature 06 and entries in Feature 09.

**Compliance:** `DictProjects.tsx` tracks accomplishment exclusively via `dict_project_entries` (`entries.list`, `entries.create`) and sites (`sites.list`) — it never touches `free_wifi_daily_logs`. ✅ Matches the domain rule.

## Route and Permission

- Route: `/dict-projects`
- Route guard: `projects.view` (in `AppRoot.tsx` via `ProtectedRoute`)
- API permission gates:
  - `projects.list` / `projects.get` / `projects.stats` → authenticated (`AuthMiddleware::authenticate`)
  - `projects.create` / `projects.delete` → `projects.manage`
  - `projects.update` → `projects.edit`

## Files

### Frontend

- `src/pages/DictProjects.tsx` — project list (cards) + project drill-down (accomplishment chart, milestones panel, sites table, site-detail modal with overview/entries/photos tabs, add-entry modal)

### Backend

- `api/routes/projects.php` — `projects.list`, `projects.get`, `projects.create`, `projects.update`, `projects.delete`, `projects.stats`

### Database

- `database/schema.sql` — `projects` (type ENUM `'daily' | 'milestone'`), `dict_project_entries`, `sites`, `milestones`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Projects list (cards) | `DictProjects.tsx` | Implemented | Cards show name/full_name/completion % + 4 accomplishment counts; data from `projects.list`; mock fallback when API empty | — | Cards render real `completion_rate` + entry counts on real DB |
| Accomplishment chart | `DictProjects.tsx` | Implemented | Bar chart of sites by operational status (UP/PARTIAL/DOWN/PENDING/DECOMMISSIONED) | — | Chart shows real site-status distribution |
| Milestones panel | `DictProjects.tsx` | Implemented | List/create/edit/delete milestones per project (`milestones.*`) | — | Milestone CRUD persists |
| Sites table | `DictProjects.tsx` | Implemented | Search, status filter (site operational statuses), sort, pagination | — | Filter/search match site vocabulary |
| Site detail modal | `DictProjects.tsx` | Implemented | Overview / Entries (`entries.list`) / Photos (SitePhotos) tabs; add entry | — | Entries load per site+project |
| Add entry | `DictProjects.tsx` | Implemented | `entries.create` with optional site (general project entry or site-specific) | — | Entries persist and are re-conductable at same site |
| List projects | `projects.php` | Implemented | Returns `p.*` + `total_sites`, `active_sites`, `down_sites`, `completion_rate`, and entry-status counts (`completed/ongoing/planned/delayed_entries`) | — | Response includes accomplishment metrics |
| Get project | `projects.php` | Implemented | `SELECT * FROM projects WHERE id=?` | Not called by frontend | Detail contract documented |
| Create project | `projects.php` | Implemented | Validates `code`+`name`; inserts; audits `project.create` | **No frontend UI** to create projects | Invalid input rejected (400) |
| Update project | `projects.php` | Implemented | Allow-listed field update; audit diff via `AuditHelper` | **No frontend UI** to edit projects | Updates persist + audited |
| Delete project | `projects.php` | Implemented | **Soft delete** (`is_active = 0`); gated by `projects.manage` | No hard-delete/cascade; no UI | Deactivation is safe (no cascade) |
| Project stats | `projects.php` | Implemented | `total_sites`, `up_sites`, `down_sites`, `completion_rate` (AVG of entry accomplishment) | — | Stats match DB state |

## What Is Implemented

- Project list with accomplishment cards (completion % + entry-status counts).
- Project drill-down: site-status bar chart, milestones panel (CRUD), sites table (search/filter/sort/paginate).
- Site detail modal with Overview / Entries / Photos tabs; accomplishment entries are multi-per-site and re-conductable (site optional).
- Backend CRUD (`list/get/create/update/delete/stats`) with per-action permission gates and audit logging.
- `completion_rate` derived from `AVG(accomplishment_percent)` of `dict_project_entries` (domain-correct for DICT projects).

## Known Gaps / Not Implemented

- **No project-level create/edit/deactivate UI.** The API supports full project CRUD, but the frontend is read-only at the project level (list + drill-down only). Projects are presumably seeded/configured rather than user-created. Add UI if business needs in-project project management.
- **`projects.get` is unused** by the frontend (drill-down uses already-loaded list data).
- `Site.status` type union in `src/types/index.ts` is over-broad (still lists entry statuses `COMPLETED/ONGOING/PLANNED` alongside real site statuses). Functionally harmless; a future type-cleanup could narrow it to the schema's `UP/DOWN/PARTIAL/PENDING/DECOMMISSIONED`.
- No dedicated unit/component tests for `DictProjects.tsx` (verification is manual + type/lint gates).

## Changes in This Sweep (Feature 05)

1. **Status-vocabulary bug fix** — the chart, status filter dropdown, and `StatusBadge` previously rendered *sites* using the *entry-status* vocabulary (`COMPLETED/ONGOING/PLANNED/PENDING`), which sites never have. On real data the chart was all-zero, the filter found nothing, and badges fell back to gray. Now all three use the real site operational statuses (`UP/PARTIAL/DOWN/PENDING/DECOMMISSIONED`). `StatusBadge` also handles entry statuses (`COMPLETED/ONGOING/PLANNED/DELAYED`) for the entries list.
2. **Card data bug fix** — `projects.list` now returns `completion_rate` and per-project entry-status counts; the cards were previously reading undefined fields (`p.completion_rate` → "undefined%"). `ProjectWithStats` fields renamed `*_sites` → `*_entries` to honestly reflect that these are accomplishment-entry counts, not site counts.
3. **Lint fixes** — removed two synchronous `setLoading*(true)` calls flagged by `react-hooks` (cascading-render smell), matching the working main-effect pattern (loading initializes `true`; set `false` only in the async callback).
4. **Type fix** — added `DECOMMISSIONED` to `Site.status` union (`src/types/index.ts`) to match the schema.

## Acceptance Criteria

- [x] Projects route requires `projects.view`.
- [x] Project CRUD + stats behavior documented and present.
- [x] Delete is safe (soft delete; no cascade to sites/entries/milestones).
- [x] Domain rule honored (entries, not daily logs).
- [x] Automated checks green (tsc, lint for this file, tests, PHP syntax).
- [ ] Manual project CRUD verification completed.
- [ ] Manual permission verification completed (view vs manage/edit).

## Tests and Verification

- [x] `npx tsc --noEmit` — clean
- [x] `npm test` — 42/42 (no Feature-05-specific tests; covered by existing suite)
- [x] `npm run lint` — `DictProjects.tsx` has **0 errors** (7 `no-explicit-any` warnings, acceptable)
- [x] `php -l api/routes/projects.php` — no syntax errors
- [ ] Manual: project list renders real completion % + counts; drill-down chart shows site-status distribution; milestone CRUD; site detail entries tab; add-entry flow.
- [ ] Manual: non-permitted user cannot reach route/actions.

## Risks and Dependencies

- Project deactivation (soft delete) leaves related sites/entries/milestones intact but orphaned from an inactive project (by design).
- Reports / dashboard / map consume project data; the `projects.list` change is additive (new fields only) so existing consumers are unaffected.
- Depends on Feature 06 (sites), 07 (photos), 08 (milestones), 09 (entries) APIs.

## Definition of Done for This Feature

Projects are done only when CRUD, stats, relationships, delete safety, and the domain rule (entries, not daily logs) are specified, implemented, and verified — including manual CRUD + permission checks.
