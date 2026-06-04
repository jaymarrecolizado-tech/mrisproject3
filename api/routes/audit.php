<?php
/**
 * Audit Log Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();

if (!AuthMiddleware::hasPermission('audit.view')) {
    ApiResponse::error('Forbidden', 403);
    exit;
}

$db = Database::getInstance();

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(100, max(10, (int)($_GET['per_page'] ?? 20)));
$offset = ($page - 1) * $perPage;

$where = ['1=1'];
$params = [];

if (!empty($_GET['user_id'])) {
    $where[] = 'a.user_id = ?';
    $params[] = $_GET['user_id'];
}
if (!empty($_GET['action'])) {
    $where[] = 'a.action LIKE ?';
    $params[] = '%' . $_GET['action'] . '%';
}
if (!empty($_GET['entity_type'])) {
    $where[] = 'a.entity_type = ?';
    $params[] = $_GET['entity_type'];
}
if (!empty($_GET['date_from'])) {
    $where[] = 'a.created_at >= ?';
    $params[] = $_GET['date_from'];
}
if (!empty($_GET['date_to'])) {
    $where[] = 'a.created_at <= ?';
    $params[] = $_GET['date_to'];
}

$whereClause = implode(' AND ', $where);
$total = $db->fetchColumn("SELECT COUNT(*) FROM audit_logs a WHERE {$whereClause}", $params);

$logs = $db->paginate(
    "SELECT a.*, u.name as user_name, u.email as user_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE {$whereClause}
     ORDER BY a.created_at DESC",
    $params,
    $perPage,
    $offset
);

ApiResponse::paginated($logs, (int) $total, $page, $perPage);

