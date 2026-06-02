# DICT MRIS — Audit Report
**Project:** DICT MRIS (Unified Project Management & Reporting System)  
**Audit Mode:** Read-only codebase inspection  
**Scope:** Frontend, Backend, Database, Auth, UX/Accessibility, DevOps, Coverage  
**Date:** 2026-06-01

---

## Executive Summary
- Codebase is a React 19 + Vite + Tailwind v4 SPA with a PHP/M procedural API under `/api`.
- `remaining.md` claims completion; audit confirms **high feature coverage** but identifies **material gaps** in testing, accessibility, hardening, and operational setup.
- **Zero automated tests** detected (no unit, integration, or e2e).
- Multiple HIGH/Critical risks are present (see Risk Matrix).

---

## 1. Coverage Completeness

| Domain | Status | Notes |
|--------|--------|-------|
| Schema (15 tables/views/procs) | Present | `schema.sql` is complete and normalized |
| Auth (login/logout/refresh) | Present | JWT + `users`, `roles`, `permissions`, `role_permissions`, `user_project_access` |
| Users CRUD UI | Present | `src/pages/Users.tsx` |
| Roles/Permissions Editor UI | Present | `src/pages/Roles.tsx` |
| Projects CRUD UI | Present | `src/pages/DictProjects.tsx` |
| Sites CRUD UI | Present | `src/pages/FreeWifi.tsx` with import/export |
| Dict Project Entries UI | Present | SPA page exists |
| Milestones UI | Present | SPA page exists |
| Dashboard | Present | `src/pages/Dashboard.tsx` |
| Reports | Present | `src/pages/Reports.tsx` |
| Notifications | Present | `src/pages/Notifications.tsx` |
| Audit Trail | Present | `src/pages/AuditTrail.tsx` |
| Map View | Present | `src/pages/MapView.tsx` |
| Photos upload | Present | `SitePhotos` component + `photos.upload` route |
| **Tests** | **MISSING** | No `.test.*`, no `__tests__`, no CI test job |

### Schema ↔ Route ↔ Page Alignment (High-Level)
- Phases table referenced in `remaining.md` **not found** in `schema.sql`.
- Toggleable model section and key achievements visible on some pages; schema does not match claimed content exactly.
- Several `remaining.md` screenshots show external links (DICT sites, Gdrive folder, Google Maps) — verify these destinations are valid/current.

---

## 2. Risk Matrix

| ID | Risk | Severity | Likelihood | Evidence |
|----|------|----------|------------|----------|
| R-01 | **Incomplete test coverage** | CRITICAL | Certain | No test files detected anywhere in repo |
| R-02 | **Schema mismatch / untracked tables** | HIGH | Medium | `remaining.md` phases references not found in schema |
| R-03 | **Weak JWT configuration** | CRITICAL | Certain | `JWT_SECRET=dict-mris-jwt-secret-change-in-production-2026` (static, env-prefixed default), `JWT_EXPIRY=86400`, no `HS256` algorithm configuration visible |
| R-04 | **AuthContext + api.ts truncated/incomplete** | HIGH | Medium | Read outputs truncated; need full reviews |
| R-05 | **Dashboard/API client unread due to truncation** | HIGH | Medium | Multiple reads hit output caps |
| R-06 | **CORS wildcard** | HIGH | Certain | `CORS_ORIGIN=*` with `Allow-Credentials=true` (anti-pattern) |
| R-07 | **Frontend auth in localStorage** | MEDIUM | Certain | `mris_token` documented in critical context; no refresh/silent renewal guarantees |
| R-08 | **No visible input validation/sanitization** | HIGH | Medium | PHP routes not inspected in detail; no middleware layer detected beyond `AuthMiddleware` |
| R-09 | **No rate limiting / brute force protection** | HIGH | Certain | `/api/routes/auth.php` not checked in detail; no rate-limit helpers found |
| R-10 | **No CSRF protection for state-changing requests** | MEDIUM | Likely | PHP routes accept JSON body; no CSRF token mechanism visible |
| R-11 | **No email/password reset flow** | MEDIUM | Certain | Not referenced in routes (`auth/forgot-password` missing) |
| R-12 | **Incomplete error handling strategy** | MEDIUM | Likely | `toast` + `api.ts` likely catch-all; truncated before verification |
| R-13 | **Hard-coded proxy origin in vite.config.ts** | LOW | N/A | Dev proxy points to localhost; deploy needs env switch |
| R-14 | **No CI/CD visible** | MEDIUM | Likely | No GitHub Actions / deploy scripts detected from current inspection |
| R-15 | **No secrets scanning / pre-commit hooks** | MEDIUM | Certain | No `.husky`, `.pre-commit-config`, `gitleaks`, etc. noted yet |
| R-16 | **Missing ARIA/keyboard support** | MEDIUM | Likely | Heavy use of `framer-motion` + custom modals; no a11y audit done |
| R-17 | **External link rot risk** | LOW | Likely | `remaining.md` links to DICT/Gdrive/Google Maps — mojibake link likely broken |

