<?php
/**
 * Milestones Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../helpers/AuditHelper.php';

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'milestones.list':
        $projectId = $_GET['project_id'] ?? null;
        if (!$projectId) {
            $milestones = $db->fetchAll(
                'SELECT m.*, s.site_code, s.location_name, p.code as project_code, p.name as project_name
                 FROM milestones m
                 LEFT JOIN sites s ON s.id = m.site_id
                 JOIN projects p ON p.id = m.project_id
                 ORDER BY m.target_date ASC'
            );
        } else {
            $milestones = $db->fetchAll(
                'SELECT m.*, s.site_code, s.location_name
                 FROM milestones m
                 LEFT JOIN sites s ON s.id = m.site_id
                 WHERE m.project_id = ?
                 ORDER BY m.target_date ASC',
                [$projectId]
            );
        }
        ApiResponse::success($milestones);
        break;

    case 'milestones.get':
        $msId = $id ?? $_GET['id'] ?? null;
        if (!$msId) {
            ApiResponse::error('Milestone ID required', 400);
            exit;
        }
        $ms = $db->fetchOne('SELECT m.*, s.site_code, s.location_name FROM milestones m LEFT JOIN sites s ON s.id = m.site_id WHERE m.id = ?', [$msId]);
        if (!$ms) {
            ApiResponse::error('Milestone not found', 404);
            exit;
        }
        ApiResponse::success($ms);
        break;

    case 'milestones.create':
        if (!AuthMiddleware::hasPermission('milestones.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $data = [
            'project_id' => (int) ($input['project_id'] ?? 0),
            'site_id' => !empty($input['site_id']) ? (int) $input['site_id'] : null,
            'title' => $input['title'] ?? '',
            'target_date' => !empty($input['target_date']) ? $input['target_date'] : null,
            'actual_date' => !empty($input['actual_date']) ? $input['actual_date'] : null,
            'status' => $input['status'] ?? 'PENDING',
            'description' => !empty($input['description']) ? $input['description'] : null,
        ];
        if (!$data['project_id'] || !$data['title']) {
            ApiResponse::error('Project ID and title required', 400);
            exit;
        }
        // Validate the project (accept numeric id or code); an unknown project would
        // otherwise trip a SQL FK error (HTTP 500). Mirrors sites.create.
        if (!is_numeric($data['project_id'])) {
            $resolved = $db->fetchColumn('SELECT id FROM projects WHERE LOWER(code) = ?', [strtolower((string)$data['project_id'])]);
            $data['project_id'] = $resolved ?: 0;
        }
        if (!$db->fetchOne('SELECT id FROM projects WHERE id = ?', [(int)$data['project_id']])) {
            ApiResponse::error('Unknown project_id: ' . $input['project_id'], 400);
            exit;
        }
        $data['project_id'] = (int)$data['project_id'];
        $newId = $db->insert('milestones', $data);
        ApiResponse::success(['id' => $newId], 'Milestone created', 201);
        break;

    case 'milestones.update':
        if (!AuthMiddleware::hasPermission('milestones.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $msId = $id ?? $_GET['id'] ?? null;
        if (!$msId) {
            ApiResponse::error('Milestone ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['title', 'target_date', 'actual_date', 'status', 'description', 'site_id'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) {
                $val = $input[$f];
                if (in_array($f, ['target_date', 'actual_date', 'description', 'site_id'], true) && $val === '') {
                    $val = null;
                }
                if ($f === 'site_id' && $val !== null) {
                    $val = (int)$val;
                }
                $fields[$f] = $val;
            }
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $oldRow = $db->fetchOne('SELECT * FROM milestones WHERE id = ?', [$msId]);
        $db->update('milestones', $fields, 'id = ?', [$msId]);
        [$oldValues, $newValues] = AuditHelper::diff($oldRow, $fields);
        AuditHelper::log($db, 'milestone.update', 'milestone', $msId, $oldValues, $newValues);

        // --- FEAT-6: Auto-generate notifications on milestone status changes ---
        try {
            if (isset($fields['status']) && in_array($fields['status'], ['COMPLETED', 'DELAYED'], true)) {
                $ms = $db->fetchOne(
                    'SELECT m.title, p.name as project_name
                     FROM milestones m
                     JOIN projects p ON p.id = m.project_id
                     WHERE m.id = ?',
                    [$msId]
                );
                if ($ms) {
                    if ($fields['status'] === 'COMPLETED') {
                        $db->insert('notifications', [
                            'user_id'  => null,
                            'title'    => 'Milestone Completed',
                            'message'  => $ms['title'] . ' milestone has been completed for ' . $ms['project_name'] . '.',
                            'type'     => 'success',
                            'is_read'  => 0,
                        ]);
                    } elseif ($fields['status'] === 'DELAYED') {
                        $db->insert('notifications', [
                            'user_id'  => null,
                            'title'    => 'Milestone Delayed',
                            'message'  => $ms['title'] . ' has been marked as delayed.',
                            'type'     => 'warning',
                            'is_read'  => 0,
                        ]);
                    }
                }
            }
        } catch (Exception $notifEx) {
            // Notification failure must not affect the primary milestone response
            error_log('Notification insert failed (milestones.update): ' . $notifEx->getMessage());
        }
        // --- END FEAT-6 ---

        ApiResponse::success(null, 'Milestone updated');
        break;

    case 'milestones.delete':
        if (!AuthMiddleware::hasPermission('milestones.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }
        $msId = $id ?? $_GET['id'] ?? null;
        if (!$msId) {
            ApiResponse::error('Milestone ID required', 400);
            exit;
        }
        if (!$db->fetchOne('SELECT id FROM milestones WHERE id = ?', [$msId])) {
            ApiResponse::error('Milestone not found', 404);
            exit;
        }
        $db->delete('milestones', 'id = ?', [$msId]);
        ApiResponse::success(null, 'Milestone deleted');
        break;

    default:
        ApiResponse::error('Unknown milestones action', 404);
}
