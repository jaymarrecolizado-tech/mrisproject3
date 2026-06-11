<?php
/**
 * DICT MRIS — API Entry Point
 * Handles CORS, routing, and dispatches to route handlers
 *
 * Usage: All requests go to /api/index.php?action=<resource>&method=<method>&id=<id>
 * Or use pretty URLs with .htaccess rewriting
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load environment variables
require_once __DIR__ . '/config/env.php';
loadEnv();

// Override with root .env if exists
if (file_exists(__DIR__ . '/../../.env')) {
    $envPath = __DIR__ . '/../../.env';
    $envContent = file_get_contents($envPath);
    putenv($envContent);
}

require_once __DIR__ . '/helpers/ApiResponse.php';

// CORS headers - Security: explicit origins only, no wildcard with credentials
$corsOrigin = env('CORS_ORIGIN');
if ($corsOrigin === null || $corsOrigin === '' || $corsOrigin === '*') {
    error_log('[CORS] CORS_ORIGIN is not configured or set to wildcard in .env. This is a security risk.');
    ApiResponse::error('Server configuration error: CORS must be explicitly configured', 500);
    exit;
}
$allowedOrigins = array_map('trim', explode(',', $corsOrigin));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isAllowedOrigin = false;

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    $isAllowedOrigin = true;
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    // Vary header required when Access-Control-Allow-Origin is dynamic
    header('Vary: Origin');
}

// For non-credentialed requests (e.g., health checks), allow if no origin or allowed
if (!$isAllowedOrigin && $origin === '') {
    header('Access-Control-Allow-Credentials: false');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    SecurityHeaders::applyForCorsPreflight();
    http_response_code(204);
    exit;
}

// Autoload
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/helpers/JWT.php';
require_once __DIR__ . '/helpers/RateLimiter.php';
require_once __DIR__ . '/middleware/Auth.php';
require_once __DIR__ . '/middleware/SecurityHeaders.php';

// Apply security headers to all responses
SecurityHeaders::apply();

// Configure JWT from environment
$jwtSecret = env('JWT_SECRET');
if (empty($jwtSecret)) {
    error_log('[JWT] JWT_SECRET is not configured in .env');
    ApiResponse::error('Server configuration error', 500);
    exit;
}
JWT::setSecret($jwtSecret);
JWT::setAlgorithm(env('JWT_ALGORITHM', 'HS256'));
JWT::setIssuer(env('JWT_ISSUER', 'dict-mris'));
JWT::setAudience(env('JWT_AUDIENCE', 'dict-mris-app'));
JWT::setAccessExpiry((int)env('JWT_ACCESS_EXPIRY', 900));      // 15 min default
JWT::setRefreshExpiry((int)env('JWT_REFRESH_EXPIRY', 604800));  // 7 days default

// Get action and method from query string or JSON body
$action = $_GET['action'] ?? '';
$method = $_GET['method'] ?? $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// Parse JSON body for POST/PUT/PATCH
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route mapping
$routes = [
    // Auth
    'auth.login' => ['routes/auth.php', 'POST'],
    'auth.me' => ['routes/auth.php', 'GET'],
    'auth.logout' => ['routes/auth.php', 'POST'],
    'auth.refresh' => ['routes/auth.php', 'POST'],
    'auth.change-password' => ['routes/auth.php', 'POST'],
    'auth.forgot-password' => ['routes/auth.php', 'POST'],
    'auth.reset-password' => ['routes/auth.php', 'POST'],

    // Users
    'users.list' => ['routes/users.php', 'GET'],
    'users.get' => ['routes/users.php', 'GET'],
    'users.create' => ['routes/users.php', 'POST'],
    'users.update' => ['routes/users.php', 'PUT'],
    'users.delete' => ['routes/users.php', 'DELETE'],

    // Roles
    'roles.list' => ['routes/roles.php', 'GET'],
    'roles.get' => ['routes/roles.php', 'GET'],
    'roles.update' => ['routes/roles.php', 'PUT'],

    // Projects
    'projects.list' => ['routes/projects.php', 'GET'],
    'projects.get' => ['routes/projects.php', 'GET'],
    'projects.create' => ['routes/projects.php', 'POST'],
    'projects.update' => ['routes/projects.php', 'PUT'],
    'projects.delete' => ['routes/projects.php', 'DELETE'],
    'projects.stats' => ['routes/projects.php', 'GET'],

    // Sites
    'sites.list' => ['routes/sites.php', 'GET'],
    'sites.get' => ['routes/sites.php', 'GET'],
    'sites.create' => ['routes/sites.php', 'POST'],
    'sites.update' => ['routes/sites.php', 'PUT'],
    'sites.delete' => ['routes/sites.php', 'DELETE'],
    'sites.map-data' => ['routes/sites.php', 'GET'],
    'sites.import' => ['routes/sites.php', 'POST'],
    'sites.export' => ['routes/sites.php', 'GET'],

    // Photos
    'photos.upload' => ['routes/photos.php', 'POST'],
    'photos.list' => ['routes/photos.php', 'GET'],
    'photos.delete' => ['routes/photos.php', 'DELETE'],
    'sites.geo-filters' => ['routes/sites.php', 'GET'],
    'sites.regions' => ['routes/sites.php', 'GET'],

    // Free WiFi Daily Logs
    'logs.list' => ['routes/logs.php', 'GET'],
    'logs.get' => ['routes/logs.php', 'GET'],
    'logs.create' => ['routes/logs.php', 'POST'],
    'logs.update' => ['routes/logs.php', 'PUT'],
    'logs.delete' => ['routes/logs.php', 'DELETE'],
    'logs.bulk-import' => ['routes/logs.php', 'POST'],
    'logs.daily-summary' => ['routes/logs.php', 'GET'],
    'logs.site-logs' => ['routes/logs.php', 'GET'],
    'logs.export' => ['routes/logs.php', 'GET'],

    // Dict Project Entries
    'entries.list' => ['routes/entries.php', 'GET'],
    'entries.get' => ['routes/entries.php', 'GET'],
    'entries.create' => ['routes/entries.php', 'POST'],
    'entries.update' => ['routes/entries.php', 'PUT'],
    'entries.delete' => ['routes/entries.php', 'DELETE'],

    // Milestones
    'milestones.list' => ['routes/milestones.php', 'GET'],
    'milestones.get' => ['routes/milestones.php', 'GET'],
    'milestones.create' => ['routes/milestones.php', 'POST'],
    'milestones.update' => ['routes/milestones.php', 'PUT'],
    'milestones.delete' => ['routes/milestones.php', 'DELETE'],

    // Dashboard
    'dashboard.stats' => ['routes/dashboard.php', 'GET'],
    'dashboard.trends' => ['routes/dashboard.php', 'GET'],
    'dashboard.daily' => ['routes/dashboard.php', 'GET'],
    'dashboard.regional' => ['routes/dashboard.php', 'GET'],
    'dashboard.milestones' => ['routes/dashboard.php', 'GET'],

    // Reports
    'reports.list' => ['routes/reports.php', 'GET'],
    'reports.generate' => ['routes/reports.php', 'POST'],
    'reports.download' => ['routes/reports.php', 'GET'],
    'reports.delete' => ['routes/reports.php', 'DELETE'],

    // Audit
    'audit.list' => ['routes/audit.php', 'GET'],

    // Notifications
    'notifications.list' => ['routes/notifications.php', 'GET'],
    'notifications.mark-read' => ['routes/notifications.php', 'POST'],
    'notifications.mark-all-read' => ['routes/notifications.php', 'POST'],
    'notifications.delete' => ['routes/notifications.php', 'DELETE'],
    'notifications.unread-count' => ['routes/notifications.php', 'GET'],

    // Permissions
    'permissions.list' => ['routes/permissions.php', 'GET'],
];

// Resolve route
$routeKey = $action;
if (!isset($routes[$routeKey])) {
    // Try to match by pattern: resource.method
    $parts = explode('.', $action);
    if (count($parts) === 2) {
        $routeKey = $action;
    }
}

if (!isset($routes[$routeKey])) {
    ApiResponse::error('Route not found: ' . $action, 404);
    exit;
}

[$routeFile, $expectedMethod] = $routes[$routeKey];

if (!file_exists(__DIR__ . '/' . $routeFile)) {
    ApiResponse::error('Route handler not found', 500);
    exit;
}

// Brute-force hardening: throttle public auth endpoints per request IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if ($routeKey === 'auth.login' && !RateLimiter::check($ip, 5, 900)) {
    ApiResponse::error('Too many login attempts. Please try again later.', 429);
    exit;
} elseif (!in_array($expectedMethod, ['GET', 'OPTIONS'], true) && !RateLimiter::check($ip, 60, 60)) {
    ApiResponse::error('Too many requests', 429);
    exit;
}

require_once __DIR__ . '/' . $routeFile;
