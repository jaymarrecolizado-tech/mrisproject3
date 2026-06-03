<?php
/**
 * DICT MRIS — Simple JWT Implementation (no composer dependency)
 * Uses HS256 with a secret key from config
 */

class JWT {
    private static string $secret;
    private static int $expiry = 86400; // 24 hours

    public static function setSecret(string $secret): void {
        $normalized = strtolower(trim($secret));
        if ($normalized === '' || $normalized === 'dict-mris-jwt-secret-change-in-production-2026') {
            throw new \RuntimeException(
                'JWT_SECRET is not set or still using the default value. ' .
                'Set a strong, unique secret in the .env file.'
            );
        }
        self::$secret = $secret;
    }

    public static function setExpiry(int $seconds): void {
        self::$expiry = $seconds;
    }

    public static function encode(array $payload): array {
        if (empty(self::$secret)) {
            throw new \RuntimeException('JWT secret not configured');
        }
        $tokenVersion = $payload['token_version'] ?? 0;
        unset($payload['token_version']);
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$expiry;
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = self::base64UrlEncode(json_encode($payload));
        $signature = self::sign("{$header}.{$payload}");
        return ['token' => "{$header}.{$payload}.{$signature}", 'token_version' => $tokenVersion];
    }

    public static function decode(string $token): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $payload, $signature] = $parts;

        if (!self::verify("{$header}.{$payload}", $signature)) return false;

        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!$decoded) return false;
        if (isset($decoded['exp']) && $decoded['exp'] < time()) return false;

        return $decoded;
    }

    private static function sign(string $input): string {
        return self::base64UrlEncode(hash_hmac('sha256', $input, self::$secret, true));
    }

    private static function verify(string $input, string $signature): bool {
        $expected = self::sign($input);
        return hash_equals($expected, $signature);
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
