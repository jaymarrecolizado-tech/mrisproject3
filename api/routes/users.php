<?php
/**
 * Users Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'users.list':
        if (!AuthMiddleware::hasPermission('users.view')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $users = $db->fetchAll(
            'SELECT u.id, u.name, u.email, u.phone, u.department, u.is_active, u.last_login_at, u.created_at,
                    r.slug as role_slug, r.name as role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.name'
        );
        ApiResponse::success($users);
        break;

    case 'users.get':
        if (!AuthMiddleware::hasPermission('users.view')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $userId = $id ?? $_GET['id'] ?? null;
        if (!$userId) {
            ApiResponse::error('User ID required', 400);
            exit;
        }
        $user = $db->fetchOne(
            'SELECT u.id, u.name, u.email, u.phone, u.department, u.is_active, u.last_login_at, u.created_at,
                    r.slug as role_slug, r.name as role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.id = ?',
            [$userId]
        );
        if (!$user) {
            ApiResponse::error('User not found', 404);
            exit;
        }
        ApiResponse::success($user);
        break;

    case 'users.create':
        if (!AuthMiddleware::hasPermission('users.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $email = $input['email'] ?? '';
        $name = $input['name'] ?? '';
        $password = $input['password'] ?? '';
        $roleId = (int) ($input['role_id'] ?? 4);

        if (!$email || !$name || !$password) {
            ApiResponse::error('Email, name, and password required', 400);
            exit;
        }

        $existing = $db->fetchColumn('SELECT id FROM users WHERE email = ?', [$email]);
        if ($existing) {
            ApiResponse::error('Email already exists', 409);
            exit;
        }

        $newId = $db->insert('users', [
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role_id' => $roleId,
            'phone' => $input['phone'] ?? null,
            'department' => $input['department'] ?? null,
        ]);

        // Grant access to all projects for new users (admin can adjust later)
        $projects = $db->fetchAll('SELECT id FROM projects WHERE is_active = 1');
        foreach ($projects as $p) {
            $db->insert('user_project_access', [
                'user_id' => $newId,
                'project_id' => $p['id'],
                'access_level' => 'view',
            ]);
        }

        ApiResponse::success(['id' => $newId], 'User created', 201);
        break;

    case 'users.update':
        if (!AuthMiddleware::hasPermission('users.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $userId = $id ?? $_GET['id'] ?? null;
        if (!$userId) {
            ApiResponse::error('User ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['name', 'email', 'phone', 'department', 'role_id', 'is_active'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) $fields[$f] = $input[$f];
        }
        if (!empty($input['password'])) {
            $fields['password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $db->update('users', $fields, 'id = ?', [$userId]);
        ApiResponse::success(null, 'User updated');
        break;

    case 'users.delete':
        if (!AuthMiddleware::hasPermission('users.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $userId = $id ?? $_GET['id'] ?? null;
        if (!$userId) {
            ApiResponse::error('User ID required', 400);
            exit;
        }
        // Soft delete: deactivate
        $db->update('users', ['is_active' => 0], 'id = ?', [$userId]);
        ApiResponse::success(null, 'User deactivated');
        break;

    default:
        ApiResponse::error('Unknown users action', 404);
}
