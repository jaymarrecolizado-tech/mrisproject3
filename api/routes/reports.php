<?php
/**
 * Reports Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

// PDF support
$fpdfPath = __DIR__ . '/../lib/fpdf.php';
$hasFPDF = file_exists($fpdfPath);
if ($hasFPDF) {
    require_once $fpdfPath;
    define('FPDF_FONTPATH', __DIR__ . '/../lib/font/');
}

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

        $reportType = $input['report_type'] ?? $_GET['report_type'] ?? '';
        $format = strtoupper($input['format'] ?? $_GET['format'] ?? 'CSV');
        $dateFrom = $input['date_from'] ?? $_GET['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $input['date_to'] ?? $_GET['date_to'] ?? date('Y-m-d');
        $projectId = $input['project_id'] ?? $_GET['project_id'] ?? null;
        $title = $input['title'] ?? ucfirst(str_replace('_', ' ', $reportType)) . ' Report';

        $validTypes = ['daily_status', 'weekly_summary', 'monthly_accomplishment', 'regional_breakdown',
                       'isp_performance', 'project_completion', 'audit_trail', 'site_implementation'];
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

            case 'weekly_summary':
                $reportData = $db->fetchAll(
                    "SELECT 
                        YEAR(log_date) as year,
                        WEEK(log_date) as week,
                        MIN(log_date) as week_start,
                        MAX(log_date) as week_end,
                        COUNT(DISTINCT site_id) as total_sites,
                        ROUND(SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as uptime_pct,
                        COALESCE(SUM(total_unique_users), 0) as total_users,
                        COALESCE(ROUND(AVG(bandwidth_utilization), 2), 0) as avg_bandwidth
                     FROM free_wifi_daily_logs
                     WHERE log_date BETWEEN ? AND ?
                     GROUP BY YEAR(log_date), WEEK(log_date)
                     ORDER BY year DESC, week DESC",
                    [$dateFrom, $dateTo]
                );
                $headers = ['Year', 'Week', 'Week Start', 'Week End', 'Total Sites', 'Uptime %', 'Total Users', 'Avg Bandwidth'];
                break;

            case 'monthly_accomplishment':
                $reportData = $db->fetchAll(
                    "SELECT 
                        p.name as project_name,
                        m.title as milestone_title,
                        m.status as milestone_status,
                        m.target_date,
                        m.actual_date,
                        COALESCE(e.accomplishment_percent, 0) as accomplishment_percent,
                        e.entry_date
                     FROM projects p
                     JOIN milestones m ON m.project_id = p.id
                     LEFT JOIN dict_project_entries e ON e.project_id = p.id AND e.entry_date BETWEEN ? AND ?
                     WHERE p.type = 'milestone' AND p.is_active = 1
                     ORDER BY p.name, m.target_date",
                    [$dateFrom, $dateTo]
                );
                $headers = ['Project Name', 'Milestone', 'Status', 'Target Date', 'Actual Date', 'Accomplishment %', 'Entry Date'];
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

            case 'site_implementation':
                $geoWhere = ['s.id IS NOT NULL'];
                $geoParams = [];
                if (!empty($input['province']) || !empty($_GET['province'])) {
                    $geoWhere[] = 's.province = ?';
                    $geoParams[] = $input['province'] ?? $_GET['province'];
                }
                if (!empty($input['municipality']) || !empty($_GET['municipality'])) {
                    $geoWhere[] = 's.municipality = ?';
                    $geoParams[] = $input['municipality'] ?? $_GET['municipality'];
                }
                if (!empty($input['district']) || !empty($_GET['district'])) {
                    $geoWhere[] = 's.district = ?';
                    $geoParams[] = $input['district'] ?? $_GET['district'];
                }
                if ($projectId) {
                    $geoWhere[] = 's.project_id = ?';
                    $geoParams[] = $projectId;
                }
                $geoClause = implode(' AND ', $geoWhere);
                $reportData = $db->fetchAll(
                    "SELECT s.site_code, s.site_name, s.location_name, p.name as project_name,
                            s.barangay, s.municipality, s.province, s.district, s.island_group,
                            s.site_type, s.isp_provider, s.last_mile_tech, s.bw_download,
                            s.status, s.last_updated,
                            COALESCE(l.total_users, 0) as latest_users,
                            COALESCE(e.accomplishment_percent, 0) as accomplishment_percent,
                            COALESCE(e.status, '-') as entry_status,
                            eu.name as entry_updated_by
                     FROM sites s
                     JOIN projects p ON p.id = s.project_id
                     LEFT JOIN (
                         SELECT site_id, total_unique_users as total_users
                         FROM free_wifi_daily_logs l1
                         WHERE log_date = (SELECT MAX(log_date) FROM free_wifi_daily_logs l2 WHERE l2.site_id = l1.site_id)
                     ) l ON l.site_id = s.id
                     LEFT JOIN (
                         SELECT site_id, accomplishment_percent, status, updated_by
                         FROM dict_project_entries e1
                         WHERE id = (SELECT MAX(id) FROM dict_project_entries e2 WHERE e2.site_id = e1.site_id)
                     ) e ON e.site_id = s.id
                     LEFT JOIN users eu ON eu.id = e.updated_by
                     WHERE {$geoClause}
                     ORDER BY s.province, s.municipality, s.site_code",
                    $geoParams
                );
                $headers = ['Site Code', 'Site Name', 'Location', 'Project', 'Barangay', 'Municipality',
                            'Province', 'District', 'Island Group', 'Site Type', 'ISP', 'Technology',
                            'Bandwidth (Mbps)', 'Status', 'Last Updated', 'Latest Users',
                            'Accomplishment %', 'Entry Status', 'Last Updated By'];
                break;

            default:
                $reportData = ['message' => 'Report type generated successfully'];
                $headers = ['Message'];
        }

        // Save report record
        $reportId = $db->insert('generated_reports', [
            'report_type' => $reportType,
            'title'       => $title,
            'format'      => $format,
            'date_from'   => $dateFrom,
            'date_to'     => $dateTo,
            'generated_by' => AuthMiddleware::getCurrentUser()['id'],
        ]);

        // Explicit header → DB column maps per report type
        $columnMaps = [
            'daily_status'           => [
                'Date'          => 'log_date',
                'Total Sites'   => 'total_sites',
                'UP'            => 'up_count',
                'DOWN'          => 'down_count',
                'Partial'       => 'partial_count',
                'Total Users'   => 'total_users',
                'Avg Bandwidth' => 'avg_bandwidth',
            ],
            'weekly_summary'         => [
                'Year'          => 'year',
                'Week'          => 'week',
                'Week Start'    => 'week_start',
                'Week End'      => 'week_end',
                'Total Sites'   => 'total_sites',
                'Uptime %'      => 'uptime_pct',
                'Total Users'   => 'total_users',
                'Avg Bandwidth' => 'avg_bandwidth',
            ],
            'monthly_accomplishment' => [
                'Project Name'      => 'project_name',
                'Milestone'         => 'milestone_title',
                'Status'            => 'milestone_status',
                'Target Date'       => 'target_date',
                'Actual Date'       => 'actual_date',
                'Accomplishment %'  => 'accomplishment_percent',
                'Entry Date'        => 'entry_date',
            ],
            'regional_breakdown'     => [
                'Island Group'  => 'island_group',
                'Total Sites'   => 'total_sites',
                'UP'            => 'up_sites',
                'DOWN'          => 'down_sites',
                'Avg Bandwidth' => 'avg_bandwidth',
            ],
            'project_completion'     => [
                'Project ID'    => 'project_id',
                'Code'          => 'code',
                'Name'          => 'name',
                'Total Sites'   => 'total_sites',
                'Active Sites'  => 'active_sites',
                'Down Sites'    => 'down_sites',
                'Avg Completion'=> 'avg_completion',
            ],
            'isp_performance'        => [
                'ISP Provider'  => 'isp_provider',
                'Total Sites'   => 'total_sites',
                'UP'            => 'up_sites',
                'Uptime %'      => 'uptime_pct',
                'Avg Bandwidth' => 'avg_bandwidth',
            ],
            'audit_trail'            => [
                'ID'            => 'id',
                'User'          => 'user_name',
                'Email'         => 'user_email',
                'Action'        => 'action',
                'Entity Type'   => 'entity_type',
                'Entity ID'     => 'entity_id',
                'IP Address'    => 'ip_address',
                'Date'          => 'created_at',
            ],
            'site_implementation'    => [
                'Site Code'         => 'site_code',
                'Site Name'         => 'site_name',
                'Location'          => 'location_name',
                'Project'           => 'project_name',
                'Barangay'          => 'barangay',
                'Municipality'      => 'municipality',
                'Province'          => 'province',
                'District'          => 'district',
                'Island Group'      => 'island_group',
                'Site Type'         => 'site_type',
                'ISP'               => 'isp_provider',
                'Technology'        => 'last_mile_tech',
                'Bandwidth (Mbps)'  => 'bw_download',
                'Status'            => 'status',
                'Last Updated'      => 'last_updated',
                'Latest Users'      => 'latest_users',
                'Accomplishment %'  => 'accomplishment_percent',
                'Entry Status'      => 'entry_status',
                'Last Updated By'   => 'entry_updated_by',
            ],
        ];

        // For PDF format, generate with FPDF
        if ($format === 'PDF' && $hasFPDF && is_array($reportData) && count($reportData) > 0) {
            $pdf = new FPDF('L', 'mm', 'A4');
            $pdf->SetAutoPageBreak(true, 15);
            $pdf->AddPage();

            // Title
            $pdf->SetFont('Helvetica', 'B', 14);
            $pdf->Cell(0, 10, $title, 0, 1, 'C');
            $pdf->SetFont('Helvetica', '', 8);
            $pdf->Cell(0, 5, "Date Range: {$dateFrom} to {$dateTo} | Generated: " . date('Y-m-d H:i:s'), 0, 1, 'C');
            $pdf->Ln(5);

            // Headers
            $colMap = $columnMaps[$reportType] ?? null;
            $colLabels = $colMap ? array_keys($colMap) : $headers;
            $colCount = count($colLabels);
            $colWidth = min(floor(270 / $colCount), 50);

            $pdf->SetFont('Helvetica', 'B', 7);
            $pdf->SetFillColor(41, 65, 122);
            $pdf->SetTextColor(255, 255, 255);
            foreach ($colLabels as $h) {
                $pdf->Cell($colWidth, 6, substr($h, 0, 25), 1, 0, 'C', true);
            }
            $pdf->Ln();

            // Rows
            $pdf->SetFont('Helvetica', '', 7);
            $pdf->SetTextColor(0, 0, 0);
            $rowIdx = 0;
            foreach ($reportData as $row) {
                if ($rowIdx % 2 === 0) {
                    $pdf->SetFillColor(245, 247, 250);
                } else {
                    $pdf->SetFillColor(255, 255, 255);
                }
                if ($colMap) {
                    foreach ($colMap as $col) {
                        $val = (string)($row[$col] ?? '');
                        $pdf->Cell($colWidth, 5, substr($val, 0, 35), 1, 0, 'L', true);
                    }
                } else {
                    foreach (array_values($row) as $val) {
                        $pdf->Cell($colWidth, 5, substr((string)$val, 0, 35), 1, 0, 'L', true);
                    }
                }
                $pdf->Ln();
                $rowIdx++;
            }

            // Footer
            $pdf->SetY(-15);
            $pdf->SetFont('Helvetica', 'I', 7);
            $pdf->SetTextColor(150, 150, 150);
            $pdf->Cell(0, 10, 'DICT MRIS - Region 2 | Page ' . $pdf->PageNo(), 0, 0, 'C');

            $filename = strtolower(str_replace(' ', '_', $title)) . '_' . date('Y-m-d') . '.pdf';
            $pdf->Output('D', $filename);
            exit;
        }

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

            $colMap = $columnMaps[$reportType] ?? null;
            foreach ($reportData as $row) {
                $values = [];
                if ($colMap) {
                    foreach ($colMap as $col) {
                        $values[] = $row[$col] ?? '';
                    }
                } else {
                    // Fallback: dump all values
                    $values = array_values($row);
                }
                fputcsv($output, $values);
            }
            fclose($output);
            exit;
        }

        ApiResponse::success([
            'id'     => $reportId,
            'data'   => $reportData,
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

        $reportType = $report['report_type'] ?? '';
        $format = strtoupper($report['format'] ?? 'CSV');
        $title = $report['title'] ?? 'Report';
        $dateFrom = $report['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $report['date_to'] ?? date('Y-m-d');

        $validTypes = ['daily_status', 'weekly_summary', 'monthly_accomplishment', 'regional_breakdown',
                       'isp_performance', 'project_completion', 'audit_trail', 'site_implementation'];
        if (!in_array($reportType, $validTypes)) {
            ApiResponse::error('Invalid report type', 400);
            exit;
        }

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

            case 'weekly_summary':
                $reportData = $db->fetchAll(
                    "SELECT 
                        YEAR(log_date) as year,
                        WEEK(log_date) as week,
                        MIN(log_date) as week_start,
                        MAX(log_date) as week_end,
                        COUNT(DISTINCT site_id) as total_sites,
                        ROUND(SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as uptime_pct,
                        COALESCE(SUM(total_unique_users), 0) as total_users,
                        COALESCE(ROUND(AVG(bandwidth_utilization), 2), 0) as avg_bandwidth
                     FROM free_wifi_daily_logs
                     WHERE log_date BETWEEN ? AND ?
                     GROUP BY YEAR(log_date), WEEK(log_date)
                     ORDER BY year DESC, week DESC",
                    [$dateFrom, $dateTo]
                );
                $headers = ['Year', 'Week', 'Week Start', 'Week End', 'Total Sites', 'Uptime %', 'Total Users', 'Avg Bandwidth'];
                break;

            case 'monthly_accomplishment':
                $reportData = $db->fetchAll(
                    "SELECT 
                        p.name as project_name,
                        m.title as milestone_title,
                        m.status as milestone_status,
                        m.target_date,
                        m.actual_date,
                        COALESCE(e.accomplishment_percent, 0) as accomplishment_percent,
                        e.entry_date
                     FROM projects p
                     JOIN milestones m ON m.project_id = p.id
                     LEFT JOIN dict_project_entries e ON e.project_id = p.id AND e.entry_date BETWEEN ? AND ?
                     WHERE p.type = 'milestone' AND p.is_active = 1
                     ORDER BY p.name, m.target_date",
                    [$dateFrom, $dateTo]
                );
                $headers = ['Project Name', 'Milestone', 'Status', 'Target Date', 'Actual Date', 'Accomplishment %', 'Entry Date'];
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

            case 'site_implementation':
                $geoWhere = ['s.id IS NOT NULL'];
                $geoParams = [];
                if (!empty($_GET['province'])) {
                    $geoWhere[] = 's.province = ?';
                    $geoParams[] = $_GET['province'];
                }
                if (!empty($_GET['municipality'])) {
                    $geoWhere[] = 's.municipality = ?';
                    $geoParams[] = $_GET['municipality'];
                }
                if (!empty($_GET['district'])) {
                    $geoWhere[] = 's.district = ?';
                    $geoParams[] = $_GET['district'];
                }
                $geoClause = implode(' AND ', $geoWhere);
                $reportData = $db->fetchAll(
                    "SELECT s.site_code, s.site_name, s.location_name, p.name as project_name,
                            s.barangay, s.municipality, s.province, s.district, s.island_group,
                            s.site_type, s.isp_provider, s.last_mile_tech, s.bw_download,
                            s.status, s.last_updated,
                            COALESCE(l.total_users, 0) as latest_users,
                            COALESCE(e.accomplishment_percent, 0) as accomplishment_percent,
                            COALESCE(e.status, '-') as entry_status,
                            eu.name as entry_updated_by
                     FROM sites s
                     JOIN projects p ON p.id = s.project_id
                     LEFT JOIN (
                         SELECT site_id, total_unique_users as total_users
                         FROM free_wifi_daily_logs l1
                         WHERE log_date = (SELECT MAX(log_date) FROM free_wifi_daily_logs l2 WHERE l2.site_id = l1.site_id)
                     ) l ON l.site_id = s.id
                     LEFT JOIN (
                         SELECT site_id, accomplishment_percent, status, updated_by
                         FROM dict_project_entries e1
                         WHERE id = (SELECT MAX(id) FROM dict_project_entries e2 WHERE e2.site_id = e1.site_id)
                     ) e ON e.site_id = s.id
                     LEFT JOIN users eu ON eu.id = e.updated_by
                     WHERE {$geoClause}
                     ORDER BY s.province, s.municipality, s.site_code",
                    $geoParams
                );
                $headers = ['Site Code', 'Site Name', 'Location', 'Project', 'Barangay', 'Municipality',
                            'Province', 'District', 'Island Group', 'Site Type', 'ISP', 'Technology',
                            'Bandwidth (Mbps)', 'Status', 'Last Updated', 'Latest Users',
                            'Accomplishment %', 'Entry Status', 'Last Updated By'];
                break;
        }

        if ($format === 'XLSX') {
            ApiResponse::error('XLSX download not implemented yet', 501);
            exit;
        }

        // Stream report as file download
        $safeTitle = preg_replace('/[^a-z0-9_]/i', '_', strtolower($title));
        $safeTitle = trim($safeTitle, '_') ?: 'report';
        $filename = $safeTitle . '_' . date('Y-m-d') . ($format === 'PDF' ? '.pdf' : '.csv');

        header('Content-Type: ' . ($format === 'PDF' ? 'application/pdf' : 'text/csv; charset=utf-8'));
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');

        if ($format === 'PDF') {
            $fpdfPath = __DIR__ . '/../lib/fpdf.php';
            $hasFPDF = file_exists($fpdfPath);
            if (!$hasFPDF || !is_array($reportData) || count($reportData) === 0) {
                echo '';
                exit;
            }

            require_once $fpdfPath;
            define('FPDF_FONTPATH', __DIR__ . '/../lib/font/');

            $pdf = new FPDF('L', 'mm', 'A4');
            $pdf->SetAutoPageBreak(true, 15);
            $pdf->AddPage();

            $pdf->SetFont('Helvetica', 'B', 14);
            $pdf->Cell(0, 10, $title, 0, 1, 'C');
            $pdf->SetFont('Helvetica', '', 8);
            $pdf->Cell(0, 5, 'Date Range: ' . $dateFrom . ' to ' . $dateTo . ' | Generated: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
            $pdf->Ln(5);

            $colMap = [
                'daily_status'           => ['Date' => 'log_date', 'Total Sites' => 'total_sites', 'UP' => 'up_count', 'DOWN' => 'down_count', 'Partial' => 'partial_count', 'Total Users' => 'total_users', 'Avg Bandwidth' => 'avg_bandwidth'],
                'weekly_summary'         => ['Year' => 'year', 'Week' => 'week', 'Week Start' => 'week_start', 'Week End' => 'week_end', 'Total Sites' => 'total_sites', 'Uptime %' => 'uptime_pct', 'Total Users' => 'total_users', 'Avg Bandwidth' => 'avg_bandwidth'],
                'monthly_accomplishment' => ['Project Name' => 'project_name', 'Milestone' => 'milestone_title', 'Status' => 'milestone_status', 'Target Date' => 'target_date', 'Actual Date' => 'actual_date', 'Accomplishment %' => 'accomplishment_percent', 'Entry Date' => 'entry_date'],
                'regional_breakdown'     => ['Island Group' => 'island_group', 'Total Sites' => 'total_sites', 'UP' => 'up_sites', 'DOWN' => 'down_sites', 'Avg Bandwidth' => 'avg_bandwidth'],
                'project_completion'     => ['Project ID' => 'project_id', 'Code' => 'code', 'Name' => 'name', 'Total Sites' => 'total_sites', 'Active Sites' => 'active_sites', 'Down Sites' => 'down_sites', 'Avg Completion' => 'avg_completion'],
                'isp_performance'        => ['ISP Provider' => 'isp_provider', 'Total Sites' => 'total_sites', 'UP' => 'up_sites', 'Uptime %' => 'uptime_pct', 'Avg Bandwidth' => 'avg_bandwidth'],
                'audit_trail'            => ['ID' => 'id', 'User' => 'user_name', 'Email' => 'user_email', 'Action' => 'action', 'Entity Type' => 'entity_type', 'Entity ID' => 'entity_id', 'IP Address' => 'ip_address', 'Date' => 'created_at'],
                'site_implementation'    => ['Site Code' => 'site_code', 'Site Name' => 'site_name', 'Location' => 'location_name', 'Project' => 'project_name', 'Barangay' => 'barangay', 'Municipality' => 'municipality', 'Province' => 'province', 'District' => 'district', 'Island Group' => 'island_group', 'Site Type' => 'site_type', 'ISP' => 'isp_provider', 'Technology' => 'last_mile_tech', 'Bandwidth (Mbps)' => 'bw_download', 'Status' => 'status', 'Last Updated' => 'last_updated', 'Latest Users' => 'latest_users', 'Accomplishment %' => 'accomplishment_percent', 'Entry Status' => 'entry_status', 'Last Updated By' => 'entry_updated_by'],
            ];
            $colMapUsed = $colMap[$reportType] ?? null;
            $colLabels = $colMapUsed ? array_keys($colMapUsed) : $headers;
            $colCount = count($colLabels);
            $colWidth = min((int)floor(270 / $colCount), 50);

            $pdf->SetFont('Helvetica', 'B', 7);
            $pdf->SetFillColor(41, 65, 122);
            $pdf->SetTextColor(255, 255, 255);
            foreach ($colLabels as $h) {
                $pdf->Cell($colWidth, 6, substr($h, 0, 25), 1, 0, 'C', true);
            }
            $pdf->Ln();

            $pdf->SetFont('Helvetica', '', 7);
            $pdf->SetTextColor(0, 0, 0);
            $rowIdx = 0;
            foreach ($reportData as $row) {
                $pdf->SetFillColor($rowIdx % 2 === 0 ? 245 : 255, $rowIdx % 2 === 0 ? 247 : 255, $rowIdx % 2 === 0 ? 250 : 255);
                if ($colMapUsed) {
                    foreach ($colMapUsed as $col) {
                        $val = (string)($row[$col] ?? '');
                        $pdf->Cell($colWidth, 5, substr($val, 0, 35), 1, 0, 'L', true);
                    }
                } else {
                    foreach (array_values($row) as $val) {
                        $pdf->Cell($colWidth, 5, substr((string)$val, 0, 35), 1, 0, 'L', true);
                    }
                }
                $pdf->Ln();
                $rowIdx++;
            }

            $pdf->SetY(-15);
            $pdf->SetFont('Helvetica', 'I', 7);
            $pdf->SetTextColor(150, 150, 150);
            $pdf->Cell(0, 10, 'DICT MRIS - Region 2 | Page ' . $pdf->PageNo(), 0, 0, 'C');

            $pdf->Output('D', $filename);
            exit;
        }

        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, $headers);

        $colMapCsv = [
            'daily_status'           => ['Date' => 'log_date', 'Total Sites' => 'total_sites', 'UP' => 'up_count', 'DOWN' => 'down_count', 'Partial' => 'partial_count', 'Total Users' => 'total_users', 'Avg Bandwidth' => 'avg_bandwidth'],
            'weekly_summary'         => ['Year' => 'year', 'Week' => 'week', 'Week Start' => 'week_start', 'Week End' => 'week_end', 'Total Sites' => 'total_sites', 'Uptime %' => 'uptime_pct', 'Total Users' => 'total_users', 'Avg Bandwidth' => 'avg_bandwidth'],
            'monthly_accomplishment' => ['Project Name' => 'project_name', 'Milestone' => 'milestone_title', 'Status' => 'milestone_status', 'Target Date' => 'target_date', 'Actual Date' => 'actual_date', 'Accomplishment %' => 'accomplishment_percent', 'Entry Date' => 'entry_date'],
            'regional_breakdown'     => ['Island Group' => 'island_group', 'Total Sites' => 'total_sites', 'UP' => 'up_sites', 'DOWN' => 'down_sites', 'Avg Bandwidth' => 'avg_bandwidth'],
            'project_completion'     => ['Project ID' => 'project_id', 'Code' => 'code', 'Name' => 'name', 'Total Sites' => 'total_sites', 'Active Sites' => 'active_sites', 'Down Sites' => 'down_sites', 'Avg Completion' => 'avg_completion'],
            'isp_performance'        => ['ISP Provider' => 'isp_provider', 'Total Sites' => 'total_sites', 'UP' => 'up_sites', 'Uptime %' => 'uptime_pct', 'Avg Bandwidth' => 'avg_bandwidth'],
            'audit_trail'            => ['ID' => 'id', 'User' => 'user_name', 'Email' => 'user_email', 'Action' => 'action', 'Entity Type' => 'entity_type', 'Entity ID' => 'entity_id', 'IP Address' => 'ip_address', 'Date' => 'created_at'],
            'site_implementation'    => ['Site Code' => 'site_code', 'Site Name' => 'site_name', 'Location' => 'location_name', 'Project' => 'project_name', 'Barangay' => 'barangay', 'Municipality' => 'municipality', 'Province' => 'province', 'District' => 'district', 'Island Group' => 'island_group', 'Site Type' => 'site_type', 'ISP' => 'isp_provider', 'Technology' => 'last_mile_tech', 'Bandwidth (Mbps)' => 'bw_download', 'Status' => 'status', 'Last Updated' => 'last_updated', 'Latest Users' => 'latest_users', 'Accomplishment %' => 'accomplishment_percent', 'Entry Status' => 'entry_status', 'Last Updated By' => 'entry_updated_by'],
        ];
        $colMapCsvUsed = $colMapCsv[$reportType] ?? null;
        foreach ($reportData ?? [] as $row) {
            $values = [];
            if ($colMapCsvUsed) {
                foreach ($colMapCsvUsed as $col) {
                    $values[] = $row[$col] ?? '';
                }
            } else {
                $values = array_values($row);
            }
            fputcsv($output, $values);
        }
        fclose($output);
        exit;

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
