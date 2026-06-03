# DICT MRIS — Audit Findings

**Project:** `C:\wamp64\www\Projects\projecttracking3` (DICT MRIS v3)
**Audit Date:** 2026-06-02
**Last Verified:** 2026-06-02 (spot-checks performed on `AuthMiddleware::optional()`, `JWT.php` fallback, `.env`, `.htaccess`, `cron/generate_reports.php`, `Database::insert()`, and `package.json`)
**Scope:** Missing features + broken/non-functional existing features
**Method:** Static review of frontend (React 19 + Vite + TS), backend (PHP/PDO), DB schema, env, cron, and security posture. **No runtime tests executed.**

---

## 0. TL;DR — Status vs. Existing Docs

| Source | Claim | Reality |
|---|---|---|
| `remaining.md` (2026-05-24) | "Full system audit + all features & bug fixes completed." 8 bugs resolved, 6 FEAT tasks, TS clean. | Most listed features ARE implemented. However, several confirmed bugs and missing features remain (this report). |
| `audit-report/audit-report.md` (2026-06-01) | Feature coverage good; **zero automated tests**; multiple HIGH/Critical risks. | Confirmed — see §3 and §6 below. |
| `package.json` scripts | `lint` / `typecheck` / `test` — **not present**. | No test runner, linter, or typecheck script defined. |

**Verdict:** The codebase is *functionally rich* but has **production-blocking security gaps**, **silent data-handling bugs**, and **zero automated test coverage**. Do not deploy as-is.

**Verification Notes (2026-06-03):**
- `AuthMiddleware::optional()` is patched.
- `JWT::$secret` hardcoded fallback removed; `JWT::setSecret()` throws on empty/default; `api/index.php` exits 500 if `JWT_SECRET` missing. **S-1 closed.**
- `CORS_ORIGIN` no longer defaults to `*`; wildcard is rejected at 500 with explicit error. `api/.env` supplies explicit localhost origins for dev. **S-5 closed.**
- `.htaccess` includes HTTPS redirect + security headers + CSP. **S-4/S-8 closed.**
- `cron/generate_reports.php` emits CSV report files. **M-6 closed.**
- Print stylesheet for reports present in `src/index.css` (`@media print` + `.no-print`). **§3.10 closed.**
- `Database::insert()` JSON-encodes array values. **§3.5 closed.**
- `users` table includes `token_version`; `auth.change-password` rotates it; `auth.login`/`auth.refresh` embed it; `AuthMiddleware::authenticate()` rejects mismatched versions. **M-15 closed.**
- `PasswordValidator` added and wired into `auth.change-password`, `users.create`, and `users.update`. **S-11 closed.**
- `seed-region2.sql` broken blocks converted to valid multi-row `VALUES` using `site_code` subqueries. **§3.11 closed.**

---

## 1. Verified Working Features

### 1.1 Backend API (PHP)

| Feature | Location | Status |
|---|---|---|
| JWT auth (HS256, 24h) | `api/helpers/JWT.php:8`, `api/middleware/Auth.php:96`, `api/index.php:40` | Works for `required()`. `optional()` now wrapped in `try/catch` returning `null`; patched since initial audit. **`JWT::$secret` hardcoded fallback remains** (see §3.2). |
| Router w/ 61 actions across 14 handlers | `api/index.php:172` | Routes wired; per-action permission checks present. |
| Standard JSON response | `api/helpers/ApiResponse.php:43` | `success`/`error`/`paginated` shape consistent. |
| PDO singleton + CRUD | `api/core/Database.php:98` | Connection works. **`insert()` does not JSON-encode** (caller responsibility — see §3.5). |
| Dashboard endpoints | `api/routes/dashboard.php` | Uses `sp_get_dashboard_stats()`, `sp_get_regional_stats(NULL)`, view `vw_free_wifi_daily_summary`. |
| Reports export | `api/routes/reports.php` | Supports CSV/JSON/HTML/PDF; FPDF optional at `api/lib/fpdf.php`. |
| Photo upload | `api/routes/photos.php` | Works; stores in `uploads/site_photos/`; 10MB cap; mime allowlist. |
| Audit log on writes | `api/helpers/AuditHelper.php:32` | Hooked into users/roles/projects/etc. **No try/catch** (see §3.3). |
| Notifications | `api/routes/notifications.php` | list/mark-read/mark-all-read/delete + unread-count. |
| Pagination helper | `ApiResponse::paginated` | Used by sites/logs/entries/audit. Sites cap 2000/page. |

