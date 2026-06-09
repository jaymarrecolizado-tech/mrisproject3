<?php
/**
 * PHPUnit Bootstrap for API Tests
 */

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment for testing
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Ensure test database exists
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%d', $_ENV['DB_HOST'], $_ENV['DB_PORT']),
    $_ENV['DB_USER'],
    $_ENV['DB_PASS']
);
$pdo->exec("CREATE DATABASE IF NOT EXISTS `{$_ENV['DB_NAME']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

// Run schema migrations for test database
$sql = file_get_contents(__DIR__ . '/../database/schema.sql');
$pdo->exec("USE `{$_ENV['DB_NAME']}`");
$statements = array_filter(array_map('trim', explode(';', $sql)));
foreach ($statements as $stmt) {
    if (!empty($stmt)) {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            // Ignore errors for IF NOT EXISTS statements
            if (strpos($stmt, 'IF NOT EXISTS') === false) {
                throw $e;
            }
        }
    }
}

// Seed test data
$seedSql = file_get_contents(__DIR__ . '/../database/seed.sql');
$seedStatements = array_filter(array_map('trim', explode(';', $seedSql)));
foreach ($seedStatements as $stmt) {
    if (!empty($stmt)) {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            // Ignore duplicate entry errors for test seeding
            if ($e->getCode() !== '23000') {
                throw $e;
            }
        }
    }
}

// Make test database instance available globally
$_ENV['TEST_DB'] = $pdo;