<?php
/**
 * Dict Project Entries Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'entries.list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        if (!empty($_GET['project_id'])) {
            $where[] = 'e.project_id = ?';
            $params[] = $_GET['project_id'];
        }
        if (!empty($_GET['site_id'])) {
            $where[] = 'e.site_id = ?';
            $params[] = $_GET['site_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'e.status = ?';
            $params[] = $_GET['status'];
        }

        $whereClause = implode(' AND ', $where);
        $total = $db->fetchColumn("SELECT COUNT(*) FROM dict_project_entries e WHERE {$whereClause}", $params);

        $entries = $db->fetchAll(
            "SELECT e.*, s.site_code, s.location_name, s.province,
                    p.code as project_code, p.name as project_name,
                    u.name as updated_by_name
             FROM dict_project_entries e
             LEFT JOIN sites s ON s.id = e.site_id
             JOIN projects p ON p.id = e.project_id
             LEFT JOIN users u ON u.id = e.updated_by
             WHERE {$whereClause}
             ORDER BY e.entry_date DESC
             LIMIT ? OFFSET ?",
            array_merge($params, [$perPage, $offset])
        );

        ApiResponse::paginated($entries, (int) $total, $page, $perPage);
        break;

    case 'entries.get':
        $entryId = $id ?? $_GET['id'] ?? null;
        if (!$entryId) {
            ApiResponse::error('Entry ID required', 400);
            exit;
        }
        $entry = $db->fetchOne('SELECT e.*, s.site_code, s.location_name, u.name as updated_by_name FROM dict_project_entries e LEFT JOIN sites s ON s.id = e.site_id LEFT JOIN users u ON u.id = e.updated_by WHERE e.id = ?', [$entryId]);
        if (!$entry) {
            ApiResponse::error('Entry not found', 404);
            exit;
        }
        ApiResponse::success($entry);
        break;

    case 'entries.create':
        if (!AuthMiddleware::hasPermission('entries.create')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $data = [
            'project_id' => (int) ($input['project_id'] ?? 0),
            'site_id' => !empty($input['site_id']) ? (int) $input['site_id'] : null,
            'entry_date' => $input['date'] ?? $input['entry_date'] ?? date('Y-m-d'),
            'status' => $input['status'] ?? 'ONGOING',
            'accomplishment_percent' => (float) ($input['accomplishment_percent'] ?? 0),
            'deliverables' => $input['deliverables'] ?? null,
            'remarks' => $input['remarks'] ?? null,
            'attachments' => !empty($input['attachments']) ? json_encode($input['attachments']) : null,
            'updated_by' => AuthMiddleware::getCurrentUser()['id'],
        ];
        if (!$data['project_id']) {
            ApiResponse::error('Project ID required', 400);
            exit;
        }
        $newId = $db->insert('dict_project_entries', $data);
        ApiResponse::success(['id' => $newId], 'Entry created', 201);
        break;

    case 'entries.update':
        if (!AuthMiddleware::hasPermission('entries.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $entryId = $id ?? $_GET['id'] ?? null;
        if (!$entryId) {
            ApiResponse::error('Entry ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['status', 'accomplishment_percent', 'deliverables', 'remarks', 'attachments'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) {
                $fields[$f] = ($f === 'attachments' && is_array($input[$f])) ? json_encode($input[$f]) : $input[$f];
            }
        }
        $fields['updated_by'] = AuthMiddleware::getCurrentUser()['id'];
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $db->update('dict_project_entries', $fields, 'id = ?', [$entryId]);
        ApiResponse::success(null, 'Entry updated');
        break;

    case 'entries.delete':
        if (!AuthMiddleware::hasPermission('entries.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $entryId = $id ?? $_GET['id'] ?? null;
        if (!$entryId) {
            ApiResponse::error('Entry ID required', 400);
            exit;
        }
        $db->delete('dict_project_entries', 'id = ?', [$entryId]);
        ApiResponse::success(null, 'Entry deleted');
        break;

    default:
        ApiResponse::error('Unknown entries action', 404);
}
