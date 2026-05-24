# DICT MRIS — Remaining Tasks & QA Report

> Last updated: 2026-05-24
> Status: **Full system audit + all features & bug fixes completed.** All 8 bugs resolved, all 6 FEAT tasks implemented, TypeScript compiles clean, and API verification tests pass.

---

## ✅ Completed Tasks (Verified via API & Integration Tests)

| # | Feature | Status |
|---|---------|--------|
| 1 | JWT Auth (login, me, logout, change-password) | ✅ Verified |
| 2 | Dashboard stats, trends, regional breakdown | ✅ Verified |
| 3 | Free WiFi Sites — list, filter, export, import | ✅ Verified |
| 4 | Free WiFi Logs — CRUD, bulk-import, export | ✅ Verified |
| 5 | DICT Projects — list, create, update, delete, stats | ✅ Verified |
| 6 | Milestones — CRUD with modal form | ✅ Verified |
| 7 | Accomplishment Entries — CRUD | ✅ Verified |
| 8 | Sites — list, get, create, update, delete, map-data, import, export | ✅ Verified |
| 9 | Users — list, get, create, update, delete | ✅ Verified |
| 10 | Roles & Permissions — list, get, update | ✅ Verified |
| 11 | Audit Trail — list with filters | ✅ Verified |
| 12 | Reports — list, generate (CSV/JSON), download, delete | ✅ Verified |
| 13 | Notifications — list, mark-read, mark-all-read, delete, unread-count | ✅ Verified |
| 14 | Profile page with password change | ✅ Done |
| 15 | Map View with Leaflet + clustering | ✅ Done |
| 16 | Toast notification system | ✅ Done |
| 17 | Schema Spec viewer page | ✅ Done |
| 18 | FEAT-1: Free WiFi site detail real log history integration | ✅ Verified |
| 19 | FEAT-2: Assign project access rights (UI + API) | ✅ Verified |
| 20 | FEAT-3: CSV column mapping fixes and weekly/monthly report types | ✅ Verified |
| 21 | FEAT-4: Free WiFi large batch loading (pagination limits raised) | ✅ Verified |
| 22 | FEAT-5: Dashboard Recent Activity Feed (Audit Log) | ✅ Verified |
| 23 | FEAT-6: Auto-generate notifications on key events | ✅ Verified |

---

## 🐛 QA Issues Found & Resolved

### ~~BUG-1~~: ✅ FIXED — `sites.list` with `project_id='fw'` returned 0 results
- **Fix:** `FreeWifi.tsx` now passes `project_id: 1` (numeric). `sites.php` now resolves string codes to numeric IDs via `SELECT id FROM projects WHERE LOWER(code) = ?`.

### ~~BUG-2~~: ✅ FIXED — FreeWifi 30-day trend chart used static mock data
- **Fix:** `FreeWifi.tsx` fetches `dashboard.daily` on mount and stores real data in `trendData` state.

### ~~BUG-3~~: ✅ FIXED — Site Detail Modal used `generateDailyLogs()` mock generator
- **Fix:** `SiteDetailModal` fetches logs from the backend and displays them in the Recharts bar chart.

### ~~BUG-4~~: ✅ FIXED — `sites.list` only loaded 20 sites (pagination default)
- **Fix:** Raised per_page parameter and increased the cap in `sites.php` from 100 to 2000.

### ~~BUG-5~~: ✅ FIXED — Report CSV had fragile column mapping
- **Fix:** `reports.php` uses explicit `$columnMaps` per report type to match header keys to database fields.

### ~~BUG-6~~: ✅ FIXED — `notifications.mark-read` failed on broadcast notifications
- **Fix:** `notifications.php` uses `WHERE id = ? AND (user_id = ? OR user_id IS NULL)` for updating read states.

### ~~BUG-7~~: ✅ FIXED — 401 handler in `api.ts` left `mris_user` in localStorage
- **Fix:** Cleaned up localStorage keys and session storage on 401.

### ~~BUG-8~~: ✅ FIXED — `sites.php` pagination cap insufficient for large deployments
- **Fix:** Raised the cap from 100 to 2000 in `api/routes/sites.php` to handle all 1,800+ Free WiFi sites.

---

## 📋 Medium/Low Priority Features Built

### ~~FEAT-1~~: ✅ DONE — FreeWifi Site Detail Real Log History
- **Fix:** Connected `SiteDetailModal` to `logs.site-logs` endpoint with a 14-day window limit.

### ~~FEAT-2~~: ✅ DONE — User Project Access Management
- **Fix:** Created the `ProjectAccessModal` component in `Users.tsx` allowing administrators to modify users' access levels (none/view/edit/admin) per project. Integrated with `users.project-access.get` and `users.project-access.update` backend routes.

### ~~FEAT-3~~: ✅ DONE — Fix CSV Column Mapping & Implement Weekly/Monthly Report Types
- **Fix:** Added SQL data aggregate logic and `$columnMaps` for `weekly_summary` and `monthly_accomplishment` reports in `api/routes/reports.php`. Corrected milestone column aliases from `due_date` and `completed_date` to `target_date` and `actual_date` to prevent queries from crashing.

