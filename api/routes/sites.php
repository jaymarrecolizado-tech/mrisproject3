<?php
/**
 * Sites Routes: list, get, create, update, delete, map-data, import, export
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../helpers/AuditHelper.php';

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'sites.list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(2000, max(10, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        if (!empty($_GET['project_id'])) {
            $pid = $_GET['project_id'];
            // If non-numeric (e.g. 'fw', 'freewifi'), resolve via project code
            if (!is_numeric($pid)) {
                $resolved = $db->fetchColumn('SELECT id FROM projects WHERE LOWER(code) = ?', [strtolower($pid)]);
                $pid = $resolved ?: -1; // -1 ensures no match if code not found
            }
            $where[] = 's.project_id = ?';
            $params[] = (int) $pid;
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
        if (!empty($_GET['region'])) {
            $where[] = 's.province IN (SELECT name FROM provinces WHERE region = ?)';
            $params[] = $_GET['region'];
        }
        if (!empty($_GET['search'])) {
            $search = '%' . $_GET['search'] . '%';
            $where[] = '(s.site_code LIKE ? OR s.location_name LIKE ? OR s.site_name LIKE ? OR s.municipality LIKE ?)';
            $params = array_merge($params, [$search, $search, $search, $search]);
        }

        $whereClause = implode(' AND ', $where);

        $total = $db->fetchColumn("SELECT COUNT(*) FROM sites s WHERE {$whereClause}", $params);

        $sites = $db->paginate(
            "SELECT s.*, p.code as project_code, p.name as project_name, p.color as project_color
             FROM sites s
             JOIN projects p ON p.id = s.project_id
             WHERE {$whereClause}
             ORDER BY s.site_code",
            $params,
            $perPage,
            $offset
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
        $oldRow = $db->fetchOne('SELECT * FROM sites WHERE id = ?', [$siteId]);
        $db->update('sites', $fields, 'id = ?', [$siteId]);
        [$oldValues, $newValues] = AuditHelper::diff($oldRow, $fields);
        AuditHelper::log($db, 'site.update', 'site', $siteId, $oldValues, $newValues);
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
        $region = $_GET['region'] ?? null;

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
        if ($region) {
            $where[] = 's.province IN (SELECT name FROM provinces WHERE region = ?)';
            $params[] = $region;
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

    case 'sites.geo-filters':
        $where = ['1=1'];
        $params = [];
        $projectId = trim((string)($_GET['project_id'] ?? ''));
        if ($projectId !== '') {
            $project = $db->fetchOne('SELECT id FROM projects WHERE id = ? OR LOWER(code) = ?', [(int)$projectId, strtolower($projectId)]);
            if ($project) {
                $where[] = 'project_id = ?';
                $params[] = (int)$project['id'];
            }
        }
        $whereClause = implode(' AND ', $where);
        $provinces = $db->fetchAll(
            "SELECT DISTINCT province FROM sites WHERE {$whereClause} AND province IS NOT NULL AND province != '' ORDER BY province",
            $params
        );
        $municipalities = $db->fetchAll(
            "SELECT DISTINCT municipality, province FROM sites WHERE {$whereClause} AND municipality IS NOT NULL AND municipality != '' ORDER BY province, municipality",
            $params
        );
        $districts = $db->fetchAll(
            "SELECT DISTINCT district, province FROM sites WHERE {$whereClause} AND district IS NOT NULL AND district != '' ORDER BY province, district",
            $params
        );
        ApiResponse::success([
            'provinces'     => array_column($provinces, 'province'),
            'municipalities' => $municipalities,
            'districts'     => $districts,
        ]);
        break;

    case 'sites.regions':
        $regions = $db->fetchAll('SELECT DISTINCT region FROM provinces WHERE region IS NOT NULL ORDER BY region');
        ApiResponse::success($regions);
        break;

    default:
        ApiResponse::error('Unknown sites action', 404);
}
