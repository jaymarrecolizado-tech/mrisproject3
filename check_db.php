<?php
require 'api/core/Database.php';

try {
    $db = Database::getInstance();
    
    // Check permission slugs
    $permissions = $db->fetchAll('SELECT slug, group_name FROM permissions');
    echo "Total permissions: " . count($permissions) . "\n";
    foreach ($permissions as $p) {
        if ($p['slug'] === 'dashboard.view') {
            echo "Found dashboard.view!\n";
        }
    }
    
    // Check role permissions count
    $roles = $db->fetchAll('SELECT id, slug, name FROM roles');
    foreach ($roles as $r) {
        $count = $db->fetchColumn('SELECT COUNT(*) FROM role_permissions WHERE role_id = ?', [$r['id']]);
        echo "Role: {$r['name']} (ID: {$r['id']}) has $count permissions.\n";
        
        $perms = $db->fetchAll(
            'SELECT p.slug FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?',
            [$r['id']]
        );
        echo "  Perms: " . implode(', ', array_column($perms, 'slug')) . "\n\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
