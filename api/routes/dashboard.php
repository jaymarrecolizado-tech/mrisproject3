<?php
/**
 * Dashboard Routes: stats, trends, regional
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
if (!AuthMiddleware::hasPermission('dashboard.view')) {
    ApiResponse::error('Forbidden', 403);
    exit;
}
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

    case 'dashboard.milestones':
        $statusCounts = $db->fetchAll(
            'SELECT status, COUNT(*) as count FROM milestones GROUP BY status ORDER BY count DESC'
        );
        $monthlyTrend = $db->fetchAll(
            "SELECT DATE_FORMAT(COALESCE(actual_date, target_date), '%Y-%m') as month,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress
             FROM milestones
             WHERE COALESCE(actual_date, target_date) >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month"
        );
        ApiResponse::success(['status_counts' => $statusCounts, 'monthly_trend' => $monthlyTrend]);
        break;

    default:
        ApiResponse::error('Unknown dashboard action', 404);
}
