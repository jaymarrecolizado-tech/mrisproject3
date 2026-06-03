<?php
/**
 * Auth Routes: login, me, logout, refresh, change-password
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../helpers/PasswordValidator.php';

switch ($action) {

    case 'auth.login':
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (!$email || !$password) {
            ApiResponse::error('Email and password are required', 400);
            exit;
        }

        if (!RateLimiter::check($email, 5, 900)) {
            ApiResponse::error('Too many login attempts. Please try again later.', 429);
            exit;
        }

        $db = Database::getInstance();
        $user = $db->fetchOne(
            'SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.department, u.is_active,
                    r.slug as role_slug, r.name as role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.email = ?',
            [$email]
        );

        if (!$user) {
            ApiResponse::error('Invalid email or password', 401);
            exit;
        }

        if (!password_verify($password, $user['password_hash'])) {
            ApiResponse::error('Invalid email or password', 401);
            exit;
        }

        RateLimiter::reset($email);

        if (!$user['is_active']) {
            ApiResponse::error('Account is disabled', 403);
            exit;
        }

        RateLimiter::reset($email);

        // Update last login
        $db->update('users', ['last_login_at' => date('Y-m-d H:i:s')], 'id = ?', [$user['id']]);

        // Log audit
        $db->insert('audit_logs', [
            'user_id' => $user['id'],
            'action' => 'user.login',
            'entity_type' => 'user',
            'entity_id' => $user['id'],
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        ]);

        // Generate JWT with token_version for revocation
        $jwt = JWT::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'token_version' => (int)($user['token_version'] ?? 0),
        ]);

        // Load permissions
        $permissions = $db->fetchAll(
            'SELECT p.slug FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?',
            [$user['role_id']]
        );

        // Load project access
        $projectAccess = $db->fetchAll(
            'SELECT project_id, access_level FROM user_project_access WHERE user_id = ?',
            [$user['id']]
        );
        $projects = [];
        foreach ($projectAccess as $pa) {
            $projects[$pa['project_id']] = $pa['access_level'];
        }

        unset($user['password_hash']);

        ApiResponse::success([
            'token' => $jwt['token'],
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role_slug'],
                'role_name' => $user['role_name'],
                'role_id' => (int) $user['role_id'],
                'department' => $user['department'],
                'permissions' => array_column($permissions, 'slug'),
                'project_access' => $projects,
            ],
        ], 'Login successful');
        break;

    case 'auth.me':
        $user = AuthMiddleware::authenticate();
        ApiResponse::success([
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'role_name' => $user['role_name'],
            'role_id' => (int) $user['role_id'],
            'department' => $user['department'],
            'permissions' => $user['permissions'],
            'project_access' => $user['project_access'],
        ]);
        break;

    case 'auth.logout':
        $user = AuthMiddleware::authenticate();
        $db = Database::getInstance();
        $db->insert('audit_logs', [
            'user_id' => $user['id'],
            'action' => 'user.logout',
            'entity_type' => 'user',
            'entity_id' => $user['id'],
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ]);
        // JWT is stateless — client should discard token
        ApiResponse::success(null, 'Logged out successfully');
        break;

    case 'auth.refresh':
        $user = AuthMiddleware::authenticate();
        $jwt = JWT::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'token_version' => (int)($user['token_version'] ?? 0),
        ]);
        ApiResponse::success(['token' => $jwt['token']], 'Token refreshed');
        break;

    case 'auth.change-password':
        $user = AuthMiddleware::authenticate();
        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';

        $db = Database::getInstance();
        $stored = $db->fetchColumn('SELECT password_hash FROM users WHERE id = ?', [$user['id']]);

        if (!password_verify($currentPassword, $stored)) {
            ApiResponse::error('Current password is incorrect', 401);
            exit;
        }

        try {
            PasswordValidator::validate($newPassword);
        } catch (\InvalidArgumentException $e) {
            ApiResponse::error($e->getMessage(), 400);
            exit;
        }

        $db->update('users', ['password_hash' => password_hash($newPassword, PASSWORD_DEFAULT)], 'id = ?', [$user['id']]);

        $db->update('users', ['token_version' => $user['token_version'] + 1], 'id = ?', [$user['id']]);

        $db->insert('audit_logs', [
            'user_id' => $user['id'],
            'action' => 'user.change_password',
            'entity_type' => 'user',
            'entity_id' => $user['id'],
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ]);

        ApiResponse::success(null, 'Password changed successfully');
        break;

    default:
        ApiResponse::error('Unknown auth action', 404);
}
