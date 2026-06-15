# Feature: Site Photos

## Goal

Upload, list, view, and delete site photos safely — with hardened upload validation and permission-gated controls.

## Status

**Implemented** — backend (`api/routes/photos.php`) is well-hardened (server-side `finfo` MIME detection, image allowlist, 10 MB cap, random filename, no-exec `.htaccess`, `move_uploaded_file`); frontend (`SitePhotos.tsx`) lists/uploads/deletes. This verification pass fixed **4 real bugs** (one critical) and rewrote the spec from a stale "Draft". Automated checks green (tsc clean, `SitePhotos.tsx` 0 lint errors, 42/42 tests, `php -l` clean).

⚠️ **One manual DB step required on existing databases** (see Database / Migration below): the `original_name` column was missing from the shipped schema, so photo upload was broken until this pass. Fresh installs via `schema.sql` now include it; an existing DB needs a one-line `ALTER`.

## Route and Permission

- No dedicated route — photos render inside the DICT Projects site-detail modal (`/dict-projects`) and the Free WiFi site-detail modal (`/freewifi`).
- API permission gates (`api/routes/photos.php`):
  - `photos.list` → authenticated (`AuthMiddleware::authenticate`)
  - `photos.upload` → `sites.edit`
  - `photos.delete` → `sites.manage`
- Frontend gates now **match the API exactly** (fixed this pass — see Changes): `SitePhotos` reads `sites.edit` (upload) and `sites.manage` (delete) from auth itself.

## Files

### Frontend

- `src/components/SitePhotos.tsx` — grid of thumbnails, upload (file input), delete (per-photo), used by both DictProjects and FreeWifi site-detail modals.

### Backend

- `api/routes/photos.php` — `photos.upload`, `photos.list`, `photos.delete`.

### Database

- `database/schema.sql` — `site_photos` (id, site_id, file_path, file_name, **original_name**, file_size, mime_type, caption, uploaded_by, created_at). FK `site_id → sites(id) ON DELETE CASCADE`; `uploaded_by → users(id) ON DELETE SET NULL`.

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Photo component | `SitePhotos.tsx` | Implemented | Thumbnail grid; upload via hidden file input; per-photo delete; base-path-aware img URL; toasts on success/failure | — | Every action has defined, permission-matched behavior |
| Upload photo | `photos.php` | Implemented | `sites.edit`-gated; server-side `finfo` MIME; allowlist JPEG/PNG/WebP/GIF; ≤10 MB; extension from MIME; random filename (`bin2hex(random_bytes(16))`); sanitized display name; `.htaccess` no-exec; `move_uploaded_file`; ClamAV hook is a TODO placeholder | ClamAV not actually wired | Invalid uploads rejected (400); valid uploads persist |
| List photos | `photos.php` | Implemented | `photos.list` by `site_id`; joins uploader name; newest-first | — | UI renders expected photos |
| Delete photo | `photos.php` | Implemented | `sites.manage`-gated; 404 if missing; unlinks file from disk then deletes row | No audit on delete (codebase-wide) | Deleted photo removed from disk + DB safely |

## Changes in This Sweep (Feature 07)

1. **CRITICAL — `original_name` column was missing from the schema (upload always failed).** `photos.upload` inserted `original_name`, but `site_photos` had no such column (confirmed: referenced only in `photos.php:93`, absent from `schema.sql`, no migration). Every insert raised "Unknown column 'original_name'" → upload was completely broken. Fixed by adding `original_name VARCHAR(255)` to `schema.sql`. **Existing databases need:** `ALTER TABLE site_photos ADD COLUMN original_name VARCHAR(255) AFTER file_name;`
2. **Permission mismatch fixed.** `SitePhotos` took a `canEdit` prop, but callers passed the wrong gate: FreeWifi passed **hardcoded `true`** (every user saw upload/delete), and DictProjects passed `hasPermission('entries.create')` (unrelated to the API's `sites.edit`/`sites.manage`). Users could see buttons that silently 403'd. Removed the prop; the component now reads `sites.edit` (upload) and `sites.manage` (delete) from `useAuth`, so the UI always matches the API.
3. **Photo URLs now respect the app base path.** `src={`/${file_path}`}` resolved to `/uploads/...` — a 404 in the real deployment (app lives at `/Projects/projecttracking3/`). Now uses `getAppBasePath()` so images load in both dev and prod.
4. **Silent failures now surface.** Upload and delete swallowed all errors (`catch { /* ignore */ }`), so a failed upload (e.g. the column bug, or a 403) gave zero feedback. Added success/error toasts.

## What Is Implemented

- Hardened upload: real MIME sniffing (not client `type`), image allowlist, size cap, random on-disk filename, sanitized display name, no-exec upload dir.
- Read paths: list by site with uploader join.
- Delete: gated, 404-guarded, removes file + row.
- Frontend: permission-matched controls, base-path-correct image URLs, user feedback via toasts.

## Known Gaps / Not Implemented

- **ClamAV malware scan is a TODO placeholder** (`photos.php`), not wired. The allowlist + no-exec `.htaccess` + random filename mitigate the main risks, but AV scanning is stubbed.
- **No audit on upload/delete.** Consistent with the rest of the codebase (only `*.update` is audited, plus `projects.create`). Raised for visibility.
- **No upload progress / multi-file.** Single file per upload, no progress indicator.
- **`photos.delete` doesn't verify project-level access** beyond the `sites.manage` permission — a broader per-project-access concern, out of scope here.

## Acceptance Criteria

- [x] Photo upload validates file type (server-side finfo) and size (≤10 MB).
- [x] Photo list returns expected records (with uploader).
- [x] Delete is safe (gated, 404-guarded, removes file + row).
- [x] Permission behavior documented and the UI matches the API gates.
- [x] Schema includes `original_name` (fresh installs work out of the box).
- [ ] Existing DB migrated (`ALTER TABLE … ADD original_name …`) — **manual step for the user**.

## Tests and Verification

- [x] `php -l api/routes/photos.php` — clean (no code change this pass; backend was already hardened).
- [x] `npx tsc --noEmit` — clean.
- [x] `npm run lint` — `SitePhotos.tsx` **0 errors / 0 warnings** (rewritten with proper types; pre-existing `no-explicit-any` warnings in DictProjects/FreeWifi unchanged).
- [x] `npm test` — 42/42.
- [x] Spec-vs-code review: confirmed the `original_name` column gap, permission mismatch, and base-path bug against schema + both call sites.
- [ ] Manual: upload a JPEG/PNG, confirm it persists + renders; delete one, confirm file + row gone. (Requires the `ALTER` above on the live DB first.)
- [ ] Manual: a user without `sites.edit`/`sites.manage` does not see the upload/delete controls.

## Risks and Dependencies

- File uploads carry security + storage risk; mitigated by MIME allowlist, random filenames, no-exec `.htaccess`, and size cap. AV scan still TODO.
- Photo deletion removes the file from disk (irreversible) and the DB row; no soft-delete.
- Depends on Feature 06 (sites) — `site_id` FK.
- **Existing databases must run the `original_name` ALTER or upload stays broken.**

## Definition of Done for This Feature

Photos are done only when upload validation, list, delete, and permission rules are implemented and verified — including the `original_name` schema fix applied to the live database.