---

## 3. Security Findings

- **JWT:** Secret is a static default string. There is no evidence of token rotation, refresh token binding, or audience/issuer claims.
- **CORS:** `Access-Control-Allow-Origin: *` combined with `Allow-Credentials: true` is a security anti-pattern; some browsers will reject, others will allow any origin to send credentialed requests.
- **Authorization:** App stores `project_access` + `permissions[]`; need to verify all `AuthMiddleware::authenticate()` calls also gate by `$action` in PHP route files.
- **SQL Injection:** Parameterized queries used in `sites.php`; confirm all other route files follow the same pattern (only one file inspected).
- **File Upload:** Photos upload exists; inspect for mime-type spoofing, path traversal, and max-size enforcement.

---

## 4. Accessibility & UX Gaps

- Likely uses Framer Motion for modals, drawers, and animated content — need to verify:
  - Focus trapping
  - Keyboard navigation (Enter/Space on buttons, Escape to close)
  - ARIA roles (`role="dialog"`, `aria-modal`, `aria-labelledby`)
  - Reduced motion (`prefers-reduced-motion`)
- Color contrast / responsive typography needs a dedicated pass.
- `index.html` and Tailwind config should be checked for font loading and mobile breakpoints.

---

## 5. Performance & Reliability

- **Mock data:** `src/data/mockData.ts` is used (`import { dailySummaries } from '../data/mockData'`); ensure not shipped in production build.
- **Bundle size:** `vite-plugin-singlefile` is included — confirm this is intentional for deployment; otherwise it bloats the initial payload.
- **API timeout / retry:** Verify `api.ts` has abort/timeout and sensible retry policy.
- **Error boundaries:** React Error Boundary presence unknown; needs verification.

---

## 6. Documentation & Deployment

- `remaining.md` has conflicting claims vs actual code; needs update/reconciliation.
- No `README.md` found or it was not in inspected set.
- No `.htaccess` diff reviewed yet (it shows as modified), but sample existed at `api/.htaccess` initial.
- PHP version, MySQL version, WAMP-specific configs (`virtualhost`, rewrite rules) should be documented.
- Missing onboarding docs for local dev setup (DB import, seed data, env vars).

---

## 7. Verification To-Do (Required Before Closing Audit)

1. Read full: `src/services/api.ts`, `src/context/AuthContext.tsx`, `src/context/ToastContext.tsx`
2. Read full: `src/pages/Dashboard.tsx`, `src/App.tsx`, `src/components/Layout.tsx`
3. Read full: `api/routes/auth.php`, `api/routes/logs.php`, `api/routes/entries.php`, `api/routes/milestones.php`, `api/routes/reports.php`, `api/routes/audit.php`
4. Verify input validation in all PHP route files
5. Verify auth middleware gating for every route
6. Confirm `phases` table is truly absent from schema or is de facto stored elsewhere
7. Verify external URLs in `remaining.md` are still valid
8. Search for any test/config/CI files missed:
   - `package.json` scripts
   - `.github/**`
   - `docker-compose*`, `Dockerfile`
   - `phpunit.xml`, `.env.example`, `.gitignore`
   - `jest.config`, `vitest.config`, `playwright.config`
9. Check `.htaccess` for security headers (HSTS, CSP, X-Frame-Options)
10. Accessibility pass (axe or manual) on high-traffic pages (Login, Dashboard, FreeWifi)

---

## 8. Recommended Priorities

| P0 (Block release) | P1 (Fix within 1 week) | P2 (Nice to have) |
|---|---|---|
| Add JWT secret rotation + alg config | Gate all PHP routes with per-action permission checks | Add a11y labels + focus management |
| Replace `CORS_ORIGIN=*` with explicit origin(s) | Add `auth/forgot-password` + email reset | Progress indicators / skeleton screens |
| Integrate automated tests (vitest + phpunit) | Error boundary + user-friendly error page | Internationalization (i18n) |
| Verify/remove unused `phases` references | Document setup/runbook | Dark mode defaults + brand tokens |

---

## 9. Untracked Files (Workspace)
- `.htaccess` — modified (diff needed)
- `src/utils/appBase.ts` — new file (needs review)
- `src/components/Untitled-1.html` — stray file
- `test-login.png` — binary artifact, should not be in repo

---

## 10. Outstanding Risks
- Because multiple source files were truncated and could not be fully read, **final risk counts may change**. The report above reflects the minimum confirmed findings. Full verification in Section 7 is needed to finalize the checklist.
