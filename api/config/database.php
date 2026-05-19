<?php
/**
 * DICT MRIS — Database Configuration
 * Update these values for your WAMP MySQL setup
 */

return [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'dict_mris',
    'username' => 'root',
    'password' => '',          // Default WAMP root password is empty
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
