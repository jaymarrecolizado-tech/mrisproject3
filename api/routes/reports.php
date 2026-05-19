<?php
/**
 * Reports Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'reports.list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $total = $db->fetchColumn('SELECT COUNT(*) FROM generated_reports');
        $reports = $db->fetchAll(
            'SELECT gr.*, u.name as generated_by_name
             FROM generated_reports gr
             LEFT JOIN users u ON u.id = gr.generated_by
             ORDER BY gr.created_at DESC
             LIMIT ? OFFSET ?',
            [$perPage, $offset]
        );

        ApiResponse::paginated($reports, (int) $total, $page, $perPage);
        break;

    case 'reports.generate':
        if (!AuthMiddleware::hasPermission('reports.generate')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }

        $reportType = $input['report_type'] ?? '';
        $format = $input['format'] ?? 'PDF';
        $dateFrom = $input['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $input['date_to'] ?? date('Y-m-d');
        $projectId = $input['project_id'] ?? null;
        $title = $input['title'] ?? ucfirst($reportType) . ' Report';

        $validTypes = ['daily_status', 'weekly_summary', 'monthly_accomplishment', 'regional_breakdown',
                       'isp_performance', 'project_completion', 'audit_trail'];
        if (!in_array($reportType, $validTypes)) {
            ApiResponse::error('Invalid report type', 400);
            exit;
        }

        // Generate report data based on type
        $reportData = null;
        switch ($reportType) {
            case 'daily_status':
                $reportData = $db->fetchAll(
                    'SELECT * FROM vw_free_wifi_daily_summary
                     WHERE log_date BETWEEN ? AND ?
                     ORDER BY log_date',
                    [$dateFrom, $dateTo]
                );
                break;

            case 'regional_breakdown':
                $reportData = $db->fetchAll(
                    'SELECT island_group,
                            COUNT(*) as total_sites,
                            SUM(CASE WHEN status = "UP" THEN 1 ELSE 0 END) as up_sites,
                            SUM(CASE WHEN status = "DOWN" THEN 1 ELSE 0 END) as down_sites,
                            ROUND(AVG(bw_download), 2) as avg_bandwidth
                     FROM sites
                     GROUP BY island_group'
                );
                break;

            case 'project_completion':
                $reportData = $db->fetchAll(
                    'SELECT * FROM vw_project_accomplishment'
                );
                break;

            case 'isp_performance':
                $reportData = $db->fetchAll(
                    'SELECT isp_provider,
                            COUNT(*) as total_sites,
                            SUM(CASE WHEN status = "UP" THEN 1 ELSE 0 END) as up_sites,
                            ROUND(SUM(CASE WHEN status = "UP" THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as uptime_pct,
                            ROUND(AVG(bw_download), 2) as avg_bandwidth
                     FROM sites
                     WHERE isp_provider IS NOT NULL AND isp_provider != ""
                     GROUP BY isp_provider'
                );
                break;

            default:
                $reportData = ['message' => 'Report type generated successfully'];
        }

        // Save report record
        $reportId = $db->insert('generated_reports', [
            'report_type' => $reportType,
            'title' => $title,
            'format' => $format,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'generated_by' => AuthMiddleware::getCurrentUser()['id'],
        ]);

        ApiResponse::success([
            'id' => $reportId,
            'data' => $reportData,
            'format' => $format,
        ], 'Report generated', 201);
        break;

    case 'reports.download':
        $reportId = $id ?? $_GET['id'] ?? null;
        if (!$reportId) {
            ApiResponse::error('Report ID required', 400);
            exit;
        }
        $report = $db->fetchOne('SELECT * FROM generated_reports WHERE id = ?', [$reportId]);
        if (!$report) {
            ApiResponse::error('Report not found', 404);
            exit;
        }
        ApiResponse::success($report);
        break;

    case 'reports.delete':
        if (!AuthMiddleware::hasPermission('reports.generate')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $reportId = $id ?? $_GET['id'] ?? null;
        if (!$reportId) {
            ApiResponse::error('Report ID required', 400);
            exit;
        }
        $db->delete('generated_reports', 'id = ?', [$reportId]);
        ApiResponse::success(null, 'Report deleted');
        break;

    default:
        ApiResponse::error('Unknown reports action', 404);
}
