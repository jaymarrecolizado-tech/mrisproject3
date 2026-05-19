<?php
/**
 * Milestones Routes
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

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
            'target_date' => $input['target_date'] ?? null,
            'actual_date' => !empty($input['actual_date']) ? $input['actual_date'] : null,
            'status' => $input['status'] ?? 'PENDING',
            'description' => $input['description'] ?? null,
        ];
        if (!$data['project_id'] || !$data['title']) {
            ApiResponse::error('Project ID and title required', 400);
            exit;
        }
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
            if (isset($input[$f])) $fields[$f] = $input[$f];
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $db->update('milestones', $fields, 'id = ?', [$msId]);
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
        $db->delete('milestones', 'id = ?', [$msId]);
        ApiResponse::success(null, 'Milestone deleted');
        break;

    default:
        ApiResponse::error('Unknown milestones action', 404);
}
