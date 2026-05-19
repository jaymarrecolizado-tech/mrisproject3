# DICT MRIS — Remaining Tasks

> Last updated: 2026-05-19 (Notifications, Profile, Milestones connected)

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

### 6. ~~DictProjects — Real Project Detail & Milestones~~ ✅ DONE
- Connected milestone list to `milestones.list` API.
- Connected milestone CRUD to `milestones.create`, `milestones.update`, `milestones.delete`.
- Added `MilestoneFormModal` component for creating/editing milestones.
- Connected entries tab to `entries.list` API.

---

## Low Priority

### 7. ~~Profile / Settings Page~~ ✅ DONE
- Built `src/pages/Profile.tsx` with account info, permissions display, and password change form.
- Added `/profile` route and profile avatar button in header.
- Connected to `auth.change-password` API.

### 8. ~~Notifications Page~~ ✅ DONE
- Built `src/pages/Notifications.tsx` with list, mark-as-read, mark-all-read, and delete.
- Added notifications bell icon with unread count badge in header.
- Created `api/routes/notifications.php` with all endpoints.
- Added `notifications` table to database schema.
- Polls unread count every 60 seconds.

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
| 11 | Notifications page with bell icon and unread badge | ✅ Done |
| 12 | Profile/Settings page with password change | ✅ Done |
| 13 | Milestones CRUD with modal form | ✅ Done |