### 1.2 Frontend (React)

| Feature | Location | Status |
|---|---|---|
| Auth context w/ permission + project-access | `src/context/AuthContext.tsx:112` | Loads `auth.me`; persists `mris_token`+`mris_user`; `hasPermission`/`hasProjectAccess` work. |
| API client | `src/services/api.ts:144` | GET/POST/PUT/PATCH/DELETE/upload; bearer from localStorage; types `ApiError`/`ApiSuccess<T>`/`PaginatedResponse<T>`. |
| Routing + permission gates | `src/App.tsx`, `src/components/ProtectedRoute.tsx:34` | `requiredPermission` enforced; redirects to `/` on missing perm. |
| Login | `src/pages/auth/LoginPage.tsx` | Gradient UI, form validation, error display. |
| Dashboard | `src/pages/Dashboard.tsx:740+` | 6-endpoint Promise.all; snake→camel; KPIs w/ deltas; status pie; 30-day area chart. |
| Reports (8 types) | `src/pages/Reports.tsx:422` | Full; CSV/PDF via `api.download`; XLSX client-side via `XLSX.utils.json_to_sheet`. Quick Actions (Print/Export CSV) wired. |
| Map View | `src/pages/MapView.tsx:610` | react-leaflet + clustering; `apiSiteToMock`/`apiProjectToMock`; custom SVG markers w/ drop shadow; status radio filter. |
| Free WiFi Sites | `src/pages/FreeWifi.tsx:339` | Sites + Daily Logs + SitePhotos; pagination 15/page; sort default siteName asc; 30-day trend. |
| DICT Projects | `src/pages/DictProjects.tsx` | `ProjectWithStats` w/ completion/total/completed/ongoing/planned/delayed sites; per-site entry modals. |
| Users mgmt | `src/pages/Users.tsx` | CRUD + per-user project access modal; pageSize=10. |
| Roles & Permissions | `src/pages/Roles.tsx` | Grouped permissions (by `group_name`); `permission_slugs` is CSV — parsed to `Set`; user_count via `users.list`. |
| Audit Trail | `src/pages/AuditTrail.tsx` | Filters (user/action/entity_type/date range); perPage=20; detail modal. |
| Notifications | `src/pages/Notifications.tsx` | 4 types (info/success/warning/error); mark-read/all-read/delete; filter all/unread. |
| Profile | `src/pages/Profile.tsx` | Loads role via `roles.get`; password change (min 6 chars) w/ eye toggles. |
| Schema Spec viewer | `src/pages/SchemaSpec.tsx` | 4 tabs (schema/api/folder/stack) sourced from `mockData.ts` strings. |
| Layout/nav | `src/components/Layout.tsx:205` | navItems perm-gated. |
| Error boundary | `src/components/ErrorBoundary.tsx:59` | Class component w/ reset. |
| Site Photos | `src/components/SitePhotos.tsx:88` | upload/list/delete via `api.upload('photos.upload', file, {site_id})`. |
| Dark mode | `src/context/DarkModeContext.tsx:32` | localStorage `mris_dark`; toggles `<html class="dark">`. |
| Toast system | `src/context/ToastContext.tsx:53` | success/error/info; 4s auto-dismiss; `useToast` throws if no provider. |
| Mock data fallback | `src/data/mockData.ts:695` | 11 exports; enables UI dev w/o API. |
| Subpath deploy | `src/utils/appBase.ts:16` | `DEPLOY_BASE='/Projects/projecttracking3'`; helpers for basename/api. |

### 1.3 Database (`database/schema.sql:392`)

- 16 entities, 2 views (`vw_free_wifi_daily_summary`, `vw_project_stats`), 2 stored procs (`sp_get_dashboard_stats`, `sp_get_regional_stats`).
- Foreign keys + indexes look reasonable.
- 4 roles in `seed.sql`: `super_admin`, `project_manager`, `data_encoder`, `viewer`.
- 50 FREE WIFI sites seeded for Region II (5 provinces: Batanes/Cagayan/Isabela/Nueva Vizcaya/Quirino) in `seed-region2.sql`.

