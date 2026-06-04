<?php
/**
 * Free WiFi Daily Logs Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../helpers/AuditHelper.php';

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'logs.list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        if (!empty($_GET['site_id'])) {
            $where[] = 'l.site_id = ?';
            $params[] = $_GET['site_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'l.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['date_from'])) {
            $where[] = 'l.log_date >= ?';
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where[] = 'l.log_date <= ?';
            $params[] = $_GET['date_to'];
        }

        $whereClause = implode(' AND ', $where);
        $total = $db->fetchColumn("SELECT COUNT(*) FROM free_wifi_daily_logs l WHERE {$whereClause}", $params);

        $logs = $db->paginate(
            "SELECT l.*, s.site_code, s.location_name, s.province, s.municipality,
                    p.code as project_code, p.name as project_name,
                    u.name as logged_by_name
             FROM free_wifi_daily_logs l
             JOIN sites s ON s.id = l.site_id
             JOIN projects p ON p.id = s.project_id
             LEFT JOIN users u ON u.id = l.logged_by
             WHERE {$whereClause}
             ORDER BY l.log_date DESC, l.site_id",
            $params,
            $perPage,
            $offset
        );

        ApiResponse::paginated($logs, (int) $total, $page, $perPage);
        break;


    case 'logs.get':
        $logId = $id ?? $_GET['id'] ?? null;
        if (!$logId) {
            ApiResponse::error('Log ID required', 400);
            exit;
        }
        $log = $db->fetchOne(
            'SELECT l.*, s.site_code, s.location_name, u.name as logged_by_name
             FROM free_wifi_daily_logs l
             JOIN sites s ON s.id = l.site_id
             LEFT JOIN users u ON u.id = l.logged_by
             WHERE l.id = ?',
            [$logId]
        );
        if (!$log) {
            ApiResponse::error('Log not found', 404);
            exit;
        }
        ApiResponse::success($log);
        break;

    case 'logs.create':
        if (!AuthMiddleware::hasPermission('logs.create')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $data = [
            'site_id' => (int) ($input['site_id'] ?? 0),
            'log_date' => $input['date'] ?? $input['log_date'] ?? date('Y-m-d'),
            'status' => $input['status'] ?? 'UP',
            'bandwidth_utilization' => $input['bandwidth_utilization'] ?? $input['bandwidth'] ?? 0,
            'total_unique_users' => (int) ($input['total_unique_users'] ?? $input['users'] ?? 0),
            'remarks' => $input['remarks'] ?? null,
            'logged_by' => AuthMiddleware::getCurrentUser()['id'],
        ];
        if (!$data['site_id']) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }
        // Upsert: replace if same site+date exists
        $existing = $db->fetchOne(
            'SELECT id FROM free_wifi_daily_logs WHERE site_id = ? AND log_date = ?',
            [$data['site_id'], $data['log_date']]
        );
        if ($existing) {
            $db->update('free_wifi_daily_logs', $data, 'id = ?', [$existing['id']]);
            $logId = $existing['id'];
        } else {
            $logId = $db->insert('free_wifi_daily_logs', $data);
        }

        // Update site status
        $db->update('sites', ['status' => $data['status'], 'last_updated' => date('Y-m-d H:i:s')], 'id = ?', [$data['site_id']]);

        // --- FEAT-6: Auto-generate notifications on key status events ---
        try {
            $site = $db->fetchOne(
                'SELECT site_code, location_name, province FROM sites WHERE id = ?',
                [$data['site_id']]
            );
            if ($site) {
                if ($data['status'] === 'DOWN') {
                    // Broadcast: site is down
                    $db->insert('notifications', [
                        'user_id'  => null,
                        'title'    => 'Site DOWN Alert',
                        'message'  => 'Site ' . $site['site_code'] . ' - ' . $site['location_name'] . ', ' . $site['province'] . ' reported DOWN status.',
                        'type'     => 'warning',
                        'is_read'  => 0,
                    ]);
                } elseif ($data['status'] === 'UP') {
                    // Check if previous day's log was DOWN (site restored)
                    $prevLog = $db->fetchOne(
                        'SELECT status FROM free_wifi_daily_logs
                         WHERE site_id = ? AND log_date < ? AND id != ?
                         ORDER BY log_date DESC LIMIT 1',
                        [$data['site_id'], $data['log_date'], $logId]
                    );
                    if ($prevLog && $prevLog['status'] === 'DOWN') {
                        $db->insert('notifications', [
                            'user_id'  => null,
                            'title'    => 'Site Restored',
                            'message'  => 'Site ' . $site['site_code'] . ' - ' . $site['location_name'] . ' is back UP.',
                            'type'     => 'success',
                            'is_read'  => 0,
                        ]);
                    }
                }
            }
        } catch (Exception $notifEx) {
            // Notification failure must not affect the primary log response
            error_log('Notification insert failed (logs.create): ' . $notifEx->getMessage());
        }
        // --- END FEAT-6 ---

        ApiResponse::success(['id' => $logId], 'Log saved', 201);
        break;

    case 'logs.update':
        if (!AuthMiddleware::hasPermission('logs.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $logId = $id ?? $_GET['id'] ?? null;
        if (!$logId) {
            ApiResponse::error('Log ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['status', 'bandwidth_utilization', 'total_unique_users', 'remarks'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) $fields[$f] = $input[$f];
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $oldRow = $db->fetchOne('SELECT * FROM free_wifi_daily_logs WHERE id = ?', [$logId]);
        $db->update('free_wifi_daily_logs', $fields, 'id = ?', [$logId]);
        [$oldValues, $newValues] = AuditHelper::diff($oldRow, $fields);
        AuditHelper::log($db, 'log.update', 'daily_log', $logId, $oldValues, $newValues);
        ApiResponse::success(null, 'Log updated');
        break;

    case 'logs.delete':
        if (!AuthMiddleware::hasPermission('logs.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $logId = $id ?? $_GET['id'] ?? null;
        if (!$logId) {
            ApiResponse::error('Log ID required', 400);
            exit;
        }
        $db->delete('free_wifi_daily_logs', 'id = ?', [$logId]);
        ApiResponse::success(null, 'Log deleted');
        break;

    case 'logs.bulk-import':
        if (!AuthMiddleware::hasPermission('logs.bulk_import')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        if (!isset($_FILES['file'])) {
            ApiResponse::error('No file uploaded', 400);
            exit;
        }

        $file = $_FILES['file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if ($ext === 'csv') {
            $handle = fopen($file['tmp_name'], 'r');
            $header = fgetcsv($handle);
            $imported = 0;
            $errors = [];
            $row = 1;
            $userId = AuthMiddleware::getCurrentUser()['id'];

            $db->beginTransaction();
            try {
                while (($data = fgetcsv($handle)) !== false) {
                    $row++;
                    if (count($data) < 3) continue;

                    try {
                        $db->insert('free_wifi_daily_logs', [
                            'site_id' => (int) ($data[0] ?? 0),
                            'log_date' => $data[1] ?? date('Y-m-d'),
                            'status' => $data[2] ?? 'UP',
                            'bandwidth_utilization' => $data[3] ? (float) $data[3] : 0,
                            'total_unique_users' => (int) ($data[4] ?? 0),
                            'remarks' => $data[5] ?? null,
                            'logged_by' => $userId,
                        ]);
                        $imported++;
                    } catch (Exception $e) {
                        $errors[] = "Row {$row}: " . $e->getMessage();
                    }
                }
                $db->commit();
                ApiResponse::success(['imported' => $imported, 'errors' => $errors]);
            } catch (Exception $e) {
                $db->rollback();
                ApiResponse::error('Import failed: ' . $e->getMessage(), 500);
            }
            fclose($handle);
        } else {
            ApiResponse::error('Only CSV files supported', 400);
        }
        break;

    case 'logs.daily-summary':
        $days = (int)($_GET['days'] ?? 30);
        $summary = $db->fetchAll(
            'SELECT log_date as date, total_sites, up_count, down_count, partial_count, total_users, avg_bandwidth
             FROM vw_free_wifi_daily_summary
             WHERE log_date >= CURDATE() - INTERVAL ? DAY
             ORDER BY log_date ASC',
            [$days]
        );
        ApiResponse::success($summary);
        break;

    case 'logs.site-logs':
        $siteId = $_GET['site_id'] ?? null;
        $days = (int)($_GET['days'] ?? 30);
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }
        $logs = $db->fetchAll(
            'SELECT l.*, u.name as logged_by_name
             FROM free_wifi_daily_logs l
             LEFT JOIN users u ON u.id = l.logged_by
             WHERE l.site_id = ? AND l.log_date >= CURDATE() - INTERVAL ? DAY
             ORDER BY l.log_date DESC',
            [$siteId, $days]
        );
        ApiResponse::success($logs);
        break;

    case 'logs.export':
        if (!AuthMiddleware::hasPermission('logs.export')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }

        $where = ['1=1'];
        $params = [];

        if (!empty($_GET['site_id'])) {
            $where[] = 'l.site_id = ?';
            $params[] = $_GET['site_id'];
        }
        if (!empty($_GET['date_from'])) {
            $where[] = 'l.log_date >= ?';
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where[] = 'l.log_date <= ?';
            $params[] = $_GET['date_to'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'l.status = ?';
            $params[] = $_GET['status'];
        }

        $whereClause = implode(' AND ', $where);

        $logs = $db->fetchAll(
            "SELECT l.*, s.site_code, s.location_name, s.province, s.municipality,
                    p.code as project_code, p.name as project_name,
                    u.name as logged_by_name
             FROM free_wifi_daily_logs l
             JOIN sites s ON s.id = l.site_id
             JOIN projects p ON p.id = s.project_id
             LEFT JOIN users u ON u.id = l.logged_by
             WHERE {$whereClause}
             ORDER BY l.log_date DESC, l.site_id",
            $params
        );

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="logs_export_' . date('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['Site ID', 'Site Code', 'Site Name', 'Province', 'Municipality',
                        'Project', 'Date', 'Status', 'Bandwidth Utilization %',
                        'Total Unique Users', 'Logged By', 'Remarks']);
        foreach ($logs as $l) {
            fputcsv($out, [
                $l['site_id'], $l['site_code'], $l['location_name'],
                $l['province'], $l['municipality'], $l['project_name'],
                $l['log_date'], $l['status'], $l['bandwidth_utilization'],
                $l['total_unique_users'], $l['logged_by_name'] ?? '',
                $l['remarks'] ?? '',
            ]);
        }
        fclose($out);
        exit;

    default:
        ApiResponse::error('Unknown logs action', 404);
}
