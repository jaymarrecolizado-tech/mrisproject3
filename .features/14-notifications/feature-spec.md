# Feature: Notifications

## Goal

Display, mark, and delete user or system notifications.

## Status

Draft

## Route and Permission

- Route: `/notifications`
- Required permission: currently public to authenticated users
- Related API actions: `notifications.list`, `notifications.mark-read`, `notifications.mark-all-read`, `notifications.delete`, `notifications.unread-count`

## Files

### Frontend

- `src/pages/Notifications.tsx`

### Backend

- `api/routes/notifications.php`
- `api/routes/logs.php`
- `api/routes/milestones.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Notifications page | `src/pages/Notifications.tsx` | Draft | Page exists | Needs function-level spec | Document list, mark read, delete behavior | Every notification action has defined behavior |
| List notifications | `api/routes/notifications.php` | Draft | API action exists | Needs contract | Document filters and pagination | UI receives expected notifications |
| Mark read | `api/routes/notifications.php` | Draft | API action exists | Needs behavior spec | Define single/all read behavior | Read state updates correctly |
| Unread count | `api/routes/notifications.php` | Draft | API action exists | Needs usage spec | Define where count appears | Count is accurate |
| Delete notification | `api/routes/notifications.php` | Draft | API action exists | Needs confirmation/audit spec | Define delete behavior | Deleted notification is removed safely |
| Notification creation | `api/routes/logs.php`, `api/routes/milestones.php` | Draft | Some actions insert notifications | Needs coverage spec | Document which actions create notifications | Notifications are created for expected events |

## Missing Work

- Define notification permission rules.
- Define mark-read behavior.
- Define notification creation coverage.
- Add function-level specs for unread count and delete behavior.

## Next Planned Work

1. Inspect `Notifications.tsx`.
2. Inspect notification-producing route actions.
3. Add acceptance criteria for read state and unread count.

## Acceptance Criteria

- Notifications route behavior is documented.
- Notification list is documented.
- Mark-read behavior is documented.
- Unread count is documented.
- Notification creation coverage is documented.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Manual notification verification completed
- [ ] Permission verification completed

## Risks and Dependencies

- Notification creation is spread across multiple route actions.
- Notification permissions may need tightening.

## Definition of Done for This Feature

Notifications are done only when list, mark-read, unread count, delete, creation coverage, and permissions are specified and verified.
