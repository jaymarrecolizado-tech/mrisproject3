<?php
/**
 * Permissions Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'permissions.list':
        $permissions = $db->fetchAll(
            'SELECT * FROM permissions ORDER BY group_name, name'
        );
        // Group by group_name
        $grouped = [];
        foreach ($permissions as $p) {
            $group = $p['group_name'] ?? 'general';
            if (!isset($grouped[$group])) $grouped[$group] = [];
            $grouped[$group][] = $p;
        }
        ApiResponse::success($grouped);
        break;

    default:
        ApiResponse::error('Unknown permissions action', 404);
}
