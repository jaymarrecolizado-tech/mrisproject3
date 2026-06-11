# Feature: Site Photos

## Goal

Upload, list, view, and delete site photos safely.

## Status

Draft

## Route and Permission

- Route: photo actions are used from site-related UI
- Required permission: depends on consuming feature
- Related API actions: `photos.upload`, `photos.list`, `photos.delete`

## Files

### Frontend

- `src/components/SitePhotos.tsx`

### Backend

- `api/routes/photos.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Photo component | `src/components/SitePhotos.tsx` | Draft | Component exists | Needs function-level spec | Document upload, list, and delete behavior | Every photo action has defined behavior |
| Upload photo | `api/routes/photos.php` | Draft | API action exists | Needs validation spec | Define file type, size, and site ownership rules | Invalid uploads are rejected |
| List photos | `api/routes/photos.php` | Draft | API action exists | Needs contract | Document response shape | UI renders expected photos |
| Delete photo | `api/routes/photos.php` | Draft | API action exists | Needs confirmation/audit spec | Define delete behavior | Deleted photo is removed safely |

## Missing Work

- Define upload validation rules.
- Define file storage path and naming.
- Define permission behavior.
- Add delete confirmation behavior if needed.

## Next Planned Work

1. Inspect `SitePhotos.tsx`.
2. Inspect `api/routes/photos.php`.
3. Add upload/delete acceptance criteria.

## Acceptance Criteria

- Photo upload validates file type and size.
- Photo list returns expected records.
- Delete behavior is safe and documented.
- Permission behavior is documented.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual upload verification completed
- [ ] Manual delete verification completed

## Risks and Dependencies

- File uploads can create security and storage issues.
- Photo deletion may affect audit/history expectations.

## Definition of Done for This Feature

Photos are done only when upload validation, list behavior, delete behavior, and permission rules are documented and verified.