---

## 2. Missing Features (no code present)

| # | Missing | Severity | Recommendation |
|---|---|---|---|
| **M-1** | **No automated tests** (PHP, TS, or E2E). Zero test runners configured. | **Critical** | Add PHPUnit for `api/`, Vitest for `src/`, Playwright for E2E. At minimum: auth, permission gates, JWT round-trip, photo upload. |
| **M-2** | **No `password_resets` / `refresh_tokens` / `sessions` / `api_keys` / `file_uploads` tables** in schema. | High | Add `password_resets` (email + token + expires_at) and `refresh_tokens` (jwtid + revoked). Enables password reset flow and token revocation. |
| **M-3** | **No CSRF protection** on non-GET endpoints. Bearer-only auth. | High | Acceptable if all clients are SPAs, but POST/PUT/PATCH/DELETE on same-origin should still validate CSRF token or `Origin` header. |
| **M-4** | **No rate limiting / brute-force protection** on `/auth/login`. | **Critical** | Add per-IP and per-email throttling (e.g., 5 attempts / 15 min). Implement as middleware or via reverse proxy. |
| **M-5** | **No HTTPS enforcement** in `api/.htaccess`. | High | Add `RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]` for prod; add `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` headers. |
| **M-6** | **Cron job doesn't generate actual report files** — `api/cron/generate_reports.php:91` only inserts a `generated_reports` DB row, no file output. | High | Either remove the cron (dead feature) or implement file emission to `uploads/reports/yyyy-mm/`. |
| **M-7** | **No actual file serving endpoint** for reports. DB row exists, no path/download. | High | Add `reports.download?id=...` w/ token-based auth or signed URL. |
| **M-8** | **No email / SMS / push notification dispatch** — `notifications` table is read-only consumer; nothing ever inserts except via direct API. | Medium | Add a `notifications.create` admin action + dispatcher (transactional email via SMTP). |
| **M-9** | **No bulk import UI/handler** despite `sampledataforimport/` dir existing. | Medium | Add `POST /projects/import`, `POST /sites/import` accepting CSV (use `sites.import` action). |
| **M-10** | **No data export from DataTables/grids** beyond the Reports page. Users table, Sites table, Audit table lack CSV/XLSX export. | Low | Add `Export to CSV` button on Users, Sites, Audit Trail pages. |
| **M-11** | **No pagination on Notifications dropdown** (LIMIT 100 hardcoded). | Low | Add cursor-based pagination or "load more". |
| **M-12** | **No multi-language / i18n** despite `i18n-localization` skill loaded. | Low | Defer until requested. |
| **M-13** | **No `created_by` / `updated_by` audit fields** on tables beyond the audit trail. | Low | Add `last_modified_by` columns if compliance needs it. |
| **M-14** | **No `sites.region` / `sites.province` foreign keys** — geo fields are denormalized text. | Low | Add `regions`, `provinces`, `municipalities`, `barangays` tables; FK sites to them. |
| **M-15** | **Profile password change does not require re-auth** (`auth.change-password` only needs current JWT). | Medium | Require current password re-entry (already in form) **and** invalidate other sessions / require fresh login. |

---

## 3. Confirmed Bugs

### 3.1 `AuthMiddleware::optional()` bug — PATCHED (verified 2026-06-02)
**File:** `api/middleware/Auth.php:96`
**Original Issue:** `try/catch` wrapper now present; `optional()` returns `null` on missing/invalid token instead of exiting. No action required for this item now.

### 3.2 JWT secret default fallback matches `.env` placeholder — BUG (Critical if `.env` not loaded)
**Files:** `api/helpers/JWT.php:59`, `api/.env`
**Issue:** `JWT::$secret` defaults to `'dict-mris-jwt-secret-change-in-production-2026'` if env not loaded. This default is also a known string, so any deployment that fails to load `.env` signs tokens with a public/known key.
**Status (2026-06-03): FIXED.** `api/helpers/JWT.php:11-19` `setSecret()` throws `\RuntimeException` on empty or default value. `api/index.php:56-62` exits 500 if `JWT_SECRET` empty before calling `setSecret()`. `JWT::encode()` at line 26-33 also throws if `self::$secret` is empty. No hardcoded fallback remains.

