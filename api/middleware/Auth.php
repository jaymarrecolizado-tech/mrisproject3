<?php
/**
 * DICT MRIS — Auth Middleware
 * Validates JWT from Authorization header and attaches user to request
 */

class AuthMiddleware {
    private static ?array $currentUser = null;

    public static function authenticate(): array {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        // Get Authorization header from various possible locations
        $header = $_SERVER['HTTP_AUTHORIZATION'] 
               ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 
               ?? '';
        if (!$header && function_exists('getallheaders')) {
            $headers = getallheaders();
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            http_response_code(401);
            self::json(['error' => 'Unauthorized', 'message' => 'Missing or invalid Authorization header']);
            exit;
        }

        $token = $matches[1];
        $payload = JWT::decode($token);

        if (!$payload) {
            http_response_code(401);
            self::json(['error' => 'Unauthorized', 'message' => 'Invalid or expired token']);
            exit;
        }

        $db = Database::getInstance();
        $user = $db->fetchOne(
            'SELECT u.id, u.name, u.email, u.role_id, u.department, u.is_active, r.slug as role_slug, r.name as role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.id = ?',
            [$payload['sub']]
        );

        if (!$user || !$user['is_active']) {
            http_response_code(401);
            self::json(['error' => 'Unauthorized', 'message' => 'User not found or inactive']);
            exit;
        }

        // Load permissions
        $permissions = $db->fetchAll(
            'SELECT p.slug FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?',
            [$user['role_id']]
        );
        $user['permissions'] = array_column($permissions, 'slug');

        // Load project access
        $projectAccess = $db->fetchAll(
            'SELECT project_id, access_level FROM user_project_access WHERE user_id = ?',
            [$user['id']]
        );
        $user['project_access'] = [];
        foreach ($projectAccess as $pa) {
            $user['project_access'][$pa['project_id']] = $pa['access_level'];
        }

        self::$currentUser = $user;
        return $user;
    }

    public static function hasPermission(string $permission): bool {
        $user = self::authenticate();
        return in_array($permission, $user['permissions']);
    }

    public static function hasProjectAccess(int $projectId, string $minLevel = 'view'): bool {
        $user = self::authenticate();
        if (in_array('projects.manage', $user['permissions'])) return true; // super admin

        $level = $user['project_access'][$projectId] ?? null;
        if (!$level) return false;

        $levels = ['view' => 1, 'edit' => 2, 'admin' => 3];
        return ($levels[$level] ?? 0) >= ($levels[$minLevel] ?? 0);
    }

    public static function getCurrentUser(): array {
        return self::authenticate();
    }

    public static function optional(): ?array {
        try {
            return self::authenticate();
        } catch (Exception $e) {
            return null;
        }
    }

    private static function json(array $data): void {
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
