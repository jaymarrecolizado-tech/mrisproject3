<?php
/**
 * Sites Routes: list, get, create, update, delete, map-data, import, export
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'sites.list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        if (!empty($_GET['project_id'])) {
            $where[] = 's.project_id = ?';
            $params[] = $_GET['project_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 's.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['province'])) {
            $where[] = 's.province LIKE ?';
            $params[] = '%' . $_GET['province'] . '%';
        }
        if (!empty($_GET['island_group'])) {
            $where[] = 's.island_group = ?';
            $params[] = $_GET['island_group'];
        }
        if (!empty($_GET['search'])) {
            $search = '%' . $_GET['search'] . '%';
            $where[] = '(s.site_code LIKE ? OR s.location_name LIKE ? OR s.site_name LIKE ? OR s.municipality LIKE ?)';
            $params = array_merge($params, [$search, $search, $search, $search]);
        }

        $whereClause = implode(' AND ', $where);

        $total = $db->fetchColumn("SELECT COUNT(*) FROM sites s WHERE {$whereClause}", $params);

        $sites = $db->fetchAll(
            "SELECT s.*, p.code as project_code, p.name as project_name, p.color as project_color
             FROM sites s
             JOIN projects p ON p.id = s.project_id
             WHERE {$whereClause}
             ORDER BY s.site_code
             LIMIT ? OFFSET ?",
            array_merge($params, [$perPage, $offset])
        );

        ApiResponse::paginated($sites, (int) $total, $page, $perPage);
        break;

    case 'sites.get':
        $siteId = $id ?? $_GET['id'] ?? null;
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }
        $site = $db->fetchOne(
            'SELECT s.*, p.code as project_code, p.name as project_name, p.color as project_color, p.type as project_type
             FROM sites s
             JOIN projects p ON p.id = s.project_id
             WHERE s.id = ?',
            [$siteId]
        );
        if (!$site) {
            ApiResponse::error('Site not found', 404);
            exit;
        }
        ApiResponse::success($site);
        break;

    case 'sites.create':
        if (!AuthMiddleware::hasPermission('sites.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $data = [
            'project_id' => $input['project_id'] ?? 0,
            'site_code' => $input['site_code'] ?? '',
            'location_name' => $input['location_name'] ?? '',
            'site_name' => $input['site_name'] ?? '',
            'barangay' => $input['barangay'] ?? '',
            'municipality' => $input['municipality'] ?? '',
            'province' => $input['province'] ?? '',
            'district' => $input['district'] ?? '',
            'island_group' => $input['island_group'] ?? '',
            'latitude' => $input['latitude'] ?? null,
            'longitude' => $input['longitude'] ?? null,
            'site_type' => $input['site_type'] ?? '',
            'isp_provider' => $input['isp_provider'] ?? '',
            'last_mile_tech' => $input['last_mile_tech'] ?? '',
            'bw_download' => $input['bw_download'] ?? 0,
            'status' => $input['status'] ?? 'PENDING',
        ];
        if (!$data['project_id'] || !$data['site_code']) {
            ApiResponse::error('Project ID and site code are required', 400);
            exit;
        }
        $newId = $db->insert('sites', $data);
        ApiResponse::success(['id' => $newId], 'Site created', 201);
        break;

    case 'sites.update':
        if (!AuthMiddleware::hasPermission('sites.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $siteId = $id ?? $_GET['id'] ?? null;
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['site_code', 'location_name', 'site_name', 'barangay', 'municipality', 'province',
                     'district', 'island_group', 'latitude', 'longitude', 'site_type', 'isp_provider',
                     'last_mile_tech', 'bw_download', 'status', 'nationwide_id'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) $fields[$f] = $input[$f];
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $db->update('sites', $fields, 'id = ?', [$siteId]);
        ApiResponse::success(null, 'Site updated');
        break;

    case 'sites.delete':
        if (!AuthMiddleware::hasPermission('sites.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $siteId = $id ?? $_GET['id'] ?? null;
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }
        $db->delete('sites', 'id = ?', [$siteId]);
        ApiResponse::success(null, 'Site deleted');
        break;

    case 'sites.map-data':
        $projectId = $_GET['project_id'] ?? null;
        $status = $_GET['status'] ?? null;

        $where = ['1=1'];
        $params = [];

        if ($projectId) {
            $where[] = 's.project_id = ?';
            $params[] = $projectId;
        }
        if ($status) {
            $where[] = 's.status = ?';
            $params[] = $status;
        }

        $whereClause = implode(' AND ', $where);

        $sites = $db->fetchAll(
            "SELECT s.id, s.site_code, s.location_name, s.site_name, s.province, s.municipality,
                    s.latitude, s.longitude, s.status, s.isp_provider, s.bw_download,
                    s.island_group, s.site_type,
                    p.id as project_id, p.code as project_code, p.name as project_name, p.color as project_color
             FROM sites s
             JOIN projects p ON p.id = s.project_id
             WHERE {$whereClause}
               AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
             ORDER BY s.project_id, s.site_code",
            $params
        );
        ApiResponse::success($sites);
        break;

    case 'sites.export':
        if (!AuthMiddleware::hasPermission('sites.export')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $sites = $db->fetchAll(
            'SELECT s.*, p.code as project_code, p.name as project_name
             FROM sites s
             JOIN projects p ON p.id = s.project_id
             ORDER BY s.project_id, s.site_code'
        );

        // Simple CSV export
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="sites_export_' . date('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Project Code', 'Site Code', 'Location', 'Site Name', 'Barangay',
                        'Municipality', 'Province', 'Island Group', 'Latitude', 'Longitude',
                        'Site Type', 'ISP', 'Bandwidth', 'Status']);
        foreach ($sites as $s) {
            fputcsv($out, [
                $s['id'], $s['project_code'], $s['site_code'], $s['location_name'],
                $s['site_name'], $s['barangay'], $s['municipality'], $s['province'],
                $s['island_group'], $s['latitude'], $s['longitude'], $s['site_type'],
                $s['isp_provider'], $s['bw_download'], $s['status'],
            ]);
        }
        fclose($out);
        exit;

    case 'sites.import':
        if (!AuthMiddleware::hasPermission('sites.import')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        // Handle file upload
        if (!isset($_FILES['file'])) {
            ApiResponse::error('No file uploaded', 400);
            exit;
        }

        $file = $_FILES['file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if ($ext === 'csv') {
            $handle = fopen($file['tmp_name'], 'r');
            $header = fgetcsv($handle); // skip header
            $imported = 0;
            $errors = [];
            $row = 1;

            $db->beginTransaction();
            try {
                while (($data = fgetcsv($handle)) !== false) {
                    $row++;
                    if (count($data) < 3) continue;

                    try {
                        $db->insert('sites', [
                            'project_id' => (int) ($data[0] ?? 1),
                            'site_code' => $data[1] ?? '',
                            'location_name' => $data[2] ?? '',
                            'site_name' => $data[3] ?? '',
                            'barangay' => $data[4] ?? '',
                            'municipality' => $data[5] ?? '',
                            'province' => $data[6] ?? '',
                            'island_group' => $data[7] ?? '',
                            'latitude' => $data[8] ? (float) $data[8] : null,
                            'longitude' => $data[9] ? (float) $data[9] : null,
                            'site_type' => $data[10] ?? '',
                            'isp_provider' => $data[11] ?? '',
                            'last_mile_tech' => $data[12] ?? '',
                            'bw_download' => $data[13] ? (float) $data[13] : 0,
                            'status' => $data[14] ?? 'PENDING',
                        ]);
                        $imported++;
                    } catch (Exception $e) {
                        $errors[] = "Row {$row}: " . $e->getMessage();
                    }
                }
                $db->commit();
                ApiResponse::success([
                    'imported' => $imported,
                    'errors' => $errors,
                ], "Imported {$imported} sites");
            } catch (Exception $e) {
                $db->rollback();
                ApiResponse::error('Import failed: ' . $e->getMessage(), 500);
            }
            fclose($handle);
        } else {
            ApiResponse::error('Only CSV files are supported', 400);
        }
        break;

    default:
        ApiResponse::error('Unknown sites action', 404);
}