### 3.3 `AuditHelper::log()` does not wrap insert in try/catch — BUG (Medium)
**File:** `api/helpers/AuditHelper.php:32`
**Issue:** If `audit_logs` insert fails (e.g., FK violation, lock timeout), the calling CRUD operation returns 500, even though the underlying change succeeded.
**Status (2026-06-03): FIXED.** `api/helpers/AuditHelper.php:10-23` — `log()` wraps the `Database::insert('audit_logs', ...)` call in `try { ... } catch (\Throwable $e) { error_log(...); }` and never propagates audit failures to the caller.

### 3.4 Photos handler: no XSS-safe filename sanitization — BUG (Medium)
**File:** `api/routes/photos.php`
**Issue:** Original filename from upload is used to derive stored filename without strict sanitization. Filenames containing `../`, NUL bytes, or HTML-unsafe chars could enable stored XSS if filename is reflected, or path traversal if combined with other bugs.
**Fix:** Generate stored filename from `bin2hex(random_bytes(16))` + validated extension from mime, ignoring original name except for display.

### 3.5 `Database::insert()` does not auto JSON-encode — DESIGN BUG (Low, but risky)
**File:** `api/core/Database.php:98`
**Issue:** Arrays passed to `insert()` will be sent as a PHP array → PDO stringifies via `implode` warning, NOT JSON. Any future column with JSON type will silently store wrong data.
**Fix:** Add at top of `insert()`:
```php
foreach ($data as $k => $v) {
    if (is_array($v)) $data[$k] = json_encode($v, JSON_UNESCAPED_UNICODE);
}
```

### 3.6 Empty MySQL root password in `.env` — RISK (Critical for non-dev)
**File:** `api/.env`
```
DB_USER=root
DB_PASS=
```
**Fix:** Provision dedicated `dict_mris_app` user with strong password + minimal grants (`SELECT, INSERT, UPDATE, DELETE` only).

### 3.7 Roles `permission_slugs` is a CSV string, not array — DESIGN QUIRK
**File:** `src/pages/Roles.tsx` (and `api/routes/roles.php`)
**Issue:** API returns `permission_slugs: "a,b,c"` as a string. Frontend must parse to `Set`. Easy to forget; mismatched assumption will silently break permission UI.
**Fix:** Server-side: return `permission_slugs: string[]`. Single-line change in `roles.php`.

### 3.8 `MapView` filter radio may show stale sites when project filter cleared — minor
**File:** `src/pages/MapView.tsx:610`
**Issue:** No evidence in reviewed code, but rapid filter switching while a fetch is in-flight can display out-of-order results. Likely needs `AbortController` on filter change.
**Severity:** Low. **Verify** by smoke test.

### 3.9 `Dashboard` 30-day chart cards use linearGradient without unique `id` collisions
**File:** `src/pages/Dashboard.tsx` (lines around 2nd card, ~700+)
**Issue:** If multiple `<linearGradient>` defs share `id="colorUp"` / `id="colorDown"` across charts, browsers may apply wrong gradient. Currently only one card, but adding a 2nd AreaChart will collide.
**Fix:** Use `useId()` or unique ids per chart.

### 3.10 `Reports` "Print Current Dashboard" relies on `window.print()` only — minor
**File:** `src/pages/Reports.tsx:422`
**Issue:** `window.print()` prints whatever is on screen, not a formatted dashboard. Users will get a half-rendered page. No `@media print` CSS adjustments verified.
**Severity:** Low. Recommend adding a print stylesheet that hides nav, sidebar, and toasts.

### 3.11 `seed-region2.sql` uses `project_id=1` hardcoded — RISK
**File:** `database/seed-region2.sql:296`
**Issue:** If a fresh install changes the auto-increment of `projects` (e.g., custom seed order), the 50 region II sites will point to wrong project. Should resolve by project `code = 'FW'` or similar.
**Severity:** Low. Fix: `INSERT ... SELECT id FROM projects WHERE code='FW'`.

### 3.12 `Roles.tsx` `user_count` via `users.list` filter — performance
**File:** `src/pages/Roles.tsx`
**Issue:** Computing user_count by fetching all users and filtering client-side. For thousands of users, slow. Add `users.count?role_id=` server endpoint.
**Severity:** Low (fine for <1k users).

