<?php
/**
 * Site Photos Routes: upload, list, delete
 * Hardened: server-side MIME detection, filename sanitization, malware scan placeholder
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

AuthMiddleware::authenticate();
$db = Database::getInstance();

$uploadDir = __DIR__ . '/../../uploads/site_photos/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Ensure .htaccess prevents script execution in upload dir
$htaccessPath = $uploadDir . '.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "SetHandler default-handler\nOptions -ExecCGI\n<FilesMatch \"\\.(php|phtml|php3|php4|php5|php7|phps|pl|py|cgi|sh)$\">\n    Require all denied\n</FilesMatch>\n");
}

switch ($action) {

    case 'photos.upload':
        if (!AuthMiddleware::hasPermission('sites.edit')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }

        $siteId = (int)($_POST['site_id'] ?? $_GET['site_id'] ?? 0);
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }

        if (empty($_FILES['file'])) {
            ApiResponse::error('No file uploaded', 400);
            exit;
        }

        $file = $_FILES['file'];

        // Server-side MIME detection using finfo (not client-provided $_FILES['type'])
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($detectedMime, $allowedMimes, true)) {
            ApiResponse::error('Only JPEG, PNG, WebP, and GIF images are allowed', 400);
            exit;
        }

        if ($file['size'] > 10 * 1024 * 1024) {
            ApiResponse::error('File must be under 10MB', 400);
            exit;
        }

        // Determine extension from MIME (not from user-provided filename)
        $extMap = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];
        $ext = $extMap[$detectedMime] ?? 'bin';

        // Sanitize original filename for display only (never use in path)
        $originalName = basename($file['name']);
        $originalName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
        $originalName = substr($originalName, 0, 255);

        // Generate secure random filename
        $filename = 'site_' . $siteId . '_' . bin2hex(random_bytes(16)) . '.' . $ext;
        $filepath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            ApiResponse::error('Failed to save file', 500);
            exit;
        }

        // TODO: Integrate ClamAV scan here (clamscan --stdout $filepath)
        // $scanResult = shell_exec('clamscan --stdout ' . escapeshellarg($filepath));
        // if (strpos($scanResult, 'FOUND') !== false) { unlink($filepath); ApiResponse::error('Malware detected', 400); exit; }

        $caption = $_POST['caption'] ?? '';

        $photoId = $db->insert('site_photos', [
            'site_id'      => $siteId,
            'file_path'    => 'uploads/site_photos/' . $filename,
            'file_name'    => $filename,
            'original_name' => $originalName,
            'file_size'    => $file['size'],
            'mime_type'    => $detectedMime,
            'caption'      => $caption,
            'uploaded_by'  => AuthMiddleware::getCurrentUser()['id'],
        ]);

        ApiResponse::success(['id' => $photoId, 'file_path' => 'uploads/site_photos/' . $filename], 'Photo uploaded', 201);
        break;

    case 'photos.list':
        $siteId = (int)($_GET['site_id'] ?? 0);
        if (!$siteId) {
            ApiResponse::error('Site ID required', 400);
            exit;
        }

        $photos = $db->fetchAll(
            'SELECT sp.*, u.name as uploaded_by_name
             FROM site_photos sp
             LEFT JOIN users u ON u.id = sp.uploaded_by
             WHERE sp.site_id = ?
             ORDER BY sp.created_at DESC',
            [$siteId]
        );
        ApiResponse::success($photos);
        break;

    case 'photos.delete':
        if (!AuthMiddleware::hasPermission('sites.manage')) {
            ApiResponse::error('Forbidden', 403);
            exit;
        }

        $photoId = $id ?? $_GET['id'] ?? null;
        if (!$photoId) {
            ApiResponse::error('Photo ID required', 400);
            exit;
        }

        $photo = $db->fetchOne('SELECT * FROM site_photos WHERE id = ?', [$photoId]);
        if (!$photo) {
            ApiResponse::error('Photo not found', 404);
            exit;
        }

        // Delete file from disk
        $fullPath = __DIR__ . '/../../' . $photo['file_path'];
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }

        $db->delete('site_photos', 'id = ?', [$photoId]);
        ApiResponse::success(null, 'Photo deleted');
        break;

    default:
        ApiResponse::error('Unknown photos action', 404);
}