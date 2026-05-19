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

        $reportType = $input['report_type'] ?? $input['type'] ?? '';
        $format = strtoupper($input['format'] ?? 'CSV');
        $dateFrom = $input['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $input['date_to'] ?? date('Y-m-d');
        $projectId = $input['project_id'] ?? null;
        $title = $input['title'] ?? ucfirst(str_replace('_', ' ', $reportType)) . ' Report';

        $validTypes = ['daily_status', 'weekly_summary', 'monthly_accomplishment', 'regional_breakdown',
                       'isp_performance', 'project_completion', 'audit_trail'];
        if (!in_array($reportType, $validTypes)) {
            ApiResponse::error('Invalid report type', 400);
            exit;
        }

        // Generate report data based on type
        $reportData = null;
        $headers = [];
        switch ($reportType) {
            case 'daily_status':
                $reportData = $db->fetchAll(
                    'SELECT * FROM vw_free_wifi_daily_summary
                     WHERE log_date BETWEEN ? AND ?
                     ORDER BY log_date',
                    [$dateFrom, $dateTo]
                );
                $headers = ['Date', 'Total Sites', 'UP', 'DOWN', 'Partial', 'Total Users', 'Avg Bandwidth'];
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
                $headers = ['Island Group', 'Total Sites', 'UP', 'DOWN', 'Avg Bandwidth'];
                break;

            case 'project_completion':
                $reportData = $db->fetchAll(
                    'SELECT * FROM vw_project_accomplishment'
                );
                $headers = ['Project ID', 'Code', 'Name', 'Total Sites', 'Active Sites', 'Down Sites', 'Avg Completion'];
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
                $headers = ['ISP Provider', 'Total Sites', 'UP', 'Uptime %', 'Avg Bandwidth'];
                break;

            case 'audit_trail':
                $reportData = $db->fetchAll(
                    'SELECT a.*, u.name as user_name, u.email as user_email
                     FROM audit_logs a
                     LEFT JOIN users u ON u.id = a.user_id
                     WHERE a.created_at BETWEEN ? AND ?
                     ORDER BY a.created_at DESC',
                    [$dateFrom, $dateTo]
                );
                $headers = ['ID', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Date'];
                break;

            default:
                $reportData = ['message' => 'Report type generated successfully'];
                $headers = ['Message'];
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

        // For CSV format, output directly as CSV file
        if ($format === 'CSV' && is_array($reportData) && count($reportData) > 0) {
            $filename = strtolower(str_replace(' ', '_', $title)) . '_' . date('Y-m-d') . '.csv';
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-cache, must-revalidate');

            $output = fopen('php://output', 'w');
            // BOM for Excel UTF-8
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($output, $headers);
            foreach ($reportData as $row) {
                $values = [];
                foreach ($headers as $h) {
                    $key = strtolower(str_replace(' ', '_', $h));
                    $values[] = $row[$key] ?? $row[$headers[0] === 'Date' ? 'log_date' : array_key_first($row)] ?? '';
                }
                fputcsv($output, $values);
            }
            fclose($output);
            exit;
        }

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
