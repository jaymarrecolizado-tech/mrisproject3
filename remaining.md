# DICT MRIS — Remaining Tasks

> Last updated: 2026-05-19 (Reports page connected)

---

## High Priority

### 1. ~~Dashboard — Fix API Mismatch~~ ✅ DONE
- Added `dashboard.daily` route to `api/index.php` and `api/routes/dashboard.php` as alias for `dashboard.trends`.

### 2. ~~Dashboard — Real Project Cards~~ ✅ DONE
- Connected Dashboard to `projects.stats` API for real project completion bars.
- Connected Dashboard to `dashboard.regional` API for real regional breakdown chart.
- Removed `mockProjects` dependency from Dashboard.

### 3. ~~Missing DB View — `vw_free_wifi_daily_summary`~~ ✅ DONE
- Already existed in `database/schema.sql` at lines 299-309.

---

## Medium Priority

### 4. ~~Audit Trail Page~~ ✅ DONE
- Built `src/pages/AuditTrail.tsx` with paginated table, filters (user, action, entity type, date range), and detail modal.
- Added `/audit` route and sidebar navigation.
- API route `audit.list` already existed with full filtering support.

### 5. ~~Reports Page — Real Generation & Download~~ ✅ DONE
- Connected `Reports.tsx` to real `reports.list` API for recent reports sidebar.
- Implemented `reports.generate` with CSV streaming output (direct download) and JSON data for PDF/XLSX.
- Added report deletion (`reports.delete`) and download (`reports.download`) handlers.
- Added error display, quick actions (print dashboard, export all sites), and date range filtering.
- Removed mock `generatedReports` array.

### 6. DictProjects — Real Project Detail & Milestones
- **Issue**: Entries tab connected to API, but project detail modals, milestone management, and progress bars still use mock data.
- **Scope**:
  - Connect milestone list to `milestones.list` API.
  - Connect milestone CRUD to `milestones.create`, `milestones.update`, `milestones.delete`.
  - Replace mock project stats with `projects.stats` API.
- **Files**: `src/pages/DictProjects.tsx`, `api/routes/milestones.php`

---

## Low Priority

### 7. Profile / Settings Page
- **Issue**: `auth.change-password` API endpoint exists but no UI.
- **Scope**: Build `src/pages/Profile.tsx` with:
  - Edit name/email
  - Change password form
  - View current role and permissions
- **Files**: `src/pages/Profile.tsx`, `src/App.tsx`, `src/components/Layout.tsx`

### 8. Notifications Page
- **Issue**: `notifications.list` route exists in `api/index.php` but no frontend.
- **Scope**: Build `src/pages/Notifications.tsx` with notification list, mark-as-read, and bell icon in header.
- **Files**: `src/pages/Notifications.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `api/routes/notifications.php` (create if missing)

---

## Completed Tasks

| # | Task | Status |
|---|------|--------|
| 1 | SaveLog form for Free WiFi daily entries | ✅ Done |
| 2 | SaveEntry form for DICT project milestone entries | ✅ Done |
| 3 | Users management page (CRUD, roles, toggle active) | ✅ Done |
| 4 | MapView with real site markers from API | ✅ Done |
| 5 | CSV import/export for sites and logs | ✅ Done |
| 6 | Roles & Permissions management page | ✅ Done |
| 7 | Toast notification system for API feedback | ✅ Done |
| 8 | Auth system with JWT, RBAC, login/logout | ✅ Done |
| 9 | PHP/MySQL backend with all route handlers | ✅ Done |
| 10 | Database schema with stored procedures | ✅ Done |
