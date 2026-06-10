<?php

require_once __DIR__ . '/../middleware/Auth.php';

class AuditHelper
{
    /**
     * Log an audit event with tamper-evident hash chaining.
     * Each log entry includes a hash of its contents + the previous entry's hash.
     */
    public static function log(Database $db, string $action, string $entityType, ?int $entityId = null, ?array $oldValues = null, ?array $newValues = null): void
    {
        $user = AuthMiddleware::getCurrentUser();

        try {
            // Get the previous log's hash_chain for chaining
            $prevLog = $db->fetchOne(
                'SELECT hash_chain FROM audit_logs ORDER BY id DESC LIMIT 1'
            );
            $prevHash = $prevLog['hash_chain'] ?? '0';

            // Build the payload for this log entry
            $payload = [
                'user_id'     => $user['id'] ?? null,
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'old_values'  => $oldValues,
                'new_values'  => $newValues,
                'ip_address'  => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent'  => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'created_at'  => date('Y-m-d H:i:s'),
            ];

            // Compute hash_chain = SHA256(json(payload) + prev_hash)
            $hashInput = json_encode($payload, JSON_UNESCAPED_UNICODE) . $prevHash;
            $hashChain = hash('sha256', $hashInput);

            // Insert with hash_chain
            $db->insert('audit_logs', [
                'user_id'     => $user['id'] ?? null,
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'old_values'  => $oldValues !== null ? json_encode($oldValues, JSON_UNESCAPED_UNICODE) : null,
                'new_values'  => $newValues !== null ? json_encode($newValues, JSON_UNESCAPED_UNICODE) : null,
                'ip_address'  => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent'  => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'hash_chain'  => $hashChain,
            ]);
        } catch (\Throwable $e) {
            error_log("[audit] Failed to log action={$action} entity={$entityType}#{$entityId}: " . $e->getMessage());
        }
    }

    /**
     * Verify audit log integrity by recomputing hash chain.
     * Returns array: ['valid' => bool, 'first_invalid_id' => int|null, 'details' => string]
     */
    public static function verifyIntegrity(Database $db, int $fromId = 1): array
    {
        $logs = $db->fetchAll(
            'SELECT id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, hash_chain, created_at
             FROM audit_logs WHERE id >= ? ORDER BY id ASC',
            [$fromId]
        );

        $prevHash = '0';
        foreach ($logs as $log) {
            $payload = [
                'user_id'     => $log['user_id'],
                'action'      => $log['action'],
                'entity_type' => $log['entity_type'],
                'entity_id'   => $log['entity_id'],
                'old_values'  => $log['old_values'] ? json_decode($log['old_values'], true) : null,
                'new_values'  => $log['new_values'] ? json_decode($log['new_values'], true) : null,
                'ip_address'  => $log['ip_address'],
                'user_agent'  => $log['user_agent'],
                'created_at'  => $log['created_at'],
            ];

            $hashInput = json_encode($payload, JSON_UNESCAPED_UNICODE) . $prevHash;
            $expectedHash = hash('sha256', $hashInput);

            if (!hash_equals($expectedHash, $log['hash_chain'])) {
                return [
                    'valid' => false,
                    'first_invalid_id' => (int)$log['id'],
                    'details' => "Hash mismatch at id {$log['id']}: expected {$expectedHash}, got {$log['hash_chain']}",
                ];
            }

            $prevHash = $log['hash_chain'];
        }

        return ['valid' => true, 'first_invalid_id' => null, 'details' => 'All hashes verified'];
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