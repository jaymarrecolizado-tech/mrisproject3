<?php
/**
 * DICT MRIS — Simple file-based rate limiter
 */

class RateLimiter
{
    private static string $dir;

    public static function init(): void
    {
        self::$dir = __DIR__ . '/../uploads/rate_limit/';
        if (!is_dir(self::$dir)) {
            mkdir(self::$dir, 0755, true);
        }
    }

    public static function check(string $identifier, int $maxAttempts = 5, int $windowSeconds = 900): bool
    {
        self::init();
        $key = md5($identifier);
        $file = self::$dir . $key . '.json';

        $now = time();
        $data = ['count' => 0, 'window_start' => $now];

        if (file_exists($file)) {
            $content = file_get_contents($file);
            if ($content !== false) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
            if ($now - ($data['window_start'] ?? 0) > $windowSeconds) {
                $data = ['count' => 0, 'window_start' => $now];
            }
        }

        if (($data['count'] ?? 0) >= $maxAttempts) {
            return false;
        }

        $data['count'] = ($data['count'] ?? 0) + 1;
        file_put_contents($file, json_encode($data), LOCK_EX);
        return true;
    }

    public static function reset(string $identifier): void
    {
        self::init();
        $file = self::$dir . md5($identifier) . '.json';
        if (file_exists($file)) {
            unlink($file);
        }
    }
}
