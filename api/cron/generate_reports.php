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

// === Emit report files ===
$reportsDir = __DIR__ . '/../../storage/reports/';
if (!is_dir($reportsDir)) {
    mkdir($reportsDir, 0755, true);
}

foreach ($generated as $type) {
    $filepath = emitReportFile($db, $type, $reportsDir);
    if ($filepath) {
        $relative = 'storage/reports/' . basename($filepath);
        $db->update('generated_reports', ['file_path' => $relative], 'report_type = ?', [$type]);
        echo "  -> {$type}: {$relative}\n";
    }
}

function emitReportFile($db, string $type, string $dir): ?string {
    $date = date('Y-m-d');
    $filename = "{$type}_{$date}_" . bin2hex(random_bytes(3)) . '.csv';
    $filepath = $dir . $filename;

    $rows = match ($type) {
        'daily_status' => fetchDailyStatus($db),
        'weekly_summary' => fetchWeeklySummary($db),
        'monthly_accomplishment' => fetchMonthlyAccomplishment($db),
        'project_completion' => fetchProjectCompletion($db),
        default => [],
    };

    $fp = fopen($filepath, 'w');
    if (!$fp) return null;

    if (!empty($rows)) {
        fputcsv($fp, array_keys($rows[0]));
        foreach ($rows as $row) {
            fputcsv($fp, $row);
        }
    }

    fclose($fp);
    return $filepath;
}

function fetchDailyStatus($db): array {
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    return $db->fetchAll(
        "SELECT s.id, s.name, s.status, s.progress_percent, s.location,
                COUNT(DISTINCT a.id) as activities_today,
                COUNT(DISTINCT CASE WHEN a.created_at >= ? THEN 1 END) as activities_count
         FROM projects s
         LEFT JOIN activities a ON a.project_id = s.id AND DATE(a.created_at) = ?
         GROUP BY s.id
         ORDER BY s.name",
        [$yesterday, $yesterday]
    );
}

function fetchWeeklySummary($db): array {
    $weekStart = date('Y-m-d', strtotime('-7 days'));
    return $db->fetchAll(
        "SELECT s.id, s.name, s.status, s.progress_percent,
                COUNT(DISTINCT a.id) as week_activities,
                COUNT(DISTINCT u.id) as active_users
         FROM projects s
         LEFT JOIN activities a ON a.project_id = s.id AND a.created_at >= ?
         LEFT JOIN users u ON u.department = s.department AND u.is_active = 1
         GROUP BY s.id
         ORDER BY s.name",
        [$weekStart]
    );
}

function fetchMonthlyAccomplishment($db): array {
    $monthStart = date('Y-m-01', strtotime('first day of last month'));
    $monthEnd = date('Y-m-t', strtotime('last day of last month'));
    return $db->fetchAll(
        "SELECT s.id, s.name, s.status, s.progress_percent,
                COUNT(DISTINCT a.id) as month_activities,
                SUM(CASE WHEN a.created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as activities_in_month
         FROM projects s
         LEFT JOIN activities a ON a.project_id = s.id
         GROUP BY s.id
         ORDER BY s.name"
    );
}

function fetchProjectCompletion($db): array {
    $monthStart = date('Y-m-01', strtotime('first day of last month'));
    $monthEnd = date('Y-m-t', strtotime('last day of last month'));
    return $db->fetchAll(
        "SELECT s.id, s.name, s.progress_percent,
                s.is_complete,
                MAX(a.created_at) as last_activity_date,
                GROUP_CONCAT(DISTINCT u.name SEPARATOR '; ') as team_members
         FROM projects s
         LEFT JOIN activities a ON a.project_id = s.id
         LEFT JOIN users u ON u.department = s.department
         GROUP BY s.id
         ORDER BY s.progress_percent DESC"
    );
}