---

## 4. Security Risks (consolidated)

| ID | Risk | File | Severity |
|---|---|---|---|
| S-1 | JWT secret fallback (see §3.2) | `api/helpers/JWT.php:59` | Critical |
| S-2 | Empty DB root password | `api/.env` | Critical (prod) |
| S-3 | No rate limiting on `/auth/login` | `api/index.php:172` | Critical |
| S-4 | No HTTPS / security headers | `api/.htaccess` | High |
| S-5 | CORS=`*` allows any origin | `api/.env` | High |
| S-6 | Photo filename unsanitized (see §3.4) | `api/routes/photos.php` | Medium |
| S-7 | No CSRF (acceptable for SPA, but document) | global | Medium |
| S-8 | No `Content-Security-Policy` header | `api/.htaccess` | Medium |
| S-9 | JWT lacks `kid` and rotation | `api/helpers/JWT.php:59` | Medium |
| S-10 | No token revocation list | `database/schema.sql` | Medium |
| S-11 | No password complexity policy | `api/routes/auth.php` | Medium |
| S-12 | No 2FA | global | Low (defer) |
| S-13 | `phpinfo()` or debug endpoints? | not seen | Verify |

---

## 5. Performance / Maintainability

- **`sites.list` caps at 2000/page** (`api/routes/sites.php`) — clients must paginate; frontend respects it but no total-count is exposed in some responses. Verify `total` field is returned.
- **`Database::fetchAll` is `*` if no columns** — explicit column lists in routes (verified) but easy to break.
- **No N+1 in reviewed routes** — projects handler uses correlated subqueries.
- **`mockData.ts`** still exported in production bundle — adds ~30KB; tree-shake if API is online (`if (import.meta.env.PROD && !window.__FORCE_MOCK__) ...`).
- **No code-splitting** beyond Vite defaults — large pages (DictProjects, Users) load all at once. Use `React.lazy` for Routes.

---

## 6. Frontend UX / Behavior Issues

- **No empty-state copy** verified in partial reads — most pages likely show "No data" via simple ternary, not a friendly empty illustration.
- **No loading skeletons** — pages show generic "Loading..." (per `isLoading` state seen).
- **Toast container position** not verified — common issue is z-index conflicts with modals.
- **Mobile responsiveness** not verified — `Layout.tsx` has nav, but breakpoints unknown.
- **Accessibility**: no `aria-` attributes reviewed; focus management on modals not verified.

---

## 7. Recommendations — Priority Order

1. **Stop the bleed (block deploy):**
   - Fix S-1 (JWT secret), S-3 (rate limit), S-2 (DB user), S-4 (HTTPS).
   - Fix §3.1 (`optional()`) and §3.3 (`AuditHelper` try/catch).
2. **Add test scaffolding:**
   - `composer.json` + PHPUnit for `api/`.
   - Vitest for `src/` (test the contexts, `api.ts`).
   - 1 Playwright E2E for login → dashboard.
3. **Decide on §3.6 (cron) and §M-6/M-7 (report files):** implement file emission or remove cron.
4. **Wire password reset / refresh tokens** (M-2) before exposing to external users.
5. **Add error monitoring** (Sentry) — `api/` and `src/` both lack telemetry.
6. **Add CI:** GitHub Actions running `php -l`, `npx tsc --noEmit`, `phpunit`, `vitest`.

---

## 8. Open Questions / Unverified

- **No runtime tests executed.** This is a static-only audit. Runtime behavior may differ.
- **`seed-all-regions.sql`** not read — possibly adds more provinces/sites, may have its own issues.
- **`uploads/`** directory contents not enumerated.
- **`sampledataforimport/`** CSV formats not reviewed.
- **`audit-report/audit-report.md`** was truncated at 7751 chars; its full content may contain additional findings not duplicated here.
- **`dist/`** build output not inspected; if `mockData.ts` is bundled in prod, that's a leak.
- **API smoke test (PHP built-in server)** not run; would surface any 500s in route handlers.

---

*End of findings. See `audit-report/audit-report.md` for the prior 2026-06-01 audit; this document supplements rather than replaces it.*