### ~~FEAT-4~~: ✅ DONE — Free WiFi Pagination limit
- **Fix:** Set `{ per_page: 2000 }` on sites fetch in both `FreeWifi.tsx` and `DictProjects.tsx`.

### ~~FEAT-5~~: ✅ DONE — Dashboard "Recent Activity" Feed
- **Fix:** Loaded the latest 8 entries from the audit logs and displayed them in a clean activity feed at the bottom of the Dashboard.

### ~~FEAT-6~~: ✅ DONE — Auto-generate notifications on key events
- **Fix:** Added notifications insert hooks in `api/routes/logs.php` (on DOWN status or DOWN to UP restoration) and `api/routes/milestones.php` (on COMPLETED or DELAYED updates).

---

## 🔒 Security QA Status

### SEC-1: CORS allows all origins
- **Risk:** Medium — Scoped to `*` for local dev. Recommended to scope to domain before production.

### SEC-2: display_errors config
- **Risk:** Low — `display_errors` is off (handled via WAMP logs).

### SEC-3: JWT Secret
- **Risk:** High — Currently hardcoded in helper. Must be loaded via environment file `.env` on VPS.

---

## 🧪 QA Test Matrix

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | POST `auth.login` with valid credentials | HTTP 200, token returned | ✅ PASS |
| 2 | POST `auth.login` with wrong password | HTTP 401 | ✅ PASS |
| 3 | GET `auth.me` with valid Bearer token | HTTP 200, user data | ✅ PASS |
| 4 | GET `auth.me` without token | HTTP 401 | ✅ PASS |
| 5 | GET `dashboard.stats` | HTTP 200, fw/dict keys | ✅ PASS |
| 6 | GET `dashboard.daily` | HTTP 200, array of log summaries | ✅ PASS |
| 7 | GET `dashboard.regional` | HTTP 200 | ✅ PASS |
| 8 | GET `projects.list` | HTTP 200 | ✅ PASS |
| 9 | GET `projects.stats` | HTTP 200 | ✅ PASS |
| 10 | GET `sites.list` | HTTP 200 (paginated) | ✅ PASS |
| 11 | GET `sites.map-data` | HTTP 200 | ✅ PASS |
| 12 | GET `milestones.list?project_id=1` | HTTP 200 | ✅ PASS |
| 13 | GET `logs.list` | HTTP 200 | ✅ PASS |
| 14 | GET `audit.list` | HTTP 200 | ✅ PASS |
| 15 | GET `users.list` | HTTP 200 | ✅ PASS |
| 16 | GET `roles.list` | HTTP 200 | ✅ PASS |
| 17 | GET `reports.list` | HTTP 200 | ✅ PASS |
| 18 | GET `notifications.list` | HTTP 200 | ✅ PASS |
| 19 | GET `notifications.unread-count` | HTTP 200, count=0 | ✅ PASS |
| 20 | GET `permissions.list` | HTTP 200 | ✅ PASS |
| 21 | GET unknown action | HTTP 404 | ✅ PASS |
| 22 | FreeWifi page loads with sites from API | Works — 30 sites loaded | ✅ PASS |
| 23 | FreeWifi 30-day chart uses real data | Trend data loads successfully | ✅ PASS |
| 24 | Site detail modal shows real log history | Call to `logs.site-logs` returns logs | ✅ PASS |
| 25 | DictProjects loads all project sites | All sites listed properly | ✅ PASS |
| 26 | Report CSV download has correct columns | Correct mappings generated | ✅ PASS |
| 27 | Mark-read on broadcast notification | User ID matching success | ✅ PASS |
| 28 | JWT 401 clears all localStorage keys | Token + user cleared from browser | ✅ PASS |
| 29 | GET `logs.site-logs` for 14 days | HTTP 200, 14-day history array | ✅ PASS |
| 30 | GET `users.project-access.get` | HTTP 200, user's projects list | ✅ PASS |
| 31 | PUT `users.project-access.update` | HTTP 200, updates saved to DB | ✅ PASS |
| 32 | GET `reports.generate` (weekly_summary) | HTTP 200, groups by year/week | ✅ PASS |
| 33 | GET `reports.generate` (monthly_accomplishment) | HTTP 200, joins milestone progress | ✅ PASS |

---

## 🏗️ Pre-Deployment Checklist (Hostinger VPS)

- [ ] Move JWT secret to environment variable / `.env`
- [ ] Set `CORS` origin to production domain only
- [ ] Set `display_errors = Off` in `php.ini` / `.htaccess`
- [ ] Run `npm run build` and deploy `dist/` files
- [ ] Update `vite.config.ts` `base` path for subdirectory if needed
- [ ] Import `database/schema.sql` into production MySQL
- [ ] Run password-fix script on production DB
- [ ] Set proper file permissions on `api/uploads/`
- [ ] Test all API endpoints from production domain
- [ ] Verify HTTPS redirect is in place
