<?php

require_once __DIR__ . '/../middleware/Auth.php';

class AuditHelper
{
    public static function log(Database $db, string $action, string $entityType, ?int $entityId = null, ?array $oldValues = null, ?array $newValues = null): void
    {
        $user = AuthMiddleware::getCurrentUser();
        $db->insert('audit_logs', [
            'user_id'     => $user['id'] ?? null,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'old_values'  => $oldValues !== null ? json_encode($oldValues) : null,
            'new_values'  => $newValues !== null ? json_encode($newValues) : null,
            'ip_address'  => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent'  => $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    }

    public static function diff(array $oldRow, array $newData): array
    {
        $old = [];
        $new = [];
        foreach ($newData as $key => $val) {
            $old[$key] = $oldRow[$key] ?? null;
            $new[$key] = $val;
        }
        return [$old, $new];
    }
}
