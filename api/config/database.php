<?php
/**
 * DICT MRIS — Database Configuration
 * Update these values for your WAMP MySQL setup
 */

$envPath = __DIR__ . '/env.php';
if (file_exists($envPath)) {
    require_once $envPath;
    if (!getenv('DB_HOST')) loadEnv();
}

return [
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => (int)env('DB_PORT', '3306'),
    'database' => env('DB_NAME', 'dict_mris'),
    'username' => env('DB_USER', 'root'),
    'password' => env('DB_PASS', ''),
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
