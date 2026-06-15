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
        // Resolve + validate the project: accept a numeric id or a project code (e.g. 'fw').
        // Without this, an unknown project_id trips a SQL FK error (HTTP 500) instead of a
        // clean 400. Mirrors the code-resolution already used by sites.list.
        if (!is_numeric($data['project_id'])) {
            $resolved = $db->fetchColumn('SELECT id FROM projects WHERE LOWER(code) = ?', [strtolower((string)$data['project_id'])]);
            $data['project_id'] = $resolved ?: 0;
        }
        if (!$db->fetchOne('SELECT id FROM projects WHERE id = ?', [(int)$data['project_id']])) {
            ApiResponse::error('Unknown project_id: ' . $input['project_id'], 400);
            exit;
        }
        $data['project_id'] = (int)$data['project_id'];
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
        $site = $db->fetchOne('SELECT id FROM sites WHERE id = ?', [$siteId]);
        if (!$site) {
            ApiResponse::error('Site not found', 404);
            exit;
        }
        // Safety: a site carries operational history. The schema CASCADE-deletes
        // free_wifi_daily_logs, site_status_events, and site_photos and SET NULLs
        // dict_project_entries / milestones when a site is hard-deleted, which would
        // silently destroy records. Refuse to delete a site that still has dependents
        // so history is never lost by accident; only empty sites can be removed.
        $dependents = [
            'daily logs'    => (int) $db->fetchColumn('SELECT COUNT(*) FROM free_wifi_daily_logs WHERE site_id = ?', [$siteId]),
            'entries'       => (int) $db->fetchColumn('SELECT COUNT(*) FROM dict_project_entries WHERE site_id = ?', [$siteId]),
            'photos'        => (int) $db->fetchColumn('SELECT COUNT(*) FROM site_photos WHERE site_id = ?', [$siteId]),
            'status events' => (int) $db->fetchColumn('SELECT COUNT(*) FROM site_status_events WHERE site_id = ?', [$siteId]),
        ];
        $blocking = [];
        foreach ($dependents as $label => $count) {
            if ($count > 0) {
                $blocking[] = "{$count} {$label}";
            }
        }
        if ($blocking) {
            ApiResponse::error('Cannot delete: site still has ' . implode(', ', $blocking) . '. Remove or reassign them first.', 409);
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
            // Header-aware import: map columns by normalized header name. Previously the
            // importer read columns positionally (col 0 = project_id, ...), but sites.export
            // emits [ID, Project Code, Site Code, Location, ...] — so re-importing an export
            // shifted every column and mis-resolved the project. Mapping by header name makes
            // an exported file round-trip correctly and also tolerates a plain template.
            $header = fgetcsv($handle);
            if (!$header) {
                fclose($handle);
                ApiResponse::error('CSV has no header row', 400);
                exit;
            }

            $columnMap = [
                'sitecode'     => 'site_code',
                'locationname' => 'location_name',
                'location'     => 'location_name',
                'sitename'     => 'site_name',
                'barangay'     => 'barangay',
                'municipality' => 'municipality',
                'province'     => 'province',
                'district'     => 'district',
                'islandgroup'  => 'island_group',
                'latitude'     => 'latitude',
                'lat'          => 'latitude',
                'longitude'    => 'longitude',
                'long'         => 'longitude',
                'lng'          => 'longitude',
                'sitetype'     => 'site_type',
                'isp'          => 'isp_provider',
                'ispprovider'  => 'isp_provider',
                'lastmiletech' => 'last_mile_tech',
                'bandwidth'    => 'bw_download',
                'bwdownload'   => 'bw_download',
                'bw'           => 'bw_download',
                'status'       => 'status',
            ];
            // Normalize each header (lowercase, strip non-alphanumeric) -> canonical key.
            // 'id' is deliberately unmapped so a site's own id is never imported.
            $mappedHeader = [];
            foreach ($header as $col) {
                $norm = preg_replace('/[^a-z0-9]/', '', strtolower(trim((string)$col)));
                if ($norm === 'projectcode' || $norm === 'projectid' || $norm === 'project') {
                    $mappedHeader[] = '__project_ref';
                } elseif (isset($columnMap[$norm])) {
                    $mappedHeader[] = $columnMap[$norm];
                } else {
                    $mappedHeader[] = null;
                }
            }

            $imported = 0;
            $updated = 0;
            $errors = [];
            $row = 1;

            $db->beginTransaction();
            try {
                while (($data = fgetcsv($handle)) !== false) {
                    $row++;
                    if (count($data) < 2) {
                        continue;
                    }

                    try {
                        $site = [
                            'site_code' => '', 'location_name' => '', 'site_name' => '',
                            'barangay' => '', 'municipality' => '', 'province' => '',
                            'district' => '', 'island_group' => '', 'latitude' => null,
                            'longitude' => null, 'site_type' => '', 'isp_provider' => '',
                            'last_mile_tech' => '', 'bw_download' => 0, 'status' => 'PENDING',
                        ];
                        $projectRef = null;
                        foreach ($data as $i => $val) {
                            $key = $mappedHeader[$i] ?? null;
                            if ($key === null) {
                                continue;
                            }
                            if ($key === '__project_ref') {
                                $projectRef = $val;
                            } else {
                                $site[$key] = $val;
                            }
                        }

                        // Resolve + validate the project (numeric id or a code like 'fw').
                        $projectId = 0;
                        if ($projectRef !== null && $projectRef !== '') {
                            if (is_numeric($projectRef)) {
                                $exists = $db->fetchOne('SELECT id FROM projects WHERE id = ?', [(int)$projectRef]);
                                $projectId = $exists ? (int)$exists['id'] : 0;
                            } else {
                                $resolved = $db->fetchColumn('SELECT id FROM projects WHERE LOWER(code) = ?', [strtolower(trim((string)$projectRef))]);
                                $projectId = $resolved ? (int)$resolved : 0;
                            }
                        }
                        if (!$projectId) {
                            $errors[] = "Row {$row}: unknown or missing project";
                            continue;
                        }

                        $site['site_code'] = trim((string)$site['site_code']);
                        if ($site['site_code'] === '') {
                            $errors[] = "Row {$row}: missing site_code";
                            continue;
                        }

                        $site['latitude']    = ($site['latitude'] !== '' && $site['latitude'] !== null) ? (float)$site['latitude'] : null;
                        $site['longitude']   = ($site['longitude'] !== '' && $site['longitude'] !== null) ? (float)$site['longitude'] : null;
                        $site['bw_download'] = ($site['bw_download'] !== '' && $site['bw_download'] !== null) ? (float)$site['bw_download'] : 0;

                        // Upsert on (project_id, site_code): re-importing an export updates
                        // existing sites instead of creating duplicates.
                        $existing = $db->fetchOne('SELECT id FROM sites WHERE project_id = ? AND site_code = ?', [$projectId, $site['site_code']]);
                        if ($existing) {
                            $db->update('sites', $site, 'id = ?', [$existing['id']]);
                            $updated++;
                        } else {
                            $site['project_id'] = $projectId;
                            $db->insert('sites', $site);
                            $imported++;
                        }
                    } catch (Exception $e) {
                        $errors[] = "Row {$row}: " . $e->getMessage();
                    }
                }
                $db->commit();
                ApiResponse::success([
                    'imported' => $imported,
                    'updated'  => $updated,
                    'errors'   => $errors,
                ], "Imported {$imported}, updated {$updated} sites");
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
