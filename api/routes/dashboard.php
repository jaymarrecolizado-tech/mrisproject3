<?php
/**
 * Dashboard Routes: stats, trends, regional
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'dashboard.stats':
        $stats = $db->fetchOne("CALL sp_get_dashboard_stats()");
        ApiResponse::success($stats);
        break;

    case 'dashboard.trends':
    case 'dashboard.daily':
        $days = (int)($_GET['days'] ?? 30);
        $trends = $db->fetchAll(
            'SELECT log_date as date, total_sites, up_count, down_count, partial_count, total_users, avg_bandwidth
             FROM vw_free_wifi_daily_summary
             WHERE log_date >= CURDATE() - INTERVAL ? DAY
             ORDER BY log_date ASC',
            [$days]
        );
        ApiResponse::success($trends);
        break;

    case 'dashboard.regional':
        $regional = $db->fetchAll("CALL sp_get_regional_stats(NULL)");
        ApiResponse::success($regional);
        break;

    default:
        ApiResponse::error('Unknown dashboard action', 404);
}
