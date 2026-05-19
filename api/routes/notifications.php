<?php
/**
 * Notifications Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();
$user = AuthMiddleware::getCurrentUser();

switch ($action) {

    case 'notifications.list':
        $notifications = $db->fetchAll(
            'SELECT * FROM notifications
             WHERE user_id = ? OR user_id IS NULL
             ORDER BY created_at DESC
             LIMIT 100',
            [$user['id']]
        );
        ApiResponse::success($notifications);
        break;

    case 'notifications.mark-read':
        $notifId = $id ?? $_GET['id'] ?? null;
        if (!$notifId) {
            ApiResponse::error('Notification ID required', 400);
            exit;
        }
        $db->update('notifications', ['is_read' => 1], 'id = ? AND user_id = ?', [$notifId, $user['id']]);
        ApiResponse::success(null, 'Notification marked as read');
        break;

    case 'notifications.mark-all-read':
        $db->query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [$user['id']]
        );
        ApiResponse::success(null, 'All notifications marked as read');
        break;

    case 'notifications.delete':
        $notifId = $id ?? $_GET['id'] ?? null;
        if (!$notifId) {
            ApiResponse::error('Notification ID required', 400);
            exit;
        }
        $db->delete('notifications', 'id = ? AND user_id = ?', [$notifId, $user['id']]);
        ApiResponse::success(null, 'Notification deleted');
        break;

    case 'notifications.unread-count':
        $count = $db->fetchColumn(
            'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0',
            [$user['id']]
        );
        ApiResponse::success(['count' => (int) $count]);
        break;

    default:
        ApiResponse::error('Unknown notifications action', 404);
}
