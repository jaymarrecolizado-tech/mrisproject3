<?php
/**
 * DICT MRIS — Automated Report Generator
 *
 * Run via cron / Task Scheduler:
 *   Linux:    0 6 * * * php /path/to/api/cron/generate_reports.php
 *   Windows:  Task Scheduler → php.exe C:\wamp64\www\Projects\projecttracking3\api\cron\generate_reports.php
 */

// Bootstrap
require_once __DIR__ . '/../config/env.php';
loadEnv();
require_once __DIR__ . '/../core/Database.php';

$db = Database::getInstance();
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

$generated = [];

// === DAILY: Always run ===
try {
    $db->insert('generated_reports', [
        'report_type'  => 'daily_status',
        'title'        => 'Daily Status Report — ' . $today,
        'format'       => 'CSV',
        'date_from'    => $yesterday,
        'date_to'      => $today,
        'generated_by' => null,
    ]);
    $generated[] = 'daily_status';
} catch (Exception $e) {
    error_log("[cron] Failed to generate daily_status: " . $e->getMessage());
}

// === WEEKLY: Mondays only ===
if (date('N') === '1') {
    try {
        $weekStart = date('Y-m-d', strtotime('-7 days'));
        $db->insert('generated_reports', [
            'report_type'  => 'weekly_summary',
            'title'        => 'Weekly Summary — week ending ' . $today,
            'format'       => 'CSV',
            'date_from'    => $weekStart,
            'date_to'      => $today,
            'generated_by' => null,
        ]);
        $generated[] = 'weekly_summary';
    } catch (Exception $e) {
        error_log("[cron] Failed to generate weekly_summary: " . $e->getMessage());
    }
}

// === MONTHLY: 1st of month only ===
if (date('j') === '1') {
    try {
        $monthStart = date('Y-m-01', strtotime('first day of last month'));
        $monthEnd = date('Y-m-t', strtotime('last day of last month'));
        $db->insert('generated_reports', [
            'report_type'  => 'monthly_accomplishment',
            'title'        => 'Monthly Accomplishment — ' . date('F Y', strtotime('last month')),
            'format'       => 'CSV',
            'date_from'    => $monthStart,
            'date_to'      => $monthEnd,
            'generated_by' => null,
        ]);
        $generated[] = 'monthly_accomplishment';
    } catch (Exception $e) {
        error_log("[cron] Failed to generate monthly_accomplishment: " . $e->getMessage());
    }

    try {
        $db->insert('generated_reports', [
            'report_type'  => 'project_completion',
            'title'        => 'Project Completion Report — ' . date('F Y', strtotime('last month')),
            'format'       => 'CSV',
            'date_from'    => $monthStart,
            'date_to'      => $monthEnd,
            'generated_by' => null,
        ]);
        $generated[] = 'project_completion';
    } catch (Exception $e) {
        error_log("[cron] Failed to generate project_completion: " . $e->getMessage());
    }
}

// Output summary
echo "[" . date('Y-m-d H:i:s') . "] Generated: " . implode(', ', $generated) . "\n";
if (empty($generated)) {
    echo "No reports generated.\n";
}
