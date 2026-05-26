<?php
/**
 * DICT MRIS — Environment Variable Loader
 * Loads .env file from the api/ directory (not git-tracked)
 */

function loadEnv(): void {
    $envFile = __DIR__ . '/../.env';
    if (!file_exists($envFile)) {
        error_log('[env.php] .env file not found at ' . $envFile);
        return;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;

        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;

        $key = trim($parts[0]);
        $value = trim($parts[1]);

        // Strip surrounding quotes if present
        if ((str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

/**
 * Get an environment variable with optional default
 */
function env(string $key, mixed $default = null): mixed {
    $value = getenv($key);
    if ($value === false || $value === '') return $default;

    // Normalize boolean-like strings
    return match (strtolower($value)) {
        'true', '(true)' => true,
        'false', '(false)' => false,
        'null', '(null)' => null,
        default => $value,
    };
}
