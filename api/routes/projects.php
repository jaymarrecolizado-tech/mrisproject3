<?php
/**
 * Projects Routes: list, get, create, update, delete, stats
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../helpers/AuditHelper.php';

AuthMiddleware::authenticate();
$db = Database::getInstance();

switch ($action) {

    case 'projects.list':
        $projects = $db->fetchAll(
            'SELECT p.*,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id) as total_sites,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id AND s.status = "UP") as active_sites,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id AND s.status = "DOWN") as down_sites
             FROM projects p
             WHERE p.is_active = 1
             ORDER BY p.code'
        );
        ApiResponse::success($projects);
        break;

    case 'projects.get':
        $projectId = $id ?? $_GET['id'] ?? null;
        if (!$projectId) {
            ApiResponse::error('Project ID required', 400);
            exit;
        }
        $project = $db->fetchOne('SELECT * FROM projects WHERE id = ?', [$projectId]);
        if (!$project) {
            ApiResponse::error('Project not found', 404);
            exit;
        }
        ApiResponse::success($project);
        break;

    case 'projects.create':
        if (!AuthMiddleware::hasPermission('projects.manage')) {
            ApiResponse::error('Forbidden: insufficient permissions', 403);
            exit;
        }
        $data = [
            'code' => $input['code'] ?? '',
            'name' => $input['name'] ?? '',
            'full_name' => $input['full_name'] ?? '',
            'color' => $input['color'] ?? '#3B82F6',
            'icon' => $input['icon'] ?? 'folder',
            'description' => $input['description'] ?? '',
            'type' => $input['type'] ?? 'milestone',
        ];
        if (!$data['code'] || !$data['name']) {
            ApiResponse::error('Code and name are required', 400);
            exit;
        }
        $newId = $db->insert('projects', $data);
        $db->insert('audit_logs', [
            'user_id' => AuthMiddleware::getCurrentUser()['id'],
            'action' => 'project.create',
            'entity_type' => 'project',
            'entity_id' => $newId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ]);
        ApiResponse::success(['id' => $newId], 'Project created', 201);
        break;

    case 'projects.update':
        if (!AuthMiddleware::hasPermission('projects.edit')) {
            ApiResponse::error('Forbidden: insufficient permissions', 403);
            exit;
        }
        $projectId = $id ?? $_GET['id'] ?? null;
        if (!$projectId) {
            ApiResponse::error('Project ID required', 400);
            exit;
        }
        $fields = [];
        $allowed = ['code', 'name', 'full_name', 'color', 'icon', 'description', 'type', 'is_active'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) $fields[$f] = $input[$f];
        }
        if (empty($fields)) {
            ApiResponse::error('No fields to update', 400);
            exit;
        }
        $oldRow = $db->fetchOne('SELECT * FROM projects WHERE id = ?', [$projectId]);
        $db->update('projects', $fields, 'id = ?', [$projectId]);
        [$oldValues, $newValues] = AuditHelper::diff($oldRow, $fields);
        AuditHelper::log($db, 'project.update', 'project', $projectId, $oldValues, $newValues);
        ApiResponse::success(null, 'Project updated');
        break;

    case 'projects.delete':
        if (!AuthMiddleware::hasPermission('projects.manage')) {
            ApiResponse::error('Forbidden: insufficient permissions', 403);
            exit;
        }
        $projectId = $id ?? $_GET['id'] ?? null;
        if (!$projectId) {
            ApiResponse::error('Project ID required', 400);
            exit;
        }
        $db->update('projects', ['is_active' => 0], 'id = ?', [$projectId]);
        ApiResponse::success(null, 'Project deactivated');
        break;

    case 'projects.stats':
        $stats = $db->fetchAll(
            'SELECT p.id, p.code, p.name, p.color, p.type,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id) as total_sites,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id AND s.status = "UP") as up_sites,
                    (SELECT COUNT(*) FROM sites s WHERE s.project_id = p.id AND s.status = "DOWN") as down_sites,
                    COALESCE(ROUND((SELECT AVG(accomplishment_percent) FROM dict_project_entries e WHERE e.project_id = p.id), 2), 0) as completion_rate
             FROM projects p
             WHERE p.is_active = 1
             GROUP BY p.id'
        );
        ApiResponse::success($stats);
        break;

    default:
        ApiResponse::error('Unknown projects action', 404);
}
