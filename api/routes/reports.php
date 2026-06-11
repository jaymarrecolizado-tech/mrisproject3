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
        $reports = $db->paginate(
            'SELECT gr.*, u.name as generated_by_name
             FROM generated_reports gr
             LEFT JOIN users u ON u.id = gr.generated_by
             ORDER BY gr.created_at DESC',
            [],
            $perPage,
            $offset
        );

        ApiResponse::paginated($reports, (int) $total, $page, $perPage);
        break;

    case 'reports.summary':
        if (!AuthMiddleware::hasPermission('reports.generate')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }

        $reportType = $input['report_type'] ?? $_GET['report_type'] ?? '';
        $dateFrom = $input['date_from'] ?? $_GET['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $input['date_to'] ?? $_GET['date_to'] ?? date('Y-m-d');
        $projectId = $input['project_id'] ?? $_GET['project_id'] ?? null;
        if ($projectId) {
            $projectRow = $db->fetchOne('SELECT id FROM projects WHERE id = ? OR LOWER(code) = ?', [(int)$projectId, strtolower((string)$projectId)]);
            $projectId = $projectRow ? (int)$projectRow['id'] : null;
        }
        $province = $input['province'] ?? $_GET['province'] ?? null;
        $municipality = $input['municipality'] ?? $_GET['municipality'] ?? null;
        $district = $input['district'] ?? $_GET['district'] ?? null;

        $validTypes = ['daily_status', 'weekly_summary', 'monthly_accomplishment', 'regional_breakdown',
                       'isp_performance', 'project_completion', 'audit_trail', 'site_implementation'];
        if (!in_array($reportType, $validTypes)) {
            ApiResponse::error('Invalid report type', 400);
            exit;
        }

        $summary = [
            'title' => ucfirst(str_replace('_', ' ', $reportType)) . ' Executive Summary',
            'metrics' => [],
            'charts' => [],
            'narrative' => '',
        ];

        switch ($reportType) {
            case 'daily_status':
                $siteJoin = '';
                $where = ['l.log_date BETWEEN ? AND ?'];
                $params = [$dateFrom, $dateTo];
                if ($projectId) {
                    $siteJoin .= ' LEFT JOIN sites s ON s.id = l.site_id';
                    $where[] = 's.project_id = ?';
                    $params[] = (int) $projectId;
                }
                if ($province) { $siteJoin .= ' LEFT JOIN sites sp ON sp.id = l.site_id'; $where[] = 'sp.province = ?'; $params[] = $province; }
                if ($municipality) { $siteJoin .= ' LEFT JOIN sites sm ON sm.id = l.site_id'; $where[] = 'sm.municipality = ?'; $params[] = $municipality; }
                if ($district) { $siteJoin .= ' LEFT JOIN sites sd ON sd.id = l.site_id'; $where[] = 'sd.district = ?'; $params[] = $district; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_sites,
                                                SUM(CASE WHEN l.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                                SUM(CASE WHEN l.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites,
                                                SUM(CASE WHEN l.status = 'PARTIAL' THEN 1 ELSE 0 END) AS partial_sites,
                                                COALESCE(SUM(l.total_unique_users), 0) AS total_users,
                                                COALESCE(ROUND(AVG(l.bandwidth_utilization), 2), 0) AS avg_bandwidth
                                         FROM free_wifi_daily_logs l {$siteJoin}
                                         WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT DATE_FORMAT(l.log_date, '%b %d') AS label,
                                               SUM(CASE WHEN l.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                               SUM(CASE WHEN l.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites,
                                               SUM(CASE WHEN l.status = 'PARTIAL' THEN 1 ELSE 0 END) AS partial_sites
                                        FROM free_wifi_daily_logs l {$siteJoin}
                                        WHERE {$whereClause}
                                        GROUP BY l.log_date
                                        ORDER BY l.log_date DESC
                                        LIMIT 14", $params);
                $summary['metrics'] = [
                    ['label' => 'Logged Site-Days', 'value' => (int)($totals['total_sites'] ?? 0), 'subLabel' => 'Daily status records'],
                    ['label' => 'UP Sites', 'value' => (int)($totals['up_sites'] ?? 0), 'subLabel' => 'Within selected range'],
                    ['label' => 'DOWN Sites', 'value' => (int)($totals['down_sites'] ?? 0), 'subLabel' => 'Needs follow-up'],
                    ['label' => 'Average Bandwidth', 'value' => number_format((float)($totals['avg_bandwidth'] ?? 0), 2), 'subLabel' => 'Mbps average'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Daily Status Trend',
                    'labels' => array_reverse(array_column($chart, 'label')),
                    'values' => array_reverse(array_map('intval', array_column($chart, 'up_sites'))),
                    'secondaryValues' => array_reverse(array_map('intval', array_column($chart, 'down_sites'))),
                ]];
                $summary['narrative'] = 'This summary highlights site availability trends for the selected period. Higher UP counts indicate stable service delivery, while DOWN and PARTIAL counts identify areas that require operational follow-up.';
                break;

            case 'weekly_summary':
                $siteJoin = '';
                $where = ['l.log_date BETWEEN ? AND ?'];
                $params = [$dateFrom, $dateTo];
                if ($projectId) { $siteJoin .= ' LEFT JOIN sites s ON s.id = l.site_id'; $where[] = 's.project_id = ?'; $params[] = (int) $projectId; }
                if ($province) { $siteJoin .= ' LEFT JOIN sites sp ON sp.id = l.site_id'; $where[] = 'sp.province = ?'; $params[] = $province; }
                if ($municipality) { $siteJoin .= ' LEFT JOIN sites sm ON sm.id = l.site_id'; $where[] = 'sm.municipality = ?'; $params[] = $municipality; }
                if ($district) { $siteJoin .= ' LEFT JOIN sites sd ON sd.id = l.site_id'; $where[] = 'sd.district = ?'; $params[] = $district; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_logs,
                                                ROUND(SUM(CASE WHEN l.status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS uptime_pct,
                                                COALESCE(SUM(l.total_unique_users), 0) AS total_users,
                                                COALESCE(ROUND(AVG(l.bandwidth_utilization), 2), 0) AS avg_bandwidth
                                         FROM free_wifi_daily_logs l {$siteJoin}
                                         WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT YEAR(l.log_date) AS year,
                                               WEEK(l.log_date) AS week,
                                               DATE_FORMAT(MIN(l.log_date), '%b %d') AS label,
                                               ROUND(SUM(CASE WHEN l.status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS uptime_pct
                                        FROM free_wifi_daily_logs l {$siteJoin}
                                        WHERE {$whereClause}
                                        GROUP BY YEAR(l.log_date), WEEK(l.log_date)
                                        ORDER BY MIN(l.log_date) DESC
                                        LIMIT 12", $params);
                $summary['metrics'] = [
                    ['label' => 'Weekly Records', 'value' => (int)($totals['total_logs'] ?? 0), 'subLabel' => 'Site-day observations'],
                    ['label' => 'Uptime', 'value' => number_format((float)($totals['uptime_pct'] ?? 0), 2) . '%', 'subLabel' => 'UP share of observations'],
                    ['label' => 'Total Users', 'value' => number_format((float)($totals['total_users'] ?? 0), 0), 'subLabel' => 'Unique-user count'],
                    ['label' => 'Avg Bandwidth', 'value' => number_format((float)($totals['avg_bandwidth'] ?? 0), 2), 'subLabel' => 'Mbps average'],
                ];
                $summary['charts'] = [[
                    'type' => 'line',
                    'title' => 'Weekly Uptime Trend',
                    'labels' => array_reverse(array_column($chart, 'label')),
                    'values' => array_reverse(array_map('floatval', array_column($chart, 'uptime_pct'))),
                ]];
                $summary['narrative'] = 'Weekly trends help separate isolated incidents from recurring service degradation. Use sustained dips in uptime to prioritize site inspections or ISP escalation.';
                break;

            case 'monthly_accomplishment':
                $where = ["p.type = 'milestone'", 'p.is_active = 1'];
                $params = [];
                if ($projectId) { $where[] = 'p.id = ?'; $params[] = (int) $projectId; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(DISTINCT m.id) AS total_milestones,
                                                SUM(CASE WHEN m.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_milestones,
                                                COALESCE(ROUND(AVG(e.accomplishment_percent), 2), 0) AS avg_accomplishment
                                         FROM projects p
                                         JOIN milestones m ON m.project_id = p.id
                                         LEFT JOIN dict_project_entries e ON e.project_id = p.id AND e.entry_date BETWEEN ? AND ?
                                         WHERE {$whereClause}", array_merge([$dateFrom, $dateTo], $params));
                $chart = $db->fetchAll("SELECT m.status AS label, COUNT(*) AS value
                                        FROM projects p
                                        JOIN milestones m ON m.project_id = p.id
                                        WHERE {$whereClause}
                                        GROUP BY m.status
                                        ORDER BY value DESC", $params);
                $summary['metrics'] = [
                    ['label' => 'Milestones', 'value' => (int)($totals['total_milestones'] ?? 0), 'subLabel' => 'Active milestone items'],
                    ['label' => 'Completed', 'value' => (int)($totals['completed_milestones'] ?? 0), 'subLabel' => 'Milestone status'],
                    ['label' => 'Accomplishment', 'value' => number_format((float)($totals['avg_accomplishment'] ?? 0), 2) . '%', 'subLabel' => 'Average progress'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Milestone Status Distribution',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('intval', array_column($chart, 'value')),
                ]];
                $summary['narrative'] = 'Accomplishment reporting compares planned milestones with actual progress. Delayed or in-progress milestones should be reviewed against site-level completion entries.';
                break;

            case 'regional_breakdown':
                $where = ['1 = 1'];
                $params = [];
                if ($projectId) { $where[] = 's.project_id = ?'; $params[] = (int) $projectId; }
                if ($province) { $where[] = 's.province = ?'; $params[] = $province; }
                if ($municipality) { $where[] = 's.municipality = ?'; $params[] = $municipality; }
                if ($district) { $where[] = 's.district = ?'; $params[] = $district; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_sites,
                                                SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                                SUM(CASE WHEN s.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites,
                                                COALESCE(ROUND(AVG(s.bw_download), 2), 0) AS avg_bandwidth
                                         FROM sites s WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT s.island_group AS label,
                                               COUNT(*) AS value,
                                               SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                               SUM(CASE WHEN s.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites
                                        FROM sites s WHERE {$whereClause}
                                        GROUP BY s.island_group
                                        ORDER BY s.island_group", $params);
                $summary['metrics'] = [
                    ['label' => 'Total Sites', 'value' => (int)($totals['total_sites'] ?? 0), 'subLabel' => 'Selected project scope'],
                    ['label' => 'UP Sites', 'value' => (int)($totals['up_sites'] ?? 0), 'subLabel' => 'Active service points'],
                    ['label' => 'DOWN Sites', 'value' => (int)($totals['down_sites'] ?? 0), 'subLabel' => 'Service gaps'],
                    ['label' => 'Avg Bandwidth', 'value' => number_format((float)($totals['avg_bandwidth'] ?? 0), 2), 'subLabel' => 'Mbps average'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Sites by Island Group',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('intval', array_column($chart, 'value')),
                    'secondaryValues' => array_map('intval', array_column($chart, 'down_sites')),
                ]];
                $summary['narrative'] = 'Regional distribution shows where infrastructure is concentrated and where downtime is affecting service coverage. Island-group comparisons support regional prioritization.';
                break;

            case 'project_completion':
                $where = ['1 = 1'];
                $params = [];
                if ($projectId) { $where[] = 'project_id = ?'; $params[] = (int) $projectId; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS active_projects,
                                                COALESCE(ROUND(AVG(avg_completion), 2), 0) AS avg_completion,
                                                COALESCE(SUM(active_sites), 0) AS active_sites,
                                                COALESCE(SUM(down_sites), 0) AS down_sites
                                         FROM vw_project_accomplishment WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT project_name AS label, avg_completion AS value
                                        FROM vw_project_accomplishment
                                        WHERE {$whereClause}
                                        ORDER BY avg_completion ASC
                                        LIMIT 10", $params);
                $summary['metrics'] = [
                    ['label' => 'Active Projects', 'value' => (int)($totals['active_projects'] ?? 0), 'subLabel' => 'Milestone projects'],
                    ['label' => 'Avg Completion', 'value' => number_format((float)($totals['avg_completion'] ?? 0), 2) . '%', 'subLabel' => 'Across projects'],
                    ['label' => 'Active Sites', 'value' => (int)($totals['active_sites'] ?? 0), 'subLabel' => 'UP sites'],
                    ['label' => 'Down Sites', 'value' => (int)($totals['down_sites'] ?? 0), 'subLabel' => 'Needs attention'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Lowest Completion Rates',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('floatval', array_column($chart, 'value')),
                ]];
                $summary['narrative'] = 'Project completion is measured against site availability and accomplishment entries. Lower-ranked projects should be reviewed first for bottlenecks or missing deliverables.';
                break;

            case 'isp_performance':
                $where = ['s.isp_provider IS NOT NULL', "s.isp_provider != ''"];
                $params = [];
                if ($projectId) { $where[] = 's.project_id = ?'; $params[] = (int) $projectId; }
                if ($province) { $where[] = 's.province = ?'; $params[] = $province; }
                if ($municipality) { $where[] = 's.municipality = ?'; $params[] = $municipality; }
                if ($district) { $where[] = 's.district = ?'; $params[] = $district; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_sites,
                                                ROUND(SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS uptime_pct,
                                                COALESCE(ROUND(AVG(s.bw_download), 2), 0) AS avg_bandwidth
                                         FROM sites s WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT s.isp_provider AS label,
                                               COUNT(*) AS value,
                                               ROUND(SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS uptime_pct
                                        FROM sites s WHERE {$whereClause}
                                        GROUP BY s.isp_provider
                                        ORDER BY uptime_pct ASC, value DESC
                                        LIMIT 10", $params);
                $summary['metrics'] = [
                    ['label' => 'ISP Sites', 'value' => (int)($totals['total_sites'] ?? 0), 'subLabel' => 'Sites with ISP data'],
                    ['label' => 'Uptime', 'value' => number_format((float)($totals['uptime_pct'] ?? 0), 2) . '%', 'subLabel' => 'UP share'],
                    ['label' => 'Avg Bandwidth', 'value' => number_format((float)($totals['avg_bandwidth'] ?? 0), 2), 'subLabel' => 'Mbps average'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'ISP Uptime Ranking',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('floatval', array_column($chart, 'uptime_pct')),
                ]];
                $summary['narrative'] = 'ISP performance compares provider reliability across the selected project scope. Providers with lower uptime should be prioritized for service-level review.';
                break;

            case 'audit_trail':
                $where = ['a.created_at BETWEEN ? AND ?'];
                $params = [$dateFrom, $dateTo];
                if ($projectId) { $where[] = "(a.entity_type = 'project' AND a.entity_id = ?)"; $params[] = (int) $projectId; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_logs,
                                                COUNT(DISTINCT a.user_id) AS distinct_users,
                                                COUNT(DISTINCT a.action) AS distinct_actions
                                         FROM audit_logs a
                                         WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT a.action AS label, COUNT(*) AS value
                                        FROM audit_logs a
                                        WHERE {$whereClause}
                                        GROUP BY a.action
                                        ORDER BY value DESC
                                        LIMIT 10", $params);
                $summary['metrics'] = [
                    ['label' => 'Audit Logs', 'value' => (int)($totals['total_logs'] ?? 0), 'subLabel' => 'Selected period'],
                    ['label' => 'Users', 'value' => (int)($totals['distinct_users'] ?? 0), 'subLabel' => 'Distinct actors'],
                    ['label' => 'Actions', 'value' => (int)($totals['distinct_actions'] ?? 0), 'subLabel' => 'Distinct event types'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Top Audit Actions',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('intval', array_column($chart, 'value')),
                ]];
                $summary['narrative'] = 'Audit activity highlights who changed what and when. Spikes in a single action type may indicate a process change, bulk update, or data quality issue requiring review.';
                break;

            case 'site_implementation':
                $where = ['1 = 1'];
                $params = [];
                if ($projectId) { $where[] = 's.project_id = ?'; $params[] = (int) $projectId; }
                if ($province) { $where[] = 's.province = ?'; $params[] = $province; }
                if ($municipality) { $where[] = 's.municipality = ?'; $params[] = $municipality; }
                if ($district) { $where[] = 's.district = ?'; $params[] = $district; }
                $whereClause = implode(' AND ', $where);
                $totals = $db->fetchOne("SELECT COUNT(*) AS total_sites,
                                                SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                                SUM(CASE WHEN s.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites,
                                                COALESCE(ROUND(AVG(s.bw_download), 2), 0) AS avg_bandwidth
                                         FROM sites s WHERE {$whereClause}", $params);
                $chart = $db->fetchAll("SELECT s.province AS label,
                                               COUNT(*) AS value,
                                               SUM(CASE WHEN s.status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
                                               SUM(CASE WHEN s.status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites
                                        FROM sites s WHERE {$whereClause}
                                        GROUP BY s.province
                                        ORDER BY value DESC
                                        LIMIT 10", $params);
                $summary['metrics'] = [
                    ['label' => 'Implementation Sites', 'value' => (int)($totals['total_sites'] ?? 0), 'subLabel' => 'Selected scope'],
                    ['label' => 'UP Sites', 'value' => (int)($totals['up_sites'] ?? 0), 'subLabel' => 'Operational'],
                    ['label' => 'DOWN Sites', 'value' => (int)($totals['down_sites'] ?? 0), 'subLabel' => 'Requires action'],
                    ['label' => 'Avg Bandwidth', 'value' => number_format((float)($totals['avg_bandwidth'] ?? 0), 2), 'subLabel' => 'Mbps average'],
                ];
                $summary['charts'] = [[
                    'type' => 'bar',
                    'title' => 'Implementation by Province',
                    'labels' => array_column($chart, 'label'),
                    'values' => array_map('intval', array_column($chart, 'value')),
                    'secondaryValues' => array_map('intval', array_column($chart, 'down_sites')),
                ]];
                $summary['narrative'] = 'Implementation status summarizes site readiness and operational health by selected geographic scope. Province-level concentration helps target inspections, coordination, and escalation.';
                break;
        }

        ApiResponse::success($summary);
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
        if ($projectId) {
            $projectRow = $db->fetchOne('SELECT id FROM projects WHERE id = ? OR LOWER(code) = ?', [(int)$projectId, strtolower((string)$projectId)]);
            $projectId = $projectRow ? (int)$projectRow['id'] : null;
        }
        $title = $input['title'] ?? ucfirst(str_replace('_', ' ', $reportType)) . ' Report';
        $selectedFieldsRaw = $input['selected_fields'] ?? $_GET['selected_fields'] ?? '';
        $selectedFields = [];
        if (is_array($selectedFieldsRaw)) {
            $selectedFields = array_values(array_filter(array_map('trim', $selectedFieldsRaw)));
        } elseif (is_string($selectedFieldsRaw) && trim($selectedFieldsRaw) !== '') {
            $selectedFields = array_values(array_filter(array_map('trim', explode(',', $selectedFieldsRaw))));
        }

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
            if ($selectedFields && is_array($colMap)) {
                $colMap = array_filter(
                    $colMap,
                    fn($column) => in_array($column, $selectedFields, true),
                    ARRAY_FILTER_USE_VALUE
                );
            }
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

            $colMap = $columnMaps[$reportType] ?? null;
            if ($selectedFields && is_array($colMap)) {
                $colMap = array_filter(
                    $colMap,
                    fn($column) => in_array($column, $selectedFields, true),
                    ARRAY_FILTER_USE_VALUE
                );
            }
            $colLabels = $colMap ? array_keys($colMap) : $headers;
            fputcsv($output, $colLabels);

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

        $displayRows = [];
        $displayColMap = $columnMaps[$reportType] ?? null;
        if ($selectedFields && is_array($displayColMap)) {
            $displayColMap = array_filter(
                $displayColMap,
                fn($column) => in_array($column, $selectedFields, true),
                ARRAY_FILTER_USE_VALUE
            );
        }

        if (is_array($reportData) && is_array($displayColMap)) {
            foreach ($reportData as $row) {
                $displayRow = [];
                foreach ($displayColMap as $label => $column) {
                    $displayRow[$label] = $row[$column] ?? '';
                }
                $displayRows[] = $displayRow;
            }
        } else {
            $displayRows = $reportData;
        }

        ApiResponse::success([
            'id'     => $reportId,
            'data'   => $displayRows,
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
