# Feature: Project Milestones

## Goal

Manage project milestones (timeline tracking) and provide milestone data for the DICT Projects drill-down. Milestones are project-scoped progress markers with a status lifecycle.

## Domain Rule (applies here)

Milestones belong to **milestone-type** DICT projects (`project_id` → projects). They are per-project (and optionally per-site) progress markers — distinct from `dict_project_entries` (per-site accomplishment) and from Free WiFi daily logs. See [[project-activity-tracking-model]].

## Status

**Implemented** — backend (`api/routes/milestones.php`) is complete (list/get/create/update/delete with audit + FEAT-6 status-change notifications); frontend (`MilestonesPanel` in `DictProjects.tsx`) renders a timeline with create/edit/delete. This verification pass added `project_id` validation on create and a 404 guard on delete (for API consistency with `sites`), and corrected the stale spec. Automated checks green (`php -l` clean, tsc clean, 42/42 tests).

## Route and Permission

- No dedicated route — milestones render inside the DICT Projects drill-down (`/dict-projects`).
- API permission gates (`api/routes/milestones.php`):
  - `milestones.list` / `milestones.get` → authenticated (`AuthMiddleware::authenticate`)
  - `milestones.create` / `milestones.update` / `milestones.delete` → `milestones.manage`

## Files

### Frontend

- `src/pages/DictProjects.tsx` — `MilestonesPanel` (timeline + create/edit via `MilestoneFormModal`, delete). **The only consumer.**

### Backend

- `api/routes/milestones.php` — `milestones.list`, `milestones.get`, `milestones.create`, `milestones.update`, `milestones.delete`.

### Database

- `database/schema.sql` — `milestones` (project_id NOT NULL, site_id nullable, title, target_date, actual_date, `status ENUM('PENDING','IN_PROGRESS','COMPLETED','DELAYED')`, description). FK `project_id → projects(id) ON DELETE CASCADE`; `site_id → sites(id) ON DELETE SET NULL`.

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| List milestones | `milestones.php` | Implemented | `milestones.list`, optional `project_id` filter; joins site_code/location (+ project code/name when unfiltered); ordered by `target_date ASC` | No pagination (returns all for a project — fine, counts are small) | Consumers receive expected milestones |
| Get milestone | `milestones.php` | Implemented | `milestones.get` by id; joins site; 404 when missing | — | Detail consumers receive complete data |
| Create milestone | `milestones.php` | Implemented | `milestones.create` gated `milestones.manage`; validates project_id + title; **validates project exists** (fixed this pass); site_id nullable; status defaults PENDING | — | Invalid milestones rejected (400) |
| Update milestone | `milestones.php` | Implemented | `milestones.update` gated `milestones.manage`; allow-listed fields (title/target/actual/status/description/site_id); empty strings → null for dates/description/site_id; audit-logged (`milestone.update`); **FEAT-6**: auto-fires a broadcast notification on COMPLETED/DELAYED | — | Updates persist + audited; status change notifies |
| Delete milestone | `milestones.php` | Implemented | `milestones.delete` gated `milestones.manage`; **404 when missing** (fixed this pass); hard delete (safe — milestones are leaf nodes, nothing references them) | No audit on delete (codebase-wide) | Deletes are safe |
| Milestones panel (UI) | `DictProjects.tsx` | Implemented | Timeline with status-colored dots; Add/Edit form (title, target/actual date, status, description); delete with toast | No date format validation client-side | CRUD works end-to-end |

> **Spec correction:** the prior "Draft" claimed Dashboard and Reports consume milestone data. They do **not** — `milestones.*` is called only by `DictProjects.tsx`. Dashboard progress is derived from `projects.stats` / `dict_project_entries`, not milestones.

## Changes in This Sweep (Feature 08)

1. **`milestones.create` now validates `project_id`.** An unknown/invalid project previously tripped a SQL FK error → HTTP 500. Now resolves a numeric id or project code and returns a clean **400** when the project is unknown (mirrors the `sites.create` fix).
2. **`milestones.delete` now 404s on a missing milestone** instead of returning success for a no-op delete (mirrors `sites.delete`'s existence guard; milestones have no cascade risk since nothing references them).
3. **Spec corrected:** removed the inaccurate "Dashboard uses milestone data" / "Dashboard milestone progress" claims (milestones are consumed only by `DictProjects.tsx`).

## What Is Implemented

- Full CRUD with `milestones.manage` gating.
- Status lifecycle `PENDING → IN_PROGRESS → COMPLETED` (or `DELAYED`), matching the schema ENUM and the frontend dropdown.
- Audit on update (`milestone.update` with old/new diff, hash-chained).
- FEAT-6: status change to COMPLETED/DELAYED inserts a broadcast notification (`user_id = null`, valid — `notifications.user_id` is nullable).
- Timeline UI in the project drill-down.

## Known Gaps / Not Implemented

- **No audit on create/delete.** Consistent with the rest of the codebase (only `*.update` is audited, plus `projects.create`); raised for visibility.
- **`milestones.list` is unpaginated.** Acceptable today (milestones-per-project counts are small); revisit if volumes grow.
- **No date-range / status filters** on `milestones.list` beyond `project_id`.
- **No client-side date validation** in the form (e.g., actual_date before target_date isn't checked). Low severity.
- **Broadcast notifications go to `user_id = null`** (all users). Whether the notifications UI surfaces null-user broadcasts is a Feature 14 concern to confirm.

## Acceptance Criteria

- [x] Milestone CRUD behavior documented.
- [x] Status transitions documented (PENDING/IN_PROGRESS/COMPLETED/DELAYED, matching schema + UI).
- [x] Delete behavior is safe (leaf node; no cascade; 404 on missing).
- [x] Create rejects unknown `project_id` with a clean 400.
- [x] Dashboard/Reports consumption claim corrected (neither consumes milestones).

## Tests and Verification

- [x] `php -l api/routes/milestones.php` — no syntax errors.
- [x] `npx tsc --noEmit` — clean.
- [x] `npm test` — 42/42.
- [x] Spec-vs-code review: confirmed status ENUM match, FEAT-6 notification validity (nullable user_id), and the single consumer (DictProjects).
- [ ] Manual: create/edit/delete a milestone in the project drill-down; confirm status change to COMPLETED fires a notification (verify in Feature 14).

## Risks and Dependencies

- Milestone status feeds the FEAT-6 notification flow; a failed notification insert is caught and logged (never blocks the update).
- Deleting a milestone is safe (no dependents), but is unaudited and irreversible.
- Depends on Feature 05 (projects) for `project_id`; the notification path depends on the `notifications` table (Feature 14).

## Definition of Done for This Feature

Milestones are done only when CRUD, status rules, the consumer mapping, and delete safety are specified, implemented, and verified.
