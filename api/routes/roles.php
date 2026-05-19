<?php
/**
 * Roles Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'roles.list':
        $roles = $db->fetchAll(
            'SELECT r.*,
                    GROUP_CONCAT(p.slug) as permission_slugs
             FROM roles r
             LEFT JOIN role_permissions rp ON rp.role_id = r.id
             LEFT JOIN permissions p ON p.id = rp.permission_id
             GROUP BY r.id'
        );
        ApiResponse::success($roles);
        break;

    case 'roles.get':
        $roleId = $id ?? $_GET['id'] ?? null;
        if (!$roleId) {
            ApiResponse::error('Role ID required', 400);
            exit;
        }
        $role = $db->fetchOne('SELECT * FROM roles WHERE id = ?', [$roleId]);
        if (!$role) {
            ApiResponse::error('Role not found', 404);
            exit;
        }
        $permissions = $db->fetchAll(
            'SELECT p.* FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?',
            [$roleId]
        );
        $role['permissions'] = $permissions;
        ApiResponse::success($role);
        break;

    case 'roles.update':
        if (!AuthMiddleware::hasPermission('users.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $roleId = $id ?? $_GET['id'] ?? null;
        if (!$roleId) {
            ApiResponse::error('Role ID required', 400);
            exit;
        }
        // Update permissions
        if (isset($input['permissions']) && is_array($input['permissions'])) {
            $db->delete('role_permissions', 'role_id = ?', [$roleId]);
            foreach ($input['permissions'] as $permSlug) {
                $permId = $db->fetchColumn('SELECT id FROM permissions WHERE slug = ?', [$permSlug]);
                if ($permId) {
                    $db->insert('role_permissions', ['role_id' => $roleId, 'permission_id' => $permId]);
                }
            }
        }
        ApiResponse::success(null, 'Role updated');
        break;

    default:
        ApiResponse::error('Unknown roles action', 404);
}
